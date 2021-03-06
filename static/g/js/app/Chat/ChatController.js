//	Controller for Chat
app.controller('ChatController', function($scope, $rootScope){
	$scope.showChatWidget = false;
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
		$scope.chatClient.sendChat($scope.text);
		$scope.text = "";
		$scope.safeApply();
	}


	//	Message handlers
	$scope.onNewChat = function(message){
		var autoScroll = false;
		if ($scope.scrollDiv[0].scrollTop + $scope.scrollDiv.height() + 10> $scope.scrollDiv[0].scrollHeight || $scope.scrollDiv.is('animated'))
			autoScroll = true;

		$scope.chatHistory.push(message);
		if (!$scope.showChatWidget)
			$scope.badgeCount++;
		$scope.safeApply(function(){
			setTimeout(function(){
				if (autoScroll){
					$scope.scrollDiv.animate({
		        		scrollTop: $scope.scrollDiv[0].scrollHeight
		        	}, 100);
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
	var exportChatHistory = function(){
		var logs = "";
		var names = $rootScope.names;
		for (var i in $scope.chatHistory){
			var message = $scope.chatHistory[i];
			logs += names[message.peerId] + " (" + (new Date(message.timestamp)).toString() +  "): " + message.text + "\n";
		}
		return logs;
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
        },0);
    };
});


app.directive('chatMessageText', function() {
    return function(scope, element, attrs) {
        setTimeout(function(){
        	element.autosize();
        },0);
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