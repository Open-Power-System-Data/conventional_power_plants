var Buttons = function () { }

Buttons.prototype.LockButton = function (e) {
    var allIsOk = true;
    var clickedButton = e.currentTarget;

    if (clickedButton.type == "submit") {
        var formElement = Buttons.GetClosest(clickedButton, "FORM");
        var fields = formElement.getElementsByTagName("INPUT");

        for (var i = 0; i < fields.length; i++) {
            if (fields[i].validity.valid == false) {
                allIsOk = false;
            }
        }
    }

    //Secure that there is time for a form time to submit
    if (allIsOk) {
        setTimeout(function () {
            var clickedButtonText = clickedButton.innerHTML;
            var clickedButtonWidth = clickedButton.clientWidth;
            clickedButton.classList.add("disabled");
            clickedButton.disabled = true;
            clickedButton.innerHTML = "";
            clickedButton.innerHTML = "<i class=\"fa fa-circle-o-notch fa-spin\"></i>";
            clickedButton.style.width = clickedButtonWidth + "px";
        }, 50);
    } 
}

Buttons.prototype.GetClosest = function (currentElement, tag) {
    tag = tag.toUpperCase();
    do {
        if (currentElement.nodeName === tag) {
            return currentElement;
        }
    } while (currentElement = currentElement.parentNode);

    return null;
}

var Buttons = new Buttons();