var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);
server.listen(3217);

io.set('log level', 1);

io.sockets.on('connection', socketConnectionInstance);

function socketConnectionInstance(socket) {
    
    /* code to execute when socket first connects goes here */
    
    /* end of code to execute when socket first connects */
    
    socket.on('youCanSpecifyCustomEventHere', function() {
        
    });
    
    socket.on('disconnect', function() {
        
    });
}