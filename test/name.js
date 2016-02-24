var assert = require('chai').assert;
var jsdom = require('jsdom');

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;

global._ = require('../public/js/lodash');
global.bella = require('../public/js/bella');
global.React = require('react/addons');
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
