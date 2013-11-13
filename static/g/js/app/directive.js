app.directive('analyticSelect', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-select');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticMarker', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-marker');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticHighlighter', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-highlighter');
    };
    element.bind('click', clickingCallback);
  }
});


app.directive('analyticEraser', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-eraser');
    };
    element.bind('click', clickingCallback);
  }
});


app.directive('analyticChangeColor', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-change-color');
    };
    element.bind('click', clickingCallback);
  }
});


app.directive('analyticStrokeSmall', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-stroke-small');
    };
    element.bind('click', clickingCallback);
  }
});


app.directive('analyticStrokeMed', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-stroke-med');
    };
    element.bind('click', clickingCallback);
  }
});


app.directive('analyticStrokeLarge', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-stroke-large');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticUndo', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-undo');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticRedo', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-redo');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticZoomIn', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-zoom-in');
    };
    element.bind('click', clickingCallback);
  }
});

app.directive('analyticZoomOut', function() {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      ga('send', 'event', 'button', 'click', 'draw-zoom-out');
    };
    element.bind('click', clickingCallback);
  }
});