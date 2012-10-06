"use strict";

/**
 * - this file is attached to a panel
 */

var SiteCheckr = SiteCheckr || {};

SiteCheckr.Panel = {
    
    tabs: [],
    
    MAX_URL_LENGTH: 50,
    
    ERROR_DATA_ATTR: 'data-errors',
    
    switchTab: function(newTab) {
        for (var i = 0; i < SiteCheckr.Panel.tabs.length; i++) {
            var tab = this.tabs[i];
            if(tab.attr('id') === newTab) {
                tab.removeClass('hidden');
            } else {
                tab.addClass('hidden');
            }
        }
    },
    
    init: function() {
        jQuery(".tab").each(function() {
            SiteCheckr.Panel.tabs.push(jQuery(this));
        });
        
        jQuery("a.switchTab").click(function(e) {
            var target = e.target.hash.replace('#', '');
            SiteCheckr.Panel.switchTab(target);
            SiteCheckr.Panel.hideInfoMessages();
            return false;
        });
        
        jQuery("a[href='#checkCurrTab']").click(function(e) {
            self.port.emit('toMain', {port: 'command', param: 'analyzeCurrentTab'});
            return false;
        });
        
        jQuery("a[href='#openPreferences']").click(function(e) {
            self.port.emit("toMain", {port: 'command', param: 'openPreferences'});
            return false;
        });
        
        jQuery("a[href='#openHelp']").click(function(e) {
            self.port.emit("toMain", {port: 'command', param: 'openHelp'});
            return false;
        });
    },
    
    processResult: function(ruleset) {
        
        var container = document.createElement('div');
        
        if(ruleset.tab.url) {

            var headline_cnt = ruleset.tab.url;
            if(headline_cnt.length > SiteCheckr.Panel.MAX_URL_LENGTH) {
                headline_cnt = headline_cnt.substr(0, SiteCheckr.Panel.MAX_URL_LENGTH) + ' [...]';
            }
            
            var headline = document.createElement('h2');
            headline.appendChild(document.createTextNode(headline_cnt));
            headline.setAttribute('title', ruleset.tab.url);
            container.appendChild(headline);
        }   

        var res = document.createElement('ul');
        res.setAttribute('id', 'result');
        res.classList.add('result');

		container.appendChild(res);

        if(ruleset.rules.length == 0) {
            this.switchTab('norules');
            return;
        }
        
        for(var i=0; i<ruleset.rules.length; i++) {
            var rule = ruleset.rules[i];
            
            var elem = document.createElement('li');

            if(rule.priority == SiteCheckr.constants.PRIORITY.NICETOHAVE) {
                elem.classList.add('nicetohave');
            }
            
            var state = document.createElement('span');
            state.classList.add('state');
            elem.appendChild(state);

            /* ADD TITLE */
            var title = document.createElement('h3');
            title.appendChild(document.createTextNode(rule.title));
            elem.appendChild(title);
            
            /* ADD DESCRIPTION */
            var desc = document.createElement('p');
            desc.appendChild(document.createTextNode(rule.description));
            desc.classList.add('desc');
            elem.appendChild(desc);

            if(rule.result.boolean === true) {
                elem.classList.add('no-error');
                state.appendChild(document.createTextNode(_('no-error')));
            } else {
                var $elem = jQuery(elem);
                elem.classList.add('error');
                state.appendChild(document.createTextNode(_('error')));
                if(rule.result.elements.length > 0) {
                    var errorElems = rule.result.elements;
                    elem.classList.add('has-details');
                    $elem.data(SiteCheckr.Panel.ERROR_DATA_ATTR, errorElems);
                    $elem.click(SiteCheckr.Panel.openErrorDetails);
                    var list = document.createElement('ol');
                    list.classList.add('details');
                    for(var j=0; j<errorElems.length; j++) {
                        var errorElem = errorElems[j];
                        var item = document.createElement('li');
						var $item = jQuery(item);

                        item.appendChild(document.createTextNode(errorElem.html));
                        $item.data(SiteCheckr.Panel.ERROR_DATA_ATTR, errorElem);
                        $item.click(SiteCheckr.Panel.inspectElement);
                        item.setAttribute('title', 'Inspect Element'); //TODO: gettext
                        list.appendChild(item);
                    }
                    elem.appendChild(list);
                }
            }
            res.appendChild(elem);
        }

        jQuery('#result').html('').append(container);
        this.switchTab('result');
    },
    
    noResultAvailable: function() {
        jQuery('#result').html('');
        this.switchTab('about');
        this.hideInfoMessages();
    },
        
    openErrorDetails: function(event) {
        event.cancelBubble = true;
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        this.classList.toggle('open');
    },
    
    inspectElement: function(event) {
        var $this = jQuery(this);
        event.cancelBubble = true;
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        var errorElem = $this.data(SiteCheckr.Panel.ERROR_DATA_ATTR);
        if(errorElem && errorElem.xpath) {
            self.port.emit("toMain", {port: 'inspectByXPath', param: errorElem.xpath});
        }
    },
    
    hideInfoMessages: function() {
        jQuery('.info').hide();
    }
     
};

/* prepare for l10n */
var _ = function(key) {
	return key;
}

jQuery().ready(function() {
    SiteCheckr.Panel.init();
});

self.port.on('result', function(ruleset) {
    SiteCheckr.Panel.processResult(ruleset);
});

self.port.on('pageCannotBeChecked', function() {
	SiteCheckr.Panel.switchTab('about');
	jQuery('#pageCannotBeChecked').show();
});

self.port.on('noResultAvailable', function() {
    SiteCheckr.Panel.noResultAvailable();
});