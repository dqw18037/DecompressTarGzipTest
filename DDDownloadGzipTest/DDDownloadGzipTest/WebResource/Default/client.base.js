window.util = (function() {
	var hash;
	var parseObj = function(str) {
		var obj = {};
		str.replace(/([^=&]+)(?:\=([^&]+))?/g, function(match, key, val) {
			obj[key] = val;
		});
		return obj;
	};
	return {
		hash: function(key) {
			if(!hash) {
				hash = parseObj(location.hash.slice(1));
			}
			return hash[key];
		},
		cookie: function(option) {
			var name, cookies = [], cookieReg, date, cookieObj = {};
			option = option || {};
			if(option.value === undefined) {
				name = option.name;
				cookieReg = new RegExp('(?:;|^)\\s*' + name + '=([^;]*)');
				return decodeURIComponent((document.cookie.match(cookieReg) || [])[1] || '');
			}
			cookies.push(option.name + '=' + encodeURIComponent(option.value));
			date = new Date();
			if(option.date) {
				date.setTime(date.getTime() + option.date * 8.64e7);
				cookies.push('expires=' + date.toGMTString());
			} else {
				date.setTime(date.getTime() + 100 * 8.64e7);
			}
			cookies.push('path=/');
			if(option.domain) {
				cookies.push('domain=' + option.domain);
			}
			cookieObj[option.name] = '' + option.value;
			cookieObj.expires = ~~(date.getTime() / 1000);
			cookieObj.domain = option.domain || document.domain;
			document.cookie = cookies.join(';');
			jsBridge.setCookie(cookieObj);
		}
	};
}());
window.UI = (function() {
	return {
		setFontSize: function(type) {
			if(/^(?:s|m|x?l)$/.test(type)) {
				document.body.classList.remove('font_s', 'font_m', 'font_l', 'font_xl');
				document.body.classList.add('font_' + type);
			}
		},
		setDayMode: function(flag) {
			flag = +flag;
			if(flag === 0) {
				document.body.classList.add('night');
			} else {
				document.body.classList.remove('night');
			}
		}
	};
}());
(function(hash) {
	var extend = function(target) {
		var extensions = Array.prototype.slice.call(arguments, 1);
		extensions.forEach(function(extension) {
			if(extension) {
				Object.keys(extension).forEach(function(key) {
					target[key] = extension[key];
				});
			}
		});
		return target;
	};
	window.globalConfig = extend({
		fontSize: hash('tt_font') || '',
		dayMode: hash('tt_daymode') || ''
	}, window.globalConfig, window.serverGlobalConfig);
}(window.util.hash));
if(!window.CustomEvent) {
	(function () {
		var CustomEvent = function( event, params ) {
			var evt;
			params = params || {
				bubbles: false,
				cancelable: false,
				detail: undefined
			};
			evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
			return evt;
		};
		CustomEvent.prototype = window.Event.prototype;
		window.CustomEvent = CustomEvent;
	})();
}
(function(config) {
	var addEvent = function(el, eventName, eventHandler) {
		if(typeof eventName === 'string') {
			el.addEventListener(eventName, eventHandler, false);
		} else {
			Object.keys(eventName).forEach(function(key) {
				el.addEventListener(key, eventName[key], false);
			});
		}
	};
	window.UI.setDayMode(config.dayMode);
	window.UI.setFontSize(config.fontSize);
	addEvent(window, {
		DOMContentLoaded: function() {
			window.jsBridge.domReady();
		},
		load: function() {
			window.jsBridge.bodyLoad();
		}
	});
	addEvent(document, {
		FontChanged: function(e) {
			window.UI.setFontSize(e.detail.fontSize);
		},
		ThemeChanged: function(e) {
			window.UI.setDayMode(e.detail.dayMode);
		}
	});
}(window.globalConfig));