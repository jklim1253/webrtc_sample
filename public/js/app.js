function pad(x, size, fill) {
  return ('' +x).padStart(size, fill)
}
const pad40 = function (x) {
  return pad(x, 4, '0')
}
const pad30 = function (x) {
  return pad(x, 3, '0')
}
const pad20 = function (x) {
  return pad(x, 2, '0')
}
function now() {
  const now = new Date()
  return `${pad40(now.getFullYear())}-${pad20(now.getMonth()+1)}-${pad20(now.getDate())}`
  + ` ${pad20(now.getHours())}:${pad20(now.getMinutes())}:${pad20(now.getSeconds())}:${pad30(now.getMilliseconds())}`
}
function debug(msg, opt) {
  if (arguments.length == 1)
    console.log(`[${now()}] ${msg}`)
  else
    console.log(`[${now()}] ${msg}`, opt)
}

const system = function() {
  let channels = new Map()

  let session = null
  let current_room = null

  let current_state = null

  let localStream = null 
  let remoteStream = null 

  let peer_local = null

  let candidate_local = new Set()
  let candidate_remote = new Set()

////////////////////////////////////////////////////////////
// common functions
////////////////////////////////////////////////////////////
  function getElement(id) {
    return document.getElementById(id)
  }
  function getText(id) {
    return getElement(id).value
  }
  function addElementHandler(id, ev, fn) {
    getElement(id).addEventListener(ev, fn)
  }
  function enableElement(id, enable = true) {
    getElement(id).disabled = !enable
  }
  function showElement(id, visible = true) {
    getElement(id).style.visibility = (visible? 'visible' : 'hidden')
    getElement(id).style.display = (visible? 'block': 'none')
  }
  function addElement(id, html) {
    getElement(id).innerHTML += html
  }
  function getChannel(nps) {
    if (!channels.has(nps)) {
      channels.set(nps, io(`/${nps}`))
    }
    return channels.get(nps)
  }
  function addSocketHandler(nps, ev, fn) {
    debug(`namespace(${nps}):event(${ev}) => ${fn.name}`)
    getChannel(nps).on(ev, fn)
  }
  function send(nps, ev, data, fnres) {
    debug(`<<<<send namespace(${nps}):event(${ev})`)
    debug(`    => `, data)
    debug(`    => ${fnres? 'response handler':'none'}`)
    getChannel(nps).emit(ev, data, fnres)
  }
  function _wrap(packet) {
    if (!packet.hasOwnProperty('username')) {
      packet.username = getText('username').trim()
    }
    if (!packet.hasOwnProperty('session')) {
      packet.session = session
    }
    if (current_state == 'login') {
      packet.namespace = 'login'
    }
    else if (current_state == 'lobby') {
      packet.namespace = 'lobby'
    }
    else if (current_state == 'room') {
      packet.namespace = 'room'
      packet.room = current_room
    }
    return packet
  }

////////////////////////////////////////////////////////////
// updateState
////////////////////////////////////////////////////////////
  function updateState(state) {
    debug(`****update state: ${current_state} => ${state}`)
    if (state == 'login') {
      enableElement('login')
      enableElement('create', false)
      
      showElement('loginbox')
      showElement('lobbybox', false)
      showElement('roombox', false)
    }
    else if (state == 'lobby') {
      enableElement('login', false)
      enableElement('create')
      
      showElement('loginbox', false)
      showElement('lobbybox')
      showElement('roombox', false)
    }
    else if (state == 'room') {
      enableElement('login', false)
      enableElement('create', false)
      
      showElement('loginbox', false)
      showElement('lobbybox', false)
      showElement('roombox')
    }
    getElement('current_state').innerHTML = state
    current_state = state
  }
////////////////////////////////////////////////////////////
// boot
////////////////////////////////////////////////////////////
  function _boot() {
    debug(`booting...`)

    addSocketHandler('', 'message', _on_message)
    addSocketHandler('', 'test', _on_message)
    addSocketHandler('lobby', 'message', _on_lobby_message)
    addSocketHandler('lobby', 'roomlist', _on_roomlist)

    _prepare();

    updateState('login')

    debug(`boot completed`)
  }
  function _on_message(data) {
    debug(`message from server: ${data}`)
  }
  function _on_lobby_message(data) {
    debug(`message from lobby: ${data.message}`)
  }
  function _prepare() {
    debug(`register element event handlers`)
    addElementHandler('login', 'click', _login)
    addElementHandler('create', 'click', _create)
  }
////////////////////////////////////////////////////////////
// login
////////////////////////////////////////////////////////////
  async function _login(e) {
    debug(`****login`)

    // validation of input
    const username = getText('username').trim()
    if (username.length == 0) {
      debug(`    username is empty`)
      return
    }

    // login response
    function _login_response_handler(res) {
      debug(`>>>>login response`)
      debug(`    => `, res)
      if (res.result != 'success') {
        debug(`    failed`)
        return
      }

      session = res.session

      updateState('lobby')

      send('lobby', 'req', _wrap({
        type: 'message',
        message: 'hello everyone'
      }))
      send('lobby', 'req', _wrap({
        type: 'roomlist'
      }), _roomlist_response_handler)
    }

    // send login request
    send('', 'req', _wrap({
      type: 'login'
    }), _login_response_handler)
  }
  function _roomlist_response_handler(res) {
    debug(`>>>>roomlist response`)
    debug(`    => `, res)
    if (res.result != 'success') {
      debug(`    failed`)
      return
    }

    addRoomList('roomlist', res.roomlist)
  }
  function _on_roomlist(data) {
    debug(`>>>>roomlist event`)
    debug(`    => `, data)

    addRoomList('roomlist', data.roomlist)
  }
  function addRoomList(id, array) {
    getElement(id).innerHTML = ''
    array.forEach(room => {
      let item = `<button class="room" id="room_${room}">${room}</button><br/>`
      addElement(id, item)
      addElementHandler(`room_${room}`, 'click', _join.bind(null, room))
    })
  }
  function _create(e) {
    debug(`****create`)

    send('lobby', 'req', _wrap({
      type: 'create',
      roomname: getText('roomname')
    }))
  }
  async function _join(room, e) {
    debug(`****join ${room}`)

    current_room = room

    updateState('room')

    const configuration = {
      'iceServers': [
        {
          'urls': 'stun:stun.l.google.com:19302'
        }
      ]
    }

    if (!localStream) {
      await _open_media()
    }

    debug(`    create RTCPeerConnection`)
    peer_local = new RTCPeerConnection(configuration)

    _peerEventListener();

    if (localStream) {
      localStream.getTracks().forEach(track => {
        debug(`    addTrack: `, track)
        peer_local.addTrack(track, localStream)
      })
    }

    addSocketHandler(room, 'answer', async function(data) {
      debug(`>>>>answer from remote`, data)
      await peer_local.setRemoteDescription(data.sdp)

    })
    addSocketHandler(room, 'offer', async function(data) {
      debug(`>>>>offer from remote`, data)
      await peer_local.setRemoteDescription(data.sdp)
      debug(`    setRemoteDescription: `, data.sdp)

      const answer = await peer_local.createAnswer()
      debug(`    createAnswer:`, answer)
      peer_local.setLocalDescription(answer)
      debug(`    setLocalDescription:`, answer)

      send(room, 'req', {
        type: 'answer',
        sdp: answer
      })
    })
    addSocketHandler(room, 'candidate', async function(data) {
      debug(`>>>>candidate from remote`, data)
      if (candidate_remote.has(data.candidate)) {
        debug(`    duplicate remote candidate, skip`)
        return
      }
      candidate_remote.add(data.candidate)
      peer_local.addIceCandidate(data.candidate)
    })

  }
  async function sendOffer() {
    debug(`****send offer`)

    debug(`    create Offer`)
    const offer = await peer_local.createOffer();
    debug(`    setLocalDescription with`, offer)
    await peer_local.setLocalDescription(offer);
    
    send(current_room, 'req', {
      type: 'offer',
      sdp: offer
    })
  }
  function _peerEventListener() {
    peer_local.addEventListener('connectionstatechange', function(e) {
      debug(`****connection state changed: `, e)
    })
    peer_local.addEventListener('datachannel', function(e) {
      debug(`****data channel: `, e)
    })
    peer_local.addEventListener('icecandidate', function(e) {
      debug(`****ice candidate: `, e.candidate)
      if (e.candidate) {
        if (candidate_local.has(e.candidate)) {
          debug(`    duplicate candidate, skip`)
          return
        }
        candidate_local.add(e.candidate)

        send(current_room, 'req', _wrap({
          type: 'candidate',
          candidate: e.candidate
        }))
      }
    })
    peer_local.addEventListener('iceconnectionstatechange', function(e) {
      debug(`****ice connection state changed: `, e)
    })
    peer_local.addEventListener('icegatheringstatechange', function(e) {
      debug(`****ice gathering state changed: ${e.target.iceGatheringState}`)
    })
    peer_local.addEventListener('negotiationneeded', async function(e) {
      debug(`****negotiation needed`)
      await sendOffer()
    })
    peer_local.addEventListener('signalingstatechange', function(e) {
      debug(`****signaling state changed: ${peer_local.signalingState}`)
    })
    peer_local.addEventListener('track', function(e) {
      debug(`****track: `, e)
      debug(`    streams: `, e.streams)
      getElement('remoteVideo').srcObject = e.streams[0]
    })
  }
  async function _open_media() {
    debug(`****open media`)
    const media_constraints = {
      video: true,
      audio: false
    }
    const stream = await navigator.mediaDevices.getUserMedia(media_constraints)
    .catch(e => {
      debug(`open media failed: ${e}`)
    })
    const localVideo = getElement('localVideo')
    localVideo.srcObject = stream;
    localStream = stream
  }
  return {
    boot: _boot,
  }
}()

system.boot()