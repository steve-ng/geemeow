$(document).ready(function () {

	$("#takeALookBtn").click(function(){
		$(".main").jumpTo($(this).data("target"));
	});

	
    $(".main").onepage_scroll({
        sectionContainer: "section"
    });


    //prevent clicking to highlight
    $('#cat_holder').mousedown(function(){ return false; })
    $('#little_cat_container').mousedown(function(){ return false; })
    $('.home-section').mousedown(function(){ return false; })

    var animation = $('.tuna_container');

    animation.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',   
    function(e) {
    	console.log("called!");
	    
	    $('#little_cat').removeClass('tuna-walk');
	    $('#little_cat').addClass('tuna-sit');

	    createKittyPopOver();
	    
    });
    var popoverContent =  "I've been a naughty kitten, play a game of <b> Hit the Meow? </b> </br> " +
	    						"<small> Game rule: Try to hit me while I'm on the run :P </small> </br></br> " +
	    						"<div class=\"kitten_conv\">" + 
	    						"<button id=\"tuna_challenge_yes\" class=\"btn\">Yes </button> &nbsp&nbsp"+
	    						"<button id=\"tuna_challenge_no\" class=\"btn btn-danger\">Close</button>" +
	    						"</div> ";

	function getPopOverContent(){
		return popoverContent;
	}

	function createKittyPopOver(){

	    

	    $('#little_cat').popover({
	    	html:true,
	    	placement:'top',
	    	content:function () { return getPopOverContent(); },
	    	delay:'0',
	    	trigger:'manual'
	    });

	    $('#little_cat').popover('show');


	    $('#tuna_challenge_yes').click(function(event){
	    	$('#little_cat').popover('hide');
	    	startGame();
	    });


	    $('#tuna_challenge_no').click(function(event){
	    	console.log('clicked!');
	    	$('#little_cat').popover('hide');
	    });
	}

	var gameInterval; 

	function startGame(){

		//start the cat animation to run
	    $('#little_cat_container').removeClass('tuna_container');
	    $('#little_cat_container').addClass("tuna_run_container");

	    $('#timer_score').show();

	    var timeleft = 10;
	    $('#timer_left').text(timeleft);

	    var x = 0;
	    $('#little_cat').removeClass('tuna-sit');
	    gameInterval = window.setInterval(function(){
	    	if(x ==0){
	    		x=1;	
	    		$('#little_cat').removeClass('tuna-run-right');
	    		$('#little_cat').addClass('tuna-run-left');		
	    	}else{
	    		x=0;
	    		$('#little_cat').removeClass('tuna-run-left');
	    		$('#little_cat').addClass('tuna-run-right');
	    		timeleft--;
	    		$('#timer_left').text(timeleft);
	    	}
	    	
	    },500);

	    var score =0;

	    $('#little_cat').click(function(e){
	    	console.log('clicked!');
	    	score++;
	    	$('#score_result').text(score);
	    	$( "#little_cat" ).effect('pulsate',{times:1},50,function(){});
	    })


	    window.setTimeout(stopGame,10000);
	    //$('#little_cat').addClass('tuna-run');

		//register a click counter that add score

		//when times up say its up, retry? or close? 
	}

	function stopGame(){
		console.log('called stop game!');

	    $('#timer_left').text('0');

		clearInterval(gameInterval);
		$('#little_cat').removeClass('tuna-run-left');
		$('#little_cat').removeClass('tuna-run-right');
		$('#little_cat_container').removeClass('tuna_run_container');


		$('#little_cat_container').effect('explode',{},500,function(){
			$('#little_cat_container').addClass('tuna-container');
			$('#little_cat').addClass('tuna-sit');
		});


		$('#little_cat_container').fadeOut(800,function(){
			$('#little_cat_container').addClass('tuna-container');
			$('#little_cat').addClass('tuna-sit');
		});


		$('#little_cat_container').fadeIn(3000,function(){
			createRestartPopOver();
		});


	}

	function createRestartPopOver(){
		popoverContent =  "Not bad! Again? </br> </br>" +
	    						"<div class=\"kitten_conv\">" + 
	    						"<button id=\"tuna_challenge_yes\" class=\"btn\">Yes </button> &nbsp&nbsp"+
	    						"<button id=\"tuna_challenge_no\" class=\"btn btn-danger\">Close</button>" +
	    						"</div>" ;

	    $('#little_cat').popover('show');

	    $('#tuna_challenge_yes').click(function(event){
	    	$('#little_cat').popover('hide');
	    	startGame();
	    });


	    $('#tuna_challenge_no').click(function(event){
	    	console.log('clicked!');
	    	$('#little_cat').popover('hide');
	    });
	}



    $('#little_cat').click(function(event) {
    	event.preventDefault();
    	//createKittyPopOver();
    });

});