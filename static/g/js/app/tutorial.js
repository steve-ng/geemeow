
app.run(function($rootScope){

	$(document).ready(function() {

		var firstTime = $.cookie("firstTimerCookie");

		//set non-first timer
		console.log('setting cookie!');
		$.cookie("firstTimerCookie","present");

		if(firstTime == null ){
			showTutorial();
		}
		
		function showTutorial(){

			$('#room_tab_tutorial').joyride({
				'autoStart' : true,
				'tipLocation': 'bottom',
				'nextButton': true,
				'modal': true,
				'expose' : true,
				'tipAnimation' : 'pop'
			});
		}


	});

});

