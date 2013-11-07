var apikey = 'fxv643daihuuwhfr';
var app = angular.module('LearningRoom', ['prettyDateFilter', 'truncateFilter']);

app.run(function($rootScope){
	$rootScope.users = {};
	$rootScope.client;
	$rootScope.server;
	$rootScope.clientId;

	$rootScope.chatClient;
	$rootScope.chatServer;
	$rootScope.boardClient;
	$rootScope.boardServer;
	$rootScope.userClient;
	$rootScope.userServer;

	$rootScope.debug = false;
	$rootScope.serverPeerId = "";
	$rootScope.setupTimer;

	//	Setup
	function setup(){
		if (window.location.hash == ""){
			setupServer();
			setupClient();
		} else {
			setupClient();
			$rootScope.serverPeerId = window.location.hash.substring(1);
		    $rootScope.client.start($rootScope.serverPeerId);
		}
	}
	setup();


	function setupClient(){
		$rootScope.setupTimer = setTimeout(
			function(){
				window.location.href = "";
			}
		, 10000);
		$rootScope.client = new RTCStarClient();
		$rootScope.client.key = apikey;
	    $rootScope.client.debug($rootScope.debug);
	    $rootScope.client.onClientEvent('Open',function(clientPeerId){
			$("#loading-screen").hide();
			$("#app").show();
			$rootScope.clientId = clientPeerId;

			clearTimeout($rootScope.setupTimer);
	    });

	    //	Plugins
	    $rootScope.chatClient = new ChatClient($rootScope.client);
	    $rootScope.boardClient = new BoardClient($rootScope.client);
	    $rootScope.videoClient = new VideoClient($rootScope.client);
	    $rootScope.userClient = new UserClient($rootScope.client);
	    $rootScope.userClient.setDelegate($rootScope);
	}


	function setupServer(){
		$rootScope.server = new RTCStarServer();
		$rootScope.server.key = apikey;
		$rootScope.server.debug($rootScope.debug);
		$rootScope.server.onServerEvent('Open', function(serverPeerId){
			$rootScope.serverPeerId = serverPeerId;
			window.location.hash = $rootScope.serverPeerId;
			
			//	Also start client
	    	$rootScope.client.start($rootScope.serverPeerId);
		});

	    //	Plugins
	    $rootScope.chatServer = new ChatServer($rootScope.server);
	    $rootScope.boardServer = new BoardServer($rootScope.server);
	    $rootScope.userServer = new UserServer($rootScope.server);

	    //	Start
		$rootScope.server.start();
	}


	//	User data
	$rootScope.updateName = function(name){
		$rootScope.userClient.changeName(name);
	}


	$rootScope.onUserInit = function(message){
		$rootScope.users = message.users;
		$rootScope.$apply();
	}

	$rootScope.onUserChangeName = function(message){
		$rootScope.users[message.peerId].name = message.name;
		$rootScope.$apply();
	}

	$rootScope.onUserUpdate = function(message){
		$rootScope.users[message.user.peerId] = message.user;
		$rootScope.$apply();
	}

	//	UI Methods

	$rootScope.openPDFLink = function(link){
    	$rootScope.$broadcast('OpenPDFLink',link);
	}

	$rootScope.uploadPDF = function(file){
    	$rootScope.$broadcast('UploadPDF',file);
	}

	$rootScope.newPlainBoard = function(){
    	$rootScope.$broadcast('NewPlainBoard');
	}

	$rootScope.openImageLink = function(link){
    	$rootScope.$broadcast('OpenImageLink',link);
	}

	$rootScope.uploadImage = function(file){
    	$rootScope.$broadcast('UploadImage', file);
	}

});


//	Controller for Side Bar
app.controller('SideBarController', ['$scope', function($scope){
  	$scope.widgetID = "chat-widget";

	$scope.switchWidget = function(widgetID){
		$scope.widgetID = widgetID;
		$scope.safeApply();
	}

	//	Safe Apply
  	$scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;
	  if(phase == '$apply' || phase == '$digest') {
	    if(fn && (typeof(fn) === 'function')) {
	      fn();
	    }
	  } else {
	    this.$apply(fn);
	  }
	};
}]);

