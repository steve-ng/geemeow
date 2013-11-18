
var a;
var BoardClient = function(client){
	var localScreenStream;
	var screenStreams = {};
	this.screenStreams = screenStreams;
	var clientConns = {};
	client.onClientEvent('Call', receiveScreenHandler);
	client.onClientEvent('ClientList', clientListHandler);
	client.onClientEvent('ClientEnter', clientEnterHandler);
	client.onClientEvent('ClientLeave', clientLeaveHandler);

	this.peerId = function(){
		return client.getClientPeerId();
	}

	var delegate;
	this.setDelegate = function(boardDelegate){
		delegate = boardDelegate;
	};

	//	Methods
	this.newTab = function(metadata){
		var request = new Object();
		request.type = "Board";
		request.subType = "NewTab";
		request.metadata = metadata;
		client.request(request);
	}
	var newTab = this.newTab;

	this.closeTab = function(tabIndex){
		var request = new Object();
		request.type = "Board";
		request.subType = "CloseTab";
		request.tabIndex = tabIndex;
		client.request(request);
	}

	this.switchTab = function(tabId){
		var request = new Object();
		request.type = "Board";
		request.subType = "SwitchTab";
		request.tabIndex = tabId;
		client.request(request);
	}

	this.updateCursor = function(cursorData){return;
		var request = new Object();
		request.type = "Board";
		request.subType = "UpdateCursor";
		request.cursorData = cursorData;
		client.request(request);
	}

	this.updateScroll = function(tabIndex, coords){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "UpdateScroll";
		request.tabIndex = tabIndex;
		request.scrollTime = new Date().getTime();
		request.coords = coords;
		client.request(request);
	}

	this.updateScale = function(tabIndex, scale){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "UpdateScale";
		request.tabIndex = tabIndex;
		request.scale = scale;
		client.request(request);
	}

	this.canvasAction = function(canvasAction){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "CanvasAction";
		request.canvasAction = canvasAction;
		client.request(request);
	}

	this.annotationAction = function(annotationAction){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "AnnotationAction";
		request.annotationAction = annotationAction;
		client.request(request);
	}

	
	//	Message
	var messageHandler = function(message){
		if (message.subType == "UpdateCursor")
			delegate.onUpdateCursor(message);
		else if (message.subType == "CursorRemoved")
			delegate.onCursorRemoved(message);
		else if (message.subType == "Tab"){
			if (message.tabSubType == "UpdateScroll")
				delegate.onUpdateScroll(message);
			else if (message.tabSubType == "CanvasAction")
				delegate.onCanvasAction(message);
			else if (message.tabSubType == "AnnotationAction")
				delegate.onAnnotationAction(message);
			else if (message.tabSubType == "UpdateScrollPage")
				delegate.onUpdateScrollPage(message);
			else if (message.tabSubType == "UpdateScale")
				delegate.onUpdateScale(message);
		} 
		else if (message.subType == "Init")
			delegate.onInit(message); 
		else if (message.subType == "NewTab")
			delegate.onNewTab(message);
		else if (message.subType == "SwitchTab")
			delegate.onSwitchTab(message);
		else if (message.subType == "CloseTab")
			delegate.onCloseTab(message);
	};
	client.onMessage('Board', messageHandler);






	this.screenshare = function(name){
		if (localScreenStream != undefined)
			return;


		var gotScreenStream = function(localStream){
        	localScreenStream = localStream;
        	localScreenStream.onended = function(){
        		delegate.onScreenshareEnded();
        	};
        	screenStreams[client.getClientPeerId()] = {stream:localStream, url:URL.createObjectURL(localStream)};
			
			var metadata = {sourceType:'Screenshare', peerId:client.getClientPeerId(), name: name};
			newTab(metadata);
        }

		//navigator.getMedia({video: {mandatory: { chromeMediaSource: 'screen'}}}, gotScreenStream,
	    
		navigator.getMedia({video: {mandatory: { chromeMediaSource: 'screen', maxHeight: screen.height, maxWidth:screen.width }}}, gotScreenStream,
	        // errorCallback
	        function(err) {
	         	console.log(err);
		        showErrorAlert('Unable to start screenshare', 'Note that it is only supported on Chrome and has to be enabled manually. Checkout this <a href="http://www.youtube.com/watch?v=ZCatVxcyEpI" target="_blank">Youtube</a> video for instructions.');
	        }
	    );
	}

	this.endScreenshare = function(){
		for (var peerId in clientConns){
			if (clientConns[peerId].close != undefined)
				clientConns[peerId].close();
			clientConns[peerId] = "";
		}
		localScreenStream.stop();
        localScreenStream = undefined;
        delete screenStreams[client.getClientPeerId()];
	}

	this.startScreenshare = function(){
		for (var peerId in clientConns)
			screenPeer(peerId);
	}



	/*	Screenshare helper */

	client.onClientEvent('ClientList', clientListHandler);
	client.onClientEvent('ClientEnter', clientEnterHandler);
	client.onClientEvent('ClientLeave', clientLeaveHandler);
	function clientListHandler(peerList){
		for (var i in peerList.data){
			if (peerList.data[i] != client.getClientPeerId())
				clientConns[peerList.data[i]] = "";
		}
	}


	function clientEnterHandler(message){
		var peerId = message.data;
		if (peerId == client.getClientPeerId())
			return; 

		clientConns[peerId] = "";
		screenPeer(peerId);
	}


	function clientLeaveHandler(message){
		var peerId = message.data;
		delete clientConns[peerId];
	}


	function receiveScreenHandler(screenConn){
		if (screenConn.metadata.type != 'screen')
			return;

		screenConn.answer(undefined);

		screenConn.on('stream',function(stream){
			screenStreams[screenConn.peer] = {stream:stream, url:URL.createObjectURL(stream)};
		});

		screenConn.on('close',function(){
			delete screenStreams[screenConn.peer];
		});

		screenConn.on('error',function(err){
			delete screenStreams[screenConn.peer];
		});
	}



	function screenPeer(peerId){
		if (localScreenStream == undefined)
			return;

		var screenConn = client.call(peerId, localScreenStream);
		screenConn.metadata = {time:new Date().getTime(), type:'screen'};
		clientConns[peerId] = screenConn;
	}

	

}