window.jsBridge = (function(isDebug) {
	var jsBridgeIframe = document.getElementById('__jsBridgeIframe__');
	var linkQuene = [], invokeInterval;
	var invokeCommand = (function() {
		if(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.pacific) {
			return function(command, config) {
				config = config || {};
				var message = {
					action: command,
					parameters: config.params,
					print: !!config.print
				};
				if(typeof config.callback === 'string') {
					message.callback = {
						type: 0,
						name: config.callback,
						parameters: ['key']
					};
				} else {
					message.callback = config.callback;
				}
				window.webkit.messageHandlers.pacific.postMessage(message);
			};
		} else {
			return function(command, config) {
				var link, key, params = [], _param;
				config = config || {};
				link = (config.protocol || 'sslocal') + '://' + command;
				if(config.callback) {
					config.params = config.params || {};
					config.params.callback = config.callback;
				}
				if(config.params) {
					_param = config.params;
					for(key in _param) {
						if(_param.hasOwnProperty(key)) {
							params.push(encodeURIComponent(key) + '=' + encodeURIComponent(_param[key]));
						}
					}
					params.push('r=' + (Math.random() + '').slice(2));
					link += '?' + params.join('&');
				}
				if(!isDebug) {
					if(config.isImmediate) {
						jsBridgeIframe.src = link;
					} else {
						linkQuene.push(link);
						if(invokeInterval) {
							clearInterval(invokeInterval);
						}
						invokeInterval = setInterval(function() {
							var _link = linkQuene.shift();
							if(linkQuene.length === 0) {
								clearInterval(invokeInterval);
							}
							jsBridgeIframe.src = _link;
						}, 100);
					}
				} else {
					console.log(link);
					if(config.debugCall) {
						config.debugCall(command, config.params);
					}
				}
			};
		}
	}());
	return {
		/**
		 * load image
		 * @param  {String} type image type, possible value 'origin, offline, thumb, full'
		 * @param  {Object} config configuration
		 * @config {Number} index image index
		 * @config {Number} left image horizontal coordinate
		 * @config {Number} top image vertical coordinate
		 * @config {Number} width image width
		 * @config {Number} height image height
		 * @param  {Function} debugCall debug callback function
		 */
		loadImage: function(type, config, debugCall) {
			config.eventName = 'ImageDidLoad';
			invokeCommand(type + '_image', {
				protocol: 'bytedance',
				params: config,
				debugCall: debugCall,
				isImmediate: type === 'large'
			});
		},
		/**
		 * batch load image
		 * @param  {String} type image type, possible value 'origin, offline, thumb'
		 */
		loadImages: function(type) {
			invokeCommand('load' + type.substr(0, 1).toUpperCase() + type.substr(1) + 'Image', {
				protocol: 'bytedance',
				params: {
					eventName: 'ImageDidLoad'
				}
			});
		},
		/**
		 * abort load image
		 * @config {Number} index image index
		 */
		cancelImage: function(index) {
			invokeCommand('cancel_image', {
				protocol: 'bytedance',
				params: {
					index: index
				}
			});
		},
		/**
		 * custom event
		 * @param  {Object} config    configuration
		 * @config {String} category event category
		 * @config {String} tag event tag
		 * @config {String} label event label
		 */
		customEvent: function(config) {
			invokeCommand('custom_event', {
				protocol: 'bytedance',
				params: config
			});
		},
		/**
		 * info client dom is ready
		 */
		domReady: function() {
			invokeCommand('domReady');
		},
		/**
		 * info client body is loaded
		 */
		bodyLoad: function() {
			invokeCommand('bodyLoaded');
		},
		/**
		 * client log
		 * @param  {String} str log string
		 */
		log: function(str) {
			invokeCommand('console', {
				params: {
					msg: str + ''
				}
			});
		},
		/**
		 * client tip
		 * @param  {String} msg tip message string
		 * @param {Number} [duration=1] tip duration
		 */
		tip: function(msg, duration) {
			duration = +duration || 1;
			invokeCommand('tip', {
				params: {
					msg: msg,
					duration: duration
				}
			});
		},
		/**
		 * open url
		 * @param  {String} url
		 * @param  {Object} config
		 */
		openUrl: function(url, config) {
			config = config || {};
			invokeCommand('webview', {
				params: {
					url: url,
					title: config.title || '',
					hide_more_button: config.hide_more_button || 0,
					allows_custom_fragment: config.allows_custom_fragment || 0,
					hide_navigation_bar: config.hide_navigation_bar || 0
				}
			});
		},
		/**
		 * open detail page
		 * @param  {String} groupId
		 * @param  {String} itemId
		 * @param  {Number} aggrType
		 * @param  {Number} detailType
		 */
		detail: function(groupId, itemId, aggrType, detailType, logExtra) {
			var config = {
				group_id: groupId,
				item_id: itemId,
				aggr_type: aggrType,
				log_extra: JSON.stringify(logExtra || {})
			};
			if(detailType !== undefined) {
				config.detail_type = detailType;
			}
			invokeCommand('detail', {
				params: config
			});
		},
		/**
		 * request
		 * @param  {Object} config request configuration
		 * @config {String} url request url
		 * @config {String} method request method, default to 'get'
		 * @config {Object} data request data
		 * @config {String|Object} callback callback event name or callback object
		 * @callback {String} name callback event name
		 * @callback {Number} type callback type 0 event, 1 callback
		 * @callback {Array} parameters callback parameters
		 */
		request: function(config) {
			config = config || {};
			invokeCommand('request', {
				params: {
					key: config.key,
					url: config.url,
					method: config.method || 'get',
					queryData: JSON.stringify(config.data || {})
				},
				callback: config.callback || 'RequestDidFinish'
			});
		},
		/**
		 * track event
		 * @param  {String} eventName event name
		 * @param  {Object} config  event properties
		 */
		trackEvent: function(eventName, config) {
			invokeCommand('track_event', {
				params: {
					'protected': 1,
					event_name:  eventName,
					properties: JSON.stringify(config || {})
				}
			});
		},
		/**
		 * track events
		 * @param {String} eventsName [description]
		 * @param {Array} events
		 */
		trackEvents: function(eventsName, events) {
			if(typeof eventsName !== 'string') {
				events = eventsName;
			} else {
				events.forEach(function(event) {
					event.name = eventsName;
				});
			}
			invokeCommand('track_events', {
				params: {
					events: JSON.stringify(events)
				}
			});
		},
		/**
		 * Info client to update widget height
		 * @param  {Number} height widget height
		 */
		refreshHeight: function(height, extra) {
			invokeCommand('refreshHeight', {
				params: {
					height: height,
					extra: JSON.stringify(extra || {})
				},
				isImmediate: 1
			});
		},
		/**
		 * Info client to update widget
		 */
		refreshWidget: function() {
			invokeCommand('refreshWidget');
		},
		/**
		 * Info client to hide widget
		 */
		hideWidget: function(extra) {
			extra = extra || {};
			invokeCommand('hideWidget', {
				params: {
					extra: JSON.stringify(extra)
				}
			});
		},
		alterCity: function() {
			invokeCommand('alterCity');
		},
		updateCategory: function(data, callback) {
			data = data || {};
			var category = data.category;
			delete data.category;
			invokeCommand('updateCategory', {
				params: {
					category: category,
					data: JSON.stringify(data)
				},
				callback: callback || 'CategoryDidUpdate'
			});
		},
		categoryDetail: function(data) {
			data = data || {};
			var category = data.category;
			delete data.category;
			invokeCommand('categoryDetail', {
				params: {
					category: category,
					data: JSON.stringify(data)
				}
			});
		},
		setCookie: function(data) {
			invokeCommand('setCookie', {
				params: data || {}
			});
		}
	};
}(window.globalConfig ? window.globalConfig.isDebug : false));
