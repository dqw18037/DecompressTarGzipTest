'use strict';
(function() {
	var illustrations = $('.sns-illustration'), showImages, asyncImages,
 scrollTimeout = null,
 imageWidth = illustrations.width();
	$.each(illustrations, function() {
           var image = $(this),
           width = image.data('width'),
           height = image.data('height');
           image.css('height', height * imageWidth / width + 'px');
           });
	asyncImages = illustrations.add($('.sns-avatar'));
	showImages = function() {
 if(asyncImages.length === 0) {
 $(window).off('scroll', showImages);
 return;
 }
 if(scrollTimeout) {
 clearTimeout(scrollTimeout);
 }
 scrollTimeout = setTimeout(function() {
                            asyncImages = asyncImages.filter(function() {
                                                             var $image = $(this),
                                                             offset = $image.offset(),
                                                             imgTop = offset.top,
                                                             imgHeight = offset.height,
                                                             viewPortTop = window.pageYOffset,
                                                             viewPortBottom = viewPortTop + window.innerHeight;
                                                             if(viewPortTop <= imgTop + imgHeight && viewPortBottom >= imgTop) {
                                                             $image.attr('src', $image.data('src'));
                                                             return false;
                                                             }
                                                             return true;
                                                             });
                            }, 300);
	};
	showImages();
	$(window).on('scroll', showImages);
 })();
