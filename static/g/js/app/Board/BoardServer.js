
var BoardServer = function(server){
	var tabs;
	var tabsPriv;
	var currentTabIndex;

	var tabNextIndex;
	var plainRollingIndex;
	var annotationRollingIndex;
	var maxTabs = 8;
	var annotationsInEditing;
	this.getdata = function(){
		return {tabs: tabs, currentTabIndex: currentTabIndex};
	};

	//	Listeners
	server.onServerEvent('Open', init);
	server.onServerEvent('ClientEnter', initClient);
	server.onServerEvent('ClientLeave', removeClient);
	server.onRequest('Board', boardHandler);

	//	Handlers
	function init(serverId){
		tabs = new Object();
		tabsPriv = new Object();
		annotationsInEditing = {};
		currentTab = "";
		tabNextIndex = 0;
		plainRollingIndex = 1;
		annotationRollingIndex = 0;

		//	First tab by default
		/*
		var index = tabNextIndex+"";
		tabNextIndex++;
		tabs[index] = new Object();
		tabs[index].tabIndex  = index;
		tabs[index].metadata = {sourceType: "Plain", name: "Plain Board "+plainRollingIndex};
		plainRollingIndex++;
		tabs[index].coords = {x: 0, y: 0};
		tabs[index].scale = 1.0;
		tabs[index].canvasData = [];
		tabs[index].annotationData = [];
		tabsPriv[index] = new Object();
		tabsPriv[index].peerActions = {}
		currentTabIndex = index;
		*/
	}

	function initClient(peerId){
		var message = new Object();
		message.type = 'Board';
		message.subType = 'Init';
		message.data = {'tabs': tabs, 'currentTabIndex': currentTabIndex};
		server.send(peerId, message);
	}

	function removeClient(peerId){
		var message = new Object();
		message.type = "Board";
		message.subType = "CursorRemoved";
		message.peerId = peerId;
		server.broadcast(message);

		for (var annotationIndex in annotationsInEditing){
			if (annotationsInEditing[annotationIndex].editing == peerId){
				var annotationAction = new Object();
				annotationAction.type = "UpdateAnnotation";
				annotationAction.annotationIndex = annotationIndex;
				annotationAction.text = annotationsInEditing[annotationIndex].text;
				annotationAction.peerId = annotationsInEditing[annotationIndex].peerId;
				annotationAction.pageIndex = annotationsInEditing[annotationIndex].pageIndex;
  				annotationAction.tabIndex = annotationsInEditing[annotationIndex].tabIndex;
  				var request = new Object();
  				request.annotationAction = annotationAction;
  				request.type = "Board";
  				request.subType = "Tab";
  				request.tabSubType = "AnnotationAction";
  				request.peerId = peerId;
  				request.timestamp = new Date().getTime();
  				annotationHandler(request);
			}
		}
	}

	function boardHandler(request){
		var message = request;

		if (request.subType == "UpdateCursor"){
		} 

		else if (request.subType == "Tab"){
			if (request.tabSubType == "UpdateScroll"){

				//	Update tab
				tabs[request.tabIndex].coords = request.coords;
			}


			else if (request.tabSubType == "UpdateScale"){

				//	Update tab
				tabs[request.tabIndex].scale = request.scale;
			}


			else if (request.tabSubType == "AnnotationAction"){
				annotationHandler(request);
				return;
			}

			else if (request.tabSubType == "CanvasAction"){
				var action = request.canvasAction;
				action.peerId = message.peerId;

				//	Get canvas data
				var canvasData;
				if (action.pageIndex != undefined){
					canvasData = tabs[action.tabIndex].canvasData[action.pageIndex];
					if (canvasData == undefined){
						canvasData = {actions: []};
						tabs[action.tabIndex].canvasData[action.pageIndex] = canvasData;
					}
				}

				//	Get peer actions
				var peerData = tabsPriv[action.tabIndex].peerActions[action.peerId];
				if (peerData == undefined){
					peerData = {actions:[], actionIndex:0};
					tabsPriv[action.tabIndex].peerActions[action.peerId] = peerData;
				}

				//	Update
				if (action.type == "AddStroke"){
					peerData.actions.splice(peerData.actionIndex, peerData.actions.length-peerData.actionIndex);
					peerData.actions.push(action);
					peerData.actionIndex = peerData.actions.length;

					canvasData.actions.push(action);
				} else if (action.type == "Clear"){
					peerData.actions.splice(peerData.actionIndex, peerData.actions.length-peerData.actionIndex);
					peerData.actions.push(action);
					peerData.actionIndex = peerData.actions.length;

					canvasData.actions.push(action);
				} else if (action.type == "Undo"){
					if (peerData.actionIndex > 0){
						peerData.actionIndex--;

						//	Remove from canvasActions
						var canvasAction = peerData.actions[peerData.actionIndex];
						message.canvasAction.pageIndex = canvasAction.pageIndex;
						canvasData = tabs[canvasAction.tabIndex].canvasData[canvasAction.pageIndex];
						for (var i = canvasData.actions.length-1; i >= 0; i--){
							if (canvasData.actions[i].peerId == action.peerId){
								var undoAction = canvasData.actions[i];
								canvasData.actions.splice(i, 1);
								
								if (undoAction.type == "AddStroke")
									server.broadcast(createScrollPageRequest(undoAction.tabIndex, undoAction.pageIndex, undoAction.peakCoord));
								else if (undoAction.type == "Clear")
									server.broadcast(createScrollPageRequest(undoAction.tabIndex, undoAction.pageIndex, {x:0, y:0}));
								break;
							}
						}
					} else
						return;
				} else if (action.type == "Redo"){
					if (peerData.actionIndex < peerData.actions.length){
						var redoAction = peerData.actions[peerData.actionIndex];
						canvasData = tabs[redoAction.tabIndex].canvasData[redoAction.pageIndex];
						canvasData.actions.push(redoAction);
						pageIndex = redoAction.pageIndex;

						peerData.actionIndex++;
						message.canvasAction = redoAction;
						if (redoAction.type == "AddStroke")
							server.broadcast(createScrollPageRequest(redoAction.tabIndex, redoAction.pageIndex, redoAction.peakCoord));
						else if (redoAction.type == "Clear")
							server.broadcast(createScrollPageRequest(redoAction.tabIndex, redoAction.pageIndex, {x:0, y:0}));
					} else
						return;
				}

			}
		} 


		else if (request.subType == "NewTab"){
			message.tabIndex = tabNextIndex+"";
			tabNextIndex++;

			//	Check max tabs open
			if (Object.keys(tabs).length >= maxTabs){
				var message = new Object();
				message.type = "Error";
				message.errorTitle = "Too many tabs";
				message.errorMessage = "Please close some existing tabs.";
				server.send(request.peerId, message);
				return;
			}

			//	Add to data
			tabs[message.tabIndex] = new Object();
			tabs[message.tabIndex].metadata = request.metadata;
			if (request.metadata.sourceType == "Plain"){
				request.metadata.name = "Plain Board "+ plainRollingIndex;
				plainRollingIndex++;
			}
			tabs[message.tabIndex].coords = {x: 0, y: 0};
			tabs[message.tabIndex].scale = 1.0;
			tabs[message.tabIndex].canvasDataPage = [];
			tabs[message.tabIndex].canvasData = [];
			tabs[message.tabIndex].annotationData = [];
			tabs[message.tabIndex].tabIndex = message.tabIndex;
			

			tabsPriv[message.tabIndex] = new Object();
			tabsPriv[message.tabIndex].peerActions = {}
			currentTabIndex = message.tabIndex;
			message.tab = tabs[message.tabIndex];
		} 

		
		else if (request.subType == "CloseTab"){
			//	Remove from data
			delete tabs[message.tabIndex];
		} 


		else if (request.subType == "SwitchTab"){
			//	Update data
			currentTabIndex = message.tabIndex;
		} 


		server.broadcast(message);
	}


	function annotationHandler(request){
		var message = request;

		var action = request.annotationAction;
		action.peerId = message.peerId;

		//	Get canvas data
		var annotationData;
		if (action.pageIndex != undefined){
			annotationData = tabs[action.tabIndex].annotationData[action.pageIndex];
			if (annotationData == undefined){
				annotationData = {};
				tabs[action.tabIndex].annotationData[action.pageIndex] = annotationData;
			}
		}


		if (action.type == "AddAnnotation"){
			action.annotationIndex = annotationRollingIndex;
			action.annotation.annotationIndex = annotationRollingIndex;
			annotationData[annotationRollingIndex] = action.annotation;
			annotationRollingIndex++;

			annotationsInEditing[action.annotationIndex] = request.annotationAction;
			annotationsInEditing[action.annotationIndex].editing = action.peerId;
			annotationsInEditing[action.annotationIndex].text = "";

		} else if (action.type == "BeginUpdateAnnotation"){
			if (annotationData[action.annotationIndex].editing != undefined)
				return;
			annotationData[action.annotationIndex].editing = action.peerId;

			annotationsInEditing[action.annotationIndex] = request.annotationAction;
			annotationsInEditing[action.annotationIndex].editing = action.peerId;
			annotationsInEditing[action.annotationIndex].text = annotationData[action.annotationIndex].text;
		} else if (action.type == "UpdateAnnotation"){
			if (annotationData[action.annotationIndex] == undefined)
				return;
			annotationData[action.annotationIndex].text = action.text;
			annotationData[action.annotationIndex].editing = undefined
			delete annotationsInEditing[action.annotationIndex];

			if (annotationData[action.annotationIndex].text.length == 0)
				setTimeout(function(){annotationHandler(
					createDeleteAnnotation(action.tabIndex, action.pageIndex, action.annotationIndex))},0);

		} else if (action.type == "DeleteAnnotation"){
			delete annotationData[action.annotationIndex];
		} else if (action.type == "SetSize"){
			if (annotationData[action.annotationIndex] == undefined)
				return;
			annotationData[action.annotationIndex].size = action.size;
		} else if (action.type == "SetColor"){
			if (annotationData[action.annotationIndex] == undefined)
				return;
			annotationData[action.annotationIndex].color = action.color;
		} else if (action.type == "SetCoords"){
			if (annotationData[action.annotationIndex] == undefined)
				return;
			annotationData[action.annotationIndex].coords = action.coords;
		} else if (action.type == "SetFontsize"){
			if (annotationData[action.annotationIndex] == undefined)
				return;
			annotationData[action.annotationIndex].fontSize = action.fontSize;
		}

		server.broadcast(message);
	}

	function createScrollPageRequest(tabIndex, pageIndex, coords){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "UpdateScrollPage";
		request.tabIndex = tabIndex;
		request.pageIndex = pageIndex;
		request.scrollTime = new Date().getTime();
		request.coords = coords;
		return request
	}

	function createDeleteAnnotation(tabIndex, pageIndex, annotationIndex){
		var request = new Object();
		request.type = "Board";
		request.subType = "Tab";
		request.tabSubType = "AnnotationAction";
		request.annotationAction = {};
		request.annotationAction.type = "DeleteAnnotation";
		request.annotationAction.tabIndex = tabIndex;
		request.annotationAction.pageIndex = pageIndex;
		request.annotationAction.annotationIndex = annotationIndex;
		return request;
	}

}