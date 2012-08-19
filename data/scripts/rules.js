"use strict";

/**
 * - this file is attached to a tab
 * - this file is attached to a panel
 */

var SiteCheckr = SiteCheckr || {};
SiteCheckr.rules = SiteCheckr.rules || {};
SiteCheckr.constants = SiteCheckr.constants || {};

SiteCheckr.constants.PRIORITY = {REQUIRED: 'required', NICETOHAVE: 'nicetohave'};
SiteCheckr.constants.TYPE = {XPATH: 'xpath', CSS: 'css'};
SiteCheckr.constants.MODE = {REQUIRED: 'required', FORBIDDEN: 'forbidden'};

SiteCheckr.rules.loadFromJSON = function(json) {
    var rules = SiteCheckr.rules.loadRulesFromJSON(json.rules);
    
    return new SiteCheckr.rules.ruleset(json.title, json.description, json.author, rules);
};

SiteCheckr.rules.loadRulesFromJSON = function(json) {
    var rules = [];
    for(var i=0; i<json.length; i++) {
        var tmp = json[i];
        
        var tests = SiteCheckr.rules.loadTestsFromJSON(tmp.tests);
        
        rules.push(new SiteCheckr.rules.rule(tmp.title, tmp.description, tests, tmp.priority));
    }
    return rules;
};

SiteCheckr.rules.loadTestsFromJSON = function(json) {
    var tests = [];
    for(var i=0; i<json.length; i++) {
        var tmp = json[i];
        
        tests.push(new SiteCheckr.rules.test(tmp.test, tmp.mode, tmp.type));
    }
    return tests;
};

/**
 * RULESET
 * @param title
 * @param description
 * @param author
 * @param rules
 */
SiteCheckr.rules.ruleset = function(title, description, author, rules) {
    this.init(title, description, author, rules);
};

SiteCheckr.rules.ruleset.prototype = {
    init: function(title, description, author, rules) {
        this.title = title;
        this.description = description;
        this.author = author;
        this.rules = rules;
    },
    check: function(contextNode) {
        var result = { boolean: true };
        for(var i=0; i<this.rules.length; i++) {
            var rule = this.rules[i];
            rule.check(contextNode);
            if(!rule.result.boolean && rule.priority != SiteCheckr.constants.PRIORITY.NICETOHAVE) {
                result.boolean = false;
            }
        }
        this.result = result;
    }
};

/**
 * RULE
 * @param name
 * @param description
 * @param tests
 */
SiteCheckr.rules.rule = function(title, description, tests, priority) {
    this.init(title, description, tests, priority);
};

SiteCheckr.rules.rule.prototype = {
  init: function(title, description, tests, priority) {
      this.title = title;
      this.description = description;
      this.tests = tests;
      this.priority = priority;
  },
  check: function(contextNode) {
      var result = { boolean: true, elements: [] };
      for(var i=0; i<this.tests.length; i++) {
          var test = this.tests[i];
          test.check(contextNode);
          if(!test.result.boolean) {
              result.boolean = false;
          }
          if(test.result.elements.length > 0) {
              for(var j=0; j<test.result.elements.length; j++) {
                  var elem = test.result.elements[j];
                  result.elements.push(elem); //TODO: check if element is already in array
              }
              delete test.result.elements;
          }
      }
      this.result = result;
  }
};

/**
 * TEST
 * @param test
 * @param mode
 * @param type
 */
SiteCheckr.rules.test = function(test, mode, type) {
    this.init(test, mode, type);
};

SiteCheckr.rules.test.prototype = { 
  init: function(test, mode, type) {
      this.test = test;
      this.mode = mode;
      this.type = type;
  },
  check: function(contextNode) {
      var result;
      
      if(this.type == SiteCheckr.constants.TYPE.CSS) {
          result = this.check_css(contextNode);
      } else {
          result = this.check_xpath(contextNode);
      }
      
      if(this.mode == SiteCheckr.constants.MODE.FORBIDDEN) {
          result.boolean = !result.boolean;
      }
      
      this.result = result;
  },
  check_xpath: function(contextNode) {
      var result = {boolean: true, elements: []};
      
      var xpath = document.evaluate(this.test, contextNode, null, XPathResult.ANY_TYPE, null);
      
      switch(xpath.resultType) {
          case XPathResult.BOOLEAN_TYPE:
              result.boolean = xpath.booleanValue;
              break;
          case XPathResult.NUMBER_TYPE:
              break;
          case XPathResult.STRING_TYPE:
              break;
          default:
              var elem = xpath.iterateNext();
              if(elem) {
                  
                  while(elem) {
                      result.elements.push(SiteCheckr.Helper.getDOMElementAsJSON(elem));
                      elem = xpath.iterateNext();
                  }
                  
                  elem = null;
                  
                  result.boolean = true;
              } else {
                  result.boolean = false;
              }              
              break;
      }
      
      xpath = null;
      
      return result;
  },
  check_css: function(contextNode) {
      var result = {boolean: true, elements: []};
      
      var css = jQuery(contextNode).find(this.test);
      
      if(css.size() > 0) {
          
          css.each(function() { 
              result.elements.push(SiteCheckr.Helper.getDOMElementAsJSON(this)); 
          } );
          
          result.boolean = true;
      } else {
          result.boolean = false;
      }
      
      css = null;

      return result;
  }
};