
app.run(function($rootScope){

	$(document).ready(function() {

		var firstTime = $.cookie("firstTimerCookie");

		//set non-first timer
		console.log('setting cookie!');
		$.cookie("firstTimerCookie","present");

		$rootScope.showTutorial = function(){
			$('#room_tab_tutorial').joyride({
				'autoStart' : true,
				'tipLocation': 'bottom',
				'nextButton': true,
				'modal': true,
				'expose' : true,
				'tipAnimation' : 'pop'
			});
		}

		if(firstTime == null ){
			$rootScope.showTutorial();
		}

	});

});

