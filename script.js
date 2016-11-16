var $ = document.querySelectorAll.bind(document);


var nodes = {
	nav: document.getElementsByClassName('main-nav')[0],
	banner1: document.getElementById('banner1'),
	banner2: document.getElementById('banner2'),
	progress_bar: document.getElementsByClassName('progress-bar')[0],
	buttons: document.getElementsByClassName('button'),
}

var state = {
	mobile_breakpoint: 800,
	screen_size: document.documentElement.clientWidth,
	scrollY: window.scrollY,
	previous_scrollY: 0,
	is_mobile: false,
	screen: 'desktop',
	plus_button_clicked: false
}

var positions = {
	nav_top: 0,
	banners: [
		{node: nodes.banner1, desktop: 0, mobile: 0},
		{node: nodes.banner2, desktop: 0, mobile: 0}
	]
}

var els = {
	//navClientHeight: window.getComputedStyle(document.getElementsByClassName('main-nav')[0]).height.replace(/\D/g,''),
	bannerClientHeight: window.getComputedStyle(nodes.banner1).height.replace(/\D/g,''),
}

var utils = (function() {

	return {
		isMobile: function() {
			return state.screen_size > state.mobile_breakpoint ? false : true;
		},

		isScrollingUp: function () {
			return state.previous_scrollY > state.scrollY ? true : false
		},

		addClass: function(el, className) {
			if (!el.classList.contains(className)) {
				el.classList.add(className)
			}
		},

		removeClass: function(el, className) {
			if (el.classList.contains(className)) {
				el.classList.remove(className)
			}
		},

		addClasses: function(args) {
			args.map(function(key, index) {
				utils.addClass(key[0], key[1]);
			})
		},

		removeClasses: function(args) {
			args.map(function(key, index) {
				utils.removeClass(key[0], key[1]);
			})
		},

		getPosition: function(el) {
		  var xPos = 0;
		  var yPos = 0;
		 
		  while (el) {
		    if (el.tagName == "BODY") {
		      // deal with browser quirks with body/window/document and page scroll
		      var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
		      var yScroll = el.scrollTop || document.documentElement.scrollTop;
		 
		      xPos += (el.offsetLeft - xScroll + el.clientLeft);
		      yPos += (el.offsetTop - yScroll + el.clientTop);
		    } else {
		      // for all other non-BODY elements
		      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
		      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
		    }
		 
		    el = el.offsetParent;
		  }
		  return {
		    x: xPos,
		    y: yPos
		  }
		},
	};
})();

var observers = {
	updateMobileState: function() {
		state.is_mobile = utils.isMobile();
		state.screen = state.is_mobile ? 'mobile' : 'desktop';
	},
}


var effects = {
	addBannerEffects: function(banners, scrollY) {
		banners.map(function(key, index) {
			var banner 			= positions.banners[index];
			var containerHeight = banner.node.parentElement.clientHeight;
			var bannerGone 		= banner.node[state.screen]+containerHeight;
			var opacity			= Math.abs( (state.scrollY-banner[state.screen])/600 )

			if (scrollY >= banner[state.screen]) {
				banner.node.previousElementSibling.style.opacity = opacity;
				utils.addClasses([
					[banner.node, 'fixed-top'],
					[banner.node.previousElementSibling, 'fixed-top', 'opacity-transition'],
				]);	
			} 

			if (scrollY >= bannerGone || scrollY <= banner[state.screen] ) {
				utils.removeClasses([
					[banner.node, 'fixed-top'],
					[banner.node.previousElementSibling, 'fixed-top', 'opacity-transition'],
				]);			
				banner.node.previousElementSibling.style.opacity = 0;	
			}	
		});
	},

	makeProgress: function(scrollY) {
		var body = document.body;
    	var html = document.documentElement;

		var pageHeight = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );

		var sectionPaddingTop = window.getComputedStyle(document.getElementsByClassName('section')[2]).paddingTop.replace(/\D/g,'');

		//subtract the position where we start reading + section top padding from the page height 
		var constant = ( (pageHeight - ( positions.banners[0][state.screen] + Number(els.bannerClientHeight) + Number(sectionPaddingTop) ) )/100 );
		var progress = Math.ceil(scrollY/constant);

		nodes.progress_bar.style.width = progress + '%';
	},

}


var handlers = {
	upScroll: function() {
		//show the nav and hide the progress bar
		utils.removeClass(nodes.nav, 'slide-out');
		utils.removeClass(nodes.progress_bar, 'is-visible');
		
	},	
	//hide the nav and show the progress bar
	downScroll: function(scrollY) {
		utils.addClasses([
			[nodes.nav, 'slide-out'],
			[nodes.progress_bar, 'is-visible'],
		]);
		effects.makeProgress(scrollY);
	},

	clickPlusButton: function() {	
		for (var i = 0; i < nodes.buttons.length; i++) {
			if (nodes.buttons[i].classList.contains('mod-plus')) {
				utils.addClass(nodes.buttons[i].children[0], 'rotate');
			} else {
				utils.addClass(nodes.buttons[i], 'is-visible');
				utils.removeClass(nodes.buttons[i], 'is-hidden');
			}
		}

	},	
	closePlusButton: function() {
		for (var i = 0; i < nodes.buttons.length; i++) {
			if (nodes.buttons[i].classList.contains('mod-plus')) {
				utils.removeClass(nodes.buttons[i].children[0], 'rotate');
			} else {
				utils.removeClass(nodes.buttons[i], 'is-visible');
				utils.addClass(nodes.buttons[i], 'is-hidden');
			}
		}
	},
}



var listeners = {
	scroll: function() {
		//console.log(this.scrollY);
		
		state.previous_scrollY = state.scrollY;
		state.scrollY = this.scrollY || window.pageYOffset || document.documentElement.scrollTop;

		effects.addBannerEffects([nodes.banner1, nodes.banner2], state.scrollY);

		//keep the nav fixed and progress bar hidden until we get to the article content
		if (state.scrollY > positions.banners[0][state.screen] ){
			//if upscrolling
			if (utils.isScrollingUp()) {
				handlers.upScroll();
			} 
			else {
				handlers.downScroll(state.scrollY);
			}
		} 		
	},

	resize: function() {
		state.screen_size = document.documentElement.clientWidth;
		console.log('resized state.screen_size: ' + state.screen_size);

		init();
	},

	buttons: function(e) {
		//make sure we're only detecting the button containers and not the button children
		var button = e.target == this ? e.target : e.target.parentElement;
		
		if (e.type == "click") {
			//plus button
			if (button.classList.contains('mod-plus')) {
				if (!state.plus_button_clicked) {
					handlers.clickPlusButton();
					state.plus_button_clicked = true;
				} else {
					handlers.closePlusButton();
					state.plus_button_clicked = false;
				}
			}
			
		}//end e.type == click 
	},

}

//INIT
function init() {	
	//here, subscribe to state.screen_size and if it changes, run this function
	observers.updateMobileState();

	console.log(state.screen);
	//console.log(utils.getPosition(nodes.banner1).y);
	//console.log(utils.getPosition(nodes.banner2).y);

	//add our banner positions here
	positions.banners.map(function(key) {
		//add scrollY to ensure non-negative value id page is re-loaded while scrolled down the page 
		key[state.screen] = utils.getPosition(key.node).y + state.scrollY;
	});
}

init();

/* EVENT LISTENERS */

window.addEventListener('resize', listeners.resize, false);

window.addEventListener('scroll', listeners.scroll, false);

//add mouse event handlers for buttons
for (var i = 0; i < nodes.buttons.length; i++) {
	nodes.buttons[i].addEventListener('click', listeners.buttons, false);
}
		



