//	Controller for Chat
app.controller('ChatController', function($scope, $rootScope){
	$scope.showChatWidget = true;
	$scope.chatHistory = [];
	$scope.scrollDiv;
	$rootScope.chatClient.setDelegate($scope);
	$scope.badgeCount = 0;
	$scope.originSize;
	$scope.text;


	$scope.toggleShowChatWidget = function(){
		$scope.showChatWidget = !$scope.showChatWidget;
		$scope.badgeCount = 0;
	}

	$scope.sendChat = function(){
        if ($scope.text.length == 0)
            return;
		$scope.chatClient.sendChat($scope.text);
		$scope.text = "";
		$scope.safeApply();
	}


	//	Message handlers
	$scope.onNewChat = function(message){
		var autoScroll = false;
		if ($scope.scrollDiv[0].scrollTop + $scope.scrollDiv.height() + 50> $scope.scrollDiv[0].scrollHeight || $scope.scrollDiv.is('animated'))
			autoScroll = true;

		$scope.chatHistory.push(message);
		if (!$scope.showChatWidget)
			$scope.badgeCount++;
		$scope.safeApply(function(){
			setTimeout(function(){
				if (autoScroll){
					$scope.scrollDiv.animate({
		        		scrollTop: $scope.scrollDiv[0].scrollHeight
		        	}, 200);
				}
			},0);
		});
        $rootScope.notify();
	}

	$scope.onInit = function(message){
		$scope.chatHistory = message.history;
		$scope.safeApply();
	}

	
	//	Date refresh
	var updateChatTimestamp = function(){
		$scope.$digest();
		setTimeout(updateChatTimestamp, 60000 - (new Date().getTime())%60000);
	}
	setTimeout(updateChatTimestamp, 0);


	//	Export Chat history
	$scope.exportChatHistory = function(){
		var logs = "";
		var users = $rootScope.users;
		for (var i in $scope.chatHistory){
			var message = $scope.chatHistory[i];
			logs += (new Date(message.timestamp)).toString() + ", "+users[message.peerId].name + ": "+ message.text + "\n";
		}
		return logs;
	}

    $scope.$on('DownloadChat', function(event){
        var log = $scope.exportChatHistory();
        saveTextAsFile($rootScope.serverPeerId + " at "+ new Date() + '.txt', log);
    });

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


app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});


app.directive('chatScroll', function() {
    return function(scope, element, attrs) {
        scope.scrollDiv = element;
        setTimeout(function(){
        	element[0].scrollTop = element[0].scrollHeight - element.height()
        },1000);
    };
});




app.directive('chatInput', function() {
    return function(scope, element, attrs) {
        element.on('keydown', function(e){
        	if (e.which == 13 && !e.shiftKey) {
              	scope.sendChat();
              	e.preventDefault();
            }
        });
    };
});


app.directive('topLeftResizer', function() {
    return function(scope, element, attrs) {
        var parent = element.parent();
        var content = parent.find('.chat-widget-content');
        var xShift = false, yShift = false;

        if (element.hasClass('chat-topLeft-resizer')){
        	xShift = true;
        	yShift = true;
        } else if (element.hasClass('chat-left-resizer')){
        	xShift = true;
        } else if (element.hasClass('chat-top-resizer')){
        	yShift = true;
        }

        var dragging = false;
        var origin;

        element.on('vmousedown', function(e){
        	e.stopPropagation();
        	dragging = true;
        	origin = {x: e.pageX, y: e.pageY};
        	content.addClass('touchnone');
        });
        $(document).on('vmousemove', function(e){
        	if (!dragging)
        		return;

            var parentWidth = parent.width();
            var parentHeight = parent.height();
            if (scope.originSize == undefined)
                scope.originSize = {width: parentWidth, height: parentHeight};
            var changeX = origin.x - e.pageX;
            var changeY = origin.y - e.pageY;
            origin = {x: e.pageX, y: e.pageY};


            changeX = Math.max(scope.originSize.width/2, parentWidth + changeX) - parentWidth;
            changeY = Math.max(scope.originSize.height/2, parentHeight + changeY) - parentHeight;

            if (xShift)
                parent.width(parentWidth+changeX);
            if (yShift){
                parent.height(parentHeight+changeY);
                content.height(content.height()+changeY);
            }
        });
        $(document).on('vmouseup', function(e){
        	if (!dragging)
        		return;

        	dragging = false;
        	content.removeClass('touchnone');
        	parent.find('.chat-message-text').resize();
        });

    };
});


angular.module('prettyDateFilter', []).filter('prettyDate', function() {               
   return function(timestamp) {
       return prettyDate(timestamp);
   }
});

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});


app.filter('parseUrlFilter', function() {
    //var urlPattern = '^(?!href="[^"\n\r\s]+?").*?(https?:\/\/)?((?:www|ftp)\.[-A-Za-z0-9+&@#\/%?=~_|$!:,.;]+)$';
    var urlPattern = /(\b(((https?|ftp|file):\/\/)|(www\.))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%‌​=~_|])/ig;
    return function(text, target) {        
        angular.forEach(text.match(urlPattern), function(url) {
            text = text.replace(url, "<a target=\"" + target + "\" href="+ url + ">" + url +"</a>");
        });
        return text ;        
    };
});


function saveTextAsFile(filename, data)
{
    var textFileAsBlob = new Blob([data], {type:'text/plain'});
    var fileNameToSaveAs = filename;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null)
    {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else
    {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}
