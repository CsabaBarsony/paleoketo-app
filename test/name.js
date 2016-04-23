var assert = require('chai').assert;
var jsdom = require('jsdom');

global.React = require('react/addons');

;(function(f) {
	// CommonJS
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f(require('react'));

		// RequireJS
	} else if (typeof define === "function" && define.amd) {
		define(['react'], f);

		// <script>
	} else {
		var g
		if (typeof window !== "undefined") {
			g = window;
		} else if (typeof global !== "undefined") {
			g = global;
		} else if (typeof self !== "undefined") {
			g = self;
		} else {
			// works providing we're not in "use strict";
			// needed for Java 8 Nashorn
			// see https://github.com/facebook/react/issues/3037
			g = this;
		}
		g.ReactDOM = f(g.React);
	}

})(function(React) {
	return React.__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
});

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;

global._ = require('../public/js/lodash');
global.bella = require('../public/js/bella');

global.ReactDOM = require('../public/js/react-dom');
var TestUtils = React.addons.TestUtils;

describe('name', function() {
	it('valami', function() {
		console.log(ReactDOM);
		var Home = require('../src/scripts/components/home/home');
		var server = require('../src/scripts/server');
		var name = server.food.getName();
		assert.equal(name, 'this is my name');
	});
});
