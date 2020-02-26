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
function debug(msg) {
  console.log(`[${now()}] ${msg}`)
}

const socketio = require('socket.io')

const User = function(_username, _session) {
  this.username = _username
  this.session = _session
}
const userlist = [];
const service = function(webserver) {
  const sio = socketio(webserver)

  let channels = new Map()

  let rooms = new Map()

  function getChannel(nps) {
    if (!channels.has(nps)) {
      channels.set(nps, sio.of(`/${nps}`))
    }

    return channels.get(nps)
  }
  function getRooms(rn) {
    if (!rooms.has(rn)) {
      rooms.set(rn, rn)
    }

    return rooms.get(rn)
  }

  function build(nps, ev, fn) {
    getChannel(nps).on(ev, fn)
  }

  function default_handlers(root) {
    debug(`****default namespace session: ${root.id}`)
    root.emit('message', 'welcome to webrtc service')
    
    root.on('req', function(req, cb) {
      debug(`>>>>default req type: ${req.type}`)
      if (req.type == 'login') {

        // TODO: login server task
        let res = req
        res.session = root.id
        res.result = 'success'

        // call client response handler
        cb(res)

        debug(`    default ${req.type} processed`)
        return
      }

      debug(`#### default unknown req type: ${req.type}`)
    })
  }
  function lobby_handlers(client) {
    debug(`****lobby namespace session: ${client.id}`)
    client.on('req', function(req, cb) {
      debug(`>>>>lobby req type: ${req.type}`)
      if (req.type == 'message') {

        // TODO: message server task
        let res = req 
        res.result = 'success'

        client.broadcast.emit('message', res)

        // no client response handler

        debug(`    lobby ${req.type} processed`)
        return
      }
      else if (req.type == 'roomlist') {

        // TODO: roomlist server task
        let res = req 
        res.result = 'success'
        res.roomlist = Array.from(rooms.keys())

        // call client response handler
        cb(res)

        debug(`    lobby ${req.type} processed`)
        return
      }
      else if (req.type == 'create') {

        // TODO: create server task
        build(req.roomname, 'connect', room_handlers.bind(null, req.roomname))
        getRooms(req.roomname)

        let res = req 
        res.result = 'success'
        res.roomlist = Array.from(rooms.keys())

        // no client response handler

        // broadcast roomlist to all
        getChannel('lobby').emit('roomlist', res)

        debug(`    lobby ${req.type} processed`)
        return
      }

      debug(`#### lobby unknown req type: ${req.type}`)
    })
  }
  function room_handlers(roomname, client) {
    debug(`****room namespace session: ${client.id}`)
    const current_room = roomname

    client.on('req', function(req, cb) {
      debug(`>>>>${current_room} req type: ${req.type}`)
      if (req.type == 'message') {

        // TODO: message server task
        let res = req 
        res.result = 'success'

        client.broadcast.emit('message', res)

        // no client response handler

        debug(`    ${current_room} ${req.type} processed`)
        return
      }
      else if (req.type == 'offer') {

        // TODO: offer server task
        let res = req
        res.result = 'success'

        client.broadcast.emit('offer', res)

        // no client response handler

        debug(`    ${current_room} ${req.type} processed`)
        return
      }
      else if (req.type == 'answer') {

        // TODO: answer server task
        let res = req 
        res.result = 'success'

        client.broadcast.emit('answer', res)

        // no client response handler

        debug(`    ${current_room} ${req.type} processed`)
        return
      }
      else if (req.type == 'candidate') {

        // TODO: candidate server task
        let res = req 
        res.result = 'success'

        client.broadcast.emit('candidate', res)

        // no client response handler

        debug(`    ${current_room} ${req.type} processed`)
        return
      }

      debug(`    ${current_room} unknown req type: ${req.type}`)
    })
  }

  build('', 'connect', default_handlers)
  build('lobby', 'connect', lobby_handlers)

  // sio.on('connection', function(client) {
  //   debug(`session is created: ${client.id}`)
  //   debug(`    path: ${sio.path()}`)

  //   client.emit('message', 'welcom to webrtc server')

  //   manager(client)
  // })
}

module.exports = service
