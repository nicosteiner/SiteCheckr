"use strict";

/**
 * More information on InspectorUI:
 * http://dxr.lanedo.com/mozilla-central/browser/devtools/highlighter/inspector.jsm.html
 */

const windowutils = require("window-utils");

var Helper = Helper || {};

Helper.getWindowRef = function() {
	 return windowutils.activeBrowserWindow;
};
Helper.getDocumentRef = function() {
   return Helper.getWindowRef().gBrowser.selectedBrowser.contentWindow.document;
};

Helper.invisibleElements = ['script', 'style', 'link', 'meta', 'title', 'head'];
Helper.isInvisibleElement = function(node) {
    var tagName = node.tagName.toLowerCase();
    for(var i=0; i<Helper.invisibleElements.length; i++) {
        if(tagName == Helper.invisibleElements[i]) {
            return true;
        }
    }
    return false;
};

exports.highlightById = function(id) {
    var document = Helper.getDocumentRef();
    var elem = document.getElementById(id);
    exports.highlight(elem);
};

exports.highlightByXPath = function(xpath) {
    var document = Helper.getDocumentRef();
    var result = document.evaluate(xpath, document, null, 9, null);
    var elem = result.singleNodeValue;
    exports.highlight(elem);
};

exports.highlight = function(node) {
    if(node) {
        if(this.isOpen()) {
            this.close();
        }
        Helper.getWindowRef().InspectorUI.openInspectorUI(node);
        Helper.getWindowRef().InspectorUI.inspectNode(node, true);
        if(Helper.isInvisibleElement(node)) {
            Helper.getWindowRef().InspectorUI.treePanel.open();
        }
    }
};
    
exports.isOpen = function() {
    return Helper.getWindowRef().InspectorUI.isInspectorOpen;
};
exports.close = function() {
   Helper.getWindowRef().InspectorUI.closeInspectorUI();
};
