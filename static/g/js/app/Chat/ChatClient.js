var ChatClient = function(client){
	var delegate;
	client.onMessage('Chat', chatHandler);

	this.setDelegate = function(chatDelegate){
		delegate = chatDelegate;
	}

	this.sendChat = function(text){
		var message = new Object();
		message.type = 'Chat';
		message.text = text;
		message.subType = 'NewChat';
		client.request(message);
	}
	
	function chatHandler(message){
		if (message.subType == 'NewChat')
			delegate.onNewChat(message);
		else if (message.subType == 'Init')
			delegate.onInit(message);
	}
}