window.onload = init;

let uuid;
let socket;
let recorder;
let localStream;
//let peerConnection;
let viewers = {};
let config = {
  'iceServers': [
    {'urls': 'stun:stun.l.google.com:19302'}
  ]
};

let video = document.getElementById('player');
const startButton = document.getElementById('btn-start');
const stopButton = document.getElementById('btn-stop');
const streamUrl = document.getElementById('url_placeholder');

startButton.onclick = start;
stopButton.onclick = stop;

setInterval(function(){
  checkConnectionStatus();
}, 2000);

function init(){
  createUUID();
  streamUrl.innerHTML = `http://127.0.0.1:3000/join?v=${uuid}`;
  connect();
}

function connect(){
  socket = new WebSocket('ws://localhost:3000/ws/stream/'+uuid);

  socket.onopen = function(){
    console.log('Signal Channel Connection: ACTIVE');
  };

  socket.onmessage = function(evt){
    console.log('RCVD: Sender: %s, Data: %s', JSON.parse(evt.data).message.user, evt.data.substr(0,100));
    let rcv = JSON.parse(evt.data);
    let msg_typ = rcv.message.type;

    if(msg_typ == 'answer'){
      viewers[rcv.message.user].setRemoteDescription(rcv.message.description);
    }
    else if(msg_typ == 'watcher'){
      const peerConnection = new RTCPeerConnection(config);

      viewers[rcv.message.user] = peerConnection;

      console.log('LocalStream: '+localStream);

      //peerConnection.addStream(localStream);
      localStream.getTracks()
      .forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.createOffer()
      .then((sdp) => {
        return peerConnection.setLocalDescription(sdp);
      })
      .then(() => {
        socket.send(JSON.stringify({ "uuid": rcv.message.user, "message": { "type": "offer", "description": peerConnection.localDescription } }));
      })
      .catch(errorHandler);

      peerConnection.onicecandidate = function(event) {
        if(event.candidate) {
          socket.send(JSON.stringify({ "uuid": rcv.message.user, "message": { "type": "candidate", "candidate": event.candidate }}));
        }
      }
    }
    else if(msg_typ == 'candidate'){
      viewers[rcv.message.user].addIceCandidate(new RTCIceCandidate(rcv.message.candidate))
      .catch(errorHandler);
    }
    else if(msg_typ == 'remove'){
      viewers[rcv.message.user] && viewers[rcv.message.user].close();
      delete viewers[rcv.message.user];
    }
  };

  socket.onerror = function(){
    console.log('Error in connection');
  };

  socket.onclose = function(){
    console.log('WS connection closed');
  };
}

function checkConnectionStatus(){
  if(socket.readyState == WebSocket.CLOSED){
    connect();
  }
}

function streamVideo(){
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(function(stream){
    // Display a live preview on the video element of the page
    //video.srcObject = URL.createObjectURL(stream);
    try {
      video.srcObject = stream;
      localStream = stream;
    } catch (error) {
      video.src = window.URL.createObjectURL(stream);
      localStream = stream;
    }

    // Start to display the preview on the video element
    // and mute the video to disable the echo issue !
    video.play();
    video.muted = true;

    recordingStart(stream); //Record stream

    // Enable stop recording button
    document.getElementById('btn-stop').disabled = false;

    socket.send(JSON.stringify({ "uuid": "ALL", "message": { "type": "broadcaster" } }));
  })
  .catch((err) => {
    console.log(`getUserMedia() error: ${err}`);
  });
}

function start(){
  this.disabled = true; // Disable start recording button
  streamVideo(); //Start live streaming
}

function stop(){
  this.disabled = true; // Disable stop recording button
  recordingStop(); //Stop stream recording
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

function generateFileName() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function xhr(url, data) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == 200) {
      console.log("Video succesfully uploaded !");
    }
  };

  request.open('POST', url);

  var formData = new FormData();
  formData.append('filename', `${generateFileName()}.webm`);
  formData.append('video', data);

  request.send(formData);
}

function recordingStart(){
  // Initialize the recorder
  recorder = new RecordRTCPromisesHandler(localStream, {
    mimeType: 'video/webm',
    bitsPerSecond: 128000
  });

  // Start recording the video
  recorder.startRecording()
  .then(function() {
    console.info('Recording video ...');
  }).catch(function(error) {
    console.error('Cannot start video recording: ', error);
  });

  // release stream on stopRecording
  recorder.stream = localStream;
}

function recordingStop(){
  recorder.stopRecording()
  .then(function() {
    console.info('stopRecording success');

    // Retrieve recorded video as blob and display in the preview element
    var blob = recorder.getBlob();
    var videoSrc = URL.createObjectURL(blob);
    console.log('SRC: '+videoSrc+' | Blob: '+blob);

    video.src = videoSrc;
    video.play();

    // Unmute video on preview
    video.muted = false;

    // Stop the device streaming
    recorder.stream.stop();

    /*var file = new File([blob], 'video.webm', {
      type: 'video/webm'
    });

    xhr('/service/upload', file);*/
    xhr('/service/upload', blob);

    // Enable record button again !
    document.getElementById('btn-start').disabled = false;
  }).catch(function(error) {
    console.error('stopRecording failure', error);
  });
}

function errorHandler(error) {
  console.log(error);
}



