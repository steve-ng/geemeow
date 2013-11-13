var CanvasController = function(tab, canvasJquery, requestCanvasAction, toolDataSource, peerId){
	//	Data
	var canvas = canvasJquery[0];
	var context = canvas.getContext('2d');
	var canvasActions = [];
	var strokesMap = {};
	var currentActionIndex = 0;
	var mouseX, mouseY;
	var drawing = false;
	var canvasAction;
	var ahead = 0;


	//	Canvas listener
	canvasJquery.on('vmousedown', function(e){
		e.preventDefault();
		e.originalEvent.preventDefault();

		if (e.which != 1 && e.which != 0)
			return;


		var canvasWidth = canvasJquery.width();
		var canvasHeight = canvasJquery.height();

		var mouseX = (e.pageX - canvasJquery.offset().left-2);
		var mouseY = (e.pageY - canvasJquery.offset().top-2);


		canvasAction = new Object();

		if (toolDataSource.getCanvasMode() == 'marker')
			canvasAction.mode = 'marker';
		else if (toolDataSource.getCanvasMode() == 'eraser')
			canvasAction.mode = 'eraser';
		else if (toolDataSource.getCanvasMode() == 'highlighter')
			canvasAction.mode = 'highlighter';
		else
			return;

		canvasAction.type = "AddStroke";
		canvasAction.points = [{x: (mouseX-1)/canvasWidth, y: (mouseY-1)/canvasHeight},
								{x: (mouseX-1)/canvasWidth, y: (mouseY-1)/canvasHeight},
								{x: (mouseX)/canvasWidth, y: (mouseY)/canvasHeight},];
		canvasAction.size = toolDataSource.getStrokeSize();
		if (toolDataSource.getCanvasMode() == 'eraser')	//	make eraser bigger
			canvasAction.size = toolDataSource.getStrokeSize()*2;
		canvasAction.color = toolDataSource.getStrokeColor();
		canvasAction.peakCoord = {x: (mouseX-1)/canvasWidth, y: (mouseY-1)/canvasHeight};
		drawing = true;
		//toolDataSource.sendCursorUpdate = false;

		extendStrokeWithEvent(e);
	});

	canvasJquery.on('vmousemove', function(e){
		e.preventDefault();

		extendStrokeWithEvent(e)
	});

	canvasJquery.on('vmouseup vmouseout', function(e){
		if (!drawing)
			return;

		extendStrokeWithEvent(e);
		drawing = false;
		//toolDataSource.sendCursorUpdate = true;
		requestCanvasAction(canvasAction);
		ahead++;
	});

	

	var extendStrokeWithEvent = function(e){
		if (!drawing)
			return;
		var mouseX = (e.pageX - canvasJquery.offset().left-2)/canvasJquery.width();
		var mouseY = (e.pageY - canvasJquery.offset().top-2)/canvasJquery.height();

		canvasAction.points.push({x: mouseX, y: mouseY});
		if (mouseX < canvasAction.peakCoord.x)
			canvasAction.peakCoord.x = mouseX;
		if (mouseY < canvasAction.peakCoord.y)
			canvasAction.peakCoord.y = mouseY;

		drawSection(canvasAction, canvasAction.points.length-1);
	}

	this.setCanvasData = function(canvasData){
		canvasActions = canvasData.actions;
	}


	this.redraw = function(){
		this.clear();

		//	Find last clear
		var lastClear = 0;
		for (var i = 0; i < canvasActions.length; i++)
			if (canvasActions[i].type == "Clear")
				lastClear = i+1;

		//	Draw starting from last clear
		for (var i = lastClear; i < canvasActions.length; i++){
			var canvasAction = canvasActions[i];
			if (canvasAction.type == "AddStroke")
				drawStroke(canvasAction);
		}
	}


	this.requestClear = function(){
		var canvasAction = new Object();
		canvasAction.type = "Clear";
		requestCanvasAction(canvasAction);
	}

	//	Action Handler
	this.onCanvasAction = function(canvasAction){
		if (canvasAction.type == "AddStroke"){
			canvasActions.push(canvasAction);
			if (canvasAction.peerId != peerId || ahead == 0)
				drawStroke(canvasAction);
			else 
				ahead--;
		} else if (canvasAction.type == "Clear"){
			canvasActions.push(canvasAction);
			this.clear();
		} else if (canvasAction.type == "Undo"){
			this.undoPeer(canvasAction.peerId);
		}
	}

	//	Methods
	this.clear = function(){
		context.clearRect(0, 0, canvas.width, canvas.height);
		canvas.width = canvas.width;
	}

	this.undoPeer = function(peerId){
		for (var i = canvasActions.length-1; i >= 0; i--){
			if (canvasActions[i].peerId == peerId){
				canvasActions.splice(i,1);
				break;
			}
		}
		this.redraw();
	}


	//	Internal methods
	var drawSection = function(canvasData, i){
		if (i % 3 != 0)
			return;

		var canvasWidth = canvasJquery.width();
		var canvasHeight = canvasJquery.height();

		context.beginPath();
		context.lineJoin = "round";
    	context.lineCap = 'round';
		context.lineWidth = canvasData.size*tab.scale;
    	if (canvasData.mode == 'marker'){
			context.globalCompositeOperation = 'source-over';
			context.strokeStyle = canvasData.color;
		}
		else if (canvasData.mode == 'highlighter'){
			context.globalCompositeOperation = 'destination-atop';
			context.strokeStyle = convertHex(canvasData.color,0.5);
		}
		else {
			context.globalCompositeOperation = 'copy';
			context.strokeStyle = 'rgba(0,0,0,0)';
		}

		var points = canvasData.points;
		//context.moveTo(points[i-2].x*canvasWidth, points[i-2].y*canvasHeight);
		//context.quadraticCurveTo(points[i-1].x*canvasWidth, points[i-1].y*canvasHeight, points[i].x*canvasWidth, points[i].y*canvasHeight);
		context.moveTo(points[i-3].x*canvasWidth, points[i-3].y*canvasHeight);
		context.bezierCurveTo(points[i-2].x*canvasWidth, points[i-2].y*canvasHeight, 
									points[i-1].x*canvasWidth, points[i-1].y*canvasHeight, 
									points[i].x*canvasWidth, points[i].y*canvasHeight);
		//context.moveTo(points[i-1].x*canvasWidth, points[i-1].y*canvasHeight);
		//context.lineTo(points[i].x*canvasWidth, points[i].y*canvasHeight);

		context.stroke();
	}

	var drawStroke = function(canvasData){
		var canvasWidth = canvasJquery.width();
		var canvasHeight = canvasJquery.height();

		context.lineJoin = "round";
		context.lineCap = 'round';
		context.lineWidth = canvasData.size*tab.scale;
		if (canvasData.mode == 'marker'){
			context.globalCompositeOperation = 'source-over';
			context.strokeStyle = canvasData.color;
		}
		else if (canvasData.mode == 'highlighter'){
			context.globalCompositeOperation = 'destination-atop';
			context.strokeStyle = convertHex(canvasData.color,0.5);
		}
		else {
			context.globalCompositeOperation = 'copy';
			context.strokeStyle = 'rgba(0,0,0,0)';
		}

		var points = canvasData.points;
		for (var i = 3; i < points.length; i++){
			if (i % 3 != 0)
				continue;
		

			context.beginPath();
			

			//context.moveTo(points[i-2].x*canvasWidth, points[i-2].y*canvasHeight);
			//context.quadraticCurveTo(points[i-1].x*canvasWidth, points[i-1].y*canvasHeight, points[i].x*canvasWidth, points[i].y*canvasHeight);
			context.moveTo(points[i-3].x*canvasWidth, points[i-3].y*canvasHeight);
			context.bezierCurveTo(points[i-2].x*canvasWidth, points[i-2].y*canvasHeight, 
									points[i-1].x*canvasWidth, points[i-1].y*canvasHeight, 
									points[i].x*canvasWidth, points[i].y*canvasHeight);
			//context.moveTo(points[i-1].x*canvasWidth, points[i-1].y*canvasHeight);
			//context.lineTo(points[i].x*canvasWidth, points[i].y*canvasHeight);
			context.stroke();
		}
	}
}



function convertHex(hex,opacity){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    result = 'rgba('+r+','+g+','+b+','+opacity+')';
    return result;
}
