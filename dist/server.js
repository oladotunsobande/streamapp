#!/usr/bin/env node
'use strict';

var _app = require('./app');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('rtcapp:server');

//Normalize a port into a number, string, or false
var normalizePort = function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

//Event listener for HTTP server "error" event
var onError = function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

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
};

//Event listener for HTTP server "listening" event
var onListening = function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('--> Server running');
};

//Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000');
_app.app.set('port', port);

//Create HTTP server
var server = _http2.default.createServer(_app.app);

//WebSocket Signaling Server configuration and methods

var clients = [];
//let ws_port = 3001;
var ws_path = '/ws/stream';

var addUser = function addUser(socket, req) {
  var url_pth = _url2.default.parse(req.url).path;

  if (url_pth.startsWith(ws_path)) {
    console.log('Authorized: ' + url_pth);
    var uuid = url_pth.split(ws_path + '/')[1];
    console.log('uuid: ' + uuid);
    clients.push({ "uuid": uuid, "socket": socket });
  }
};

var removeUser = function removeUser(socket) {
  for (var i in clients) {
    if (clients[i].socket == socket) {
      clients.splice(i, 1);
      break;
    }
  }
};

var sendMessage = function sendMessage(uuid, msg) {
  for (var i in clients) {
    if (clients[i].uuid == uuid) {
      clients[i].socket.send(msg);
      break;
    }
  }
};

var broadcast = function broadcast(socket, msg) {
  for (var i in clients) {
    if (clients[i].socket !== socket) {
      clients[i].socket.send(msg);
    }
  }
};

var ws = new _ws2.default.Server({
  server: server
});

ws.on('connection', function (socket, req) {
  console.log('Path: ' + _url2.default.parse(req.url).path);
  addUser(socket, req);
  console.log('Signalling Service Online!');

  socket.on('message', function (msg) {
    // Broadcast any received message to all clients
    console.log('RCVD: Sender: %s, Data: %s', JSON.parse(msg).uuid, msg.substr(0, 70));
    var incm = JSON.parse(msg);
    if (incm.uuid == 'ALL') {
      broadcast(socket, msg);
    } else {
      sendMessage(incm.uuid, msg);
    }
  });

  socket.on('close', function () {
    removeUser(socket);
    console.log('WS server: End-user disconnected');
  });

  socket.on('error', function (err) {
    removeUser(socket);
    console.log('WS server error: ' + err);
  });
});

//Listen on provided port, on all network interfaces
/*server.on('upgrade', (request, sockt, head) => {
  const pathname = url.parse(request.url).pathname;
 
  if (pathname === ws_path) {
    ws.handleUpgrade(request, sockt, head, function done(ws) {
      ws.emit('connection', ws, request);
    });
  } 
  else {
    sockt.destroy();
  }
});*/
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);