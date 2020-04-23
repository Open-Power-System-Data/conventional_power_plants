/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./js/scripts_es6.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./js/scripts_es6.js":
/*!***************************!*\
  !*** ./js/scripts_es6.js ***!
  \***************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/regenerator */ "./node_modules/@babel/runtime/regenerator/index.js");
/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);



var cf7signature_resized = 0; // for compatibility with contact-form-7-signature-addon

var wpcf7cf_timeout;
var wpcf7cf_show_animation = {
  "height": "show",
  "marginTop": "show",
  "marginBottom": "show",
  "paddingTop": "show",
  "paddingBottom": "show"
};
var wpcf7cf_hide_animation = {
  "height": "hide",
  "marginTop": "hide",
  "marginBottom": "hide",
  "paddingTop": "hide",
  "paddingBottom": "hide"
};
var wpcf7cf_show_step_animation = {
  "opacity": "show"
};
var wpcf7cf_hide_step_animation = {
  "opacity": "hide"
};
var wpcf7cf_change_events = 'input.wpcf7cf paste.wpcf7cf change.wpcf7cf click.wpcf7cf propertychange.wpcf7cf';
var wpcf7cf_forms = []; // endswith polyfill

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }

    return this.substring(this_len - search.length, this_len) === search;
  };
}

var Wpcf7cfForm = function Wpcf7cfForm($form) {
  var options_element = $form.find('input[name="_wpcf7cf_options"]').eq(0);

  if (!options_element.length || !options_element.val()) {
    // doesn't look like a CF7 form created with conditional fields plugin enabled.
    return false;
  }

  var form = this;
  var form_options = JSON.parse(options_element.val());
  form.$form = $form;
  form.$input_hidden_group_fields = $form.find('[name="_wpcf7cf_hidden_group_fields"]');
  form.$input_hidden_groups = $form.find('[name="_wpcf7cf_hidden_groups"]');
  form.$input_visible_groups = $form.find('[name="_wpcf7cf_visible_groups"]');
  form.$input_repeaters = $form.find('[name="_wpcf7cf_repeaters"]');
  form.$input_steps = $form.find('[name="_wpcf7cf_steps"]');
  form.unit_tag = $form.closest('.wpcf7').attr('id');
  form.conditions = form_options['conditions']; // compatibility with conditional forms created with older versions of the plugin ( < 1.4 )

  for (var i = 0; i < form.conditions.length; i++) {
    var condition = form.conditions[i];

    if (!('and_rules' in condition)) {
      condition.and_rules = [{
        'if_field': condition.if_field,
        'if_value': condition.if_value,
        'operator': condition.operator
      }];
    }
  }

  form.initial_conditions = form.conditions;
  form.settings = form_options['settings'];
  form.$groups = jQuery(); // empty jQuery set

  form.repeaters = [];
  form.multistep = null;
  form.fields = [];
  form.settings.animation_intime = parseInt(form.settings.animation_intime);
  form.settings.animation_outtime = parseInt(form.settings.animation_outtime);

  if (form.settings.animation === 'no') {
    form.settings.animation_intime = 0;
    form.settings.animation_outtime = 0;
  }

  form.updateGroups();
  form.updateEventListeners();
  form.displayFields(); // bring form in initial state if the reset event is fired on it.

  form.$form.on('reset', form, function (e) {
    var form = e.data;
    setTimeout(function () {
      form.displayFields();
    }, 200);
  }); // PRO ONLY

  jQuery('.wpcf7cf_repeater:not(.wpcf7cf_repeater .wpcf7cf_repeater)', $form).each(function () {
    form.repeaters.push(new Wpcf7cfRepeater(jQuery(this), form));
  });
  form.$input_repeaters.val(JSON.stringify(form.repeaters.map(function (item) {
    return item.params.$repeater.id;
  })));
  var $multistep = jQuery('.wpcf7cf_multistep', $form);

  if ($multistep.length) {
    form.multistep = new Wpcf7cfMultistep($multistep, form); // window.wpcf7cf.updateMultistepState(form.multistep);
  } // END PRO ONLY

};

Wpcf7cfForm.prototype.displayFields = function () {
  var form = this;
  window.wpcf7cf.get_simplified_dom_model(form.$form);
  var unit_tag = this.unit_tag;
  var wpcf7cf_conditions = this.conditions;
  var wpcf7cf_settings = this.settings; //for compatibility with contact-form-7-signature-addon

  if (cf7signature_resized === 0 && typeof signatures !== 'undefined' && signatures.constructor === Array && signatures.length > 0) {
    for (var i = 0; i < signatures.length; i++) {
      if (signatures[i].canvas.width === 0) {
        var $sig_canvas = jQuery(".wpcf7-form-control-signature-body>canvas");
        var $sig_wrap = jQuery(".wpcf7-form-control-signature-wrap");
        $sig_canvas.eq(i).attr('width', $sig_wrap.width());
        $sig_canvas.eq(i).attr('height', $sig_wrap.height());
        cf7signature_resized = 1;
      }
    }
  }

  form.$groups.addClass('wpcf7cf-hidden');

  for (var i = 0; i < wpcf7cf_conditions.length; i++) {
    var condition = wpcf7cf_conditions[i];
    var show_group = window.wpcf7cf.should_group_be_shown(condition, form.$form);

    if (show_group) {
      jQuery('[data-id=' + condition.then_field + ']', form.$form).eq(0).removeClass('wpcf7cf-hidden');
    }
  }

  var animation_intime = wpcf7cf_settings.animation_intime;
  var animation_outtime = wpcf7cf_settings.animation_outtime;
  form.$groups.each(function (index) {
    var $group = jQuery(this);
    if ($group.is(':animated')) $group.finish(); // stop any current animations on the group

    if ($group.css('display') === 'none' && !$group.hasClass('wpcf7cf-hidden')) {
      if ($group.prop('tagName') === 'SPAN') {
        $group.show().trigger('wpcf7cf_show_group');
      } else {
        $group.animate(wpcf7cf_show_animation, animation_intime).trigger('wpcf7cf_show_group'); // show
      }
    } else if ($group.css('display') !== 'none' && $group.hasClass('wpcf7cf-hidden')) {
      if ($group.attr('data-clear_on_hide') !== undefined) {
        var $inputs = jQuery(':input', $group).not(':button, :submit, :reset, :hidden');
        $inputs.each(function () {
          var $this = jQuery(this);
          $this.val(this.defaultValue);
          $this.prop('checked', this.defaultChecked);
        });
        $inputs.change(); //display_fields();
      }

      if ($group.prop('tagName') === 'SPAN') {
        $group.hide().trigger('wpcf7cf_hide_group');
      } else {
        $group.animate(wpcf7cf_hide_animation, animation_outtime).trigger('wpcf7cf_hide_group'); // hide
      }
    }
  });
  form.updateHiddenFields();
};

Wpcf7cfForm.prototype.updateHiddenFields = function () {
  var form = this;
  var hidden_fields = [];
  var hidden_groups = [];
  var visible_groups = [];
  form.$groups.each(function () {
    var $this = jQuery(this);

    if ($this.hasClass('wpcf7cf-hidden')) {
      hidden_groups.push($this.data('id'));
      $this.find('input,select,textarea').each(function () {
        hidden_fields.push(jQuery(this).attr('name'));
      });
    } else {
      visible_groups.push($this.data('id'));
    }
  });
  form.hidden_fields = hidden_fields;
  form.hidden_groups = hidden_groups;
  form.visible_groups = visible_groups;
  form.$input_hidden_group_fields.val(JSON.stringify(hidden_fields));
  form.$input_hidden_groups.val(JSON.stringify(hidden_groups));
  form.$input_visible_groups.val(JSON.stringify(visible_groups));
  return true;
};

Wpcf7cfForm.prototype.updateGroups = function () {
  var form = this;
  form.$groups = form.$form.find('[data-class="wpcf7cf_group"]');
  form.conditions = window.wpcf7cf.get_nested_conditions(form.initial_conditions, form.$form);
};

Wpcf7cfForm.prototype.updateEventListeners = function () {
  var form = this; // monitor input changes, and call display_fields() if something has changed

  jQuery('input, select, textarea, button', form.$form).not('.wpcf7cf_add, .wpcf7cf_remove').off(wpcf7cf_change_events).on(wpcf7cf_change_events, form, function (e) {
    var form = e.data;
    clearTimeout(wpcf7cf_timeout);
    wpcf7cf_timeout = setTimeout(function () {
      form.displayFields();
    }, 100);
  }); // PRO ONLY

  jQuery('.wpcf7cf-togglebutton', form.$form).off('click.toggle_wpcf7cf').on('click.toggle_wpcf7cf', function () {
    var $this = jQuery(this);

    if ($this.text() === $this.data('val-1')) {
      $this.text($this.data('val-2'));
      $this.val($this.data('val-2'));
    } else {
      $this.text($this.data('val-1'));
      $this.val($this.data('val-1'));
    }
  }); // END PRO ONLY
}; // PRO ONLY


function Wpcf7cfRepeater($repeater, form) {
  var $ = jQuery;
  var repeater = this;
  var wpcf7cf_settings = form.settings;
  repeater.form = form;
  $repeater.num_subs = 0;
  $repeater.id = $repeater.data('id');
  $repeater.orig_id = $repeater.data('orig_data_id');
  $repeater.min = typeof $repeater.data('min') !== 'undefined' ? parseInt($repeater.data('min')) : 1;
  $repeater.max = typeof $repeater.data('max') !== 'undefined' ? parseInt($repeater.data('max')) : 200;
  $repeater.initial_subs = typeof $repeater.data('initial') !== 'undefined' ? parseInt($repeater.data('initial')) : $repeater.min;
  if ($repeater.initial_subs > $repeater.max) $repeater.initial_subs = $repeater.max;
  var $repeater_sub = $repeater.children('.wpcf7cf_repeater_sub').eq(0);
  var $repeater_controls = $repeater.children('.wpcf7cf_repeater_controls').eq(0);
  var $repeater_sub_clone = $repeater_sub.clone();
  $repeater_sub_clone.find('.wpcf7cf_repeater_sub').addBack('.wpcf7cf_repeater_sub').each(function () {
    var $this = jQuery(this);
    var prev_suffix = $this.attr('data-repeater_sub_suffix');
    var new_suffix = prev_suffix + '__{{repeater_sub_suffix}}';
    $this.attr('data-repeater_sub_suffix', new_suffix);
  });
  $repeater_sub_clone.find('[name]').each(function () {
    var $this = jQuery(this);
    var prev_name = $this.attr('name');
    var orig_name = $this.attr('data-orig_name') != null ? $this.attr('data-orig_name') : prev_name;
    var new_name = prev_name + '__{{repeater_sub_suffix}}';

    if (prev_name.endsWith('_count')) {
      new_name = prev_name.replace('_count', '__{{repeater_sub_suffix}}_count');
    }

    $this.attr('name', new_name);
    $this.attr('data-orig_name', orig_name);
    $this.closest('.wpcf7-form-control-wrap').addClass(new_name);
  });
  $repeater_sub_clone.find('.wpcf7cf_repeater,[data-class="wpcf7cf_group"]').each(function () {
    var $this = jQuery(this);
    var prev_data_id = $this.attr('data-id');
    var orig_data_id = $this.attr('data-orig_data_id') != null ? $this.attr('data-orig_data_id') : prev_data_id;
    var new_data_id = prev_data_id + '__{{repeater_sub_suffix}}';

    if (prev_data_id.endsWith('_count')) {
      new_data_id = prev_data_id.replace('_count', '__{{repeater_sub_suffix}}_count');
    }

    $this.attr('data-id', new_data_id);
    $this.attr('data-orig_data_id', orig_data_id);
    $this.closest('.wpcf7-form-control-wrap').addClass(new_data_id);
  });
  $repeater_sub_clone.find('[id]').each(function () {
    var $this = jQuery(this);
    var prev_id = $this.attr('id');
    var orig_id = $this.attr('data-orig_id') != null ? $this.attr('data-orig_id') : prev_id;
    var new_id = prev_id + '__{{repeater_sub_suffix}}';
    $this.attr('id', new_id);
    $this.attr('data-orig_id', orig_id);
    $this.closest('.wpcf7-form-control-wrap').addClass(new_id);
  });
  $repeater_sub_clone.find('[for]').each(function () {
    var $this = jQuery(this);
    var prev_for = $this.attr('for');
    var orig_for = $this.attr('data-orig_for') != null ? $this.attr('data-orig_for') : prev_for;
    var new_for = prev_for + '__{{repeater_sub_suffix}}';
    $this.attr('for', new_for);
    $this.attr('data-orig_for', orig_for);
    $this.closest('.wpcf7-form-control-wrap').addClass(new_for);
  });
  var repeater_sub_html = $repeater_sub_clone[0].outerHTML;
  var $repeater_count_field = $repeater.find('[name=' + $repeater.id + '_count]').eq(0);
  var $button_add = $repeater_controls.find('.wpcf7cf_add').eq(0);
  var $button_remove = $repeater_controls.find('.wpcf7cf_remove').eq(0);
  var params = {
    $repeater: $repeater,
    $repeater_count_field: $repeater_count_field,
    repeater_sub_html: repeater_sub_html,
    $repeater_controls: $repeater_controls,
    $button_add: $button_add,
    $button_remove: $button_remove,
    wpcf7cf_settings: wpcf7cf_settings
  };
  this.params = params;
  $button_add.click(repeater, function (e) {
    var repeater = e.data;
    repeater.updateSubs(params.$repeater.num_subs + 1);
  });
  $button_remove.click(repeater, function (e) {
    var repeater = e.data;
    repeater.updateSubs(params.$repeater.num_subs - 1);
  });
  jQuery('> .wpcf7cf_repeater_sub', params.$repeater).eq(0).remove(); // remove the first sub, it's just a template.

  repeater.updateSubs($repeater.initial_subs);
}

Wpcf7cfRepeater.prototype.updateSubs = function (subs_to_show) {
  var repeater = this;
  var params = repeater.params;
  var subs_to_add = subs_to_show - params.$repeater.num_subs;

  if (subs_to_add < 0) {
    repeater.removeSubs(-subs_to_add);
  } else if (subs_to_add > 0) {
    repeater.addSubs(subs_to_add);
  }

  var showButtonRemove = false;
  var showButtonAdd = false;

  if (params.$repeater.num_subs < params.$repeater.max) {
    showButtonAdd = true;
  }

  if (params.$repeater.num_subs > params.$repeater.min) {
    showButtonRemove = true;
  }

  if (showButtonAdd) {
    params.$button_add.show();
  } else {
    params.$button_add.hide();
  }

  if (showButtonRemove) {
    params.$button_remove.show();
  } else {
    params.$button_remove.hide();
  }

  params.$repeater_count_field.val(subs_to_show);
};

Wpcf7cfRepeater.prototype.addSubs = function (subs_to_add) {
  var $ = jQuery;
  var params = this.params;
  var repeater = this;
  var form = repeater.form;
  var $repeater = params.$repeater;
  var $repeater_controls = params.$repeater_controls; //jQuery(params.repeater_sub_html.replace(/name="(.*?)"/g,'name="wpcf7cf_repeater['+$repeater.id+']['+$repeater.num_subs+'][$1]" data-original-name="$1"')).hide().insertBefore($repeater_controls).animate(wpcf7cf_show_animation, params.wpcf7cf_settings.animation_intime);

  var html_str = '';

  for (var i = 1; i <= subs_to_add; i++) {
    var sub_suffix = $repeater.num_subs + i;
    html_str += params.repeater_sub_html.replace(/\{\{repeater_sub_suffix\}\}/g, sub_suffix).replace(new RegExp('\{\{' + $repeater.orig_id + '_index\}\}', 'g'), sub_suffix);
  }

  var $html = jQuery(html_str); // Add the newly created fields to the form

  $html.hide().insertBefore($repeater_controls).animate(wpcf7cf_show_animation, params.wpcf7cf_settings.animation_intime).trigger('wpcf7cf_repeater_added');
  jQuery('.wpcf7cf_repeater', $html).each(function () {
    form.repeaters.push(new Wpcf7cfRepeater(jQuery(this), form));
  });
  form.$input_repeaters.val(JSON.stringify(form.repeaters.map(function (item) {
    return item.params.$repeater.id;
  })));
  $repeater.num_subs += subs_to_add;
  window.wpcf7cf.updateMultistepState(form.multistep);
  form.updateGroups();
  form.updateEventListeners();
  form.displayFields(); // Exclusive Checkbox

  $html.on('click', '.wpcf7-exclusive-checkbox input:checkbox', function () {
    var name = $(this).attr('name');
    $html.find('input:checkbox[name="' + name + '"]').not(this).prop('checked', false);
  }); //basic compatibility with material-design-for-contact-form-7

  if (typeof window.cf7mdInit === "function") {
    window.cf7mdInit();
  }

  return false;
};

Wpcf7cfRepeater.prototype.removeSubs = function (num_subs) {
  var $ = jQuery;
  var params = this.params;
  var form = this.form;
  params.$repeater.num_subs -= num_subs;
  jQuery('> .wpcf7cf_repeater_sub', params.$repeater).slice(-num_subs).animate(wpcf7cf_hide_animation, {
    duration: params.wpcf7cf_settings.animation_intime,
    done: function done() {
      var $this = jQuery(this); //remove the actual fields from the form

      $this.remove();
      params.$repeater.trigger('wpcf7cf_repeater_removed');
      window.wpcf7cf.updateMultistepState(form.multistep);
      form.updateGroups();
      form.updateEventListeners();
      form.displayFields();
    }
  });
  return false;
};

function Wpcf7cfMultistep($multistep, form) {
  var multistep = this;
  multistep.$multistep = $multistep;
  multistep.form = form;
  multistep.$steps = $multistep.find('.wpcf7cf_step');
  multistep.$btn_next = $multistep.find('.wpcf7cf_next');
  multistep.$btn_prev = $multistep.find('.wpcf7cf_prev');
  multistep.$dots = $multistep.find('.wpcf7cf_steps-dots');
  multistep.current_step = 0;
  multistep.numSteps = multistep.$steps.length;
  multistep.$dots.html('');

  for (var i = 1; i <= multistep.numSteps; i++) {
    multistep.$dots.append("\n            <div class=\"dot\" data-step=\"".concat(i, "\">\n                <div class=\"step-index\">").concat(i, "</div>\n                <div class=\"step-title\">").concat(multistep.$steps.eq(i - 1).data('title'), "</div>\n            </div>\n        "));
  }

  multistep.$btn_next.on('click.wpcf7cf_step', function _callee() {
    var result;
    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.awrap(multistep.validateStep(multistep.current_step));

          case 2:
            result = _context.sent;
            console.log('got this result: ' + result);

            if (result === 'success') {
              multistep.moveToStep(multistep.current_step + 1);
            }

          case 5:
          case "end":
            return _context.stop();
        }
      }
    });
  });
  multistep.$btn_prev.click(function () {
    multistep.moveToStep(multistep.current_step - 1);
  });
  multistep.moveToStep(1);
}

Wpcf7cfMultistep.prototype.validateStep = function (step_index) {
  var _this = this;

  return new Promise(function (resolve) {
    var multistep = _this;
    var $multistep = multistep.$multistep; //validation

    var $form = multistep.form.$form;
    var fd = new FormData(); // TEST IF FILES UPLOADS WORK? THEN REMOVE THIS
    // jQuery.each($form.find('[data-id="step'+step_index+'"] input[type="file"]'), function(index, el) {
    //     fd.append(jQuery(el).attr('name'), jQuery(el)[0].files[0]);
    // });

    var formdata = $form.serializeArray();
    jQuery.each(formdata, function (key, input) {
      fd.append(input.name, input.value);
    });
    jQuery.ajax({
      url: wpcf7cf_global_settings.ajaxurl + '?action=wpcf7cf_validate_step',
      type: 'POST',
      data: fd,
      processData: false,
      contentType: false,
      dataType: 'json'
    }).done(function (json) {
      /*
      * Insert _form_data_id if 'json variable' has
      */
      if (typeof json._cf7mls_db_form_data_id != 'undefined') {
        if (!form.find('input[name="_cf7mls_db_form_data_id"]').length) {
          form.append('<input type="hidden" name="_cf7mls_db_form_data_id" value="' + json._cf7mls_db_form_data_id + '" />');
        }
      } //reset error messages


      $multistep.find('.wpcf7-form-control-wrap').removeClass('cf7mls-invalid');
      $multistep.find('.wpcf7-form-control-wrap .wpcf7-not-valid-tip').remove();
      $multistep.find('.wpcf7-response-output').remove();
      $multistep.find('.wpcf7-response-output.wpcf7-validation-errors').removeClass('wpcf7-validation-errors');

      if (!json.success) {
        var checkError = 0;
        jQuery.each(json.invalid_fields, function (index, el) {
          if ($multistep.find('input[name="' + index + '"]').length || $multistep.find('input[name="' + index + '[]"]').length || $multistep.find('select[name="' + index + '"]').length || $multistep.find('select[name="' + index + '[]"]').length || $multistep.find('textarea[name="' + index + '"]').length || $multistep.find('textarea[name="' + index + '[]"]').length) {
            checkError = checkError + 1;
            var controlWrap = jQuery('.wpcf7-form-control-wrap.' + index, $form);
            controlWrap.addClass('cf7mls-invalid');
            controlWrap.find('span.wpcf7-not-valid-tip').remove();
            controlWrap.append('<span role="alert" class="wpcf7-not-valid-tip">' + el.reason + '</span>'); //return false;
          }
        });
        resolve('failed');
        $multistep.append('<div class="wpcf7-response-output wpcf7-display-none wpcf7-validation-errors" style="display: block;" role="alert">' + json.message + '</div>');
      } else if (json.success) {
        resolve('success');
        return false;
      }
    }).fail(function () {
      resolve('error');
    }).always(function () {// do nothing
    });
  });
};

Wpcf7cfMultistep.prototype.moveToStep = function (step_index) {
  var multistep = this;
  var previousStep = multistep.current_step;
  multistep.current_step = step_index > multistep.numSteps ? multistep.numSteps : step_index < 1 ? 1 : step_index; // ANIMATION DISABLED FOR NOW cause it's ugly
  // multistep.$steps.animate(wpcf7cf_hide_step_animation, multistep.form.settings.animation_outtime);
  // multistep.$steps.eq(multistep.current_step-1).animate(wpcf7cf_show_step_animation, multistep.form.settings.animation_intime);

  multistep.$multistep.attr('data-current_step', multistep.current_step);
  multistep.$steps.hide();
  multistep.$steps.eq(multistep.current_step - 1).show().trigger('wpcf7cf_change_step', [previousStep, multistep.current_step]); // change step;

  window.wpcf7cf.updateMultistepState(multistep);
};

Wpcf7cfMultistep.prototype.getFieldsInStep = function (step_index) {
  var simpleDom = window.wpcf7cf.get_simplified_dom_model(this.form.$form);
  var inStep = false;
  return simpleDom.filter(function (item, i) {
    if (item.type == 'step') {
      inStep = item.step == step_index + '';
    }

    return inStep && item.type == 'input';
  }).map(function (item) {
    return item.name;
  });
}; // END PRO ONLY


window.wpcf7cf = {
  // keep this for backwards compatibility
  initForm: function initForm($form) {
    wpcf7cf_forms.push(new Wpcf7cfForm($form));
  },
  get_nested_conditions: function get_nested_conditions(conditions, $current_form) {
    //loop trough conditions. Then loop trough the dom, and each repeater we pass we should update all sub_values we encounter with __index
    var simplified_dom = window.wpcf7cf.get_simplified_dom_model($current_form);
    var groups = simplified_dom.filter(function (item, i) {
      return item.type === 'group';
    });
    var sub_conditions = [];

    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var relevant_conditions = conditions.filter(function (condition, i) {
        return condition.then_field === g.original_name;
      });
      var relevant_conditions = relevant_conditions.map(function (item, i) {
        return {
          then_field: g.name,
          and_rules: item.and_rules.map(function (and_rule, i) {
            return {
              if_field: and_rule.if_field + g.suffix,
              if_value: and_rule.if_value,
              operator: and_rule.operator
            };
          })
        };
      });
      sub_conditions = sub_conditions.concat(relevant_conditions);
    }

    return conditions.concat(sub_conditions);
  },
  get_simplified_dom_model: function get_simplified_dom_model($current_form) {
    // if the dom is something like:
    // <form>
    //   <repeater ra>
    //     <group ga__1>
    //         <repeater rb__1>
    //             <input txta__1__1 />
    //             <input txta__1__2 />
    //         </repeater>
    //         <group gb__1>
    //             <input txtb__1 />
    //         </group>
    //     </group>
    //     <group ga__2>
    //         <repeater rb__2>
    //             <input txta__2__1 />
    //         </repeater>
    //         <group gb__2>
    //             <input txtb__2 />
    //         </group>
    //     </group>
    //   </repeater>
    // </form>
    // 
    // return something like:
    // [{type:repeater, name:'ra', suffix: '__1'}, {type: group, name:'ga', suffix: '__1'}, ...]
    var currentNode;
    var ni = document.createNodeIterator($current_form[0], NodeFilter.SHOW_ELEMENT, null, false); //, NodeFilter.SHOW_ELEMENT, function(){ return NodeFilter.FILTER_ACCEPT; }

    var simplified_dom = [];

    while (currentNode = ni.nextNode()) {
      if (currentNode.classList.contains('wpcf7cf_repeater')) {
        simplified_dom.push({
          type: 'repeater',
          name: currentNode.dataset.id,
          original_name: currentNode.dataset.orig_data_id
        });
      } else if (currentNode.dataset["class"] == 'wpcf7cf_group') {
        simplified_dom.push({
          type: 'group',
          name: currentNode.dataset.id,
          original_name: currentNode.dataset.orig_data_id
        });
      } else if (currentNode.className == 'wpcf7cf_step') {
        simplified_dom.push({
          type: 'step',
          name: currentNode.dataset.id,
          original_name: currentNode.dataset.id,
          step: currentNode.dataset.id.substring(5)
        });
      } else if (currentNode.hasAttribute('name')) {
        simplified_dom.push({
          type: 'input',
          name: currentNode.getAttribute('name'),
          original_name: currentNode.getAttribute('data-orig_name')
        });
      }
    }

    simplified_dom = simplified_dom.map(function (item, i) {
      var original_name_length = item.original_name == null ? item.name.length : item.original_name.length;
      item.suffix = item.name.substring(original_name_length);
      return item;
    }); //console.table(simplified_dom);

    return simplified_dom;
  },
  updateMultistepState: function updateMultistepState(multistep) {
    if (multistep == null) return; // update hidden input field

    var stepsData = {
      currentStep: multistep.current_step,
      numSteps: multistep.numSteps,
      fieldsInCurrentStep: multistep.getFieldsInStep(multistep.current_step)
    };
    multistep.form.$input_steps.val(JSON.stringify(stepsData)); // update Buttons

    multistep.$btn_prev.removeClass('disabled');
    multistep.$btn_next.removeClass('disabled');

    if (multistep.current_step == multistep.numSteps) {
      multistep.$btn_next.addClass('disabled');
    }

    if (multistep.current_step == 1) {
      multistep.$btn_prev.addClass('disabled');
    } // replace next button with submit button on last step.
    // TODO: make this depend on a setting


    var $submit_button = multistep.form.$form.find('input[type="submit"]').eq(0);

    if (multistep.current_step == multistep.numSteps) {
      var $submit_clone = $submit_button.clone();
      $submit_button.hide();
      multistep.$btn_next.hide();
      multistep.$btn_next.parent().append($submit_clone);
    } else {
      multistep.$btn_next.parent().find('input[type=submit]').remove();
      $submit_button.show();
      multistep.$btn_next.show();
    } // update dots


    var $dots = multistep.$dots.find('.dot');
    $dots.removeClass('active').removeClass('completed');

    for (var step = 1; step <= multistep.numSteps; step++) {
      if (step < multistep.current_step) {
        $dots.eq(step - 1).addClass('completed');
      } else if (step == multistep.current_step) {
        $dots.eq(step - 1).addClass('active');
      }
    }
  },
  should_group_be_shown: function should_group_be_shown(condition, $current_form) {
    var $ = jQuery;
    var show_group = true;

    for (var and_rule_i = 0; and_rule_i < condition.and_rules.length; and_rule_i++) {
      var condition_ok = false;
      var condition_and_rule = condition.and_rules[and_rule_i];
      var $field = jQuery('[name="' + condition_and_rule.if_field + '"], [name="' + condition_and_rule.if_field + '[]"], [data-original-name="' + condition_and_rule.if_field + '"], [data-original-name="' + condition_and_rule.if_field + '[]"]', $current_form);
      var if_val = condition_and_rule.if_value;
      var if_val_as_number = isFinite(parseFloat(if_val)) ? parseFloat(if_val) : 0;
      var operator = condition_and_rule.operator;
      var regex_patt = /.*/i; // fallback regex pattern

      var isValidRegex = true;

      try {
        regex_patt = new RegExp(if_val, 'i');
      } catch (e) {
        isValidRegex = false;
      } //backwards compat


      operator = operator === '≤' ? 'less than or equals' : operator;
      operator = operator === '≥' ? 'greater than or equals' : operator;
      operator = operator === '>' ? 'greater than' : operator;
      operator = operator === '<' ? 'less than' : operator;

      if ($field.length === 1) {
        // single field (tested with text field, single checkbox, select with single value (dropdown), select with multiple values)
        if ($field.is('select')) {
          if (operator === 'not equals') {
            condition_ok = true;
          }

          $field.find('option:selected').each(function () {
            var $option = jQuery(this);
            var option_val = $option.val();

            if (operator === 'equals' && option_val === if_val || operator === 'equals (regex)' && regex_patt.test($option.val())) {
              condition_ok = true;
            } else if (operator === 'not equals' && option_val === if_val || operator === 'not equals (regex)' && !regex_patt.test($option.val())) {
              condition_ok = false;
              return false; // break out of the loop
            }
          });
          show_group = show_group && condition_ok;
        }

        var field_val = $field.val();
        var field_val_as_number = isFinite(parseFloat(field_val)) ? parseFloat(field_val) : 0;

        if ($field.attr('type') === 'checkbox') {
          var field_is_checked = $field.is(':checked');

          if (operator === 'equals' && field_is_checked && field_val === if_val || operator === 'not equals' && !field_is_checked || operator === 'is empty' && !field_is_checked || operator === 'not empty' && field_is_checked || operator === 'greater than' && field_is_checked && field_val_as_number > if_val_as_number || operator === 'less than' && field_is_checked && field_val_as_number < if_val_as_number || operator === 'greater than or equals' && field_is_checked && field_val_as_number >= if_val_as_number || operator === 'less than or equals' && field_is_checked && field_val_as_number <= if_val_as_number || operator === 'equals (regex)' && field_is_checked && regex_patt.test(field_val) || operator === 'not equals (regex)' && !field_is_checked) {
            condition_ok = true;
          }
        } else if (operator === 'equals' && field_val === if_val || operator === 'not equals' && field_val !== if_val || operator === 'equals (regex)' && regex_patt.test(field_val) || operator === 'not equals (regex)' && !regex_patt.test(field_val) || operator === 'greater than' && field_val_as_number > if_val_as_number || operator === 'less than' && field_val_as_number < if_val_as_number || operator === 'greater than or equals' && field_val_as_number >= if_val_as_number || operator === 'less than or equals' && field_val_as_number <= if_val_as_number || operator === 'is empty' && field_val === '' || operator === 'not empty' && field_val !== '' || operator === 'function' && typeof window[if_val] == 'function' && window[if_val]($field)) {
          condition_ok = true;
        }
      } else if ($field.length > 1) {
        // multiple fields (tested with checkboxes, exclusive checkboxes, dropdown with multiple values)
        var all_values = [];
        var checked_values = [];
        $field.each(function () {
          all_values.push(jQuery(this).val());

          if (jQuery(this).is(':checked')) {
            checked_values.push(jQuery(this).val());
          }
        });
        var checked_value_index = jQuery.inArray(if_val, checked_values);
        var value_index = jQuery.inArray(if_val, all_values);

        if (operator === 'is empty' && checked_values.length === 0 || operator === 'not empty' && checked_values.length > 0) {
          condition_ok = true;
        }

        for (var ind = 0; ind < checked_values.length; ind++) {
          var checked_val = checked_values[ind];
          var checked_val_as_number = isFinite(parseFloat(checked_val)) ? parseFloat(checked_val) : 0;

          if (operator === 'equals' && checked_val === if_val || operator === 'not equals' && checked_val !== if_val || operator === 'equals (regex)' && regex_patt.test(checked_val) || operator === 'not equals (regex)' && !regex_patt.test(checked_val) || operator === 'greater than' && checked_val_as_number > if_val_as_number || operator === 'less than' && checked_val_as_number < if_val_as_number || operator === 'greater than or equals' && checked_val_as_number >= if_val_as_number || operator === 'less than or equals' && checked_val_as_number <= if_val_as_number) {
            condition_ok = true;
          }
        }
      }

      show_group = show_group && condition_ok;
    }

    return show_group;
  }
};
jQuery('.wpcf7-form').each(function () {
  wpcf7cf_forms.push(new Wpcf7cfForm(jQuery(this)));
}); // Call displayFields again on all forms
// Necessary in case some theme or plugin changed a form value by the time the entire page is fully loaded.

jQuery('document').ready(function () {
  wpcf7cf_forms.forEach(function (f) {
    f.displayFields();
  });
}); // fix for exclusive checkboxes in IE (this will call the change-event again after all other checkboxes are unchecked, triggering the display_fields() function)

var old_wpcf7ExclusiveCheckbox = jQuery.fn.wpcf7ExclusiveCheckbox;

jQuery.fn.wpcf7ExclusiveCheckbox = function () {
  return this.find('input:checkbox').click(function () {
    var name = jQuery(this).attr('name');
    jQuery(this).closest('form').find('input:checkbox[name="' + name + '"]').not(this).prop('checked', false).eq(0).change();
  });
};

/***/ }),

/***/ "./node_modules/@babel/runtime/regenerator/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/regenerator/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! regenerator-runtime */ "./node_modules/regenerator-runtime/runtime.js");

/***/ }),

/***/ "./node_modules/regenerator-runtime/runtime.js":
/*!*****************************************************!*\
  !*** ./node_modules/regenerator-runtime/runtime.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var runtime = function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.

  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.

    generator._invoke = makeInvokeMethod(innerFn, self, context);
    return generator;
  }

  exports.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.

  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.

  var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.

  function Generator() {}

  function GeneratorFunction() {}

  function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.


  var IteratorPrototype = {};

  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

  if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction"; // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.

  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  exports.mark = function (genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;

      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }

    genFun.prototype = Object.create(Gp);
    return genFun;
  }; // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.


  exports.awrap = function (arg) {
    return {
      __await: arg
    };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);

      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;

        if (value && _typeof(value) === "object" && hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function (unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function (error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise = // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    } // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).


    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };

  exports.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.

  exports.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));
    return exports.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;
    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        } // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;

        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);

          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;
        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);
        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;
        var record = tryCatch(innerFn, self, context);

        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };
        } else if (record.type === "throw") {
          state = GenStateCompleted; // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.

          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  } // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.


  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];

    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError("The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (!info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

      context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.

      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }
    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    } // The delegate iterator is finished, so forget it and continue with
    // the outer generator.


    context.delegate = null;
    return ContinueSentinel;
  } // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.


  defineIteratorMethods(Gp);
  Gp[toStringTagSymbol] = "Generator"; // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{
      tryLoc: "root"
    }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function (object) {
    var keys = [];

    for (var key in object) {
      keys.push(key);
    }

    keys.reverse(); // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.

    return function next() {
      while (keys.length) {
        var key = keys.pop();

        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      } // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.


      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];

      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;
          return next;
        };

        return next.next = next;
      }
    } // Return an iterator with no values.


    return {
      next: doneResult
    };
  }

  exports.values = values;

  function doneResult() {
    return {
      value: undefined,
      done: true
    };
  }

  Context.prototype = {
    constructor: Context,
    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0; // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.

      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;
      this.method = "next";
      this.arg = undefined;
      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },
    stop: function stop() {
      this.done = true;
      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;

      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },
    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;

      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },
    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },
    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },
    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },
    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;

          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }

          return thrown;
        }
      } // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.


      throw new Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  }; // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.

  return exports;
}( // If this script is executing as a CommonJS module, use module.exports
// as the regeneratorRuntime namespace. Otherwise create a new empty
// object. Either way, the resulting object will be used to initialize
// the regeneratorRuntime variable at the top of this file.
( false ? undefined : _typeof(module)) === "object" ? module.exports : {});

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (module) {
  if (!module.webpackPolyfill) {
    module.deprecate = function () {};

    module.paths = []; // module.parent = undefined by default

    if (!module.children) module.children = [];
    Object.defineProperty(module, "loaded", {
      enumerable: true,
      get: function get() {
        return module.l;
      }
    });
    Object.defineProperty(module, "id", {
      enumerable: true,
      get: function get() {
        return module.i;
      }
    });
    module.webpackPolyfill = 1;
  }

  return module;
};

/***/ })

/******/ });
//# sourceMappingURL=scripts.js.map