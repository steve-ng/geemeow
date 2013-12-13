app.controller('BoardTabController', function($scope,$rootScope) {
  	$scope.tab;	//	from parent
  	$scope.boardClient = $scope.$parent.boardClient;
  	$scope.pages = [];
  	$scope.done = false;
    $scope.cursorData;
    $scope.sendCursorUpdate;
    $scope.currentPage = 0;
    $scope.scrollHistory = {};
    $scope.clientId = $rootScope.clientId;
    $scope.previousScrollPeerId = $rootScope.clientId;

    //  Safe Apply
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

  	//	Init page
  	var initTab = function(){
  		if ($scope.tab.metadata.sourceType == "PDFLink"){
  			PDFJS.getDocument($scope.tab.metadata.pdfLink).then(function getPdf(loadedPdf) {
			 	var pageNumber = 1;
			 	$scope.pdf = loadedPdf;
			 	preparePDF();
			});
  		} else if ($scope.tab.metadata.sourceType == "PDFFile"){
  			var data = base64ToUint8Array($scope.tab.metadata.pdfFile.substring($scope.tab.metadata.pdfFile.indexOf(';base64,')+8));
  			PDFJS.getDocument(data).then(function getPdf(loadedPdf) {
			 	var pageNumber = 1;
			 	$scope.pdf = loadedPdf;
			 	preparePDF();
			});
  		} else if ($scope.tab.metadata.sourceType == "Plain"){
			$scope.pages[0] = {};
  		} else if ($scope.tab.metadata.sourceType == "ImageLink"){
			var image = new Image();
 			image.onload = function(){
 				$scope.pages[0] = {image: image};
 				$scope.$apply();
		    }
		    image.onerror = function(){
		    	$scope.boardClient.closeTab($scope.tab.tabIndex);
				$rootScope.showErrorAlert("Unable to download image", "The website hosting the image link could have blocked us :/ Try uploading the image instead.");
			}
    		image.crossOrigin = "anonymous";
		    image.src = $scope.tab.metadata.imageLink;

		} else if ($scope.tab.metadata.sourceType == "ImageFile"){
			var image = new Image();
 			image.onload = function(){
 				$scope.pages[0] = {image: image};
 				$scope.$apply();
		    }
		    image.src = $scope.tab.metadata.imageFile;
		} else if ($scope.tab.metadata.sourceType == "TextFile"){
			var data = atob($scope.tab.metadata.textFile.substring($scope.tab.metadata.textFile.indexOf(';base64,')+8));
  			var mimetype = $scope.tab.metadata.textFile.substring(5, $scope.tab.metadata.textFile.indexOf(';base64'));
			if (mimetype == "text/x-python-script")
				mimetype = "text/x-python";
			$scope.pages[0] = {textFile: {data: data, mimetype: mimetype}};
		} else if ($scope.tab.metadata.sourceType == "Screenshare"){
 			$scope.pages[0] = {streamSrc: $scope.boardClient.screenStreams, peerId: $scope.tab.metadata.peerId};
		}
  	};
  	initTab();

  	function preparePDF(){	
  		function prepare(pageNumber){
			if (pageNumber > $scope.pdf.numPages){
				$scope.$apply();
				return;
			}

			$scope.pdf.getPage(pageNumber).then(function(pdfpage) {
				$scope.pages[pageNumber-1] = {pdfpage: pdfpage};
				prepare(pageNumber+1);
			});
		}
		prepare(1);
	}


	//	Scroll handler
	$scope.$on('TabUpdateScroll'+$scope.tab.tabIndex, function(event, message){
      	if (message.peerId == $rootScope.clientId && $scope.previousScrollPeerId == $rootScope.clientId)
        	return;
        //if (message.peerId == $rootScope.clientId)
        //	return;
        $scope.previousScrollPeerId = message.peerId;
		if ($rootScope.sync)
			$scope.tab.coords = message.coords;
		else
			$scope.tab.coordsSync = message.coords;
		$scope.safeApply();
	});

	var first = true;
	$rootScope.$watch("sync", function(){
		if ($rootScope.sync && !first){
			$scope.tab.coords = $scope.tab.coordsSync;
			$scope.tab.pageCoords = $scope.tab.pageCoordsSync;
			$scope.tab.scale = $scope.tab.scaleSync;
		} else {
			$scope.tab.coordsSync = $scope.tab.coords;
			$scope.tab.pageCoordsSync = $scope.tab.pageCoords;
			$scope.tab.scaleSync = $scope.tab.scale;
		}
		first = false;
	});

	$scope.$on('TabUpdateScrollPage'+$scope.tab.tabIndex, function(event, message){
		if ($rootScope.sync)
			$scope.tab.pageCoords = {coords: message.coords, pageIndex: message.pageIndex};
		else
			$scope.tab.pageCoordsSync = {coords: message.coords, pageIndex: message.pageIndex};
		$scope.safeApply();
	});

	//	Zoom handler
	$scope.$on('TabUpdateScale'+$scope.tab.tabIndex, function(event, message){
		if ($rootScope.sync)
			$scope.tab.scale = message.scale;
		else
			$scope.tab.scaleSync = message.scale;
		$scope.safeApply();
	});

	//	Canvas Action handler
	$scope.$on('TabCanvasAction'+$scope.tab.tabIndex, function(event, message){
		$scope.pages[message.canvasAction.pageIndex].canvasController.onCanvasAction(message.canvasAction);
	});

	//	Annotation Action handler
	$scope.$on('TabAnnotationAction'+$scope.tab.tabIndex, function(event, message){
		$scope.pages[message.annotationAction.pageIndex].annotationController.onAnnotationAction(message.annotationAction);
	});

	//	Canvas Undo handler
	$scope.$on('TabCanvasUndo'+$scope.tab.tabIndex, function(event){
		$scope.undoCanvas();
	});

	//	Canvas Redo handler
	$scope.$on('TabCanvasRedo'+$scope.tab.tabIndex, function(event){
		$scope.redoCanvas();
	});

	//	Drawing specs
	$scope.getStrokeColor = function(){
		return $scope.$parent.strokeColor;
	}

	$scope.getStrokeSize = function(){
		return $scope.$parent.strokeSize;
	}

	$scope.getCanvasMode = function(){
		return $scope.$parent.canvasMode;
	}

	$scope.clearCanvas = function(pageIndex){
		$scope.pages[pageIndex].canvasController.requestClear();
	}

	$scope.undoCanvas = function(){
		var canvasAction = new Object();
		canvasAction.tabIndex = $scope.tab.tabIndex;
		canvasAction.type = "Undo";
		$scope.boardClient.canvasAction(canvasAction);
	}

	$scope.redoCanvas = function(){
		var canvasAction = new Object();
		canvasAction.tabIndex = $scope.tab.tabIndex;
		canvasAction.type = "Redo";
		$scope.boardClient.canvasAction(canvasAction);
	}

	$scope.screenshotPage = function(pageIndex){
		setTimeout(function(){
	        var callback = function(canvas){
	        	var download = document.createElement('a');
				download.href = canvas.toDataURL();
				download.download = $scope.tab.metadata.name+ ' page'+ (pageIndex+1) +'.png';
				download.click();
			}
	        $scope.pages[pageIndex].getScreenshot(callback);
		},0);
	}

	$scope.screenshotPageAsTab = function(pageIndex){
        var callback = function(canvas){
			var metadata = new Object();
		    metadata.sourceType = "ImageFile";
		    metadata.name = $scope.tab.metadata.name+ ' page'+ (pageIndex+1);
		    metadata.imageFile = canvas.toDataURL();
		    $scope.boardClient.newTab(metadata);
		};

	    $scope.pages[pageIndex].getScreenshot(callback);
	}

	$scope.downloadSource = function(){
		if ($scope.tab.metadata.sourceType == "PDFFile")
			$scope.downloadOriginalPDF();
		else if ($scope.tab.metadata.sourceType == "PDFLink")
			$scope.downloadPDFFromLink();
		else if ($scope.tab.metadata.sourceType == "ImageFile")
			$scope.downloadOriginalImage();
		else if ($scope.tab.metadata.sourceType == "ImageLink")
			$scope.downloadImageFromLink();
		else if ($scope.tab.metadata.sourceType == "TextFile")
			$scope.downloadOriginalText();
	}

	$scope.downloadOriginalPDF = function(){
		var download = document.createElement('a');
		download.href = $scope.tab.metadata.pdfFile;
		download.download = $scope.tab.metadata.name;
		download.click();
	}

	$scope.downloadPDFFromLink = function(){
		var win = window.open($scope.tab.metadata.pdfLink, '_blank');
  		win.focus();
	}

	$scope.downloadOriginalImage = function(){
		var download = document.createElement('a');z
		download.href = $scope.tab.metadata.imageFile;
		download.download = $scope.tab.metadata.name;
		download.click();
	}

	$scope.downloadImageFromLink = function(){
		var win = window.open($scope.tab.metadata.imageLink, '_blank');
  		win.focus();
	}

	$scope.downloadOriginalText = function(){
		var download = document.createElement('a');
		download.href = $scope.tab.metadata.textFile;
		download.download = $scope.tab.metadata.name;
		download.click();
	}


	//	Canvas Context Menu handler
	$scope.openContextMenu = function(e){
		e.stopPropagation();
		var element = e.target;
      	$scope.$broadcast('OpenContextMenu'+$scope.currentPage, 
      		{offsetX: element.offsetLeft - element.scrollWidth, offsetY: element.offsetTop-10});
	}

 });






app.directive('scrollPosition', function($rootScope, $window) {
  return function(scope, element, attrs) {

  	var scrollTimer;
    element.on('scroll', function(e){

    	//	Page
    	var y = element.scrollTop();
  		var pageNumber = 0;
  		var pageElements = element.find('.board-tab').find('.board-tab-page');

  		for (var i = 0; i < pageElements.length; i++){
  			if (pageElements[i].offsetTop <= y)
  				pageNumber = i;
  		}

  		scope.currentPage = pageNumber;

  		//	Scroll
		var coords = {'x': element.scrollLeft()/element[0].scrollWidth, 'y': element.scrollTop()/element[0].scrollHeight};
		if (!$rootScope.sync){
  			scope.safeApply();
			return;
		}

		if (scope.scrollHistory[JSON.stringify(coords)] == undefined){
			//setTimeout(function(){
			//if (scope.tab.coords.x != coords.x || scope.tab.coords.y != coords.y)
				scope.tab.coords = coords;
			scope.boardClient.updateScroll(scope.tab.tabIndex, coords);
			//},500);
		}
		else {
			scope.scrollHistory[JSON.stringify(scope.tab.coords)]--;
			if (scope.scrollHistory[JSON.stringify(scope.tab.coords)] == 0)
				delete scope.scrollHistory[JSON.stringify(scope.tab.coords)];
		}
  		scope.safeApply();
	});

    //	Watch tab dirty
    var renderQueue = [];
    scope.$watch('currentPage', function(newPage, oldPage){
    	if (oldPage == newPage)
    		return;
  		renderTab();
    });
    scope.$watch('done', function(newPage, oldPage){
    	if (scope.done)
  			renderTab();
    });
    scope.$watch('tab.scale', function(newScale, oldScale){
    	if (oldScale == newScale)
    		return;
    	resetRender();
    	renderTab();
    });
    $(window).on('resize',function(){
    	resetRender();
    	renderTab();
    });

    //	Reset render state
	function resetRender(){
		for (var i = 0; i < scope.pages.length; i++)
			if (scope.pages[i].renderState != undefined)
				delete scope.pages[i].renderState;
	}

	//	Render tab at position
	function renderTab(){
		function renderPage(pageNum){
			if (pageNum >= 0 && pageNum < scope.pages.length && scope.pages[pageNum].renderState == undefined){
				renderQueue.push(pageNum);
				scope.pages[pageNum].renderState = 'rendering';
			}
		}

		while (renderQueue.length > 0)
			delete scope.pages[renderQueue.shift()].renderState;
		renderPage(scope.currentPage);
		renderPage(scope.currentPage+1);
		renderPage(scope.currentPage+2);
		renderPage(scope.currentPage-1);
		renderPage(scope.currentPage-2);
		startRender();
	};

	//	Async render
	function startRender(){
		setTimeout(function(){
			while (renderQueue.length > 0){
				scope.$broadcast('render'+renderQueue.shift());
			}
		},0);
	}

    var counter = 0;
    var updateTimer;
    var previousCursorData = {left: -1, top: -1};
	element.on('vmousemove', function(e){
		function update(){
			scope.cursorData = {left: (e.pageX - element.offset().left -3)/element.width(), top: (e.pageY - element.offset().top-3)/element.height()};
			if (!scope.sendCursorUpdate || !$rootScope.sync)
				return;
			if (scope.cursorData.left == previousCursorData.left && scope.cursorData.top == previousCursorData.top){
				return;
			}
			scope.boardClient.updateCursor(scope.cursorData);
			previousCursorData = {left: scope.cursorData.left, top: scope.cursorData.top};
		}

		clearTimeout(updateTimer);
		updateTimer = setTimeout(update, 200);
		counter++;
		if (counter % 2 == 0)
			return;
		else
			update();
	});

	scope.$watch("tab.coords", function(newTabCoords, oldTabCoords) {
		if (!scope.done)
			return;

		//	Calibrate coords to nearest pixel
		var x = Math.floor(newTabCoords.x*element[0].scrollWidth);
		var y = Math.floor(newTabCoords.y*element[0].scrollHeight);
		if (oldTabCoords != undefined && oldTabCoords.x == newTabCoords.x && oldTabCoords.y == newTabCoords.y
			&& (Math.abs(x - element[0].scrollLeft) <1.5 && Math.abs(y - element[0].scrollTop) < 1.5))
			return;
		scope.tab.coords = {x: x/element[0].scrollWidth, y: y/element[0].scrollHeight};

		if (scope.scrollHistory[JSON.stringify(scope.tab.coords)] == undefined)
			scope.scrollHistory[JSON.stringify(scope.tab.coords)] = 1;
		else
			scope.scrollHistory[JSON.stringify(scope.tab.coords)]++;

		if (Math.abs(scope.tab.coords.x*element[0].scrollWidth - element[0].scrollLeft) > 1.5)
			element.scrollLeft(x);
		if (Math.abs(scope.tab.coords.y*element[0].scrollHeight - element[0].scrollTop) > 1.5)
			element.scrollTop(y);
	});

	scope.$watch("tab.pageCoords", function() {
		if (scope.tab.pageCoords != undefined){
			var coords = scope.tab.pageCoords.coords;
			var pageElement = element.children().eq(2).children().eq(scope.tab.pageCoords.pageIndex)[0];

			var currentTop = scope.tab.coords.y * element[0].scrollHeight;
			var currentLeft = scope.tab.coords.x * element[0].scrollWidth;
			var currentBottom = currentTop + element.height();
			var currentRight = currentLeft + element.width();

			var actionTop = pageElement.offsetTop + pageElement.scrollHeight * coords.y;
			var actionLeft = pageElement.offsetLeft + pageElement.scrollWidth * coords.x;

			if (actionTop < currentTop || actionTop > currentBottom)
				element.scrollTop(actionTop);
			if (actionLeft < currentLeft || actionLeft > currentRight)
				element.scrollLeft(actionLeft);
		} 
	});
  };
});




app.directive('boardPage', function($window) {
  return function(scope, element, attrs) {
  	scope.$watch("$parent.tab.scale", function() {
      element.resize();
    });

    var resizeTimer;
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    $(window).on('resize',function(){
    	var windowWidthCur = $(window).width();
    	var windowHeightCur = $(window).height();
    	if (windowWidthCur == windowWidth && windowHeightCur == windowHeight)
    		return;
    	windowWidth = windowWidthCur;
    	windowHeight = windowHeightCur;
    	clearTimeout(resizeTimer);
    	resizeTimer = setTimeout(function(){
    		element.resize();
    	},500);
    });


	var tab = scope.$parent.tab;
	var parent = element.parent();
	var renderingLayer = element.children().eq(0);
	var drawingLayer = element.children().eq(1);
	var annotationLayer = element.children().eq(2);
	var editorDiv = element.children().eq(3);
	var editorLayer = element.children().eq(3).children().eq(0);
	var editorCodeMirror;
	var textLayer = element.children().eq(4);
	var backgroundLayer = element.children().eq(5);
	var hiddenVideo = element.children().eq(6)[0];
	var canvasMenu = element.children().eq(7);


	var index = scope.$index;
  	var tab = scope.$parent.$parent.tab;
  	function requestCanvasAction(canvasAction){
  		canvasAction.pageIndex = index;
  		canvasAction.tabIndex = tab.tabIndex;
  		scope.boardClient.canvasAction(canvasAction);
  	}
  	scope.page.canvasController = new CanvasController(scope.tab, drawingLayer, requestCanvasAction, scope.$parent, scope.boardClient.peerId());




  	element.on('resize',function(e){
		var parentHeight = parent.parent().innerHeight()-1;
		var tabScale = tab.scale;

	  	if (tab.metadata.sourceType == "PDFLink" || tab.metadata.sourceType == "PDFFile") {
			var parentWidth = parent.parent().innerWidth()-1-getScrollBarWidth();
		  	var page = scope.$parent.pages[scope.$index].pdfpage;
		  
		  	//	Aspect fill
		  	var viewport = page.getViewport(1.0);
			var ratioHeight = parentHeight/viewport.height;
			var ratioWidth = parentWidth/viewport.width;
			var scale = tabScale*Math.max(ratioWidth, ratioHeight);
			//scale = ratioWidth;
			viewport = page.getViewport(scale);

			var pageDisplayWidth = viewport.width;
			var pageDisplayHeight = viewport.height;

		  	element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
			renderingLayer.width(pageDisplayWidth);
			renderingLayer.height(pageDisplayHeight);
		  	backgroundLayer[0].width = 0;
			backgroundLayer[0].height = 0;
		  	backgroundLayer[0].width = pageDisplayWidth;
			backgroundLayer[0].height = pageDisplayHeight;
		  	textLayer.width(pageDisplayWidth);
			textLayer.height(pageDisplayHeight);
		  	annotationLayer.width(pageDisplayWidth);
			annotationLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;

			if (page.deregisterRender != undefined)
				page.deregisterRender();
			page.deregisterRender = scope.$parent.$on('render'+scope.$index, function(){
				if (scope.pages[scope.$index].renderState != 'rendering')
					return;
				page.getTextContent().then(function (textContent) {
		            var textLayerPDF = new TextLayerBuilder({
		                textLayerDiv: textLayer.get(0),
		                pageIndex: scope.$index
		            }); 
		            textLayerPDF.setTextContent(textContent);
					
		            var renderContext = {
		                canvasContext: backgroundLayer[0].getContext('2d'),
		                viewport: viewport,
		                textLayer: textLayerPDF  	
		            };
	        		scope.page.renderState = 'rendered';
	        		scope.safeApply();
					page.render(renderContext);
	        	});
			});
	  	} else if (tab.metadata.sourceType == "Plain"){
			var parentWidth = parent.parent().innerWidth()-1;

			var pageDisplayWidth = parentWidth*tabScale;
			var pageDisplayHeight = parentHeight*tabScale;

		  	element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
		  	annotationLayer.width(pageDisplayWidth);
			annotationLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;
	        scope.page.renderState = 'rendered';
	        scope.safeApply();
	  	} else if (tab.metadata.sourceType == "ImageLink" || tab.metadata.sourceType == "ImageFile"){
			var parentWidth = parent.parent().innerWidth()-1-getScrollBarWidth();
			var image = scope.$parent.pages[scope.$index].image;
		  	
		  	var ratioHeight = parentHeight/image.height;
			var ratioWidth = parentWidth/image.width;
			var scale = Math.max(ratioWidth, ratioHeight)*tabScale;

			var pageDisplayWidth = image.width*scale;
			var pageDisplayHeight = image.height*scale;

			element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
		  	backgroundLayer[0].width = pageDisplayWidth;
			backgroundLayer[0].height = pageDisplayHeight;
		  	textLayer.width(pageDisplayWidth);
			textLayer.height(pageDisplayHeight);
		  	annotationLayer.width(pageDisplayWidth);
			annotationLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;
			backgroundLayer[0].getContext('2d').drawImage(image, 0, 0, pageDisplayWidth, pageDisplayHeight);
	        scope.page.renderState = 'rendered';
	        scope.safeApply();
	  	} else if (tab.metadata.sourceType == "TextFile"){
			var parentWidth = parent.parent().innerWidth()-1-getScrollBarWidth();
			var textFile = scope.$parent.pages[scope.$index].textFile;			

			if (editorDiv.children().eq(1) != undefined)
				editorDiv.children().eq(1).remove();

			tabScale = 0.85;	//	hard code first
			var pageDisplayWidth = parentWidth*tabScale;
			var pageDisplayHeight = parentHeight*tabScale;

			element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);

			editorLayer[0].value = textFile.data;
			editorDiv.css('font-size', (tabScale*100)+"%");
			console.log(textFile.mimetype);
			var codeMirror = CodeMirror.fromTextArea(editorLayer[0], {
				mode: textFile.mimetype,
				readOnly: true,
				lineNumbers: true,
				lineWrapping: true,
			});
			scope.$parent.pages[scope.$index].codeMirror = codeMirror;

			pageDisplayHeight = Math.max(codeMirror.getScrollInfo().clientHeight, pageDisplayHeight);
			pageDisplayWidth = Math.max(codeMirror.getScrollInfo().clientWidth, pageDisplayWidth);


			element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
		  	backgroundLayer[0].width = pageDisplayWidth;
			backgroundLayer[0].height = pageDisplayHeight;
		  	textLayer.width(pageDisplayWidth);
			textLayer.height(pageDisplayHeight);
		  	annotationLayer.width(pageDisplayWidth);
			annotationLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;

			editorCodeMirror = editorDiv.children().eq(1);
	        scope.page.renderState = 'rendered';
	        scope.safeApply();

	  	} else if (tab.metadata.sourceType == "Screenshare"){
			var page = scope.$parent.pages[scope.$index];
		  	if (scope.$parent.clientId != page.peerId){
				var parentWidth = parent.parent().innerWidth()-1;

				var ratioHeight = parentHeight/tab.metadata.size.height;
				var ratioWidth = parentWidth/tab.metadata.size.width;
				var scale = Math.max(ratioWidth, ratioHeight)*tabScale;

				var pageDisplayWidth = tab.metadata.size.width*scale;
				var pageDisplayHeight = tab.metadata.size.height*scale;
			  	
				element.width(pageDisplayWidth);
				element.height(pageDisplayHeight);
			  	backgroundLayer[0].width = pageDisplayWidth;
				backgroundLayer[0].height = pageDisplayHeight;
			  	textLayer.width(pageDisplayWidth);
				textLayer.height(pageDisplayHeight);
			  	annotationLayer.width(pageDisplayWidth);
				annotationLayer.height(pageDisplayHeight);
			  	drawingLayer[0].width = pageDisplayWidth;
				drawingLayer[0].height = pageDisplayHeight;

				var context = backgroundLayer[0].getContext('2d');
				if (page.streamSrc[page.peerId] != undefined)
					hiddenVideo.src = page.streamSrc[page.peerId].url;

			  	hiddenVideo.play();
				function draw() {
			    	try {
			    		if (hiddenVideo.src == undefined || hiddenVideo.src.length == 0){
			    			hiddenVideo.src = page.streamSrc[page.peerId].url;
			    			hiddenVideo.play();
			    		}
			    		else
			      			context.drawImage(hiddenVideo, 0, 0, pageDisplayWidth, pageDisplayHeight);
			    	} catch (e) {
			    	}
					requestAnimationFrame(draw);
					hiddenVideo.play();
			  	}

				requestAnimationFrame(draw);
		        scope.page.renderState = 'rendered';
		        scope.safeApply();
	    	}
	  	}

	  	//	Setup canvas init data
  		if (tab.canvasData[scope.$index] == undefined)
  			tab.canvasData[scope.$index] = {actions: []};
  		
  		scope.page.canvasController.setCanvasData(tab.canvasData[scope.$index]);
  		scope.page.canvasController.redraw();

  		if (tab.annotationData[scope.$index] == undefined)
  			tab.annotationData[scope.$index] = {};
  		scope.page.annotationController.setAnnotationData(tab.annotationData[scope.$index]);


  		//	Set scroll for parent
  		setTimeout(function(){
  			if (scope.$index == scope.$parent.pages.length-1){
  				scope.$parent.done = true;
	  			scope.tab.coords = {x:scope.tab.coords.x, y:scope.tab.coords.y};
	  			scope.$parent.$digest();
	  		}
	  	},0);
  		
	});

	//	Context menu
	function hideHandler(e){
		if (canvasMenu.css('display') == 'none')
			return;
		canvasMenu.hide();
		$(document).unbind('click', this);
		drawingLayer.focus();
	}

  	function openContextMenu(e){
  		if (e.stopPropagation != undefined){
  			e.stopPropagation();
  			e.preventDefault();
  		}

  		if (!canvasMenu.is(':hidden')){
  			canvasMenu.hide();
  			return false;
  		}

  		var left, top;
  		if (e.stopPropagation != undefined){
			left = element[0].offsetLeft + e.offsetX;
			top = element[0].offsetTop +e.offsetY;
		} else {
			left = element.parent().parent().scrollLeft() + e.offsetX;
			top = element.parent().parent().scrollTop() +e.offsetY;
		}
		left = Math.min(left, element.offset().left + element.width() - canvasMenu.width() + element.parent().parent().scrollLeft()-20);
		top = Math.min(top, element.offset().top + element.height() - canvasMenu.height() 
				+ element.parent().parent().scrollTop()-element.parent().parent().offset().top-20);

		canvasMenu.css({display: 'block', left: left, top: top});

		$(document).click(hideHandler);
		return false;
	}

	canvasMenu.on('click', 'a', function(e){
		hideHandler(e);
	});


	drawingLayer.on('contextmenu', openContextMenu);
	textLayer.on('contextmenu', openContextMenu);
	backgroundLayer.on('contextmenu', openContextMenu);
	annotationLayer.on('contextmenu', openContextMenu);
	editorDiv.on('contextmenu', openContextMenu);
	if (editorCodeMirror != undefined)
		editorCodeMirror.on('contextmenu', openContextMenu);

    scope.$parent.$on('OpenContextMenu'+scope.$index, function(event, e){
      	openContextMenu(e);
    });

	scope.$parent.pages[scope.$index].getScreenshot = function(callback){
		var canvas = document.createElement("canvas");
		var canvasContext = canvas.getContext('2d');

		var backgroundCanvas = element.children().eq(4)[0];
		var drawingCanvas = element.children().eq(0)[0];
		var annotationLayer = element.children().eq(1)[0];
		var editorDiv = element.children().eq(2)[0];
		

		var ssTextFile = function(editorCanvas){
			html2canvas(annotationLayer, {
			    onrendered: function(c) {
			    	var annotationCanvas = c;

			    	// Get the CanvasPixelArray from the given coordinates and dimensions.
					var imgd = c.getContext('2d').getImageData(0, 0, c.width, c.height);
					var pix = imgd.data;

					// Loop over each pixel and invert the color.
					for (var i = 0, n = pix.length; i < n; i += 4) 
					    if (pix[i] >= 255 && pix[i+1] >= 255 && pix[i+2] >= 255)
					    	pix[i+3] = 0;


					// Draw the ImageData at the given (x,y) coordinates.
					c.getContext('2d').putImageData(imgd, 0, 0);

			    	canvas.width = drawingCanvas.width;
					canvas.height = drawingCanvas.height;
					canvasContext.fillStyle="#FFFFFF";
					canvasContext.fillRect(0, 0, canvas.width, canvas.height);
					canvasContext.drawImage(backgroundCanvas, 0, 0);
					if (editorCanvas != undefined)
						canvasContext.drawImage(editorCanvas, 0, 0);
					canvasContext.drawImage(annotationCanvas, 0, 0);
					canvasContext.drawImage(drawingCanvas, 0, 0);
					callback(canvas);
			    },
			    width: drawingCanvas.width,
			    height: drawingCanvas.height,
			    background: '#ffffff',
			});
		}
		
		if (tab.metadata.sourceType == "TextFile"){
			element.parent().parent()[0].scrollTop = 0;
			element.parent().parent()[0].scrollLeft = 0;
		

			html2canvas(editorDiv, {
			    onrendered: function(editorc) {
			    	var editorCanvas = editorc;
			
					ssTextFile(editorCanvas);
				},
				width: drawingCanvas.width,
				height: drawingCanvas.height+1000,
				background: '#ffffff',
			});
		} else {
			ssTextFile(undefined);
		}
	}
}});



angular.module('truncateFilter', []).filter('truncate', function () {
    return function (text, length, end) {
        if (isNaN(length))
            length = 10;

        if (end === undefined)
            end = "...";

        if (text.length <= length || text.length - end.length <= length) {
            return text;
        }
        else {
            return String(text).substring(0, length-end.length) + end;
        }

    };

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
});


function getScrollBarWidth () {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild (inner);

  document.body.appendChild (outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild (outer);

  return (w1 - w2);
};