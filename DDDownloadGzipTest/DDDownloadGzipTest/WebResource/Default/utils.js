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