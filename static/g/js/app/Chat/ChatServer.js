var ChatServer = function(server){

	//	Variables
	var history;
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initChatClient);
	server.onServerEvent('ClientLeave', clientLeaveHandler);
	server.onRequest('Chat', requestHandler);
	
	function init(serverId){
		history = [];
	}
	
	function initChatClient(peerId){
		var message = new Object();
		message.type = 'Chat';
		message.subType = 'Init';
		message.history = history;
		server.send(peerId, message);

		var joinedMessage = new Object();
		joinedMessage.type = 'Chat';
		joinedMessage.subType = 'NewChat';
		joinedMessage.peerId = peerId;
		joinedMessage.text = "Joined the chat.";
		joinedMessage.timestamp = new Date().getTime();
		history.push(joinedMessage);
		server.broadcast(joinedMessage);
	}

	function clientLeaveHandler(peerId){
		var leaveMessage = new Object();
		leaveMessage.type = 'Chat';
		leaveMessage.subType = 'NewChat';
		leaveMessage.peerId = peerId;
		leaveMessage.text = "Left the chat.";
		leaveMessage.timestamp = new Date().getTime();
		history.push(leaveMessage);
		server.broadcast(leaveMessage);
	}
	
	function requestHandler(request){
		if (request.subType == 'NewChat'){
			history.push(request);
			server.broadcast(request);
		}
	}


}