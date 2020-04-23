
var RememberState = function () { }
var loadedRememberStateElements = [];
var observer = new MutationObserver(function (mutations) { });
var config = { attributes: true, childList: false, characterData: false }

document.addEventListener("DOMContentLoaded", function (event) {
    RememberState.GetState();

    //Make it work with Ajax loaded content
    var ajaxContainer = document.getElementsByClassName("js-ajax-container");
    if (ajaxContainer.length > 0) {
        for (var i = 0; i < ajaxContainer.length; i++) {
            ajaxContainer[i].addEventListener('contentLoaded', function (e) {
                RememberState.GetState();
            }, false);
        }
    }
});

RememberState.prototype.SaveState = function () {
    var rememberStateElements = document.getElementsByClassName("js-remember-state");

    for (var elm = 0; elm < rememberStateElements.length; elm++) {
        var target = rememberStateElements[elm];

        if (RememberState.ElementExists(target.id) == false) {

            //Save cookie when an attribute changes on the element
            observer = new MutationObserver(function (mutations) {
                var stateCookie = "StateCookie_" + mutations[0].target.id + "=[{";

                if (target.getAttribute("type") != "checkbox") {
                    var count = 0;

                    mutations.forEach(function (mutation) {
                        stateCookie += '"' + mutation.attributeName + '": "' + mutation.target.getAttribute(mutation.attributeName) + '"';
                        if (count != mutations.length - 1) {
                            stateCookie += ",";
                        }
                        count++;
                    });
                } else {
                    stateCookie += '"checked": "' + mutations[0].target.checked + '"';
                }

                stateCookie += "}]";

                document.cookie = stateCookie;
            });

            if (target.getAttribute("type") == "checkbox") {
                target.addEventListener('click', function (e) {
                    e.target.setAttribute('checked', e.target.checked);
                });
            }

            observer.observe(target, config);
        }

        loadedRememberStateElements.push(target.id);
    }
}

RememberState.prototype.GetState = function () {
    var rememberStateElements = document.getElementsByClassName("js-remember-state");

    for (var elm = 0; elm < rememberStateElements.length; elm++) {
        var target = rememberStateElements[elm];

        //Get the cookie and set the saved attributes
        var resultCookie = RememberState.GetCookie("StateCookie_" + target.id);

        if (resultCookie) {
            resultCookie = JSON.parse(resultCookie);

            for (var crumb = 0; crumb < resultCookie.length; crumb++) {
                for (property in resultCookie[crumb]) {
                    target.setAttribute(property, resultCookie[crumb][property]);

                    if (property == "checked") {
                        if (resultCookie[crumb][property] == "false") {
                            target.removeAttribute("checked");
                        } else {
                            target.checked = true;
                        }
                    }
                }
            }
        } 
    }

    //Set up remember state again after the last state is set
    RememberState.SaveState();
}

//Parse to find the chosen cookie
RememberState.prototype.ElementExists = function (elementId) {
    var condition = false;

    for (var i = 0; i < loadedRememberStateElements.length; i++) {
        if (loadedRememberStateElements[i] == elementId) {
            condition = true;
        }
    }

    return condition
}

//Parse to find the chosen cookie
RememberState.prototype.GetCookie = function (name) {
    var pattern = RegExp(name + "=.[^;]*")
    matched = document.cookie.match(pattern)

    if (matched) {
        var cookie = matched[0].split('=')
        return cookie[1]
    }
    return false
}


//Set simple checkbox state by url parameter (js-remember-state class not required)
RememberState.prototype.getSearchParameters = function() {
    var paramstring = window.location.search.substr(1);
    return paramstring != null && paramstring != "" ? RememberState.transformToAssocArray(paramstring) : {};
}

RememberState.prototype.transformToAssocArray = function (paramstring) {
    var params = {};
    var paramsarray = paramstring.split("&");
    for (var i = 0; i < paramsarray.length; i++) {
        var tmparray = paramsarray[i].split("=");
        params[tmparray[0]] = tmparray[1];
    }
    return params;
}

document.addEventListener("DOMContentLoaded", function (event) {
    var params = RememberState.getSearchParameters();

    for (property in params) {
        if (document.getElementById(property)) {
            var element = document.getElementById(property);

            if (element.type === 'checkbox') {
                element.checked = params[property];
            }
        }
    }
});

var RememberState = new RememberState();