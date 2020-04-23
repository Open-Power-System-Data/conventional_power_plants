var ImageList = function () { }

ImageList.prototype.LoadImage = function (selectedThumb) {
    var thumbButtons = document.getElementsByClassName("js-thumb-btn");

    for (var i = 0; i < thumbButtons.length; i++) {
        var thumbBtn = thumbButtons[i];
        if (thumbBtn.getAttribute('data-for') == selectedThumb.getAttribute('data-for')) {
            thumbBtn.classList.remove('thumb-list__item--active');
        }
    }

    selectedThumb.classList.add('thumb-list__item--active');
    document.getElementById(selectedThumb.getAttribute('data-for')).src = selectedThumb.getAttribute('data-image-path');
}

var ImageList = new ImageList();