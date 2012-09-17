"use strict";
var SiteCheckr = SiteCheckr || {};
SiteCheckr.commands = SiteCheckr.commands || {};
SiteCheckr.settings = SiteCheckr.settings || {};

var Helper = Helper || {};

const self = require("self");
const data = require("self").data;
const inspector = require("inspector");
const addonmgr = require("addonmgr");
const panel = require("panel");
const tabs = require("tabs");
const ruleset = require("ruleset");
const prefs = require("simple-prefs");
const widget = require("widget");
const pb = require("private-browsing");
const { MatchPattern } = require("match-pattern");
var _ = require("l10n").get;

/**
 * Basic Settings
 */
SiteCheckr.settings.analyzeContentScriptFiles = [data.url('scripts/jquery-1.7.1.min.js'),
                                                 data.url('scripts/helper.js'),
                                                 data.url('scripts/rules.js'),
                                                 data.url('scripts/analyze.js')];

SiteCheckr.settings.checkNotAllowed = ['about:blank', 'about:newtab', 'about:addons'];

/**
 * AutoCheck
 */
SiteCheckr.autoCheck = {
   workers: [],
   init: function() {
       prefs.on('autoCheck', SiteCheckr.autoCheck.init);     
       prefs.on('autoCheckFilter', SiteCheckr.autoCheck.init); 
       SiteCheckr.autoCheck.setupAutoCheck();
   },
   setupAutoCheck: function() {
       SiteCheckr.autoCheck.removeAutoCheck();
       if(SiteCheckr.autoCheck.enabled) {
           
           SiteCheckr.autoCheck.pageMod = require("page-mod").PageMod({
               include: SiteCheckr.autoCheck.filter,
               contentScriptFile: SiteCheckr.settings.analyzeContentScriptFiles,
               onAttach: function onAttach(worker) {
                   worker.port.emit('ruleset', ruleset.getJSONRuleset());
                   worker.on('detach', function () {
                       SiteCheckr.autoCheck.detachWorker(this, SiteCheckr.autoCheck.workers);
                   });
                   SiteCheckr.communication.init(worker);
                   SiteCheckr.autoCheck.workers.push(worker);
               }
           });
       }
   },
   removeAutoCheck: function() {
       for(var i=0; i<SiteCheckr.autoCheck.workers.length; i++) {
           var worker = SiteCheckr.autoCheck.workers[i];
           worker.destroy();
       }
       if(SiteCheckr.autoCheck.pageMod) {
      	   SiteCheckr.autoCheck.pageMod.destroy();
       	   SiteCheckr.autoCheck.pageMod = null;
       }
   },
   detachWorker: function(worker, workerArray) {
       var index = workerArray.indexOf(worker);
       if(index != -1) {
         workerArray.splice(index, 1);
       }
   },
   get enabled() {
       return prefs.prefs.autoCheck;
   },
   get filter() {
       var filter = prefs.prefs.autoCheckFilter;
       if(!filter || filter == "") {
           return Helper.filter.FALLBACK;
       }
       
       return Helper.filter.parse(filter);
   }
};

SiteCheckr.autoCheck.init();

/**
 * PANEL
 */
SiteCheckr.panel = panel.Panel({
    contentURL : data.url("panels/index.html"),
    contentScriptFile: [
        data.url('scripts/jquery-1.7.1.min.js'),
        data.url('scripts/helper.js'),
        data.url('scripts/rules.js'),
        data.url('scripts/panels.js')
    ],
    width: 425
});

/**
 * WIDGET
 */
SiteCheckr.widget = widget.Widget({
    id: "sitecheckr-widget",
    label: _('addon_name'),
    contentURL: data.url('img/button/default.png'),
    panel: SiteCheckr.panel
  });

/**
 * RESULTS
 */
SiteCheckr.results = require('result');

/**
 * remove all results when switching private browsing mode
 */
pb.on('start', SiteCheckr.results.clear);
pb.on('stop', SiteCheckr.results.clear);

/**
 * toggle results when switching tabs
 */
tabs.on('activate', function(tab) {
	if(!Helper.canPageBeChecked(tab.url)) {
	    //SiteCheckr.commands.pageCannotBeChecked();
	    SiteCheckr.commands.noResultAvailable();
		return;
	}

    var result = SiteCheckr.results.get(tab);
    if(result !== false) {
        SiteCheckr.commands.processResult(result);
    } else {
        SiteCheckr.commands.noResultAvailable();
    }
});

/**
 * COMMUNICATION BETWEEN ELEMENTS
 */
SiteCheckr.communication = {
    init: function(elem) {
        elem.port.on('toPanel', this.toPanel);
        elem.port.on('toTab', this.toTab);
        elem.port.on('toMain', this.toMain);
    },
    toPanel: function(data) {
        SiteCheckr.panel.port.emit(data.port, data.param);
    },
    toTab: function(data) {
        SiteCheckr.worker.port.emit(data.port, data.param);
    },
    toMain: function(data) {
        switch(data.port) {
            case 'command':
                SiteCheckr.commands.exec(data.param);
                break;
            case 'inspectByXPath':
                SiteCheckr.commands.inspectByXPath(data.param);
                break;
            case 'result':
                SiteCheckr.commands.processResult(data.param);
                break;
            default:
                break;
        }
    }
};

SiteCheckr.communication.init(SiteCheckr.panel);

/**
 * analyze current tab
 * is manually triggered by user
 */
SiteCheckr.commands.analyzeCurrentTab = function() {
    if(SiteCheckr.worker) {
        SiteCheckr.worker.destroy();
    }
    
    if(!tabs.activeTab || !tabs.activeTab.url) {
        return;
    }
    
    if(!Helper.canPageBeChecked(tabs.activeTab.url)) {
        SiteCheckr.commands.pageCannotBeChecked();
        return;
    }
    
    SiteCheckr.worker = tabs.activeTab.attach({
        contentScriptFile: SiteCheckr.settings.analyzeContentScriptFiles
    });
    
    SiteCheckr.communication.init(SiteCheckr.worker);

    //Worker needs ruleset
    SiteCheckr.worker.port.emit('ruleset', ruleset.getJSONRuleset());
};

/**
 * highlight element on website
 * @param xpath XPath of element, which should be highlighted
 */
SiteCheckr.commands.inspectByXPath = function(xpath) {
    inspector.highlightByXPath(xpath);
};

/**
 * processes result:
 * - sets toolbar icon
 * - send result to panel
 */
SiteCheckr.commands.processResult = function(ruleset) {
    var result = ruleset.result.boolean;
    
    SiteCheckr.communication.toPanel({port: 'result', param: ruleset});
    
    SiteCheckr.results.add(ruleset, tabs.activeTab);
    
    if(result) {
        SiteCheckr.widget.contentURL = data.url('img/button/no-errors.png');
    } else {
        SiteCheckr.widget.contentURL = data.url('img/button/errors.png');
    }
};

/**
 * switched to tab, which does not have any results yet.
 * - set toolbar icon
 * - send information to panel
 */
SiteCheckr.commands.noResultAvailable = function(ruleset) {
    SiteCheckr.communication.toPanel({port: 'noResultAvailable', param: null});
    SiteCheckr.widget.contentURL = data.url('img/button/default.png');
};

/**
 * switched to tab, which can't be checked.
 * - set toolbar icon
 * - send information to panel
 */
SiteCheckr.commands.pageCannotBeChecked = function(ruleset) {
    SiteCheckr.communication.toPanel({port: 'pageCannotBeChecked', param: null});
    SiteCheckr.widget.contentURL = data.url('img/button/default.png');
};

/**
 * opens ruleset in new tab
 */
SiteCheckr.commands.openRuleset = function() {
    var helper = require('api-utils/base64');
    
    var xml = ruleset.getXMLRuleset();
    var url = 'data:text/xml;base64,' + helper.encode(unescape(encodeURIComponent(xml)));
    tabs.open(url);
};
prefs.on("openRuleset", SiteCheckr.commands.openRuleset);

/**
 * opens preferences in new tab
 */
SiteCheckr.commands.openPreferences = function() {
    addonmgr.showPreferences();
};

/**
 * opens "About"-page in new tab 
 */
SiteCheckr.commands.openHelp = function() {
	var url = _('url.help');
	if(url == 'url.help') {
		return; //no Help-Page specified for current language
	}
	tabs.open(url);
};
prefs.on("openHelp", SiteCheckr.commands.openHelp);

SiteCheckr.commands.exec = function(command) {
    switch(command) {
        case 'analyzeCurrentTab':
            SiteCheckr.commands.analyzeCurrentTab();
            break;
        case 'openRuleset':
            SiteCheckr.commands.openRuleset();
            break;
        case 'openPreferences':
            SiteCheckr.commands.openPreferences();
            break;
        case 'openHelp':
        	SiteCheckr.commands.openHelp();
        	break;
        default:
            break;
    }
};

Helper.filter = Helper.filter || {};
Helper.filter.SEPARATOR = "|";
Helper.filter.FALLBACK = ["*"];
Helper.filter.parse = function(string) {
    var arr = [];
    
    if(!string) return Helper.filter.FALLBACK;
    
    var tmp = string.split(Helper.filter.SEPARATOR);
    for(var i=0; i<tmp.length; i++) {
        if(tmp[i] && Helper.filter.isValid(tmp[i])) {
            arr.push(tmp[i]);
        } else {
            //ERROR: part is not a valid pattern -> ignore it
        }
    }

    if(arr.length == 0) return Helper.filter.FALLBACK;
    
    return arr;
};
Helper.filter.isValid = function(string) {
    try {
        var mp = new MatchPattern(string);
        return true;
    } catch(err) {} 
    return false;
};

Helper.canPageBeChecked = function(url) {
    if(!url) return false;
    if(!SiteCheckr.settings.checkNotAllowed) return false;

    var pattern;
    for(var i=0; i<SiteCheckr.settings.checkNotAllowed.length; i++) {
        pattern = SiteCheckr.settings.checkNotAllowed[i];
        if(url.indexOf(pattern) != -1) {
            return false;
        }
    }
    
    return true;
};