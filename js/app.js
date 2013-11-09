$(document).ready(function () {

	$("#takeALookBtn").click(function(){
		$(".main").jumpTo($(this).data("target"));
	});

	
    $(".main").onepage_scroll({
        sectionContainer: "section"
    });

});