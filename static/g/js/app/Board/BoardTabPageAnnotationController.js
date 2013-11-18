app.controller('BoardTabPageAnnotationController', function($scope, $rootScope){
	$scope.$parent.page.annotationController = $scope;
	$scope.annotations = {};
	$scope.editingIndex = undefined;
  	$scope.boardClient = $scope.$parent.boardClient;
  	$scope.toolDataSource = $scope.$parent.$parent;
  	var pageIndex = $scope.$parent.$index;
  	var tabIndex = $scope.$parent.$parent.$parent.tab.tabIndex;

	$scope.setAnnotationData = function(annotations){
		$scope.annotations = annotations;
	}


	function requestAnnotationAction(annotationAction){
  		annotationAction.pageIndex = pageIndex;
  		annotationAction.tabIndex = tabIndex;
  		$scope.boardClient.annotationAction(annotationAction);
  	}


  	$scope.getStyle = function(annotation){
  		var style =  {color: annotation.color, 'font-size': (annotation.fontSize*$scope.fontFactor.width()/1000*100)+'%', width: (annotation.size.width*100)+'%', 
  		height: (annotation.size.height*100)+'%', left: (annotation.coords.x*100)+'%', top: (annotation.coords.y*100)+'%'};
  
  		if (annotation.editing != undefined)
  			style['border'] = '0.2em solid '+$rootScope.users[annotation.editing].color;
  		return style;
  	}

  	$scope.getCloseStyle = function(annotation){
  		return {left: (annotation.coords.x*100+annotation.size.width*100)+'%', top: (annotation.coords.y*100)+'%'};
  	}


  	$scope.onAnnotationAction = function(annotationAction){
  		if (annotationAction.type == "AddAnnotation")
  			$scope.onAddAnnotation(annotationAction);
  		else if (annotationAction.type == "BeginUpdateAnnotation")
  			$scope.onBeginUpdateAnnotation(annotationAction);
  		else if (annotationAction.type == "UpdateAnnotation")
  			$scope.onUpdateAnnotation(annotationAction);
  		else if (annotationAction.type == "DeleteAnnotation")
  			$scope.onDeleteAnnotation(annotationAction);
  		else if (annotationAction.type == "SetColor")
  			$scope.onSetColor(annotationAction);
  		else if (annotationAction.type == "SetFontSize")
  			$scope.onSetFontSize(annotationAction);
  		else if (annotationAction.type == "SetSize")
  			$scope.onSetSize(annotationAction);
  		else if (annotationAction.type == "SetCoords")
  			$scope.onSetCoords(annotationAction);
  	}

	/*	Methods */
	$scope.addAnnotation = function(event){
		if ($scope.editingIndex != undefined || $scope.toolDataSource.canvasMode != 'text')
			return;
		var x = (event.offsetX-10)/event.target.clientWidth;
		var y = (event.offsetY-10)/event.target.clientHeight;
		var annotationAction = new Object();
		annotationAction.type = "AddAnnotation";
		annotationAction.peerId = $scope.boardClient.peerId()

		annotationAction.annotation = new Object();
		annotationAction.annotation.coords = {x: x, y: y};
		annotationAction.annotation.color = $scope.toolDataSource.strokeColor;
		annotationAction.annotation.fontSize = $scope.toolDataSource.fontSize;	//	To change
		annotationAction.annotation.size = {width: 0.15, height: 0.1};
		annotationAction.annotation.text = "";
		annotationAction.annotation.editing = $scope.boardClient.peerId();

		requestAnnotationAction(annotationAction);
	}

	$scope.beginUpdateAnnotation = function(annotationIndex){
		if ($scope.editingIndex != undefined)
			return;
		var annotationAction = new Object();
		annotationAction.type = "BeginUpdateAnnotation";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.peerId = $scope.boardClient.peerId()
		requestAnnotationAction(annotationAction);
	}

	$scope.updateAnnotation = function(annotationIndex, text){
		if ($scope.editingIndex != annotationIndex)
			return;
		var annotationAction = new Object();
		annotationAction.type = "UpdateAnnotation";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.text = text;
		annotationAction.peerId = $scope.boardClient.peerId()
		requestAnnotationAction(annotationAction);

		$scope.editingIndex = undefined;
	}


	$scope.deleteAnnotation = function(annotationIndex){
		var annotationAction = new Object();
		annotationAction.type = "DeleteAnnotation";
		annotationAction.annotationIndex = annotationIndex;
		requestAnnotationAction(annotationAction);
	}


	$scope.setAnnotationColor = function(annotationIndex, color){
		var annotationAction = new Object();
		annotationAction.type = "SetColor";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.color = color;
		requestAnnotationAction(annotationAction);
	}

	$scope.setAnnotationSize = function(annotationIndex, width, height){ 
		var annotationAction = new Object();
		annotationAction.type = "SetSize";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.size = {width:width, height:height};
		requestAnnotationAction(annotationAction);
	}

	$scope.setAnnotationFontSize = function(annotationIndex, fontSize){
		var annotationAction = new Object();
		annotationAction.type = "SetFontSize";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.fontSize = fontSize;
		requestAnnotationAction(annotationAction);
	}

	$scope.setAnnotationCoords = function(annotationIndex, coords){
		var annotationAction = new Object();
		annotationAction.type = "SetCoords";
		annotationAction.annotationIndex = annotationIndex;
		annotationAction.coords = coords;
		requestAnnotationAction(annotationAction);
	}


	/*	Events	*/
	$scope.onAddAnnotation = function(annotationAction){
		$scope.annotations[annotationAction.annotation.annotationIndex] = annotationAction.annotation;

		$scope.$apply();
		if (annotationAction.peerId == $scope.boardClient.peerId()){
			$scope.editingIndex = annotationAction.annotationIndex;
      		$scope.$broadcast('EditAnnotation'+annotationAction.annotationIndex);
      	}
	}

	$scope.onBeginUpdateAnnotation = function(annotationAction){
		$scope.annotations[annotationAction.annotationIndex].editing = annotationAction.peerId;
		if (annotationAction.peerId == $scope.boardClient.peerId()){
			$scope.editingIndex = annotationAction.annotationIndex;
      		$scope.$broadcast('EditAnnotation'+annotationAction.annotationIndex);
      	}
		$scope.$apply();
	}

	$scope.onUpdateAnnotation = function(annotationAction){
		if ($scope.annotations[annotationAction.annotationIndex].text != annotationAction.text)
      		$rootScope.notify();
		$scope.annotations[annotationAction.annotationIndex].text = annotationAction.text;
		$scope.annotations[annotationAction.annotationIndex].editing = undefined;
		//	Trigger resize
		if (annotationAction.peerId == $scope.boardClient.peerId())
			$scope.editingIndex = undefined;
		$scope.$apply();
	}

	$scope.onDeleteAnnotation = function(annotationAction){
		delete $scope.annotations[annotationAction.annotationIndex];
		$scope.$apply();
	}

	$scope.onSetColor = function(annotationAction){
		$scope.annotations[annotationAction.annotationIndex].color = annotationAction.color;
		$scope.$apply();
	}

	$scope.onSetSize = function(annotationAction){
		$scope.annotations[annotationAction.annotationIndex].size = annotationAction.size;
		$scope.$apply();
	}

	$scope.onSetFontSize = function(annotationAction){
		$scope.annotations[annotationAction.annotationIndex].fontSize = annotationAction.fontSize;
		$scope.$apply();
	}

	$scope.onSetCoords = function(annotationAction){
		$scope.annotations[annotationAction.annotationIndex].coords = annotationAction.coords;
		$scope.$apply();
	}



});


app.directive('annotation', function($window) {
  return function(scope, element, attrs) {
  	
  	scope.editing = false;
  	var originalText;

    scope.$on('EditAnnotation'+scope.annotationIndex, function(event){
    	scope.editing = true;
    	scope.$apply();
    	element.focus();
    	element.select();
    	originalText = scope.$parent.annotations[scope.annotationIndex].text;
    });

    element.on('keydown', function(e){
    	if (!scope.editing)
    		return;

		if (e.which != 27)
			return;
    	
		element.val(originalText);
		element.parent().parent().trigger('click');
	})

	element.parent().parent().on('click', function(e){
		if (!scope.editing)
			return;

		if (e.which != 1 && e.which != 0)
			return;

		scope.$parent.updateAnnotation(scope.annotationIndex, element.val());
		scope.editing = undefined;
	});

	scope.$watch('$parent.toolDataSource.strokeColor', function(){
		if (!scope.editing)
			return;
		scope.$parent.setAnnotationColor(scope.annotationIndex, scope.$parent.toolDataSource.strokeColor);
	});

	scope.$watch('$parent.toolDataSource.fontSize', function(){
		if (!scope.editing)
			return;
		scope.$parent.setAnnotationFontSize(scope.annotationIndex, scope.$parent.toolDataSource.fontSize);
	});

	scope.$watch('$parent.toolDataSource.canvasMode', function(){
		if (!scope.editing)
			return;
		if (scope.$parent.toolDataSource.canvasMode != 'select')
			element.parent().parent().trigger('click');
	});


    element.on('scroll', function(){
    	if (element.scrollTop() == 1000000 && element.scrollLeft() == 1000000)
    		return;
    	element.scrollTop(1000000);
    	element.scrollLeft(1000000);
    })

    scope.$parent.fontFactor = element.parent();



    var oldX, oldY
  	var dragging = false, moved = false;

	element.on('vmousedown', function(e){

  		dragging = true; 
  		moved = false
		oldX = e.pageX;
		oldY = e.pageY;
	});

	$(window).on('vmousemove', function(e){
		if (!dragging)
			return false;

		var changeX = e.pageX - oldX;
		var changeY = e.pageY - oldY;

		scope.annotation.coords.x = scope.annotation.coords.x + changeX/element.parent().width();
		scope.annotation.coords.y = scope.annotation.coords.y + changeY/element.parent().height();

		scope.$apply();

		oldX = e.pageX;
		oldY = e.pageY;
		moved = true;
	});

	element.on('vmouseup vmouseout',function(e){
		dragging = false;

		if (!moved && !scope.editing){
			scope.$parent.beginUpdateAnnotation(scope.annotationIndex);
			return;
		}

		//	Set size
        if(this.oldwidth  === null){this.oldwidth  = element.outerWidth();}
        if(this.oldheight === null){this.oldheight = element.outerHeight();}
        if(element.outerWidth() != this.oldwidth || element.outerHeight() != this.oldheight){
			scope.$parent.setAnnotationSize(scope.annotationIndex, element.outerWidth()/element.parent().width(), 
				element.outerHeight()/element.parent().height());
            this.oldwidth  = element.outerWidth();
            this.oldheight = element.outerHeight();
        }
        
		scope.$parent.setAnnotationCoords(scope.annotationIndex, scope.annotation.coords); 
		scope.$apply();
    });


    element.on('click', function(e){
    	e.stopPropagation();
    });

    element.on('contextmenu', function(e){
    	e.stopPropagation();
    });
  }
});


