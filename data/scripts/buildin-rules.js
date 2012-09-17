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

    var ids = {}; //store ID => #num

    //get all elements with an id:
    var xpath = document.evaluate('//*[@id]', contextNode, null, XPathResult.ANY_TYPE, null);
    var elem = xpath.iterateNext();
    if(elem) {

        var id;

        while(elem) {
            id = elem.id;

            if(!id) {
                elem = xpath.iterateNext();
                continue;
            }

            if(ids[id] && ids[id] > 0) {
                ids[id] += 1;
                result.elements.push(SiteCheckr.Helper.getDOMElementAsJSON(elem));
                result.boolean = false;
            } else {
                ids[id] = 1;
            }

            elem = xpath.iterateNext();
        }

        elem = null;
    }

    return result;
};