var UserServer = function(server){

	//	Variables
	var users;
	var colors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple', 'orange', 'brown', 'lime', 'tam'];
	var colorIndex = 0;
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initUserClient);
	server.onRequest('User', requestHandler);
	
	function init(serverId){
		users = {};
	}
	
	function initUserClient(peerId){
		users[peerId] = new Object();
		users[peerId].color = colors[colorIndex%colors.length];
		colorIndex++;

		var message = new Object();
		message.type = 'User';
		message.subType = 'Init';
		message.users = users;
		server.send(peerId, message);
	}
	
	function requestHandler(request){
		if (request.subType == 'ChangeName'){
			users[request.peerId].name = request.name;
			server.broadcast(request);
		}
	}


}