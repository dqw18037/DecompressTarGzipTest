(function(hash) {
	window.globalConfig = window.globalConfig || {};
	window.serverGlobalConfig = window.serverGlobalConfig || {};
	window.globalConfig = $.extend({
		maxWidth: document.body.clientWidth || window.innerWidth,
		maxHeight: document.body.clientHeight || window.innerHeight,
		isMobile: /mobile/gi.test(navigator.userAgent),
		isDebug: hash('debug') === 'pc',
		imgType: hash('tt_image') || 'origin',
		offset: 10,
		lazyLoad: 0,
		minMagnifyRatio: 0.5,
		gifPlayInNative: 0,
		showLargeGifIcon: 0,
		groupId: '',
		tapEvent: $.os.android ? 'click' : 'tap'
	}, window.globalConfig, window.serverGlobalConfig);
	// 正文宽度
	window.globalConfig.maxWidth -= 30;
}(window.util.hash));
(function(config) {
	$(function() {
		// show image
		window.imageUI.show(config.imgType);
		window.imageUI.addEvent();
		// init table
		window.tableUI.init();
	});
	$(document).on('ImageDidLoad', function(e) {
		window.imageUI.appendLocal(e.detail.index, e.detail.url, e.detail.type, e.detail.tip);
	});
}(window.globalConfig));

window.imageUI = (function(config) {
	var triggerImg = $('#trigger-img'), placeholders = $('.image'), images;
	var showPlaceholders = function(type, index) {
		var _holders = placeholders;
		if($.type(index) === 'number') {
			_holders = _holders.eq(index);
		}
		_holders.each(function(i) {
			var holder = $(this), width, height, maxWidth, originWidth;
			if(type !== 'none') {
				if(type !== 'origin' || config.showLargeGifIcon) {
					addGifIcon(holder);
				}
			}
			if(type === 'thumb') {
				width = holder.attr('thumb_width');
				height = holder.attr('thumb_height');
				holder.addClass('thumb').removeClass('offline');
			} else {
				originWidth = +holder.attr('width') || 200;
				width = originWidth;
				maxWidth = Math.min(config.maxWidth, holder.width()) || config.maxWidth;
				if(maxWidth <= 10) {
					maxWidth = config.maxWidth;
				}
				if(originWidth > config.minMagnifyRatio * maxWidth) {
					width = maxWidth;
				}
				width = Math.min(width, maxWidth);
				height = ~~(holder.attr('height') * width / originWidth) || 200;
				if(type === 'none') {
					height = Math.min(height, config.maxHeight * 0.8);
					holder.addClass('offline');
				} else {
					holder.removeClass('offline');
				}
				holder.removeClass('thumb');
			}
			holder.css({
				width: width + 'px',
				height: height + 'px'
			});
			if(!index) {
				holder.attr('index', i);
			}
		});
	};
	var lazyLoad = function() {
		var imageCount = images.length, imageIndex, cnt, curImage;
		if(imageCount) {
			for(imageIndex = 0, cnt = 0; imageIndex < images.length; ++imageIndex, ++cnt) {
				curImage = images[imageIndex];
				if(isInView(curImage)) {
					(function(curImage, delayCount) {
						var src;
						curImage = $(curImage);
						src = getAndroidImgUrl(curImage.attr('index'), curImage.attr('zip_src_path'));
						setTimeout(function() {
							if($.os.android) {
								curImage.html('<img src="' + src + '" onload="imageDidLoad.call(this)" onerror="imageFailLoad.call(this)">');
							} else {
								jsBridge.loadImage(config.imgType, {
									index: delayCount
								});
							}
						}, delayCount * 200);
					}(curImage, cnt));
					images.splice(imageIndex--, 1);
				}
			}
		} else {
			$(document).off('scroll', lazyLoad);
		}
	};
	var isInView = function(el) {
		var elOffset, windowHeight;
		if(!el) {
			return false;
		}
		elOffset = $(el).offset();
		if(elOffset.top < 0) {
			return true;
		}
		windowHeight = config.maxHeight;
		return elOffset.left >= 0 && elOffset.top <= (windowHeight + window.scrollY);
	};
	var addHolderLoadingStatus = function(el) {
		var hasImage = el.data('load'), info, state;
		info = getHolderInfo(el);
		state = info.state;
		if(info.isLoading) {
			if(info.isGif) {
				addGifIcon(el);
			}
			removeLoading(el);
			return;
		}
		if((state === 'origin' || state === undefined) && hasImage) {
			return;
		}
		addLoading(el, hasImage);
		removeGifIcon(el);
		if(hasImage) {
			el.css('backgroundImage', 'none');
		} else {
			el.addClass('loading');
		}
	};
	var addGifIcon = function(el) {
		el.append('<i class="gif_play"></i>');
	};
	var removeGifIcon = function(el) {
		el.find('.gif_play').remove();
	};
	var addLoading = function(el) {
		el.find('.retry').remove();
		el.append('<i class="spinner rotate"></i>');
	};
	var removeLoading = function(el, showRetry, tip) {
		var hasImage;
		el.removeClass('loading').find('.spinner').remove();
		hasImage = el.find('img').length;
		if(showRetry && !hasImage) {
			tip = tip || 'Tap to retry';
			el.append('<p class="retry">' + tip + '</p>');
		}
	};
	var getAndroidImgUrl = function(index, path) {
		return config.urlPrefix + 'getimage/' + config.imgType + '/' + path + '/' + config.groupId + '/' + index + '/ImageDidLoad';
	};
	var loadImages = function(type) {
		if($.os.android) {
			// tips  也许没有这100ms会触发android crash
			setTimeout(function() {
				placeholders.each(function(index) {
					var $this = $(this), src = getAndroidImgUrl(index, $this.attr('zip_src_path'));
					$this.html('<img src="' + src + '" onload="imageDidLoad.call(this)" onerror="imageFailLoad.call(this)">');
				});
			}, 100);
		} else {
			jsBridge.loadImages(type);
		}
	};
	var getHolderInfo = function(holder) {
		var state = 'origin', info;
		info = {
			isLoading: !!holder.find('.spinner').length,
			isGif: holder.attr('type') === 'gif'
		};
		if(holder.hasClass('thumb')) {
			state = 'thumb';
		}
		if(holder.hasClass('offline')) {
			state = 'offline';
		}
		info.state = state;
		return info;
	};
	window.imageDidLoad = function() {
		$(this).parent().css('background', 'none').data('load', 1);
	};
	window.imageFailLoad = function() {
		$(this).remove();
	};
	return {
		show: function(type) {
			showPlaceholders(type);
			switch(type) {
				case 'origin':
					triggerImg.hide();
					break;
				case 'none':
					triggerImg.find('a').text('显示图片');
					break;
				default:
					break;
			}
			if(config.lazyLoad) {
				images = placeholders.get();
				lazyLoad();
				$(document).on('scroll', lazyLoad);
			} else {
				if(type === 'none') {
					type = 'offline';
				}
				loadImages(type);
			}
		},
		addEvent: function() {
			placeholders.on('click', function() {
				var el = $(this), viewType, hasImage,
					elOffset, imageWidth, imageHeight,
					originWidth, originHeight,
					width, height,
					index = el.attr('index'),
					info = getHolderInfo(el),
					isOrigin, src,
					isLink = el.attr('href').indexOf('http') === 0;
				if(info.isLoading) {
					jsBridge.cancelImage({
						index: index
					});
				} else {
					viewType = 'full';
					hasImage = el.data('load');
					if(info.state !== 'origin' || !hasImage) {
						isOrigin = false;
						viewType = 'origin';
						addHolderLoadingStatus(el);
					} else {
						isOrigin = true;
					}
					if(!isLink) {
						elOffset = el.offset();
						imageWidth = elOffset.width || el.attr('width');
						imageHeight = elOffset.height || el.attr('height');
						if(viewType === 'origin') {
							originWidth = +el.attr('width');
							originHeight = +el.attr('height');
							width = Math.min(originWidth, config.maxWidth);
							height = ~~(originHeight * width / originWidth) || 200;
							el.css({
								width: width + 'px',
								height: height + 'px'
							});
						}
						if(info.isGif) {
							switch(config.gifPlayInNative) {
								case 0:
									if(viewType !== 'full') {
										jsBridge.loadImage(viewType, {
											index: index
										});
									}
									break;
								case 1:
									if(viewType === 'full') {
										jsBridge.loadImage('full', {
											index: index
										});
									}
									break;
								case 2:
									jsBridge.loadImage('full', {
										index: index
									});
									break;
								default:
									jsBridge.loadImage(viewType, {
										index: index
									});
							}
						} else {
							if($.os.android && !isOrigin) {
								src = getAndroidImgUrl(index, el.attr('zip_src_path'));
								el.prepend('<img src="' + src + '" onload="imageDidLoad.call(this)" onerror="imageFailLoad.call(this)">');
							} else {
								jsBridge.loadImage(isOrigin ? 'large' : viewType, {
									index: index,
									left: elOffset.left,
									top: elOffset.top,
									width: imageWidth,
									height: imageHeight
								});
							}
						}
					}
				}
				return isLink;
			});
		},
		appendLocal: function(index, url, type, tip) {
			var holder = placeholders.eq(index);
			if(!holder.data('load')) {
				if(tip) {
					removeLoading(holder, 1, tip);
				} else {
					holder.data('load', 1);
					holder.html('<img src="' + url + '"/>').css('background', 'none');
					showPlaceholders(type, index);
				}
			}
		}
	};
}(window.globalConfig));
window.tableUI = (function(config) {
	return {
		init: function() {
			var tables = $('article table');
			tables.each(function() {
				var table = $(this), images = table.find('.image'), container;
				if(!images.length) {
					table.addClass('border');
					if(config.isMobile) {
						table.wrap('<div class="horizontal_scroll"/>');
						/**
						 * 以下功能为android4.5版本新增， 但暂时不开发，待确认
						 * 问题1： 安卓不能局部bytedance://disable_swipe，故右滑手势会让整个页面退出
						 * 问题2： 安卓部分系统不触发touchend, 不方便实现touchend时swipe.style.opacity = 1
						 */
						if(!$.os.android) {
							container = table.parent();
							if(table.width() > config.maxWidth) {
								container.append('<div class="swipe_tip">左滑查看更多</div>').on('touchstart', function() {
									$(this).find('.swipe_tip').css('opacity', '0');
								}).on('touchend scroll', function() {
									if(this.scrollLeft === 0) {
										$(this).find('.swipe_tip').css('opacity', '1');
									}
								});
							}
						}
					}
				}
			});
		}
	};
}(window.globalConfig));
(function() {
	'use strict';

	var tapEvent = $.os.android ? 'click' : 'tap';
	var clicked = false;
	var btn = $('.follow_btn'), subscribe, followUrl;
	$(document.body).on(tapEvent, '.follow_btn', function(e) {
		e.stopPropagation();
		e.target.propagationStoped = true;
		var action,
			id = this.dataset.sourceId;

		if(clicked) {
			return;
		}
		if($(this).hasClass('followed')) {
			action = 'unsubscribe';
			btn.find('span').html(subscribe.follow_text);
		} else {
			action = 'subscribe';
			btn.find('span').html(subscribe.following_text);
		}
		btn.toggleClass('followed');
		jsBridge.trackEvent('Subscribe Source ' + (action === 'subscribe' ? 'Follow' : 'Unfollow'), {
			'Subscribe Source ID': id
		});
		clicked = true;
		jsBridge.request({
			key: id,
			url: followUrl,
			method: 'POST',
			callback: 'FollowInDetail',
			data: {
				'actions': [{
					'time': ~~(Date.now() / 1000),
					'action_type': action,
					'target_type': 'source_info',
					'id': + id,
					'aggr_type': window.appGlobalConfig.articleProperties['Aggr Type']
				}]
			}
		});
	}).on(tapEvent, '.follow-container', function(e) {
		if(e.target.propagationStoped) {
			return;
		}
		var root = $(this);
		var id = root.data('id');
		jsBridge.trackEvent('Subscribe Source Click', {
			'Subscribe Source ID': id
		});
		jsBridge.categoryDetail({
			category: subscribe.category_id,
			category_parameter: '' + id,
			title_image: root.find('img').attr('src'),
			description: root.data('description'),
			user_subscription: subscribe.subscribed || 0,
			title: root.find('.name').text()
		});
	});

	$(document).on('FollowInDetail', function(e) {
		clicked = false;
		if (e.detail.message !== 'success') {
			changeFollowBtnMode(!btn.hasClass('followed'));
			return;
		}
		subscribe.subscribed = subscribe.subscribed ? 0 : 1;
	}).on('InfoDidLoad', function(e) {
		subscribe = e.detail.subscribe;
		followUrl = subscribe.follow_url;
		changeFollowBtnMode(subscribe.subscribed);
		btn.show();
	}).on('SubscriptionDidChange', function(e) {
		subscribe.subscribed = e.detail.isSubscribed;
		if('' + e.detail.subscriptionId === '' + btn.data('sourceId')) {
			changeFollowBtnMode(e.detail.isSubscribed);
		}
	});

	function changeFollowBtnMode(flag) {
		if(flag) {
			btn.addClass('followed').find('span').html(subscribe.following_text);
		} else {
			btn.removeClass('followed').find('span').html(subscribe.follow_text);
		}
	}
})();
