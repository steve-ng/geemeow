
var apikey = '';
var apihost = "geemeow.com";
var apiport = 3216;

var app = angular.module('Geemeow', ['prettyDateFilter', 'truncateFilter']);
var rootScope;
var showErrorAlert;

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

	$rootScope.debug = false;
	$rootScope.serverPeerId = "";
	$rootScope.progress = 0;
	
	$rootScope.notificationInterval;
	$rootScope.documentTitle;
	var totalNotifyCount = 0;
	$rootScope.notificationText = "\u9FB4\u2180\u25E1\u2180\u9FB4";
	$rootScope.notificationSound = $.cookie("notificationSound");
	if ($rootScope.notificationSound == null){
		$.cookie("notificationSound", "on");
		$rootScope.notificationSound = "on";
	}

	$rootScope.errorTitle = "";
	$rootScope.errorMessage = "";
	$rootScope.sync = true;


	//	Setup
	function setup(){
		setupClient();
		$rootScope.serverPeerId = window.location.hash.substring(1);
		console.log("Connecting to : "+$rootScope.serverPeerId);
		$rootScope.client.start($rootScope.serverPeerId);

		$(window).focus(function() {
			clearInterval($rootScope.notificationInterval);
			document.title = $rootScope.documentTitle;
			totalNotifyCount = 0;
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
		$rootScope.client.secure = true;
		$rootScope.client.onMessage('MessageProgress', updateProgress);
		$rootScope.client.onMessage('Error', showError);
		$rootScope.client.onClientEvent('Close', closeHandler);
	    $rootScope.client.debug($rootScope.debug);
	    $rootScope.client.onClientEvent('Open',function(clientPeerId, message){
	    	var serverPeerId = message.serverPeerId;
	    	var remainingTime = message.remainingTime;
	    	setupTimeout(remainingTime);
			$("#loading-screen").fadeOut();
			$("#app").show();
			if ($rootScope.serverPeerId == undefined || $rootScope.serverPeerId.length == 0){
				$rootScope.serverPeerId = serverPeerId;
			} else
				$rootScope.serverPeerId = serverPeerId;

			$rootScope.clientId = clientPeerId;
			window.location.hash = $rootScope.serverPeerId;
	    });
	    $rootScope.client.onClientEvent('ClientList', function(message){
	    	if (message.data.length == 1)
				$("#inviteModal").modal("show");
	    });

	    //	PluginscloseHandler
	    $rootScope.chatClient = new ChatClient($rootScope.client);
	    $rootScope.boardClient = new BoardClient($rootScope.client);
	    $rootScope.videoClient = new VideoClient($rootScope.client);
	    $rootScope.userClient = new UserClient($rootScope.client);
	    $rootScope.userClient.setDelegate($rootScope);
	}

	//	Timeout dialog
	function setupTimeout(remainingTime){
		var alertTimes = [29*60*1000, 29.5*60*1000, 15*60*1000, 5*60*1000, 2*60*1000];
		for (var i = 0; i < alertTimes.length; i++){
			var alertTime = alertTimes[i];
			if (remainingTime - alertTime > 0){
				setTimeout(function(){
					var a = alertTime;
					showErrorAlert("Duration Remaining", (a/1000/60)+" minutes");
				}, remainingTime - alertTime);
			}
		}
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
	$rootScope.changeName = function(){
		var newName = $('#changeNameModalInput').val();
		if (newName.length == 0 || newName.length > 30)
			return;
		$rootScope.userClient.changeName(newName);
		$('#changeNameModal').modal('hide');
	}

	$rootScope.openPDFLink = function(link){
    	$rootScope.$broadcast('OpenPDFLink',link);
		$('#openPDFLinkModal').modal('hide');
	}

	$rootScope.uploadPDF = function(file){
    	$rootScope.$broadcast('UploadPDF',file);
	}

	$rootScope.newPlainBoard = function(){
    	$rootScope.$broadcast('NewPlainBoard');
	}

	$rootScope.openImageLink = function(link){
    	$rootScope.$broadcast('OpenImageLink',link);
		$('#openImageLinkModal').modal('hide');
	}

	$rootScope.uploadImage = function(file){
    	$rootScope.$broadcast('UploadImage', file);
	}
	
	$rootScope.uploadTextFile = function(file){
    	$rootScope.$broadcast('UploadTextFile', file);
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
		showErrorAlert("Connection Lost: "+message, "You've disconnected from the server :/ Please re-enter.")
	}

	$rootScope.toggleSound = function(){
		if ($rootScope.notificationSound == "on")
			$rootScope.notificationSound = "off";
		else
			$rootScope.notificationSound = "on";
		$.cookie("notificationSound", $rootScope.notificationSound);
	}

	$rootScope.toggleSync = function(){
		$rootScope.sync = !$rootScope.sync;
	}

	var audioElement = document.createElement('audio');
    audioElement.setAttribute('src', 'assets/sound/alert.mp3');
    var lastPlayed = 0;
	$rootScope.notify = function(){
		if (document.hasFocus())
			return;

		totalNotifyCount++;
		if (totalNotifyCount > 0)
			document.title = "(" + totalNotifyCount + ") "+ $rootScope.documentTitle;
		else 
			document.title = $rootScope.documentTitle;

		if ($rootScope.notificationSound == "on" && new Date().getTime() > lastPlayed + 2000){
			audioElement.play();
			lastPlayed = new Date().getTime();
		}

		if ($rootScope.notificationInterval != undefined)
			clearInterval($rootScope.notificationInterval);

		var count = 0;
		$rootScope.notificationInterval = setInterval(function(){
			if (count % 2 == 0){
				document.title = $rootScope.notificationText;
			} else {
				if (totalNotifyCount > 0)
					document.title = "(" + totalNotifyCount + ") "+ $rootScope.documentTitle;
				else 
					document.title = $rootScope.documentTitle;
			}
			count++;
		}, 1000);
	}

	$rootScope.showErrorAlert = function(title, message){
		$rootScope.errorTitle = title;
		$rootScope.errorMessage = message;
		$rootScope.$apply();
		$('#errorModal').hide();
		$('#errorModal').modal('show');
	}
	showErrorAlert = $rootScope.showErrorAlert;

	function showError(message){
		showErrorAlert(message.errorTitle, message.errorMessage);
	}

	$rootScope.downloadChat = function(){
    	$rootScope.$broadcast('DownloadChat');
	}

	$rootScope.getFacebookInviteLink = function(){
		return "https://www.facebook.com/sharer/sharer.php?u=" +window.location.protocol + "//" + window.location.host + window.location.pathname + "%23"+window.location.hash.substring(1);
	}

	$rootScope.getGooglePlusInviteLink = function(){
		return "https://plus.google.com/share?url=" +window.location.protocol + "//" + window.location.host + window.location.pathname + "%23"+window.location.hash.substring(1);
	}

	$rootScope.getTwitterInviteLink = function(){
		return "https://twitter.com/intent/tweet?text=" +window.location.protocol + "//" + window.location.host + window.location.pathname + "%23"+window.location.hash.substring(1);
	}

	$rootScope.getRenRenInviteLink = function(){
		return "http://share.renren.com/share/buttonshare.do?title=GeeMeow&link=" +window.location.protocol + "//" + window.location.host + window.location.pathname + "%23"+window.location.hash.substring(1);
	}

	$rootScope.getWeiboInviteLink = function(){
		return "http://service.weibo.com/share/share.php?title=GeeMeow&url=" +window.location.protocol + "//" + window.location.host + window.location.pathname + "%23"+window.location.hash.substring(1);
	}
});
