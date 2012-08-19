"use strict";

var Helper = Helper || {};

exports.results = {};

exports.add = function(result, tab) {
   var key = Helper.tab2key(tab);
   result.tab = {url: tab.url};
   exports.results[key] = result;
};

exports.get = function(tab) {
    var key = Helper.tab2key(tab);
    if(exports.results[key]) {
        return exports.results[key];
    }
    return false;
};

exports.clear = function() {
	exports.results = {};
}


Helper.tab2key = function(tab) {
    return tab.url; //TODO: hash!?
};