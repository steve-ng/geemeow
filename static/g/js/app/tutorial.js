
app.run(function($rootScope){

	$(document).ready(function() {

		var firstTime = $.cookie("firstTimerCookie");

		//set non-first timer
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

			setTimeout(function(){

				$rootScope.showTutorial();	
			},500);
		}

	});

});

