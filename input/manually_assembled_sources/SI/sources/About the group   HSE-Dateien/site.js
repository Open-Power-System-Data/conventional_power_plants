jQuery(document).ready(function () {
    var $ = jQuery;

    function doTitles() {
        $(".rel_bullet_points .title").each(function () {
            var $title = $(this);
            if ($title.data("title")) {
                return;
            }
            var posTop = $title.offset().top;
            var scrollTop = $(window).scrollTop() + $(window).height();
            if (scrollTop < posTop) {
                return;
            }

            var title = $title.text();                                                       
            $title.data("title", title);
            var titleNaked = title.replace(".", "").replace(",", "");
            var titleNum = parseInt(titleNaked);
            if (isNaN(titleNum)) {
                return;
            }
            var curTime = 0;
            var runFor = 50;
            var runInt = 40;
            var interval = setInterval(function () {
                curTime++;
                if (curTime == runFor) {
                    $title.text($title.data("title"));
                    return clearInterval(interval);
                }
                var n = (titleNum / runFor);
                $title.text(Math.round(n * curTime));
            }, runInt);
        });
    }

    $(window).scroll(function () {
        doTitles();
        $(".main > div").each(function () {
            var $elm = $(this);
            if ($elm.hasClass("animated")) {
                return;
            }
            var top = $(window).scrollTop();
            var bot = top + $(window).height();

            var eTop = $elm.offset().top;
            var eHeight = $elm.height();
            var eBot = eTop + eHeight;
            var type = "start";
            if (type == "load") {
                animate($elm);
            } else if (type == "full" && eBot <= bot && eTop >= top) {
                animate($elm);
            } else if (type == "middle" && bot >= eTop + eHeight / 2) {
                animate($elm);
            } else if (type == "start" && bot >= eTop) {
                animate($elm);
            }
        });
    }).trigger("scroll");

    function animate($elm) {
        $elm.addClass("animated");
    }

    $(".rel_map").each(function () {
        var $elm = $(this);
        var $mapTypes = $(".map-type", $elm);
        //$mapTypes.onMouse({
        //    "mouse.start": function (e, pos) {
        //        pos.preventDefault();
        //        pos.data.x = $(this).position().left;
        //        pos.data.y = $(this).position().top;
        //        pos.data.parentWidth = $(this).parent().width()
        //        pos.data.parentHeight = $(this).parent().height()
        //    },
        //    "mouse.move": function (e, pos) {
        //        var diff = pos.diff();
        //        var y = pos.data.y + diff.y;
        //        var x = pos.data.x + diff.x;
        //        if (y > 0) {
        //            y = 0;
        //        }
        //        if (x > 0) {
        //            x = 0;
        //        }
        //        if (x < -($(this).width() - pos.data.parentWidth)) {
        //            x = -($(this).width() - pos.data.parentWidth);
        //        }
        //        if (y < -($(this).height() - pos.data.parentHeight)) {
        //            y = -($(this).height() - pos.data.parentHeight);
        //        }
        //        $(this).css({
        //            "left": x,
        //            "top": y
        //        });
        //    }
        //});
        $(".ui-accordion-body", $elm).on({
            "ui.accordion.showStart": function () {
                var $body = $(this);
                var $newType = $mapTypes.eq(Math.floor($body.index() / 2));
                $mapTypes.hide().removeClass("active");
                setMapTypeScale($newType, 1);
                $newType.show().addClass("active");
                $(".legend", $elm).html($(".legend2", $newType).html());
            }
        });
        //$(".plus", $elm).click(function () {
        //    var $type = $(".active", $elm);
        //    var currentScale = $type.data("scale");
        //    if (!currentScale || currentScale == 1) {
        //        setMapTypeScale($type, 1.3);
        //    } else if (currentScale == 1.3) {
        //        setMapTypeScale($type, 1.6);
        //    }
        //});
        //$(".minus", $elm).click(function () {
        //    var $type = $(".active", $elm);
        //    var currentScale = $type.data("scale");
        //    if (currentScale == 1.6) {
        //        setMapTypeScale($type, 1.3);
        //    } else if (currentScale == 1.3) {
        //        setMapTypeScale($type, 1);
        //    }
        //});
    });

    function setMapTypeScale($type, val) {
        // $type.css({
        //     '-webkit-transform': 'scale(' + val + ')',
        //     '-moz-transform': 'scale(' + val + ')',
        //     '-ms-transform': 'scale(' + val + ')',
        //     '-o-transform': 'scale(' + val + ')',
        //     'transform': 'scale(' + val + ')'
        // }).data("scale", val);

        var wBefore = $type.width();
        $type.css("width", (100 * val) + "%").data("scale", val);
        var wAfter = $type.width();
        var diff = wBefore - wAfter;
        var top = $type.position().top + diff / 2;
        var left = $type.position().left + diff / 2;
        if (top > 0) {
            top = 0;
        }
        if (left > 0) {
            left = 0;
        }
        if (top < -($type.height() - $type.parent().height())) {
            top = -($type.height() - $type.parent().height());
        }
        if (left < -($type.width() - $type.parent().width())) {
            left = -($type.width() - $type.parent().width());
        }
        $type.css({
            "top": top,
            "left": left
        })
    }

    $('img').each(function () {
        var $img = $(this);
        var src = $img.attr("src");
        if (src.slice(-4) == ".svg") {
            var imgID = $img.attr('id');
            var imgClass = $img.attr('class');
            var imgURL = $img.attr('src');
            $.get(imgURL, function (data) {
                var $svg = $(data).find('svg');
                if (typeof imgID !== 'undefined') {
                    $svg = $svg.attr('id', imgID);
                }
                if (typeof imgClass !== 'undefined') {
                    $svg = $svg.attr('class', imgClass + ' replaced-svg');
                }
                $svg = $svg.removeAttr('xmlns:a');
                if (!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
                    $svg.attr('viewBox', '0 0 ' + $svg.attr('height') + ' ' + $svg.attr('width'))
                }
                $img.replaceWith($svg);
            }, 'xml');
        }
    });

    $(".isDialog").each(function () {
        var $elm = $(this);
        $("a", $elm).click(function (e) {
            var $dialog = $(".dialog-content", $elm);
            if ($dialog.length > 0 && $dialog.data("url").indexOf("issuu.com") > -1) {
                var dialog = $('<div><iframe src="' + $dialog.data("url") + '"></iframe></div>');
                dialog.uiDialog({height: 450, grow: true});
                return false;
            }
        });
    });


    $(".wkb_sliding-banner").each(function () {
        var $elm = $(this);
        var $carousel = $(".carousel", $elm);

        function play($play, playVideo) {
            var $item = $play.closest(".carousel-item");
            $carousel.carousel("pause");
            $item.addClass("playingVideo");
            if (playVideo) {
                var $video = $("video", $item).show();
                $video[0].play();
            }
        }

        $(".play", $elm).click(function () {
            play($(this), true);
        });

        var autoplay = $(".carousel-item", $elm).eq(0).find(".play");
        if (autoplay) {
            play(autoplay, false);
        }


    });

    $(".wkb_sliding-banner video").on({
        ended: function () {
            var $item = $(this).closest(".carousel-item");
            var $video = $("video", $item).hide();
            var $carousel = $video.closest(".carousel");
            $carousel.carousel("cycle");
            $item.removeClass("playingVideo");
        }
    });


    addRepeatable("CF5c3f3414148a7", "fld_7396152", "fld_9999800");

    function addRepeatable(form, input, setInput) {
        $("." + form).each(function () {
            var $elm = $(this).data("repeatable", setInput);
            var $input = $('input[name=' + input + ']', $elm);
            var $row = $input.closest(".row").addClass("repeatable");
            var $addFields = $('<div class="add-fields">+</div>');
            $row.after($addFields);
            $addFields.click(function () {
                var $clone = $row.clone();
                $("input, textarea, select", $clone).val("");
                var $remove = $('<div class="remove">-</div>');
                $clone.append($remove);
                $remove.click(function () {
                    $clone.remove();
                });
                $(".repeatable", $elm).eq($(".repeatable", $elm).length - 1).after($clone);
            });

        });
    }

    jQuery(document).on({
        'cf.form.submit': function (e, data) {
            var $form = data.$form;
            if ($form.data("repeatable")) {
                var value = "";
                $(".repeatable", $form).each(function () {
                    $(".form-group", $(this)).each(function () {
                        value += $("label", $(this)).text() + ": " + $("input, select, textarea", $(this)).val() + "\n";
                    });
                    value += "--------------------------\n";
                });
                $('textarea[name=' + $form.data("repeatable") + ']').val(value);
                $(".add-fields", $form).remove();
            }
            $(window).scrollTop($form.offset().top - 200);
        }
    });


    var $header = $("body > .header");
    var $over = $(".wkb_sliding-banner");
    if ($over.length == 0) {
        $over = $("body > .page_header");
    }
    $(window).scroll(function () {
        if ($header.length == 0 || $over.length == 0) {
            return;
        }
        if ($header.offset().top + $header.outerHeight() > $over.offset().top + $over.outerHeight()) {
            $header.addClass("overBg");
        } else {
            $header.removeClass("overBg");
        }
    }).trigger("scroll");


    $(".f-row-3 a").attr("target", "_blank");


    $(".wkb_text table").each(function () {
        var $wrap = $('<div class="table-wrap"></div>');
        $(this).after($wrap);
        $wrap.append($(this));
    });


});

