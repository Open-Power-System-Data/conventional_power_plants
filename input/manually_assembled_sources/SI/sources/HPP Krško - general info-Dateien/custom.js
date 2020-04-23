$(document).ready(function() {
	$(".fancybox").fancybox({
		openEffect	: 'none',
		closeEffect	: 'none'
	});
});

$(".novica").click(function(){
	window.location=$(this).find("a").attr("href"); 
	return false;
});
$(document).ready(function() {
	$(".iframe").fancybox({
		height: 500,
		type: 'iframe'
		
	});
});

$('div.hovereffect').click(function(){
    var link = $(this).find('a').attr('href');
    window.location = link;
});

