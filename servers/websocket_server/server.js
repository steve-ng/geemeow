var fs = require('fs');
var https = require('https');
var socketio = require('socket.io');
var crypto = require('crypto');
var NodeStarServer = require('NodeStarServer/NodeStarServer');

var httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/privatekey.pem'),
    cert: fs.readFileSync('/etc/ssl/certs/primary_intermediate_certs.crt')
};

var app = https.createServer(httpsOptions);
var io = socketio.listen(app);
app.listen(3217);

io.set('log level', 1);
io.sockets.on('connection', socketConnectionInstance);


var nodeStarServers = {};
var randstr = "";	//	To edit
var persistentRooms = {'persist': true};
var timeLimit = 60*1000*30;	// to 30 mins

function checkServer(server){
	var almostDied = false;
	server.startedTime = new Date().getTime();
	if (server.getServerNodeId().toLowerCase().indexOf("geecat") == 0)
		server.startedTime += 100000*60*1000;
	var interval = setInterval(function(){
		if (server.isEmpty()){
			if (almostDied){
				delete nodeStarServers[server.getServerNodeId()];
				clearInterval(interval);
			} else
				almostDied = true;
		} else
			almostDied = false;

		//	Duration limit
		if (new Date().getTime() - server.startedTime > timeLimit){
			server.stop();
			delete nodeStarServers[server.getServerNodeId()];
			clearInterval(interval);
		}
	}, 10000);
}

function socketConnectionInstance(socket) {
    socket.on('connect', function(message) {
        var peerId = message.peerId;
        socket.peerId = peerId;

        var serverId = message.serverId;
        var nodeStarServer;
		if (serverId == undefined || serverId.length == 0 || 
			serverId.length > 128 || removeTags(serverId).length == 0){
			
			serverId = crypto.createHash('md5').update(new Date().getTime()+randstr).digest("hex");
			nodeStarServer = new NodeStarServer(serverId);
			nodeStarServers[serverId] = nodeStarServer;
			checkServer(nodeStarServer);
		} else {
			serverId = removeTags(serverId);
			if (nodeStarServers[serverId] == undefined){
				nodeStarServers[serverId] = new NodeStarServer(serverId);
				if (persistentRooms[serverId] == undefined)
					checkServer(nodeStarServers[serverId]);
			}
		 	nodeStarServer = nodeStarServers[serverId];
		}
		console.log(serverId + " @ " + new Date());
		if (nodeStarServer.isFull()){
			socket.emit('disconnected', 'Room is Full');
			socket.disconnect();
		} else {
			var m = {serverPeerId: serverId, remainingTime: timeLimit - (new Date().getTime() - nodeStarServer.startedTime)};
			socket.emit('open', JSON.stringify(m));
			nodeStarServer.socketOpenHandler(socket);
		}
    });
	socket.on('disconnect', function(){
		delete socket;
	});
	socket.emit('ready');
}

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

var tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');
function removeTags(html) {
  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
}