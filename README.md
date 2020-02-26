# WebRTC

## quick start

- 준비물
  - git
    - 프로젝트 소스 다운로드
    - 설치 확인방법
      ```cmd
      windows:> where git
      linux:> which git
      ```
  - nodejs
    - 웹서버 프레임워크 구동
    - 설치 확인방법
      ```cmd
      windows:> where node
      linux:> which node
      ```
  - openssl
    - [https](#https) 웹서버 구동에 필요한 유틸리티
    - 설치 확인방법
      ```cmd
      windows:> where openssl
      linux:> which openssl
      ```

- 바로 시작하기
  - 소스 내려받기
    ```cmd
    prompt:> git clone https://github.com/jklim1253/webrtc_sample.git
    ```
  - 소스 위치로 이동
    ```cmd
    prompt:> cd /path/to/webrtc_sample
    ```
  - nodejs 에 사용된 package 설치
    ```cmd
    prompt:> npm install
    ```
  - 내려받은 소스를 실행
    ```
    prompt:> node .
    ==================================
    settings: {"development":{"port":8080,"host":"0.0.0.0"},"production":{"port":80,"host":"127.0.0.1"}}
    mode: development
    server is listening on https://0.0.0.0:8080
    ==================================
    ```

## Server

- web server
  - client(Web Browser)에게 WebRTC 기능을 제공하는 webpage를 제공한다.
  - [https](#https)이 아니면 [navigator.mediaDevices](#navigatormediadevices) 항목이 *undefined* 된다.
- signaling server
  - peer-to-peer 연결이 되기까지에 필요한 정보([SDP](#SDP), [ICE Candidate](#ice-candidate) 등) 교환을 도와주는 역활
- STUN Server
- TURN Server

### Web Server

- **[express](https://www.npmjs.com/package/express)**: web server.
  - **[ejs](https://www.npmjs.com/package/ejs)**: 웹페이지 template.
- **[https](https://www.npmjs.com/package/https)**: secure http.
  - **[pem](https://www.npmjs.com/package/pem)**: certificate.

### Signaling Server

- **[socket.io](https://www.npmjs.com/package/socket.io)**: real-time bidirectional event-based communication.
- P2P 통신의 Peer를 찾는 과정.
- offer/answer 교환.
- ICE Candidate 교환.

### STUN Server

> **S**ession **T**raversal **U**tilities for **N**AT

client로 하여금 Public IP,Port를 찾도록 해준다.

- [RFC 3489](https://tools.ietf.org/html/rfc3489)
- Free Public STUN Server
  > stun:stun.l.google.com:19302

### TURN Server

> **T**raversal **U**sing **R**elays around **N**AT

- 방화벽에 의해 Public IP,Port 획득이 어려운 경우,
  media 데이터(RTP/RTCP packet)를 상대 Peer에게 전달해주는 media gateway 역활을 하는 서버.

- [RFC 5766](https://tools.ietf.org/html/rfc5766)

## Client

- WebRTC를 통해 주고 받을 미디어에 대한 정보를 획득하여 SDP를 생성.
- P2P Connectivity 에 필요한 ICE Candidate를 준비.

### Media

- getUserMedia

### P2P Connectivity

- RTCPeerConnection

## Terminology

### HTTPS

> **H**yper **T**ext **T**ransfer **P**rotocol **S**ecure

http 의 확장형, 웹을 통한 통신이 안전하도록 하기 위해 사용된다.
[TLS](#tls)를 이용해서 암호화된다.
그래서 HTTP over TLS 이라고 불리기도 한다.

<button onclick="history.go(-1)">뒤로</button>

### TLS

> **T**ransport **L**ayer **S**ecurity

### SDP

> **S**ession **D**escription **P**rotocol

스트림할 미디어의 종류, 코덱 정보 등을 담고 있는 메타 데이터

### navigator.mediaDevices

로컬 컴퓨터의 비디오, 오디오 장비에 대한 접근에 필요한 javascript 객체, 보안상의 문제로 http 에서는 더 이상 접근이 되지 않는다.
단편적으로 localhost(127.0.0.1)의 호스트일 경우에는 http에서의 접근이 허용된다.

### ICE Candidate

> **I**nteractive **C**onnectivity **E**stablishment

로컬 컴퓨터를 [P2P](#p2p) 통신이 가능하게 하는 Public한 IP 주소와 포트를 찾는 과정을 ICE라 표현하고,
발견된 여러 IP,Port Pair 후보 목록들을 ICE Candidate라고 부른다.

- [RFC 8445](https://tools.ietf.org/html/rfc8445)

### P2P

> **P**eer to **P**eer

## References

- [Real time communication with WebRTC](https://codelabs.developers.google.com/codelabs/webrtc-web/)
- [WebRTC.org](https://webrtc.org/)
- [Mozilla WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Getting Started with WebRTC](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
- [W3C WebRTC 1.0 TR](https://www.w3.org/TR/webrtc/)

