//  Controller for Board
app.controller('BoardController', function($scope, $rootScope){
  	$scope.tabs = {};
  	$scope.tabsArray = [];
  	$scope.currentTabIndex = "";
		$scope.boardClient.setDelegate($scope);
    $scope.cursors = {};
    $scope.colors = ['#1abc9c', '#3498db', '#9b59b6', '#c0392b', '#d35400', '#34495e'];
    $scope.colorIndex = 0;
    $scope.sendCursorUpdate = true;
    $scope.showToolbar = true;
    $scope.toolbarElement;

    //  Board state
    $scope.strokeSize = 2;
    $scope.strokeColors = ['#2980b9','#8e44ad','#c0392b', '#27ae60', '#ffff00', '#34495e', '#000000', '#ffffff'];
    $scope.strokeColor = '#000000';
    $scope.canvasMode = 'marker'; //  marker, eraser, select, highlighter
    

    //  Public methods for menu
    $scope.$on('OpenPDFLink', function(event, message){
      $scope.addPDFTab(message);
    });

    $scope.$on('UploadPDF', function(event, message){
      $scope.uploadPDFTab(message);
    });

    $scope.$on('OpenImageLink', function(event, message){
      $scope.addImageTab(message);
    });

    $scope.$on('UploadImage', function(event, message){
      $scope.uploadImageTab(message);
    });

    $scope.$on('NewPlainBoard', function(event, message){
      $scope.addPlainTab();
    });

    $scope.$on('Screenshare', function(event, message){
      $scope.addScreenshareTab();
    });

    $scope.toggleToolbar = function(){
        $scope.showToolbar = !$scope.showToolbar;  
        if ($scope.showToolbar)
          $scope.toolbarElement.slideDown('fast');
        else
          $scope.toolbarElement.slideUp('fast');
    }

    $scope.toggleCanvasMode = function(mode){
        $scope.canvasMode = mode;

        if ($scope.canvasMode == 'highlighter'){
            $scope.strokeSize = 20;
            $scope.strokeColor = '#ffff00'
        }
    }

    $scope.setStrokeColor = function(color){
      $scope.strokeColor = color;
    }

    $scope.getStrokeColor = function (color) {
      if ($scope.canvasMode == 'marker' || $scope.canvasMode == 'highlighter')
        return { color: color};
      else
        return {color:color, opacity: 0.5};
    }

    $scope.setStrokeSize = function(size){
      $scope.strokeSize = size;
    }

    //  Internal methods
  	$scope.addPlainTab = function(){
  		var metadata = new Object();
  		metadata.sourceType = "Plain";
  		$scope.boardClient.newTab(metadata);
  	}

    $scope.addPDFTab = function(link){
      var metadata = new Object();
      metadata.sourceType = "PDFLink";
      metadata.pdfLink = link;
      metadata.name = link.slice(link.lastIndexOf('/')+1, link.length);
      $scope.boardClient.newTab(metadata);
    }

    $scope.uploadPDFTab = function(file){
      var metadata = new Object();
      metadata.sourceType = "PDFFile";
      metadata.name = file.name.slice(file.name.lastIndexOf('/')+1, file.name.length);
      readFile(file, function(data){
          metadata.pdfFile = data;
          $scope.boardClient.newTab(metadata);
      });
    }

    $scope.addImageTab = function(link){
      var metadata = new Object();
      metadata.sourceType = "ImageLink";
      metadata.imageLink = link;
      metadata.name = link.slice(link.lastIndexOf('/')+1, link.length);
      $scope.boardClient.newTab(metadata);
    }

    $scope.uploadImageTab = function(file){
      var metadata = new Object();
      metadata.sourceType = "ImageFile";
      metadata.name = file.name.slice(file.name.lastIndexOf('/')+1, file.name.length);
      readFile(file, function(data){
          metadata.imageFile = data;
          $scope.boardClient.newTab(metadata);
      });
    }

    $scope.addScreenshareTab = function(){
      $scope.boardClient.screenshare();
    }

  	$scope.switchTab = function(tabIndex){
  		$scope.boardClient.switchTab(tabIndex);
  	}

  	$scope.closeTab = function(tabIndex){
  		var pos = $scope.tabsArray.indexOf($scope.tabs[tabIndex]);
      if (pos > 0)
        $scope.switchTab($scope.tabsArray[pos-1].tabIndex);
      else if (pos < $scope.tabsArray.length-1)
        $scope.switchTab($scope.tabsArray[pos+1].tabIndex);
  		$scope.boardClient.closeTab(tabIndex);

      if ($scope.tabsArray.length == 0)
        $scope.addPlainTab();
  	}

    $scope.zoomIn = function(){
      $scope.boardClient.updateScale($scope.currentTabIndex, Math.min($scope.tabs[$scope.currentTabIndex].scale + 0.25,4));
    }

    $scope.zoomOut = function(){
      $scope.boardClient.updateScale($scope.currentTabIndex, Math.max($scope.tabs[$scope.currentTabIndex].scale - 0.25,0.5));
    }

    $scope.undoCanvas = function(){
      $scope.$broadcast('TabCanvasUndo'+$scope.currentTabIndex);
    }

    $scope.redoCanvas = function(){
      $scope.$broadcast('TabCanvasRedo'+$scope.currentTabIndex);
    }

  	//	Events and Messages
  	$scope.onNewTab = function(message){
  		var tab = new Object();
  		tab.metadata = message.metadata;
  		tab.canvasData = new Object();
      tab.tabIndex = message.tabIndex;
      tab.coords = message.coords;
      tab.scale = message.scale;
  		$scope.tabs[message.tabIndex] = tab;
  		$scope.tabsArray.push(tab);
      currentTabIndex = tab.tabIndex;
      $scope.currentTabIndex = message.tabIndex;

      if ($scope.tabs[message.tabIndex].metadata.sourceType == 'Screenshare' && 
        $scope.tabs[message.tabIndex].metadata.peerId == $scope.boardClient.peerId()){
        $scope.boardClient.startScreenshare();
      }

  		$scope.$apply();
  	}

  	$scope.onSwitchTab = function(message){
  		$scope.currentTabIndex = message.tabIndex;
  		$scope.$apply();
  	}

  	$scope.onCloseTab = function(message){
  		$scope.tabsArray.splice($scope.tabsArray.indexOf($scope.tabs[message.tabIndex]), 1);
      if ($scope.tabs[message.tabIndex].metadata.sourceType == 'Screenshare' && 
        $scope.tabs[message.tabIndex].metadata.peerId == $scope.boardClient.peerId()){
        $scope.boardClient.endScreenshare();
      }
  		delete $scope.tabs[message.tabIndex];
  		$scope.$apply();
  	}

    $scope.onUpdateScroll = function(message){
      $scope.$broadcast('TabUpdateScroll'+message.tabIndex, message);
    }

    $scope.onUpdateScrollPage = function(message){
      $scope.$broadcast('TabUpdateScrollPage'+message.tabIndex, message);
    }

    $scope.onUpdateScale = function(message){
      $scope.$broadcast('TabUpdateScale'+message.tabIndex, message);
    }

    $scope.onUpdateCursor = function(message){
      if (message.peerId in $scope.cursors) {
        $scope.cursors[message.peerId].position = message.cursorData;
      } else {
        $scope.cursors[message.peerId] = {position: message.cursorData, color: $scope.colors[$scope.colorIndex]};
        $scope.colorIndex++;
      }
      $scope.$apply();
    }

    $scope.onCursorRemoved = function(message){
      if (message.peerId in $scope.cursors)
        delete $scope.cursors[message.peerId];
      $scope.$apply();
    }

    $scope.onCanvasAction = function(message){
      $scope.$broadcast('TabCanvasAction'+message.canvasAction.tabIndex, message);
    }


    $scope.onInit = function(message){
      $scope.tabs = message.data.tabs;
      $scope.currentTabIndex = message.data.currentTabIndex;

      //  Rebuild tabsArray
      var tabArrayIndex = [];
      for(var key in $scope.tabs)
        tabArrayIndex.push(key);
      tabArrayIndex.sort(function(a,b){return parseInt(a)-parseInt(b)});

      for (var i = 0; i < tabArrayIndex.length; i++)
        $scope.tabsArray.push($scope.tabs[tabArrayIndex[i]]);
      $scope.$apply();
    }

    $scope.getScreenshareUrl = function(tab){
      return $scope.boardClient.screenStreams[tab.metadata.peerId].url;
    }

    var readFile = function(file, callback){
      var reader;
      if (window.FileReader) {  
          reader = new FileReader();
          reader.onloadend = function(e){
              callback(e.target.result);  
          }; 
          reader.readAsDataURL(file);
          console.log("reading "+file.name);
      }
    }
  });




app.directive('boardMain', function($window) {
  return function(scope, element, attrs) {
    $(window).on('keydown',function(e){
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.keyCode == 90){
        scope.$broadcast('TabCanvasUndo'+scope.currentTabIndex);
      } 
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode == 90){
        scope.$broadcast('TabCanvasRedo'+scope.currentTabIndex);
      } 
    });
  }
});

app.directive('cursorPosition', function($window) {
  return function(scope, element, attrs) {
    //  Set color
    element.css('background-color', scope.cursor.color);
    
    //  Set listener
    scope.$watch("cursor.position", function() {
      var top = scope.cursor.position.top*element.parent().height() + element.parent().offset().top;
      var left = scope.cursor.position.left*element.parent().width() + element.parent().offset().left;
      element.offset({top: top, left:left});
    });
  };
});



app.directive('onChangePdfFile', function($window) {
  return function(scope, element, attrs) {
    element.on('change',function(){
      scope.uploadPDF(element[0].files[0]);
    });
  };
});


app.directive('onChangeImageFile', function($window) {
  return function(scope, element, attrs) {
    element.on('change',function(){
      scope.uploadImage(element[0].files[0]);
    });
  };
});


app.directive('boardToolbar', function($window) {
  return function(scope, element, attrs) {
    scope.toolbarElement = element;
  };
});


function base64ToUint8Array(base64) {
    var raw = atob(base64); //This is a native function that decodes a base64-encoded string.
    var uint8Array = new Uint8Array(new ArrayBuffer(raw.length));
    for (var i = 0; i < raw.length; i++) {
        uint8Array[i] = raw.charCodeAt(i);
    }

    return uint8Array;
}