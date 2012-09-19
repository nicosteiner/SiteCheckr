"use strict";

/**
 * More information on notifications
 * https://developer.mozilla.org/en-US/docs/Code_snippets/Alerts_and_Notifications#Using_notification_box
 */

const windowutils = require("window-utils");
const self = require("self");

var Helper = Helper || {};

Helper.constants = Helper.constants || {};
Helper.constants.priority = Helper.constants.priority || {};

Helper.constants.priority.INFO_LOW = 100;
Helper.constants.priority.INFO_MEDIUM = 110;
Helper.constants.priority.INFO_HIGH = 120;
Helper.constants.priority.WARNING_LOW = 200;
Helper.constants.priority.WARNING_MEDIUM = 210;
Helper.constants.priority.WARNING_HIGH = 220;
Helper.constants.priority.CRITICAL_LOW = 300;
Helper.constants.priority.CRITICAL_MEDIUM = 310;
Helper.constants.priority.CRITICAL_HIGH = 320;
Helper.constants.priority.CRITICAL_BLOCK = 330; 

Helper.id = self.id;
Helper.defaults = Helper.defaults || {};
Helper.defaults.image = 'chrome://browser/skin/Info.png';
Helper.defaults.priority = Helper.constants.priority.INFO_MEDIUM;

Helper.getGBrowserRef = function() {
	 return windowutils.activeBrowserWindow.gBrowser;
};

Helper.getPriority = function(prio, nb) {
    if(!nb) return;
    switch(prio) {
        case Helper.constants.priority.INFO_LOW:
            return nb.PRIORITY_INFO_LOW;
            break;
        case Helper.constants.priority.INFO_MEDIUM:
            return nb.PRIORITY_INFO_MEDIUM;
            break;
        case Helper.constants.priority.INFO_HIGH:
            return nb.PRIORITY_INFO_HIGH;
            break;
        case Helper.constants.priority.WARNING_LOW:
            return nb.PRIORITY_WARNING_LOW;
            break;
        case Helper.constants.priority.WARNING_MEDIUM:
            return nb.PRIORITY_WARNING_MEDIUM;
            break;
        case Helper.constants.priority.WARNING_HIGH:
            return nb.PRIORITY_WARNING_HIGH;
            break;
        case Helper.constants.priority.CRITICAL_LOW:
            return nb.PRIORITY_CRITICAL_LOW;
            break;
        case Helper.constants.priority.CRITICAL_MEDIUM:
            return nb.PRIORITY_CRITICAL_MEDIUM;
            break;
        case Helper.constants.priority.CRITICAL_HIGH:
            return nb.PRIORITY_CRITICAL_HIGH;
            break;
        case Helper.constants.priority.CRITICAL_BLOCK:
            return nb.PRIORITY_CRITICAL_BLOCK;
            break;
        default:
            return nb.PRIORITY_INFO_MEDIUM;
            break;
    }
};

Helper.showNotification = function(message, image, prio, id) {
	var _gBrowser = Helper.getGBrowserRef();
	if(!_gBrowser) return;
	
	var _image = (image) ? image : Helper.defaults.image;
	var _prio = (prio) ? prio : Helper.defaults.priority;
	var _id = (id) ? Helper.id + id : Helper.id;

	var _nb = _gBrowser.getNotificationBox();
	var _n = _nb.getNotificationWithValue(_id);
	
	if(_n) {
	    _n.label = message;
	} else {
	    const priority = Helper.getPriority(_prio, _nb);
	    _nb.appendNotification(message, _id, _image, priority, []);
	}
};

exports.show = function(message, image, prio, id) {
	Helper.showNotification(message, image, prio, id);
};
exports.priority = Helper.constants.priority;