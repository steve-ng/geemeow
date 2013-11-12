function UserServer(server){

	//	Variables
	var users;
	var colors = ['rgb(26, 188, 156)', 'rgb(52, 152, 219)', 'rgb(241, 196, 15)', 'rgb(231, 76, 60)', 
					'rgb(255, 105, 180)', 'rgb(0,255,0)', 'rgb(255,0,0)'];
	var colors2 = [];
	var colorsName = ['Turquoise', 'Curious Blue', 'Sunflower', 'Cinnabar', 'Pink', 'Lime Green', 'Red'];
	var colorsName2 = [];
	var cats = ['Bengal', 'Bobtail', 'Persian', 'Korat', 'Ragdoll', 'Savannah', 
					'Highlander', 'Snowshoe', 'Munchkin', 'Ocicat', 'Manx', 'Bombay', 'Sphynx', 'Ragamuffin'];
	var userRollingIndex = 0;
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initUserClient);
	server.onRequest('User', requestHandler);
	
	function init(serverId){
		users = {};
		names = {};
	}
	
	function initUserClient(peerId){
		users[peerId] = new Object();
		users[peerId].peerId = peerId;
		var randomCat = cats[Math.floor(Math.random()*cats.length)];
		var randomColor = Math.floor(Math.random()*colors.length);
		users[peerId].name = colorsName[randomColor] + " " +randomCat;
		users[peerId].color = colors[randomColor];

		colors2.push(colors[randomColor]);
		colors.splice(randomColor, 1);
		colorsName2.push(colorsName[randomColor]);
		colorsName2.splice(randomColor, 1);

		if (colors.length == 0){
			colors = colors2;
			colorsName = colorsName2;
			colors2 = [];
			colorsName2 = [];
		}

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
			for (var i in users)
				if (users[i].name == request.name)
					return;
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