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
	$rootScope.progress = 0;
	
	$rootScope.notificationInterval;
	$rootScope.documentTitle;
	var totalNotificationCount = 0;
	$rootScope.notificationText = "\u9FB4\u2180\u25E1\u2180\u9FB4";
	$rootScope.sound = true;


	//	Setup
	function setup(){
		setupClient();
		$rootScope.serverPeerId = window.location.hash.substring(1);
		console.log("Connecting to : "+$rootScope.serverPeerId);
		$rootScope.client.start($rootScope.serverPeerId);

		$(window).focus(function() {
			clearInterval($rootScope.notificationInterval);
			document.title = $rootScope.documentTitle;
			totalNotificationCount = 0;
		});
		$rootScope.documentTitle = document.title;
	}
	setup();


	function setupClient(){
		$rootScope.client = new NodeStarClient();
		$rootScope.client.key = apikey;
		$rootScope.client.host = apihost;
		$rootScope.client.port = apiport;
		$rootScope.client.onMessage('MessageProgress', updateProgress);
		$rootScope.client.onClientEvent('Close', closeHandler);
	    $rootScope.client.debug($rootScope.debug);
	    $rootScope.client.onClientEvent('Open',function(clientPeerId, serverPeerId){
			$("#loading-screen").hide();
			$("#app").show();
			if ($rootScope.serverPeerId == undefined || $rootScope.serverPeerId.length == 0){
				$rootScope.serverPeerId = serverPeerId;
				$("#inviteModal").modal("show");
			} else
				$rootScope.serverPeerId = serverPeerId;

			$rootScope.clientId = clientPeerId;
			window.location.hash = $rootScope.serverPeerId;
			console.log(window.location.hash);
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

	function updateProgress(message){
		$rootScope.progress = message.data;
		if ($rootScope.progress  >= 1)
			$rootScope.progress = 0;
		$rootScope.$apply();
	}

	function closeHandler(message){
		$('#unableToJoinModal').modal('show');
	}

	$rootScope.toggleSound = function(){
		$rootScope.sound = !$rootScope.sound;
	}

	var audioElement = document.createElement('audio');
    audioElement.setAttribute('src', 'assets/sound/alert.mp3');
    var lastPlayed = 0;
	$rootScope.notify = function(){
		if (document.hasFocus())
			return;

		if ($rootScope.sound && new Date().getTime() > lastPlayed + 2000){
			audioElement.play();
			lastPlayed = new Date().getTime();
		}

		if (totalNotificationCount > 10)
			return;
		if ($rootScope.notificationInterval != undefined){
			clearInterval($rootScope.notificationInterval);
		}

		var count = 0;
		$rootScope.notificationInterval = setInterval(function(){
			if (document.title == $rootScope.documentTitle || count > 2){
				document.title = $rootScope.notificationText;
				totalNotificationCount++;
			}
			else
				document.title = $rootScope.documentTitle;
			count++;
		}, 1000);
	}

});
