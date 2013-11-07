var UserClient = function(client){
	var delegate;
	client.onMessage('User', chatHandler);

	this.setDelegate = function(userDelegate){
		delegate = userDelegate;
	}

	this.changeName = function(name){
		this.name = name;
		var message = new Object();
		message.type = 'User';
		message.name = name;
		message.subType = 'ChangeName';
		client.request(message);
	}
	
	function chatHandler(message){
		if (message.subType == 'Init')
			delegate.onUserInit(message);
		else if (message.subType == 'ChangeName')
			delegate.onUserChangeName(message);
	}
}