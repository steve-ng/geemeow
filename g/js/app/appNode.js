//var apikey = 'fxv643daihuuwhfr';
var apikey = '';
var apihost = "ec2-54-254-128-239.ap-southeast-1.compute.amazonaws.com";
var apiport = 3216;

var app = angular.module('Geemeow', ['prettyDateFilter', 'truncateFilter']);
var rootScope;

app.run(function($rootScope){
	rootScope = $rootScope;
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

	$rootScope.debug = true;
	$rootScope.serverPeerId = "";
	$rootScope.setupTimer;

	//	Setup
	function setup(){
		setupClient();
		$rootScope.serverPeerId = window.location.hash.substring(1);
		console.log("Connecting to : "+$rootScope.serverPeerId);
		$rootScope.client.start($rootScope.serverPeerId);
	}
	setup();


	function setupClient(){
		$rootScope.client = new NodeStarClient();
		$rootScope.client.key = apikey;
		$rootScope.client.host = apihost;
		$rootScope.client.port = apiport;
	    $rootScope.client.debug($rootScope.debug);
	    $rootScope.client.onClientEvent('Open',function(clientPeerId, serverPeerId){
			$("#loading-screen").hide();
			$("#app").show();
			if ($rootScope.serverPeerId == undefined || $rootScope.serverPeerId.length == 0)
				$("#inviteModal").modal("show");
			$rootScope.clientId = clientPeerId;
			$rootScope.serverPeerId = serverPeerId;
			window.location.hash = $rootScope.serverPeerId;

			clearTimeout($rootScope.setupTimer);
	    });

	    //	Plugins
	    $rootScope.chatClient = new ChatClient($rootScope.client);
	    $rootScope.boardClient = new BoardClient($rootScope.client);
	    $rootScope.videoClient = new VideoClient($rootScope.client);
	    $rootScope.userClient = new UserClient($rootScope.client);
	    $rootScope.userClient.setDelegate($rootScope);
	}

	//	User data

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
	$rootScope.changeName = function(name){
		$rootScope.userClient.changeName(name);
	}

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
	
	$rootScope.screenshare = function(){
    	$rootScope.$broadcast('Screenshare');
	}

	$rootScope.getGeemeowURL = function(){
		return window.location.href;
	}
});
