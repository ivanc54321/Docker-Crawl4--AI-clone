
$(document).ready(function () {

    var moving__background = $("#header__background");
    var moving__title = $("#header__centered").find('h1');


    if ($("#parallax").length > 0) {

        setParallax();

        function setParallax() {

            var x = parseInt($(window).scrollTop() / 3);

            if (x < 125) {
                var transT = 'translate3d(0px, ' + parseInt(30 + ($(window).scrollTop() / 6)) + 'px, 0px';
                moving__title.css('transform', transT);
                moving__title.css('-webkit-transform', transT);

                var transX = 'translate3d(0px, ' + x + 'px, 0px';
                moving__background.css('transform', transX);
                moving__background.css('-webkit-transform', transX);
            }

            requestAnimationFrame(setParallax);
                
        }

    }


});