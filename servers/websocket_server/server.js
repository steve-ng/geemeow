var https = require('https');
var socketio = require('socket.io');
var crypto = require('crypto');
var NodeStarServer = require('NodeStarServer/NodeStarServer');

var httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/privatekey.pem'),
    cert: fs.readFileSync('/etc/ssl/certs/server.crt')
};

var app = http.createServer(httpsOptions);
var io = socketio.listen(app);
app.listen(3217);

io.set('log level', 1);
io.sockets.on('connection', socketConnectionInstance);


var nodeStarServers = {};
var randstr = "";	//	To edit


function checkServer(server){
	var almostDied = false;
	interval = setInterval(function(){
		if (server.isEmpty()){
			if (almostDied){
				delete nodeStarServers[server.getServerNodeId()];
				clearInterval(interval);
			} else
				almostDied = true;
		} else
			almostDied = false;
	}, 300000);
}

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
			checkServer(nodeStarServer);
		} else {
			if (nodeStarServers[serverId] == undefined){
				nodeStarServers[serverId] = new NodeStarServer(serverId);
				checkServer(nodeStarServers[serverId]);
			}
		 	nodeStarServer = nodeStarServers[serverId];
		}
		console.log(serverId);
		if (nodeStarServer.isFull()){
			socket.emit('disconnected', 'Room is currently full :/');
			socket.disconnect();
		} else {
			socket.emit('open', serverId);
			nodeStarServer.socketOpenHandler(socket);
		}
    });
	socket.emit('ready');
}

