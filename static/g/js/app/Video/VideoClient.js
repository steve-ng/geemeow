
var VideoClient = function(client){
	var delegate;
	var localMediaStream;
	client.onClientEvent('Call', receiveCallHandler);
	client.onClientEvent('ClientList', clientListHandler);
	client.onClientEvent('ClientEnter', clientEnterHandler);
	client.onClientEvent('ClientLeave', clientLeaveHandler);
	var connections = {};
	var callerConnections = {};


	//	Cross browser
	navigator.getMedia = navigator.getUserMedia || 
						navigator.webkitGetUserMedia || 
						navigator.mozGetUserMedia || 
						navigator.msGetUserMedia;


	//	Callback for video controller
	this.setDelegate = function(videoDelegate){
		delegate = videoDelegate;
		videoDelegate.constraintsListener = this;
	}


	function clientListHandler(peerList){
		delegate.init();
		for (var i in peerList.data){
			if (peerList.data[i] != client.getClientPeerId())
				connections[peerList.data[i]] = "";
			delegate.addPeer(peerList.data[i]);
		}
		restart();
	}


	function clientEnterHandler(message){
		var peerId = message.data;
		if (peerId == client.getClientPeerId())
			return; 

		connections[peerId] = "";
		delegate.addPeer(peerId);
		callPeer(peerId);
	}


	function clientLeaveHandler(message){
		var peerId = message.data;
		delete connections[peerId];
		delegate.removePeer(peerId);
	}

	
	function receiveCallHandler(callConn){
		if (callConn.metadata.type != 'video')
			return;
		connections[callConn.peer] = callConn;
		callConn.answer(undefined);

		callConn.on('stream',function(stream){
			delegate.setStream(callConn.peer, stream);
		});

		callConn.on('close',function(){
			if (connections[callConn.peer] != undefined && connections[callConn.peer].metadata.time == callConn.metadata.time)
				delegate.removeStream(callConn.peer);
		});

		callConn.on('error',function(err){
			if (connections[callConn.peer] != undefined && connections[callConn.peer].metadata.time == callConn.metadata.time)
				delegate.removeStream(callConn.peer);
		});
	}


	function restart(constraints){
		if (localMediaStream != undefined)
			localMediaStream.stop();

		var gotStream = function(localStream){
        	localMediaStream = localStream;
            delegate.setStream(client.getClientPeerId(), localMediaStream);

			//	restart all streams
			for (var peerId in callerConnections){
				if (callerConnections[peerId].close != undefined)
					callerConnections[peerId].close();
				callerConnections[peerId] = "";
			}

            for (var peerId in connections){	//	callerConnections follow connections
           		if (peerId == client.getClientPeerId())
           			continue;

           		callPeer(peerId);
		    }
        }

        if (constraints == undefined || constraints.video == false && constraints.audio == false){
        	gotStream(undefined);
        } else {
			navigator.getMedia (constraints, gotStream,
		        // errorCallback
		        function(err) {
		         	console.log(err);
		         	//$('#cameraFailAlert').hide('slow',function(){
		         	//	$('#cameraFailAlert').show();
		         	//});
		        }
		    );
		}
	}

	this.constraintsChanged = function(constraints){
		restart(constraints);
	}


	function callPeer(peerId){
		if (localMediaStream == undefined)
			return;

		var callConn = client.call(peerId, localMediaStream);
		callConn.metadata = {time:new Date().getTime(), type:'video'};
		callerConnections[peerId] = callConn;
	}
}