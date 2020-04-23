
var Search = function () { }

function debounce(method, delay) {
    var timer;
    return function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            method();
        }, delay);
    };
}

function initSearch() {

    var searchElements = document.querySelectorAll(".js-typeahead");
    var nodesArray = [].slice.call(searchElements);
    nodesArray.forEach(function (searchElement) {
        const groupsBtn         = searchElement.querySelector(".js-typeahead-groups-btn"),
              groupsContent     = searchElement.querySelector(".js-typeahead-groups-content"),
              searchField       = searchElement.querySelector(".js-typeahead-search-field"),
              searchContent     = searchElement.querySelector(".js-typeahead-search-content"),
              enterBtn          = searchElement.querySelector(".js-typeahead-enter-btn"),
              options           = {
                  pageSize:       searchElement.getAttribute("data-page-size"),
                  searchPageId:   searchElement.getAttribute("data-search-page-id"),
                  resultPageId:   searchElement.getAttribute("data-result-page-id"),
                  groupsPageId:   searchElement.getAttribute("data-groups-page-id"),
                  searchTemplate: searchContent.getAttribute("data-template")
              };
        var   selectionPosition = -1;

        if (groupsBtn) {
            groupsBtn.onclick = function () {
                Dynamo.UpdateContent(groupsContent.getAttribute("id"),
                                     '/Default.aspx?ID='   + options.groupsPageId +
                                     '&LayoutTemplate='    + 'Json.cshtml' +
                                     '&DisableStatistics=' + 'True' +
                                     '&feedType='          + 'productGroups');
            }
        }

        searchField.onkeyup = debounce(function () {
            var query = searchField.value;
            selectionPosition = -1

            if (groupsBtn) {
                if (groupsBtn.getAttribute("data-group-id") != "all") {
                    query += "&GroupID=" + groupsBtn.getAttribute("data-group-id");
                }
            }

            if (query.length > 2) {
                Dynamo.UpdateContent(searchContent.getAttribute("id"),
                                     '/Default.aspx?ID='   + options.searchPageId +
                                     '&LayoutTemplate='    + 'Json.cshtml' +
                                     '&DisableStatistics=' + 'True' +
                                     '&feedType='          + 'productsOnly' +
                                     '&pagesize='          + options.pageSize +
                                     '&Search='            + query +
                                     (options.searchTemplate ? '&Template=' + options.searchTemplate : ''));
                document.getElementsByTagName('body')[0].addEventListener('keydown', keyPress, false);
            } else {
                Dynamo.CleanContainer(searchContent);
            }
        }, 500);

        function clickedOutside(e) {
            if (searchContent.contains(e.target)) {
                document.getElementsByTagName('body')[0].removeEventListener('keydown', keyPress, false);
                return;
            }

            if (e.target != searchField && !e.target.classList.contains("js-ignore-click-outside")) {
                Dynamo.CleanContainer(searchContent);
            }

            if (groupsBtn) {
                if (e.target != groupsBtn && !groupsContent.contains(e.target)) {
                    Dynamo.CleanContainer(groupsContent);
                }
            }

            document.getElementsByTagName('body')[0].removeEventListener('keydown', keyPress, false);
        }

        function keyPress(e) {
            const KEY_CODE = {
                LEFT:   37,
                TOP:    38,
                RIGHT:  39,
                BOTTOM: 40,
                ENTER:  13
            };

            if ([KEY_CODE.LEFT, KEY_CODE.TOP, KEY_CODE.RIGHT, KEY_CODE.BOTTOM].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }

            if (e.keyCode == KEY_CODE.BOTTOM && selectionPosition < (options.pageSize - 1)) {
                selectionPosition++;
                searchField.blur();
            }

            if (e.keyCode == KEY_CODE.TOP && selectionPosition > 0) {
                selectionPosition--;
                searchField.blur();
            }

            var selectedElement = searchContent.childNodes[selectionPosition];

            if (e.keyCode == KEY_CODE.TOP || e.keyCode == KEY_CODE.BOTTOM) {
                for (var i = 0; i < searchContent.childNodes.length; i++) {
                    searchContent.childNodes[i].classList.remove("active");
                }

                if (selectedElement && selectedElement.getElementsByClassName("js-typeahead-name")[0]) {
                    selectedElement.classList.add("active");
                    searchField.value = selectedElement.getElementsByClassName("js-typeahead-name")[0].innerHTML;
                }
            }

            if (e.keyCode == KEY_CODE.ENTER) {
                GetLinkBySelection(selectedElement);
            }

            if (selectedElement && e.keyCode == KEY_CODE.ENTER) {
                selectedElement.click();
                document.getElementsByTagName('body')[0].removeEventListener('keydown', keyPress, false);
            }
        }

        function GetLinkBySelection(selectedElement) {
            var jslink = selectedElement ? selectedElement.getElementsByClassName("js-typeahead-link") : "";

            console.log("wee");

            if (jslink.length > 0) {
                window.location.href = jslink[0].getAttribute("href");
            } else {
                window.location.href = '/Default.aspx?ID=' + options.resultPageId + '&Search=' + searchField.value;
            }
        }

        if (enterBtn) {
            enterBtn.onclick = function () {
                window.location.href = '/Default.aspx?ID=' + options.resultPageId + '&Search=' + searchField.value;
            }
        }

        document.getElementsByTagName('body')[0].addEventListener('click', clickedOutside, true);
    });
}

document.addEventListener("DOMContentLoaded", initSearch);

Search.prototype.UpdateGroupSelection = function (selectedElement) {
    const groupsContent = selectedElement.parentNode,
          groupsBtn     = groupsContent.parentNode.querySelector(".js-typeahead-groups-btn");

    groupsBtn.setAttribute("data-group-id", selectedElement.getAttribute("data-group-id"));
    groupsBtn.innerHTML = selectedElement.innerText;

    Dynamo.CleanContainer(groupsContent);
}

Search.prototype.UpdateFieldValue = function (selectedElement) {
    const searchContent = selectedElement.parentNode,
          searchField   = searchContent.parentNode.querySelector(".js-typeahead-search-field");
    searchField.value = selectedElement.querySelector(".js-typeahead-name").innerText;

    Dynamo.CleanContainer(searchContent);
}

var Search = new Search();