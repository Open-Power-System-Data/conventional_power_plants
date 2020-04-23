window.initMap = function () {
    jQuery('.wkb_google-maps').each(function (i, obj) {
        var $mapObj = jQuery(this);
        var $mapDiv = $mapObj.data("id");
        var location = {
            lat: $mapObj.data("lat"),
            lng: $mapObj.data("lng")
        };
        var map = new google.maps.Map(document.getElementById($mapDiv), {
            zoom: $mapObj.data("zoom"),
            center: location,
            styles: []
        });
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            title: "asdf"
        });
        var infowindow = new google.maps.InfoWindow({
            content: $mapObj.data("address")
        });
        marker.addListener('click', function () {
            infowindow.open(map, marker);
        });
    });

};
window.onYouTubeIframeAPIReady = function () {
    var $ = jQuery;


    $(".rel-yt-video").each(function () {
        var $elm = $(this);
        var $elm2 = $elm.closest(".wkb_video");

        var $poster = $(".video_poster", $elm2);
        var $info = $(".video-info", $elm2);
        var $play = $(".play, .video-link", $elm2);


        function onPlayerReady3(event) {
            $play.click(function (e) {
                e.preventDefault();
                $poster.hide();
                $info.hide();
                $("iframe.rel-yt-video", $elm2).show();
                event.target.playVideo();
                return false;
            });
        }

        var player = new YT.Player($elm[0], {
            videoId: $elm.data("videoid"),
            playerVars: {'autoplay': 0, 'rel': 0, 'controls': 0},
            events: {
                'onReady': onPlayerReady3,
                'onStateChange': onPlayerStateChange
            }
        });


        function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.ENDED) {
                $("iframe.rel-yt-video", $elm2).hide();
                $poster.show();
                $info.show();
            }
        }


    });

};
jQuery(document).ready(function () {
    var $ = jQuery;

    function load_posts(page, $elm, success) {
        var $loader = $elm.closest(".ui-loader").trigger("loader.start");
        var data = $elm.data();
        data.action = "ajax_pagination";
        $.ajax({
            url: site.ajaxurl,
            type: 'post',
            data: data,
            success: function (data) {
                $elm.data("page", page);
                $loader.trigger("loader.stop");
                success($(data));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR + " :: " + textStatus + " :: " + errorThrown);
            }
        });
    }

    $(".loadMore").on("click", function () {
        var $btn = $(this);
        var $elm = $btn.closest(".wkb_news_box");
        var page = parseInt($elm.data("page"));
        page++;

        $btn.attr("disabled", true);
        load_posts(page, $elm, function ($data) {
            if ($data.length) {
                $btn.attr("disabled", false);
                $(".news-items", $elm).append($data);
            } else {
                $btn.hide();
            }
        });
    });

    $(".filter-meta li").on("click", function () {
        var $filter = $(this);
        var $filter2 = $(this).closest(".filter-meta");
        var $elm = $filter.closest(".wkb_news_box");
        $elm.data("filter_" + $filter2.data("name"), $filter.data("val"));
        load_posts("1", $elm, function ($data) {
            $filter2.find(".dropdown-toggle").text($filter.text());
            var $deck = $(".news-items", $elm).empty();
            if ($data.length) {
                $deck.append($data);
                $(".loadMore", $elm).show();
            }
        });
    });

    $(".filter-author li").on("click", function () {                              //TODO remove
        var $filter = $(this);
        var $elm = $filter.closest(".wkb_news_box");
        $elm.data("author", $filter.data("author"));
        load_posts("1", $elm, function ($data) {
            $filter.closest(".dropdown").find(".dropdown-toggle").text($filter.text());
            var $deck = $(".news-items", $elm).empty();
            if ($data.length) {
                $deck.append($data);
                $(".loadMore", $elm).show();
            }
        });
    });

    $(".filter-sort li").on("click", function () {
        var $filter = $(this);
        var $elm = $filter.closest(".wkb_news_box");
        $elm.data("order", $filter.data("order"));
        $elm.data("orderby", $filter.data("orderby"));
        load_posts("1", $elm, function ($data) {
            $filter.closest(".dropdown").find(".dropdown-toggle").text($filter.text());
            var $deck = $(".news-items", $elm).empty();
            if ($data.length) {
                $deck.append($data);
                $(".loadMore", $elm).show();
            }
        });
    });

    $(".search-icon").click(function () {
        var $elm = $(this).closest(".search-holder");
        if (!$elm.hasClass("opened")) {
            openSearch($elm);
        }
    });

    function openSearch($elm) {
        $elm.addClass("opened");
        var $open = $(".search-open", $elm);
        $open.data("width", $open.width()).css("width", "0px");
        $open.show();
        TweenLite.to($open[0], 0.3, {
            css: {width: $open.data("width") + "px"},
            ease: Power2.easeIn, onComplete: function () {
                $open.css("width", "");
            }
        });
    }

    function closeSearch($elm) {
        var $open = $(".search-open", $elm);
        TweenLite.to($open[0], 0.3, {
            css: {width: $(".search-icon", $elm).width() + "px"},
            ease: Power2.easeIn, onComplete: function () {
                $open.css("width", "");
                $elm.removeClass("opened");
                $(".search-open", $elm).hide();
            }
        });
    }

    $("body").click(function (e) {
        if (e.originalEvent) {
            var $tar = $(e.originalEvent.target);
            if ($tar.parents(".search-holder").length == 0) {
                $(".search-holder.opened").each(function () {
                    closeSearch($(this));
                });
            }
        }
    }).on({
        click: function (e) {
            var href = $(this).attr("href");
            if (href && href.indexOf("#") === 0 && href.length > 1 && href.indexOf("#carousel-module_identifier") == -1 && href.indexOf("#remove-file") == -1) {
                e.preventDefault();
                if (history.pushState) {
                    history.pushState(null, null, href);
                    var $elm = $(href);
                    if ($elm && $elm.length > 0) {
                        $("html, body").animate({scrollTop: $elm.position().top + "px"}, 300, 'swing', function () {
                        });
                    }
                }
                else {
                    location.hash = href;
                }
                return false;
            }
        }
    }, "a");


    $(".wkb_sliding-banner .banner-scroll").click(function () {
        var $sub = $(this).closest(".wkb_sliding-banner");
        var $next = $sub.next();
        if ($next && $next.length > 0) {
            $("html, body").animate({scrollTop: $sub.next().position().top + "px"}, 300, 'swing', function () {
            });
        }
    });

    $(".wkb_video").each(function () {
        var $elm = $(this);
        if ($(".rel-yt-video", $elm).length > 0) {
            return;
        }
        var $video = $("video", $elm);
        var $poster = $(".video_poster", $elm);
        var $info = $(".video-info", $elm);
        var $play = $(".play, .video-link", $elm);
        $play.click(function (e) {
            e.preventDefault();
            $poster.hide();
            $info.hide();
            $video.show();
            $video[0].play();
            return false;
        });
        $video.on({
            ended: function () {
                $video.hide();
                $poster.show();
                $info.show();
            }
        });
    });

    $(".wkb_sliding-gallery.type-vertical_filmstrip").each(function () {
        var $active = $(".active-item");
        var $items = $(".item");
        $items.click(function () {
            var $item = $(this);
            $items.removeClass("active");
            $item.addClass("active");
            $active.html('<img src="' + $item.data("image") + '">');
        });
    });

    $(".wkb_news_box, .rel_product_search").on({
        click: function (e) {
            e.preventDefault();
            var $card = $(this).closest(".card");
            var dialog = $($(".dialog-content", $card).html());
            dialog.uiDialog({height: 450, grow: true});
            return false;
        }
    }, ".dialog-open");


    var headerMenu = $(".full_width_menu");
    if (headerMenu.length > 0) {
        $(".menuOpen").click(function (e) {
            e.preventDefault();
            headerMenu.show();
            return false;
        });
        $(".menu-close", headerMenu).click(function (e) {
            headerMenu.hide();
        });
    } else {
        console.log("else");
        $(".menuOpen").click(function () {
            $(".header-menu-responsive").toggleClass("hidden");
        });
    }


});

                                                        