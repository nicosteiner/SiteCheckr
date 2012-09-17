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