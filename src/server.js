#!/usr/bin/env node

import { app } from './app';
import http from 'http';
import url from 'url';
import WebSocket from 'ws';

let debug = require('debug')('rtcapp:server');

//Normalize a port into a number, string, or false
const normalizePort = (val) => {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

//Event listener for HTTP server "error" event
const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

//Event listener for HTTP server "listening" event
const onListening = () => {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('--> Server running');
}


//Get port from environment and store in Express.
let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

//Create HTTP server
var server = http.createServer(app);

//WebSocket Signaling Server configuration and methods

let clients = [];
//let ws_port = 3001;
let ws_path = '/ws/stream';

let addUser = (socket, req) => {
  let url_pth = url.parse(req.url).path;

  if(url_pth.startsWith(ws_path)){
    console.log('Authorized: '+url_pth);
    let uuid = url_pth.split(`${ws_path}/`)[1];
    console.log('uuid: '+uuid);
    clients.push({ "uuid": uuid, "socket": socket });
  }
};

let removeUser = (socket) => {
  for(let i in clients){
    if(clients[i].socket == socket){
      clients.splice(i, 1);
      break;
    }
  }
};

let sendMessage = (uuid, msg) => {
  for(let i in clients){
    if(clients[i].uuid == uuid){
      clients[i].socket.send(msg);
      break;
    }
  }
};

let broadcast = (socket, msg) => {
  for(let i in clients){
    if(clients[i].socket !== socket){
      clients[i].socket.send(msg);
    }
  }
};

let ws = new WebSocket.Server({ server });

ws.on('connection', (socket, req) => {
  console.log('Path: '+url.parse(req.url).path);
  addUser(socket, req);
  console.log('Signalling Service Online!');

  socket.on('message', (msg) => {
    // Broadcast any received message to all clients
    console.log('RCVD: Sender: %s, Data: %s', JSON.parse(msg).uuid, msg.substr(0,70));
    let incm = JSON.parse(msg);
    if(incm.uuid == 'ALL'){
      broadcast(socket, msg);
    }
    else{
      sendMessage(incm.uuid, msg);
    }
  });

  socket.on('close', () => {
    removeUser(socket);
    console.log('WS server: End-user disconnected');
  });

  socket.on('error', (err) => {
    removeUser(socket);
    console.log('WS server error: '+err);
  });
});

//Listen on provided port, on all network interfaces
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);