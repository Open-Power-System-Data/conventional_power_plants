
var LoadMore = function () { }

LoadMore.prototype.Next = function (selected) {
    var pagesize = parseInt(selected.getAttribute("data-page-size"));
    var url = selected.getAttribute("data-feed-url") + location.search.replace("?", "&") + "&feedType=productsOnly";
    url = LoadMore.replaceUrlParam("pagesize", pagesize, url)
    var container = selected.getAttribute("data-container");
    var currentPage = selected.getAttribute("data-current");
    var totalPages = selected.getAttribute("data-total");

    console.log(url);

    currentPage++;

    selected.setAttribute("data-current", currentPage);

    url += "&pagenum=" + currentPage;

    if (currentPage <= totalPages) {
        Dynamo.AddContent(container, url);

        if (LoadMore.getParameter("pagesize")) {
            pagesize += parseInt(LoadMore.getParameter("pagesize"));
        } else {
            pagesize = (pagesize * 2);
        }

        var url = LoadMore.replaceUrlParam("pagesize", pagesize, window.location.href);
        history.pushState(null, null, url);
    }

    if (currentPage == totalPages) {
        selected.classList.add('disabled');
    }
}

LoadMore.prototype.replaceUrlParam = function (paramName, paramValue, url) {
    var pattern = new RegExp('\\b(' + paramName + '=).*?(&|$)');
    if (url.search(pattern) >= 0) {
        return url.replace(pattern, '$1' + paramValue + '$2');
    }

    return url + (url.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue
}

LoadMore.prototype.getParameter = function (theParameter) {
    var params = window.location.search.substr(1).split('&');

    for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        if (p[0] == theParameter) {
            return decodeURIComponent(p[1]);
        }
    }
    return false;
}

var LoadMore = new LoadMore();