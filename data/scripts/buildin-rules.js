"use strict";

/**
 * - this file is attached to a tab
 * - this file is attached to a panel
 */

var SiteCheckr = SiteCheckr || {};
SiteCheckr.buildinRules = SiteCheckr.buildinRules || {};

SiteCheckr.buildinRules.demoTest = function() {
    this.init("", SiteCheckr.constants.MODE.REQUIRED, SiteCheckr.constants.TYPE.CUSTOM);
};

SiteCheckr.buildinRules.demoTest.prototype = SiteCheckr.rules.test.prototype;
SiteCheckr.buildinRules.demoTest.prototype.custom_check = function(contextNode) {
    var result = { boolean: true, elements: [] };
    // check something
    return result;
};

/**************************************
 *         DUPLICATE ID
 *************************************/
SiteCheckr.buildinRules.duplicateId = function() {
    this.init("", SiteCheckr.constants.MODE.REQUIRED, SiteCheckr.constants.TYPE.CUSTOM);
};

SiteCheckr.buildinRules.duplicateId.prototype = SiteCheckr.rules.test.prototype;
SiteCheckr.buildinRules.duplicateId.prototype.custom_check = function(contextNode) {
    var result = { boolean: true, elements: [] };

    var ids = {}; //store ID => [/x/pa/th, /x/pa/th]

    //get all elements with an id:
    var xpath = document.evaluate('//*[@id]', contextNode, null, XPathResult.ANY_TYPE, null);
    var elem = xpath.iterateNext();
    if(elem) {

        var id, jsonelem;

        while(elem) {
            id = elem.id;

            if(!id) {
                elem = xpath.iterateNext();
                continue;
            }

            if(!ids[id]) {
                ids[id] = [];
            }
            
            jsonelem = SiteCheckr.Helper.getDOMElementAsJSON(elem);
            jsonelem.custom = '#' + id;
            ids[id].push(jsonelem);

            elem = xpath.iterateNext();
        }

        elem = null;
        
        for(var id in ids) {
            if(!ids.hasOwnProperty(id)) continue;
            
            if(!ids[id] || ids[id].length < 2) continue;
            
            //there is more than one element with #id
            //set boolean result to false
            result.boolean = false;
            
            //and copy elements into result.elements
            result.elements = result.elements.concat(ids[id]);
        }
        
        ids = null;
    }

    
    return result;
};