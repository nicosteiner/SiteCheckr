"use strict";

/**
 * More information on InspectorUI:
 * http://dxr.lanedo.com/mozilla-central/browser/devtools/highlighter/inspector.jsm.html
 */

const windowutils = require("window-utils");
const self = require("self");

var Helper = Helper || {};

Helper.getWindowRef = function() {
	 return windowutils.activeBrowserWindow;
};

Helper.BrowserOpenAddonsMgr = function(url) {
	var _window = Helper.getWindowRef();
	if(!_window) return;
	_window.BrowserOpenAddonsMgr(url);
	_window = null;
};

Helper.getAddonUri = function(addonId) {
	if(!addonId || addonId == undefined) {
		addonId = self.id;
	}
	return 'addons://detail/' + encodeURIComponent(addonId) + '/';
};

exports.showDetails = function(addonId) {
	var url = Helper.getAddonUri(addonId);
	Helper.BrowserOpenAddonsMgr(url);
};

exports.showPreferences = function(addonId) {
	var url = Helper.getAddonUri(addonId) + 'preferences/';
	Helper.BrowserOpenAddonsMgr(url);
};