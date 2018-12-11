window.onload = connect;

let uuid;
let sender;
let socket;
let peerConnection;
let config = {
  'iceServers': [
    {'urls': 'stun:stun.l.google.com:19302'}
  ]
};

let video = document.getElementById('player');

sender = (new URL(document.location)).searchParams.get('v');
console.log('Sender: '+sender);

if(sender !== undefined && sender !== null){
  setInterval(function(){
    checkConnectionStatus();
  }, 2000);
}
else{
  alert("The service you seek is unavailable");
}

function connect(){
  createUUID();

  socket = new WebSocket('ws://localhost:3000/ws/stream/'+uuid);

  socket.onopen = function(){
    console.log('Signal Channel Connection: ACTIVE');
    //socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "watcher", "user": uuid } }));
  };

  socket.onmessage = function(evt){
    console.log('RCVD: Sender: %s, Data: %s', sender, evt.data.substr(0,100));
    let rcv = JSON.parse(evt.data);
    let msg_typ = rcv.message.type;

    if(msg_typ == 'broadcaster'){
      socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "watcher", "user": uuid } }));
    }
    else if(msg_typ == 'candidate'){
      let candidate = rcv.message.candidate;

      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(errorHandler);
    }
    else if(msg_typ == 'offer'){
      gotMessageFromServer(evt.data);
    }
  };

  socket.onerror = function(){
    if(peerConnection !== undefined && peerConnection !== null){
      socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "remove", "user": uuid } }));
      peerConnection.close();
    }
  };

  socket.onclose = function(){
    if(peerConnection !== undefined && peerConnection !== null){
      socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "remove", "user": uuid } }));
      peerConnection.close();
    }
  };
}

function checkConnectionStatus(){
  if(socket.readyState == WebSocket.CLOSED){
    connect();
  }
}

function createUUID(){
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 9; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  console.log('uuid: '+text);

  uuid = text;
}

function gotMessageFromServer(message){
  let rcv = JSON.parse(message);
  let description = rcv.message.description;

  peerConnection = new RTCPeerConnection(config);

  peerConnection.setRemoteDescription(new RTCSessionDescription(description))
  .then(function() {
    peerConnection.createAnswer()
    .then(function(sdp){
       return peerConnection.setLocalDescription(sdp);
    })
    .then(function() {
      socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "answer", "description": peerConnection.localDescription, "user": uuid }}));
    })
    .catch(errorHandler);
  })
  .catch(errorHandler);

  peerConnection.ontrack = function(event){
    console.log('Evt: '+JSON.stringify(event));
    try {
      video.srcObject = event.streams[0];
    } catch (error) {
      video.src = window.URL.createObjectURL(event.streams[0]);
    }
    console.log('visitor received remote stream');
  }

  peerConnection.onicecandidate = function(event){
    if(event.candidate) {
      socket.send(JSON.stringify({ "uuid": sender, "message": { "type": "candidate", "candidate": event.candidate, "user": uuid } }));
    }
  };
}

function errorHandler(error) {
  console.log(error);
}