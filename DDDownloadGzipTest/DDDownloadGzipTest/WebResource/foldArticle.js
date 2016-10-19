'use strict';
$(function() {
	(function(globalConfig) {
		var article = $('article'), limitHeight = 2 * window.innerHeight;
		var readMoreTxt = window.appGlobalConfig.readMoreText;
		var articleHeight = 0, paraIndex, paraLen, curPara, paragraphs;
		var offsetTop = article.offset().top;
		var report = function(eventName, config) {
			location.href = 'sslocal://track_event?' + 'protected=1&event_name=' + encodeURIComponent(eventName) + '&properties=' +  encodeURIComponent(JSON.stringify(config));
		};
		$(document.body).on($.os.android ? 'click' : 'tap', '.article_more', function(e) {
			report('Article Unfold', window.appGlobalConfig.articleProperties);
			article.css('height', '');
			$(this).addClass('hidden');
		});
		if(limitHeight && article.height() - offsetTop > limitHeight) {
			paragraphs = article.children();
			for(paraIndex = 0, paraLen = paragraphs.length; paraIndex < paraLen; ++paraIndex) {
				curPara = paragraphs.eq(paraIndex);
				articleHeight = curPara.offset().top;
				if(articleHeight > limitHeight) {
					article.css('height', (articleHeight - offsetTop - 7) + 'px');
					article.after('<div class="more-container"><div class="more article_more">' + readMoreTxt + '</div></div>');
					break;
				}
			}
		}
	}());
});