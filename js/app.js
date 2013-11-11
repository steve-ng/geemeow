$(document).ready(function () {

	$("#takeALookBtn").click(function(){
		$(".main").jumpTo($(this).data("target"));
	});

	
    $(".main").onepage_scroll({
        sectionContainer: "section"
    });


    var animation = $('.tuna_container');

    animation.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',   
    function(e) {
    	//$('#little_cat').removeClass('tuna');
	    $('#little_cat').removeClass('tuna-walk');
	    $('#little_cat').addClass('tuna-sit');
	    // code to execute after animation ends
	    //console.log('hehe!');
   
    });

});