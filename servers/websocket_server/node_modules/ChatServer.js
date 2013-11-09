module.exports = ChatServer;

function ChatServer(server){

	//	Variables
	var history;
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initChatClient);
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
	
	function requestHandler(request){
		if (request.subType == 'NewChat'){
			history.push(request);
			server.broadcast(request);
		}
	}

}

