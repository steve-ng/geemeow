
app.controller('VideoController', function($scope, $rootScope){
	$scope.videoType = {'CameraLow': {mandatory: { maxWidth: 320, maxHeight: 180 }},
						'CameraHigh': {mandatory: { maxWidth: 640, maxHeight: 360 }}};
	$scope.currentVideoType = 'CameraLow';
	$scope.videoEnabled = false;			
	$scope.constraints = {
		video: false,
		audio: false,
	}

	$scope.constraintsListener;
	$scope.peers = {};
	$rootScope.videoClient.setDelegate($scope);
	
	$scope.init = function(){
		//	Restart localstream based on constraints
		if ($scope.constraintsListener != undefined)
			$scope.constraintsListener.constraintsChanged($scope.constraints);
	}



	$scope.addPeer = function(peerId){
		if ($scope.peers[peerId] != undefined)
			return;

		$scope.peers[peerId] = {url:"", audioEnabled:true, videoEnabled:true, hasVideo:false, hasAudio: false};

		$scope.safeApply();
	}


	$scope.removePeer = function(peerId){
		delete $scope.peers[peerId];

		$scope.safeApply();
	}


	$scope.setStream = function(peerId, stream){
		if ($scope.peers[peerId] == undefined)
			$scope.addPeer(peerId);

		$scope.peers[peerId].stream = undefined;
		$scope.peers[peerId].url = "";
		$scope.peers[peerId].hasVideo = false;
		$scope.peers[peerId].hasAudio = false;

		if (stream == undefined)
			return;

		var url = URL.createObjectURL(stream);
		z = stream;
		$scope.peers[peerId].stream = stream;
		$scope.peers[peerId].url = url;
		for (var i in stream.getVideoTracks())
			if (stream.getVideoTracks()[i].enabled)
				$scope.peers[peerId].hasVideo = true;
		

		for (var i in stream.getAudioTracks())
			if (stream.getAudioTracks()[i].enabled)
				$scope.peers[peerId].hasAudio = true;
		
		
		$scope.safeApply();
	} 


	$scope.removeStream = function(peerId){
		delete $scope.peers[peerId].stream;
		$scope.peers[peerId].url = "";
		$scope.peers[peerId].hasVideo = false;
		$scope.peers[peerId].hasAudio = false;
		$scope.safeApply();
	}


	$scope.toggleOwnVideo = function(type){
		$scope.videoEnabled = !$scope.videoEnabled;

		if ($scope.videoEnabled)
			$scope.constraints.video = $scope.videoType[$scope.currentVideoType];
		else
			$scope.constraints.video = false;

		if ($scope.constraintsListener != undefined)
			$scope.constraintsListener.constraintsChanged($scope.constraints);
	}

	$scope.toggleOwnAudio = function(){
		$scope.constraints.audio = !$scope.constraints.audio;

		console.log($scope.constraints);
		if ($scope.constraintsListener != undefined)
			$scope.constraintsListener.constraintsChanged($scope.constraints);
	}


	$scope.toggleVideo = function(peerId){
		var peer = $scope.peers[peerId];
		if (peer.hasVideo){
			peer.videoEnabled = !peer.videoEnabled;
			var tracks = peer.stream.getVideoTracks();
			for (var i in tracks)
				tracks[i].enabled = peer.videoEnabled;
		}
	}


	$scope.toggleAudio = function(peerId){console.log(peerId);
		var peer = $scope.peers[peerId];
		if (peer.hasAudio){
			peer.audioEnabled = !peer.audioEnabled;
			var tracks = peer.stream.getAudioTracks();
			for (var i in tracks)
				tracks[i].enabled = peer.audioEnabled;
		}
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

});


app.directive('videoChat', function($window) {
	return function(scope, element, attrs) {
		element[0].removeAttribute("controls");
		
		function alive(){
			try{
				element[0].play();
				setTimeout(alive, 1000);
			} catch (err){console.log(err)}
		}
		alive();
	};
});

app.directive('videoZoomOwn', function($window) {
	return function(scope, element, attrs) {
		scope.$watch("peers[$root.clientId].url", function() {
			setTimeout(function(){
				element.removeClass("transition-zoom");
				element.addClass("transition-zoom");
			},0);
	    });
	};
});


app.directive('videoZoomOthers', function($window) {
	return function(scope, element, attrs) {
		console.log(scope.peerId);
		console.log(scope);
		console.log(scope.$parent.$parent.clientId);
		function checkMute(){
			if (scope.peerId == scope.$parent.$parent.clientId)
				element.prop('muted', true);
			else
				element.prop('muted', false);
		}
		checkMute();

		scope.$watch("peer.url", function() {
			setTimeout(function(){
				element.removeClass("transition-zoom");
				element.addClass("transition-zoom");
			},0);
	    });
	};
});
