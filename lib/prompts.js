"use strict";

/**
 * More information on prompts
 * https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIPromptService
 */

const {Cc, Ci} = require("chrome");

exports.prompt = function(title, message, defaultValue) {
	var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
	
	var input = {value: defaultValue};
	 
	var result = prompts.prompt(null, title, message, input, null, {});
	
	if(!result) {
	    return false;
	}
	
	return input.value;
};
