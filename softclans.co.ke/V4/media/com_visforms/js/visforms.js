/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function ($) {

    $.extend($.fn, {
        //public plugin funtions
        displayChanger: function (options) {
            //Attach onchange event handler to displayChanger Element
            $(".displayChanger").on('change', function (e) {
                $(".conditional").trigger("checkConditionalState");
            });
        },
        //perform the code which is necessary to toggle the display state of one form element
        toggleDisplay: function (options) {
            var defaults = {
                //just an example of adding translated texts, stepAlert is not used
                texts: {
                    stepAlert: "Es wurde ein bedingtes Feld in einem anderen Schritt aktiviert. Evtl. funktionert das Formular nicht mehr."
                }
            };
            var settings = jQuery.extend(true, {}, defaults, options);
            var data = options.restricts;
            var userinputs = $.data($(this).closest("form").get(0), 'userinputs');
            if ((!userinputs) || typeof userinputs === "undefined") {
                return;
            }
            //el is a div class="conditional"
            var el = $(this);
            //data is a list of all conditional fields 
            //index is id of field
            //value is a comma separated string of all fieldids and values the command the conditional field to be visible
            $.each(data, function (index, value) {
                //a conditional field may have different other fields that make it visible
                //we will not hide it, when at least one condition is true
                var hide = true;
                //find the right set of conditions for the div conditional that is actually processed
                if (el.hasClass(index)) {
                    if (elId = el.attr('class').match(index)) {
                        //split the condition string
                        var showWhens = value.split(', ');
                        $.each(showWhens, function (i, v) {
                            //split the condition into a field id and a value that, if selected , will command the field to be visible
                            var showWhen = v.split('__');
                            if (showWhen.length >= 2) {
                                var fieldId = showWhen[0];
                                var conditionalValue = showWhen[1];
                                //Restrictor elements that determine whether field is shown or hidden
                                //we first look if we have a single control with a matching ID
                                var restrictors = $('#' + fieldId);
                                //if not, we deal with a radio or a multi checkbox. Id's are there followed by _n
                                if (restrictors.length < 1) {
                                    var restrictors = $("[id^='" + fieldId + "_']");
                                }
                                //rel is restrictor element
                                //check if we have a value in a retrictor element that will command field to be shown
                                $.each(restrictors, function (ri, rel) {
                                    //only use values of elements that are enabled
                                    if ($(rel).is(':enabled')) {
                                        var tagname = rel.tagName.toLowerCase();
                                        switch (tagname) {
                                            case "input" :
                                                //selected values have checked=checked set
                                                if ($(rel).is(':checked')) {
                                                    if ($(rel).val() == conditionalValue) {
                                                        hide = false;
                                                        return hide;
                                                    }
                                                }
                                                break;
                                            case "select" :
                                                var vals = $(rel).find(':selected');
                                                $.each(vals, function (valindex, selectedValue) {
                                                    if ($(selectedValue).val() == conditionalValue) {
                                                        hide = false;
                                                    }
                                                    return hide;
                                                });
                                                break;
                                            default :
                                                break;
                                        }
                                    }
                                    return hide;
                                });

                                return hide;
                            }
                        })
                    }

                    //controls of element to be shown or hidden
                    //we first look for a control with matching id
                    //_code is field for email verification code
                    var controls = $("#" + index + ", #" + index + "_code");
                    //if not, we deal with a radio or a multi checkbox. Id's are there followed by _n. Or a location Id' are followed by _lat and _lng
                    if (controls.length < 1) {
                        var controls = el.find("[id^='" + index + "_']");
                    }
                    var ctagname = '';
                    if (controls.get(0)) {
                        var ctagname = controls.get(0).tagName.toLowerCase();
                    }
                    if (hide === false) {
                        if ($(controls).is(':disabled') || ((ctagname == 'hr') && $(controls).hasClass('ignore'))) {
                            //enable controls, remove class ignore and disabled, show div conditional
                            showControls(controls, settings);
                            //check if control is displaychanger
                            if (controls.hasClass('displayChanger')) {
                                //check if depending fields must be displayed too
                                toggleChild(data, index);
                            }
                            //use custom event; #index does not exist, if field is radio or multicheckbox, which is ok, because the cannot be used in calculations
                            $('#' + index).trigger('recalculate');
                            return false;
                        }
                    }
                    else {
                        if(($(controls).is(':enabled') || (($(controls).is(':disabled')) && $((controls).attr('data-disabled') != undefined))) || ((ctagname == 'hr') && $(controls).hasClass('ignore') == false)) {
                            //disable controls, set class ignore, hide div conditional
                            hideControls(controls);
                            //check if control is displaychanger
                            if (controls.hasClass('displayChanger')) {
                                //check if depending fields must be hidden too
                                toggleChild(data, index);
                            }
                            //use custom event; #index does not exist, if field is radio or multicheckbox, which is ok, because the cannot be used in calculations
                            $('#' + index).trigger('recalculate');
                            return false;
                        }
                    }
                }
            });

            //additional protected class variables can be declared here.

            //protected helper functions for toggleDisplay

            /**
             * Methode to enable controls, remove class ignore and disabled, show div conditional
             * @param {jQuery selection} controls
             * @returns {Boolean}
             */
            function showControls(controls, settings) {
                if (controls.length < 1) {
                    //no controls found, do nothing
                    return false;
                }
                $.each(controls, function (cindex, control) {
                    //only enable multicheckbox option that have no data-disabled attribute
                    if ($(control).attr('data-disabled') == undefined) {
                        $(control).removeAttr('disabled');
                        $(control).removeClass('ignore');
                        var elid = $(control).get(0).id;
                    }
                    //no radio or checkbox group
                    if (cindex === 0) {
                        $.each(userinputs, function (i, obj) {
                            //set to user input values
                            switch (obj.type) {
                                case "select":
                                case "selectsql":
                                    if (obj.label === elid) {
                                        if ($.isPlainObject(obj.value)) {
                                            var seloptions = $(control).find('option');
                                            $.each(seloptions, function (i, el) {
                                                $.each(obj.value, function (i, val) {
                                                    if ($(el).attr('value') === val) {
                                                        $(el).prop('selected', true);
                                                        //you have to return false to break from an each loop
                                                        return false;
                                                    }
                                                    $(el).prop('selected', false);
                                                    return;
                                                });
                                            });
                                        }
                                    }
                                    break;
                                case "multicheckbox":
                                case "multicheckboxsql":
                                    //control is a single input. It's id (elid) has a additional counter _1....)
                                    // we cannot use the control to set a checked property of each inputs but have to go one level up and then find each input element and set the property
                                    if ($(control).parents("div.conditional").hasClass(obj.label)) {
                                        if ($.isPlainObject(obj.value)) {
                                            var boxes = $(control).parents("div.conditional").find('input');
                                            $.each(boxes, function (i, el) {
                                                $.each(obj.value, function (ix, val) {
                                                    if ($(el).attr('value') === val) {
                                                        $(el).prop('checked', true);
                                                        //you have to return false to break from an each loop
                                                        return false;
                                                    }
                                                    $(el).prop('checked', false);
                                                    return;
                                                });
                                            });
                                        }
                                    }
                                    break;
                                case "radio":
                                case "radiosql":
                                    //control is a single input. It's id (elid) has a additional counter _1....)
                                    // we cannot use the control to set a checked property of each inputs but have to go one level up and then find each input element and set the property
                                    if ($(control).parents("div.conditional").hasClass(obj.label)) {
                                        var radios = $(control).parents("div.conditional").find('input');
                                        $.each(radios, function (i, el) {
                                            if ($(el).attr('value') === obj.value) {
                                                $(el).prop('checked', true);
                                            }
                                            else {
                                                $(el).prop('checked', false);
                                            }
                                        });
                                    }
                                    break;
                                case "checkbox":
                                    if (obj.label === elid) {
                                        $("#" + obj.label).prop("checked", obj.value);
                                        return;
                                    }
                                    break;
                                case "signature" :
                                    if (obj.label === elid) {
                                        $("#" + obj.label).val(obj.value);
                                        if (obj.value === "") {
                                            $("#" + obj.label + "_sig").jSignature("reset");
                                        } else {
                                            $("#" + obj.label + "_sig").jSignature("setData", "data:" + obj.value);
                                        }
                                    }
                                    break;
                                default:
                                    if (obj.label === elid) {
                                        //used to prevent email cloaking in form used in content (plg or module)
                                        $("#" + obj.label).val(obj.value.replace(/&#64/g, '@'));
                                        return;
                                    }
                                    break;
                            }
                        });
                        if ($(control).is('[readonly]') == false) {
                            $(control).parents("div.conditional").find("button").show();
                        }
                        $(control).parents("div.conditional").show();
                        //fix bug in google maps: Map in hidden field not displayed properly.
                        $(control).parents("div.conditional").trigger('reloadVfMap');
                    }
                });
            }

            /**
             * Methode to disable controls, set class ignore, hide div conditional
             * @param {jquery selection} controls
             * @returns {Boolean}
             */
            function hideControls(controls) {
                if (controls.length < 1) {
                    //no controls found, do nothing
                    return false;
                }
                $.each(controls, function (cindex, control) {
                    $(control).attr('disabled', 'disabled');
                    $(control).addClass('ignore');
                    var isCal = $(control).hasClass('isCal');
                    var isLocation = $(control).hasClass('locationinput');
                    var isSearchSelect = $(control).hasClass('select2-hidden-accessible')
                    //do not empty location field value and cal field value
                    if (!(isCal === true) && !(isLocation === true)) {
                        $(control).val(function () {
                            return this.defaultValue;
                        });
                    }
                    $(control).prop('checked', function () {
                        return this.defaultChecked;
                    });
                    elid = $(control).get(0).id;
                    $('#' + elid + ' option').prop('selected', function () {
                        return this.defaultSelected;
                    });
                    if (isSearchSelect) {
                        var seloptions = $(control).find('option');
                        $.each(seloptions, function (i, el) {
                            if ($(el).prop('selected') === true) {
                                $('#select2-' + elid + '-container').html($(el).html());
                                return false;
                            }
                        });
                    }
                    //no radio or checkbox group
                    if (cindex === 0) {
                        //if it is a file upload field we reset the delete file checkbox to unchecked
                        $(control).parents("div.conditional").hide();
                        $(control).parents("div.conditional").find(".deleteFile").prop("checked", false);
                    }
                });
            }

            /**
             * Basically we use the data object to find all conditional fields, who's display state depends on the state of the control with the id, given as param.
             * We then find the parent html element with class=conditional for each conditional field and trigger the checkConditionalState event on it
             * The toggleDisplay function is then performed once again for the conditional field
             * @param {string} restricts list of all conditionla fields and the field__values that trigger there display
             * @param {string} id id/class name of parent control
             * @returns {undefined}
             */
            function toggleChild(restricts, id) {
                $.each(restricts, function (index, list) {
                    //split the restriction string
                    var showWhens = list.split(', ');
                    $.each(showWhens, function (i, v) {
                        //split the restriction into a field id and a value that, if selected , will command the field to be visible
                        var showWhen = v.split('__');
                        if (showWhen.length >= 2) {
                            //we have a depending child
                            if (showWhen[0] == id) {
                                //find parent element with class=conditional
                                var conditional = $('.' + index);
                                //check the child
                                conditional.trigger('checkConditionalState');
                            }
                        }
                    });
                });
            }
        }
    });
}(jQuery));

//mend missing placeholder support in some browsers
(function ($) {
    $.support.placeholder = ('placeholder' in document.createElement('input'));
})(jQuery);

(function ($) {
    $.extend($.fn, {
        initVisform: function (options) {
            var defaults = {
                //just an example of adding translated texts, stepAlert is not used
                texts: {
                    stepAlert: "Es wurde ein bedingtes Feld in einem anderen Schritt aktiviert. Evtl. funktionert das Formular nicht mehr."
                }
            };
            var settings = jQuery.extend(true, {}, defaults, options);
            //store form information with the form object in javascript
            var visform = $.data(this[0], "visform");
            if ((!visform) || typeof visform === "undefined") {
                $.data(this[0], "visform", options.visform);
            }
            //store userinput information with the form object in javascript
            var userinputs = $.data(this[0], "userinputs");
            if ((!userinputs) || typeof userinputs === "undefined") {
                $.data(this[0], "userinputs", options.userInputs);
            }
            if (options.visform.initEditor === true) {
                // Create a simple plugin
                tinymce.create('tinymce.plugins.TestPlugin', {
                    TestPlugin: function (ed, url) {
                        //add function that will update content of tinyMCE on change (is only called, when user clicks outside editor
                        ed.on("change", function (ed) {
                            updateText(ed);
                        });
                        //add function that will update content of tinyMCE on submit
                        ed.on("submit", function (ed) {
                            return updateText(ed);
                        });
                    }
                });
                // Register plugin using the add method
                tinymce.PluginManager.add('test', tinymce.plugins.TestPlugin);

                //copy content of editor into a textarea field and validate content of that textarea
                function updateText(ed) {
                    //get id of textarea which belongs to the editor
                    var inputId = ed.target.id;
                    //copy editor content into textarea
                    tinyMCE.triggerSave();
                    //validate content of textarea
                    return jQuery("#" + inputId).valid();
                };
            }

            jQuery("#" + options.visform.parentFormId + "_processform").hide();
            this.initFields(options.visform);
            jQuery(".conditional").on("checkConditionalState", {
                restricts: options.restrictData,
                userInputs: options.userInputs
            }, function (e) {
                jQuery(this).toggleDisplay(e.data);
            });
            //Bootstrap 232
            jQuery(this).closest("form").on("shown", function () {
                jQuery(this).trigger('reloadVfMap');
            });
            //Bootstrap 3, Bootstrap 4
            jQuery(this).closest("form").on("shown.bs.collapse", function () {
                jQuery(this).trigger('reloadVfMap');
            });
            jQuery("#" + options.visform.parentFormId).trigger('visformsInitialised');
        },
        initFields: function (visform) {
            var userinputs = $.data($("#" + visform.parentFormId).get(0), 'userinputs');
            if ((!userinputs) || typeof userinputs === "undefined") {
                return;
            }
            jQuery.each(userinputs, function (i, obj) {
                if (obj.value === "undefined") {
                    return;
                }
                if (obj.isDisabled === true && obj.isForbidden !== true) {
                    //these fields stay with there configuration default
                    return;
                }
                //set to user input values
                //if a field is readonly the configuration default and the user input are the same (except, when the field value was set with an url param)
                switch (obj.type) {
                    case "select":
                    case "selectsql":
                        if (jQuery.isPlainObject(obj.value)) {
                            var seloptions = jQuery("#" + obj.label).find('option');
                            var isSearchSelect = $("#" + obj.label).hasClass('select2-hidden-accessible');
                            jQuery.each(seloptions, function (i, el) {
                                jQuery.each(obj.value, function (i, val) {
                                    if (jQuery(el).attr('value') === val) {
                                        jQuery(el).prop('selected', true);
                                        if (isSearchSelect) {
                                            $('#select2-' + obj.label + '-container').html($(el).html());
                                            $("#" + obj.label).trigger('change');
                                        }
                                        //you have to return false to break from an each loop
                                        return false;
                                    }
                                    jQuery(el).prop('selected', false);
                                    return;
                                });
                            });
                            if (obj.type === "select") {
                                jQuery("#" + obj.label).trigger("recalculate");
                            }
                        }
                        break;
                    case "multicheckbox":
                    case "multicheckboxsql":
                        if (jQuery.isPlainObject(obj.value)) {
                            var boxes = jQuery("#" + visform.parentFormId + " ." + obj.label).find('input');
                            jQuery.each(boxes, function (i, el) {
                                jQuery.each(obj.value, function (ix, val) {
                                    if (jQuery(el).attr('value') === val) {
                                        jQuery(el).prop('checked', true);
                                        //you have to return false to break from an each loop
                                        return false;
                                    }
                                    jQuery(el).prop('checked', false);
                                    return;
                                });
                            });
                        }
                        break;
                    case "radio":
                    case "radiosql":
                        var radios = jQuery("#" + visform.parentFormId + " ." + obj.label).find('input');
                        jQuery.each(radios, function (i, el) {
                            if (jQuery(el).attr('value') === obj.value) {
                                jQuery(el).prop('checked', true);
                            }
                            else {
                                jQuery(el).prop('checked', false);
                            }
                        });
                        break;
                    case "checkbox":
                        jQuery("#" + obj.label).prop("checked", obj.value);
                        jQuery("#" + obj.label).trigger("recalculate");
                        break;
                    case "signature" :
                        jQuery("#" + obj.label).val(obj.value);
                        if (obj.value) {
                            jQuery("#" + obj.label + "_sig").jSignature("setData", "data:" + obj.value);
                        }
                        break;
                    case  "date" :
                        // ToDo Does attribute value or element property value (.val) matter?  or does data-alt-value suffice? should we set .val instead .attr('value)?
                        jQuery("#" + obj.label).attr('value', obj.value);
                        jQuery("#" + obj.label).attr('data-alt-value', obj.value);
                        jQuery("#" + obj.label).trigger("recalculate");
                        break;
                    default:
                        //used to prevent email cloaking in form used in content (plg or module)
                        jQuery("#" + obj.label).val(obj.value.replace(/&#64/g, '@'));
                        jQuery("#" + obj.label).trigger("recalculate");
                        break;
                }
            });
            //ToDo consider if yo want to do this
            //enable the buttons only if there is no javascript error on the page
            jQuery("#" + visform.parentFormId + ' input[type="submit"]').prop('disabled', false);
            jQuery("#" + visform.parentFormId + ' input[type="image"]').prop('disabled', false);
            jQuery("#" + visform.parentFormId + ' input[type="reset"]').prop('disabled', false);
            jQuery("#" + visform.parentFormId + ' input[type="radio"]').trigger('reloadsqloptions');
            jQuery("#" + visform.parentFormId + ' input[type="checkbox"]').trigger('reloadsqloptions');
            jQuery("#" + visform.parentFormId + ' select').trigger('reloadsqloptions');
            visForm.hideSqlOptionList(visform.parentFormId);
            jQuery("#" + visform.parentFormId).trigger('visfieldInitialized');
        }
    });
}(jQuery));

jQuery(document).ready(function () {
    var validPendingTimeout;
    //"static" scripts which should only be included once

    //fix placeholder for IE7, IE8, IE9
    if (!jQuery.support.placeholder) {
        jQuery("[placeholder]").focus(function () {
            if (jQuery(this).val() == jQuery(this).attr("placeholder")) jQuery(this).val("");
        }).blur(function () {
            if (jQuery(this).val() == "") jQuery(this).val(jQuery(this).attr("placeholder"));
        }).blur();

        jQuery("[placeholder]").parents("form").submit(function () {
            jQuery(this).find('[placeholder]').each(function () {
                if (jQuery(this).val() == jQuery(this).attr("placeholder")) {
                    jQuery(this).val("");
                }
            });
        });
    }

    //keyup event triggers validation if element is marked as invalid
    jQuery("input[type='number']").on("input mouseup", function () {
        jQuery(this).trigger("keyup");
    });
    jQuery("input[type='file']").on("change", function () {
        jQuery(this).trigger("keyup");
    })
    jQuery("input[type='file']").on("blur", function () {
        if (!(jQuery(this).get(0).files.length == 0)) {
            var id = jQuery(this).attr('id');
            jQuery('[data-clear-target="' + id + '"]').show();
        }
    });
    jQuery("a.clear-selection").hide();
    jQuery("a.clear-selection").on("click", function (e) {

        var uploadid = jQuery(this).attr('data-clear-target');
        var el = jQuery('#' + uploadid);
        el.replaceWith(el.val('').clone(true));
        //get the new jQuery object of el
        el = jQuery('#' + uploadid);
        el.trigger('keyup');
        jQuery(this).hide();
        e.preventDefault();
        return false;
    });
    var successMessageClose = jQuery(".visforms-form .close.successMessage");
    if (successMessageClose) {
        var form = successMessageClose.parents(".visforms-form").find("form");
        var description = successMessageClose.parents(".visforms-form").find(".category-desc");
        form.hide();
        description.hide();
        successMessageClose.on("click", function () {
            jQuery(this).parent(".alert-success").hide();
            jQuery(this).parents(".visforms-form").find("form").show();
            jQuery(this).parents(".visforms-form").find(".category-desc").show();
            jQuery(this).parents(".visforms-form").find("form").trigger("reloadVfMap");
        });
    }

    //multi step forms
    jQuery('.visform .next_btn').on('click', function () {
        jQuery(this).closest('[class^="fieldset-"]').find('input, textarea, select').not(":disabled").removeClass("ignore");
        jQuery(this).closest('[class^="fieldset-"]').siblings('[class^="fieldset-"]').find('input, textarea, select').not(":disabled, .btn, .uk-button").addClass("ignore");
        onNextButtonClick(this);
    });

    jQuery('.visform .summary_btn').on('click', function () {
        jQuery(this).closest('[class^="fieldset-"]').find('input, textarea, select').not(":disabled").removeClass("ignore");
        jQuery(this).closest('[class^="fieldset-"]').siblings('[class^="fieldset-"]').find('input, textarea, select').not(":disabled, .btn, .uk-button").addClass("ignore");
        onSummaryButtonClick(this)
    });

    jQuery(".visform .back_btn").on('click', function () {
        var visform = jQuery(this).closest('form');
        jQuery(this).closest("[class^='fieldset-']").prev().fadeIn('slow').addClass('active');
        jQuery(this).closest("[class^='fieldset-']").prev().trigger("reloadVfMap");
        jQuery(this).closest("[class^='fieldset-']").css({'display': 'none'}).removeClass('active');
        var activeBadge = jQuery(visform).find('.visprogress .badge.badge-important');
        jQuery(activeBadge).removeClass("badge-important");
        jQuery(activeBadge).closest('.stepCont').prev().find('.badge').removeClass("badge-success").addClass("badge-important");
    });

    jQuery(".visform .fieldset-1 :reset").on('click', function (e) {
        e.preventDefault();
        jQuery(this).closest('form').get(0).reset();
        //set userinputs of this form to empty array; We can do this, because the edit views do not have a reset button.
        //So the stored user inputs which are in the userinputs array and which must not get lost, are not deleted by this call
        jQuery.data(jQuery((this).closest('form')).get(0), 'userinputs', []);
        jQuery(".conditional").trigger("checkConditionalState");
        //Trigger change event is needed to recalculate
        jQuery(this).closest('form').find('input').trigger("change");
        jQuery(this).closest('form').find('select').trigger("change");
    });

    //action for reset button on summary page
    jQuery(".visform fieldset:not(.fieldset-1) :reset").on('click', function (e) {
        e.preventDefault();
        jQuery(this).closest('form').get(0).reset();
        //set userinputs of this form to empty array; We can do this, because the edit views do not have a reset button.
        //So the stored user inputs which are in the userinputs array and which must not get lost, are not deleted by this call
        jQuery.data(jQuery((this).closest('form')).get(0), 'userinputs', []);
        jQuery(".conditional").trigger("checkConditionalState");
        //Trigger change event is needed to recalculate
        jQuery(this).closest('form').find('input').trigger("change");
        jQuery(this).closest('form').find('select').trigger("change");
        var formid = jQuery(this).closest("form").get(0).id;
        jQuery("#" + formid + "_summary").remove();
        jQuery(this).closest("[class^='fieldset-']").parent().find("[class^='fieldset-']").first().fadeIn('slow').addClass('active');
        jQuery(this).closest("[class^='fieldset-']").parent().find("[class^='fieldset-']").first().trigger("reloadVfMap");
        jQuery(this).closest("[class^='fieldset-']").css({'display': 'none'}).removeClass('active');
        jQuery("#" + formid + " .visprogress .stepCont .badge").removeClass("badge-important badge-success");
        jQuery("#" + formid + " .visprogress .stepCont:first .badge").addClass("badge-important");
    });

    //correct button on summary page
    jQuery(".visform .correct_btn").on('click', function () {
        var formid = jQuery(this).closest("form").get(0).id;
        jQuery("#" + formid + "_summary").remove();
        jQuery(this).closest("[class^='fieldset-']").prev().fadeIn('slow').addClass('active');
        jQuery(this).closest("[class^='fieldset-']").prev().trigger("reloadVfMap");
        jQuery(this).closest("[class^='fieldset-']").css({'display': 'none'}).removeClass('active');
        jQuery("#" + formid + " .visprogress .stepCont:last .badge").removeClass("badge-important");
        jQuery("#" + formid + " .visprogress .stepCont:nth-last-child(2) .badge").removeClass("badge-success").addClass("badge-important");
    });

    jQuery(".noEnterSubmit").keypress(function (event) {
        var key = event.keyCode;
        if (key === 13) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });

    jQuery(document).displayChanger();
    jQuery('#dynamic_recaptcha_1').attr('data-callback', 'visRecaptchaCallback');

});

function onNextButtonClick(button) {
    var visform = jQuery(button).closest('form');
    var isValid = jQuery(visform).valid();
    var isPending = jQuery(visform).validate().pendingRequest !== 0;
    if (isPending) {
        if (typeof validPendingTimeout !== "undefined") {
            clearTimeout(validPendingTimeout);
        }
        validPendingTimeout = setTimeout(function () {
            onNextButtonClick(button);
        }, 200);
    }
    if (jQuery(visform).valid() && !isPending) {
        jQuery(button).closest('[class^="fieldset-"]').next().fadeIn("slow").addClass("active");
        jQuery(button).closest('[class^="fieldset-"]').next().trigger("reloadVfMap");
        jQuery(button).closest('[class^="fieldset-"]').css({"display": "none"}).removeClass("active");
        var activeBadge = jQuery(visform).find('.visprogress .badge.badge-important');
        jQuery(activeBadge).removeClass("badge-important").addClass("badge-success");
        jQuery(activeBadge).closest('.stepCont').next().find('.badge').addClass("badge-important");
        // we have to remove class ignore from controls on next page, because the submit button could be on that page
        // and we cannot remove class igonre when click event is on submit button (due to validator)
        jQuery(button).closest('[class^="fieldset-"]').next().find('input, textarea, select').not(":disabled").removeClass("ignore");
    }
}

function onSummaryButtonClick(button) {
    var formid = jQuery(button).closest("form").get(0).id;
    var isValid = jQuery("#" + formid).valid();
    var isPending = jQuery("#" + formid).validate().pendingRequest !== 0;
    if (isPending) {
        if (typeof validPendingTimeout !== "undefined") {
            clearTimeout(validPendingTimeout);
        }
        validPendingTimeout = setTimeout(function () {
            onSummaryButtonClick(button);
        }, 200);
    }
    if (jQuery("#" + formid).valid() && !isPending) {
        createSummaryHtml(formid);
        jQuery(button).closest('[class^="fieldset-"]').next().fadeIn("slow").addClass("active");
        jQuery(button).closest('[class^="fieldset-"]').css({"display": "none"}).removeClass("active");
        var activeBadge = jQuery('#' + formid + ' .visprogress .badge.badge-important');
        jQuery(activeBadge).removeClass("badge-important").addClass("badge-success");
        jQuery(activeBadge).closest('.stepCont').next().find('.badge').addClass("badge-important");
        // force validation of captcha input on summary page
        jQuery(button).closest('[class^="fieldset-"]').next().find('input').not(":disabled").removeClass("ignore");
    }
    //recaptcha must be reloaded in order to be checked for required properly
    if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset();
    }

}

function createSummaryHtml(formid) {
    var visform = jQuery.data(jQuery("#" + formid).get(0), 'visform');
    var fields = visform.fields;
    var summary = [];
    jQuery.each(fields, function (i, o) {
        if (jQuery.inArray(o.type, ['image', 'submit', 'reset', 'fieldsep', 'hidden', 'pagebreak']) > -1) {
            return true;
        }
        var label = visform.oSummaryFirstElementLayout + '' + o.label + ': ' + visform.cSummaryFirstElementLayout;
        switch (o.type) {
            case "select":
            case "selectsql":
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled")) {
                    var value = [];
                    var selected = jQuery("#" + formid + " .field" + o.id + " :selected");
                    if (selected.length > 0) {
                        selected.each(function () {
                            if (jQuery(this).val() != "") {
                                value.push(jQuery(this).text());
                            }
                        });
                    }
                    var tmp = value.join(", ");
                    if ((!visform.hideemptyfieldsinsummary) || (tmp != "")) {
                        summary.push(label + visform.oSummarySecondElementLayout + tmp + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            case 'multicheckbox' :
            case 'radio' :
            case 'multicheckboxsql' :
            case 'radiosql' :
                var senabled = jQuery("#" + formid + " .field" + o.id + " :input:disabled");
                if (!(senabled.length > 0)) {
                    var value = [];
                    var selected = (jQuery("#" + formid + " .field" + o.id + " :input:checked"));

                    if (selected.length > 0) {
                        selected.each(function (i) {
                            sid = jQuery(this).attr("id");
                            value.push(jQuery(this).closest(".field" + o.id).find("label[for=\'" + sid + "\']").text());
                        });
                    }
                    var tmp = value.join(", ");
                    if ((!visform.hideemptyfieldsinsummary) || (tmp != "")) {
                        summary.push(label + visform.oSummarySecondElementLayout + tmp + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            case 'checkbox' :
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled")) {
                    var value = "";
                    if ((jQuery("#" + formid + " #field" + o.id).prop("checked"))) {
                        value = jQuery("#" + formid + " #field" + o.id).val();

                    }
                    if ((!visform.hideemptyfieldsinsummary) || (value != "")) {
                        summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            case 'calculation' :
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled")) {
                    var value = jQuery("#" + formid + " #field" + o.id).val();
                    if ((!visform.hideemptyfieldsinsummary) || (value != "")) {
                        if ((!visform.summaryemptycaliszero) || (!(0 == value.replace(",", ".")))) {
                            summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                        }
                    }
                }
                return;
            case 'location' :
                var lat = jQuery("#" + formid + " #field" + o.id + "_lat");
                var lng = jQuery("#" + formid + " #field" + o.id + "_lng");
                if (!lat.prop("disabled") && !lng.prop("disabled")) {
                    var value_lat = lat.val();
                    var value_lng = lng.val();
                    if ((!visform.hideemptyfieldsinsummary) || ((value_lat != "") && (value_lng != ""))) {
                        var value = ((value_lat != "") && (value_lng != "")) ? value_lat + ", " + value_lng : "";
                        summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            case 'signature' :
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled") && !jQuery("#" + formid + " #field" + o.id).hasClass('noSummary')) {
                    var imgData = getVfSignatureImgFromCanvas({sigFieldId: "#" + formid + " #field" + o.id + "_sig"});
                    if ((!visform.hideemptyfieldsinsummary) || (imgData != "")) {
                        if (imgData.substring(0, 4) !== "data") {
                            var value = imgData;
                        }
                        else {
                            var value = '<img src="' + imgData + '" />';
                        }
                        summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            case 'file' :
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled")) {
                    var value = jQuery("#" + formid + " #field" + o.id).val();
                    // input element of upload field is not always displayed in form
                    if (typeof  value === "undefined") {
                        return;
                    }
                    if ((!visform.hideemptyfieldsinsummary) ||(value != "")) {
                        value = value.replace(/^.+(?=[\\\/])\\/, "");
                        summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                    }
                }
                return;
            default :
                if (!jQuery("#" + formid + " #field" + o.id).prop("disabled")) {
                    var value = jQuery("#" + formid + " #field" + o.id).val();
                    if ((!visform.hideemptyfieldsinsummary) || (value != "")) {
                        summary.push(label + visform.oSummarySecondElementLayout + value + visform.cSummarySecondElementLayout);
                    }
                }
                return;
        }
    })
    if (visform.summaryRowLayout) {
        var htmlsummary = summary.join("</" + visform.summaryRowLayout + "><" + visform.summaryRowLayout + ">");
        htmlsummary = "<" + visform.summaryRowLayout + ">" + htmlsummary + "</" + visform.summaryRowLayout + ">";
    }
    else {
        var htmlsummary = summary.join("");
    }
    if (htmlsummary !== "") {
        htmlsummary = '<' + visform.summaryLayout + ' id="' + formid + '_summary" class="' + visform.summaryLayoutClass + ' visforms_summary">' + htmlsummary + '</' + visform.summaryLayout + '>';
        jQuery("#" + formid + "_summarypage").prepend(htmlsummary);
    }
}

function verifyMail(fieldid, fid, token, baseurl) {
    var adr = jQuery("#" + fieldid).val();
    var pData = {};
    pData[token] = 1;
    pData['verificationAddr'] = adr;
    pData['fid'] = fid;
    jQuery.ajax({
        type: 'POST',
        url: baseurl + '/index.php?option=com_visforms&task=visforms.sendVerficationMail',
        data: pData,
        dataType: 'text',
        success: function (data, textStatus, jqXHR) {
            alert(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            visForm.showAjaxError(jqXHR.responseText, errorThrown);
        }
    });
}

function visRecaptchaCallback(val) {
    jQuery('#g-recaptcha-response').valid();
}

var visForm = {
    version : '1.0.6',
    reloadOptionList : function (event) {
        event.preventDefault();
        var formElement = jQuery(this).closest('form');
        var fid = jQuery(formElement).attr('id');
        var data = event.data;
        var formData = jQuery(formElement).serializeArray();
        var reloadId = data.reloadId;
        var baseurl = data.baseurl;
        var cid = data.cid;
        formData.push({name: 'reloadId', value: data.reloadId});
        jQuery.ajax({
            type: 'POST',
            url: baseurl + '/index.php?option=com_visforms&task=visforms.reloadOptionList&id=' + fid + 'cid=' + cid,
            data: formData,
            success: function(data, textStatus, jqXHR) {
                jQuery('#' + fid + ' #field' + reloadId).empty().append(data);
                // set any possible default values given by user inputs (edit value or url parameter)
                visForm.setDefaultValues(fid, reloadId);
                // perform preSelection of a solitary option if set in field configuration
                visForm.preSelectSolitaryOption(reloadId);
                jQuery('#' + fid + ' #field' + reloadId).trigger('change');
                visForm.hideSqlOptionList(fid);
                visForm.hideSqlDataList(fid);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // give error feedback
                visForm.showAjaxError(jqXHR.responseText, errorThrown);
            },
            dataType: 'html',
            async: true
        });
    },
    setDefaultValues : function (formId, fieldId) {
        var userinputs = jQuery.data(jQuery("#" + formId).get(0), 'userinputs');
        if ((!userinputs) || typeof userinputs === "undefined") {
            return;
        }
        jQuery.each(userinputs, function (i, obj) {
            if (obj.label !== "field" + fieldId) {
                return;
            }
            if (obj.value === "undefined") {
                return;
            }
            if (obj.isDisabled === true && obj.isForbidden !== true) {
                //these fields stay with there configuration default
                return;
            }
            if (jQuery.isPlainObject(obj.value)) {
                var seloptions = jQuery("#" + obj.label).find('option');
                jQuery.each(seloptions, function (i, el) {
                    jQuery.each(obj.value, function (i, val) {
                        if (jQuery(el).attr('value') === val) {
                            jQuery(el).prop('selected', true);
                            //you have to return false to break from an each loop
                            return false;
                        }
                        jQuery(el).prop('selected', false);
                        return;
                    });
                });
            }
            return false;
        });
    },
    preSelectSolitaryOption : function (fieldId) {
        var field = jQuery('#field' + fieldId);
        if (field.hasClass('preSelectedSolitaryOption')) {
            var options = field.find('option');
            var optionsCount = options.length;
            if (optionsCount === 1 && jQuery(options[0]).prop('disabled') === false) {
                jQuery(options[0]).prop('selected', true);
            }
            else if (optionsCount === 2) {
                if (options[0].value === '' && jQuery(options[1]).prop('disabled') === false) {
                    jQuery(options[0]).prop('selected', false);
                    jQuery(options[1]).prop('selected', true);
                }
            }
        }
    },
    hideSqlOptionList : function (formId) {
        var hideEmpty = 1, hidePrselect = 2, hideBoth = 3, state = 0;
        jQuery('#' + formId + ' select.hideOnEmptyOptionList, #' + formId + ' select.hideOnPreSelectedSolitaryOption').each(function() {
            var fieldId = jQuery(this).attr('id');
            var controlGroup = jQuery(this).parents('.' + fieldId);
            var optionsCount = jQuery(this).find('option').length;
            if (jQuery(this).hasClass('hideOnEmptyOptionList') && jQuery(this).hasClass('hideOnPreSelectedSolitaryOption')) {
                state = hideBoth;
            }
            else if (jQuery(this).hasClass('hideOnEmptyOptionList')) {
                state = hideEmpty;
            }
            else if (jQuery(this).hasClass('hideOnPreSelectedSolitaryOption')) {
                state = hidePrselect;
            }
            if (optionsCount === 0) {
                // hide if not option is given and hideEmpty is set
                if (state === hideEmpty) {
                    jQuery(controlGroup).hide();
                }
                else {
                    jQuery(controlGroup).show();
                }
            }
            else if (optionsCount === 1) {
                // if only one option is given and it's value is '' this is the 'select a value' default option
                if (this.options[0].value === '') {
                    if (state === hideEmpty || state === hideBoth) {
                        jQuery(controlGroup).hide();
                    }
                    else {
                        jQuery(controlGroup).show;
                    }
                }
                // if only one option is given and it's value is not '' it is a real option (happens, if for example if size attribute is set)
                else {
                    if (this.selectedIndex === 0 && (state === hideBoth || state === hidePrselect)) {
                        jQuery(controlGroup).hide();
                    }
                    else {
                        jQuery(controlGroup).show();
                    }
                }
            }
            // select an option plus one real option
            else if (optionsCount === 2) {
                if (this.selectedIndex === 1 && (state === hideBoth || state === hidePrselect)) {
                    jQuery(controlGroup).hide();
                }
                else {
                    jQuery(controlGroup).show();
                }
            }
            else {
                jQuery(controlGroup).show();
            }
        });
    },
    hideSqlDataList : function (formId) {
        var hideEmpty = 1, hidePrselect = 2, hideBoth = 3, state = 0;
        jQuery('#' + formId + ' table.hideOnEmptyOptionList, #' + formId).each(function() {
            var fieldId = jQuery(this).attr('id');
            var controlGroup = jQuery(this).parents('.' + fieldId);
            var rowCount = jQuery(this).find('tr').length;
            if (jQuery(this).hasClass('hideOnEmptyOptionList')) {
                state = hideEmpty;
            }
            if (rowCount === 0) {
                // hide if not option is given and hideEmpty is set
                if (state === hideEmpty) {
                    jQuery(controlGroup).hide();
                }
                else {
                    jQuery(controlGroup).show();
                }
            }
            else {
                jQuery(controlGroup).show();
            }
        });
    },
    showAjaxError : function (responseText, errorThrown) {
        if (responseText.startsWith('<!DOC')) {
            alert(errorThrown);
        }
        else {
            alert(responseText);
        }
    },
};