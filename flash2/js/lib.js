"use strict";

var fs = fs || {};

fs.namespace = function(ns_string) {
    var parts = ns_string.split('.'),
        parent = fs,
        i;

    // strip redundant leading global
    if (parts[0] === "fs") {
        parts = parts.slice(1);
    }

    for (i=0; i<parts.length; i++) {
        // create a property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
}


// observer pattern
fs.event = (function() {
    // local variables of events
    var callbacks = {};

    // interfaces
    return {
        register: function(event, fn) {

            if (typeof callbacks[event] === "undefined") {
                callbacks[event] = [];
            }
            callbacks[event].push(fn);
        },
        registerOne: function(event, fn) {
            fn.one = true;
            fs.event.register(event, fn);
        },

        trigger: function(event) {

            if (typeof callbacks[event] === "undefined") {
                return;
            }

            var args = Array.prototype.slice.call(arguments, 1);
            callbacks[event].forEach(function(fn, key) {

                if (typeof fn === "function") {
                    fn.apply(null, args);
                    if (fn.one) {
                        delete(callbacks[event][key]);
                    }
                }
            });
        }
    }
})();


(function ($) {
    "use strict";
    var tmpl = function (str, data) {
        var f = !/[^\w\-\.:]/.test(str) ? tmpl.cache[str] = tmpl.cache[str] ||
                tmpl(tmpl.load(str)) :
                    new Function(
                        tmpl.arg + ',tmpl',
                        "var _e=tmpl.encode" + tmpl.helper + ",_s='" +
                            str.replace(tmpl.regexp, tmpl.func) +
                            "';return _s;"
                    );
        return data ? f(data, tmpl) : function (data) {
            return f(data, tmpl);
        };
    };
    tmpl.cache = {};
    tmpl.load = function (id) {
        return document.getElementById(id).innerHTML;
    };
    tmpl.regexp = /([\s'\\])(?!(?:[^{]|\{(?!%))*%\})|(?:\{%(=|#)([\s\S]+?)%\})|(\{%)|(%\})/g;
    tmpl.func = function (s, p1, p2, p3, p4, p5) {
        if (p1) { // whitespace, quote and backspace in HTML context
            return {
                "\n": "\\n",
                "\r": "\\r",
                "\t": "\\t",
                " " : " "
            }[p1] || "\\" + p1;
        }
        if (p2) { // interpolation: {%=prop%}, or unescaped: {%#prop%}
            if (p2 === "=") {
                return "'+_e(" + p3 + ")+'";
            }
            return "'+(" + p3 + "==null?'':" + p3 + ")+'";
        }
        if (p4) { // evaluation start tag: {%
            return "';";
        }
        if (p5) { // evaluation end tag: %}
            return "_s+='";
        }
    };
    tmpl.encReg = /[<>&"'\x00]/g;
    tmpl.encMap = {
        "<"   : "&lt;",
        ">"   : "&gt;",
        "&"   : "&amp;",
        "\""  : "&quot;",
        "'"   : "&#39;"
    };
    tmpl.encode = function (s) {
        /*jshint eqnull:true */
        return (s == null ? "" : "" + s).replace(
            tmpl.encReg,
            function (c) {
                return tmpl.encMap[c] || "";
            }
        );
    };
    tmpl.arg = "o";
    tmpl.helper = ",print=function(s,e){_s+=e?(s==null?'':s):_e(s);}" +
        ",include=function(s,d){_s+=tmpl(s,d);}";
    if (typeof define === "function" && define.amd) {
        define(function () {
            return tmpl;
        });
    } else {
        $.tmpl = tmpl;
    }
}(fs));




fs.localStorage = (function(){

    return {

		isSupport : function(){
			if ( localStorage && typeof localStorage.setItem === 'function' ) {

				localStorage.setItem('localStorageSupported', 'supported');
				var supported = (localStorage.getItem('localStorageSupported') === 'supported');
				localStorage.removeItem('localStorageSupported');

				return supported;
			}

			return false;
		},

        setItem		: function(key, value) { localStorage.setItem(key, value); },
		getItem		: function(key) { return localStorage.getItem(key); },
        removeItem	: function(key) { localStorage.removeItem(key); },
        clear		: function()	{ localStorage.clear(); }
    };
})();

fs.cookie = (function($){
    var defaultOpt = {path: '/'};

    return {
		isSupport : function(){

			if ( navigator && typeof navigator.cookieEnabled !== 'undefined' ) {
				$.cookie('cookieSupported', 'supported', { expires: 1 });

				var supported = ($.cookie('cookieSupported') == 'supported');
				$.removeCookie('cookieSupported');

				return supported;
			}

			return false;
		},

        setItem: function(key, value, opt) {
			$.cookie(key, value, $.extend(defaultOpt, opt));
		},

        getItem: function(key) {
            return $.cookie(key);
        },

        removeItem: function(key) {
            $.removeCookie(key);
        },
        clear: function() {
            $.each($.cookie(), function(key ,value) {
                $.removeCookie(key);
            });
        }
    }
})(jQuery);


fs.storage = (function(){

	var support = {
			localStorage : fs.localStorage.isSupport(),
			cookie		 : fs.cookie.isSupport()
		},
		data = {};

	return {
        setItem: function(key, value, opt) {

			data[ key ] = value;

            if		( support.localStorage )	fs.localStorage.setItem(key, value);
            else if ( support.cookie )			fs.cookie.setItem(key, value, { expires: 365 });
        },

        getItem: function(key) {
			if		( support.localStorage )	return fs.localStorage.getItem(key);
            else if ( support.cookie )			return fs.cookie.getItem(key);
			else								return data[ key ];
        },

        removeItem: function(key) {

			delete data[ key ];

            if ( support.localStorage )
                fs.localStorage.removeItem(key);
            else if ( support.cookie )
                fs.cookie.removeItem(key);
        },
        clear: function() {

			data = {};

            if ( support.localStorage )
                fs.localStorage.clear();
            else if ( support.cookie )
                fs.cookie.clear();
        }
    };
})();


(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);

//http://www.featureblend.com/license.txt
var FlashDetect=new function(){var self=this;self.installed=false;self.raw="";self.major=-1;self.minor=-1;self.revision=-1;self.revisionStr="";var activeXDetectRules=[{"name":"ShockwaveFlash.ShockwaveFlash.7","version":function(obj){return getActiveXVersion(obj);}},{"name":"ShockwaveFlash.ShockwaveFlash.6","version":function(obj){var version="6,0,21";try{obj.AllowScriptAccess="always";version=getActiveXVersion(obj);}catch(err){}
return version;}},{"name":"ShockwaveFlash.ShockwaveFlash","version":function(obj){return getActiveXVersion(obj);}}];var getActiveXVersion=function(activeXObj){var version=-1;try{version=activeXObj.GetVariable("$version");}catch(err){}
return version;};var getActiveXObject=function(name){var obj=-1;try{obj=new ActiveXObject(name);}catch(err){obj={activeXError:true};}
return obj;};var parseActiveXVersion=function(str){var versionArray=str.split(",");return{"raw":str,"major":parseInt(versionArray[0].split(" ")[1],10),"minor":parseInt(versionArray[1],10),"revision":parseInt(versionArray[2],10),"revisionStr":versionArray[2]};};var parseStandardVersion=function(str){var descParts=str.split(/ +/);var majorMinor=descParts[2].split(/\./);var revisionStr=descParts[3];return{"raw":str,"major":parseInt(majorMinor[0],10),"minor":parseInt(majorMinor[1],10),"revisionStr":revisionStr,"revision":parseRevisionStrToInt(revisionStr)};};var parseRevisionStrToInt=function(str){return parseInt(str.replace(/[a-zA-Z]/g,""),10)||self.revision;};self.majorAtLeast=function(version){return self.major>=version;};self.minorAtLeast=function(version){return self.minor>=version;};self.revisionAtLeast=function(version){return self.revision>=version;};self.versionAtLeast=function(major){var properties=[self.major,self.minor,self.revision];var len=Math.min(properties.length,arguments.length);for(i=0;i<len;i++){if(properties[i]>=arguments[i]){if(i+1<len&&properties[i]==arguments[i]){continue;}else{return true;}}else{return false;}}};self.FlashDetect=function(){if(navigator.plugins&&navigator.plugins.length>0){var type='application/x-shockwave-flash';var mimeTypes=navigator.mimeTypes;if(mimeTypes&&mimeTypes[type]&&mimeTypes[type].enabledPlugin&&mimeTypes[type].enabledPlugin.description){var version=mimeTypes[type].enabledPlugin.description;var versionObj=parseStandardVersion(version);self.raw=versionObj.raw;self.major=versionObj.major;self.minor=versionObj.minor;self.revisionStr=versionObj.revisionStr;self.revision=versionObj.revision;self.installed=true;}}else if(navigator.appVersion.indexOf("Mac")==-1&&window.execScript){var version=-1;for(var i=0;i<activeXDetectRules.length&&version==-1;i++){var obj=getActiveXObject(activeXDetectRules[i].name);if(!obj.activeXError){self.installed=true;version=activeXDetectRules[i].version(obj);if(version!=-1){var versionObj=parseActiveXVersion(version);self.raw=versionObj.raw;self.major=versionObj.major;self.minor=versionObj.minor;self.revision=versionObj.revision;self.revisionStr=versionObj.revisionStr;}}}}}();};FlashDetect.JS_RELEASE="1.0.4";

