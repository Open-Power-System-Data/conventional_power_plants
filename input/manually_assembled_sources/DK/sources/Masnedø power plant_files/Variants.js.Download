function VariantGroup(id, name, options) {
    this.id = id;
    this.name = name;
    this.VariantOptions = options;
}

function VariantOption(id, productid, name, selected, disabled, color) {
    this.id = id;
    this.productid = productid;
    this.name = name;
    this.selected = selected;
    this.disabled = disabled;
    this.color = color;
}

function CombinationItem(id) {
    this.id = id;
}

function VariantObject(id, variants, combinations) {
    this.id = id;
    this.Variants = variants;
    this.Combinations = combinations;
}

function SetVariantOptionStatesForProductList(variantContainer) {
    if (variantContainer) {
        var productId = variantContainer.getAttribute("data-product-id");
        var product = Dynamo.FindDataInCache("Product" + productId)[0];
        if (product) {
            var variants = product.Variants;
            var combinations = product.Combinations;
            if (variants.length > 0 && combinations.length > 0) {
                SetVariantOptionStates(variants, combinations);
                HandleSelection(variants, productId, false);
            }
        }
    }
}

var productFeedId = 0;
var viewMode = "";

function SetProductFeedId(id) {
    productFeedId = id;
}

function SetViewMode(mode) {
    viewMode = mode;
}

function InitVariants(variants, combinations, productId) {
    viewMode = "singleProduct";
    var data = [];
    SetVariantOptionStates(variants, combinations);
    HandleSelection(variants, productId, false);
    var obj = new VariantObject(productId, variants, combinations);
    data.push(obj);

    Dynamo.CreateItemsFromJson(data, document.getElementById('Variants'));
}

function UpdateVariants(selectedVariant) {
    var data = ModifyDataByAvailableVariants(selectedVariant, true);
    var productId = selectedVariant.getAttribute("data-product-id");

    Dynamo.CreateItemsFromJson(data, document.getElementById('Variants' + productId));
}

function ModifyDataByAvailableVariants(selectedVariant, updateLocation) {
    var id = selectedVariant.id;
    var productId = selectedVariant.getAttribute("data-product-id");
    var variantsData = Dynamo.FindDataInCache("Variants" + productId);
    var combinations = Dynamo.FindDataInCache("Combinations" + productId);

    ChangeSelectedOption(id, variantsData);
    SetVariantOptionStates(variantsData, combinations);
    HandleSelection(variantsData, productId, true, updateLocation);

    Dynamo.SetDataInCache(("Variants" + productId), variantsData);

    return variantsData;
}

function HandleSelection(variantsData, productId, updateContent, updateLocation) {
    var selections = FindSelectedVariants(variantsData);

    if (selections.length == variantsData.length) {
        var selectedVariantId = selections.join(".");        
        if (viewMode == "singleProduct" && updateLocation) {
            var url = VariantsReplaceUrlParam("VariantID", selectedVariantId);
            history.pushState(null, null, url);
        }
        var variantElement = document.getElementById("Variant_" + productId);
        if (variantElement) {
            variantElement.value = selectedVariantId;
        }
        SelectionComplete(productId, selections, updateContent);
    } else {
        SelectionMissing(productId);
    }
}

function ChangeSelectedOption(selectedVariantId, variants) {
    for (var i = 0; i < variants.length; i++) {
        var groupOptions = variants[i]['VariantOptions'];
        if (groupOptions.some(function (option) {
            return option.id == selectedVariantId;
        })) {
            groupOptions.forEach(function (option) { option.selected = (option.id == selectedVariantId ? (option.selected == "checked" ? "" : "checked") : ""); });
        }
    }
}

function SetVariantOptionStates(variants, combinations) {
    var availableVariants = [];

    var selectedCombination = variants.map(function (vg) {
        var selectedOption = vg['VariantOptions'].filter(function (option) {
            return option.selected == "checked";
        })[0];
        return selectedOption ? selectedOption.id : "";
    });

    combinations = combinations.map(function (combination) { return combination.id.split("."); });

    if (combinations.length > 0) {
        var combinationsByGroup = [];
        combinations.forEach(function (arr, key) {
            arr.forEach(function (val, arrkey) {
                if (!combinationsByGroup[arrkey]) { combinationsByGroup[arrkey] = []; }
                combinationsByGroup[arrkey].push(val);
            });
        });

        for (currentVariantGroup = 0; currentVariantGroup < variants.length; currentVariantGroup++) {
            var disabledOptions = [];
            var otherOptionsSelected = false;
            for (otherVariantGroup = 0; otherVariantGroup < variants.length; otherVariantGroup++) {
                if (selectedCombination[otherVariantGroup] != "") {
                    if (otherVariantGroup != currentVariantGroup) {
                        otherOptionsSelected = true;
                        var otherGroupAvailableCombinations = combinationsByGroup[otherVariantGroup];

                        var availableOptions = []
                        for (var i = 0; i < otherGroupAvailableCombinations.length ; i++) {
                            var otherAvailableCombination = otherGroupAvailableCombinations[i];
                            if (otherAvailableCombination == selectedCombination[otherVariantGroup]) {
                                availableOptions.push(combinationsByGroup[currentVariantGroup][i]);
                            }
                        }

                        for (property in variants[currentVariantGroup]) {
                            var groupProperty = variants[currentVariantGroup][property];
                            if (typeof groupProperty == 'object') {
                                var otherGroupProperty = variants[otherVariantGroup][property];
                                for (variantOption = 0; variantOption < groupProperty.length; variantOption++) {
                                    //var found = false;
                                    var otherGroupOption = otherGroupProperty[variantOption];
                                    var groupOption = groupProperty[variantOption];
                                    if (availableOptions.indexOf(groupOption.id) == -1) {
                                        disabledOptions.push(groupOption.id);
                                        groupOption.disabled = "disabled";
                                    } else if (disabledOptions.indexOf(groupOption.id) == -1) {
                                        groupOption.disabled = "";
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!otherOptionsSelected) {
                variants[currentVariantGroup]['VariantOptions'].forEach(function (option) {
                    option.disabled = "";
                });
            }
        }
    }

    return variants;
}

function FindSelectedVariants(variants) {
    var selections = [];
    for (variantGroup = 0; variantGroup < variants.length; variantGroup++) {
        for (property in variants[variantGroup]) {
            if (typeof variants[variantGroup][property] == 'object') {
                for (variantOption = 0; variantOption < variants[variantGroup][property].length; variantOption++) {
                    if (variants[variantGroup][property][variantOption].selected == "checked") {
                        selections.push(variants[variantGroup][property][variantOption].id);
                    }
                }
            }
        }
    }
    return selections;
}

function ResetSelections(variants) {
    for (variantGroup = 0; variantGroup < variants.length; variantGroup++) {
        for (property in variants[variantGroup]) {
            if (typeof variants[variantGroup][property] == 'object') {
                for (variantOption = 0; variantOption < variants[variantGroup][property].length; variantOption++) {
                    variants[variantGroup][property][variantOption].selected = "";
                    variants[variantGroup][property][variantOption].disabled = "";
                }
            }
        }
    }
    return variants;
}

function VariantsReplaceUrlParam(paramName, paramValue) {
    var url = window.location.href;

    var pattern = new RegExp('\\b(' + paramName + '=).*?(&|$)');
    if (url.search(pattern) >= 0) {
        return url.replace(pattern, '$1' + paramValue + '$2');
    }

    return url + (url.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue
}

function SelectionMissing(productId) {
    document.getElementById('CartButton_' + productId).disabled = true;
    document.getElementById('CartButton_' + productId).classList.add('disabled');
    document.getElementById('helpText_' + productId).classList.remove('u-visibility-hidden');

    if (document.getElementById('Favorite' + productId)) {
        document.getElementById('Favorite' + productId).classList.add('disabled');
    }
}

function SelectionComplete(productId, selections, updateContent) {
    document.getElementById('CartButton_' + productId).disabled = false;
    document.getElementById('CartButton_' + productId).classList.remove('disabled');
    document.getElementById('helpText_' + productId).classList.add('u-visibility-hidden');

    if (document.getElementById('Favorite' + productId)) {
        document.getElementById('Favorite' + productId).classList.remove('disabled');
    }

    if (updateContent) {
        var feedUrl = "/Default.aspx?ID=" + productFeedId + "&ProductID=" + productId + "&VariantID=" + selections.join(".");
        var containerId = "Product" + productId;
        Dynamo.UpdateContent(containerId, feedUrl);
    }
}

