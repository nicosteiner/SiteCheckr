"use strict";

const self = require("self");
const data = require("self").data;
const {Cc, Ci} = require("chrome");
const ss = require("simple-storage");
const prefs = require("simple-prefs");
const file = require("file");

var Helper = Helper || {};
Helper.constants = Helper.constants || {};

Helper.settings = {IOVERSION: '0.1b'};
Helper.constants.PRIORITY = {REQUIRED: 'required', NICETOHAVE: 'nicetohave'};
Helper.constants.TYPE = {XPATH: 'xpath', CSS: 'css'};
Helper.constants.MODE = {REQUIRED: 'required', FORBIDDEN: 'forbidden'};

exports.getJSONRuleset = function() {
    /* get user settings */
    if(ss.storage.ruleset) {
        return ss.storage.ruleset;
    }

    /* no user rulesets available? use default ruleset */
    var xmlData = data.load('rulesets/default.xml');
    var doc = Helper.converter.parseXML(xmlData);
    
    return Helper.converter.xml2json(doc);
};

exports.getXMLRuleset = function() {
    /* get user settings */
    if(ss.storage.ruleset) {
        return Helper.converter.json2xml(ss.storage.ruleset);
    }
    
    return data.load('rulesets/default.xml');
}

exports.hasUserDefinedRuleset = function() {
    if(ss.storage.ruleset) {
        return true;
    }
    return false;
};

exports.setXMLRuleset = function(data) {
    var json = null;
    if(data != '') {
        var doc = Helper.converter.parseXML(data);
        json = Helper.converter.xml2json(doc);
    }
    exports.setJSONRuleset(json);
};

exports.setJSONRuleset = function(data) {
    if(data != null) {
        ss.storage.ruleset = data;
        return;
    }
    
    exports.removeFromSettings();
};

exports.removeFromSettings = function() {
    //remove ruleset from storage
    ss.storage.ruleset = null;
    delete ss.storage.ruleset;
};

Helper.converter = {};
Helper.converter.parseXML = function(str) {
    var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
    return parser.parseFromString(str, 'text/xml');
};
Helper.converter.serializeXML = function(doc) {
    var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
    return serializer.serializeToString(doc);
};
Helper.converter.xml2json = function(doc) {
    var root = doc.documentElement;
    var obj = {'title': '', 'description': '', 'author': '', 'rules': [], 'version': Helper.settings.IOVERSION};
    
    /* META DATA */
    var title, description, author;
    if((title = root.querySelector('title'))) {
        obj.title = Helper.security.filterHTML(title.textContent);
    }
    
    if((description = root.querySelector('description'))) {
        obj.description = Helper.security.filterHTML(description.textContent);
    }
    
    if((author = root.querySelector('author'))) {
        obj.author = Helper.security.filterHTML(author.textContent);
    }
    
    /* RULES */
    var rules = root.querySelectorAll('rules rule');
    for (var i = 0; i < rules.length; i++) {
        var obj_rule = {'title': '', 'description': '', 'tests': [], 'priority': Helper.constants.PRIORITY.REQUIRED};
        var rule = rules[i];
        
        var title, description, priority;
        if((title = rule.querySelector('title'))) {
            obj_rule.title = Helper.security.filterHTML(title.textContent);
        }
        
        if((description = rule.querySelector('description'))) {
            obj_rule.description = Helper.security.filterHTML(description.textContent);
        }

        if((priority = rule.getAttribute('priority'))) {
            obj_rule.priority = priority;
        }
        
        /* TESTS */
        var tests = rule.querySelectorAll('tests test');
        for (var j = 0; j < tests.length; j++) {
            var obj_test = {'test': '', 'mode': Helper.constants.MODE.REQUIRED, 'type': Helper.constants.TYPE.XPATH};
            var test = tests[j];     
            obj_test.test = test.textContent;
            
            if(test.attributes.type) {
                obj_test.type = test.attributes.type.value;
            }
            
            if(test.attributes.mode) {
                obj_test.mode = test.attributes.mode.value;
            }

            obj_rule.tests.push(obj_test);
        }
        
        obj.rules.push(obj_rule);
    }
    
    return obj;
};

Helper.converter.json2xml = function(obj) {
    var doc = Helper.converter.parseXML('<?xml version="1.0" encoding="UTF-8"?><ruleset></ruleset>'); 
    var root = doc.documentElement;
    
    var getElementWithTextNode = function(tagName, content, cdata) {
        var elem = doc.createElement(tagName), inner;
        if(cdata) {
            inner = doc.createCDATASection(content);
        } else {
            inner = doc.createTextNode(content);
        }
        elem.appendChild(inner);
        return elem;
    };

    root.appendChild(getElementWithTextNode('title', obj.title, true));
    root.appendChild(getElementWithTextNode('description', obj.description, true));
    root.appendChild(getElementWithTextNode('author', obj.author));

    var rules = root.appendChild( doc.createElement("rules") );

    for(var i=0; i<obj.rules.length; i++) {
        var rule = obj.rules[i];

        var elem = doc.createElement("rule");
        elem.appendChild(getElementWithTextNode('title', rule.title, true));
        elem.appendChild(getElementWithTextNode('description', rule.description, true));
        if(rule.priority != Helper.constants.PRIORITY.REQUIRED) {
            elem.setAttribute('priority', rule.priority);
        }
        
        var tests = elem.appendChild( doc.createElement('tests') );
        
        for (var j = 0; j < rule.tests.length; j++) {
            var test = rule.tests[j];
            
            var testelem = getElementWithTextNode('test', test.test);
            if(test.mode != Helper.constants.MODE.REQUIRED) {
                testelem.setAttribute('mode', test.mode);
            }
            if(test.type != Helper.constants.TYPE.XPATH) {
                testelem.setAttribute('type', test.type);
            }
            
            tests.appendChild(testelem);
        }
        
        rules.appendChild(elem);
    }
    
    var xml = Helper.converter.serializeXML(doc);
    
    //PRETTYPRINTING
    //xml = XML(xml).toXMLString(); //CDATA-SECTIONS are removed :(

    return xml;
};

Helper.settings = Helper.settings || {};
Helper.settings.loadFile = function() {
    var ruleset = prefs.prefs.ruleset;
    
    if(ruleset && file.exists(ruleset)) {
        var content = file.read(ruleset);
        if(content) {
            exports.setXMLRuleset(content);
        }
    }
    
};
prefs.on("ruleset", Helper.settings.loadFile);

Helper.settings.resetRuleset = function() {
    prefs.prefs.ruleset = "";
    exports.removeFromSettings();
}
prefs.on("resetRuleset", Helper.settings.resetRuleset);

Helper.security = Helper.security || {};

Helper.security.scriptableUnescapeHTML = Cc["@mozilla.org/feed-unescapehtml;1"].getService(Ci.nsIScriptableUnescapeHTML); 
Helper.security.elem = (function() {
    var tmp = Helper.converter.parseXML('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' 
                              + '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><div></div></body></html>');
    return tmp.documentElement.querySelector('div');
})();

Helper.security.filterHTML = function(html) {
 
    var elem = Helper.security.scriptableUnescapeHTML.parseFragment('<div>' + html + '</div>', false, null, Helper.security.elem);
    
    if(!elem.childNodes || !elem.childNodes[0]) {
        return '';
    }
    
    var sanitized = elem.childNodes[0].innerHTML;
    
    sanitized = sanitized.replace(/ xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g, '');
    
    return sanitized;

};
