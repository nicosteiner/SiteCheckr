"use strict";

/**
 * - this file is attached to a tab
 * - this file is attached to a panel
 */

var SiteCheckr = SiteCheckr || {};

SiteCheckr.Helper = {
    
    getDOMElementAsJSON: function(elem) {
        var json = {};
        json.html = SiteCheckr.Helper.getElementHTML(elem);
        json.xpath = SiteCheckr.Helper.getFullyQualifiedXPath(elem);
        return json;
    },
    
    /**
     * Builds fully qualified XPath up to root element.
     * Generated XPath is able to identify single element.
     * @param elem
     */
    getFullyQualifiedXPath: function(elem) {
        var path = "", idx, xname;
        while(elem && elem.nodeType == 1){
           idx = SiteCheckr.Helper.getElementIdx(elem);
           xname = elem.tagName.toLowerCase();
           if (idx > 1) xname += "[" + idx + "]";
           path = "/" + xname + path;
           elem = elem.parentNode;
        }
        return path;   
    },
    getElementIdx: function (elem) {
        var count = 1;
        for (var sib = elem.previousSibling; sib ; sib = sib.previousSibling)
        {
            if(sib.nodeType == 1 && sib.tagName == elem.tagName) count++;
        } 
        return count;
    },
    getElementHTML: function(elem) {
        var div = document.createElement('div');
        var cElem = elem.cloneNode(false);
        if(elem.innerHTML != "") {
            cElem.innerHTML = "[...]";
        }
        div.appendChild(cElem);
        var txt = div.innerHTML;
        cElem = null; div = null;
        return txt;
    }
}