"use strict";

/**
 * - this file is attached to a tab
 */

var SiteCheckr = SiteCheckr || {};

SiteCheckr.Analyzer = {
    analyze: function(contextNode) {
        if(SiteCheckr.ruleset) {
            SiteCheckr.ruleset.check(contextNode);
            
            self.port.emit('toMain', {port: 'result', param: SiteCheckr.ruleset});   

        }
    }
};

self.port.on('ruleset', function(jsonRuleset) {

	if (window.frameElement === null) { //DO NOT ANALYZE IFRAMES
		

	    SiteCheckr.ruleset = SiteCheckr.rules.loadFromJSON(jsonRuleset);
	    jQuery().ready(function() {
	        SiteCheckr.Analyzer.analyze(document);
	    });
	    
	}
});