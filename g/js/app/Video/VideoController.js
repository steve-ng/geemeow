
app.controller('VideoController', function($scope, $rootScope){
	$scope.videoType = {'Camera': {mandatory: { maxWidth: 320, maxHeight: 240 }},
						'Screen': {mandatory: {chromeMediaSource: 'screen'}},
						'None': false};
	$scope.currentVideoType = 'None';			
	$scope.constraints = {
		video: false,
		audio: false,
	}

	$scope.constraintsListener;
	$scope.peers = {};
	$scope.focusPeerId;
	$rootScope.videoClient.setDelegate($scope);
	$scope.names = {};

	//  Names
    $rootScope.$on('NamesChanged', function(event, names){
    	$scope.names = names;
    	$scope.safeApply();
    });
	
	$scope.init = function(){
		//	Restart localstream based on constraints
		if ($scope.constraintsListener != undefined)
			$scope.constraintsListener.constraintsChanged($scope.constraints);
	}



	$scope.addPeer = function(peerId){
		if ($scope.peers[peerId] != undefined)
			return;

		$scope.peers[peerId] = {url:"", audioEnabled:true, videoEnabled:true, hasVideo:false, hasAudio: false};
		
		if (Object.keys($scope.peers).length == 1)
			$scope.focusPeerId = peerId;
	}


	$scope.removePeer = function(peerId){
		delete $scope.peers[peerId];

		if ($scope.focusPeerId == peerId){
			for (var first in $scope.peers)
				$scope.focusPeerId = first;
		}

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


	$scope.switchFocusPeer = function(peerId){
		$scope.focusPeerId = peerId;
		$scope.safeApply();
	}


	$scope.setVideo = function(type){
		$scope.currentVideoType = type;
		$scope.constraints.video = $scope.videoType[$scope.currentVideoType];

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

		$scope.safeApply();
	}


	$scope.toggleAudio = function(peerId){
		if (peerId == $scope.$parent.clientId){
			$scope.constraints.audio = !$scope.constraints.audio;

			if ($scope.constraintsListener != undefined)
				$scope.constraintsListener.constraintsChanged($scope.constraints);
			
		} else {
			var peer = $scope.peers[peerId];
			if (peer.hasAudio){
				peer.audioEnabled = !peer.audioEnabled;
				var tracks = peer.stream.getAudioTracks();
				for (var i in tracks)
					tracks[i].enabled = peer.audioEnabled;
			}
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


app.directive('videoChatActive', function($window) {
	return function(scope, element, attrs) {
		scope.$watch("focusPeerId", function(){
		    checkMute(scope.focusPeerId, scope.$parent.clientId);
	    });
		
		function checkMute(peerId, selfPeerId){
			if (peerId == selfPeerId)
				element.prop('muted', true);
			else
				element.prop('muted', false);
		}
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


app.directive('videoChatInactive', function($window) {
	return function(scope, element, attrs) {
		scope.$watch("peerId", function() {
		    checkMute(scope.peerId, scope.$parent.$parent.clientId);
	    });
		
		function checkMute(peerId, selfPeerId){
			if (peerId == selfPeerId)
				element.prop('muted', true);
			else
				element.prop('muted', false);
		}
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



app.directive('videoZoomActive', function($window) {
	return function(scope, element, attrs) {
		scope.$watch("peers[focusPeerId].url", function() {
			setTimeout(function(){
				element.removeClass("transition-zoom");
				element.addClass("transition-zoom");
			},0);
	    });
	};
});


app.directive('videoZoomInactive', function($window) {
	return function(scope, element, attrs) {
		scope.$watch("peer.url", function() {
			setTimeout(function(){
				element.removeClass("transition-zoom");
				element.addClass("transition-zoom");
			},0);
	    });
	};
});
