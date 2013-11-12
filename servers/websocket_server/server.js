var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var crypto = require('crypto');
var NodeStarServer = require('NodeStarServer/NodeStarServer');
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);
server.listen(3217);

io.set('log level', 1);
io.sockets.on('connection', socketConnectionInstance);


var nodeStarServers = {};
var randstr = "";	//	To edit

function socketConnectionInstance(socket) {
    socket.on('connect', function(message) {
        var peerId = message.peerId;
        socket.peerId = peerId;

        var serverId = message.serverId;
        var nodeStarServer;
		if (serverId == undefined || serverId.length == 0){
			serverId = crypto.createHash('md5').update(new Date().getTime()+randstr).digest("hex");
			nodeStarServer = new NodeStarServer(serverId);
			nodeStarServers[serverId] = nodeStarServer;
		} else {
			if (nodeStarServers[serverId] == undefined)
				nodeStarServers[serverId] = new NodeStarServer(serverId);
		 	nodeStarServer = nodeStarServers[serverId];
		}
		console.log(serverId);
		 socket.emit('open', serverId);
		 nodeStarServer.socketOpenHandler(socket);
    });
	socket.emit('ready');
}

