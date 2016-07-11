'use strict';

define(['jquery', 'underscore', 'backbone', 'text!templates/phone-pay.template.html', 'libs/declofnum', 'libs/phone-mask'], function($, _, Backbone, template, declOfNum, phoneMask) {

  var PhonepayAppView = Backbone.View.extend({

      tagName: 'div',
      el: '#phone-pay',
      template: _.template(template),
      events: {
        'keyup input.b-phone-pay__sum-input':  'sumChanged',
        'keyup input': 'setModelData'
      },

      initialize: function () {

      },

      sumChanged: function(e) {

        var inputSum = this.sumInput,
            value = inputSum.val();

        this.model.set({ sum: inputSum.val() });

        if (this.model.get('sum') > this.model.get('maxSum')) {

          var sum = inputSum.val();
          this.showSumWarning();
          inputSum.val(sum.substring(0, sum.length - 1));
          this.model.set({ sum: inputSum.val() });

        } else {

          inputSum.val(value.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
          this.model.set({ sum: inputSum.val() });

        }

        this.sumCurrency.text(declOfNum(inputSum.val().replace(/\s+/g, ''), ['рубль', 'рубля', 'рублей']));

      },

      numbersChecking: function() {

        /**
         * @param {arguments} - jquery elements for number-checking
         */

        _.each(arguments, function(elem) {

          var $elem = $(elem);

          // Filter non-digits from input value by keycode
          $elem.keydown(function(e) {

            if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
              (e.keyCode == 65 && ( e.ctrlKey === true || e.metaKey === true ) ) ||
              (e.keyCode == 67 && e.ctrlKey === true) ||
              (e.keyCode == 86 && e.ctrlKey === true) ||
              (e.keyCode >= 35 && e.keyCode <= 40)) {
                   return;
            }

            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
              e.preventDefault();
            }

          });

          // Filter non-digits from input value by Regexp
          $elem.keyup(function(e) {

            if (/\D/g.test(this.value) && e.keyCode != 39 && e.keyCode != 37) {
              this.value = this.value.replace(/\D/g, '');
            }

          });

        });

      },

      lengthChecking: function($elem, length, $nextElem) {

        /**
         * @param {$elem} - jquery element for checking
         * @param {$length} - max length of element content
         * @param {$nextElem} - next element for focus if $elem is complete
         */

        var _this = this;

        $elem.keypress(function(e) {

          // if by chance still receive a large number
          if(this.value.length > length - 1) {

            this.value = this.value.substring(0, this.value.length);
            return false;

          }

        });

        $elem.keyup(function(e) {

          // limit input-text by $length
          if(this.value.length === length && $nextElem){
            $nextElem.focus();
          }

        });

      },

      phoneMasking: function($elem) {

        /**
         * @param {$elem} - jquery element for masking
         */

        $elem.keyup(function(e) {

          if(e.keyCode != 39 && e.keyCode != 37) {

            //remove all chars, except dash and digits
            var value = phoneMask(this.value.replace(/[^\-0-9]/g, ''));
            this.value = value;

            /* if value pasted */
            if(e.keyCode == 86 && e.ctrlKey === true){
              if(value.length > 8){
                value = value.substring(0, 9);
              }
            }

          }

        });

      },

      transitionsByKeys: function($elem, $nextElem, $prevElem) {

        /**
         * @param {$elem} - jquery element for transitions
         * @param {$nextElem} - jquery next element for focus
         * @param {$prevElem} - jquery previous element for focus
         */

        var backspace = 8,
            space = 32,
            forwardArrow = 39,
            backArrow = 37,
            prevValue;

        // previous element focus by backspace
        $elem.keydown(function(e) {
          prevValue = this.value;
        });

        $elem.keyup(function(e) {

          if(prevValue === '' && (e.keyCode == backspace || e.keyCode == backArrow)) {
            if($prevElem){

              var tmpStr;

              /* ie9 carret in end of input-string */
              $prevElem.focus();
              tmpStr = $prevElem.val();
              $prevElem.val('');
              $prevElem.val(tmpStr);

            }
          }

        });

        // next element focus by space
        $elem.keyup(function(e) {

          if(e.keyCode == space || e.keyCode == forwardArrow) {
            if($nextElem) {
                $nextElem.focus();
            }
          }

        });

      },

      phonePasting: function($elem, $areaCode, $phoneNumber, $inputSum) {

        var _this = this;

        $elem.keyup(function(e) {

          if(e.keyCode == 86 && e.ctrlKey === true) {

            var pasteString,
                areaCode,
                phoneNumber;

            pasteString = this.value.replace(/[^\-0-9]/g, '');
            areaCode = pasteString.substring(0, 3);
            phoneNumber = phoneMask(pasteString.substring(3));
            console.log(pasteString.substring(3));
            if(areaCode.length + phoneNumber.length > 10){
              phoneNumber = phoneNumber.substring(0, 9);
              $phoneNumber.focus();
              $inputSum.focus();

            }
            if(areaCode.length + phoneNumber.length >= 3 && areaCode.length + phoneNumber.length <= 11){
              $phoneNumber.focus();
            }
            $areaCode.val(areaCode);
            $phoneNumber.val(phoneNumber);
          }

        });

      },

      showSumWarning: function(){

        var _this = this;

        this.sumWarning.css({
          'display' : 'block'
        }).animate({
          'opacity' : 1
        });

        setTimeout(function(){
          _this.sumWarning.animate({
            'opacity' : 0
          }, 300).delay(300).fadeOut();
        }, 2000);

      },

      setAreaCodeModel: function(data){
        this.model.set({ areaCode: data.replace(/\D+/g,"") });
      },

      setPhoneModel: function(data){
        this.model.set({ phoneNumber: data.replace(/\D+/g,"") });
      },

      setModelData: function() {

        this.setAreaCodeModel(this.areaCode.val());
        this.setPhoneModel(this.phoneNumber.val());

        if(this.model.isValid()) {
          this.sendButton.removeClass('b-btn--blocked');
        } else {
          this.sendButton.addClass('b-btn--blocked');
        }

      },

      render: function() {

        this.$el.html(this.template(this.model.toJSON()));

        this.sumInput = this.$('.b-phone-pay__sum-input');
        this.areaCode = this.$('.b-phone-pay__area-code');
        this.phoneNumber = this.$('.b-phone-pay__phone');
        this.sumCurrency = this.$('.b-phone-pay__currency');
        this.sumWarning = this.$('.b-phone-pay__warning');
        this.sendButton = this.$('.b-btn');

        this.lengthChecking(this.areaCode, 3, this.phoneNumber);
        this.lengthChecking(this.phoneNumber, 9, this.sumInput);
        this.lengthChecking(this.sumInput, 4, null);

        this.numbersChecking(this.sumInput, this.areaCode, this.phoneNumber);

        this.phoneMasking(this.phoneNumber);

        this.phonePasting(this.areaCode, this.areaCode, this.phoneNumber, this.sumInput);
        this.phonePasting(this.phoneNumber, this.areaCode, this.phoneNumber, this.sumInput);

        this.transitionsByKeys(this.areaCode, this.phoneNumber, null);
        this.transitionsByKeys(this.phoneNumber, this.sumInput, this.areaCode);

        return this;

      }

    });

    return PhonepayAppView;

});
