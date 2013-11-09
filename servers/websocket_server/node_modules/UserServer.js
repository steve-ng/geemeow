module.exports = UserServer;


function UserServer(server){

	//	Variables
	var users;
	var colors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple', 'orange', 'brown', 'lime', 'tam'];
	var userRollingIndex = 0;
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initUserClient);
	server.onRequest('User', requestHandler);
	
	function init(serverId){
		users = {};
	}
	
	function initUserClient(peerId){
		users[peerId] = new Object();
		users[peerId].peerId = peerId;
		users[peerId].name = "User "+userRollingIndex;
		users[peerId].color = colors[userRollingIndex%colors.length];
		userRollingIndex++;

		var message = new Object();
		message.type = 'User';
		message.subType = 'Init';
		message.users = users;
		server.send(peerId, message);


		updateUser(users[peerId]);
	}
	
	function requestHandler(request){
		if (request.subType == 'ChangeName'){
			users[request.peerId].name = request.name;
			server.broadcast(request);
		}
	}

	var updateUser = function(user){
		var message = new Object();
		message.type = 'User';
		message.subType = 'Update';
		message.user = user;
		server.broadcast(message);
	}


}