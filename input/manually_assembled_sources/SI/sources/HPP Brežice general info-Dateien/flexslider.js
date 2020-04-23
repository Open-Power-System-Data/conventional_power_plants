/* FlexSlider */
$(window).load(function(){
  $('.flexslider').flexslider({       
	animation: "fade",
	controlNav: true,
	start: function(slider){
	  $('body').removeClass('loading');
	}
  });
});