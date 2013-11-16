app.controller('BoardTabController', function($scope,$rootScope) {
  	$scope.tab;	//	from parent
  	$scope.lastScrollTime = 0;
  	$scope.boardClient = $scope.$parent.boardClient;
  	$scope.pages = [];
  	$scope.done = false;
    $scope.cursorData;
    $scope.sendCursorUpdate;
    $scope.currentPage = 0;

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
		    	$scope.boardClient.closeTab(tab.tabIndex);
				$rootScope.showErrorAlert("Unable to download image", "The website hosting the image link could have blocked us :/");
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
		if (message.scrollTime > $scope.lastScrollTime){
			$scope.tab.coords = message.coords;
			$scope.$digest();
		}
	});

	$scope.$on('TabUpdateScrollPage'+$scope.tab.tabIndex, function(event, message){
		$scope.tab.pageCoords = {coords: message.coords, pageIndex: message.pageIndex};
		$scope.$digest();
	});

	//	Zoom handler
	$scope.$on('TabUpdateScale'+$scope.tab.tabIndex, function(event, message){
		$scope.tab.scale = message.scale;
		$scope.$digest();
	});

	//	Canvas Action handler
	$scope.$on('TabCanvasAction'+$scope.tab.tabIndex, function(event, message){
		$scope.pages[message.canvasAction.pageIndex].canvasController.onCanvasAction(message.canvasAction);
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
	        var canvas = $scope.pages[pageIndex].getScreenshot();
	        var download = document.createElement('a');
			download.href = canvas.toDataURL();
			download.download = $scope.tab.metadata.name+ ' page'+ (pageIndex+1) +'.png';
			download.click();
		},0);
	}

	$scope.screenshotPageAsTab = function(pageIndex){
        var canvas = $scope.pages[pageIndex].getScreenshot();
		var metadata = new Object();
	    metadata.sourceType = "ImageFile";
	    metadata.name = $scope.tab.metadata.name+ ' page'+ (pageIndex+1);
	    metadata.imageFile = canvas.toDataURL();
	    $scope.boardClient.newTab(metadata);
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

	//	Canvas Context Menu handler
	$scope.openContextMenu = function(e){
		e.stopPropagation();
		var element = e.target;
      	$scope.$broadcast('OpenContextMenu'+$scope.currentPage, 
      		{offsetX: element.offsetLeft - element.scrollWidth, offsetY: element.offsetTop-10});
	}

 });






app.directive('scrollPosition', function($window) {
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
		var time = new Date().getTime();
		if (time > scope.lastScrollTime){
			scope.lastScrollTime = time;
			if (scrollTimer != undefined)
				clearTimeout(scrollTimer);
			scrollTimer = setTimeout(function(){
				var coords = {'x': element.scrollLeft()/element[0].scrollWidth, 'y': element.scrollTop()/element[0].scrollHeight};
				scope.boardClient.updateScroll(scope.tab.tabIndex, coords);
			}, 200);
		}
	});

    var counter = 0;
    var updateTimer;
	element.on('vmousemove', function(e){
		function update(){
			scope.cursorData = {left: (e.pageX - element.offset().left -3)/element.width(), top: (e.pageY - element.offset().top-3)/element.height()};
			if (!scope.sendCursorUpdate)
				return;
			scope.boardClient.updateCursor(scope.cursorData);
		}

		clearTimeout(updateTimer);
		updateTimer = setTimeout(update, 200);
		counter++;
		if (counter % 2 != 0)
			return;
		else
			update();
	});


	scope.$watch("tab.coords", function() {
		if (scope.tab.coords != undefined && Math.abs(element.scrollLeft() - scope.tab.coords.x*element[0].scrollWidth) + Math.abs(element.scrollTop() - scope.tab.coords.y*element[0].scrollHeight)> 2){
			element.scrollLeft(scope.tab.coords.x*element[0].scrollWidth);
			element.scrollTop(scope.tab.coords.y*element[0].scrollHeight);
		} 
	});

	scope.$watch("tab.pageCoords", function() {
		if (scope.tab.pageCoords != undefined){
			var coords = scope.tab.pageCoords.coords;
			var pageElement = element.children().eq(1).children().eq(scope.tab.pageCoords.pageIndex)[0];

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
    	clearTimeout(resizeTimer);
    	resizeTimer = setTimeout(function(){
    		element.resize();
    	},500);
    });


	var tab = scope.$parent.tab;
	var parent = element.parent();
	var drawingLayer = element.children().eq(0);
	var textLayer = element.children().eq(1);
	var backgroundLayer = element.children().eq(2);
	var hiddenVideo = element.children().eq(3)[0];
	var canvasMenu = element.children().eq(4);


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
		  	backgroundLayer[0].width = pageDisplayWidth;
			backgroundLayer[0].height = pageDisplayHeight;
		  	textLayer.width(pageDisplayWidth);
			textLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;

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
				page.render(renderContext);
        	});
	  	} else if (tab.metadata.sourceType == "Plain"){
			var parentWidth = parent.parent().innerWidth()-1;

			var pageDisplayWidth = parentWidth*tabScale;
			var pageDisplayHeight = parentHeight*tabScale;

		  	element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;
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
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;
			backgroundLayer[0].getContext('2d').drawImage(image, 0, 0, pageDisplayWidth, pageDisplayHeight);
	  	} else if (tab.metadata.sourceType == "Screenshare"){
			var parentWidth = parent.parent().innerWidth()-1;

			var pageDisplayWidth = parentWidth*tabScale;
			var pageDisplayHeight = parentHeight*tabScale;

		  	
			element.width(pageDisplayWidth);
			element.height(pageDisplayHeight);
		  	backgroundLayer[0].width = pageDisplayWidth;
			backgroundLayer[0].height = pageDisplayHeight;
		  	textLayer.width(pageDisplayWidth);
			textLayer.height(pageDisplayHeight);
		  	drawingLayer[0].width = pageDisplayWidth;
			drawingLayer[0].height = pageDisplayHeight;

			var context = backgroundLayer[0].getContext('2d');
		  	var page = scope.$parent.pages[scope.$index];
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
		  	}
			requestAnimationFrame(draw);
	  	}

	  	//	Setup canvas init data
  		if (tab.canvasData[scope.$index] == undefined)
  			tab.canvasData[scope.$index] = {actions: []};
  		
  		scope.page.canvasController.setCanvasData(tab.canvasData[scope.$index]);
  		scope.page.canvasController.redraw();

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


    scope.$parent.$on('OpenContextMenu'+scope.$index, function(event, e){
      	openContextMenu(e);
    });

	scope.$parent.pages[scope.$index].getScreenshot = function(){
		var canvas = document.createElement("canvas");
		var canvasContext = canvas.getContext('2d');

		var backgroundCanvas = element.children().eq(2)[0];
		var drawingCanvas = element.children().eq(0)[0];

		canvas.width = drawingCanvas.width;
		canvas.height = drawingCanvas.height;
		canvasContext.fillStyle="#FFFFFF";
		canvasContext.fillRect(0, 0, canvas.width, canvas.height);
		canvasContext.drawImage(backgroundCanvas, 0, 0);
		canvasContext.drawImage(drawingCanvas, 0, 0);
		return canvas;
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