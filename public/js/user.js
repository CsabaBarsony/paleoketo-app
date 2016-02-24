(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ReactDOM = require('react-dom');

var cs = require('../../helpers/cs');
var schemas = require('../../schemas');
var server = require('../../server');
var states = {
	GLOBAL: 'GLOBAL',
	SIZE: 'SIZE',
	CONTENT: 'CONTENT',
	SMALL: 'SMALL',
	BIG: 'BIG',
	LOGIN: 'LOGIN',
	REGISTER: 'REGISTER',
	DETAILS: 'DETAILS'
};
var contents = {
	LOGIN: 'LOGIN',
	REGISTER: 'REGISTER',
	DETAILS: 'DETAILS'
};
var stateChart = Stativus.createStatechart();

var User = React.createClass({
	displayName: 'User',

	getInitialState: function getInitialState() {
		var user = schemas.user.blank();

		return {
			status: 'GUEST',
			userName: user.name,
			opened: false,
			content: contents.LOGIN,
			errorMessage: ''
		};
	},
	componentDidMount: function componentDidMount() {
		var _this = this;

		stateChart.addState(states.GLOBAL, {
			substatesAreConcurrent: true,
			states: [{
				name: states.SIZE,
				initialSubstate: states.SMALL,
				states: [{
					name: states.SMALL,
					enterState: function enterState() {
						_this.setState({ opened: false });
					},
					toggleSize: function toggleSize() {
						this.goToState(states.BIG);
					}
				}, {
					name: states.BIG,
					enterState: function enterState() {
						_this.setState({ opened: true });
					},
					toggleSize: function toggleSize() {
						this.goToState(states.SMALL);
					}
				}]
			}, {
				name: states.CONTENT,
				initialSubstate: states.LOGIN,
				states: [{
					name: states.LOGIN,
					enterState: function enterState() {
						_this.setState({ content: contents.LOGIN });
					},
					loginSuccess: function loginSuccess() {
						this.goToState(states.DETAILS);
					}
				}, {
					name: states.REGISTER,
					enterState: function enterState() {
						_this.setState({ content: contents.REGISTER });
					}
				}, {
					name: states.DETAILS,
					enterState: function enterState() {
						_this.setState({
							content: contents.DETAILS,
							userName: bella.data.user.get().name
						});
					}
				}]
			}]
		});

		stateChart.initStates(states.GLOBAL);

		bella.data.user.subscribe(function (user) {
			switch (user.status) {
				case bella.constants.userStatus.LOGGED_IN:
					stateChart.sendEvent('loginSuccess', user);
					break;
				case bella.constants.userStatus.GUEST:
					stateChart.sendEvent('logoutSuccess');
					break;
			}
		});

		if (cs.cookie('user_id', document.cookie) && cs.cookie('token', document.cookie)) {
			server.userStatus.get(function (result, userStatus) {
				bella.data.user.set(userStatus, _this);
			});
		} else {
			bella.data.user.set('status', bella.constants.userStatus.GUEST, this);
		}
	},
	render: function render() {
		var content, display, errorMessage;

		if (this.state.opened) {
			switch (this.state.content) {
				case contents.LOGIN:
					content = React.createElement(
						'div',
						{ className: 'bc-user-popup' },
						errorMessage,
						React.createElement('input', { type: 'text', ref: 'name', defaultValue: 'a' }),
						React.createElement('br', null),
						React.createElement('input', { type: 'text', ref: 'password', defaultValue: '1' }),
						React.createElement('br', null),
						React.createElement(
							'button',
							{ onClick: this.login },
							'Login'
						),
						React.createElement('br', null),
						React.createElement(
							'a',
							{ href: '', onClick: this.register },
							'register'
						)
					);
					break;
				case contents.REGISTER:
					content = React.createElement(
						'div',
						{ className: 'bc-user-popup' },
						React.createElement(
							'span',
							null,
							'registration form...'
						)
					);
					break;
				case contents.DETAILS:
					content = React.createElement(
						'div',
						null,
						'user details...'
					);
					break;
			}
		}

		switch (this.state.content) {
			case contents.LOGIN:
			case contents.REGISTER:
				display = React.createElement(
					'a',
					{ href: '', onClick: this.toggleSize },
					'login/register'
				);
				break;
			case contents.DETAILS:
				display = React.createElement(
					'a',
					{ href: '', onClick: this.toggleSize },
					'user'
				);
				break;
		}

		return React.createElement(
			'div',
			{ className: 'bc-user' },
			React.createElement(
				'span',
				null,
				'U ',
				display
			),
			content
		);
	},
	toggleSize: function toggleSize(e) {
		e.preventDefault();
		stateChart.sendEvent('toggleSize');
	},
	login: function login() {
		var _this2 = this;

		server.login({
			username: this.refs.name.value,
			password: this.refs.password.value
		}, function (result, data) {
			if (result.success) {
				bella.data.user.set(data, _this2);
				_this2.setState({ errorMessage: '' });
			} else {
				_this2.setState({ errorMessage: 'Wrong username or password' });
			}
		});
	},
	logout: function logout(e) {
		var _this3 = this;

		e.preventDefault();
		server.logout(function (result) {
			if (result.success) {
				bella.data.user.set(schemas.user.blank(), _this3);
				_this3.setState({ opened: false });
			}
		});
	},
	register: function register(e) {
		e.preventDefault();
	}
});

ReactDOM.render(React.createElement(User, null), document.getElementById('header'));
},{"../../helpers/cs":18,"../../schemas":19,"../../server":20,"react-dom":3}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
'use strict';

module.exports = require('react/lib/ReactDOM');

},{"react/lib/ReactDOM":7}],4:[function(require,module,exports){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.assign
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

function assign(target, sources) {
  if (target == null) {
    throw new TypeError('Object.assign target cannot be null or undefined');
  }

  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    // We don't currently support accessors nor proxies. Therefore this
    // copy cannot throw. If we ever supported this then we must handle
    // exceptions and side-effects. We don't support symbols so they won't
    // be transferred.

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  return to;
};

module.exports = assign;

},{}],5:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactContext
 */

"use strict";

var assign = require("./Object.assign");

/**
 * Keeps track of the current context.
 *
 * The context is automatically passed down the component ownership hierarchy
 * and is accessible via `this.context` on ReactCompositeComponents.
 */
var ReactContext = {

  /**
   * @internal
   * @type {object}
   */
  current: {},

  /**
   * Temporarily extends the current context while executing scopedCallback.
   *
   * A typical use case might look like
   *
   *  render: function() {
   *    var children = ReactContext.withContext({foo: 'foo'}, () => (
   *
   *    ));
   *    return <div>{children}</div>;
   *  }
   *
   * @param {object} newContext New context to merge into the existing context
   * @param {function} scopedCallback Callback to run with the new context
   * @return {ReactComponent|array<ReactComponent>}
   */
  withContext: function(newContext, scopedCallback) {
    var result;
    var previousContext = ReactContext.current;
    ReactContext.current = assign({}, previousContext, newContext);
    try {
      result = scopedCallback();
    } finally {
      ReactContext.current = previousContext;
    }
    return result;
  }

};

module.exports = ReactContext;

},{"./Object.assign":4}],6:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCurrentOwner
 */

"use strict";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 *
 * The depth indicate how many composite components are above this render level.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],7:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOM
 * @typechecks static-only
 */

"use strict";

var ReactElement = require("./ReactElement");
var ReactElementValidator = require("./ReactElementValidator");
var ReactLegacyElement = require("./ReactLegacyElement");

var mapObject = require("./mapObject");

/**
 * Create a factory that creates HTML tag elements.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @private
 */
function createDOMFactory(tag) {
  if ("production" !== process.env.NODE_ENV) {
    return ReactLegacyElement.markNonLegacyFactory(
      ReactElementValidator.createFactory(tag)
    );
  }
  return ReactLegacyElement.markNonLegacyFactory(
    ReactElement.createFactory(tag)
  );
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = mapObject({
  a: 'a',
  abbr: 'abbr',
  address: 'address',
  area: 'area',
  article: 'article',
  aside: 'aside',
  audio: 'audio',
  b: 'b',
  base: 'base',
  bdi: 'bdi',
  bdo: 'bdo',
  big: 'big',
  blockquote: 'blockquote',
  body: 'body',
  br: 'br',
  button: 'button',
  canvas: 'canvas',
  caption: 'caption',
  cite: 'cite',
  code: 'code',
  col: 'col',
  colgroup: 'colgroup',
  data: 'data',
  datalist: 'datalist',
  dd: 'dd',
  del: 'del',
  details: 'details',
  dfn: 'dfn',
  dialog: 'dialog',
  div: 'div',
  dl: 'dl',
  dt: 'dt',
  em: 'em',
  embed: 'embed',
  fieldset: 'fieldset',
  figcaption: 'figcaption',
  figure: 'figure',
  footer: 'footer',
  form: 'form',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  head: 'head',
  header: 'header',
  hr: 'hr',
  html: 'html',
  i: 'i',
  iframe: 'iframe',
  img: 'img',
  input: 'input',
  ins: 'ins',
  kbd: 'kbd',
  keygen: 'keygen',
  label: 'label',
  legend: 'legend',
  li: 'li',
  link: 'link',
  main: 'main',
  map: 'map',
  mark: 'mark',
  menu: 'menu',
  menuitem: 'menuitem',
  meta: 'meta',
  meter: 'meter',
  nav: 'nav',
  noscript: 'noscript',
  object: 'object',
  ol: 'ol',
  optgroup: 'optgroup',
  option: 'option',
  output: 'output',
  p: 'p',
  param: 'param',
  picture: 'picture',
  pre: 'pre',
  progress: 'progress',
  q: 'q',
  rp: 'rp',
  rt: 'rt',
  ruby: 'ruby',
  s: 's',
  samp: 'samp',
  script: 'script',
  section: 'section',
  select: 'select',
  small: 'small',
  source: 'source',
  span: 'span',
  strong: 'strong',
  style: 'style',
  sub: 'sub',
  summary: 'summary',
  sup: 'sup',
  table: 'table',
  tbody: 'tbody',
  td: 'td',
  textarea: 'textarea',
  tfoot: 'tfoot',
  th: 'th',
  thead: 'thead',
  time: 'time',
  title: 'title',
  tr: 'tr',
  track: 'track',
  u: 'u',
  ul: 'ul',
  'var': 'var',
  video: 'video',
  wbr: 'wbr',

  // SVG
  circle: 'circle',
  defs: 'defs',
  ellipse: 'ellipse',
  g: 'g',
  line: 'line',
  linearGradient: 'linearGradient',
  mask: 'mask',
  path: 'path',
  pattern: 'pattern',
  polygon: 'polygon',
  polyline: 'polyline',
  radialGradient: 'radialGradient',
  rect: 'rect',
  stop: 'stop',
  svg: 'svg',
  text: 'text',
  tspan: 'tspan'

}, createDOMFactory);

module.exports = ReactDOM;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RET00uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIFJlYWN0RE9NXG4gKiBAdHlwZWNoZWNrcyBzdGF0aWMtb25seVxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgUmVhY3RFbGVtZW50ID0gcmVxdWlyZShcIi4vUmVhY3RFbGVtZW50XCIpO1xudmFyIFJlYWN0RWxlbWVudFZhbGlkYXRvciA9IHJlcXVpcmUoXCIuL1JlYWN0RWxlbWVudFZhbGlkYXRvclwiKTtcbnZhciBSZWFjdExlZ2FjeUVsZW1lbnQgPSByZXF1aXJlKFwiLi9SZWFjdExlZ2FjeUVsZW1lbnRcIik7XG5cbnZhciBtYXBPYmplY3QgPSByZXF1aXJlKFwiLi9tYXBPYmplY3RcIik7XG5cbi8qKlxuICogQ3JlYXRlIGEgZmFjdG9yeSB0aGF0IGNyZWF0ZXMgSFRNTCB0YWcgZWxlbWVudHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZyBUYWcgbmFtZSAoZS5nLiBgZGl2YCkuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjcmVhdGVET01GYWN0b3J5KHRhZykge1xuICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgcmV0dXJuIFJlYWN0TGVnYWN5RWxlbWVudC5tYXJrTm9uTGVnYWN5RmFjdG9yeShcbiAgICAgIFJlYWN0RWxlbWVudFZhbGlkYXRvci5jcmVhdGVGYWN0b3J5KHRhZylcbiAgICApO1xuICB9XG4gIHJldHVybiBSZWFjdExlZ2FjeUVsZW1lbnQubWFya05vbkxlZ2FjeUZhY3RvcnkoXG4gICAgUmVhY3RFbGVtZW50LmNyZWF0ZUZhY3RvcnkodGFnKVxuICApO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXBwaW5nIGZyb20gc3VwcG9ydGVkIEhUTUwgdGFncyB0byBgUmVhY3RET01Db21wb25lbnRgIGNsYXNzZXMuXG4gKiBUaGlzIGlzIGFsc28gYWNjZXNzaWJsZSB2aWEgYFJlYWN0LkRPTWAuXG4gKlxuICogQHB1YmxpY1xuICovXG52YXIgUmVhY3RET00gPSBtYXBPYmplY3Qoe1xuICBhOiAnYScsXG4gIGFiYnI6ICdhYmJyJyxcbiAgYWRkcmVzczogJ2FkZHJlc3MnLFxuICBhcmVhOiAnYXJlYScsXG4gIGFydGljbGU6ICdhcnRpY2xlJyxcbiAgYXNpZGU6ICdhc2lkZScsXG4gIGF1ZGlvOiAnYXVkaW8nLFxuICBiOiAnYicsXG4gIGJhc2U6ICdiYXNlJyxcbiAgYmRpOiAnYmRpJyxcbiAgYmRvOiAnYmRvJyxcbiAgYmlnOiAnYmlnJyxcbiAgYmxvY2txdW90ZTogJ2Jsb2NrcXVvdGUnLFxuICBib2R5OiAnYm9keScsXG4gIGJyOiAnYnInLFxuICBidXR0b246ICdidXR0b24nLFxuICBjYW52YXM6ICdjYW52YXMnLFxuICBjYXB0aW9uOiAnY2FwdGlvbicsXG4gIGNpdGU6ICdjaXRlJyxcbiAgY29kZTogJ2NvZGUnLFxuICBjb2w6ICdjb2wnLFxuICBjb2xncm91cDogJ2NvbGdyb3VwJyxcbiAgZGF0YTogJ2RhdGEnLFxuICBkYXRhbGlzdDogJ2RhdGFsaXN0JyxcbiAgZGQ6ICdkZCcsXG4gIGRlbDogJ2RlbCcsXG4gIGRldGFpbHM6ICdkZXRhaWxzJyxcbiAgZGZuOiAnZGZuJyxcbiAgZGlhbG9nOiAnZGlhbG9nJyxcbiAgZGl2OiAnZGl2JyxcbiAgZGw6ICdkbCcsXG4gIGR0OiAnZHQnLFxuICBlbTogJ2VtJyxcbiAgZW1iZWQ6ICdlbWJlZCcsXG4gIGZpZWxkc2V0OiAnZmllbGRzZXQnLFxuICBmaWdjYXB0aW9uOiAnZmlnY2FwdGlvbicsXG4gIGZpZ3VyZTogJ2ZpZ3VyZScsXG4gIGZvb3RlcjogJ2Zvb3RlcicsXG4gIGZvcm06ICdmb3JtJyxcbiAgaDE6ICdoMScsXG4gIGgyOiAnaDInLFxuICBoMzogJ2gzJyxcbiAgaDQ6ICdoNCcsXG4gIGg1OiAnaDUnLFxuICBoNjogJ2g2JyxcbiAgaGVhZDogJ2hlYWQnLFxuICBoZWFkZXI6ICdoZWFkZXInLFxuICBocjogJ2hyJyxcbiAgaHRtbDogJ2h0bWwnLFxuICBpOiAnaScsXG4gIGlmcmFtZTogJ2lmcmFtZScsXG4gIGltZzogJ2ltZycsXG4gIGlucHV0OiAnaW5wdXQnLFxuICBpbnM6ICdpbnMnLFxuICBrYmQ6ICdrYmQnLFxuICBrZXlnZW46ICdrZXlnZW4nLFxuICBsYWJlbDogJ2xhYmVsJyxcbiAgbGVnZW5kOiAnbGVnZW5kJyxcbiAgbGk6ICdsaScsXG4gIGxpbms6ICdsaW5rJyxcbiAgbWFpbjogJ21haW4nLFxuICBtYXA6ICdtYXAnLFxuICBtYXJrOiAnbWFyaycsXG4gIG1lbnU6ICdtZW51JyxcbiAgbWVudWl0ZW06ICdtZW51aXRlbScsXG4gIG1ldGE6ICdtZXRhJyxcbiAgbWV0ZXI6ICdtZXRlcicsXG4gIG5hdjogJ25hdicsXG4gIG5vc2NyaXB0OiAnbm9zY3JpcHQnLFxuICBvYmplY3Q6ICdvYmplY3QnLFxuICBvbDogJ29sJyxcbiAgb3B0Z3JvdXA6ICdvcHRncm91cCcsXG4gIG9wdGlvbjogJ29wdGlvbicsXG4gIG91dHB1dDogJ291dHB1dCcsXG4gIHA6ICdwJyxcbiAgcGFyYW06ICdwYXJhbScsXG4gIHBpY3R1cmU6ICdwaWN0dXJlJyxcbiAgcHJlOiAncHJlJyxcbiAgcHJvZ3Jlc3M6ICdwcm9ncmVzcycsXG4gIHE6ICdxJyxcbiAgcnA6ICdycCcsXG4gIHJ0OiAncnQnLFxuICBydWJ5OiAncnVieScsXG4gIHM6ICdzJyxcbiAgc2FtcDogJ3NhbXAnLFxuICBzY3JpcHQ6ICdzY3JpcHQnLFxuICBzZWN0aW9uOiAnc2VjdGlvbicsXG4gIHNlbGVjdDogJ3NlbGVjdCcsXG4gIHNtYWxsOiAnc21hbGwnLFxuICBzb3VyY2U6ICdzb3VyY2UnLFxuICBzcGFuOiAnc3BhbicsXG4gIHN0cm9uZzogJ3N0cm9uZycsXG4gIHN0eWxlOiAnc3R5bGUnLFxuICBzdWI6ICdzdWInLFxuICBzdW1tYXJ5OiAnc3VtbWFyeScsXG4gIHN1cDogJ3N1cCcsXG4gIHRhYmxlOiAndGFibGUnLFxuICB0Ym9keTogJ3Rib2R5JyxcbiAgdGQ6ICd0ZCcsXG4gIHRleHRhcmVhOiAndGV4dGFyZWEnLFxuICB0Zm9vdDogJ3Rmb290JyxcbiAgdGg6ICd0aCcsXG4gIHRoZWFkOiAndGhlYWQnLFxuICB0aW1lOiAndGltZScsXG4gIHRpdGxlOiAndGl0bGUnLFxuICB0cjogJ3RyJyxcbiAgdHJhY2s6ICd0cmFjaycsXG4gIHU6ICd1JyxcbiAgdWw6ICd1bCcsXG4gICd2YXInOiAndmFyJyxcbiAgdmlkZW86ICd2aWRlbycsXG4gIHdicjogJ3dicicsXG5cbiAgLy8gU1ZHXG4gIGNpcmNsZTogJ2NpcmNsZScsXG4gIGRlZnM6ICdkZWZzJyxcbiAgZWxsaXBzZTogJ2VsbGlwc2UnLFxuICBnOiAnZycsXG4gIGxpbmU6ICdsaW5lJyxcbiAgbGluZWFyR3JhZGllbnQ6ICdsaW5lYXJHcmFkaWVudCcsXG4gIG1hc2s6ICdtYXNrJyxcbiAgcGF0aDogJ3BhdGgnLFxuICBwYXR0ZXJuOiAncGF0dGVybicsXG4gIHBvbHlnb246ICdwb2x5Z29uJyxcbiAgcG9seWxpbmU6ICdwb2x5bGluZScsXG4gIHJhZGlhbEdyYWRpZW50OiAncmFkaWFsR3JhZGllbnQnLFxuICByZWN0OiAncmVjdCcsXG4gIHN0b3A6ICdzdG9wJyxcbiAgc3ZnOiAnc3ZnJyxcbiAgdGV4dDogJ3RleHQnLFxuICB0c3BhbjogJ3RzcGFuJ1xuXG59LCBjcmVhdGVET01GYWN0b3J5KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdERPTTtcbiJdfQ==
},{"./ReactElement":8,"./ReactElementValidator":9,"./ReactLegacyElement":10,"./mapObject":15,"_process":2}],8:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElement
 */

"use strict";

var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");

var warning = require("./warning");

var RESERVED_PROPS = {
  key: true,
  ref: true
};

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} object
 * @param {string} key
 */
function defineWarningProperty(object, key) {
  Object.defineProperty(object, key, {

    configurable: false,
    enumerable: true,

    get: function() {
      if (!this._store) {
        return null;
      }
      return this._store[key];
    },

    set: function(value) {
      ("production" !== process.env.NODE_ENV ? warning(
        false,
        'Don\'t set the ' + key + ' property of the component. ' +
        'Mutate the existing props object instead.'
      ) : null);
      this._store[key] = value;
    }

  });
}

/**
 * This is updated to true if the membrane is successfully created.
 */
var useMutationMembrane = false;

/**
 * Warn for mutations.
 *
 * @internal
 * @param {object} element
 */
function defineMutationMembrane(prototype) {
  try {
    var pseudoFrozenProperties = {
      props: true
    };
    for (var key in pseudoFrozenProperties) {
      defineWarningProperty(prototype, key);
    }
    useMutationMembrane = true;
  } catch (x) {
    // IE will fail on defineProperty
  }
}

/**
 * Base constructor for all React elements. This is only used to make this
 * work with a dynamic instanceof check. Nothing should live on this prototype.
 *
 * @param {*} type
 * @param {string|object} ref
 * @param {*} key
 * @param {*} props
 * @internal
 */
var ReactElement = function(type, key, ref, owner, context, props) {
  // Built-in properties that belong on the element
  this.type = type;
  this.key = key;
  this.ref = ref;

  // Record the component responsible for creating this element.
  this._owner = owner;

  // TODO: Deprecate withContext, and then the context becomes accessible
  // through the owner.
  this._context = context;

  if ("production" !== process.env.NODE_ENV) {
    // The validation flag and props are currently mutative. We put them on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    this._store = { validated: false, props: props };

    // We're not allowed to set props directly on the object so we early
    // return and rely on the prototype membrane to forward to the backing
    // store.
    if (useMutationMembrane) {
      Object.freeze(this);
      return;
    }
  }

  this.props = props;
};

// We intentionally don't expose the function on the constructor property.
// ReactElement should be indistinguishable from a plain object.
ReactElement.prototype = {
  _isReactElement: true
};

if ("production" !== process.env.NODE_ENV) {
  defineMutationMembrane(ReactElement.prototype);
}

ReactElement.createElement = function(type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref;
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(
        config.key !== null,
        'createElement(...): Encountered component with a `key` of null. In ' +
        'a future version, this will be treated as equivalent to the string ' +
        '\'null\'; instead, provide an explicit key or use undefined.'
      ) : null);
    }
    // TODO: Change this back to `config.key === undefined`
    key = config.key == null ? null : '' + config.key;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return new ReactElement(
    type,
    key,
    ref,
    ReactCurrentOwner.current,
    ReactContext.current,
    props
  );
};

ReactElement.createFactory = function(type) {
  var factory = ReactElement.createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. <Foo />.type === Foo.type.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceProps = function(oldElement, newProps) {
  var newElement = new ReactElement(
    oldElement.type,
    oldElement.key,
    oldElement.ref,
    oldElement._owner,
    oldElement._context,
    newProps
  );

  if ("production" !== process.env.NODE_ENV) {
    // If the key on the original is valid, then the clone is valid
    newElement._store.validated = oldElement._store.validated;
  }
  return newElement;
};

/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid component.
 * @final
 */
ReactElement.isValidElement = function(object) {
  // ReactTestUtils is often used outside of beforeEach where as React is
  // within it. This leads to two different instances of React on the same
  // page. To identify a element from a different React instance we use
  // a flag instead of an instanceof check.
  var isElement = !!(object && object._isReactElement);
  // if (isElement && !(object instanceof ReactElement)) {
  // This is an indicator that you're using multiple versions of React at the
  // same time. This will screw with ownership and stuff. Fix it, please.
  // TODO: We could possibly warn here.
  // }
  return isElement;
};

module.exports = ReactElement;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgUmVhY3RFbGVtZW50XG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBSZWFjdENvbnRleHQgPSByZXF1aXJlKFwiLi9SZWFjdENvbnRleHRcIik7XG52YXIgUmVhY3RDdXJyZW50T3duZXIgPSByZXF1aXJlKFwiLi9SZWFjdEN1cnJlbnRPd25lclwiKTtcblxudmFyIHdhcm5pbmcgPSByZXF1aXJlKFwiLi93YXJuaW5nXCIpO1xuXG52YXIgUkVTRVJWRURfUFJPUFMgPSB7XG4gIGtleTogdHJ1ZSxcbiAgcmVmOiB0cnVlXG59O1xuXG4vKipcbiAqIFdhcm4gZm9yIG11dGF0aW9ucy5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqL1xuZnVuY3Rpb24gZGVmaW5lV2FybmluZ1Byb3BlcnR5KG9iamVjdCwga2V5KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIGtleSwge1xuXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5fc3RvcmUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc3RvcmVba2V5XTtcbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IHdhcm5pbmcoXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnRG9uXFwndCBzZXQgdGhlICcgKyBrZXkgKyAnIHByb3BlcnR5IG9mIHRoZSBjb21wb25lbnQuICcgK1xuICAgICAgICAnTXV0YXRlIHRoZSBleGlzdGluZyBwcm9wcyBvYmplY3QgaW5zdGVhZC4nXG4gICAgICApIDogbnVsbCk7XG4gICAgICB0aGlzLl9zdG9yZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gIH0pO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgdXBkYXRlZCB0byB0cnVlIGlmIHRoZSBtZW1icmFuZSBpcyBzdWNjZXNzZnVsbHkgY3JlYXRlZC5cbiAqL1xudmFyIHVzZU11dGF0aW9uTWVtYnJhbmUgPSBmYWxzZTtcblxuLyoqXG4gKiBXYXJuIGZvciBtdXRhdGlvbnMuXG4gKlxuICogQGludGVybmFsXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICovXG5mdW5jdGlvbiBkZWZpbmVNdXRhdGlvbk1lbWJyYW5lKHByb3RvdHlwZSkge1xuICB0cnkge1xuICAgIHZhciBwc2V1ZG9Gcm96ZW5Qcm9wZXJ0aWVzID0ge1xuICAgICAgcHJvcHM6IHRydWVcbiAgICB9O1xuICAgIGZvciAodmFyIGtleSBpbiBwc2V1ZG9Gcm96ZW5Qcm9wZXJ0aWVzKSB7XG4gICAgICBkZWZpbmVXYXJuaW5nUHJvcGVydHkocHJvdG90eXBlLCBrZXkpO1xuICAgIH1cbiAgICB1c2VNdXRhdGlvbk1lbWJyYW5lID0gdHJ1ZTtcbiAgfSBjYXRjaCAoeCkge1xuICAgIC8vIElFIHdpbGwgZmFpbCBvbiBkZWZpbmVQcm9wZXJ0eVxuICB9XG59XG5cbi8qKlxuICogQmFzZSBjb25zdHJ1Y3RvciBmb3IgYWxsIFJlYWN0IGVsZW1lbnRzLiBUaGlzIGlzIG9ubHkgdXNlZCB0byBtYWtlIHRoaXNcbiAqIHdvcmsgd2l0aCBhIGR5bmFtaWMgaW5zdGFuY2VvZiBjaGVjay4gTm90aGluZyBzaG91bGQgbGl2ZSBvbiB0aGlzIHByb3RvdHlwZS5cbiAqXG4gKiBAcGFyYW0geyp9IHR5cGVcbiAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gcmVmXG4gKiBAcGFyYW0geyp9IGtleVxuICogQHBhcmFtIHsqfSBwcm9wc1xuICogQGludGVybmFsXG4gKi9cbnZhciBSZWFjdEVsZW1lbnQgPSBmdW5jdGlvbih0eXBlLCBrZXksIHJlZiwgb3duZXIsIGNvbnRleHQsIHByb3BzKSB7XG4gIC8vIEJ1aWx0LWluIHByb3BlcnRpZXMgdGhhdCBiZWxvbmcgb24gdGhlIGVsZW1lbnRcbiAgdGhpcy50eXBlID0gdHlwZTtcbiAgdGhpcy5rZXkgPSBrZXk7XG4gIHRoaXMucmVmID0gcmVmO1xuXG4gIC8vIFJlY29yZCB0aGUgY29tcG9uZW50IHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyB0aGlzIGVsZW1lbnQuXG4gIHRoaXMuX293bmVyID0gb3duZXI7XG5cbiAgLy8gVE9ETzogRGVwcmVjYXRlIHdpdGhDb250ZXh0LCBhbmQgdGhlbiB0aGUgY29udGV4dCBiZWNvbWVzIGFjY2Vzc2libGVcbiAgLy8gdGhyb3VnaCB0aGUgb3duZXIuXG4gIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuXG4gIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAvLyBUaGUgdmFsaWRhdGlvbiBmbGFnIGFuZCBwcm9wcyBhcmUgY3VycmVudGx5IG11dGF0aXZlLiBXZSBwdXQgdGhlbSBvblxuICAgIC8vIGFuIGV4dGVybmFsIGJhY2tpbmcgc3RvcmUgc28gdGhhdCB3ZSBjYW4gZnJlZXplIHRoZSB3aG9sZSBvYmplY3QuXG4gICAgLy8gVGhpcyBjYW4gYmUgcmVwbGFjZWQgd2l0aCBhIFdlYWtNYXAgb25jZSB0aGV5IGFyZSBpbXBsZW1lbnRlZCBpblxuICAgIC8vIGNvbW1vbmx5IHVzZWQgZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnRzLlxuICAgIHRoaXMuX3N0b3JlID0geyB2YWxpZGF0ZWQ6IGZhbHNlLCBwcm9wczogcHJvcHMgfTtcblxuICAgIC8vIFdlJ3JlIG5vdCBhbGxvd2VkIHRvIHNldCBwcm9wcyBkaXJlY3RseSBvbiB0aGUgb2JqZWN0IHNvIHdlIGVhcmx5XG4gICAgLy8gcmV0dXJuIGFuZCByZWx5IG9uIHRoZSBwcm90b3R5cGUgbWVtYnJhbmUgdG8gZm9yd2FyZCB0byB0aGUgYmFja2luZ1xuICAgIC8vIHN0b3JlLlxuICAgIGlmICh1c2VNdXRhdGlvbk1lbWJyYW5lKSB7XG4gICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucHJvcHMgPSBwcm9wcztcbn07XG5cbi8vIFdlIGludGVudGlvbmFsbHkgZG9uJ3QgZXhwb3NlIHRoZSBmdW5jdGlvbiBvbiB0aGUgY29uc3RydWN0b3IgcHJvcGVydHkuXG4vLyBSZWFjdEVsZW1lbnQgc2hvdWxkIGJlIGluZGlzdGluZ3Vpc2hhYmxlIGZyb20gYSBwbGFpbiBvYmplY3QuXG5SZWFjdEVsZW1lbnQucHJvdG90eXBlID0ge1xuICBfaXNSZWFjdEVsZW1lbnQ6IHRydWVcbn07XG5cbmlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgZGVmaW5lTXV0YXRpb25NZW1icmFuZShSZWFjdEVsZW1lbnQucHJvdG90eXBlKTtcbn1cblxuUmVhY3RFbGVtZW50LmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbih0eXBlLCBjb25maWcsIGNoaWxkcmVuKSB7XG4gIHZhciBwcm9wTmFtZTtcblxuICAvLyBSZXNlcnZlZCBuYW1lcyBhcmUgZXh0cmFjdGVkXG4gIHZhciBwcm9wcyA9IHt9O1xuXG4gIHZhciBrZXkgPSBudWxsO1xuICB2YXIgcmVmID0gbnVsbDtcblxuICBpZiAoY29uZmlnICE9IG51bGwpIHtcbiAgICByZWYgPSBjb25maWcucmVmID09PSB1bmRlZmluZWQgPyBudWxsIDogY29uZmlnLnJlZjtcbiAgICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICAgICAgY29uZmlnLmtleSAhPT0gbnVsbCxcbiAgICAgICAgJ2NyZWF0ZUVsZW1lbnQoLi4uKTogRW5jb3VudGVyZWQgY29tcG9uZW50IHdpdGggYSBga2V5YCBvZiBudWxsLiBJbiAnICtcbiAgICAgICAgJ2EgZnV0dXJlIHZlcnNpb24sIHRoaXMgd2lsbCBiZSB0cmVhdGVkIGFzIGVxdWl2YWxlbnQgdG8gdGhlIHN0cmluZyAnICtcbiAgICAgICAgJ1xcJ251bGxcXCc7IGluc3RlYWQsIHByb3ZpZGUgYW4gZXhwbGljaXQga2V5IG9yIHVzZSB1bmRlZmluZWQuJ1xuICAgICAgKSA6IG51bGwpO1xuICAgIH1cbiAgICAvLyBUT0RPOiBDaGFuZ2UgdGhpcyBiYWNrIHRvIGBjb25maWcua2V5ID09PSB1bmRlZmluZWRgXG4gICAga2V5ID0gY29uZmlnLmtleSA9PSBudWxsID8gbnVsbCA6ICcnICsgY29uZmlnLmtleTtcbiAgICAvLyBSZW1haW5pbmcgcHJvcGVydGllcyBhcmUgYWRkZWQgdG8gYSBuZXcgcHJvcHMgb2JqZWN0XG4gICAgZm9yIChwcm9wTmFtZSBpbiBjb25maWcpIHtcbiAgICAgIGlmIChjb25maWcuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpICYmXG4gICAgICAgICAgIVJFU0VSVkVEX1BST1BTLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICBwcm9wc1twcm9wTmFtZV0gPSBjb25maWdbcHJvcE5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENoaWxkcmVuIGNhbiBiZSBtb3JlIHRoYW4gb25lIGFyZ3VtZW50LCBhbmQgdGhvc2UgYXJlIHRyYW5zZmVycmVkIG9udG9cbiAgLy8gdGhlIG5ld2x5IGFsbG9jYXRlZCBwcm9wcyBvYmplY3QuXG4gIHZhciBjaGlsZHJlbkxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGggLSAyO1xuICBpZiAoY2hpbGRyZW5MZW5ndGggPT09IDEpIHtcbiAgICBwcm9wcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9IGVsc2UgaWYgKGNoaWxkcmVuTGVuZ3RoID4gMSkge1xuICAgIHZhciBjaGlsZEFycmF5ID0gQXJyYXkoY2hpbGRyZW5MZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW5MZW5ndGg7IGkrKykge1xuICAgICAgY2hpbGRBcnJheVtpXSA9IGFyZ3VtZW50c1tpICsgMl07XG4gICAgfVxuICAgIHByb3BzLmNoaWxkcmVuID0gY2hpbGRBcnJheTtcbiAgfVxuXG4gIC8vIFJlc29sdmUgZGVmYXVsdCBwcm9wc1xuICBpZiAodHlwZSAmJiB0eXBlLmRlZmF1bHRQcm9wcykge1xuICAgIHZhciBkZWZhdWx0UHJvcHMgPSB0eXBlLmRlZmF1bHRQcm9wcztcbiAgICBmb3IgKHByb3BOYW1lIGluIGRlZmF1bHRQcm9wcykge1xuICAgICAgaWYgKHR5cGVvZiBwcm9wc1twcm9wTmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGRlZmF1bHRQcm9wc1twcm9wTmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWFjdEVsZW1lbnQoXG4gICAgdHlwZSxcbiAgICBrZXksXG4gICAgcmVmLFxuICAgIFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQsXG4gICAgUmVhY3RDb250ZXh0LmN1cnJlbnQsXG4gICAgcHJvcHNcbiAgKTtcbn07XG5cblJlYWN0RWxlbWVudC5jcmVhdGVGYWN0b3J5ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZmFjdG9yeSA9IFJlYWN0RWxlbWVudC5jcmVhdGVFbGVtZW50LmJpbmQobnVsbCwgdHlwZSk7XG4gIC8vIEV4cG9zZSB0aGUgdHlwZSBvbiB0aGUgZmFjdG9yeSBhbmQgdGhlIHByb3RvdHlwZSBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyBlYXNpbHkgYWNjZXNzZWQgb24gZWxlbWVudHMuIEUuZy4gPEZvbyAvPi50eXBlID09PSBGb28udHlwZS5cbiAgLy8gVGhpcyBzaG91bGQgbm90IGJlIG5hbWVkIGBjb25zdHJ1Y3RvcmAgc2luY2UgdGhpcyBtYXkgbm90IGJlIHRoZSBmdW5jdGlvblxuICAvLyB0aGF0IGNyZWF0ZWQgdGhlIGVsZW1lbnQsIGFuZCBpdCBtYXkgbm90IGV2ZW4gYmUgYSBjb25zdHJ1Y3Rvci5cbiAgZmFjdG9yeS50eXBlID0gdHlwZTtcbiAgcmV0dXJuIGZhY3Rvcnk7XG59O1xuXG5SZWFjdEVsZW1lbnQuY2xvbmVBbmRSZXBsYWNlUHJvcHMgPSBmdW5jdGlvbihvbGRFbGVtZW50LCBuZXdQcm9wcykge1xuICB2YXIgbmV3RWxlbWVudCA9IG5ldyBSZWFjdEVsZW1lbnQoXG4gICAgb2xkRWxlbWVudC50eXBlLFxuICAgIG9sZEVsZW1lbnQua2V5LFxuICAgIG9sZEVsZW1lbnQucmVmLFxuICAgIG9sZEVsZW1lbnQuX293bmVyLFxuICAgIG9sZEVsZW1lbnQuX2NvbnRleHQsXG4gICAgbmV3UHJvcHNcbiAgKTtcblxuICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgLy8gSWYgdGhlIGtleSBvbiB0aGUgb3JpZ2luYWwgaXMgdmFsaWQsIHRoZW4gdGhlIGNsb25lIGlzIHZhbGlkXG4gICAgbmV3RWxlbWVudC5fc3RvcmUudmFsaWRhdGVkID0gb2xkRWxlbWVudC5fc3RvcmUudmFsaWRhdGVkO1xuICB9XG4gIHJldHVybiBuZXdFbGVtZW50O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gez9vYmplY3R9IG9iamVjdFxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBgb2JqZWN0YCBpcyBhIHZhbGlkIGNvbXBvbmVudC5cbiAqIEBmaW5hbFxuICovXG5SZWFjdEVsZW1lbnQuaXNWYWxpZEVsZW1lbnQgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgLy8gUmVhY3RUZXN0VXRpbHMgaXMgb2Z0ZW4gdXNlZCBvdXRzaWRlIG9mIGJlZm9yZUVhY2ggd2hlcmUgYXMgUmVhY3QgaXNcbiAgLy8gd2l0aGluIGl0LiBUaGlzIGxlYWRzIHRvIHR3byBkaWZmZXJlbnQgaW5zdGFuY2VzIG9mIFJlYWN0IG9uIHRoZSBzYW1lXG4gIC8vIHBhZ2UuIFRvIGlkZW50aWZ5IGEgZWxlbWVudCBmcm9tIGEgZGlmZmVyZW50IFJlYWN0IGluc3RhbmNlIHdlIHVzZVxuICAvLyBhIGZsYWcgaW5zdGVhZCBvZiBhbiBpbnN0YW5jZW9mIGNoZWNrLlxuICB2YXIgaXNFbGVtZW50ID0gISEob2JqZWN0ICYmIG9iamVjdC5faXNSZWFjdEVsZW1lbnQpO1xuICAvLyBpZiAoaXNFbGVtZW50ICYmICEob2JqZWN0IGluc3RhbmNlb2YgUmVhY3RFbGVtZW50KSkge1xuICAvLyBUaGlzIGlzIGFuIGluZGljYXRvciB0aGF0IHlvdSdyZSB1c2luZyBtdWx0aXBsZSB2ZXJzaW9ucyBvZiBSZWFjdCBhdCB0aGVcbiAgLy8gc2FtZSB0aW1lLiBUaGlzIHdpbGwgc2NyZXcgd2l0aCBvd25lcnNoaXAgYW5kIHN0dWZmLiBGaXggaXQsIHBsZWFzZS5cbiAgLy8gVE9ETzogV2UgY291bGQgcG9zc2libHkgd2FybiBoZXJlLlxuICAvLyB9XG4gIHJldHVybiBpc0VsZW1lbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0RWxlbWVudDtcbiJdfQ==
},{"./ReactContext":5,"./ReactCurrentOwner":6,"./warning":17,"_process":2}],9:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElementValidator
 */

/**
 * ReactElementValidator provides a wrapper around a element factory
 * which validates the props passed to the element. This is intended to be
 * used only in DEV and could be replaced by a static type checker for languages
 * that support it.
 */

"use strict";

var ReactElement = require("./ReactElement");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactCurrentOwner = require("./ReactCurrentOwner");

var monitorCodeUse = require("./monitorCodeUse");
var warning = require("./warning");

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */
var ownerHasKeyUseWarning = {
  'react_key_warning': {},
  'react_numeric_key_warning': {}
};
var ownerHasMonitoredObjectMap = {};

var loggedTypeFailures = {};

var NUMERIC_PROPERTY_REGEX = /^\d+$/;

/**
 * Gets the current owner's displayName for use in warnings.
 *
 * @internal
 * @return {?string} Display name or undefined
 */
function getCurrentOwnerDisplayName() {
  var current = ReactCurrentOwner.current;
  return current && current.constructor.displayName || undefined;
}

/**
 * Warn if the component doesn't have an explicit key assigned to it.
 * This component is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it.
 *
 * @internal
 * @param {ReactComponent} component Component that requires a key.
 * @param {*} parentType component's parent's type.
 */
function validateExplicitKey(component, parentType) {
  if (component._store.validated || component.key != null) {
    return;
  }
  component._store.validated = true;

  warnAndMonitorForKeyUse(
    'react_key_warning',
    'Each child in an array should have a unique "key" prop.',
    component,
    parentType
  );
}

/**
 * Warn if the key is being defined as an object property but has an incorrect
 * value.
 *
 * @internal
 * @param {string} name Property name of the key.
 * @param {ReactComponent} component Component that requires a key.
 * @param {*} parentType component's parent's type.
 */
function validatePropertyKey(name, component, parentType) {
  if (!NUMERIC_PROPERTY_REGEX.test(name)) {
    return;
  }
  warnAndMonitorForKeyUse(
    'react_numeric_key_warning',
    'Child objects should have non-numeric keys so ordering is preserved.',
    component,
    parentType
  );
}

/**
 * Shared warning and monitoring code for the key warnings.
 *
 * @internal
 * @param {string} warningID The id used when logging.
 * @param {string} message The base warning that gets output.
 * @param {ReactComponent} component Component that requires a key.
 * @param {*} parentType component's parent's type.
 */
function warnAndMonitorForKeyUse(warningID, message, component, parentType) {
  var ownerName = getCurrentOwnerDisplayName();
  var parentName = parentType.displayName;

  var useName = ownerName || parentName;
  var memoizer = ownerHasKeyUseWarning[warningID];
  if (memoizer.hasOwnProperty(useName)) {
    return;
  }
  memoizer[useName] = true;

  message += ownerName ?
    (" Check the render method of " + ownerName + ".") :
    (" Check the renderComponent call using <" + parentName + ">.");

  // Usually the current owner is the offender, but if it accepts children as a
  // property, it may be the creator of the child that's responsible for
  // assigning it a key.
  var childOwnerName = null;
  if (component._owner && component._owner !== ReactCurrentOwner.current) {
    // Name of the component that originally created this child.
    childOwnerName = component._owner.constructor.displayName;

    message += (" It was passed a child from " + childOwnerName + ".");
  }

  message += ' See http://fb.me/react-warning-keys for more information.';
  monitorCodeUse(warningID, {
    component: useName,
    componentOwner: childOwnerName
  });
  console.warn(message);
}

/**
 * Log that we're using an object map. We're considering deprecating this
 * feature and replace it with proper Map and ImmutableMap data structures.
 *
 * @internal
 */
function monitorUseOfObjectMap() {
  var currentName = getCurrentOwnerDisplayName() || '';
  if (ownerHasMonitoredObjectMap.hasOwnProperty(currentName)) {
    return;
  }
  ownerHasMonitoredObjectMap[currentName] = true;
  monitorCodeUse('react_object_map_children');
}

/**
 * Ensure that every component either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {*} component Statically passed child of any type.
 * @param {*} parentType component's parent's type.
 * @return {boolean}
 */
function validateChildKeys(component, parentType) {
  if (Array.isArray(component)) {
    for (var i = 0; i < component.length; i++) {
      var child = component[i];
      if (ReactElement.isValidElement(child)) {
        validateExplicitKey(child, parentType);
      }
    }
  } else if (ReactElement.isValidElement(component)) {
    // This component was passed in a valid location.
    component._store.validated = true;
  } else if (component && typeof component === 'object') {
    monitorUseOfObjectMap();
    for (var name in component) {
      validatePropertyKey(name, component[name], parentType);
    }
  }
}

/**
 * Assert that the props are valid
 *
 * @param {string} componentName Name of the component for error messages.
 * @param {object} propTypes Map of prop name to a ReactPropType
 * @param {object} props
 * @param {string} location e.g. "prop", "context", "child context"
 * @private
 */
function checkPropTypes(componentName, propTypes, props, location) {
  for (var propName in propTypes) {
    if (propTypes.hasOwnProperty(propName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        error = propTypes[propName](props, propName, componentName, location);
      } catch (ex) {
        error = ex;
      }
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;
        // This will soon use the warning module
        monitorCodeUse(
          'react_failed_descriptor_type_check',
          { message: error.message }
        );
      }
    }
  }
}

var ReactElementValidator = {

  createElement: function(type, props, children) {
    // We warn in this case but don't throw. We expect the element creation to
    // succeed and there will likely be errors in render.
    ("production" !== process.env.NODE_ENV ? warning(
      type != null,
      'React.createElement: type should not be null or undefined. It should ' +
        'be a string (for DOM elements) or a ReactClass (for composite ' +
        'components).'
    ) : null);

    var element = ReactElement.createElement.apply(this, arguments);

    // The result can be nullish if a mock or a custom function is used.
    // TODO: Drop this when these are no longer allowed as the type argument.
    if (element == null) {
      return element;
    }

    for (var i = 2; i < arguments.length; i++) {
      validateChildKeys(arguments[i], type);
    }

    if (type) {
      var name = type.displayName;
      if (type.propTypes) {
        checkPropTypes(
          name,
          type.propTypes,
          element.props,
          ReactPropTypeLocations.prop
        );
      }
      if (type.contextTypes) {
        checkPropTypes(
          name,
          type.contextTypes,
          element._context,
          ReactPropTypeLocations.context
        );
      }
    }
    return element;
  },

  createFactory: function(type) {
    var validatedFactory = ReactElementValidator.createElement.bind(
      null,
      type
    );
    validatedFactory.type = type;
    return validatedFactory;
  }

};

module.exports = ReactElementValidator;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RFbGVtZW50VmFsaWRhdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgUmVhY3RFbGVtZW50VmFsaWRhdG9yXG4gKi9cblxuLyoqXG4gKiBSZWFjdEVsZW1lbnRWYWxpZGF0b3IgcHJvdmlkZXMgYSB3cmFwcGVyIGFyb3VuZCBhIGVsZW1lbnQgZmFjdG9yeVxuICogd2hpY2ggdmFsaWRhdGVzIHRoZSBwcm9wcyBwYXNzZWQgdG8gdGhlIGVsZW1lbnQuIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmVcbiAqIHVzZWQgb25seSBpbiBERVYgYW5kIGNvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc3RhdGljIHR5cGUgY2hlY2tlciBmb3IgbGFuZ3VhZ2VzXG4gKiB0aGF0IHN1cHBvcnQgaXQuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBSZWFjdEVsZW1lbnQgPSByZXF1aXJlKFwiLi9SZWFjdEVsZW1lbnRcIik7XG52YXIgUmVhY3RQcm9wVHlwZUxvY2F0aW9ucyA9IHJlcXVpcmUoXCIuL1JlYWN0UHJvcFR5cGVMb2NhdGlvbnNcIik7XG52YXIgUmVhY3RDdXJyZW50T3duZXIgPSByZXF1aXJlKFwiLi9SZWFjdEN1cnJlbnRPd25lclwiKTtcblxudmFyIG1vbml0b3JDb2RlVXNlID0gcmVxdWlyZShcIi4vbW9uaXRvckNvZGVVc2VcIik7XG52YXIgd2FybmluZyA9IHJlcXVpcmUoXCIuL3dhcm5pbmdcIik7XG5cbi8qKlxuICogV2FybiBpZiB0aGVyZSdzIG5vIGtleSBleHBsaWNpdGx5IHNldCBvbiBkeW5hbWljIGFycmF5cyBvZiBjaGlsZHJlbiBvclxuICogb2JqZWN0IGtleXMgYXJlIG5vdCB2YWxpZC4gVGhpcyBhbGxvd3MgdXMgdG8ga2VlcCB0cmFjayBvZiBjaGlsZHJlbiBiZXR3ZWVuXG4gKiB1cGRhdGVzLlxuICovXG52YXIgb3duZXJIYXNLZXlVc2VXYXJuaW5nID0ge1xuICAncmVhY3Rfa2V5X3dhcm5pbmcnOiB7fSxcbiAgJ3JlYWN0X251bWVyaWNfa2V5X3dhcm5pbmcnOiB7fVxufTtcbnZhciBvd25lckhhc01vbml0b3JlZE9iamVjdE1hcCA9IHt9O1xuXG52YXIgbG9nZ2VkVHlwZUZhaWx1cmVzID0ge307XG5cbnZhciBOVU1FUklDX1BST1BFUlRZX1JFR0VYID0gL15cXGQrJC87XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudCBvd25lcidzIGRpc3BsYXlOYW1lIGZvciB1c2UgaW4gd2FybmluZ3MuXG4gKlxuICogQGludGVybmFsXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBEaXNwbGF5IG5hbWUgb3IgdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGdldEN1cnJlbnRPd25lckRpc3BsYXlOYW1lKCkge1xuICB2YXIgY3VycmVudCA9IFJlYWN0Q3VycmVudE93bmVyLmN1cnJlbnQ7XG4gIHJldHVybiBjdXJyZW50ICYmIGN1cnJlbnQuY29uc3RydWN0b3IuZGlzcGxheU5hbWUgfHwgdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFdhcm4gaWYgdGhlIGNvbXBvbmVudCBkb2Vzbid0IGhhdmUgYW4gZXhwbGljaXQga2V5IGFzc2lnbmVkIHRvIGl0LlxuICogVGhpcyBjb21wb25lbnQgaXMgaW4gYW4gYXJyYXkuIFRoZSBhcnJheSBjb3VsZCBncm93IGFuZCBzaHJpbmsgb3IgYmVcbiAqIHJlb3JkZXJlZC4gQWxsIGNoaWxkcmVuIHRoYXQgaGF2ZW4ndCBhbHJlYWR5IGJlZW4gdmFsaWRhdGVkIGFyZSByZXF1aXJlZCB0b1xuICogaGF2ZSBhIFwia2V5XCIgcHJvcGVydHkgYXNzaWduZWQgdG8gaXQuXG4gKlxuICogQGludGVybmFsXG4gKiBAcGFyYW0ge1JlYWN0Q29tcG9uZW50fSBjb21wb25lbnQgQ29tcG9uZW50IHRoYXQgcmVxdWlyZXMgYSBrZXkuXG4gKiBAcGFyYW0geyp9IHBhcmVudFR5cGUgY29tcG9uZW50J3MgcGFyZW50J3MgdHlwZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVFeHBsaWNpdEtleShjb21wb25lbnQsIHBhcmVudFR5cGUpIHtcbiAgaWYgKGNvbXBvbmVudC5fc3RvcmUudmFsaWRhdGVkIHx8IGNvbXBvbmVudC5rZXkgIT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb21wb25lbnQuX3N0b3JlLnZhbGlkYXRlZCA9IHRydWU7XG5cbiAgd2FybkFuZE1vbml0b3JGb3JLZXlVc2UoXG4gICAgJ3JlYWN0X2tleV93YXJuaW5nJyxcbiAgICAnRWFjaCBjaGlsZCBpbiBhbiBhcnJheSBzaG91bGQgaGF2ZSBhIHVuaXF1ZSBcImtleVwiIHByb3AuJyxcbiAgICBjb21wb25lbnQsXG4gICAgcGFyZW50VHlwZVxuICApO1xufVxuXG4vKipcbiAqIFdhcm4gaWYgdGhlIGtleSBpcyBiZWluZyBkZWZpbmVkIGFzIGFuIG9iamVjdCBwcm9wZXJ0eSBidXQgaGFzIGFuIGluY29ycmVjdFxuICogdmFsdWUuXG4gKlxuICogQGludGVybmFsXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBQcm9wZXJ0eSBuYW1lIG9mIHRoZSBrZXkuXG4gKiBAcGFyYW0ge1JlYWN0Q29tcG9uZW50fSBjb21wb25lbnQgQ29tcG9uZW50IHRoYXQgcmVxdWlyZXMgYSBrZXkuXG4gKiBAcGFyYW0geyp9IHBhcmVudFR5cGUgY29tcG9uZW50J3MgcGFyZW50J3MgdHlwZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVQcm9wZXJ0eUtleShuYW1lLCBjb21wb25lbnQsIHBhcmVudFR5cGUpIHtcbiAgaWYgKCFOVU1FUklDX1BST1BFUlRZX1JFR0VYLnRlc3QobmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgd2FybkFuZE1vbml0b3JGb3JLZXlVc2UoXG4gICAgJ3JlYWN0X251bWVyaWNfa2V5X3dhcm5pbmcnLFxuICAgICdDaGlsZCBvYmplY3RzIHNob3VsZCBoYXZlIG5vbi1udW1lcmljIGtleXMgc28gb3JkZXJpbmcgaXMgcHJlc2VydmVkLicsXG4gICAgY29tcG9uZW50LFxuICAgIHBhcmVudFR5cGVcbiAgKTtcbn1cblxuLyoqXG4gKiBTaGFyZWQgd2FybmluZyBhbmQgbW9uaXRvcmluZyBjb2RlIGZvciB0aGUga2V5IHdhcm5pbmdzLlxuICpcbiAqIEBpbnRlcm5hbFxuICogQHBhcmFtIHtzdHJpbmd9IHdhcm5pbmdJRCBUaGUgaWQgdXNlZCB3aGVuIGxvZ2dpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBUaGUgYmFzZSB3YXJuaW5nIHRoYXQgZ2V0cyBvdXRwdXQuXG4gKiBAcGFyYW0ge1JlYWN0Q29tcG9uZW50fSBjb21wb25lbnQgQ29tcG9uZW50IHRoYXQgcmVxdWlyZXMgYSBrZXkuXG4gKiBAcGFyYW0geyp9IHBhcmVudFR5cGUgY29tcG9uZW50J3MgcGFyZW50J3MgdHlwZS5cbiAqL1xuZnVuY3Rpb24gd2FybkFuZE1vbml0b3JGb3JLZXlVc2Uod2FybmluZ0lELCBtZXNzYWdlLCBjb21wb25lbnQsIHBhcmVudFR5cGUpIHtcbiAgdmFyIG93bmVyTmFtZSA9IGdldEN1cnJlbnRPd25lckRpc3BsYXlOYW1lKCk7XG4gIHZhciBwYXJlbnROYW1lID0gcGFyZW50VHlwZS5kaXNwbGF5TmFtZTtcblxuICB2YXIgdXNlTmFtZSA9IG93bmVyTmFtZSB8fCBwYXJlbnROYW1lO1xuICB2YXIgbWVtb2l6ZXIgPSBvd25lckhhc0tleVVzZVdhcm5pbmdbd2FybmluZ0lEXTtcbiAgaWYgKG1lbW9pemVyLmhhc093blByb3BlcnR5KHVzZU5hbWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIG1lbW9pemVyW3VzZU5hbWVdID0gdHJ1ZTtcblxuICBtZXNzYWdlICs9IG93bmVyTmFtZSA/XG4gICAgKFwiIENoZWNrIHRoZSByZW5kZXIgbWV0aG9kIG9mIFwiICsgb3duZXJOYW1lICsgXCIuXCIpIDpcbiAgICAoXCIgQ2hlY2sgdGhlIHJlbmRlckNvbXBvbmVudCBjYWxsIHVzaW5nIDxcIiArIHBhcmVudE5hbWUgKyBcIj4uXCIpO1xuXG4gIC8vIFVzdWFsbHkgdGhlIGN1cnJlbnQgb3duZXIgaXMgdGhlIG9mZmVuZGVyLCBidXQgaWYgaXQgYWNjZXB0cyBjaGlsZHJlbiBhcyBhXG4gIC8vIHByb3BlcnR5LCBpdCBtYXkgYmUgdGhlIGNyZWF0b3Igb2YgdGhlIGNoaWxkIHRoYXQncyByZXNwb25zaWJsZSBmb3JcbiAgLy8gYXNzaWduaW5nIGl0IGEga2V5LlxuICB2YXIgY2hpbGRPd25lck5hbWUgPSBudWxsO1xuICBpZiAoY29tcG9uZW50Ll9vd25lciAmJiBjb21wb25lbnQuX293bmVyICE9PSBSZWFjdEN1cnJlbnRPd25lci5jdXJyZW50KSB7XG4gICAgLy8gTmFtZSBvZiB0aGUgY29tcG9uZW50IHRoYXQgb3JpZ2luYWxseSBjcmVhdGVkIHRoaXMgY2hpbGQuXG4gICAgY2hpbGRPd25lck5hbWUgPSBjb21wb25lbnQuX293bmVyLmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lO1xuXG4gICAgbWVzc2FnZSArPSAoXCIgSXQgd2FzIHBhc3NlZCBhIGNoaWxkIGZyb20gXCIgKyBjaGlsZE93bmVyTmFtZSArIFwiLlwiKTtcbiAgfVxuXG4gIG1lc3NhZ2UgKz0gJyBTZWUgaHR0cDovL2ZiLm1lL3JlYWN0LXdhcm5pbmcta2V5cyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4nO1xuICBtb25pdG9yQ29kZVVzZSh3YXJuaW5nSUQsIHtcbiAgICBjb21wb25lbnQ6IHVzZU5hbWUsXG4gICAgY29tcG9uZW50T3duZXI6IGNoaWxkT3duZXJOYW1lXG4gIH0pO1xuICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG59XG5cbi8qKlxuICogTG9nIHRoYXQgd2UncmUgdXNpbmcgYW4gb2JqZWN0IG1hcC4gV2UncmUgY29uc2lkZXJpbmcgZGVwcmVjYXRpbmcgdGhpc1xuICogZmVhdHVyZSBhbmQgcmVwbGFjZSBpdCB3aXRoIHByb3BlciBNYXAgYW5kIEltbXV0YWJsZU1hcCBkYXRhIHN0cnVjdHVyZXMuXG4gKlxuICogQGludGVybmFsXG4gKi9cbmZ1bmN0aW9uIG1vbml0b3JVc2VPZk9iamVjdE1hcCgpIHtcbiAgdmFyIGN1cnJlbnROYW1lID0gZ2V0Q3VycmVudE93bmVyRGlzcGxheU5hbWUoKSB8fCAnJztcbiAgaWYgKG93bmVySGFzTW9uaXRvcmVkT2JqZWN0TWFwLmhhc093blByb3BlcnR5KGN1cnJlbnROYW1lKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBvd25lckhhc01vbml0b3JlZE9iamVjdE1hcFtjdXJyZW50TmFtZV0gPSB0cnVlO1xuICBtb25pdG9yQ29kZVVzZSgncmVhY3Rfb2JqZWN0X21hcF9jaGlsZHJlbicpO1xufVxuXG4vKipcbiAqIEVuc3VyZSB0aGF0IGV2ZXJ5IGNvbXBvbmVudCBlaXRoZXIgaXMgcGFzc2VkIGluIGEgc3RhdGljIGxvY2F0aW9uLCBpbiBhblxuICogYXJyYXkgd2l0aCBhbiBleHBsaWNpdCBrZXlzIHByb3BlcnR5IGRlZmluZWQsIG9yIGluIGFuIG9iamVjdCBsaXRlcmFsXG4gKiB3aXRoIHZhbGlkIGtleSBwcm9wZXJ0eS5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwYXJhbSB7Kn0gY29tcG9uZW50IFN0YXRpY2FsbHkgcGFzc2VkIGNoaWxkIG9mIGFueSB0eXBlLlxuICogQHBhcmFtIHsqfSBwYXJlbnRUeXBlIGNvbXBvbmVudCdzIHBhcmVudCdzIHR5cGUuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUNoaWxkS2V5cyhjb21wb25lbnQsIHBhcmVudFR5cGUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50KSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29tcG9uZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBjb21wb25lbnRbaV07XG4gICAgICBpZiAoUmVhY3RFbGVtZW50LmlzVmFsaWRFbGVtZW50KGNoaWxkKSkge1xuICAgICAgICB2YWxpZGF0ZUV4cGxpY2l0S2V5KGNoaWxkLCBwYXJlbnRUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoUmVhY3RFbGVtZW50LmlzVmFsaWRFbGVtZW50KGNvbXBvbmVudCkpIHtcbiAgICAvLyBUaGlzIGNvbXBvbmVudCB3YXMgcGFzc2VkIGluIGEgdmFsaWQgbG9jYXRpb24uXG4gICAgY29tcG9uZW50Ll9zdG9yZS52YWxpZGF0ZWQgPSB0cnVlO1xuICB9IGVsc2UgaWYgKGNvbXBvbmVudCAmJiB0eXBlb2YgY29tcG9uZW50ID09PSAnb2JqZWN0Jykge1xuICAgIG1vbml0b3JVc2VPZk9iamVjdE1hcCgpO1xuICAgIGZvciAodmFyIG5hbWUgaW4gY29tcG9uZW50KSB7XG4gICAgICB2YWxpZGF0ZVByb3BlcnR5S2V5KG5hbWUsIGNvbXBvbmVudFtuYW1lXSwgcGFyZW50VHlwZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0IHRoYXQgdGhlIHByb3BzIGFyZSB2YWxpZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21wb25lbnROYW1lIE5hbWUgb2YgdGhlIGNvbXBvbmVudCBmb3IgZXJyb3IgbWVzc2FnZXMuXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcFR5cGVzIE1hcCBvZiBwcm9wIG5hbWUgdG8gYSBSZWFjdFByb3BUeXBlXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHNcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvbiBlLmcuIFwicHJvcFwiLCBcImNvbnRleHRcIiwgXCJjaGlsZCBjb250ZXh0XCJcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNoZWNrUHJvcFR5cGVzKGNvbXBvbmVudE5hbWUsIHByb3BUeXBlcywgcHJvcHMsIGxvY2F0aW9uKSB7XG4gIGZvciAodmFyIHByb3BOYW1lIGluIHByb3BUeXBlcykge1xuICAgIGlmIChwcm9wVHlwZXMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICB2YXIgZXJyb3I7XG4gICAgICAvLyBQcm9wIHR5cGUgdmFsaWRhdGlvbiBtYXkgdGhyb3cuIEluIGNhc2UgdGhleSBkbywgd2UgZG9uJ3Qgd2FudCB0b1xuICAgICAgLy8gZmFpbCB0aGUgcmVuZGVyIHBoYXNlIHdoZXJlIGl0IGRpZG4ndCBmYWlsIGJlZm9yZS4gU28gd2UgbG9nIGl0LlxuICAgICAgLy8gQWZ0ZXIgdGhlc2UgaGF2ZSBiZWVuIGNsZWFuZWQgdXAsIHdlJ2xsIGxldCB0aGVtIHRocm93LlxuICAgICAgdHJ5IHtcbiAgICAgICAgZXJyb3IgPSBwcm9wVHlwZXNbcHJvcE5hbWVdKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24pO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgZXJyb3IgPSBleDtcbiAgICAgIH1cbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmICEoZXJyb3IubWVzc2FnZSBpbiBsb2dnZWRUeXBlRmFpbHVyZXMpKSB7XG4gICAgICAgIC8vIE9ubHkgbW9uaXRvciB0aGlzIGZhaWx1cmUgb25jZSBiZWNhdXNlIHRoZXJlIHRlbmRzIHRvIGJlIGEgbG90IG9mIHRoZVxuICAgICAgICAvLyBzYW1lIGVycm9yLlxuICAgICAgICBsb2dnZWRUeXBlRmFpbHVyZXNbZXJyb3IubWVzc2FnZV0gPSB0cnVlO1xuICAgICAgICAvLyBUaGlzIHdpbGwgc29vbiB1c2UgdGhlIHdhcm5pbmcgbW9kdWxlXG4gICAgICAgIG1vbml0b3JDb2RlVXNlKFxuICAgICAgICAgICdyZWFjdF9mYWlsZWRfZGVzY3JpcHRvcl90eXBlX2NoZWNrJyxcbiAgICAgICAgICB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG52YXIgUmVhY3RFbGVtZW50VmFsaWRhdG9yID0ge1xuXG4gIGNyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uKHR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIC8vIFdlIHdhcm4gaW4gdGhpcyBjYXNlIGJ1dCBkb24ndCB0aHJvdy4gV2UgZXhwZWN0IHRoZSBlbGVtZW50IGNyZWF0aW9uIHRvXG4gICAgLy8gc3VjY2VlZCBhbmQgdGhlcmUgd2lsbCBsaWtlbHkgYmUgZXJyb3JzIGluIHJlbmRlci5cbiAgICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICAgIHR5cGUgIT0gbnVsbCxcbiAgICAgICdSZWFjdC5jcmVhdGVFbGVtZW50OiB0eXBlIHNob3VsZCBub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuIEl0IHNob3VsZCAnICtcbiAgICAgICAgJ2JlIGEgc3RyaW5nIChmb3IgRE9NIGVsZW1lbnRzKSBvciBhIFJlYWN0Q2xhc3MgKGZvciBjb21wb3NpdGUgJyArXG4gICAgICAgICdjb21wb25lbnRzKS4nXG4gICAgKSA6IG51bGwpO1xuXG4gICAgdmFyIGVsZW1lbnQgPSBSZWFjdEVsZW1lbnQuY3JlYXRlRWxlbWVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gVGhlIHJlc3VsdCBjYW4gYmUgbnVsbGlzaCBpZiBhIG1vY2sgb3IgYSBjdXN0b20gZnVuY3Rpb24gaXMgdXNlZC5cbiAgICAvLyBUT0RPOiBEcm9wIHRoaXMgd2hlbiB0aGVzZSBhcmUgbm8gbG9uZ2VyIGFsbG93ZWQgYXMgdGhlIHR5cGUgYXJndW1lbnQuXG4gICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDI7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbGlkYXRlQ2hpbGRLZXlzKGFyZ3VtZW50c1tpXSwgdHlwZSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIHZhciBuYW1lID0gdHlwZS5kaXNwbGF5TmFtZTtcbiAgICAgIGlmICh0eXBlLnByb3BUeXBlcykge1xuICAgICAgICBjaGVja1Byb3BUeXBlcyhcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHR5cGUucHJvcFR5cGVzLFxuICAgICAgICAgIGVsZW1lbnQucHJvcHMsXG4gICAgICAgICAgUmVhY3RQcm9wVHlwZUxvY2F0aW9ucy5wcm9wXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZS5jb250ZXh0VHlwZXMpIHtcbiAgICAgICAgY2hlY2tQcm9wVHlwZXMoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB0eXBlLmNvbnRleHRUeXBlcyxcbiAgICAgICAgICBlbGVtZW50Ll9jb250ZXh0LFxuICAgICAgICAgIFJlYWN0UHJvcFR5cGVMb2NhdGlvbnMuY29udGV4dFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfSxcblxuICBjcmVhdGVGYWN0b3J5OiBmdW5jdGlvbih0eXBlKSB7XG4gICAgdmFyIHZhbGlkYXRlZEZhY3RvcnkgPSBSZWFjdEVsZW1lbnRWYWxpZGF0b3IuY3JlYXRlRWxlbWVudC5iaW5kKFxuICAgICAgbnVsbCxcbiAgICAgIHR5cGVcbiAgICApO1xuICAgIHZhbGlkYXRlZEZhY3RvcnkudHlwZSA9IHR5cGU7XG4gICAgcmV0dXJuIHZhbGlkYXRlZEZhY3Rvcnk7XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdEVsZW1lbnRWYWxpZGF0b3I7XG4iXX0=
},{"./ReactCurrentOwner":6,"./ReactElement":8,"./ReactPropTypeLocations":11,"./monitorCodeUse":16,"./warning":17,"_process":2}],10:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactLegacyElement
 */

"use strict";

var ReactCurrentOwner = require("./ReactCurrentOwner");

var invariant = require("./invariant");
var monitorCodeUse = require("./monitorCodeUse");
var warning = require("./warning");

var legacyFactoryLogs = {};
function warnForLegacyFactoryCall() {
  if (!ReactLegacyElementFactory._isLegacyCallWarningEnabled) {
    return;
  }
  var owner = ReactCurrentOwner.current;
  var name = owner && owner.constructor ? owner.constructor.displayName : '';
  if (!name) {
    name = 'Something';
  }
  if (legacyFactoryLogs.hasOwnProperty(name)) {
    return;
  }
  legacyFactoryLogs[name] = true;
  ("production" !== process.env.NODE_ENV ? warning(
    false,
    name + ' is calling a React component directly. ' +
    'Use a factory or JSX instead. See: http://fb.me/react-legacyfactory'
  ) : null);
  monitorCodeUse('react_legacy_factory_call', { version: 3, name: name });
}

function warnForPlainFunctionType(type) {
  var isReactClass =
    type.prototype &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function';
  if (isReactClass) {
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'Did not expect to get a React class here. Use `Component` instead ' +
      'of `Component.type` or `this.constructor`.'
    ) : null);
  } else {
    if (!type._reactWarnedForThisType) {
      try {
        type._reactWarnedForThisType = true;
      } catch (x) {
        // just incase this is a frozen object or some special object
      }
      monitorCodeUse(
        'react_non_component_in_jsx',
        { version: 3, name: type.name }
      );
    }
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'This JSX uses a plain function. Only React components are ' +
      'valid in React\'s JSX transform.'
    ) : null);
  }
}

function warnForNonLegacyFactory(type) {
  ("production" !== process.env.NODE_ENV ? warning(
    false,
    'Do not pass React.DOM.' + type.type + ' to JSX or createFactory. ' +
    'Use the string "' + type.type + '" instead.'
  ) : null);
}

/**
 * Transfer static properties from the source to the target. Functions are
 * rebound to have this reflect the original source.
 */
function proxyStaticMethods(target, source) {
  if (typeof source !== 'function') {
    return;
  }
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      var value = source[key];
      if (typeof value === 'function') {
        var bound = value.bind(source);
        // Copy any properties defined on the function, such as `isRequired` on
        // a PropTypes validator.
        for (var k in value) {
          if (value.hasOwnProperty(k)) {
            bound[k] = value[k];
          }
        }
        target[key] = bound;
      } else {
        target[key] = value;
      }
    }
  }
}

// We use an object instead of a boolean because booleans are ignored by our
// mocking libraries when these factories gets mocked.
var LEGACY_MARKER = {};
var NON_LEGACY_MARKER = {};

var ReactLegacyElementFactory = {};

ReactLegacyElementFactory.wrapCreateFactory = function(createFactory) {
  var legacyCreateFactory = function(type) {
    if (typeof type !== 'function') {
      // Non-function types cannot be legacy factories
      return createFactory(type);
    }

    if (type.isReactNonLegacyFactory) {
      // This is probably a factory created by ReactDOM we unwrap it to get to
      // the underlying string type. It shouldn't have been passed here so we
      // warn.
      if ("production" !== process.env.NODE_ENV) {
        warnForNonLegacyFactory(type);
      }
      return createFactory(type.type);
    }

    if (type.isReactLegacyFactory) {
      // This is probably a legacy factory created by ReactCompositeComponent.
      // We unwrap it to get to the underlying class.
      return createFactory(type.type);
    }

    if ("production" !== process.env.NODE_ENV) {
      warnForPlainFunctionType(type);
    }

    // Unless it's a legacy factory, then this is probably a plain function,
    // that is expecting to be invoked by JSX. We can just return it as is.
    return type;
  };
  return legacyCreateFactory;
};

ReactLegacyElementFactory.wrapCreateElement = function(createElement) {
  var legacyCreateElement = function(type, props, children) {
    if (typeof type !== 'function') {
      // Non-function types cannot be legacy factories
      return createElement.apply(this, arguments);
    }

    var args;

    if (type.isReactNonLegacyFactory) {
      // This is probably a factory created by ReactDOM we unwrap it to get to
      // the underlying string type. It shouldn't have been passed here so we
      // warn.
      if ("production" !== process.env.NODE_ENV) {
        warnForNonLegacyFactory(type);
      }
      args = Array.prototype.slice.call(arguments, 0);
      args[0] = type.type;
      return createElement.apply(this, args);
    }

    if (type.isReactLegacyFactory) {
      // This is probably a legacy factory created by ReactCompositeComponent.
      // We unwrap it to get to the underlying class.
      if (type._isMockFunction) {
        // If this is a mock function, people will expect it to be called. We
        // will actually call the original mock factory function instead. This
        // future proofs unit testing that assume that these are classes.
        type.type._mockedReactClassConstructor = type;
      }
      args = Array.prototype.slice.call(arguments, 0);
      args[0] = type.type;
      return createElement.apply(this, args);
    }

    if ("production" !== process.env.NODE_ENV) {
      warnForPlainFunctionType(type);
    }

    // This is being called with a plain function we should invoke it
    // immediately as if this was used with legacy JSX.
    return type.apply(null, Array.prototype.slice.call(arguments, 1));
  };
  return legacyCreateElement;
};

ReactLegacyElementFactory.wrapFactory = function(factory) {
  ("production" !== process.env.NODE_ENV ? invariant(
    typeof factory === 'function',
    'This is suppose to accept a element factory'
  ) : invariant(typeof factory === 'function'));
  var legacyElementFactory = function(config, children) {
    // This factory should not be called when JSX is used. Use JSX instead.
    if ("production" !== process.env.NODE_ENV) {
      warnForLegacyFactoryCall();
    }
    return factory.apply(this, arguments);
  };
  proxyStaticMethods(legacyElementFactory, factory.type);
  legacyElementFactory.isReactLegacyFactory = LEGACY_MARKER;
  legacyElementFactory.type = factory.type;
  return legacyElementFactory;
};

// This is used to mark a factory that will remain. E.g. we're allowed to call
// it as a function. However, you're not suppose to pass it to createElement
// or createFactory, so it will warn you if you do.
ReactLegacyElementFactory.markNonLegacyFactory = function(factory) {
  factory.isReactNonLegacyFactory = NON_LEGACY_MARKER;
  return factory;
};

// Checks if a factory function is actually a legacy factory pretending to
// be a class.
ReactLegacyElementFactory.isValidFactory = function(factory) {
  // TODO: This will be removed and moved into a class validator or something.
  return typeof factory === 'function' &&
    factory.isReactLegacyFactory === LEGACY_MARKER;
};

ReactLegacyElementFactory.isValidClass = function(factory) {
  if ("production" !== process.env.NODE_ENV) {
    ("production" !== process.env.NODE_ENV ? warning(
      false,
      'isValidClass is deprecated and will be removed in a future release. ' +
      'Use a more specific validator instead.'
    ) : null);
  }
  return ReactLegacyElementFactory.isValidFactory(factory);
};

ReactLegacyElementFactory._isLegacyCallWarningEnabled = true;

module.exports = ReactLegacyElementFactory;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RMZWdhY3lFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBSZWFjdExlZ2FjeUVsZW1lbnRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFJlYWN0Q3VycmVudE93bmVyID0gcmVxdWlyZShcIi4vUmVhY3RDdXJyZW50T3duZXJcIik7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKFwiLi9pbnZhcmlhbnRcIik7XG52YXIgbW9uaXRvckNvZGVVc2UgPSByZXF1aXJlKFwiLi9tb25pdG9yQ29kZVVzZVwiKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZShcIi4vd2FybmluZ1wiKTtcblxudmFyIGxlZ2FjeUZhY3RvcnlMb2dzID0ge307XG5mdW5jdGlvbiB3YXJuRm9yTGVnYWN5RmFjdG9yeUNhbGwoKSB7XG4gIGlmICghUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5faXNMZWdhY3lDYWxsV2FybmluZ0VuYWJsZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG93bmVyID0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudDtcbiAgdmFyIG5hbWUgPSBvd25lciAmJiBvd25lci5jb25zdHJ1Y3RvciA/IG93bmVyLmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIDogJyc7XG4gIGlmICghbmFtZSkge1xuICAgIG5hbWUgPSAnU29tZXRoaW5nJztcbiAgfVxuICBpZiAobGVnYWN5RmFjdG9yeUxvZ3MuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGVnYWN5RmFjdG9yeUxvZ3NbbmFtZV0gPSB0cnVlO1xuICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICBmYWxzZSxcbiAgICBuYW1lICsgJyBpcyBjYWxsaW5nIGEgUmVhY3QgY29tcG9uZW50IGRpcmVjdGx5LiAnICtcbiAgICAnVXNlIGEgZmFjdG9yeSBvciBKU1ggaW5zdGVhZC4gU2VlOiBodHRwOi8vZmIubWUvcmVhY3QtbGVnYWN5ZmFjdG9yeSdcbiAgKSA6IG51bGwpO1xuICBtb25pdG9yQ29kZVVzZSgncmVhY3RfbGVnYWN5X2ZhY3RvcnlfY2FsbCcsIHsgdmVyc2lvbjogMywgbmFtZTogbmFtZSB9KTtcbn1cblxuZnVuY3Rpb24gd2FybkZvclBsYWluRnVuY3Rpb25UeXBlKHR5cGUpIHtcbiAgdmFyIGlzUmVhY3RDbGFzcyA9XG4gICAgdHlwZS5wcm90b3R5cGUgJiZcbiAgICB0eXBlb2YgdHlwZS5wcm90b3R5cGUubW91bnRDb21wb25lbnQgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2YgdHlwZS5wcm90b3R5cGUucmVjZWl2ZUNvbXBvbmVudCA9PT0gJ2Z1bmN0aW9uJztcbiAgaWYgKGlzUmVhY3RDbGFzcykge1xuICAgIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyB3YXJuaW5nKFxuICAgICAgZmFsc2UsXG4gICAgICAnRGlkIG5vdCBleHBlY3QgdG8gZ2V0IGEgUmVhY3QgY2xhc3MgaGVyZS4gVXNlIGBDb21wb25lbnRgIGluc3RlYWQgJyArXG4gICAgICAnb2YgYENvbXBvbmVudC50eXBlYCBvciBgdGhpcy5jb25zdHJ1Y3RvcmAuJ1xuICAgICkgOiBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIXR5cGUuX3JlYWN0V2FybmVkRm9yVGhpc1R5cGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHR5cGUuX3JlYWN0V2FybmVkRm9yVGhpc1R5cGUgPSB0cnVlO1xuICAgICAgfSBjYXRjaCAoeCkge1xuICAgICAgICAvLyBqdXN0IGluY2FzZSB0aGlzIGlzIGEgZnJvemVuIG9iamVjdCBvciBzb21lIHNwZWNpYWwgb2JqZWN0XG4gICAgICB9XG4gICAgICBtb25pdG9yQ29kZVVzZShcbiAgICAgICAgJ3JlYWN0X25vbl9jb21wb25lbnRfaW5fanN4JyxcbiAgICAgICAgeyB2ZXJzaW9uOiAzLCBuYW1lOiB0eXBlLm5hbWUgfVxuICAgICAgKTtcbiAgICB9XG4gICAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IHdhcm5pbmcoXG4gICAgICBmYWxzZSxcbiAgICAgICdUaGlzIEpTWCB1c2VzIGEgcGxhaW4gZnVuY3Rpb24uIE9ubHkgUmVhY3QgY29tcG9uZW50cyBhcmUgJyArXG4gICAgICAndmFsaWQgaW4gUmVhY3RcXCdzIEpTWCB0cmFuc2Zvcm0uJ1xuICAgICkgOiBudWxsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3YXJuRm9yTm9uTGVnYWN5RmFjdG9yeSh0eXBlKSB7XG4gIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyB3YXJuaW5nKFxuICAgIGZhbHNlLFxuICAgICdEbyBub3QgcGFzcyBSZWFjdC5ET00uJyArIHR5cGUudHlwZSArICcgdG8gSlNYIG9yIGNyZWF0ZUZhY3RvcnkuICcgK1xuICAgICdVc2UgdGhlIHN0cmluZyBcIicgKyB0eXBlLnR5cGUgKyAnXCIgaW5zdGVhZC4nXG4gICkgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBUcmFuc2ZlciBzdGF0aWMgcHJvcGVydGllcyBmcm9tIHRoZSBzb3VyY2UgdG8gdGhlIHRhcmdldC4gRnVuY3Rpb25zIGFyZVxuICogcmVib3VuZCB0byBoYXZlIHRoaXMgcmVmbGVjdCB0aGUgb3JpZ2luYWwgc291cmNlLlxuICovXG5mdW5jdGlvbiBwcm94eVN0YXRpY01ldGhvZHModGFyZ2V0LCBzb3VyY2UpIHtcbiAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBib3VuZCA9IHZhbHVlLmJpbmQoc291cmNlKTtcbiAgICAgICAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBkZWZpbmVkIG9uIHRoZSBmdW5jdGlvbiwgc3VjaCBhcyBgaXNSZXF1aXJlZGAgb25cbiAgICAgICAgLy8gYSBQcm9wVHlwZXMgdmFsaWRhdG9yLlxuICAgICAgICBmb3IgKHZhciBrIGluIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBib3VuZFtrXSA9IHZhbHVlW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0YXJnZXRba2V5XSA9IGJvdW5kO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gV2UgdXNlIGFuIG9iamVjdCBpbnN0ZWFkIG9mIGEgYm9vbGVhbiBiZWNhdXNlIGJvb2xlYW5zIGFyZSBpZ25vcmVkIGJ5IG91clxuLy8gbW9ja2luZyBsaWJyYXJpZXMgd2hlbiB0aGVzZSBmYWN0b3JpZXMgZ2V0cyBtb2NrZWQuXG52YXIgTEVHQUNZX01BUktFUiA9IHt9O1xudmFyIE5PTl9MRUdBQ1lfTUFSS0VSID0ge307XG5cbnZhciBSZWFjdExlZ2FjeUVsZW1lbnRGYWN0b3J5ID0ge307XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcENyZWF0ZUZhY3RvcnkgPSBmdW5jdGlvbihjcmVhdGVGYWN0b3J5KSB7XG4gIHZhciBsZWdhY3lDcmVhdGVGYWN0b3J5ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gTm9uLWZ1bmN0aW9uIHR5cGVzIGNhbm5vdCBiZSBsZWdhY3kgZmFjdG9yaWVzXG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdERPTSB3ZSB1bndyYXAgaXQgdG8gZ2V0IHRvXG4gICAgICAvLyB0aGUgdW5kZXJseWluZyBzdHJpbmcgdHlwZS4gSXQgc2hvdWxkbid0IGhhdmUgYmVlbiBwYXNzZWQgaGVyZSBzbyB3ZVxuICAgICAgLy8gd2Fybi5cbiAgICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgICAgd2FybkZvck5vbkxlZ2FjeUZhY3RvcnkodHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlLnR5cGUpO1xuICAgIH1cblxuICAgIGlmICh0eXBlLmlzUmVhY3RMZWdhY3lGYWN0b3J5KSB7XG4gICAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGEgbGVnYWN5IGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdENvbXBvc2l0ZUNvbXBvbmVudC5cbiAgICAgIC8vIFdlIHVud3JhcCBpdCB0byBnZXQgdG8gdGhlIHVuZGVybHlpbmcgY2xhc3MuXG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlLnR5cGUpO1xuICAgIH1cblxuICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgIHdhcm5Gb3JQbGFpbkZ1bmN0aW9uVHlwZSh0eXBlKTtcbiAgICB9XG5cbiAgICAvLyBVbmxlc3MgaXQncyBhIGxlZ2FjeSBmYWN0b3J5LCB0aGVuIHRoaXMgaXMgcHJvYmFibHkgYSBwbGFpbiBmdW5jdGlvbixcbiAgICAvLyB0aGF0IGlzIGV4cGVjdGluZyB0byBiZSBpbnZva2VkIGJ5IEpTWC4gV2UgY2FuIGp1c3QgcmV0dXJuIGl0IGFzIGlzLlxuICAgIHJldHVybiB0eXBlO1xuICB9O1xuICByZXR1cm4gbGVnYWN5Q3JlYXRlRmFjdG9yeTtcbn07XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcENyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihjcmVhdGVFbGVtZW50KSB7XG4gIHZhciBsZWdhY3lDcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24odHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBOb24tZnVuY3Rpb24gdHlwZXMgY2Fubm90IGJlIGxlZ2FjeSBmYWN0b3JpZXNcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIGFyZ3M7XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdERPTSB3ZSB1bndyYXAgaXQgdG8gZ2V0IHRvXG4gICAgICAvLyB0aGUgdW5kZXJseWluZyBzdHJpbmcgdHlwZS4gSXQgc2hvdWxkbid0IGhhdmUgYmVlbiBwYXNzZWQgaGVyZSBzbyB3ZVxuICAgICAgLy8gd2Fybi5cbiAgICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgICAgd2FybkZvck5vbkxlZ2FjeUZhY3RvcnkodHlwZSk7XG4gICAgICB9XG4gICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIGFyZ3NbMF0gPSB0eXBlLnR5cGU7XG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0TGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGxlZ2FjeSBmYWN0b3J5IGNyZWF0ZWQgYnkgUmVhY3RDb21wb3NpdGVDb21wb25lbnQuXG4gICAgICAvLyBXZSB1bndyYXAgaXQgdG8gZ2V0IHRvIHRoZSB1bmRlcmx5aW5nIGNsYXNzLlxuICAgICAgaWYgKHR5cGUuX2lzTW9ja0Z1bmN0aW9uKSB7XG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBtb2NrIGZ1bmN0aW9uLCBwZW9wbGUgd2lsbCBleHBlY3QgaXQgdG8gYmUgY2FsbGVkLiBXZVxuICAgICAgICAvLyB3aWxsIGFjdHVhbGx5IGNhbGwgdGhlIG9yaWdpbmFsIG1vY2sgZmFjdG9yeSBmdW5jdGlvbiBpbnN0ZWFkLiBUaGlzXG4gICAgICAgIC8vIGZ1dHVyZSBwcm9vZnMgdW5pdCB0ZXN0aW5nIHRoYXQgYXNzdW1lIHRoYXQgdGhlc2UgYXJlIGNsYXNzZXMuXG4gICAgICAgIHR5cGUudHlwZS5fbW9ja2VkUmVhY3RDbGFzc0NvbnN0cnVjdG9yID0gdHlwZTtcbiAgICAgIH1cbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgYXJnc1swXSA9IHR5cGUudHlwZTtcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgIHdhcm5Gb3JQbGFpbkZ1bmN0aW9uVHlwZSh0eXBlKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGJlaW5nIGNhbGxlZCB3aXRoIGEgcGxhaW4gZnVuY3Rpb24gd2Ugc2hvdWxkIGludm9rZSBpdFxuICAgIC8vIGltbWVkaWF0ZWx5IGFzIGlmIHRoaXMgd2FzIHVzZWQgd2l0aCBsZWdhY3kgSlNYLlxuICAgIHJldHVybiB0eXBlLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuICByZXR1cm4gbGVnYWN5Q3JlYXRlRWxlbWVudDtcbn07XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcEZhY3RvcnkgPSBmdW5jdGlvbihmYWN0b3J5KSB7XG4gIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyBpbnZhcmlhbnQoXG4gICAgdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicsXG4gICAgJ1RoaXMgaXMgc3VwcG9zZSB0byBhY2NlcHQgYSBlbGVtZW50IGZhY3RvcnknXG4gICkgOiBpbnZhcmlhbnQodHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicpKTtcbiAgdmFyIGxlZ2FjeUVsZW1lbnRGYWN0b3J5ID0gZnVuY3Rpb24oY29uZmlnLCBjaGlsZHJlbikge1xuICAgIC8vIFRoaXMgZmFjdG9yeSBzaG91bGQgbm90IGJlIGNhbGxlZCB3aGVuIEpTWCBpcyB1c2VkLiBVc2UgSlNYIGluc3RlYWQuXG4gICAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgICAgd2FybkZvckxlZ2FjeUZhY3RvcnlDYWxsKCk7XG4gICAgfVxuICAgIHJldHVybiBmYWN0b3J5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG4gIHByb3h5U3RhdGljTWV0aG9kcyhsZWdhY3lFbGVtZW50RmFjdG9yeSwgZmFjdG9yeS50eXBlKTtcbiAgbGVnYWN5RWxlbWVudEZhY3RvcnkuaXNSZWFjdExlZ2FjeUZhY3RvcnkgPSBMRUdBQ1lfTUFSS0VSO1xuICBsZWdhY3lFbGVtZW50RmFjdG9yeS50eXBlID0gZmFjdG9yeS50eXBlO1xuICByZXR1cm4gbGVnYWN5RWxlbWVudEZhY3Rvcnk7XG59O1xuXG4vLyBUaGlzIGlzIHVzZWQgdG8gbWFyayBhIGZhY3RvcnkgdGhhdCB3aWxsIHJlbWFpbi4gRS5nLiB3ZSdyZSBhbGxvd2VkIHRvIGNhbGxcbi8vIGl0IGFzIGEgZnVuY3Rpb24uIEhvd2V2ZXIsIHlvdSdyZSBub3Qgc3VwcG9zZSB0byBwYXNzIGl0IHRvIGNyZWF0ZUVsZW1lbnRcbi8vIG9yIGNyZWF0ZUZhY3RvcnksIHNvIGl0IHdpbGwgd2FybiB5b3UgaWYgeW91IGRvLlxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5tYXJrTm9uTGVnYWN5RmFjdG9yeSA9IGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgZmFjdG9yeS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSA9IE5PTl9MRUdBQ1lfTUFSS0VSO1xuICByZXR1cm4gZmFjdG9yeTtcbn07XG5cbi8vIENoZWNrcyBpZiBhIGZhY3RvcnkgZnVuY3Rpb24gaXMgYWN0dWFsbHkgYSBsZWdhY3kgZmFjdG9yeSBwcmV0ZW5kaW5nIHRvXG4vLyBiZSBhIGNsYXNzLlxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5pc1ZhbGlkRmFjdG9yeSA9IGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgLy8gVE9ETzogVGhpcyB3aWxsIGJlIHJlbW92ZWQgYW5kIG1vdmVkIGludG8gYSBjbGFzcyB2YWxpZGF0b3Igb3Igc29tZXRoaW5nLlxuICByZXR1cm4gdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicgJiZcbiAgICBmYWN0b3J5LmlzUmVhY3RMZWdhY3lGYWN0b3J5ID09PSBMRUdBQ1lfTUFSS0VSO1xufTtcblxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5pc1ZhbGlkQ2xhc3MgPSBmdW5jdGlvbihmYWN0b3J5KSB7XG4gIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICAgIGZhbHNlLFxuICAgICAgJ2lzVmFsaWRDbGFzcyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZS4gJyArXG4gICAgICAnVXNlIGEgbW9yZSBzcGVjaWZpYyB2YWxpZGF0b3IgaW5zdGVhZC4nXG4gICAgKSA6IG51bGwpO1xuICB9XG4gIHJldHVybiBSZWFjdExlZ2FjeUVsZW1lbnRGYWN0b3J5LmlzVmFsaWRGYWN0b3J5KGZhY3RvcnkpO1xufTtcblxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5faXNMZWdhY3lDYWxsV2FybmluZ0VuYWJsZWQgPSB0cnVlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnk7XG4iXX0=
},{"./ReactCurrentOwner":6,"./invariant":13,"./monitorCodeUse":16,"./warning":17,"_process":2}],11:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPropTypeLocations
 */

"use strict";

var keyMirror = require("./keyMirror");

var ReactPropTypeLocations = keyMirror({
  prop: null,
  context: null,
  childContext: null
});

module.exports = ReactPropTypeLocations;

},{"./keyMirror":14}],12:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule emptyFunction
 */

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function() { return this; };
emptyFunction.thatReturnsArgument = function(arg) { return arg; };

module.exports = emptyFunction;

},{}],13:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== process.env.NODE_ENV) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvaW52YXJpYW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBpbnZhcmlhbnRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxudmFyIGludmFyaWFudCA9IGZ1bmN0aW9uKGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArXG4gICAgICAgICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnSW52YXJpYW50IFZpb2xhdGlvbjogJyArXG4gICAgICAgIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107IH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnZhcmlhbnQ7XG4iXX0=
},{"_process":2}],14:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== process.env.NODE_ENV ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIva2V5TWlycm9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGtleU1pcnJvclxuICogQHR5cGVjaGVja3Mgc3RhdGljLW9ubHlcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoXCIuL2ludmFyaWFudFwiKTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGVudW1lcmF0aW9uIHdpdGgga2V5cyBlcXVhbCB0byB0aGVpciB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgIHZhciBDT0xPUlMgPSBrZXlNaXJyb3Ioe2JsdWU6IG51bGwsIHJlZDogbnVsbH0pO1xuICogICB2YXIgbXlDb2xvciA9IENPTE9SUy5ibHVlO1xuICogICB2YXIgaXNDb2xvclZhbGlkID0gISFDT0xPUlNbbXlDb2xvcl07XG4gKlxuICogVGhlIGxhc3QgbGluZSBjb3VsZCBub3QgYmUgcGVyZm9ybWVkIGlmIHRoZSB2YWx1ZXMgb2YgdGhlIGdlbmVyYXRlZCBlbnVtIHdlcmVcbiAqIG5vdCBlcXVhbCB0byB0aGVpciBrZXlzLlxuICpcbiAqICAgSW5wdXQ6ICB7a2V5MTogdmFsMSwga2V5MjogdmFsMn1cbiAqICAgT3V0cHV0OiB7a2V5MToga2V5MSwga2V5Mjoga2V5Mn1cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbnZhciBrZXlNaXJyb3IgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIHJldCA9IHt9O1xuICB2YXIga2V5O1xuICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gaW52YXJpYW50KFxuICAgIG9iaiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheShvYmopLFxuICAgICdrZXlNaXJyb3IoLi4uKTogQXJndW1lbnQgbXVzdCBiZSBhbiBvYmplY3QuJ1xuICApIDogaW52YXJpYW50KG9iaiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheShvYmopKSk7XG4gIGZvciAoa2V5IGluIG9iaikge1xuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXRba2V5XSA9IGtleTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlNaXJyb3I7XG4iXX0=
},{"./invariant":13,"_process":2}],15:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mapObject
 */

'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Executes the provided `callback` once for each enumerable own property in the
 * object and constructs a new object from the results. The `callback` is
 * invoked with three arguments:
 *
 *  - the property value
 *  - the property name
 *  - the object being traversed
 *
 * Properties that are added after the call to `mapObject` will not be visited
 * by `callback`. If the values of existing properties are changed, the value
 * passed to `callback` will be the value at the time `mapObject` visits them.
 * Properties that are deleted before being visited are not visited.
 *
 * @grep function objectMap()
 * @grep function objMap()
 *
 * @param {?object} object
 * @param {function} callback
 * @param {*} context
 * @return {?object}
 */
function mapObject(object, callback, context) {
  if (!object) {
    return null;
  }
  var result = {};
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result[name] = callback.call(context, object[name], name, object);
    }
  }
  return result;
}

module.exports = mapObject;

},{}],16:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule monitorCodeUse
 */

"use strict";

var invariant = require("./invariant");

/**
 * Provides open-source compatible instrumentation for monitoring certain API
 * uses before we're ready to issue a warning or refactor. It accepts an event
 * name which may only contain the characters [a-z0-9_] and an optional data
 * object with further information.
 */

function monitorCodeUse(eventName, data) {
  ("production" !== process.env.NODE_ENV ? invariant(
    eventName && !/[^a-z0-9_]/.test(eventName),
    'You must provide an eventName using only the characters [a-z0-9_]'
  ) : invariant(eventName && !/[^a-z0-9_]/.test(eventName)));
}

module.exports = monitorCodeUse;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvbW9uaXRvckNvZGVVc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIG1vbml0b3JDb2RlVXNlXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKFwiLi9pbnZhcmlhbnRcIik7XG5cbi8qKlxuICogUHJvdmlkZXMgb3Blbi1zb3VyY2UgY29tcGF0aWJsZSBpbnN0cnVtZW50YXRpb24gZm9yIG1vbml0b3JpbmcgY2VydGFpbiBBUElcbiAqIHVzZXMgYmVmb3JlIHdlJ3JlIHJlYWR5IHRvIGlzc3VlIGEgd2FybmluZyBvciByZWZhY3Rvci4gSXQgYWNjZXB0cyBhbiBldmVudFxuICogbmFtZSB3aGljaCBtYXkgb25seSBjb250YWluIHRoZSBjaGFyYWN0ZXJzIFthLXowLTlfXSBhbmQgYW4gb3B0aW9uYWwgZGF0YVxuICogb2JqZWN0IHdpdGggZnVydGhlciBpbmZvcm1hdGlvbi5cbiAqL1xuXG5mdW5jdGlvbiBtb25pdG9yQ29kZVVzZShldmVudE5hbWUsIGRhdGEpIHtcbiAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IGludmFyaWFudChcbiAgICBldmVudE5hbWUgJiYgIS9bXmEtejAtOV9dLy50ZXN0KGV2ZW50TmFtZSksXG4gICAgJ1lvdSBtdXN0IHByb3ZpZGUgYW4gZXZlbnROYW1lIHVzaW5nIG9ubHkgdGhlIGNoYXJhY3RlcnMgW2EtejAtOV9dJ1xuICApIDogaW52YXJpYW50KGV2ZW50TmFtZSAmJiAhL1teYS16MC05X10vLnRlc3QoZXZlbnROYW1lKSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vbml0b3JDb2RlVXNlO1xuIl19
},{"./invariant":13,"_process":2}],17:[function(require,module,exports){
(function (process){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = require("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== process.env.NODE_ENV) {
  warning = function(condition, format ) {for (var args=[],$__0=2,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (!condition) {
      var argIndex = 0;
      console.warn('Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];}));
    }
  };
}

module.exports = warning;

}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvd2FybmluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIHdhcm5pbmdcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGVtcHR5RnVuY3Rpb24gPSByZXF1aXJlKFwiLi9lbXB0eUZ1bmN0aW9uXCIpO1xuXG4vKipcbiAqIFNpbWlsYXIgdG8gaW52YXJpYW50IGJ1dCBvbmx5IGxvZ3MgYSB3YXJuaW5nIGlmIHRoZSBjb25kaXRpb24gaXMgbm90IG1ldC5cbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gbG9nIGlzc3VlcyBpbiBkZXZlbG9wbWVudCBlbnZpcm9ubWVudHMgaW4gY3JpdGljYWxcbiAqIHBhdGhzLiBSZW1vdmluZyB0aGUgbG9nZ2luZyBjb2RlIGZvciBwcm9kdWN0aW9uIGVudmlyb25tZW50cyB3aWxsIGtlZXAgdGhlXG4gKiBzYW1lIGxvZ2ljIGFuZCBmb2xsb3cgdGhlIHNhbWUgY29kZSBwYXRocy5cbiAqL1xuXG52YXIgd2FybmluZyA9IGVtcHR5RnVuY3Rpb247XG5cbmlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgd2FybmluZyA9IGZ1bmN0aW9uKGNvbmRpdGlvbiwgZm9ybWF0ICkge2ZvciAodmFyIGFyZ3M9W10sJF9fMD0yLCRfXzE9YXJndW1lbnRzLmxlbmd0aDskX18wPCRfXzE7JF9fMCsrKSBhcmdzLnB1c2goYXJndW1lbnRzWyRfXzBdKTtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ2B3YXJuaW5nKGNvbmRpdGlvbiwgZm9ybWF0LCAuLi5hcmdzKWAgcmVxdWlyZXMgYSB3YXJuaW5nICcgK1xuICAgICAgICAnbWVzc2FnZSBhcmd1bWVudCdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBjb25zb2xlLndhcm4oJ1dhcm5pbmc6ICcgKyBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSAge3JldHVybiBhcmdzW2FyZ0luZGV4KytdO30pKTtcbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2FybmluZztcbiJdfQ==
},{"./emptyFunction":12,"_process":2}],18:[function(require,module,exports){
'use strict';

var cs = {
	log: function log(text) {
		console.log(text);
	},
	get: function get(url, callback) {
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function () {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					var response = xhr.response ? JSON.parse(xhr.response) : null;
					callback(xhr.status, response);
				} else if (xhr.status < 500) {
					callback(xhr.status);
				} else {
					console.error('ajax get error');
				}
			}
		};
		xhr.open('GET', url);
		xhr.send();
	},
	post: function post(url, data, callback) {
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function () {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					var response = xhr.response ? JSON.parse(xhr.response) : null;
					callback(xhr.status, response);
				} else if (xhr.status < 500) {
					callback(xhr.status);
				} else {
					console.error('ajax post error');
				}
			}
		};
		xhr.open('POST', url);
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.send(JSON.stringify(data));
	},
	cookie: function cookie(name, cookies) {
		var c = this.cookies(cookies);
		return c[name];
	},
	cookies: function cookies(_cookies) {
		var nameValues = _cookies.split('; ');
		var result = {};
		nameValues.forEach(function (item) {
			var i = item.split('=');
			result[i[0]] = i[1];
		});
		return result;
	},
	getQueryValue: function getQueryValue(queryString, name) {
		var arr = queryString.match(new RegExp(name + '=([^&]+)'));

		if (arr) {
			return arr[1];
		} else {
			return null;
		}
	}
};

var tests = [{
	id: 1,
	test: function test() {
		var cookies = {
			csati: 'majom',
			one: 'two'
		};

		var result = true;

		var c = cs.cookies('csati=majom; one=two');

		if (c.csati !== cookies.csati) result = false;

		return result;
	}
}, {
	id: 2,
	test: function test() {
		return 'bar' === cs.cookie('foo', 'foo=bar; te=majom');
	}
}, {
	id: 3,
	test: function test() {
		return '123' === cs.getQueryValue('?csati=majom&user_id=123&valami=semmi', 'user_id');
	}
}];

if (false) {
	var result = true;
	tests.forEach(function (test) {
		if (!test.test()) {
			console.error(test.id + '. test failed');
			result = false;
		}
	});
	if (result) {
		console.log('All test succeeded!');
	}
}

module.exports = cs;
},{}],19:[function(require,module,exports){
'use strict';

var food = {
	client: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			name: { type: 'string', minLength: 3 },
			description: { type: 'string' },
			category: { type: 'string', minLength: 1 },
			paleo: { type: 'integer', eq: [1, 5, 10] },
			keto: { type: 'integer', eq: [1, 5, 10] },
			enabled: { type: 'boolean' }
		}
	}
};

var user = {
	blank: function blank() {
		return {
			id: null,
			name: '',
			status: bella.constants.userStatus.GUEST
		};
	},
	client: {
		type: 'object',
		properties: {
			id: { type: ['string', 'null'], optional: true },
			name: { type: 'string' },
			status: { type: 'string', eq: _.values(bella.constants.userStatus) }
		}
	},
	server: {
		type: 'object',
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			status: { type: 'string', eq: _.values(bella.constants.userStatus) }
		}
	},
	clientToServer: function clientToServer(obj) {},
	serverToClient: function serverToClient(obj) {}
};

module.exports = {
	user: user,
	food: food
};
},{}],20:[function(require,module,exports){
'use strict';

var cs = require('./helpers/cs');
var schemas = require('./schemas');

module.exports = {
	wish: {
		get: function get(id, callback) {
			cs.get('/wish?id=' + id, function (status, wish) {
				if (status === bella.constants.response.OK) {
					var validation = SchemaInspector.validate(schemas.wish.server, wish);
					if (!validation.valid) {
						console.error('wish validation error', validation.format());
					}
					callback({ success: true }, schemas.wish.serverToClient(wish));
				} else if (status === bella.constants.response.NOT_FOUND) {
					callback({ success: false, message: 'Wish not found' });
				}
			});
		},
		post: function post(wish, callback) {
			var validation = SchemaInspector.validate(schemas.wish.client, wish);
			if (validation.valid) {
				cs.post('/wish', schemas.wish.clientToServer(wish), function (status) {
					if (status === bella.constants.response.OK) callback({ success: true });
				});
			}
		}
	},
	wishList: {
		get: function get(callback) {
			cs.get('/wishList', function (status, wishList) {
				if (status === bella.constants.response.OK) {
					var validation = SchemaInspector.validate(schemas.wishList.server, wishList);
					console.log('vaildation', validation);
					if (!validation.valid) console.error('wishList server validation error');
					callback({ success: true }, wishList);
				} else {
					console.error('wishList ajax error');
				}
			});
		}
	},
	userStatus: {
		get: function get(callback) {
			cs.get('/userStatus', function (status, userStatus) {
				if (status === bella.constants.response.OK) {
					callback({ success: true }, userStatus);
				}
			});
		}
	},
	login: function login(loginData, callback) {
		cs.post('/login', loginData, function (status, user) {
			if (status === bella.constants.response.OK) {
				callback({ success: true }, user);
			} else if (status === bella.constants.response.NOT_FOUND) {
				callback({ success: false });
			}
		});
	},
	logout: function logout(callback) {
		cs.get('logout', function (status) {
			if (status === bella.constants.response.OK) {
				callback({ success: true });
			}
		});
	},
	food: {
		get: function get(categoryId, callback) {
			cs.get('/foods/' + categoryId, function (status, foods) {});
		},
		post: function post(food, callback) {
			var validation = SchemaInspector.validate(schemas.food.client, food);

			if (validation.valid) {
				cs.post('/food', food, function (status) {
					if (status === bella.constants.response.OK) {
						callback(true, null);
					} else {
						callback(false, [{ property: 'server', message: 'error' }]);
					}
				});
			} else {
				callback(validation.valid, validation.error);
			}
		},
		getName: function getName() {
			return 'this is my name';
		}
	}
};
},{"./helpers/cs":18,"./schemas":19}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwic3JjL3NjcmlwdHMvY29tcG9uZW50cy91c2VyL3VzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LWRvbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvT2JqZWN0LmFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RDb250ZXh0LmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0L2xpYi9SZWFjdEN1cnJlbnRPd25lci5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RET00uanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL1JlYWN0RWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIvUmVhY3RFbGVtZW50VmFsaWRhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0L2xpYi9SZWFjdExlZ2FjeUVsZW1lbnQuanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL1JlYWN0UHJvcFR5cGVMb2NhdGlvbnMuanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL2VtcHR5RnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL2ludmFyaWFudC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC9saWIva2V5TWlycm9yLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0L2xpYi9tYXBPYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVhY3QvbGliL21vbml0b3JDb2RlVXNlLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0L2xpYi93YXJuaW5nLmpzIiwic3JjL3NjcmlwdHMvaGVscGVycy9jcy5qcyIsInNyYy9zY3JpcHRzL3NjaGVtYXMuanMiLCJzcmMvc2NyaXB0cy9zZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3RET00gPSByZXF1aXJlKCdyZWFjdC1kb20nKTtcblxudmFyIGNzID0gcmVxdWlyZSgnLi4vLi4vaGVscGVycy9jcycpO1xudmFyIHNjaGVtYXMgPSByZXF1aXJlKCcuLi8uLi9zY2hlbWFzJyk7XG52YXIgc2VydmVyID0gcmVxdWlyZSgnLi4vLi4vc2VydmVyJyk7XG52YXIgc3RhdGVzID0ge1xuXHRHTE9CQUw6ICdHTE9CQUwnLFxuXHRTSVpFOiAnU0laRScsXG5cdENPTlRFTlQ6ICdDT05URU5UJyxcblx0U01BTEw6ICdTTUFMTCcsXG5cdEJJRzogJ0JJRycsXG5cdExPR0lOOiAnTE9HSU4nLFxuXHRSRUdJU1RFUjogJ1JFR0lTVEVSJyxcblx0REVUQUlMUzogJ0RFVEFJTFMnXG59O1xudmFyIGNvbnRlbnRzID0ge1xuXHRMT0dJTjogJ0xPR0lOJyxcblx0UkVHSVNURVI6ICdSRUdJU1RFUicsXG5cdERFVEFJTFM6ICdERVRBSUxTJ1xufTtcbnZhciBzdGF0ZUNoYXJ0ID0gU3RhdGl2dXMuY3JlYXRlU3RhdGVjaGFydCgpO1xuXG52YXIgVXNlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdVc2VyJyxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcblx0XHR2YXIgdXNlciA9IHNjaGVtYXMudXNlci5ibGFuaygpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1czogJ0dVRVNUJyxcblx0XHRcdHVzZXJOYW1lOiB1c2VyLm5hbWUsXG5cdFx0XHRvcGVuZWQ6IGZhbHNlLFxuXHRcdFx0Y29udGVudDogY29udGVudHMuTE9HSU4sXG5cdFx0XHRlcnJvck1lc3NhZ2U6ICcnXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudERpZE1vdW50KCkge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRzdGF0ZUNoYXJ0LmFkZFN0YXRlKHN0YXRlcy5HTE9CQUwsIHtcblx0XHRcdHN1YnN0YXRlc0FyZUNvbmN1cnJlbnQ6IHRydWUsXG5cdFx0XHRzdGF0ZXM6IFt7XG5cdFx0XHRcdG5hbWU6IHN0YXRlcy5TSVpFLFxuXHRcdFx0XHRpbml0aWFsU3Vic3RhdGU6IHN0YXRlcy5TTUFMTCxcblx0XHRcdFx0c3RhdGVzOiBbe1xuXHRcdFx0XHRcdG5hbWU6IHN0YXRlcy5TTUFMTCxcblx0XHRcdFx0XHRlbnRlclN0YXRlOiBmdW5jdGlvbiBlbnRlclN0YXRlKCkge1xuXHRcdFx0XHRcdFx0X3RoaXMuc2V0U3RhdGUoeyBvcGVuZWQ6IGZhbHNlIH0pO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0dG9nZ2xlU2l6ZTogZnVuY3Rpb24gdG9nZ2xlU2l6ZSgpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ29Ub1N0YXRlKHN0YXRlcy5CSUcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdG5hbWU6IHN0YXRlcy5CSUcsXG5cdFx0XHRcdFx0ZW50ZXJTdGF0ZTogZnVuY3Rpb24gZW50ZXJTdGF0ZSgpIHtcblx0XHRcdFx0XHRcdF90aGlzLnNldFN0YXRlKHsgb3BlbmVkOiB0cnVlIH0pO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0dG9nZ2xlU2l6ZTogZnVuY3Rpb24gdG9nZ2xlU2l6ZSgpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ29Ub1N0YXRlKHN0YXRlcy5TTUFMTCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XVxuXHRcdFx0fSwge1xuXHRcdFx0XHRuYW1lOiBzdGF0ZXMuQ09OVEVOVCxcblx0XHRcdFx0aW5pdGlhbFN1YnN0YXRlOiBzdGF0ZXMuTE9HSU4sXG5cdFx0XHRcdHN0YXRlczogW3tcblx0XHRcdFx0XHRuYW1lOiBzdGF0ZXMuTE9HSU4sXG5cdFx0XHRcdFx0ZW50ZXJTdGF0ZTogZnVuY3Rpb24gZW50ZXJTdGF0ZSgpIHtcblx0XHRcdFx0XHRcdF90aGlzLnNldFN0YXRlKHsgY29udGVudDogY29udGVudHMuTE9HSU4gfSk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRsb2dpblN1Y2Nlc3M6IGZ1bmN0aW9uIGxvZ2luU3VjY2VzcygpIHtcblx0XHRcdFx0XHRcdHRoaXMuZ29Ub1N0YXRlKHN0YXRlcy5ERVRBSUxTKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRuYW1lOiBzdGF0ZXMuUkVHSVNURVIsXG5cdFx0XHRcdFx0ZW50ZXJTdGF0ZTogZnVuY3Rpb24gZW50ZXJTdGF0ZSgpIHtcblx0XHRcdFx0XHRcdF90aGlzLnNldFN0YXRlKHsgY29udGVudDogY29udGVudHMuUkVHSVNURVIgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0bmFtZTogc3RhdGVzLkRFVEFJTFMsXG5cdFx0XHRcdFx0ZW50ZXJTdGF0ZTogZnVuY3Rpb24gZW50ZXJTdGF0ZSgpIHtcblx0XHRcdFx0XHRcdF90aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0XHRcdFx0Y29udGVudDogY29udGVudHMuREVUQUlMUyxcblx0XHRcdFx0XHRcdFx0dXNlck5hbWU6IGJlbGxhLmRhdGEudXNlci5nZXQoKS5uYW1lXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1dXG5cdFx0XHR9XVxuXHRcdH0pO1xuXG5cdFx0c3RhdGVDaGFydC5pbml0U3RhdGVzKHN0YXRlcy5HTE9CQUwpO1xuXG5cdFx0YmVsbGEuZGF0YS51c2VyLnN1YnNjcmliZShmdW5jdGlvbiAodXNlcikge1xuXHRcdFx0c3dpdGNoICh1c2VyLnN0YXR1cykge1xuXHRcdFx0XHRjYXNlIGJlbGxhLmNvbnN0YW50cy51c2VyU3RhdHVzLkxPR0dFRF9JTjpcblx0XHRcdFx0XHRzdGF0ZUNoYXJ0LnNlbmRFdmVudCgnbG9naW5TdWNjZXNzJywgdXNlcik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgYmVsbGEuY29uc3RhbnRzLnVzZXJTdGF0dXMuR1VFU1Q6XG5cdFx0XHRcdFx0c3RhdGVDaGFydC5zZW5kRXZlbnQoJ2xvZ291dFN1Y2Nlc3MnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmIChjcy5jb29raWUoJ3VzZXJfaWQnLCBkb2N1bWVudC5jb29raWUpICYmIGNzLmNvb2tpZSgndG9rZW4nLCBkb2N1bWVudC5jb29raWUpKSB7XG5cdFx0XHRzZXJ2ZXIudXNlclN0YXR1cy5nZXQoZnVuY3Rpb24gKHJlc3VsdCwgdXNlclN0YXR1cykge1xuXHRcdFx0XHRiZWxsYS5kYXRhLnVzZXIuc2V0KHVzZXJTdGF0dXMsIF90aGlzKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRiZWxsYS5kYXRhLnVzZXIuc2V0KCdzdGF0dXMnLCBiZWxsYS5jb25zdGFudHMudXNlclN0YXR1cy5HVUVTVCwgdGhpcyk7XG5cdFx0fVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY29udGVudCwgZGlzcGxheSwgZXJyb3JNZXNzYWdlO1xuXG5cdFx0aWYgKHRoaXMuc3RhdGUub3BlbmVkKSB7XG5cdFx0XHRzd2l0Y2ggKHRoaXMuc3RhdGUuY29udGVudCkge1xuXHRcdFx0XHRjYXNlIGNvbnRlbnRzLkxPR0lOOlxuXHRcdFx0XHRcdGNvbnRlbnQgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2JjLXVzZXItcG9wdXAnIH0sXG5cdFx0XHRcdFx0XHRlcnJvck1lc3NhZ2UsXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdpbnB1dCcsIHsgdHlwZTogJ3RleHQnLCByZWY6ICduYW1lJywgZGVmYXVsdFZhbHVlOiAnYScgfSksXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdicicsIG51bGwpLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCB7IHR5cGU6ICd0ZXh0JywgcmVmOiAncGFzc3dvcmQnLCBkZWZhdWx0VmFsdWU6ICcxJyB9KSxcblx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2JyJywgbnVsbCksXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0XHQnYnV0dG9uJyxcblx0XHRcdFx0XHRcdFx0eyBvbkNsaWNrOiB0aGlzLmxvZ2luIH0sXG5cdFx0XHRcdFx0XHRcdCdMb2dpbidcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdicicsIG51bGwpLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdFx0J2EnLFxuXHRcdFx0XHRcdFx0XHR7IGhyZWY6ICcnLCBvbkNsaWNrOiB0aGlzLnJlZ2lzdGVyIH0sXG5cdFx0XHRcdFx0XHRcdCdyZWdpc3Rlcidcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIGNvbnRlbnRzLlJFR0lTVEVSOlxuXHRcdFx0XHRcdGNvbnRlbnQgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2JjLXVzZXItcG9wdXAnIH0sXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0XHQnc3BhbicsXG5cdFx0XHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0XHRcdCdyZWdpc3RyYXRpb24gZm9ybS4uLidcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIGNvbnRlbnRzLkRFVEFJTFM6XG5cdFx0XHRcdFx0Y29udGVudCA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0XHQndXNlciBkZXRhaWxzLi4uJ1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c3dpdGNoICh0aGlzLnN0YXRlLmNvbnRlbnQpIHtcblx0XHRcdGNhc2UgY29udGVudHMuTE9HSU46XG5cdFx0XHRjYXNlIGNvbnRlbnRzLlJFR0lTVEVSOlxuXHRcdFx0XHRkaXNwbGF5ID0gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnYScsXG5cdFx0XHRcdFx0eyBocmVmOiAnJywgb25DbGljazogdGhpcy50b2dnbGVTaXplIH0sXG5cdFx0XHRcdFx0J2xvZ2luL3JlZ2lzdGVyJ1xuXHRcdFx0XHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgY29udGVudHMuREVUQUlMUzpcblx0XHRcdFx0ZGlzcGxheSA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J2EnLFxuXHRcdFx0XHRcdHsgaHJlZjogJycsIG9uQ2xpY2s6IHRoaXMudG9nZ2xlU2l6ZSB9LFxuXHRcdFx0XHRcdCd1c2VyJ1xuXHRcdFx0XHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRyZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICdiYy11c2VyJyB9LFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J3NwYW4nLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHQnVSAnLFxuXHRcdFx0XHRkaXNwbGF5XG5cdFx0XHQpLFxuXHRcdFx0Y29udGVudFxuXHRcdCk7XG5cdH0sXG5cdHRvZ2dsZVNpemU6IGZ1bmN0aW9uIHRvZ2dsZVNpemUoZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRzdGF0ZUNoYXJ0LnNlbmRFdmVudCgndG9nZ2xlU2l6ZScpO1xuXHR9LFxuXHRsb2dpbjogZnVuY3Rpb24gbG9naW4oKSB7XG5cdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRzZXJ2ZXIubG9naW4oe1xuXHRcdFx0dXNlcm5hbWU6IHRoaXMucmVmcy5uYW1lLnZhbHVlLFxuXHRcdFx0cGFzc3dvcmQ6IHRoaXMucmVmcy5wYXNzd29yZC52YWx1ZVxuXHRcdH0sIGZ1bmN0aW9uIChyZXN1bHQsIGRhdGEpIHtcblx0XHRcdGlmIChyZXN1bHQuc3VjY2Vzcykge1xuXHRcdFx0XHRiZWxsYS5kYXRhLnVzZXIuc2V0KGRhdGEsIF90aGlzMik7XG5cdFx0XHRcdF90aGlzMi5zZXRTdGF0ZSh7IGVycm9yTWVzc2FnZTogJycgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfdGhpczIuc2V0U3RhdGUoeyBlcnJvck1lc3NhZ2U6ICdXcm9uZyB1c2VybmFtZSBvciBwYXNzd29yZCcgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cdGxvZ291dDogZnVuY3Rpb24gbG9nb3V0KGUpIHtcblx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRzZXJ2ZXIubG9nb3V0KGZ1bmN0aW9uIChyZXN1bHQpIHtcblx0XHRcdGlmIChyZXN1bHQuc3VjY2Vzcykge1xuXHRcdFx0XHRiZWxsYS5kYXRhLnVzZXIuc2V0KHNjaGVtYXMudXNlci5ibGFuaygpLCBfdGhpczMpO1xuXHRcdFx0XHRfdGhpczMuc2V0U3RhdGUoeyBvcGVuZWQ6IGZhbHNlIH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9LFxuXHRyZWdpc3RlcjogZnVuY3Rpb24gcmVnaXN0ZXIoZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0fVxufSk7XG5cblJlYWN0RE9NLnJlbmRlcihSZWFjdC5jcmVhdGVFbGVtZW50KFVzZXIsIG51bGwpLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGVhZGVyJykpOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gdHJ1ZTtcbiAgICB2YXIgY3VycmVudFF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG59XG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHF1ZXVlLnB1c2goZnVuKTtcbiAgICBpZiAoIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgncmVhY3QvbGliL1JlYWN0RE9NJyk7XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIE9iamVjdC5hc3NpZ25cbiAqL1xuXG4vLyBodHRwczovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtb2JqZWN0LmFzc2lnblxuXG5mdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCBzb3VyY2VzKSB7XG4gIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gdGFyZ2V0IGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICB9XG5cbiAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgZm9yICh2YXIgbmV4dEluZGV4ID0gMTsgbmV4dEluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgbmV4dEluZGV4KyspIHtcbiAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tuZXh0SW5kZXhdO1xuICAgIGlmIChuZXh0U291cmNlID09IG51bGwpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHZhciBmcm9tID0gT2JqZWN0KG5leHRTb3VyY2UpO1xuXG4gICAgLy8gV2UgZG9uJ3QgY3VycmVudGx5IHN1cHBvcnQgYWNjZXNzb3JzIG5vciBwcm94aWVzLiBUaGVyZWZvcmUgdGhpc1xuICAgIC8vIGNvcHkgY2Fubm90IHRocm93LiBJZiB3ZSBldmVyIHN1cHBvcnRlZCB0aGlzIHRoZW4gd2UgbXVzdCBoYW5kbGVcbiAgICAvLyBleGNlcHRpb25zIGFuZCBzaWRlLWVmZmVjdHMuIFdlIGRvbid0IHN1cHBvcnQgc3ltYm9scyBzbyB0aGV5IHdvbid0XG4gICAgLy8gYmUgdHJhbnNmZXJyZWQuXG5cbiAgICBmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0bztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzaWduO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIFJlYWN0Q29udGV4dFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vT2JqZWN0LmFzc2lnblwiKTtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudCBjb250ZXh0LlxuICpcbiAqIFRoZSBjb250ZXh0IGlzIGF1dG9tYXRpY2FsbHkgcGFzc2VkIGRvd24gdGhlIGNvbXBvbmVudCBvd25lcnNoaXAgaGllcmFyY2h5XG4gKiBhbmQgaXMgYWNjZXNzaWJsZSB2aWEgYHRoaXMuY29udGV4dGAgb24gUmVhY3RDb21wb3NpdGVDb21wb25lbnRzLlxuICovXG52YXIgUmVhY3RDb250ZXh0ID0ge1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHR5cGUge29iamVjdH1cbiAgICovXG4gIGN1cnJlbnQ6IHt9LFxuXG4gIC8qKlxuICAgKiBUZW1wb3JhcmlseSBleHRlbmRzIHRoZSBjdXJyZW50IGNvbnRleHQgd2hpbGUgZXhlY3V0aW5nIHNjb3BlZENhbGxiYWNrLlxuICAgKlxuICAgKiBBIHR5cGljYWwgdXNlIGNhc2UgbWlnaHQgbG9vayBsaWtlXG4gICAqXG4gICAqICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgKiAgICB2YXIgY2hpbGRyZW4gPSBSZWFjdENvbnRleHQud2l0aENvbnRleHQoe2ZvbzogJ2Zvbyd9LCAoKSA9PiAoXG4gICAqXG4gICAqICAgICkpO1xuICAgKiAgICByZXR1cm4gPGRpdj57Y2hpbGRyZW59PC9kaXY+O1xuICAgKiAgfVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gbmV3Q29udGV4dCBOZXcgY29udGV4dCB0byBtZXJnZSBpbnRvIHRoZSBleGlzdGluZyBjb250ZXh0XG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHNjb3BlZENhbGxiYWNrIENhbGxiYWNrIHRvIHJ1biB3aXRoIHRoZSBuZXcgY29udGV4dFxuICAgKiBAcmV0dXJuIHtSZWFjdENvbXBvbmVudHxhcnJheTxSZWFjdENvbXBvbmVudD59XG4gICAqL1xuICB3aXRoQ29udGV4dDogZnVuY3Rpb24obmV3Q29udGV4dCwgc2NvcGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIHZhciBwcmV2aW91c0NvbnRleHQgPSBSZWFjdENvbnRleHQuY3VycmVudDtcbiAgICBSZWFjdENvbnRleHQuY3VycmVudCA9IGFzc2lnbih7fSwgcHJldmlvdXNDb250ZXh0LCBuZXdDb250ZXh0KTtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gc2NvcGVkQ2FsbGJhY2soKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgUmVhY3RDb250ZXh0LmN1cnJlbnQgPSBwcmV2aW91c0NvbnRleHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdENvbnRleHQ7XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgUmVhY3RDdXJyZW50T3duZXJcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudCBvd25lci5cbiAqXG4gKiBUaGUgY3VycmVudCBvd25lciBpcyB0aGUgY29tcG9uZW50IHdobyBzaG91bGQgb3duIGFueSBjb21wb25lbnRzIHRoYXQgYXJlXG4gKiBjdXJyZW50bHkgYmVpbmcgY29uc3RydWN0ZWQuXG4gKlxuICogVGhlIGRlcHRoIGluZGljYXRlIGhvdyBtYW55IGNvbXBvc2l0ZSBjb21wb25lbnRzIGFyZSBhYm92ZSB0aGlzIHJlbmRlciBsZXZlbC5cbiAqL1xudmFyIFJlYWN0Q3VycmVudE93bmVyID0ge1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHR5cGUge1JlYWN0Q29tcG9uZW50fVxuICAgKi9cbiAgY3VycmVudDogbnVsbFxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0Q3VycmVudE93bmVyO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBSZWFjdERPTVxuICogQHR5cGVjaGVja3Mgc3RhdGljLW9ubHlcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFJlYWN0RWxlbWVudCA9IHJlcXVpcmUoXCIuL1JlYWN0RWxlbWVudFwiKTtcbnZhciBSZWFjdEVsZW1lbnRWYWxpZGF0b3IgPSByZXF1aXJlKFwiLi9SZWFjdEVsZW1lbnRWYWxpZGF0b3JcIik7XG52YXIgUmVhY3RMZWdhY3lFbGVtZW50ID0gcmVxdWlyZShcIi4vUmVhY3RMZWdhY3lFbGVtZW50XCIpO1xuXG52YXIgbWFwT2JqZWN0ID0gcmVxdWlyZShcIi4vbWFwT2JqZWN0XCIpO1xuXG4vKipcbiAqIENyZWF0ZSBhIGZhY3RvcnkgdGhhdCBjcmVhdGVzIEhUTUwgdGFnIGVsZW1lbnRzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGFnIG5hbWUgKGUuZy4gYGRpdmApLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRE9NRmFjdG9yeSh0YWcpIHtcbiAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgIHJldHVybiBSZWFjdExlZ2FjeUVsZW1lbnQubWFya05vbkxlZ2FjeUZhY3RvcnkoXG4gICAgICBSZWFjdEVsZW1lbnRWYWxpZGF0b3IuY3JlYXRlRmFjdG9yeSh0YWcpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gUmVhY3RMZWdhY3lFbGVtZW50Lm1hcmtOb25MZWdhY3lGYWN0b3J5KFxuICAgIFJlYWN0RWxlbWVudC5jcmVhdGVGYWN0b3J5KHRhZylcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwcGluZyBmcm9tIHN1cHBvcnRlZCBIVE1MIHRhZ3MgdG8gYFJlYWN0RE9NQ29tcG9uZW50YCBjbGFzc2VzLlxuICogVGhpcyBpcyBhbHNvIGFjY2Vzc2libGUgdmlhIGBSZWFjdC5ET01gLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xudmFyIFJlYWN0RE9NID0gbWFwT2JqZWN0KHtcbiAgYTogJ2EnLFxuICBhYmJyOiAnYWJicicsXG4gIGFkZHJlc3M6ICdhZGRyZXNzJyxcbiAgYXJlYTogJ2FyZWEnLFxuICBhcnRpY2xlOiAnYXJ0aWNsZScsXG4gIGFzaWRlOiAnYXNpZGUnLFxuICBhdWRpbzogJ2F1ZGlvJyxcbiAgYjogJ2InLFxuICBiYXNlOiAnYmFzZScsXG4gIGJkaTogJ2JkaScsXG4gIGJkbzogJ2JkbycsXG4gIGJpZzogJ2JpZycsXG4gIGJsb2NrcXVvdGU6ICdibG9ja3F1b3RlJyxcbiAgYm9keTogJ2JvZHknLFxuICBicjogJ2JyJyxcbiAgYnV0dG9uOiAnYnV0dG9uJyxcbiAgY2FudmFzOiAnY2FudmFzJyxcbiAgY2FwdGlvbjogJ2NhcHRpb24nLFxuICBjaXRlOiAnY2l0ZScsXG4gIGNvZGU6ICdjb2RlJyxcbiAgY29sOiAnY29sJyxcbiAgY29sZ3JvdXA6ICdjb2xncm91cCcsXG4gIGRhdGE6ICdkYXRhJyxcbiAgZGF0YWxpc3Q6ICdkYXRhbGlzdCcsXG4gIGRkOiAnZGQnLFxuICBkZWw6ICdkZWwnLFxuICBkZXRhaWxzOiAnZGV0YWlscycsXG4gIGRmbjogJ2RmbicsXG4gIGRpYWxvZzogJ2RpYWxvZycsXG4gIGRpdjogJ2RpdicsXG4gIGRsOiAnZGwnLFxuICBkdDogJ2R0JyxcbiAgZW06ICdlbScsXG4gIGVtYmVkOiAnZW1iZWQnLFxuICBmaWVsZHNldDogJ2ZpZWxkc2V0JyxcbiAgZmlnY2FwdGlvbjogJ2ZpZ2NhcHRpb24nLFxuICBmaWd1cmU6ICdmaWd1cmUnLFxuICBmb290ZXI6ICdmb290ZXInLFxuICBmb3JtOiAnZm9ybScsXG4gIGgxOiAnaDEnLFxuICBoMjogJ2gyJyxcbiAgaDM6ICdoMycsXG4gIGg0OiAnaDQnLFxuICBoNTogJ2g1JyxcbiAgaDY6ICdoNicsXG4gIGhlYWQ6ICdoZWFkJyxcbiAgaGVhZGVyOiAnaGVhZGVyJyxcbiAgaHI6ICdocicsXG4gIGh0bWw6ICdodG1sJyxcbiAgaTogJ2knLFxuICBpZnJhbWU6ICdpZnJhbWUnLFxuICBpbWc6ICdpbWcnLFxuICBpbnB1dDogJ2lucHV0JyxcbiAgaW5zOiAnaW5zJyxcbiAga2JkOiAna2JkJyxcbiAga2V5Z2VuOiAna2V5Z2VuJyxcbiAgbGFiZWw6ICdsYWJlbCcsXG4gIGxlZ2VuZDogJ2xlZ2VuZCcsXG4gIGxpOiAnbGknLFxuICBsaW5rOiAnbGluaycsXG4gIG1haW46ICdtYWluJyxcbiAgbWFwOiAnbWFwJyxcbiAgbWFyazogJ21hcmsnLFxuICBtZW51OiAnbWVudScsXG4gIG1lbnVpdGVtOiAnbWVudWl0ZW0nLFxuICBtZXRhOiAnbWV0YScsXG4gIG1ldGVyOiAnbWV0ZXInLFxuICBuYXY6ICduYXYnLFxuICBub3NjcmlwdDogJ25vc2NyaXB0JyxcbiAgb2JqZWN0OiAnb2JqZWN0JyxcbiAgb2w6ICdvbCcsXG4gIG9wdGdyb3VwOiAnb3B0Z3JvdXAnLFxuICBvcHRpb246ICdvcHRpb24nLFxuICBvdXRwdXQ6ICdvdXRwdXQnLFxuICBwOiAncCcsXG4gIHBhcmFtOiAncGFyYW0nLFxuICBwaWN0dXJlOiAncGljdHVyZScsXG4gIHByZTogJ3ByZScsXG4gIHByb2dyZXNzOiAncHJvZ3Jlc3MnLFxuICBxOiAncScsXG4gIHJwOiAncnAnLFxuICBydDogJ3J0JyxcbiAgcnVieTogJ3J1YnknLFxuICBzOiAncycsXG4gIHNhbXA6ICdzYW1wJyxcbiAgc2NyaXB0OiAnc2NyaXB0JyxcbiAgc2VjdGlvbjogJ3NlY3Rpb24nLFxuICBzZWxlY3Q6ICdzZWxlY3QnLFxuICBzbWFsbDogJ3NtYWxsJyxcbiAgc291cmNlOiAnc291cmNlJyxcbiAgc3BhbjogJ3NwYW4nLFxuICBzdHJvbmc6ICdzdHJvbmcnLFxuICBzdHlsZTogJ3N0eWxlJyxcbiAgc3ViOiAnc3ViJyxcbiAgc3VtbWFyeTogJ3N1bW1hcnknLFxuICBzdXA6ICdzdXAnLFxuICB0YWJsZTogJ3RhYmxlJyxcbiAgdGJvZHk6ICd0Ym9keScsXG4gIHRkOiAndGQnLFxuICB0ZXh0YXJlYTogJ3RleHRhcmVhJyxcbiAgdGZvb3Q6ICd0Zm9vdCcsXG4gIHRoOiAndGgnLFxuICB0aGVhZDogJ3RoZWFkJyxcbiAgdGltZTogJ3RpbWUnLFxuICB0aXRsZTogJ3RpdGxlJyxcbiAgdHI6ICd0cicsXG4gIHRyYWNrOiAndHJhY2snLFxuICB1OiAndScsXG4gIHVsOiAndWwnLFxuICAndmFyJzogJ3ZhcicsXG4gIHZpZGVvOiAndmlkZW8nLFxuICB3YnI6ICd3YnInLFxuXG4gIC8vIFNWR1xuICBjaXJjbGU6ICdjaXJjbGUnLFxuICBkZWZzOiAnZGVmcycsXG4gIGVsbGlwc2U6ICdlbGxpcHNlJyxcbiAgZzogJ2cnLFxuICBsaW5lOiAnbGluZScsXG4gIGxpbmVhckdyYWRpZW50OiAnbGluZWFyR3JhZGllbnQnLFxuICBtYXNrOiAnbWFzaycsXG4gIHBhdGg6ICdwYXRoJyxcbiAgcGF0dGVybjogJ3BhdHRlcm4nLFxuICBwb2x5Z29uOiAncG9seWdvbicsXG4gIHBvbHlsaW5lOiAncG9seWxpbmUnLFxuICByYWRpYWxHcmFkaWVudDogJ3JhZGlhbEdyYWRpZW50JyxcbiAgcmVjdDogJ3JlY3QnLFxuICBzdG9wOiAnc3RvcCcsXG4gIHN2ZzogJ3N2ZycsXG4gIHRleHQ6ICd0ZXh0JyxcbiAgdHNwYW46ICd0c3BhbidcblxufSwgY3JlYXRlRE9NRmFjdG9yeSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RET007XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXlaV0ZqZEM5c2FXSXZVbVZoWTNSRVQwMHVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU0lzSW1acGJHVWlPaUpuWlc1bGNtRjBaV1F1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaUx5b3FYRzRnS2lCRGIzQjVjbWxuYUhRZ01qQXhNeTB5TURFMExDQkdZV05sWW05dmF5d2dTVzVqTGx4dUlDb2dRV3hzSUhKcFoyaDBjeUJ5WlhObGNuWmxaQzVjYmlBcVhHNGdLaUJVYUdseklITnZkWEpqWlNCamIyUmxJR2x6SUd4cFkyVnVjMlZrSUhWdVpHVnlJSFJvWlNCQ1UwUXRjM1I1YkdVZ2JHbGpaVzV6WlNCbWIzVnVaQ0JwYmlCMGFHVmNiaUFxSUV4SlEwVk9VMFVnWm1sc1pTQnBiaUIwYUdVZ2NtOXZkQ0JrYVhKbFkzUnZjbmtnYjJZZ2RHaHBjeUJ6YjNWeVkyVWdkSEpsWlM0Z1FXNGdZV1JrYVhScGIyNWhiQ0JuY21GdWRGeHVJQ29nYjJZZ2NHRjBaVzUwSUhKcFoyaDBjeUJqWVc0Z1ltVWdabTkxYm1RZ2FXNGdkR2hsSUZCQlZFVk9WRk1nWm1sc1pTQnBiaUIwYUdVZ2MyRnRaU0JrYVhKbFkzUnZjbmt1WEc0Z0tseHVJQ29nUUhCeWIzWnBaR1Z6VFc5a2RXeGxJRkpsWVdOMFJFOU5YRzRnS2lCQWRIbHdaV05vWldOcmN5QnpkR0YwYVdNdGIyNXNlVnh1SUNvdlhHNWNibHdpZFhObElITjBjbWxqZEZ3aU8xeHVYRzUyWVhJZ1VtVmhZM1JGYkdWdFpXNTBJRDBnY21WeGRXbHlaU2hjSWk0dlVtVmhZM1JGYkdWdFpXNTBYQ0lwTzF4dWRtRnlJRkpsWVdOMFJXeGxiV1Z1ZEZaaGJHbGtZWFJ2Y2lBOUlISmxjWFZwY21Vb1hDSXVMMUpsWVdOMFJXeGxiV1Z1ZEZaaGJHbGtZWFJ2Y2x3aUtUdGNiblpoY2lCU1pXRmpkRXhsWjJGamVVVnNaVzFsYm5RZ1BTQnlaWEYxYVhKbEtGd2lMaTlTWldGamRFeGxaMkZqZVVWc1pXMWxiblJjSWlrN1hHNWNiblpoY2lCdFlYQlBZbXBsWTNRZ1BTQnlaWEYxYVhKbEtGd2lMaTl0WVhCUFltcGxZM1JjSWlrN1hHNWNiaThxS2x4dUlDb2dRM0psWVhSbElHRWdabUZqZEc5eWVTQjBhR0YwSUdOeVpXRjBaWE1nU0ZSTlRDQjBZV2NnWld4bGJXVnVkSE11WEc0Z0tseHVJQ29nUUhCaGNtRnRJSHR6ZEhKcGJtZDlJSFJoWnlCVVlXY2dibUZ0WlNBb1pTNW5MaUJnWkdsMllDa3VYRzRnS2lCQWNISnBkbUYwWlZ4dUlDb3ZYRzVtZFc1amRHbHZiaUJqY21WaGRHVkVUMDFHWVdOMGIzSjVLSFJoWnlrZ2UxeHVJQ0JwWmlBb1hDSndjbTlrZFdOMGFXOXVYQ0lnSVQwOUlIQnliMk5sYzNNdVpXNTJMazVQUkVWZlJVNVdLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGSmxZV04wVEdWbllXTjVSV3hsYldWdWRDNXRZWEpyVG05dVRHVm5ZV041Um1GamRHOXllU2hjYmlBZ0lDQWdJRkpsWVdOMFJXeGxiV1Z1ZEZaaGJHbGtZWFJ2Y2k1amNtVmhkR1ZHWVdOMGIzSjVLSFJoWnlsY2JpQWdJQ0FwTzF4dUlDQjlYRzRnSUhKbGRIVnliaUJTWldGamRFeGxaMkZqZVVWc1pXMWxiblF1YldGeWEwNXZia3hsWjJGamVVWmhZM1J2Y25rb1hHNGdJQ0FnVW1WaFkzUkZiR1Z0Wlc1MExtTnlaV0YwWlVaaFkzUnZjbmtvZEdGbktWeHVJQ0FwTzF4dWZWeHVYRzR2S2lwY2JpQXFJRU55WldGMFpYTWdZU0J0WVhCd2FXNW5JR1p5YjIwZ2MzVndjRzl5ZEdWa0lFaFVUVXdnZEdGbmN5QjBieUJnVW1WaFkzUkVUMDFEYjIxd2IyNWxiblJnSUdOc1lYTnpaWE11WEc0Z0tpQlVhR2x6SUdseklHRnNjMjhnWVdOalpYTnphV0pzWlNCMmFXRWdZRkpsWVdOMExrUlBUV0F1WEc0Z0tseHVJQ29nUUhCMVlteHBZMXh1SUNvdlhHNTJZWElnVW1WaFkzUkVUMDBnUFNCdFlYQlBZbXBsWTNRb2UxeHVJQ0JoT2lBbllTY3NYRzRnSUdGaVluSTZJQ2RoWW1KeUp5eGNiaUFnWVdSa2NtVnpjem9nSjJGa1pISmxjM01uTEZ4dUlDQmhjbVZoT2lBbllYSmxZU2NzWEc0Z0lHRnlkR2xqYkdVNklDZGhjblJwWTJ4bEp5eGNiaUFnWVhOcFpHVTZJQ2RoYzJsa1pTY3NYRzRnSUdGMVpHbHZPaUFuWVhWa2FXOG5MRnh1SUNCaU9pQW5ZaWNzWEc0Z0lHSmhjMlU2SUNkaVlYTmxKeXhjYmlBZ1ltUnBPaUFuWW1ScEp5eGNiaUFnWW1Sdk9pQW5ZbVJ2Snl4Y2JpQWdZbWxuT2lBblltbG5KeXhjYmlBZ1lteHZZMnR4ZFc5MFpUb2dKMkpzYjJOcmNYVnZkR1VuTEZ4dUlDQmliMlI1T2lBblltOWtlU2NzWEc0Z0lHSnlPaUFuWW5JbkxGeHVJQ0JpZFhSMGIyNDZJQ2RpZFhSMGIyNG5MRnh1SUNCallXNTJZWE02SUNkallXNTJZWE1uTEZ4dUlDQmpZWEIwYVc5dU9pQW5ZMkZ3ZEdsdmJpY3NYRzRnSUdOcGRHVTZJQ2RqYVhSbEp5eGNiaUFnWTI5a1pUb2dKMk52WkdVbkxGeHVJQ0JqYjJ3NklDZGpiMnduTEZ4dUlDQmpiMnhuY205MWNEb2dKMk52YkdkeWIzVndKeXhjYmlBZ1pHRjBZVG9nSjJSaGRHRW5MRnh1SUNCa1lYUmhiR2x6ZERvZ0oyUmhkR0ZzYVhOMEp5eGNiaUFnWkdRNklDZGtaQ2NzWEc0Z0lHUmxiRG9nSjJSbGJDY3NYRzRnSUdSbGRHRnBiSE02SUNka1pYUmhhV3h6Snl4Y2JpQWdaR1p1T2lBblpHWnVKeXhjYmlBZ1pHbGhiRzluT2lBblpHbGhiRzluSnl4Y2JpQWdaR2wyT2lBblpHbDJKeXhjYmlBZ1pHdzZJQ2RrYkNjc1hHNGdJR1IwT2lBblpIUW5MRnh1SUNCbGJUb2dKMlZ0Snl4Y2JpQWdaVzFpWldRNklDZGxiV0psWkNjc1hHNGdJR1pwWld4a2MyVjBPaUFuWm1sbGJHUnpaWFFuTEZ4dUlDQm1hV2RqWVhCMGFXOXVPaUFuWm1sblkyRndkR2x2Ymljc1hHNGdJR1pwWjNWeVpUb2dKMlpwWjNWeVpTY3NYRzRnSUdadmIzUmxjam9nSjJadmIzUmxjaWNzWEc0Z0lHWnZjbTA2SUNkbWIzSnRKeXhjYmlBZ2FERTZJQ2RvTVNjc1hHNGdJR2d5T2lBbmFESW5MRnh1SUNCb016b2dKMmd6Snl4Y2JpQWdhRFE2SUNkb05DY3NYRzRnSUdnMU9pQW5hRFVuTEZ4dUlDQm9Oam9nSjJnMkp5eGNiaUFnYUdWaFpEb2dKMmhsWVdRbkxGeHVJQ0JvWldGa1pYSTZJQ2RvWldGa1pYSW5MRnh1SUNCb2Nqb2dKMmh5Snl4Y2JpQWdhSFJ0YkRvZ0oyaDBiV3duTEZ4dUlDQnBPaUFuYVNjc1hHNGdJR2xtY21GdFpUb2dKMmxtY21GdFpTY3NYRzRnSUdsdFp6b2dKMmx0Wnljc1hHNGdJR2x1Y0hWME9pQW5hVzV3ZFhRbkxGeHVJQ0JwYm5NNklDZHBibk1uTEZ4dUlDQnJZbVE2SUNkclltUW5MRnh1SUNCclpYbG5aVzQ2SUNkclpYbG5aVzRuTEZ4dUlDQnNZV0psYkRvZ0oyeGhZbVZzSnl4Y2JpQWdiR1ZuWlc1a09pQW5iR1ZuWlc1a0p5eGNiaUFnYkdrNklDZHNhU2NzWEc0Z0lHeHBibXM2SUNkc2FXNXJKeXhjYmlBZ2JXRnBiam9nSjIxaGFXNG5MRnh1SUNCdFlYQTZJQ2R0WVhBbkxGeHVJQ0J0WVhKck9pQW5iV0Z5YXljc1hHNGdJRzFsYm5VNklDZHRaVzUxSnl4Y2JpQWdiV1Z1ZFdsMFpXMDZJQ2R0Wlc1MWFYUmxiU2NzWEc0Z0lHMWxkR0U2SUNkdFpYUmhKeXhjYmlBZ2JXVjBaWEk2SUNkdFpYUmxjaWNzWEc0Z0lHNWhkam9nSjI1aGRpY3NYRzRnSUc1dmMyTnlhWEIwT2lBbmJtOXpZM0pwY0hRbkxGeHVJQ0J2WW1wbFkzUTZJQ2R2WW1wbFkzUW5MRnh1SUNCdmJEb2dKMjlzSnl4Y2JpQWdiM0IwWjNKdmRYQTZJQ2R2Y0hSbmNtOTFjQ2NzWEc0Z0lHOXdkR2x2YmpvZ0oyOXdkR2x2Ymljc1hHNGdJRzkxZEhCMWREb2dKMjkxZEhCMWRDY3NYRzRnSUhBNklDZHdKeXhjYmlBZ2NHRnlZVzA2SUNkd1lYSmhiU2NzWEc0Z0lIQnBZM1IxY21VNklDZHdhV04wZFhKbEp5eGNiaUFnY0hKbE9pQW5jSEpsSnl4Y2JpQWdjSEp2WjNKbGMzTTZJQ2R3Y205bmNtVnpjeWNzWEc0Z0lIRTZJQ2R4Snl4Y2JpQWdjbkE2SUNkeWNDY3NYRzRnSUhKME9pQW5jblFuTEZ4dUlDQnlkV0o1T2lBbmNuVmllU2NzWEc0Z0lITTZJQ2R6Snl4Y2JpQWdjMkZ0Y0RvZ0ozTmhiWEFuTEZ4dUlDQnpZM0pwY0hRNklDZHpZM0pwY0hRbkxGeHVJQ0J6WldOMGFXOXVPaUFuYzJWamRHbHZiaWNzWEc0Z0lITmxiR1ZqZERvZ0ozTmxiR1ZqZENjc1hHNGdJSE50WVd4c09pQW5jMjFoYkd3bkxGeHVJQ0J6YjNWeVkyVTZJQ2R6YjNWeVkyVW5MRnh1SUNCemNHRnVPaUFuYzNCaGJpY3NYRzRnSUhOMGNtOXVaem9nSjNOMGNtOXVaeWNzWEc0Z0lITjBlV3hsT2lBbmMzUjViR1VuTEZ4dUlDQnpkV0k2SUNkemRXSW5MRnh1SUNCemRXMXRZWEo1T2lBbmMzVnRiV0Z5ZVNjc1hHNGdJSE4xY0RvZ0ozTjFjQ2NzWEc0Z0lIUmhZbXhsT2lBbmRHRmliR1VuTEZ4dUlDQjBZbTlrZVRvZ0ozUmliMlI1Snl4Y2JpQWdkR1E2SUNkMFpDY3NYRzRnSUhSbGVIUmhjbVZoT2lBbmRHVjRkR0Z5WldFbkxGeHVJQ0IwWm05dmREb2dKM1JtYjI5MEp5eGNiaUFnZEdnNklDZDBhQ2NzWEc0Z0lIUm9aV0ZrT2lBbmRHaGxZV1FuTEZ4dUlDQjBhVzFsT2lBbmRHbHRaU2NzWEc0Z0lIUnBkR3hsT2lBbmRHbDBiR1VuTEZ4dUlDQjBjam9nSjNSeUp5eGNiaUFnZEhKaFkyczZJQ2QwY21GamF5Y3NYRzRnSUhVNklDZDFKeXhjYmlBZ2RXdzZJQ2QxYkNjc1hHNGdJQ2QyWVhJbk9pQW5kbUZ5Snl4Y2JpQWdkbWxrWlc4NklDZDJhV1JsYnljc1hHNGdJSGRpY2pvZ0ozZGljaWNzWEc1Y2JpQWdMeThnVTFaSFhHNGdJR05wY21Oc1pUb2dKMk5wY21Oc1pTY3NYRzRnSUdSbFpuTTZJQ2RrWldaekp5eGNiaUFnWld4c2FYQnpaVG9nSjJWc2JHbHdjMlVuTEZ4dUlDQm5PaUFuWnljc1hHNGdJR3hwYm1VNklDZHNhVzVsSnl4Y2JpQWdiR2x1WldGeVIzSmhaR2xsYm5RNklDZHNhVzVsWVhKSGNtRmthV1Z1ZENjc1hHNGdJRzFoYzJzNklDZHRZWE5ySnl4Y2JpQWdjR0YwYURvZ0ozQmhkR2duTEZ4dUlDQndZWFIwWlhKdU9pQW5jR0YwZEdWeWJpY3NYRzRnSUhCdmJIbG5iMjQ2SUNkd2IyeDVaMjl1Snl4Y2JpQWdjRzlzZVd4cGJtVTZJQ2R3YjJ4NWJHbHVaU2NzWEc0Z0lISmhaR2xoYkVkeVlXUnBaVzUwT2lBbmNtRmthV0ZzUjNKaFpHbGxiblFuTEZ4dUlDQnlaV04wT2lBbmNtVmpkQ2NzWEc0Z0lITjBiM0E2SUNkemRHOXdKeXhjYmlBZ2MzWm5PaUFuYzNabkp5eGNiaUFnZEdWNGREb2dKM1JsZUhRbkxGeHVJQ0IwYzNCaGJqb2dKM1J6Y0dGdUoxeHVYRzU5TENCamNtVmhkR1ZFVDAxR1lXTjBiM0o1S1R0Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQlNaV0ZqZEVSUFRUdGNiaUpkZlE9PSIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vKipcbiAqIENvcHlyaWdodCAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIFJlYWN0RWxlbWVudFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgUmVhY3RDb250ZXh0ID0gcmVxdWlyZShcIi4vUmVhY3RDb250ZXh0XCIpO1xudmFyIFJlYWN0Q3VycmVudE93bmVyID0gcmVxdWlyZShcIi4vUmVhY3RDdXJyZW50T3duZXJcIik7XG5cbnZhciB3YXJuaW5nID0gcmVxdWlyZShcIi4vd2FybmluZ1wiKTtcblxudmFyIFJFU0VSVkVEX1BST1BTID0ge1xuICBrZXk6IHRydWUsXG4gIHJlZjogdHJ1ZVxufTtcblxuLyoqXG4gKiBXYXJuIGZvciBtdXRhdGlvbnMuXG4gKlxuICogQGludGVybmFsXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gKi9cbmZ1bmN0aW9uIGRlZmluZVdhcm5pbmdQcm9wZXJ0eShvYmplY3QsIGtleSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBrZXksIHtcblxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcblxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuX3N0b3JlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3N0b3JlW2tleV07XG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyB3YXJuaW5nKFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJ0RvblxcJ3Qgc2V0IHRoZSAnICsga2V5ICsgJyBwcm9wZXJ0eSBvZiB0aGUgY29tcG9uZW50LiAnICtcbiAgICAgICAgJ011dGF0ZSB0aGUgZXhpc3RpbmcgcHJvcHMgb2JqZWN0IGluc3RlYWQuJ1xuICAgICAgKSA6IG51bGwpO1xuICAgICAgdGhpcy5fc3RvcmVba2V5XSA9IHZhbHVlO1xuICAgIH1cblxuICB9KTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIHVwZGF0ZWQgdG8gdHJ1ZSBpZiB0aGUgbWVtYnJhbmUgaXMgc3VjY2Vzc2Z1bGx5IGNyZWF0ZWQuXG4gKi9cbnZhciB1c2VNdXRhdGlvbk1lbWJyYW5lID0gZmFsc2U7XG5cbi8qKlxuICogV2FybiBmb3IgbXV0YXRpb25zLlxuICpcbiAqIEBpbnRlcm5hbFxuICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gZGVmaW5lTXV0YXRpb25NZW1icmFuZShwcm90b3R5cGUpIHtcbiAgdHJ5IHtcbiAgICB2YXIgcHNldWRvRnJvemVuUHJvcGVydGllcyA9IHtcbiAgICAgIHByb3BzOiB0cnVlXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHNldWRvRnJvemVuUHJvcGVydGllcykge1xuICAgICAgZGVmaW5lV2FybmluZ1Byb3BlcnR5KHByb3RvdHlwZSwga2V5KTtcbiAgICB9XG4gICAgdXNlTXV0YXRpb25NZW1icmFuZSA9IHRydWU7XG4gIH0gY2F0Y2ggKHgpIHtcbiAgICAvLyBJRSB3aWxsIGZhaWwgb24gZGVmaW5lUHJvcGVydHlcbiAgfVxufVxuXG4vKipcbiAqIEJhc2UgY29uc3RydWN0b3IgZm9yIGFsbCBSZWFjdCBlbGVtZW50cy4gVGhpcyBpcyBvbmx5IHVzZWQgdG8gbWFrZSB0aGlzXG4gKiB3b3JrIHdpdGggYSBkeW5hbWljIGluc3RhbmNlb2YgY2hlY2suIE5vdGhpbmcgc2hvdWxkIGxpdmUgb24gdGhpcyBwcm90b3R5cGUuXG4gKlxuICogQHBhcmFtIHsqfSB0eXBlXG4gKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHJlZlxuICogQHBhcmFtIHsqfSBrZXlcbiAqIEBwYXJhbSB7Kn0gcHJvcHNcbiAqIEBpbnRlcm5hbFxuICovXG52YXIgUmVhY3RFbGVtZW50ID0gZnVuY3Rpb24odHlwZSwga2V5LCByZWYsIG93bmVyLCBjb250ZXh0LCBwcm9wcykge1xuICAvLyBCdWlsdC1pbiBwcm9wZXJ0aWVzIHRoYXQgYmVsb25nIG9uIHRoZSBlbGVtZW50XG4gIHRoaXMudHlwZSA9IHR5cGU7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnJlZiA9IHJlZjtcblxuICAvLyBSZWNvcmQgdGhlIGNvbXBvbmVudCByZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgdGhpcyBlbGVtZW50LlxuICB0aGlzLl9vd25lciA9IG93bmVyO1xuXG4gIC8vIFRPRE86IERlcHJlY2F0ZSB3aXRoQ29udGV4dCwgYW5kIHRoZW4gdGhlIGNvbnRleHQgYmVjb21lcyBhY2Nlc3NpYmxlXG4gIC8vIHRocm91Z2ggdGhlIG93bmVyLlxuICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcblxuICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gICAgLy8gVGhlIHZhbGlkYXRpb24gZmxhZyBhbmQgcHJvcHMgYXJlIGN1cnJlbnRseSBtdXRhdGl2ZS4gV2UgcHV0IHRoZW0gb25cbiAgICAvLyBhbiBleHRlcm5hbCBiYWNraW5nIHN0b3JlIHNvIHRoYXQgd2UgY2FuIGZyZWV6ZSB0aGUgd2hvbGUgb2JqZWN0LlxuICAgIC8vIFRoaXMgY2FuIGJlIHJlcGxhY2VkIHdpdGggYSBXZWFrTWFwIG9uY2UgdGhleSBhcmUgaW1wbGVtZW50ZWQgaW5cbiAgICAvLyBjb21tb25seSB1c2VkIGRldmVsb3BtZW50IGVudmlyb25tZW50cy5cbiAgICB0aGlzLl9zdG9yZSA9IHsgdmFsaWRhdGVkOiBmYWxzZSwgcHJvcHM6IHByb3BzIH07XG5cbiAgICAvLyBXZSdyZSBub3QgYWxsb3dlZCB0byBzZXQgcHJvcHMgZGlyZWN0bHkgb24gdGhlIG9iamVjdCBzbyB3ZSBlYXJseVxuICAgIC8vIHJldHVybiBhbmQgcmVseSBvbiB0aGUgcHJvdG90eXBlIG1lbWJyYW5lIHRvIGZvcndhcmQgdG8gdGhlIGJhY2tpbmdcbiAgICAvLyBzdG9yZS5cbiAgICBpZiAodXNlTXV0YXRpb25NZW1icmFuZSkge1xuICAgICAgT2JqZWN0LmZyZWV6ZSh0aGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICB0aGlzLnByb3BzID0gcHJvcHM7XG59O1xuXG4vLyBXZSBpbnRlbnRpb25hbGx5IGRvbid0IGV4cG9zZSB0aGUgZnVuY3Rpb24gb24gdGhlIGNvbnN0cnVjdG9yIHByb3BlcnR5LlxuLy8gUmVhY3RFbGVtZW50IHNob3VsZCBiZSBpbmRpc3Rpbmd1aXNoYWJsZSBmcm9tIGEgcGxhaW4gb2JqZWN0LlxuUmVhY3RFbGVtZW50LnByb3RvdHlwZSA9IHtcbiAgX2lzUmVhY3RFbGVtZW50OiB0cnVlXG59O1xuXG5pZiAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WKSB7XG4gIGRlZmluZU11dGF0aW9uTWVtYnJhbmUoUmVhY3RFbGVtZW50LnByb3RvdHlwZSk7XG59XG5cblJlYWN0RWxlbWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24odHlwZSwgY29uZmlnLCBjaGlsZHJlbikge1xuICB2YXIgcHJvcE5hbWU7XG5cbiAgLy8gUmVzZXJ2ZWQgbmFtZXMgYXJlIGV4dHJhY3RlZFxuICB2YXIgcHJvcHMgPSB7fTtcblxuICB2YXIga2V5ID0gbnVsbDtcbiAgdmFyIHJlZiA9IG51bGw7XG5cbiAgaWYgKGNvbmZpZyAhPSBudWxsKSB7XG4gICAgcmVmID0gY29uZmlnLnJlZiA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGNvbmZpZy5yZWY7XG4gICAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgICAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IHdhcm5pbmcoXG4gICAgICAgIGNvbmZpZy5rZXkgIT09IG51bGwsXG4gICAgICAgICdjcmVhdGVFbGVtZW50KC4uLik6IEVuY291bnRlcmVkIGNvbXBvbmVudCB3aXRoIGEgYGtleWAgb2YgbnVsbC4gSW4gJyArXG4gICAgICAgICdhIGZ1dHVyZSB2ZXJzaW9uLCB0aGlzIHdpbGwgYmUgdHJlYXRlZCBhcyBlcXVpdmFsZW50IHRvIHRoZSBzdHJpbmcgJyArXG4gICAgICAgICdcXCdudWxsXFwnOyBpbnN0ZWFkLCBwcm92aWRlIGFuIGV4cGxpY2l0IGtleSBvciB1c2UgdW5kZWZpbmVkLidcbiAgICAgICkgOiBudWxsKTtcbiAgICB9XG4gICAgLy8gVE9ETzogQ2hhbmdlIHRoaXMgYmFjayB0byBgY29uZmlnLmtleSA9PT0gdW5kZWZpbmVkYFxuICAgIGtleSA9IGNvbmZpZy5rZXkgPT0gbnVsbCA/IG51bGwgOiAnJyArIGNvbmZpZy5rZXk7XG4gICAgLy8gUmVtYWluaW5nIHByb3BlcnRpZXMgYXJlIGFkZGVkIHRvIGEgbmV3IHByb3BzIG9iamVjdFxuICAgIGZvciAocHJvcE5hbWUgaW4gY29uZmlnKSB7XG4gICAgICBpZiAoY29uZmlnLmhhc093blByb3BlcnR5KHByb3BOYW1lKSAmJlxuICAgICAgICAgICFSRVNFUlZFRF9QUk9QUy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gY29uZmlnW3Byb3BOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDaGlsZHJlbiBjYW4gYmUgbW9yZSB0aGFuIG9uZSBhcmd1bWVudCwgYW5kIHRob3NlIGFyZSB0cmFuc2ZlcnJlZCBvbnRvXG4gIC8vIHRoZSBuZXdseSBhbGxvY2F0ZWQgcHJvcHMgb2JqZWN0LlxuICB2YXIgY2hpbGRyZW5MZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoIC0gMjtcbiAgaWYgKGNoaWxkcmVuTGVuZ3RoID09PSAxKSB7XG4gICAgcHJvcHMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfSBlbHNlIGlmIChjaGlsZHJlbkxlbmd0aCA+IDEpIHtcbiAgICB2YXIgY2hpbGRBcnJheSA9IEFycmF5KGNoaWxkcmVuTGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuTGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoaWxkQXJyYXlbaV0gPSBhcmd1bWVudHNbaSArIDJdO1xuICAgIH1cbiAgICBwcm9wcy5jaGlsZHJlbiA9IGNoaWxkQXJyYXk7XG4gIH1cblxuICAvLyBSZXNvbHZlIGRlZmF1bHQgcHJvcHNcbiAgaWYgKHR5cGUgJiYgdHlwZS5kZWZhdWx0UHJvcHMpIHtcbiAgICB2YXIgZGVmYXVsdFByb3BzID0gdHlwZS5kZWZhdWx0UHJvcHM7XG4gICAgZm9yIChwcm9wTmFtZSBpbiBkZWZhdWx0UHJvcHMpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvcHNbcHJvcE5hbWVdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBwcm9wc1twcm9wTmFtZV0gPSBkZWZhdWx0UHJvcHNbcHJvcE5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgUmVhY3RFbGVtZW50KFxuICAgIHR5cGUsXG4gICAga2V5LFxuICAgIHJlZixcbiAgICBSZWFjdEN1cnJlbnRPd25lci5jdXJyZW50LFxuICAgIFJlYWN0Q29udGV4dC5jdXJyZW50LFxuICAgIHByb3BzXG4gICk7XG59O1xuXG5SZWFjdEVsZW1lbnQuY3JlYXRlRmFjdG9yeSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGZhY3RvcnkgPSBSZWFjdEVsZW1lbnQuY3JlYXRlRWxlbWVudC5iaW5kKG51bGwsIHR5cGUpO1xuICAvLyBFeHBvc2UgdGhlIHR5cGUgb24gdGhlIGZhY3RvcnkgYW5kIHRoZSBwcm90b3R5cGUgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gZWFzaWx5IGFjY2Vzc2VkIG9uIGVsZW1lbnRzLiBFLmcuIDxGb28gLz4udHlwZSA9PT0gRm9vLnR5cGUuXG4gIC8vIFRoaXMgc2hvdWxkIG5vdCBiZSBuYW1lZCBgY29uc3RydWN0b3JgIHNpbmNlIHRoaXMgbWF5IG5vdCBiZSB0aGUgZnVuY3Rpb25cbiAgLy8gdGhhdCBjcmVhdGVkIHRoZSBlbGVtZW50LCBhbmQgaXQgbWF5IG5vdCBldmVuIGJlIGEgY29uc3RydWN0b3IuXG4gIGZhY3RvcnkudHlwZSA9IHR5cGU7XG4gIHJldHVybiBmYWN0b3J5O1xufTtcblxuUmVhY3RFbGVtZW50LmNsb25lQW5kUmVwbGFjZVByb3BzID0gZnVuY3Rpb24ob2xkRWxlbWVudCwgbmV3UHJvcHMpIHtcbiAgdmFyIG5ld0VsZW1lbnQgPSBuZXcgUmVhY3RFbGVtZW50KFxuICAgIG9sZEVsZW1lbnQudHlwZSxcbiAgICBvbGRFbGVtZW50LmtleSxcbiAgICBvbGRFbGVtZW50LnJlZixcbiAgICBvbGRFbGVtZW50Ll9vd25lcixcbiAgICBvbGRFbGVtZW50Ll9jb250ZXh0LFxuICAgIG5ld1Byb3BzXG4gICk7XG5cbiAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgIC8vIElmIHRoZSBrZXkgb24gdGhlIG9yaWdpbmFsIGlzIHZhbGlkLCB0aGVuIHRoZSBjbG9uZSBpcyB2YWxpZFxuICAgIG5ld0VsZW1lbnQuX3N0b3JlLnZhbGlkYXRlZCA9IG9sZEVsZW1lbnQuX3N0b3JlLnZhbGlkYXRlZDtcbiAgfVxuICByZXR1cm4gbmV3RWxlbWVudDtcbn07XG5cbi8qKlxuICogQHBhcmFtIHs/b2JqZWN0fSBvYmplY3RcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgYG9iamVjdGAgaXMgYSB2YWxpZCBjb21wb25lbnQuXG4gKiBAZmluYWxcbiAqL1xuUmVhY3RFbGVtZW50LmlzVmFsaWRFbGVtZW50ID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gIC8vIFJlYWN0VGVzdFV0aWxzIGlzIG9mdGVuIHVzZWQgb3V0c2lkZSBvZiBiZWZvcmVFYWNoIHdoZXJlIGFzIFJlYWN0IGlzXG4gIC8vIHdpdGhpbiBpdC4gVGhpcyBsZWFkcyB0byB0d28gZGlmZmVyZW50IGluc3RhbmNlcyBvZiBSZWFjdCBvbiB0aGUgc2FtZVxuICAvLyBwYWdlLiBUbyBpZGVudGlmeSBhIGVsZW1lbnQgZnJvbSBhIGRpZmZlcmVudCBSZWFjdCBpbnN0YW5jZSB3ZSB1c2VcbiAgLy8gYSBmbGFnIGluc3RlYWQgb2YgYW4gaW5zdGFuY2VvZiBjaGVjay5cbiAgdmFyIGlzRWxlbWVudCA9ICEhKG9iamVjdCAmJiBvYmplY3QuX2lzUmVhY3RFbGVtZW50KTtcbiAgLy8gaWYgKGlzRWxlbWVudCAmJiAhKG9iamVjdCBpbnN0YW5jZW9mIFJlYWN0RWxlbWVudCkpIHtcbiAgLy8gVGhpcyBpcyBhbiBpbmRpY2F0b3IgdGhhdCB5b3UncmUgdXNpbmcgbXVsdGlwbGUgdmVyc2lvbnMgb2YgUmVhY3QgYXQgdGhlXG4gIC8vIHNhbWUgdGltZS4gVGhpcyB3aWxsIHNjcmV3IHdpdGggb3duZXJzaGlwIGFuZCBzdHVmZi4gRml4IGl0LCBwbGVhc2UuXG4gIC8vIFRPRE86IFdlIGNvdWxkIHBvc3NpYmx5IHdhcm4gaGVyZS5cbiAgLy8gfVxuICByZXR1cm4gaXNFbGVtZW50O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdEVsZW1lbnQ7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXlaV0ZqZEM5c2FXSXZVbVZoWTNSRmJHVnRaVzUwTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaThxS2x4dUlDb2dRMjl3ZVhKcFoyaDBJREl3TVRRc0lFWmhZMlZpYjI5ckxDQkpibU11WEc0Z0tpQkJiR3dnY21sbmFIUnpJSEpsYzJWeWRtVmtMbHh1SUNwY2JpQXFJRlJvYVhNZ2MyOTFjbU5sSUdOdlpHVWdhWE1nYkdsalpXNXpaV1FnZFc1a1pYSWdkR2hsSUVKVFJDMXpkSGxzWlNCc2FXTmxibk5sSUdadmRXNWtJR2x1SUhSb1pWeHVJQ29nVEVsRFJVNVRSU0JtYVd4bElHbHVJSFJvWlNCeWIyOTBJR1JwY21WamRHOXllU0J2WmlCMGFHbHpJSE52ZFhKalpTQjBjbVZsTGlCQmJpQmhaR1JwZEdsdmJtRnNJR2R5WVc1MFhHNGdLaUJ2WmlCd1lYUmxiblFnY21sbmFIUnpJR05oYmlCaVpTQm1iM1Z1WkNCcGJpQjBhR1VnVUVGVVJVNVVVeUJtYVd4bElHbHVJSFJvWlNCellXMWxJR1JwY21WamRHOXllUzVjYmlBcVhHNGdLaUJBY0hKdmRtbGtaWE5OYjJSMWJHVWdVbVZoWTNSRmJHVnRaVzUwWEc0Z0tpOWNibHh1WENKMWMyVWdjM1J5YVdOMFhDSTdYRzVjYm5aaGNpQlNaV0ZqZEVOdmJuUmxlSFFnUFNCeVpYRjFhWEpsS0Z3aUxpOVNaV0ZqZEVOdmJuUmxlSFJjSWlrN1hHNTJZWElnVW1WaFkzUkRkWEp5Wlc1MFQzZHVaWElnUFNCeVpYRjFhWEpsS0Z3aUxpOVNaV0ZqZEVOMWNuSmxiblJQZDI1bGNsd2lLVHRjYmx4dWRtRnlJSGRoY201cGJtY2dQU0J5WlhGMWFYSmxLRndpTGk5M1lYSnVhVzVuWENJcE8xeHVYRzUyWVhJZ1VrVlRSVkpXUlVSZlVGSlBVRk1nUFNCN1hHNGdJR3RsZVRvZ2RISjFaU3hjYmlBZ2NtVm1PaUIwY25WbFhHNTlPMXh1WEc0dktpcGNiaUFxSUZkaGNtNGdabTl5SUcxMWRHRjBhVzl1Y3k1Y2JpQXFYRzRnS2lCQWFXNTBaWEp1WVd4Y2JpQXFJRUJ3WVhKaGJTQjdiMkpxWldOMGZTQnZZbXBsWTNSY2JpQXFJRUJ3WVhKaGJTQjdjM1J5YVc1bmZTQnJaWGxjYmlBcUwxeHVablZ1WTNScGIyNGdaR1ZtYVc1bFYyRnlibWx1WjFCeWIzQmxjblI1S0c5aWFtVmpkQ3dnYTJWNUtTQjdYRzRnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaHZZbXBsWTNRc0lHdGxlU3dnZTF4dVhHNGdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lCMGNuVmxMRnh1WEc0Z0lDQWdaMlYwT2lCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNBZ0lHbG1JQ2doZEdocGN5NWZjM1J2Y21VcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3c3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZmMzUnZjbVZiYTJWNVhUdGNiaUFnSUNCOUxGeHVYRzRnSUNBZ2MyVjBPaUJtZFc1amRHbHZiaWgyWVd4MVpTa2dlMXh1SUNBZ0lDQWdLRndpY0hKdlpIVmpkR2x2Ymx3aUlDRTlQU0J3Y205alpYTnpMbVZ1ZGk1T1QwUkZYMFZPVmlBL0lIZGhjbTVwYm1jb1hHNGdJQ0FnSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNBblJHOXVYRnduZENCelpYUWdkR2hsSUNjZ0t5QnJaWGtnS3lBbklIQnliM0JsY25SNUlHOW1JSFJvWlNCamIyMXdiMjVsYm5RdUlDY2dLMXh1SUNBZ0lDQWdJQ0FuVFhWMFlYUmxJSFJvWlNCbGVHbHpkR2x1WnlCd2NtOXdjeUJ2WW1wbFkzUWdhVzV6ZEdWaFpDNG5YRzRnSUNBZ0lDQXBJRG9nYm5Wc2JDazdYRzRnSUNBZ0lDQjBhR2x6TGw5emRHOXlaVnRyWlhsZElEMGdkbUZzZFdVN1hHNGdJQ0FnZlZ4dVhHNGdJSDBwTzF4dWZWeHVYRzR2S2lwY2JpQXFJRlJvYVhNZ2FYTWdkWEJrWVhSbFpDQjBieUIwY25WbElHbG1JSFJvWlNCdFpXMWljbUZ1WlNCcGN5QnpkV05qWlhOelpuVnNiSGtnWTNKbFlYUmxaQzVjYmlBcUwxeHVkbUZ5SUhWelpVMTFkR0YwYVc5dVRXVnRZbkpoYm1VZ1BTQm1ZV3h6WlR0Y2JseHVMeW9xWEc0Z0tpQlhZWEp1SUdadmNpQnRkWFJoZEdsdmJuTXVYRzRnS2x4dUlDb2dRR2x1ZEdWeWJtRnNYRzRnS2lCQWNHRnlZVzBnZTI5aWFtVmpkSDBnWld4bGJXVnVkRnh1SUNvdlhHNW1kVzVqZEdsdmJpQmtaV1pwYm1WTmRYUmhkR2x2YmsxbGJXSnlZVzVsS0hCeWIzUnZkSGx3WlNrZ2UxeHVJQ0IwY25rZ2UxeHVJQ0FnSUhaaGNpQndjMlYxWkc5R2NtOTZaVzVRY205d1pYSjBhV1Z6SUQwZ2UxeHVJQ0FnSUNBZ2NISnZjSE02SUhSeWRXVmNiaUFnSUNCOU8xeHVJQ0FnSUdadmNpQW9kbUZ5SUd0bGVTQnBiaUJ3YzJWMVpHOUdjbTk2Wlc1UWNtOXdaWEowYVdWektTQjdYRzRnSUNBZ0lDQmtaV1pwYm1WWFlYSnVhVzVuVUhKdmNHVnlkSGtvY0hKdmRHOTBlWEJsTENCclpYa3BPMXh1SUNBZ0lIMWNiaUFnSUNCMWMyVk5kWFJoZEdsdmJrMWxiV0p5WVc1bElEMGdkSEoxWlR0Y2JpQWdmU0JqWVhSamFDQW9lQ2tnZTF4dUlDQWdJQzh2SUVsRklIZHBiR3dnWm1GcGJDQnZiaUJrWldacGJtVlFjbTl3WlhKMGVWeHVJQ0I5WEc1OVhHNWNiaThxS2x4dUlDb2dRbUZ6WlNCamIyNXpkSEoxWTNSdmNpQm1iM0lnWVd4c0lGSmxZV04wSUdWc1pXMWxiblJ6TGlCVWFHbHpJR2x6SUc5dWJIa2dkWE5sWkNCMGJ5QnRZV3RsSUhSb2FYTmNiaUFxSUhkdmNtc2dkMmwwYUNCaElHUjVibUZ0YVdNZ2FXNXpkR0Z1WTJWdlppQmphR1ZqYXk0Z1RtOTBhR2x1WnlCemFHOTFiR1FnYkdsMlpTQnZiaUIwYUdseklIQnliM1J2ZEhsd1pTNWNiaUFxWEc0Z0tpQkFjR0Z5WVcwZ2V5cDlJSFI1Y0dWY2JpQXFJRUJ3WVhKaGJTQjdjM1J5YVc1bmZHOWlhbVZqZEgwZ2NtVm1YRzRnS2lCQWNHRnlZVzBnZXlwOUlHdGxlVnh1SUNvZ1FIQmhjbUZ0SUhzcWZTQndjbTl3YzF4dUlDb2dRR2x1ZEdWeWJtRnNYRzRnS2k5Y2JuWmhjaUJTWldGamRFVnNaVzFsYm5RZ1BTQm1kVzVqZEdsdmJpaDBlWEJsTENCclpYa3NJSEpsWml3Z2IzZHVaWElzSUdOdmJuUmxlSFFzSUhCeWIzQnpLU0I3WEc0Z0lDOHZJRUoxYVd4MExXbHVJSEJ5YjNCbGNuUnBaWE1nZEdoaGRDQmlaV3h2Ym1jZ2IyNGdkR2hsSUdWc1pXMWxiblJjYmlBZ2RHaHBjeTUwZVhCbElEMGdkSGx3WlR0Y2JpQWdkR2hwY3k1clpYa2dQU0JyWlhrN1hHNGdJSFJvYVhNdWNtVm1JRDBnY21WbU8xeHVYRzRnSUM4dklGSmxZMjl5WkNCMGFHVWdZMjl0Y0c5dVpXNTBJSEpsYzNCdmJuTnBZbXhsSUdadmNpQmpjbVZoZEdsdVp5QjBhR2x6SUdWc1pXMWxiblF1WEc0Z0lIUm9hWE11WDI5M2JtVnlJRDBnYjNkdVpYSTdYRzVjYmlBZ0x5OGdWRTlFVHpvZ1JHVndjbVZqWVhSbElIZHBkR2hEYjI1MFpYaDBMQ0JoYm1RZ2RHaGxiaUIwYUdVZ1kyOXVkR1Y0ZENCaVpXTnZiV1Z6SUdGalkyVnpjMmxpYkdWY2JpQWdMeThnZEdoeWIzVm5hQ0IwYUdVZ2IzZHVaWEl1WEc0Z0lIUm9hWE11WDJOdmJuUmxlSFFnUFNCamIyNTBaWGgwTzF4dVhHNGdJR2xtSUNoY0luQnliMlIxWTNScGIyNWNJaUFoUFQwZ2NISnZZMlZ6Y3k1bGJuWXVUazlFUlY5RlRsWXBJSHRjYmlBZ0lDQXZMeUJVYUdVZ2RtRnNhV1JoZEdsdmJpQm1iR0ZuSUdGdVpDQndjbTl3Y3lCaGNtVWdZM1Z5Y21WdWRHeDVJRzExZEdGMGFYWmxMaUJYWlNCd2RYUWdkR2hsYlNCdmJseHVJQ0FnSUM4dklHRnVJR1Y0ZEdWeWJtRnNJR0poWTJ0cGJtY2djM1J2Y21VZ2MyOGdkR2hoZENCM1pTQmpZVzRnWm5KbFpYcGxJSFJvWlNCM2FHOXNaU0J2WW1wbFkzUXVYRzRnSUNBZ0x5OGdWR2hwY3lCallXNGdZbVVnY21Wd2JHRmpaV1FnZDJsMGFDQmhJRmRsWVd0TllYQWdiMjVqWlNCMGFHVjVJR0Z5WlNCcGJYQnNaVzFsYm5SbFpDQnBibHh1SUNBZ0lDOHZJR052YlcxdmJteDVJSFZ6WldRZ1pHVjJaV3h2Y0cxbGJuUWdaVzUyYVhKdmJtMWxiblJ6TGx4dUlDQWdJSFJvYVhNdVgzTjBiM0psSUQwZ2V5QjJZV3hwWkdGMFpXUTZJR1poYkhObExDQndjbTl3Y3pvZ2NISnZjSE1nZlR0Y2JseHVJQ0FnSUM4dklGZGxKM0psSUc1dmRDQmhiR3h2ZDJWa0lIUnZJSE5sZENCd2NtOXdjeUJrYVhKbFkzUnNlU0J2YmlCMGFHVWdiMkpxWldOMElITnZJSGRsSUdWaGNteDVYRzRnSUNBZ0x5OGdjbVYwZFhKdUlHRnVaQ0J5Wld4NUlHOXVJSFJvWlNCd2NtOTBiM1I1Y0dVZ2JXVnRZbkpoYm1VZ2RHOGdabTl5ZDJGeVpDQjBieUIwYUdVZ1ltRmphMmx1WjF4dUlDQWdJQzh2SUhOMGIzSmxMbHh1SUNBZ0lHbG1JQ2gxYzJWTmRYUmhkR2x2YmsxbGJXSnlZVzVsS1NCN1hHNGdJQ0FnSUNCUFltcGxZM1F1Wm5KbFpYcGxLSFJvYVhNcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUhSb2FYTXVjSEp2Y0hNZ1BTQndjbTl3Y3p0Y2JuMDdYRzVjYmk4dklGZGxJR2x1ZEdWdWRHbHZibUZzYkhrZ1pHOXVKM1FnWlhod2IzTmxJSFJvWlNCbWRXNWpkR2x2YmlCdmJpQjBhR1VnWTI5dWMzUnlkV04wYjNJZ2NISnZjR1Z5ZEhrdVhHNHZMeUJTWldGamRFVnNaVzFsYm5RZ2MyaHZkV3hrSUdKbElHbHVaR2x6ZEdsdVozVnBjMmhoWW14bElHWnliMjBnWVNCd2JHRnBiaUJ2WW1wbFkzUXVYRzVTWldGamRFVnNaVzFsYm5RdWNISnZkRzkwZVhCbElEMGdlMXh1SUNCZmFYTlNaV0ZqZEVWc1pXMWxiblE2SUhSeWRXVmNibjA3WEc1Y2JtbG1JQ2hjSW5CeWIyUjFZM1JwYjI1Y0lpQWhQVDBnY0hKdlkyVnpjeTVsYm5ZdVRrOUVSVjlGVGxZcElIdGNiaUFnWkdWbWFXNWxUWFYwWVhScGIyNU5aVzFpY21GdVpTaFNaV0ZqZEVWc1pXMWxiblF1Y0hKdmRHOTBlWEJsS1R0Y2JuMWNibHh1VW1WaFkzUkZiR1Z0Wlc1MExtTnlaV0YwWlVWc1pXMWxiblFnUFNCbWRXNWpkR2x2YmloMGVYQmxMQ0JqYjI1bWFXY3NJR05vYVd4a2NtVnVLU0I3WEc0Z0lIWmhjaUJ3Y205d1RtRnRaVHRjYmx4dUlDQXZMeUJTWlhObGNuWmxaQ0J1WVcxbGN5QmhjbVVnWlhoMGNtRmpkR1ZrWEc0Z0lIWmhjaUJ3Y205d2N5QTlJSHQ5TzF4dVhHNGdJSFpoY2lCclpYa2dQU0J1ZFd4c08xeHVJQ0IyWVhJZ2NtVm1JRDBnYm5Wc2JEdGNibHh1SUNCcFppQW9ZMjl1Wm1sbklDRTlJRzUxYkd3cElIdGNiaUFnSUNCeVpXWWdQU0JqYjI1bWFXY3VjbVZtSUQwOVBTQjFibVJsWm1sdVpXUWdQeUJ1ZFd4c0lEb2dZMjl1Wm1sbkxuSmxaanRjYmlBZ0lDQnBaaUFvWENKd2NtOWtkV04wYVc5dVhDSWdJVDA5SUhCeWIyTmxjM011Wlc1MkxrNVBSRVZmUlU1V0tTQjdYRzRnSUNBZ0lDQW9YQ0p3Y205a2RXTjBhVzl1WENJZ0lUMDlJSEJ5YjJObGMzTXVaVzUyTGs1UFJFVmZSVTVXSUQ4Z2QyRnlibWx1WnloY2JpQWdJQ0FnSUNBZ1kyOXVabWxuTG10bGVTQWhQVDBnYm5Wc2JDeGNiaUFnSUNBZ0lDQWdKMk55WldGMFpVVnNaVzFsYm5Rb0xpNHVLVG9nUlc1amIzVnVkR1Z5WldRZ1kyOXRjRzl1Wlc1MElIZHBkR2dnWVNCZ2EyVjVZQ0J2WmlCdWRXeHNMaUJKYmlBbklDdGNiaUFnSUNBZ0lDQWdKMkVnWm5WMGRYSmxJSFpsY25OcGIyNHNJSFJvYVhNZ2QybHNiQ0JpWlNCMGNtVmhkR1ZrSUdGeklHVnhkV2wyWVd4bGJuUWdkRzhnZEdobElITjBjbWx1WnlBbklDdGNiaUFnSUNBZ0lDQWdKMXhjSjI1MWJHeGNYQ2M3SUdsdWMzUmxZV1FzSUhCeWIzWnBaR1VnWVc0Z1pYaHdiR2xqYVhRZ2EyVjVJRzl5SUhWelpTQjFibVJsWm1sdVpXUXVKMXh1SUNBZ0lDQWdLU0E2SUc1MWJHd3BPMXh1SUNBZ0lIMWNiaUFnSUNBdkx5QlVUMFJQT2lCRGFHRnVaMlVnZEdocGN5QmlZV05ySUhSdklHQmpiMjVtYVdjdWEyVjVJRDA5UFNCMWJtUmxabWx1WldSZ1hHNGdJQ0FnYTJWNUlEMGdZMjl1Wm1sbkxtdGxlU0E5UFNCdWRXeHNJRDhnYm5Wc2JDQTZJQ2NuSUNzZ1kyOXVabWxuTG10bGVUdGNiaUFnSUNBdkx5QlNaVzFoYVc1cGJtY2djSEp2Y0dWeWRHbGxjeUJoY21VZ1lXUmtaV1FnZEc4Z1lTQnVaWGNnY0hKdmNITWdiMkpxWldOMFhHNGdJQ0FnWm05eUlDaHdjbTl3VG1GdFpTQnBiaUJqYjI1bWFXY3BJSHRjYmlBZ0lDQWdJR2xtSUNoamIyNW1hV2N1YUdGelQzZHVVSEp2Y0dWeWRIa29jSEp2Y0U1aGJXVXBJQ1ltWEc0Z0lDQWdJQ0FnSUNBZ0lWSkZVMFZTVmtWRVgxQlNUMUJUTG1oaGMwOTNibEJ5YjNCbGNuUjVLSEJ5YjNCT1lXMWxLU2tnZTF4dUlDQWdJQ0FnSUNCd2NtOXdjMXR3Y205d1RtRnRaVjBnUFNCamIyNW1hV2RiY0hKdmNFNWhiV1ZkTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUM4dklFTm9hV3hrY21WdUlHTmhiaUJpWlNCdGIzSmxJSFJvWVc0Z2IyNWxJR0Z5WjNWdFpXNTBMQ0JoYm1RZ2RHaHZjMlVnWVhKbElIUnlZVzV6Wm1WeWNtVmtJRzl1ZEc5Y2JpQWdMeThnZEdobElHNWxkMng1SUdGc2JHOWpZWFJsWkNCd2NtOXdjeUJ2WW1wbFkzUXVYRzRnSUhaaGNpQmphR2xzWkhKbGJreGxibWQwYUNBOUlHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ0xTQXlPMXh1SUNCcFppQW9ZMmhwYkdSeVpXNU1aVzVuZEdnZ1BUMDlJREVwSUh0Y2JpQWdJQ0J3Y205d2N5NWphR2xzWkhKbGJpQTlJR05vYVd4a2NtVnVPMXh1SUNCOUlHVnNjMlVnYVdZZ0tHTm9hV3hrY21WdVRHVnVaM1JvSUQ0Z01Ta2dlMXh1SUNBZ0lIWmhjaUJqYUdsc1pFRnljbUY1SUQwZ1FYSnlZWGtvWTJocGJHUnlaVzVNWlc1bmRHZ3BPMXh1SUNBZ0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2dZMmhwYkdSeVpXNU1aVzVuZEdnN0lHa3JLeWtnZTF4dUlDQWdJQ0FnWTJocGJHUkJjbkpoZVZ0cFhTQTlJR0Z5WjNWdFpXNTBjMXRwSUNzZ01sMDdYRzRnSUNBZ2ZWeHVJQ0FnSUhCeWIzQnpMbU5vYVd4a2NtVnVJRDBnWTJocGJHUkJjbkpoZVR0Y2JpQWdmVnh1WEc0Z0lDOHZJRkpsYzI5c2RtVWdaR1ZtWVhWc2RDQndjbTl3YzF4dUlDQnBaaUFvZEhsd1pTQW1KaUIwZVhCbExtUmxabUYxYkhSUWNtOXdjeWtnZTF4dUlDQWdJSFpoY2lCa1pXWmhkV3gwVUhKdmNITWdQU0IwZVhCbExtUmxabUYxYkhSUWNtOXdjenRjYmlBZ0lDQm1iM0lnS0hCeWIzQk9ZVzFsSUdsdUlHUmxabUYxYkhSUWNtOXdjeWtnZTF4dUlDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCd2NtOXdjMXR3Y205d1RtRnRaVjBnUFQwOUlDZDFibVJsWm1sdVpXUW5LU0I3WEc0Z0lDQWdJQ0FnSUhCeWIzQnpXM0J5YjNCT1lXMWxYU0E5SUdSbFptRjFiSFJRY205d2MxdHdjbTl3VG1GdFpWMDdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHNWxkeUJTWldGamRFVnNaVzFsYm5Rb1hHNGdJQ0FnZEhsd1pTeGNiaUFnSUNCclpYa3NYRzRnSUNBZ2NtVm1MRnh1SUNBZ0lGSmxZV04wUTNWeWNtVnVkRTkzYm1WeUxtTjFjbkpsYm5Rc1hHNGdJQ0FnVW1WaFkzUkRiMjUwWlhoMExtTjFjbkpsYm5Rc1hHNGdJQ0FnY0hKdmNITmNiaUFnS1R0Y2JuMDdYRzVjYmxKbFlXTjBSV3hsYldWdWRDNWpjbVZoZEdWR1lXTjBiM0o1SUQwZ1puVnVZM1JwYjI0b2RIbHdaU2tnZTF4dUlDQjJZWElnWm1GamRHOXllU0E5SUZKbFlXTjBSV3hsYldWdWRDNWpjbVZoZEdWRmJHVnRaVzUwTG1KcGJtUW9iblZzYkN3Z2RIbHdaU2s3WEc0Z0lDOHZJRVY0Y0c5elpTQjBhR1VnZEhsd1pTQnZiaUIwYUdVZ1ptRmpkRzl5ZVNCaGJtUWdkR2hsSUhCeWIzUnZkSGx3WlNCemJ5QjBhR0YwSUdsMElHTmhiaUJpWlZ4dUlDQXZMeUJsWVhOcGJIa2dZV05qWlhOelpXUWdiMjRnWld4bGJXVnVkSE11SUVVdVp5NGdQRVp2YnlBdlBpNTBlWEJsSUQwOVBTQkdiMjh1ZEhsd1pTNWNiaUFnTHk4Z1ZHaHBjeUJ6YUc5MWJHUWdibTkwSUdKbElHNWhiV1ZrSUdCamIyNXpkSEoxWTNSdmNtQWdjMmx1WTJVZ2RHaHBjeUJ0WVhrZ2JtOTBJR0psSUhSb1pTQm1kVzVqZEdsdmJseHVJQ0F2THlCMGFHRjBJR055WldGMFpXUWdkR2hsSUdWc1pXMWxiblFzSUdGdVpDQnBkQ0J0WVhrZ2JtOTBJR1YyWlc0Z1ltVWdZU0JqYjI1emRISjFZM1J2Y2k1Y2JpQWdabUZqZEc5eWVTNTBlWEJsSUQwZ2RIbHdaVHRjYmlBZ2NtVjBkWEp1SUdaaFkzUnZjbms3WEc1OU8xeHVYRzVTWldGamRFVnNaVzFsYm5RdVkyeHZibVZCYm1SU1pYQnNZV05sVUhKdmNITWdQU0JtZFc1amRHbHZiaWh2YkdSRmJHVnRaVzUwTENCdVpYZFFjbTl3Y3lrZ2UxeHVJQ0IyWVhJZ2JtVjNSV3hsYldWdWRDQTlJRzVsZHlCU1pXRmpkRVZzWlcxbGJuUW9YRzRnSUNBZ2IyeGtSV3hsYldWdWRDNTBlWEJsTEZ4dUlDQWdJRzlzWkVWc1pXMWxiblF1YTJWNUxGeHVJQ0FnSUc5c1pFVnNaVzFsYm5RdWNtVm1MRnh1SUNBZ0lHOXNaRVZzWlcxbGJuUXVYMjkzYm1WeUxGeHVJQ0FnSUc5c1pFVnNaVzFsYm5RdVgyTnZiblJsZUhRc1hHNGdJQ0FnYm1WM1VISnZjSE5jYmlBZ0tUdGNibHh1SUNCcFppQW9YQ0p3Y205a2RXTjBhVzl1WENJZ0lUMDlJSEJ5YjJObGMzTXVaVzUyTGs1UFJFVmZSVTVXS1NCN1hHNGdJQ0FnTHk4Z1NXWWdkR2hsSUd0bGVTQnZiaUIwYUdVZ2IzSnBaMmx1WVd3Z2FYTWdkbUZzYVdRc0lIUm9aVzRnZEdobElHTnNiMjVsSUdseklIWmhiR2xrWEc0Z0lDQWdibVYzUld4bGJXVnVkQzVmYzNSdmNtVXVkbUZzYVdSaGRHVmtJRDBnYjJ4a1JXeGxiV1Z1ZEM1ZmMzUnZjbVV1ZG1Gc2FXUmhkR1ZrTzF4dUlDQjlYRzRnSUhKbGRIVnliaUJ1WlhkRmJHVnRaVzUwTzF4dWZUdGNibHh1THlvcVhHNGdLaUJBY0dGeVlXMGdlejl2WW1wbFkzUjlJRzlpYW1WamRGeHVJQ29nUUhKbGRIVnliaUI3WW05dmJHVmhibjBnVkhKMVpTQnBaaUJnYjJKcVpXTjBZQ0JwY3lCaElIWmhiR2xrSUdOdmJYQnZibVZ1ZEM1Y2JpQXFJRUJtYVc1aGJGeHVJQ292WEc1U1pXRmpkRVZzWlcxbGJuUXVhWE5XWVd4cFpFVnNaVzFsYm5RZ1BTQm1kVzVqZEdsdmJpaHZZbXBsWTNRcElIdGNiaUFnTHk4Z1VtVmhZM1JVWlhOMFZYUnBiSE1nYVhNZ2IyWjBaVzRnZFhObFpDQnZkWFJ6YVdSbElHOW1JR0psWm05eVpVVmhZMmdnZDJobGNtVWdZWE1nVW1WaFkzUWdhWE5jYmlBZ0x5OGdkMmwwYUdsdUlHbDBMaUJVYUdseklHeGxZV1J6SUhSdklIUjNieUJrYVdabVpYSmxiblFnYVc1emRHRnVZMlZ6SUc5bUlGSmxZV04wSUc5dUlIUm9aU0J6WVcxbFhHNGdJQzh2SUhCaFoyVXVJRlJ2SUdsa1pXNTBhV1o1SUdFZ1pXeGxiV1Z1ZENCbWNtOXRJR0VnWkdsbVptVnlaVzUwSUZKbFlXTjBJR2x1YzNSaGJtTmxJSGRsSUhWelpWeHVJQ0F2THlCaElHWnNZV2NnYVc1emRHVmhaQ0J2WmlCaGJpQnBibk4wWVc1alpXOW1JR05vWldOckxseHVJQ0IyWVhJZ2FYTkZiR1Z0Wlc1MElEMGdJU0VvYjJKcVpXTjBJQ1ltSUc5aWFtVmpkQzVmYVhOU1pXRmpkRVZzWlcxbGJuUXBPMXh1SUNBdkx5QnBaaUFvYVhORmJHVnRaVzUwSUNZbUlDRW9iMkpxWldOMElHbHVjM1JoYm1ObGIyWWdVbVZoWTNSRmJHVnRaVzUwS1NrZ2UxeHVJQ0F2THlCVWFHbHpJR2x6SUdGdUlHbHVaR2xqWVhSdmNpQjBhR0YwSUhsdmRTZHlaU0IxYzJsdVp5QnRkV3gwYVhCc1pTQjJaWEp6YVc5dWN5QnZaaUJTWldGamRDQmhkQ0IwYUdWY2JpQWdMeThnYzJGdFpTQjBhVzFsTGlCVWFHbHpJSGRwYkd3Z2MyTnlaWGNnZDJsMGFDQnZkMjVsY25Ob2FYQWdZVzVrSUhOMGRXWm1MaUJHYVhnZ2FYUXNJSEJzWldGelpTNWNiaUFnTHk4Z1ZFOUVUem9nVjJVZ1kyOTFiR1FnY0c5emMybGliSGtnZDJGeWJpQm9aWEpsTGx4dUlDQXZMeUI5WEc0Z0lISmxkSFZ5YmlCcGMwVnNaVzFsYm5RN1hHNTlPMXh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUZKbFlXTjBSV3hsYldWdWREdGNiaUpkZlE9PSIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vKipcbiAqIENvcHlyaWdodCAyMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIFJlYWN0RWxlbWVudFZhbGlkYXRvclxuICovXG5cbi8qKlxuICogUmVhY3RFbGVtZW50VmFsaWRhdG9yIHByb3ZpZGVzIGEgd3JhcHBlciBhcm91bmQgYSBlbGVtZW50IGZhY3RvcnlcbiAqIHdoaWNoIHZhbGlkYXRlcyB0aGUgcHJvcHMgcGFzc2VkIHRvIHRoZSBlbGVtZW50LiBUaGlzIGlzIGludGVuZGVkIHRvIGJlXG4gKiB1c2VkIG9ubHkgaW4gREVWIGFuZCBjb3VsZCBiZSByZXBsYWNlZCBieSBhIHN0YXRpYyB0eXBlIGNoZWNrZXIgZm9yIGxhbmd1YWdlc1xuICogdGhhdCBzdXBwb3J0IGl0LlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgUmVhY3RFbGVtZW50ID0gcmVxdWlyZShcIi4vUmVhY3RFbGVtZW50XCIpO1xudmFyIFJlYWN0UHJvcFR5cGVMb2NhdGlvbnMgPSByZXF1aXJlKFwiLi9SZWFjdFByb3BUeXBlTG9jYXRpb25zXCIpO1xudmFyIFJlYWN0Q3VycmVudE93bmVyID0gcmVxdWlyZShcIi4vUmVhY3RDdXJyZW50T3duZXJcIik7XG5cbnZhciBtb25pdG9yQ29kZVVzZSA9IHJlcXVpcmUoXCIuL21vbml0b3JDb2RlVXNlXCIpO1xudmFyIHdhcm5pbmcgPSByZXF1aXJlKFwiLi93YXJuaW5nXCIpO1xuXG4vKipcbiAqIFdhcm4gaWYgdGhlcmUncyBubyBrZXkgZXhwbGljaXRseSBzZXQgb24gZHluYW1pYyBhcnJheXMgb2YgY2hpbGRyZW4gb3JcbiAqIG9iamVjdCBrZXlzIGFyZSBub3QgdmFsaWQuIFRoaXMgYWxsb3dzIHVzIHRvIGtlZXAgdHJhY2sgb2YgY2hpbGRyZW4gYmV0d2VlblxuICogdXBkYXRlcy5cbiAqL1xudmFyIG93bmVySGFzS2V5VXNlV2FybmluZyA9IHtcbiAgJ3JlYWN0X2tleV93YXJuaW5nJzoge30sXG4gICdyZWFjdF9udW1lcmljX2tleV93YXJuaW5nJzoge31cbn07XG52YXIgb3duZXJIYXNNb25pdG9yZWRPYmplY3RNYXAgPSB7fTtcblxudmFyIGxvZ2dlZFR5cGVGYWlsdXJlcyA9IHt9O1xuXG52YXIgTlVNRVJJQ19QUk9QRVJUWV9SRUdFWCA9IC9eXFxkKyQvO1xuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnQgb3duZXIncyBkaXNwbGF5TmFtZSBmb3IgdXNlIGluIHdhcm5pbmdzLlxuICpcbiAqIEBpbnRlcm5hbFxuICogQHJldHVybiB7P3N0cmluZ30gRGlzcGxheSBuYW1lIG9yIHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBnZXRDdXJyZW50T3duZXJEaXNwbGF5TmFtZSgpIHtcbiAgdmFyIGN1cnJlbnQgPSBSZWFjdEN1cnJlbnRPd25lci5jdXJyZW50O1xuICByZXR1cm4gY3VycmVudCAmJiBjdXJyZW50LmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIHx8IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBXYXJuIGlmIHRoZSBjb21wb25lbnQgZG9lc24ndCBoYXZlIGFuIGV4cGxpY2l0IGtleSBhc3NpZ25lZCB0byBpdC5cbiAqIFRoaXMgY29tcG9uZW50IGlzIGluIGFuIGFycmF5LiBUaGUgYXJyYXkgY291bGQgZ3JvdyBhbmQgc2hyaW5rIG9yIGJlXG4gKiByZW9yZGVyZWQuIEFsbCBjaGlsZHJlbiB0aGF0IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIHZhbGlkYXRlZCBhcmUgcmVxdWlyZWQgdG9cbiAqIGhhdmUgYSBcImtleVwiIHByb3BlcnR5IGFzc2lnbmVkIHRvIGl0LlxuICpcbiAqIEBpbnRlcm5hbFxuICogQHBhcmFtIHtSZWFjdENvbXBvbmVudH0gY29tcG9uZW50IENvbXBvbmVudCB0aGF0IHJlcXVpcmVzIGEga2V5LlxuICogQHBhcmFtIHsqfSBwYXJlbnRUeXBlIGNvbXBvbmVudCdzIHBhcmVudCdzIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlRXhwbGljaXRLZXkoY29tcG9uZW50LCBwYXJlbnRUeXBlKSB7XG4gIGlmIChjb21wb25lbnQuX3N0b3JlLnZhbGlkYXRlZCB8fCBjb21wb25lbnQua2V5ICE9IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29tcG9uZW50Ll9zdG9yZS52YWxpZGF0ZWQgPSB0cnVlO1xuXG4gIHdhcm5BbmRNb25pdG9yRm9yS2V5VXNlKFxuICAgICdyZWFjdF9rZXlfd2FybmluZycsXG4gICAgJ0VhY2ggY2hpbGQgaW4gYW4gYXJyYXkgc2hvdWxkIGhhdmUgYSB1bmlxdWUgXCJrZXlcIiBwcm9wLicsXG4gICAgY29tcG9uZW50LFxuICAgIHBhcmVudFR5cGVcbiAgKTtcbn1cblxuLyoqXG4gKiBXYXJuIGlmIHRoZSBrZXkgaXMgYmVpbmcgZGVmaW5lZCBhcyBhbiBvYmplY3QgcHJvcGVydHkgYnV0IGhhcyBhbiBpbmNvcnJlY3RcbiAqIHZhbHVlLlxuICpcbiAqIEBpbnRlcm5hbFxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgUHJvcGVydHkgbmFtZSBvZiB0aGUga2V5LlxuICogQHBhcmFtIHtSZWFjdENvbXBvbmVudH0gY29tcG9uZW50IENvbXBvbmVudCB0aGF0IHJlcXVpcmVzIGEga2V5LlxuICogQHBhcmFtIHsqfSBwYXJlbnRUeXBlIGNvbXBvbmVudCdzIHBhcmVudCdzIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcGVydHlLZXkobmFtZSwgY29tcG9uZW50LCBwYXJlbnRUeXBlKSB7XG4gIGlmICghTlVNRVJJQ19QUk9QRVJUWV9SRUdFWC50ZXN0KG5hbWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHdhcm5BbmRNb25pdG9yRm9yS2V5VXNlKFxuICAgICdyZWFjdF9udW1lcmljX2tleV93YXJuaW5nJyxcbiAgICAnQ2hpbGQgb2JqZWN0cyBzaG91bGQgaGF2ZSBub24tbnVtZXJpYyBrZXlzIHNvIG9yZGVyaW5nIGlzIHByZXNlcnZlZC4nLFxuICAgIGNvbXBvbmVudCxcbiAgICBwYXJlbnRUeXBlXG4gICk7XG59XG5cbi8qKlxuICogU2hhcmVkIHdhcm5pbmcgYW5kIG1vbml0b3JpbmcgY29kZSBmb3IgdGhlIGtleSB3YXJuaW5ncy5cbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwYXJhbSB7c3RyaW5nfSB3YXJuaW5nSUQgVGhlIGlkIHVzZWQgd2hlbiBsb2dnaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgVGhlIGJhc2Ugd2FybmluZyB0aGF0IGdldHMgb3V0cHV0LlxuICogQHBhcmFtIHtSZWFjdENvbXBvbmVudH0gY29tcG9uZW50IENvbXBvbmVudCB0aGF0IHJlcXVpcmVzIGEga2V5LlxuICogQHBhcmFtIHsqfSBwYXJlbnRUeXBlIGNvbXBvbmVudCdzIHBhcmVudCdzIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIHdhcm5BbmRNb25pdG9yRm9yS2V5VXNlKHdhcm5pbmdJRCwgbWVzc2FnZSwgY29tcG9uZW50LCBwYXJlbnRUeXBlKSB7XG4gIHZhciBvd25lck5hbWUgPSBnZXRDdXJyZW50T3duZXJEaXNwbGF5TmFtZSgpO1xuICB2YXIgcGFyZW50TmFtZSA9IHBhcmVudFR5cGUuZGlzcGxheU5hbWU7XG5cbiAgdmFyIHVzZU5hbWUgPSBvd25lck5hbWUgfHwgcGFyZW50TmFtZTtcbiAgdmFyIG1lbW9pemVyID0gb3duZXJIYXNLZXlVc2VXYXJuaW5nW3dhcm5pbmdJRF07XG4gIGlmIChtZW1vaXplci5oYXNPd25Qcm9wZXJ0eSh1c2VOYW1lKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBtZW1vaXplclt1c2VOYW1lXSA9IHRydWU7XG5cbiAgbWVzc2FnZSArPSBvd25lck5hbWUgP1xuICAgIChcIiBDaGVjayB0aGUgcmVuZGVyIG1ldGhvZCBvZiBcIiArIG93bmVyTmFtZSArIFwiLlwiKSA6XG4gICAgKFwiIENoZWNrIHRoZSByZW5kZXJDb21wb25lbnQgY2FsbCB1c2luZyA8XCIgKyBwYXJlbnROYW1lICsgXCI+LlwiKTtcblxuICAvLyBVc3VhbGx5IHRoZSBjdXJyZW50IG93bmVyIGlzIHRoZSBvZmZlbmRlciwgYnV0IGlmIGl0IGFjY2VwdHMgY2hpbGRyZW4gYXMgYVxuICAvLyBwcm9wZXJ0eSwgaXQgbWF5IGJlIHRoZSBjcmVhdG9yIG9mIHRoZSBjaGlsZCB0aGF0J3MgcmVzcG9uc2libGUgZm9yXG4gIC8vIGFzc2lnbmluZyBpdCBhIGtleS5cbiAgdmFyIGNoaWxkT3duZXJOYW1lID0gbnVsbDtcbiAgaWYgKGNvbXBvbmVudC5fb3duZXIgJiYgY29tcG9uZW50Ll9vd25lciAhPT0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudCkge1xuICAgIC8vIE5hbWUgb2YgdGhlIGNvbXBvbmVudCB0aGF0IG9yaWdpbmFsbHkgY3JlYXRlZCB0aGlzIGNoaWxkLlxuICAgIGNoaWxkT3duZXJOYW1lID0gY29tcG9uZW50Ll9vd25lci5jb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZTtcblxuICAgIG1lc3NhZ2UgKz0gKFwiIEl0IHdhcyBwYXNzZWQgYSBjaGlsZCBmcm9tIFwiICsgY2hpbGRPd25lck5hbWUgKyBcIi5cIik7XG4gIH1cblxuICBtZXNzYWdlICs9ICcgU2VlIGh0dHA6Ly9mYi5tZS9yZWFjdC13YXJuaW5nLWtleXMgZm9yIG1vcmUgaW5mb3JtYXRpb24uJztcbiAgbW9uaXRvckNvZGVVc2Uod2FybmluZ0lELCB7XG4gICAgY29tcG9uZW50OiB1c2VOYW1lLFxuICAgIGNvbXBvbmVudE93bmVyOiBjaGlsZE93bmVyTmFtZVxuICB9KTtcbiAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIExvZyB0aGF0IHdlJ3JlIHVzaW5nIGFuIG9iamVjdCBtYXAuIFdlJ3JlIGNvbnNpZGVyaW5nIGRlcHJlY2F0aW5nIHRoaXNcbiAqIGZlYXR1cmUgYW5kIHJlcGxhY2UgaXQgd2l0aCBwcm9wZXIgTWFwIGFuZCBJbW11dGFibGVNYXAgZGF0YSBzdHJ1Y3R1cmVzLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5mdW5jdGlvbiBtb25pdG9yVXNlT2ZPYmplY3RNYXAoKSB7XG4gIHZhciBjdXJyZW50TmFtZSA9IGdldEN1cnJlbnRPd25lckRpc3BsYXlOYW1lKCkgfHwgJyc7XG4gIGlmIChvd25lckhhc01vbml0b3JlZE9iamVjdE1hcC5oYXNPd25Qcm9wZXJ0eShjdXJyZW50TmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgb3duZXJIYXNNb25pdG9yZWRPYmplY3RNYXBbY3VycmVudE5hbWVdID0gdHJ1ZTtcbiAgbW9uaXRvckNvZGVVc2UoJ3JlYWN0X29iamVjdF9tYXBfY2hpbGRyZW4nKTtcbn1cblxuLyoqXG4gKiBFbnN1cmUgdGhhdCBldmVyeSBjb21wb25lbnQgZWl0aGVyIGlzIHBhc3NlZCBpbiBhIHN0YXRpYyBsb2NhdGlvbiwgaW4gYW5cbiAqIGFycmF5IHdpdGggYW4gZXhwbGljaXQga2V5cyBwcm9wZXJ0eSBkZWZpbmVkLCBvciBpbiBhbiBvYmplY3QgbGl0ZXJhbFxuICogd2l0aCB2YWxpZCBrZXkgcHJvcGVydHkuXG4gKlxuICogQGludGVybmFsXG4gKiBAcGFyYW0geyp9IGNvbXBvbmVudCBTdGF0aWNhbGx5IHBhc3NlZCBjaGlsZCBvZiBhbnkgdHlwZS5cbiAqIEBwYXJhbSB7Kn0gcGFyZW50VHlwZSBjb21wb25lbnQncyBwYXJlbnQncyB0eXBlLlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDaGlsZEtleXMoY29tcG9uZW50LCBwYXJlbnRUeXBlKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudCkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbXBvbmVudC5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoaWxkID0gY29tcG9uZW50W2ldO1xuICAgICAgaWYgKFJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudChjaGlsZCkpIHtcbiAgICAgICAgdmFsaWRhdGVFeHBsaWNpdEtleShjaGlsZCwgcGFyZW50VHlwZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKFJlYWN0RWxlbWVudC5pc1ZhbGlkRWxlbWVudChjb21wb25lbnQpKSB7XG4gICAgLy8gVGhpcyBjb21wb25lbnQgd2FzIHBhc3NlZCBpbiBhIHZhbGlkIGxvY2F0aW9uLlxuICAgIGNvbXBvbmVudC5fc3RvcmUudmFsaWRhdGVkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChjb21wb25lbnQgJiYgdHlwZW9mIGNvbXBvbmVudCA9PT0gJ29iamVjdCcpIHtcbiAgICBtb25pdG9yVXNlT2ZPYmplY3RNYXAoKTtcbiAgICBmb3IgKHZhciBuYW1lIGluIGNvbXBvbmVudCkge1xuICAgICAgdmFsaWRhdGVQcm9wZXJ0eUtleShuYW1lLCBjb21wb25lbnRbbmFtZV0sIHBhcmVudFR5cGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFzc2VydCB0aGF0IHRoZSBwcm9wcyBhcmUgdmFsaWRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tcG9uZW50TmFtZSBOYW1lIG9mIHRoZSBjb21wb25lbnQgZm9yIGVycm9yIG1lc3NhZ2VzLlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BUeXBlcyBNYXAgb2YgcHJvcCBuYW1lIHRvIGEgUmVhY3RQcm9wVHlwZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYXRpb24gZS5nLiBcInByb3BcIiwgXCJjb250ZXh0XCIsIFwiY2hpbGQgY29udGV4dFwiXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjaGVja1Byb3BUeXBlcyhjb21wb25lbnROYW1lLCBwcm9wVHlwZXMsIHByb3BzLCBsb2NhdGlvbikge1xuICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wVHlwZXMpIHtcbiAgICBpZiAocHJvcFR5cGVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgdmFyIGVycm9yO1xuICAgICAgLy8gUHJvcCB0eXBlIHZhbGlkYXRpb24gbWF5IHRocm93LiBJbiBjYXNlIHRoZXkgZG8sIHdlIGRvbid0IHdhbnQgdG9cbiAgICAgIC8vIGZhaWwgdGhlIHJlbmRlciBwaGFzZSB3aGVyZSBpdCBkaWRuJ3QgZmFpbCBiZWZvcmUuIFNvIHdlIGxvZyBpdC5cbiAgICAgIC8vIEFmdGVyIHRoZXNlIGhhdmUgYmVlbiBjbGVhbmVkIHVwLCB3ZSdsbCBsZXQgdGhlbSB0aHJvdy5cbiAgICAgIHRyeSB7XG4gICAgICAgIGVycm9yID0gcHJvcFR5cGVzW3Byb3BOYW1lXShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGVycm9yID0gZXg7XG4gICAgICB9XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiAhKGVycm9yLm1lc3NhZ2UgaW4gbG9nZ2VkVHlwZUZhaWx1cmVzKSkge1xuICAgICAgICAvLyBPbmx5IG1vbml0b3IgdGhpcyBmYWlsdXJlIG9uY2UgYmVjYXVzZSB0aGVyZSB0ZW5kcyB0byBiZSBhIGxvdCBvZiB0aGVcbiAgICAgICAgLy8gc2FtZSBlcnJvci5cbiAgICAgICAgbG9nZ2VkVHlwZUZhaWx1cmVzW2Vycm9yLm1lc3NhZ2VdID0gdHJ1ZTtcbiAgICAgICAgLy8gVGhpcyB3aWxsIHNvb24gdXNlIHRoZSB3YXJuaW5nIG1vZHVsZVxuICAgICAgICBtb25pdG9yQ29kZVVzZShcbiAgICAgICAgICAncmVhY3RfZmFpbGVkX2Rlc2NyaXB0b3JfdHlwZV9jaGVjaycsXG4gICAgICAgICAgeyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxudmFyIFJlYWN0RWxlbWVudFZhbGlkYXRvciA9IHtcblxuICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbih0eXBlLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgICAvLyBXZSB3YXJuIGluIHRoaXMgY2FzZSBidXQgZG9uJ3QgdGhyb3cuIFdlIGV4cGVjdCB0aGUgZWxlbWVudCBjcmVhdGlvbiB0b1xuICAgIC8vIHN1Y2NlZWQgYW5kIHRoZXJlIHdpbGwgbGlrZWx5IGJlIGVycm9ycyBpbiByZW5kZXIuXG4gICAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IHdhcm5pbmcoXG4gICAgICB0eXBlICE9IG51bGwsXG4gICAgICAnUmVhY3QuY3JlYXRlRWxlbWVudDogdHlwZSBzaG91bGQgbm90IGJlIG51bGwgb3IgdW5kZWZpbmVkLiBJdCBzaG91bGQgJyArXG4gICAgICAgICdiZSBhIHN0cmluZyAoZm9yIERPTSBlbGVtZW50cykgb3IgYSBSZWFjdENsYXNzIChmb3IgY29tcG9zaXRlICcgK1xuICAgICAgICAnY29tcG9uZW50cykuJ1xuICAgICkgOiBudWxsKTtcblxuICAgIHZhciBlbGVtZW50ID0gUmVhY3RFbGVtZW50LmNyZWF0ZUVsZW1lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIFRoZSByZXN1bHQgY2FuIGJlIG51bGxpc2ggaWYgYSBtb2NrIG9yIGEgY3VzdG9tIGZ1bmN0aW9uIGlzIHVzZWQuXG4gICAgLy8gVE9ETzogRHJvcCB0aGlzIHdoZW4gdGhlc2UgYXJlIG5vIGxvbmdlciBhbGxvd2VkIGFzIHRoZSB0eXBlIGFyZ3VtZW50LlxuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAyOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWxpZGF0ZUNoaWxkS2V5cyhhcmd1bWVudHNbaV0sIHR5cGUpO1xuICAgIH1cblxuICAgIGlmICh0eXBlKSB7XG4gICAgICB2YXIgbmFtZSA9IHR5cGUuZGlzcGxheU5hbWU7XG4gICAgICBpZiAodHlwZS5wcm9wVHlwZXMpIHtcbiAgICAgICAgY2hlY2tQcm9wVHlwZXMoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB0eXBlLnByb3BUeXBlcyxcbiAgICAgICAgICBlbGVtZW50LnByb3BzLFxuICAgICAgICAgIFJlYWN0UHJvcFR5cGVMb2NhdGlvbnMucHJvcFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGUuY29udGV4dFR5cGVzKSB7XG4gICAgICAgIGNoZWNrUHJvcFR5cGVzKFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdHlwZS5jb250ZXh0VHlwZXMsXG4gICAgICAgICAgZWxlbWVudC5fY29udGV4dCxcbiAgICAgICAgICBSZWFjdFByb3BUeXBlTG9jYXRpb25zLmNvbnRleHRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0sXG5cbiAgY3JlYXRlRmFjdG9yeTogZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciB2YWxpZGF0ZWRGYWN0b3J5ID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yLmNyZWF0ZUVsZW1lbnQuYmluZChcbiAgICAgIG51bGwsXG4gICAgICB0eXBlXG4gICAgKTtcbiAgICB2YWxpZGF0ZWRGYWN0b3J5LnR5cGUgPSB0eXBlO1xuICAgIHJldHVybiB2YWxpZGF0ZWRGYWN0b3J5O1xuICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RFbGVtZW50VmFsaWRhdG9yO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl5WldGamRDOXNhV0l2VW1WaFkzUkZiR1Z0Wlc1MFZtRnNhV1JoZEc5eUxtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSURJd01UUXNJRVpoWTJWaWIyOXJMQ0JKYm1NdVhHNGdLaUJCYkd3Z2NtbG5hSFJ6SUhKbGMyVnlkbVZrTGx4dUlDcGNiaUFxSUZSb2FYTWdjMjkxY21ObElHTnZaR1VnYVhNZ2JHbGpaVzV6WldRZ2RXNWtaWElnZEdobElFSlRSQzF6ZEhsc1pTQnNhV05sYm5ObElHWnZkVzVrSUdsdUlIUm9aVnh1SUNvZ1RFbERSVTVUUlNCbWFXeGxJR2x1SUhSb1pTQnliMjkwSUdScGNtVmpkRzl5ZVNCdlppQjBhR2x6SUhOdmRYSmpaU0IwY21WbExpQkJiaUJoWkdScGRHbHZibUZzSUdkeVlXNTBYRzRnS2lCdlppQndZWFJsYm5RZ2NtbG5hSFJ6SUdOaGJpQmlaU0JtYjNWdVpDQnBiaUIwYUdVZ1VFRlVSVTVVVXlCbWFXeGxJR2x1SUhSb1pTQnpZVzFsSUdScGNtVmpkRzl5ZVM1Y2JpQXFYRzRnS2lCQWNISnZkbWxrWlhOTmIyUjFiR1VnVW1WaFkzUkZiR1Z0Wlc1MFZtRnNhV1JoZEc5eVhHNGdLaTljYmx4dUx5b3FYRzRnS2lCU1pXRmpkRVZzWlcxbGJuUldZV3hwWkdGMGIzSWdjSEp2ZG1sa1pYTWdZU0IzY21Gd2NHVnlJR0Z5YjNWdVpDQmhJR1ZzWlcxbGJuUWdabUZqZEc5eWVWeHVJQ29nZDJocFkyZ2dkbUZzYVdSaGRHVnpJSFJvWlNCd2NtOXdjeUJ3WVhOelpXUWdkRzhnZEdobElHVnNaVzFsYm5RdUlGUm9hWE1nYVhNZ2FXNTBaVzVrWldRZ2RHOGdZbVZjYmlBcUlIVnpaV1FnYjI1c2VTQnBiaUJFUlZZZ1lXNWtJR052ZFd4a0lHSmxJSEpsY0d4aFkyVmtJR0o1SUdFZ2MzUmhkR2xqSUhSNWNHVWdZMmhsWTJ0bGNpQm1iM0lnYkdGdVozVmhaMlZ6WEc0Z0tpQjBhR0YwSUhOMWNIQnZjblFnYVhRdVhHNGdLaTljYmx4dVhDSjFjMlVnYzNSeWFXTjBYQ0k3WEc1Y2JuWmhjaUJTWldGamRFVnNaVzFsYm5RZ1BTQnlaWEYxYVhKbEtGd2lMaTlTWldGamRFVnNaVzFsYm5SY0lpazdYRzUyWVhJZ1VtVmhZM1JRY205d1ZIbHdaVXh2WTJGMGFXOXVjeUE5SUhKbGNYVnBjbVVvWENJdUwxSmxZV04wVUhKdmNGUjVjR1ZNYjJOaGRHbHZibk5jSWlrN1hHNTJZWElnVW1WaFkzUkRkWEp5Wlc1MFQzZHVaWElnUFNCeVpYRjFhWEpsS0Z3aUxpOVNaV0ZqZEVOMWNuSmxiblJQZDI1bGNsd2lLVHRjYmx4dWRtRnlJRzF2Ym1sMGIzSkRiMlJsVlhObElEMGdjbVZ4ZFdseVpTaGNJaTR2Ylc5dWFYUnZja052WkdWVmMyVmNJaWs3WEc1MllYSWdkMkZ5Ym1sdVp5QTlJSEpsY1hWcGNtVW9YQ0l1TDNkaGNtNXBibWRjSWlrN1hHNWNiaThxS2x4dUlDb2dWMkZ5YmlCcFppQjBhR1Z5WlNkeklHNXZJR3RsZVNCbGVIQnNhV05wZEd4NUlITmxkQ0J2YmlCa2VXNWhiV2xqSUdGeWNtRjVjeUJ2WmlCamFHbHNaSEpsYmlCdmNseHVJQ29nYjJKcVpXTjBJR3RsZVhNZ1lYSmxJRzV2ZENCMllXeHBaQzRnVkdocGN5QmhiR3h2ZDNNZ2RYTWdkRzhnYTJWbGNDQjBjbUZqYXlCdlppQmphR2xzWkhKbGJpQmlaWFIzWldWdVhHNGdLaUIxY0dSaGRHVnpMbHh1SUNvdlhHNTJZWElnYjNkdVpYSklZWE5MWlhsVmMyVlhZWEp1YVc1bklEMGdlMXh1SUNBbmNtVmhZM1JmYTJWNVgzZGhjbTVwYm1jbk9pQjdmU3hjYmlBZ0ozSmxZV04wWDI1MWJXVnlhV05mYTJWNVgzZGhjbTVwYm1jbk9pQjdmVnh1ZlR0Y2JuWmhjaUJ2ZDI1bGNraGhjMDF2Ym1sMGIzSmxaRTlpYW1WamRFMWhjQ0E5SUh0OU8xeHVYRzUyWVhJZ2JHOW5aMlZrVkhsd1pVWmhhV3gxY21WeklEMGdlMzA3WEc1Y2JuWmhjaUJPVlUxRlVrbERYMUJTVDFCRlVsUlpYMUpGUjBWWUlEMGdMMTVjWEdRckpDODdYRzVjYmk4cUtseHVJQ29nUjJWMGN5QjBhR1VnWTNWeWNtVnVkQ0J2ZDI1bGNpZHpJR1JwYzNCc1lYbE9ZVzFsSUdadmNpQjFjMlVnYVc0Z2QyRnlibWx1WjNNdVhHNGdLbHh1SUNvZ1FHbHVkR1Z5Ym1Gc1hHNGdLaUJBY21WMGRYSnVJSHMvYzNSeWFXNW5mU0JFYVhOd2JHRjVJRzVoYldVZ2IzSWdkVzVrWldacGJtVmtYRzRnS2k5Y2JtWjFibU4wYVc5dUlHZGxkRU4xY25KbGJuUlBkMjVsY2tScGMzQnNZWGxPWVcxbEtDa2dlMXh1SUNCMllYSWdZM1Z5Y21WdWRDQTlJRkpsWVdOMFEzVnljbVZ1ZEU5M2JtVnlMbU4xY25KbGJuUTdYRzRnSUhKbGRIVnliaUJqZFhKeVpXNTBJQ1ltSUdOMWNuSmxiblF1WTI5dWMzUnlkV04wYjNJdVpHbHpjR3hoZVU1aGJXVWdmSHdnZFc1a1pXWnBibVZrTzF4dWZWeHVYRzR2S2lwY2JpQXFJRmRoY200Z2FXWWdkR2hsSUdOdmJYQnZibVZ1ZENCa2IyVnpiaWQwSUdoaGRtVWdZVzRnWlhod2JHbGphWFFnYTJWNUlHRnpjMmxuYm1Wa0lIUnZJR2wwTGx4dUlDb2dWR2hwY3lCamIyMXdiMjVsYm5RZ2FYTWdhVzRnWVc0Z1lYSnlZWGt1SUZSb1pTQmhjbkpoZVNCamIzVnNaQ0JuY205M0lHRnVaQ0J6YUhKcGJtc2diM0lnWW1WY2JpQXFJSEpsYjNKa1pYSmxaQzRnUVd4c0lHTm9hV3hrY21WdUlIUm9ZWFFnYUdGMlpXNG5kQ0JoYkhKbFlXUjVJR0psWlc0Z2RtRnNhV1JoZEdWa0lHRnlaU0J5WlhGMWFYSmxaQ0IwYjF4dUlDb2dhR0YyWlNCaElGd2lhMlY1WENJZ2NISnZjR1Z5ZEhrZ1lYTnphV2R1WldRZ2RHOGdhWFF1WEc0Z0tseHVJQ29nUUdsdWRHVnlibUZzWEc0Z0tpQkFjR0Z5WVcwZ2UxSmxZV04wUTI5dGNHOXVaVzUwZlNCamIyMXdiMjVsYm5RZ1EyOXRjRzl1Wlc1MElIUm9ZWFFnY21WeGRXbHlaWE1nWVNCclpYa3VYRzRnS2lCQWNHRnlZVzBnZXlwOUlIQmhjbVZ1ZEZSNWNHVWdZMjl0Y0c5dVpXNTBKM01nY0dGeVpXNTBKM01nZEhsd1pTNWNiaUFxTDF4dVpuVnVZM1JwYjI0Z2RtRnNhV1JoZEdWRmVIQnNhV05wZEV0bGVTaGpiMjF3YjI1bGJuUXNJSEJoY21WdWRGUjVjR1VwSUh0Y2JpQWdhV1lnS0dOdmJYQnZibVZ1ZEM1ZmMzUnZjbVV1ZG1Gc2FXUmhkR1ZrSUh4OElHTnZiWEJ2Ym1WdWRDNXJaWGtnSVQwZ2JuVnNiQ2tnZTF4dUlDQWdJSEpsZEhWeWJqdGNiaUFnZlZ4dUlDQmpiMjF3YjI1bGJuUXVYM04wYjNKbExuWmhiR2xrWVhSbFpDQTlJSFJ5ZFdVN1hHNWNiaUFnZDJGeWJrRnVaRTF2Ym1sMGIzSkdiM0pMWlhsVmMyVW9YRzRnSUNBZ0ozSmxZV04wWDJ0bGVWOTNZWEp1YVc1bkp5eGNiaUFnSUNBblJXRmphQ0JqYUdsc1pDQnBiaUJoYmlCaGNuSmhlU0J6YUc5MWJHUWdhR0YyWlNCaElIVnVhWEYxWlNCY0ltdGxlVndpSUhCeWIzQXVKeXhjYmlBZ0lDQmpiMjF3YjI1bGJuUXNYRzRnSUNBZ2NHRnlaVzUwVkhsd1pWeHVJQ0FwTzF4dWZWeHVYRzR2S2lwY2JpQXFJRmRoY200Z2FXWWdkR2hsSUd0bGVTQnBjeUJpWldsdVp5QmtaV1pwYm1Wa0lHRnpJR0Z1SUc5aWFtVmpkQ0J3Y205d1pYSjBlU0JpZFhRZ2FHRnpJR0Z1SUdsdVkyOXljbVZqZEZ4dUlDb2dkbUZzZFdVdVhHNGdLbHh1SUNvZ1FHbHVkR1Z5Ym1Gc1hHNGdLaUJBY0dGeVlXMGdlM04wY21sdVozMGdibUZ0WlNCUWNtOXdaWEowZVNCdVlXMWxJRzltSUhSb1pTQnJaWGt1WEc0Z0tpQkFjR0Z5WVcwZ2UxSmxZV04wUTI5dGNHOXVaVzUwZlNCamIyMXdiMjVsYm5RZ1EyOXRjRzl1Wlc1MElIUm9ZWFFnY21WeGRXbHlaWE1nWVNCclpYa3VYRzRnS2lCQWNHRnlZVzBnZXlwOUlIQmhjbVZ1ZEZSNWNHVWdZMjl0Y0c5dVpXNTBKM01nY0dGeVpXNTBKM01nZEhsd1pTNWNiaUFxTDF4dVpuVnVZM1JwYjI0Z2RtRnNhV1JoZEdWUWNtOXdaWEowZVV0bGVTaHVZVzFsTENCamIyMXdiMjVsYm5Rc0lIQmhjbVZ1ZEZSNWNHVXBJSHRjYmlBZ2FXWWdLQ0ZPVlUxRlVrbERYMUJTVDFCRlVsUlpYMUpGUjBWWUxuUmxjM1FvYm1GdFpTa3BJSHRjYmlBZ0lDQnlaWFIxY200N1hHNGdJSDFjYmlBZ2QyRnlia0Z1WkUxdmJtbDBiM0pHYjNKTFpYbFZjMlVvWEc0Z0lDQWdKM0psWVdOMFgyNTFiV1Z5YVdOZmEyVjVYM2RoY201cGJtY25MRnh1SUNBZ0lDZERhR2xzWkNCdlltcGxZM1J6SUhOb2IzVnNaQ0JvWVhabElHNXZiaTF1ZFcxbGNtbGpJR3RsZVhNZ2MyOGdiM0prWlhKcGJtY2dhWE1nY0hKbGMyVnlkbVZrTGljc1hHNGdJQ0FnWTI5dGNHOXVaVzUwTEZ4dUlDQWdJSEJoY21WdWRGUjVjR1ZjYmlBZ0tUdGNibjFjYmx4dUx5b3FYRzRnS2lCVGFHRnlaV1FnZDJGeWJtbHVaeUJoYm1RZ2JXOXVhWFJ2Y21sdVp5QmpiMlJsSUdadmNpQjBhR1VnYTJWNUlIZGhjbTVwYm1kekxseHVJQ3BjYmlBcUlFQnBiblJsY201aGJGeHVJQ29nUUhCaGNtRnRJSHR6ZEhKcGJtZDlJSGRoY201cGJtZEpSQ0JVYUdVZ2FXUWdkWE5sWkNCM2FHVnVJR3h2WjJkcGJtY3VYRzRnS2lCQWNHRnlZVzBnZTNOMGNtbHVaMzBnYldWemMyRm5aU0JVYUdVZ1ltRnpaU0IzWVhKdWFXNW5JSFJvWVhRZ1oyVjBjeUJ2ZFhSd2RYUXVYRzRnS2lCQWNHRnlZVzBnZTFKbFlXTjBRMjl0Y0c5dVpXNTBmU0JqYjIxd2IyNWxiblFnUTI5dGNHOXVaVzUwSUhSb1lYUWdjbVZ4ZFdseVpYTWdZU0JyWlhrdVhHNGdLaUJBY0dGeVlXMGdleXA5SUhCaGNtVnVkRlI1Y0dVZ1kyOXRjRzl1Wlc1MEozTWdjR0Z5Wlc1MEozTWdkSGx3WlM1Y2JpQXFMMXh1Wm5WdVkzUnBiMjRnZDJGeWJrRnVaRTF2Ym1sMGIzSkdiM0pMWlhsVmMyVW9kMkZ5Ym1sdVowbEVMQ0J0WlhOellXZGxMQ0JqYjIxd2IyNWxiblFzSUhCaGNtVnVkRlI1Y0dVcElIdGNiaUFnZG1GeUlHOTNibVZ5VG1GdFpTQTlJR2RsZEVOMWNuSmxiblJQZDI1bGNrUnBjM0JzWVhsT1lXMWxLQ2s3WEc0Z0lIWmhjaUJ3WVhKbGJuUk9ZVzFsSUQwZ2NHRnlaVzUwVkhsd1pTNWthWE53YkdGNVRtRnRaVHRjYmx4dUlDQjJZWElnZFhObFRtRnRaU0E5SUc5M2JtVnlUbUZ0WlNCOGZDQndZWEpsYm5ST1lXMWxPMXh1SUNCMllYSWdiV1Z0YjJsNlpYSWdQU0J2ZDI1bGNraGhjMHRsZVZWelpWZGhjbTVwYm1kYmQyRnlibWx1WjBsRVhUdGNiaUFnYVdZZ0tHMWxiVzlwZW1WeUxtaGhjMDkzYmxCeWIzQmxjblI1S0hWelpVNWhiV1VwS1NCN1hHNGdJQ0FnY21WMGRYSnVPMXh1SUNCOVhHNGdJRzFsYlc5cGVtVnlXM1Z6WlU1aGJXVmRJRDBnZEhKMVpUdGNibHh1SUNCdFpYTnpZV2RsSUNzOUlHOTNibVZ5VG1GdFpTQS9YRzRnSUNBZ0tGd2lJRU5vWldOcklIUm9aU0J5Wlc1a1pYSWdiV1YwYUc5a0lHOW1JRndpSUNzZ2IzZHVaWEpPWVcxbElDc2dYQ0l1WENJcElEcGNiaUFnSUNBb1hDSWdRMmhsWTJzZ2RHaGxJSEpsYm1SbGNrTnZiWEJ2Ym1WdWRDQmpZV3hzSUhWemFXNW5JRHhjSWlBcklIQmhjbVZ1ZEU1aGJXVWdLeUJjSWo0dVhDSXBPMXh1WEc0Z0lDOHZJRlZ6ZFdGc2JIa2dkR2hsSUdOMWNuSmxiblFnYjNkdVpYSWdhWE1nZEdobElHOW1abVZ1WkdWeUxDQmlkWFFnYVdZZ2FYUWdZV05qWlhCMGN5QmphR2xzWkhKbGJpQmhjeUJoWEc0Z0lDOHZJSEJ5YjNCbGNuUjVMQ0JwZENCdFlYa2dZbVVnZEdobElHTnlaV0YwYjNJZ2IyWWdkR2hsSUdOb2FXeGtJSFJvWVhRbmN5QnlaWE53YjI1emFXSnNaU0JtYjNKY2JpQWdMeThnWVhOemFXZHVhVzVuSUdsMElHRWdhMlY1TGx4dUlDQjJZWElnWTJocGJHUlBkMjVsY2s1aGJXVWdQU0J1ZFd4c08xeHVJQ0JwWmlBb1kyOXRjRzl1Wlc1MExsOXZkMjVsY2lBbUppQmpiMjF3YjI1bGJuUXVYMjkzYm1WeUlDRTlQU0JTWldGamRFTjFjbkpsYm5SUGQyNWxjaTVqZFhKeVpXNTBLU0I3WEc0Z0lDQWdMeThnVG1GdFpTQnZaaUIwYUdVZ1kyOXRjRzl1Wlc1MElIUm9ZWFFnYjNKcFoybHVZV3hzZVNCamNtVmhkR1ZrSUhSb2FYTWdZMmhwYkdRdVhHNGdJQ0FnWTJocGJHUlBkMjVsY2s1aGJXVWdQU0JqYjIxd2IyNWxiblF1WDI5M2JtVnlMbU52Ym5OMGNuVmpkRzl5TG1ScGMzQnNZWGxPWVcxbE8xeHVYRzRnSUNBZ2JXVnpjMkZuWlNBclBTQW9YQ0lnU1hRZ2QyRnpJSEJoYzNObFpDQmhJR05vYVd4a0lHWnliMjBnWENJZ0t5QmphR2xzWkU5M2JtVnlUbUZ0WlNBcklGd2lMbHdpS1R0Y2JpQWdmVnh1WEc0Z0lHMWxjM05oWjJVZ0t6MGdKeUJUWldVZ2FIUjBjRG92TDJaaUxtMWxMM0psWVdOMExYZGhjbTVwYm1jdGEyVjVjeUJtYjNJZ2JXOXlaU0JwYm1admNtMWhkR2x2Ymk0bk8xeHVJQ0J0YjI1cGRHOXlRMjlrWlZWelpTaDNZWEp1YVc1blNVUXNJSHRjYmlBZ0lDQmpiMjF3YjI1bGJuUTZJSFZ6WlU1aGJXVXNYRzRnSUNBZ1kyOXRjRzl1Wlc1MFQzZHVaWEk2SUdOb2FXeGtUM2R1WlhKT1lXMWxYRzRnSUgwcE8xeHVJQ0JqYjI1emIyeGxMbmRoY200b2JXVnpjMkZuWlNrN1hHNTlYRzVjYmk4cUtseHVJQ29nVEc5bklIUm9ZWFFnZDJVbmNtVWdkWE5wYm1jZ1lXNGdiMkpxWldOMElHMWhjQzRnVjJVbmNtVWdZMjl1YzJsa1pYSnBibWNnWkdWd2NtVmpZWFJwYm1jZ2RHaHBjMXh1SUNvZ1ptVmhkSFZ5WlNCaGJtUWdjbVZ3YkdGalpTQnBkQ0IzYVhSb0lIQnliM0JsY2lCTllYQWdZVzVrSUVsdGJYVjBZV0pzWlUxaGNDQmtZWFJoSUhOMGNuVmpkSFZ5WlhNdVhHNGdLbHh1SUNvZ1FHbHVkR1Z5Ym1Gc1hHNGdLaTljYm1aMWJtTjBhVzl1SUcxdmJtbDBiM0pWYzJWUFprOWlhbVZqZEUxaGNDZ3BJSHRjYmlBZ2RtRnlJR04xY25KbGJuUk9ZVzFsSUQwZ1oyVjBRM1Z5Y21WdWRFOTNibVZ5UkdsemNHeGhlVTVoYldVb0tTQjhmQ0FuSnp0Y2JpQWdhV1lnS0c5M2JtVnlTR0Z6VFc5dWFYUnZjbVZrVDJKcVpXTjBUV0Z3TG1oaGMwOTNibEJ5YjNCbGNuUjVLR04xY25KbGJuUk9ZVzFsS1NrZ2UxeHVJQ0FnSUhKbGRIVnlianRjYmlBZ2ZWeHVJQ0J2ZDI1bGNraGhjMDF2Ym1sMGIzSmxaRTlpYW1WamRFMWhjRnRqZFhKeVpXNTBUbUZ0WlYwZ1BTQjBjblZsTzF4dUlDQnRiMjVwZEc5eVEyOWtaVlZ6WlNnbmNtVmhZM1JmYjJKcVpXTjBYMjFoY0Y5amFHbHNaSEpsYmljcE8xeHVmVnh1WEc0dktpcGNiaUFxSUVWdWMzVnlaU0IwYUdGMElHVjJaWEo1SUdOdmJYQnZibVZ1ZENCbGFYUm9aWElnYVhNZ2NHRnpjMlZrSUdsdUlHRWdjM1JoZEdsaklHeHZZMkYwYVc5dUxDQnBiaUJoYmx4dUlDb2dZWEp5WVhrZ2QybDBhQ0JoYmlCbGVIQnNhV05wZENCclpYbHpJSEJ5YjNCbGNuUjVJR1JsWm1sdVpXUXNJRzl5SUdsdUlHRnVJRzlpYW1WamRDQnNhWFJsY21Gc1hHNGdLaUIzYVhSb0lIWmhiR2xrSUd0bGVTQndjbTl3WlhKMGVTNWNiaUFxWEc0Z0tpQkFhVzUwWlhKdVlXeGNiaUFxSUVCd1lYSmhiU0I3S24wZ1kyOXRjRzl1Wlc1MElGTjBZWFJwWTJGc2JIa2djR0Z6YzJWa0lHTm9hV3hrSUc5bUlHRnVlU0IwZVhCbExseHVJQ29nUUhCaGNtRnRJSHNxZlNCd1lYSmxiblJVZVhCbElHTnZiWEJ2Ym1WdWRDZHpJSEJoY21WdWRDZHpJSFI1Y0dVdVhHNGdLaUJBY21WMGRYSnVJSHRpYjI5c1pXRnVmVnh1SUNvdlhHNW1kVzVqZEdsdmJpQjJZV3hwWkdGMFpVTm9hV3hrUzJWNWN5aGpiMjF3YjI1bGJuUXNJSEJoY21WdWRGUjVjR1VwSUh0Y2JpQWdhV1lnS0VGeWNtRjVMbWx6UVhKeVlYa29ZMjl0Y0c5dVpXNTBLU2tnZTF4dUlDQWdJR1p2Y2lBb2RtRnlJR2tnUFNBd095QnBJRHdnWTI5dGNHOXVaVzUwTG14bGJtZDBhRHNnYVNzcktTQjdYRzRnSUNBZ0lDQjJZWElnWTJocGJHUWdQU0JqYjIxd2IyNWxiblJiYVYwN1hHNGdJQ0FnSUNCcFppQW9VbVZoWTNSRmJHVnRaVzUwTG1selZtRnNhV1JGYkdWdFpXNTBLR05vYVd4a0tTa2dlMXh1SUNBZ0lDQWdJQ0IyWVd4cFpHRjBaVVY0Y0d4cFkybDBTMlY1S0dOb2FXeGtMQ0J3WVhKbGJuUlVlWEJsS1R0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0I5WEc0Z0lIMGdaV3h6WlNCcFppQW9VbVZoWTNSRmJHVnRaVzUwTG1selZtRnNhV1JGYkdWdFpXNTBLR052YlhCdmJtVnVkQ2twSUh0Y2JpQWdJQ0F2THlCVWFHbHpJR052YlhCdmJtVnVkQ0IzWVhNZ2NHRnpjMlZrSUdsdUlHRWdkbUZzYVdRZ2JHOWpZWFJwYjI0dVhHNGdJQ0FnWTI5dGNHOXVaVzUwTGw5emRHOXlaUzUyWVd4cFpHRjBaV1FnUFNCMGNuVmxPMXh1SUNCOUlHVnNjMlVnYVdZZ0tHTnZiWEJ2Ym1WdWRDQW1KaUIwZVhCbGIyWWdZMjl0Y0c5dVpXNTBJRDA5UFNBbmIySnFaV04wSnlrZ2UxeHVJQ0FnSUcxdmJtbDBiM0pWYzJWUFprOWlhbVZqZEUxaGNDZ3BPMXh1SUNBZ0lHWnZjaUFvZG1GeUlHNWhiV1VnYVc0Z1kyOXRjRzl1Wlc1MEtTQjdYRzRnSUNBZ0lDQjJZV3hwWkdGMFpWQnliM0JsY25SNVMyVjVLRzVoYldVc0lHTnZiWEJ2Ym1WdWRGdHVZVzFsWFN3Z2NHRnlaVzUwVkhsd1pTazdYRzRnSUNBZ2ZWeHVJQ0I5WEc1OVhHNWNiaThxS2x4dUlDb2dRWE56WlhKMElIUm9ZWFFnZEdobElIQnliM0J6SUdGeVpTQjJZV3hwWkZ4dUlDcGNiaUFxSUVCd1lYSmhiU0I3YzNSeWFXNW5mU0JqYjIxd2IyNWxiblJPWVcxbElFNWhiV1VnYjJZZ2RHaGxJR052YlhCdmJtVnVkQ0JtYjNJZ1pYSnliM0lnYldWemMyRm5aWE11WEc0Z0tpQkFjR0Z5WVcwZ2UyOWlhbVZqZEgwZ2NISnZjRlI1Y0dWeklFMWhjQ0J2WmlCd2NtOXdJRzVoYldVZ2RHOGdZU0JTWldGamRGQnliM0JVZVhCbFhHNGdLaUJBY0dGeVlXMGdlMjlpYW1WamRIMGdjSEp2Y0hOY2JpQXFJRUJ3WVhKaGJTQjdjM1J5YVc1bmZTQnNiMk5oZEdsdmJpQmxMbWN1SUZ3aWNISnZjRndpTENCY0ltTnZiblJsZUhSY0lpd2dYQ0pqYUdsc1pDQmpiMjUwWlhoMFhDSmNiaUFxSUVCd2NtbDJZWFJsWEc0Z0tpOWNibVoxYm1OMGFXOXVJR05vWldOclVISnZjRlI1Y0dWektHTnZiWEJ2Ym1WdWRFNWhiV1VzSUhCeWIzQlVlWEJsY3l3Z2NISnZjSE1zSUd4dlkyRjBhVzl1S1NCN1hHNGdJR1p2Y2lBb2RtRnlJSEJ5YjNCT1lXMWxJR2x1SUhCeWIzQlVlWEJsY3lrZ2UxeHVJQ0FnSUdsbUlDaHdjbTl3Vkhsd1pYTXVhR0Z6VDNkdVVISnZjR1Z5ZEhrb2NISnZjRTVoYldVcEtTQjdYRzRnSUNBZ0lDQjJZWElnWlhKeWIzSTdYRzRnSUNBZ0lDQXZMeUJRY205d0lIUjVjR1VnZG1Gc2FXUmhkR2x2YmlCdFlYa2dkR2h5YjNjdUlFbHVJR05oYzJVZ2RHaGxlU0JrYnl3Z2QyVWdaRzl1SjNRZ2QyRnVkQ0IwYjF4dUlDQWdJQ0FnTHk4Z1ptRnBiQ0IwYUdVZ2NtVnVaR1Z5SUhCb1lYTmxJSGRvWlhKbElHbDBJR1JwWkc0bmRDQm1ZV2xzSUdKbFptOXlaUzRnVTI4Z2QyVWdiRzluSUdsMExseHVJQ0FnSUNBZ0x5OGdRV1owWlhJZ2RHaGxjMlVnYUdGMlpTQmlaV1Z1SUdOc1pXRnVaV1FnZFhBc0lIZGxKMnhzSUd4bGRDQjBhR1Z0SUhSb2NtOTNMbHh1SUNBZ0lDQWdkSEo1SUh0Y2JpQWdJQ0FnSUNBZ1pYSnliM0lnUFNCd2NtOXdWSGx3WlhOYmNISnZjRTVoYldWZEtIQnliM0J6TENCd2NtOXdUbUZ0WlN3Z1kyOXRjRzl1Wlc1MFRtRnRaU3dnYkc5allYUnBiMjRwTzF4dUlDQWdJQ0FnZlNCallYUmphQ0FvWlhncElIdGNiaUFnSUNBZ0lDQWdaWEp5YjNJZ1BTQmxlRHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJR2xtSUNobGNuSnZjaUJwYm5OMFlXNWpaVzltSUVWeWNtOXlJQ1ltSUNFb1pYSnliM0l1YldWemMyRm5aU0JwYmlCc2IyZG5aV1JVZVhCbFJtRnBiSFZ5WlhNcEtTQjdYRzRnSUNBZ0lDQWdJQzh2SUU5dWJIa2diVzl1YVhSdmNpQjBhR2x6SUdaaGFXeDFjbVVnYjI1alpTQmlaV05oZFhObElIUm9aWEpsSUhSbGJtUnpJSFJ2SUdKbElHRWdiRzkwSUc5bUlIUm9aVnh1SUNBZ0lDQWdJQ0F2THlCellXMWxJR1Z5Y205eUxseHVJQ0FnSUNBZ0lDQnNiMmRuWldSVWVYQmxSbUZwYkhWeVpYTmJaWEp5YjNJdWJXVnpjMkZuWlYwZ1BTQjBjblZsTzF4dUlDQWdJQ0FnSUNBdkx5QlVhR2x6SUhkcGJHd2djMjl2YmlCMWMyVWdkR2hsSUhkaGNtNXBibWNnYlc5a2RXeGxYRzRnSUNBZ0lDQWdJRzF2Ym1sMGIzSkRiMlJsVlhObEtGeHVJQ0FnSUNBZ0lDQWdJQ2R5WldGamRGOW1ZV2xzWldSZlpHVnpZM0pwY0hSdmNsOTBlWEJsWDJOb1pXTnJKeXhjYmlBZ0lDQWdJQ0FnSUNCN0lHMWxjM05oWjJVNklHVnljbTl5TG0xbGMzTmhaMlVnZlZ4dUlDQWdJQ0FnSUNBcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVhHNTJZWElnVW1WaFkzUkZiR1Z0Wlc1MFZtRnNhV1JoZEc5eUlEMGdlMXh1WEc0Z0lHTnlaV0YwWlVWc1pXMWxiblE2SUdaMWJtTjBhVzl1S0hSNWNHVXNJSEJ5YjNCekxDQmphR2xzWkhKbGJpa2dlMXh1SUNBZ0lDOHZJRmRsSUhkaGNtNGdhVzRnZEdocGN5QmpZWE5sSUdKMWRDQmtiMjRuZENCMGFISnZkeTRnVjJVZ1pYaHdaV04wSUhSb1pTQmxiR1Z0Wlc1MElHTnlaV0YwYVc5dUlIUnZYRzRnSUNBZ0x5OGdjM1ZqWTJWbFpDQmhibVFnZEdobGNtVWdkMmxzYkNCc2FXdGxiSGtnWW1VZ1pYSnliM0p6SUdsdUlISmxibVJsY2k1Y2JpQWdJQ0FvWENKd2NtOWtkV04wYVc5dVhDSWdJVDA5SUhCeWIyTmxjM011Wlc1MkxrNVBSRVZmUlU1V0lEOGdkMkZ5Ym1sdVp5aGNiaUFnSUNBZ0lIUjVjR1VnSVQwZ2JuVnNiQ3hjYmlBZ0lDQWdJQ2RTWldGamRDNWpjbVZoZEdWRmJHVnRaVzUwT2lCMGVYQmxJSE5vYjNWc1pDQnViM1FnWW1VZ2JuVnNiQ0J2Y2lCMWJtUmxabWx1WldRdUlFbDBJSE5vYjNWc1pDQW5JQ3RjYmlBZ0lDQWdJQ0FnSjJKbElHRWdjM1J5YVc1bklDaG1iM0lnUkU5TklHVnNaVzFsYm5SektTQnZjaUJoSUZKbFlXTjBRMnhoYzNNZ0tHWnZjaUJqYjIxd2IzTnBkR1VnSnlBclhHNGdJQ0FnSUNBZ0lDZGpiMjF3YjI1bGJuUnpLUzRuWEc0Z0lDQWdLU0E2SUc1MWJHd3BPMXh1WEc0Z0lDQWdkbUZ5SUdWc1pXMWxiblFnUFNCU1pXRmpkRVZzWlcxbGJuUXVZM0psWVhSbFJXeGxiV1Z1ZEM1aGNIQnNlU2gwYUdsekxDQmhjbWQxYldWdWRITXBPMXh1WEc0Z0lDQWdMeThnVkdobElISmxjM1ZzZENCallXNGdZbVVnYm5Wc2JHbHphQ0JwWmlCaElHMXZZMnNnYjNJZ1lTQmpkWE4wYjIwZ1puVnVZM1JwYjI0Z2FYTWdkWE5sWkM1Y2JpQWdJQ0F2THlCVVQwUlBPaUJFY205d0lIUm9hWE1nZDJobGJpQjBhR1Z6WlNCaGNtVWdibThnYkc5dVoyVnlJR0ZzYkc5M1pXUWdZWE1nZEdobElIUjVjR1VnWVhKbmRXMWxiblF1WEc0Z0lDQWdhV1lnS0dWc1pXMWxiblFnUFQwZ2JuVnNiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1ZzWlcxbGJuUTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1ptOXlJQ2gyWVhJZ2FTQTlJREk3SUdrZ1BDQmhjbWQxYldWdWRITXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0FnSUhaaGJHbGtZWFJsUTJocGJHUkxaWGx6S0dGeVozVnRaVzUwYzF0cFhTd2dkSGx3WlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tIUjVjR1VwSUh0Y2JpQWdJQ0FnSUhaaGNpQnVZVzFsSUQwZ2RIbHdaUzVrYVhOd2JHRjVUbUZ0WlR0Y2JpQWdJQ0FnSUdsbUlDaDBlWEJsTG5CeWIzQlVlWEJsY3lrZ2UxeHVJQ0FnSUNBZ0lDQmphR1ZqYTFCeWIzQlVlWEJsY3loY2JpQWdJQ0FnSUNBZ0lDQnVZVzFsTEZ4dUlDQWdJQ0FnSUNBZ0lIUjVjR1V1Y0hKdmNGUjVjR1Z6TEZ4dUlDQWdJQ0FnSUNBZ0lHVnNaVzFsYm5RdWNISnZjSE1zWEc0Z0lDQWdJQ0FnSUNBZ1VtVmhZM1JRY205d1ZIbHdaVXh2WTJGMGFXOXVjeTV3Y205d1hHNGdJQ0FnSUNBZ0lDazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnBaaUFvZEhsd1pTNWpiMjUwWlhoMFZIbHdaWE1wSUh0Y2JpQWdJQ0FnSUNBZ1kyaGxZMnRRY205d1ZIbHdaWE1vWEc0Z0lDQWdJQ0FnSUNBZ2JtRnRaU3hjYmlBZ0lDQWdJQ0FnSUNCMGVYQmxMbU52Ym5SbGVIUlVlWEJsY3l4Y2JpQWdJQ0FnSUNBZ0lDQmxiR1Z0Wlc1MExsOWpiMjUwWlhoMExGeHVJQ0FnSUNBZ0lDQWdJRkpsWVdOMFVISnZjRlI1Y0dWTWIyTmhkR2x2Ym5NdVkyOXVkR1Y0ZEZ4dUlDQWdJQ0FnSUNBcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdaV3hsYldWdWREdGNiaUFnZlN4Y2JseHVJQ0JqY21WaGRHVkdZV04wYjNKNU9pQm1kVzVqZEdsdmJpaDBlWEJsS1NCN1hHNGdJQ0FnZG1GeUlIWmhiR2xrWVhSbFpFWmhZM1J2Y25rZ1BTQlNaV0ZqZEVWc1pXMWxiblJXWVd4cFpHRjBiM0l1WTNKbFlYUmxSV3hsYldWdWRDNWlhVzVrS0Z4dUlDQWdJQ0FnYm5Wc2JDeGNiaUFnSUNBZ0lIUjVjR1ZjYmlBZ0lDQXBPMXh1SUNBZ0lIWmhiR2xrWVhSbFpFWmhZM1J2Y25rdWRIbHdaU0E5SUhSNWNHVTdYRzRnSUNBZ2NtVjBkWEp1SUhaaGJHbGtZWFJsWkVaaFkzUnZjbms3WEc0Z0lIMWNibHh1ZlR0Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQlNaV0ZqZEVWc1pXMWxiblJXWVd4cFpHRjBiM0k3WEc0aVhYMD0iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBSZWFjdExlZ2FjeUVsZW1lbnRcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFJlYWN0Q3VycmVudE93bmVyID0gcmVxdWlyZShcIi4vUmVhY3RDdXJyZW50T3duZXJcIik7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKFwiLi9pbnZhcmlhbnRcIik7XG52YXIgbW9uaXRvckNvZGVVc2UgPSByZXF1aXJlKFwiLi9tb25pdG9yQ29kZVVzZVwiKTtcbnZhciB3YXJuaW5nID0gcmVxdWlyZShcIi4vd2FybmluZ1wiKTtcblxudmFyIGxlZ2FjeUZhY3RvcnlMb2dzID0ge307XG5mdW5jdGlvbiB3YXJuRm9yTGVnYWN5RmFjdG9yeUNhbGwoKSB7XG4gIGlmICghUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5faXNMZWdhY3lDYWxsV2FybmluZ0VuYWJsZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG93bmVyID0gUmVhY3RDdXJyZW50T3duZXIuY3VycmVudDtcbiAgdmFyIG5hbWUgPSBvd25lciAmJiBvd25lci5jb25zdHJ1Y3RvciA/IG93bmVyLmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lIDogJyc7XG4gIGlmICghbmFtZSkge1xuICAgIG5hbWUgPSAnU29tZXRoaW5nJztcbiAgfVxuICBpZiAobGVnYWN5RmFjdG9yeUxvZ3MuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGVnYWN5RmFjdG9yeUxvZ3NbbmFtZV0gPSB0cnVlO1xuICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICBmYWxzZSxcbiAgICBuYW1lICsgJyBpcyBjYWxsaW5nIGEgUmVhY3QgY29tcG9uZW50IGRpcmVjdGx5LiAnICtcbiAgICAnVXNlIGEgZmFjdG9yeSBvciBKU1ggaW5zdGVhZC4gU2VlOiBodHRwOi8vZmIubWUvcmVhY3QtbGVnYWN5ZmFjdG9yeSdcbiAgKSA6IG51bGwpO1xuICBtb25pdG9yQ29kZVVzZSgncmVhY3RfbGVnYWN5X2ZhY3RvcnlfY2FsbCcsIHsgdmVyc2lvbjogMywgbmFtZTogbmFtZSB9KTtcbn1cblxuZnVuY3Rpb24gd2FybkZvclBsYWluRnVuY3Rpb25UeXBlKHR5cGUpIHtcbiAgdmFyIGlzUmVhY3RDbGFzcyA9XG4gICAgdHlwZS5wcm90b3R5cGUgJiZcbiAgICB0eXBlb2YgdHlwZS5wcm90b3R5cGUubW91bnRDb21wb25lbnQgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2YgdHlwZS5wcm90b3R5cGUucmVjZWl2ZUNvbXBvbmVudCA9PT0gJ2Z1bmN0aW9uJztcbiAgaWYgKGlzUmVhY3RDbGFzcykge1xuICAgIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyB3YXJuaW5nKFxuICAgICAgZmFsc2UsXG4gICAgICAnRGlkIG5vdCBleHBlY3QgdG8gZ2V0IGEgUmVhY3QgY2xhc3MgaGVyZS4gVXNlIGBDb21wb25lbnRgIGluc3RlYWQgJyArXG4gICAgICAnb2YgYENvbXBvbmVudC50eXBlYCBvciBgdGhpcy5jb25zdHJ1Y3RvcmAuJ1xuICAgICkgOiBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIXR5cGUuX3JlYWN0V2FybmVkRm9yVGhpc1R5cGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHR5cGUuX3JlYWN0V2FybmVkRm9yVGhpc1R5cGUgPSB0cnVlO1xuICAgICAgfSBjYXRjaCAoeCkge1xuICAgICAgICAvLyBqdXN0IGluY2FzZSB0aGlzIGlzIGEgZnJvemVuIG9iamVjdCBvciBzb21lIHNwZWNpYWwgb2JqZWN0XG4gICAgICB9XG4gICAgICBtb25pdG9yQ29kZVVzZShcbiAgICAgICAgJ3JlYWN0X25vbl9jb21wb25lbnRfaW5fanN4JyxcbiAgICAgICAgeyB2ZXJzaW9uOiAzLCBuYW1lOiB0eXBlLm5hbWUgfVxuICAgICAgKTtcbiAgICB9XG4gICAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IHdhcm5pbmcoXG4gICAgICBmYWxzZSxcbiAgICAgICdUaGlzIEpTWCB1c2VzIGEgcGxhaW4gZnVuY3Rpb24uIE9ubHkgUmVhY3QgY29tcG9uZW50cyBhcmUgJyArXG4gICAgICAndmFsaWQgaW4gUmVhY3RcXCdzIEpTWCB0cmFuc2Zvcm0uJ1xuICAgICkgOiBudWxsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3YXJuRm9yTm9uTGVnYWN5RmFjdG9yeSh0eXBlKSB7XG4gIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyB3YXJuaW5nKFxuICAgIGZhbHNlLFxuICAgICdEbyBub3QgcGFzcyBSZWFjdC5ET00uJyArIHR5cGUudHlwZSArICcgdG8gSlNYIG9yIGNyZWF0ZUZhY3RvcnkuICcgK1xuICAgICdVc2UgdGhlIHN0cmluZyBcIicgKyB0eXBlLnR5cGUgKyAnXCIgaW5zdGVhZC4nXG4gICkgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBUcmFuc2ZlciBzdGF0aWMgcHJvcGVydGllcyBmcm9tIHRoZSBzb3VyY2UgdG8gdGhlIHRhcmdldC4gRnVuY3Rpb25zIGFyZVxuICogcmVib3VuZCB0byBoYXZlIHRoaXMgcmVmbGVjdCB0aGUgb3JpZ2luYWwgc291cmNlLlxuICovXG5mdW5jdGlvbiBwcm94eVN0YXRpY01ldGhvZHModGFyZ2V0LCBzb3VyY2UpIHtcbiAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBib3VuZCA9IHZhbHVlLmJpbmQoc291cmNlKTtcbiAgICAgICAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBkZWZpbmVkIG9uIHRoZSBmdW5jdGlvbiwgc3VjaCBhcyBgaXNSZXF1aXJlZGAgb25cbiAgICAgICAgLy8gYSBQcm9wVHlwZXMgdmFsaWRhdG9yLlxuICAgICAgICBmb3IgKHZhciBrIGluIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBib3VuZFtrXSA9IHZhbHVlW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0YXJnZXRba2V5XSA9IGJvdW5kO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gV2UgdXNlIGFuIG9iamVjdCBpbnN0ZWFkIG9mIGEgYm9vbGVhbiBiZWNhdXNlIGJvb2xlYW5zIGFyZSBpZ25vcmVkIGJ5IG91clxuLy8gbW9ja2luZyBsaWJyYXJpZXMgd2hlbiB0aGVzZSBmYWN0b3JpZXMgZ2V0cyBtb2NrZWQuXG52YXIgTEVHQUNZX01BUktFUiA9IHt9O1xudmFyIE5PTl9MRUdBQ1lfTUFSS0VSID0ge307XG5cbnZhciBSZWFjdExlZ2FjeUVsZW1lbnRGYWN0b3J5ID0ge307XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcENyZWF0ZUZhY3RvcnkgPSBmdW5jdGlvbihjcmVhdGVGYWN0b3J5KSB7XG4gIHZhciBsZWdhY3lDcmVhdGVGYWN0b3J5ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gTm9uLWZ1bmN0aW9uIHR5cGVzIGNhbm5vdCBiZSBsZWdhY3kgZmFjdG9yaWVzXG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdERPTSB3ZSB1bndyYXAgaXQgdG8gZ2V0IHRvXG4gICAgICAvLyB0aGUgdW5kZXJseWluZyBzdHJpbmcgdHlwZS4gSXQgc2hvdWxkbid0IGhhdmUgYmVlbiBwYXNzZWQgaGVyZSBzbyB3ZVxuICAgICAgLy8gd2Fybi5cbiAgICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgICAgd2FybkZvck5vbkxlZ2FjeUZhY3RvcnkodHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlLnR5cGUpO1xuICAgIH1cblxuICAgIGlmICh0eXBlLmlzUmVhY3RMZWdhY3lGYWN0b3J5KSB7XG4gICAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGEgbGVnYWN5IGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdENvbXBvc2l0ZUNvbXBvbmVudC5cbiAgICAgIC8vIFdlIHVud3JhcCBpdCB0byBnZXQgdG8gdGhlIHVuZGVybHlpbmcgY2xhc3MuXG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSh0eXBlLnR5cGUpO1xuICAgIH1cblxuICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgIHdhcm5Gb3JQbGFpbkZ1bmN0aW9uVHlwZSh0eXBlKTtcbiAgICB9XG5cbiAgICAvLyBVbmxlc3MgaXQncyBhIGxlZ2FjeSBmYWN0b3J5LCB0aGVuIHRoaXMgaXMgcHJvYmFibHkgYSBwbGFpbiBmdW5jdGlvbixcbiAgICAvLyB0aGF0IGlzIGV4cGVjdGluZyB0byBiZSBpbnZva2VkIGJ5IEpTWC4gV2UgY2FuIGp1c3QgcmV0dXJuIGl0IGFzIGlzLlxuICAgIHJldHVybiB0eXBlO1xuICB9O1xuICByZXR1cm4gbGVnYWN5Q3JlYXRlRmFjdG9yeTtcbn07XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcENyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbihjcmVhdGVFbGVtZW50KSB7XG4gIHZhciBsZWdhY3lDcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24odHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBOb24tZnVuY3Rpb24gdHlwZXMgY2Fubm90IGJlIGxlZ2FjeSBmYWN0b3JpZXNcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIGFyZ3M7XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGZhY3RvcnkgY3JlYXRlZCBieSBSZWFjdERPTSB3ZSB1bndyYXAgaXQgdG8gZ2V0IHRvXG4gICAgICAvLyB0aGUgdW5kZXJseWluZyBzdHJpbmcgdHlwZS4gSXQgc2hvdWxkbid0IGhhdmUgYmVlbiBwYXNzZWQgaGVyZSBzbyB3ZVxuICAgICAgLy8gd2Fybi5cbiAgICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgICAgd2FybkZvck5vbkxlZ2FjeUZhY3RvcnkodHlwZSk7XG4gICAgICB9XG4gICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIGFyZ3NbMF0gPSB0eXBlLnR5cGU7XG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZS5pc1JlYWN0TGVnYWN5RmFjdG9yeSkge1xuICAgICAgLy8gVGhpcyBpcyBwcm9iYWJseSBhIGxlZ2FjeSBmYWN0b3J5IGNyZWF0ZWQgYnkgUmVhY3RDb21wb3NpdGVDb21wb25lbnQuXG4gICAgICAvLyBXZSB1bndyYXAgaXQgdG8gZ2V0IHRvIHRoZSB1bmRlcmx5aW5nIGNsYXNzLlxuICAgICAgaWYgKHR5cGUuX2lzTW9ja0Z1bmN0aW9uKSB7XG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBtb2NrIGZ1bmN0aW9uLCBwZW9wbGUgd2lsbCBleHBlY3QgaXQgdG8gYmUgY2FsbGVkLiBXZVxuICAgICAgICAvLyB3aWxsIGFjdHVhbGx5IGNhbGwgdGhlIG9yaWdpbmFsIG1vY2sgZmFjdG9yeSBmdW5jdGlvbiBpbnN0ZWFkLiBUaGlzXG4gICAgICAgIC8vIGZ1dHVyZSBwcm9vZnMgdW5pdCB0ZXN0aW5nIHRoYXQgYXNzdW1lIHRoYXQgdGhlc2UgYXJlIGNsYXNzZXMuXG4gICAgICAgIHR5cGUudHlwZS5fbW9ja2VkUmVhY3RDbGFzc0NvbnN0cnVjdG9yID0gdHlwZTtcbiAgICAgIH1cbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgYXJnc1swXSA9IHR5cGUudHlwZTtcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAgIHdhcm5Gb3JQbGFpbkZ1bmN0aW9uVHlwZSh0eXBlKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGJlaW5nIGNhbGxlZCB3aXRoIGEgcGxhaW4gZnVuY3Rpb24gd2Ugc2hvdWxkIGludm9rZSBpdFxuICAgIC8vIGltbWVkaWF0ZWx5IGFzIGlmIHRoaXMgd2FzIHVzZWQgd2l0aCBsZWdhY3kgSlNYLlxuICAgIHJldHVybiB0eXBlLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuICByZXR1cm4gbGVnYWN5Q3JlYXRlRWxlbWVudDtcbn07XG5cblJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnkud3JhcEZhY3RvcnkgPSBmdW5jdGlvbihmYWN0b3J5KSB7XG4gIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPyBpbnZhcmlhbnQoXG4gICAgdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicsXG4gICAgJ1RoaXMgaXMgc3VwcG9zZSB0byBhY2NlcHQgYSBlbGVtZW50IGZhY3RvcnknXG4gICkgOiBpbnZhcmlhbnQodHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicpKTtcbiAgdmFyIGxlZ2FjeUVsZW1lbnRGYWN0b3J5ID0gZnVuY3Rpb24oY29uZmlnLCBjaGlsZHJlbikge1xuICAgIC8vIFRoaXMgZmFjdG9yeSBzaG91bGQgbm90IGJlIGNhbGxlZCB3aGVuIEpTWCBpcyB1c2VkLiBVc2UgSlNYIGluc3RlYWQuXG4gICAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgICAgd2FybkZvckxlZ2FjeUZhY3RvcnlDYWxsKCk7XG4gICAgfVxuICAgIHJldHVybiBmYWN0b3J5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG4gIHByb3h5U3RhdGljTWV0aG9kcyhsZWdhY3lFbGVtZW50RmFjdG9yeSwgZmFjdG9yeS50eXBlKTtcbiAgbGVnYWN5RWxlbWVudEZhY3RvcnkuaXNSZWFjdExlZ2FjeUZhY3RvcnkgPSBMRUdBQ1lfTUFSS0VSO1xuICBsZWdhY3lFbGVtZW50RmFjdG9yeS50eXBlID0gZmFjdG9yeS50eXBlO1xuICByZXR1cm4gbGVnYWN5RWxlbWVudEZhY3Rvcnk7XG59O1xuXG4vLyBUaGlzIGlzIHVzZWQgdG8gbWFyayBhIGZhY3RvcnkgdGhhdCB3aWxsIHJlbWFpbi4gRS5nLiB3ZSdyZSBhbGxvd2VkIHRvIGNhbGxcbi8vIGl0IGFzIGEgZnVuY3Rpb24uIEhvd2V2ZXIsIHlvdSdyZSBub3Qgc3VwcG9zZSB0byBwYXNzIGl0IHRvIGNyZWF0ZUVsZW1lbnRcbi8vIG9yIGNyZWF0ZUZhY3RvcnksIHNvIGl0IHdpbGwgd2FybiB5b3UgaWYgeW91IGRvLlxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5tYXJrTm9uTGVnYWN5RmFjdG9yeSA9IGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgZmFjdG9yeS5pc1JlYWN0Tm9uTGVnYWN5RmFjdG9yeSA9IE5PTl9MRUdBQ1lfTUFSS0VSO1xuICByZXR1cm4gZmFjdG9yeTtcbn07XG5cbi8vIENoZWNrcyBpZiBhIGZhY3RvcnkgZnVuY3Rpb24gaXMgYWN0dWFsbHkgYSBsZWdhY3kgZmFjdG9yeSBwcmV0ZW5kaW5nIHRvXG4vLyBiZSBhIGNsYXNzLlxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5pc1ZhbGlkRmFjdG9yeSA9IGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgLy8gVE9ETzogVGhpcyB3aWxsIGJlIHJlbW92ZWQgYW5kIG1vdmVkIGludG8gYSBjbGFzcyB2YWxpZGF0b3Igb3Igc29tZXRoaW5nLlxuICByZXR1cm4gdHlwZW9mIGZhY3RvcnkgPT09ICdmdW5jdGlvbicgJiZcbiAgICBmYWN0b3J5LmlzUmVhY3RMZWdhY3lGYWN0b3J5ID09PSBMRUdBQ1lfTUFSS0VSO1xufTtcblxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5pc1ZhbGlkQ2xhc3MgPSBmdW5jdGlvbihmYWN0b3J5KSB7XG4gIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYpIHtcbiAgICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gd2FybmluZyhcbiAgICAgIGZhbHNlLFxuICAgICAgJ2lzVmFsaWRDbGFzcyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZS4gJyArXG4gICAgICAnVXNlIGEgbW9yZSBzcGVjaWZpYyB2YWxpZGF0b3IgaW5zdGVhZC4nXG4gICAgKSA6IG51bGwpO1xuICB9XG4gIHJldHVybiBSZWFjdExlZ2FjeUVsZW1lbnRGYWN0b3J5LmlzVmFsaWRGYWN0b3J5KGZhY3RvcnkpO1xufTtcblxuUmVhY3RMZWdhY3lFbGVtZW50RmFjdG9yeS5faXNMZWdhY3lDYWxsV2FybmluZ0VuYWJsZWQgPSB0cnVlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0TGVnYWN5RWxlbWVudEZhY3Rvcnk7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXlaV0ZqZEM5c2FXSXZVbVZoWTNSTVpXZGhZM2xGYkdWdFpXNTBMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpTHlvcVhHNGdLaUJEYjNCNWNtbG5hSFFnTWpBeE5Dd2dSbUZqWldKdmIyc3NJRWx1WXk1Y2JpQXFJRUZzYkNCeWFXZG9kSE1nY21WelpYSjJaV1F1WEc0Z0tseHVJQ29nVkdocGN5QnpiM1Z5WTJVZ1kyOWtaU0JwY3lCc2FXTmxibk5sWkNCMWJtUmxjaUIwYUdVZ1FsTkVMWE4wZVd4bElHeHBZMlZ1YzJVZ1ptOTFibVFnYVc0Z2RHaGxYRzRnS2lCTVNVTkZUbE5GSUdacGJHVWdhVzRnZEdobElISnZiM1FnWkdseVpXTjBiM0o1SUc5bUlIUm9hWE1nYzI5MWNtTmxJSFJ5WldVdUlFRnVJR0ZrWkdsMGFXOXVZV3dnWjNKaGJuUmNiaUFxSUc5bUlIQmhkR1Z1ZENCeWFXZG9kSE1nWTJGdUlHSmxJR1p2ZFc1a0lHbHVJSFJvWlNCUVFWUkZUbFJUSUdacGJHVWdhVzRnZEdobElITmhiV1VnWkdseVpXTjBiM0o1TGx4dUlDcGNiaUFxSUVCd2NtOTJhV1JsYzAxdlpIVnNaU0JTWldGamRFeGxaMkZqZVVWc1pXMWxiblJjYmlBcUwxeHVYRzVjSW5WelpTQnpkSEpwWTNSY0lqdGNibHh1ZG1GeUlGSmxZV04wUTNWeWNtVnVkRTkzYm1WeUlEMGdjbVZ4ZFdseVpTaGNJaTR2VW1WaFkzUkRkWEp5Wlc1MFQzZHVaWEpjSWlrN1hHNWNiblpoY2lCcGJuWmhjbWxoYm5RZ1BTQnlaWEYxYVhKbEtGd2lMaTlwYm5aaGNtbGhiblJjSWlrN1hHNTJZWElnYlc5dWFYUnZja052WkdWVmMyVWdQU0J5WlhGMWFYSmxLRndpTGk5dGIyNXBkRzl5UTI5a1pWVnpaVndpS1R0Y2JuWmhjaUIzWVhKdWFXNW5JRDBnY21WeGRXbHlaU2hjSWk0dmQyRnlibWx1WjF3aUtUdGNibHh1ZG1GeUlHeGxaMkZqZVVaaFkzUnZjbmxNYjJkeklEMGdlMzA3WEc1bWRXNWpkR2x2YmlCM1lYSnVSbTl5VEdWbllXTjVSbUZqZEc5eWVVTmhiR3dvS1NCN1hHNGdJR2xtSUNnaFVtVmhZM1JNWldkaFkzbEZiR1Z0Wlc1MFJtRmpkRzl5ZVM1ZmFYTk1aV2RoWTNsRFlXeHNWMkZ5Ym1sdVowVnVZV0pzWldRcElIdGNiaUFnSUNCeVpYUjFjbTQ3WEc0Z0lIMWNiaUFnZG1GeUlHOTNibVZ5SUQwZ1VtVmhZM1JEZFhKeVpXNTBUM2R1WlhJdVkzVnljbVZ1ZER0Y2JpQWdkbUZ5SUc1aGJXVWdQU0J2ZDI1bGNpQW1KaUJ2ZDI1bGNpNWpiMjV6ZEhKMVkzUnZjaUEvSUc5M2JtVnlMbU52Ym5OMGNuVmpkRzl5TG1ScGMzQnNZWGxPWVcxbElEb2dKeWM3WEc0Z0lHbG1JQ2doYm1GdFpTa2dlMXh1SUNBZ0lHNWhiV1VnUFNBblUyOXRaWFJvYVc1bkp6dGNiaUFnZlZ4dUlDQnBaaUFvYkdWbllXTjVSbUZqZEc5eWVVeHZaM011YUdGelQzZHVVSEp2Y0dWeWRIa29ibUZ0WlNrcElIdGNiaUFnSUNCeVpYUjFjbTQ3WEc0Z0lIMWNiaUFnYkdWbllXTjVSbUZqZEc5eWVVeHZaM05iYm1GdFpWMGdQU0IwY25WbE8xeHVJQ0FvWENKd2NtOWtkV04wYVc5dVhDSWdJVDA5SUhCeWIyTmxjM011Wlc1MkxrNVBSRVZmUlU1V0lEOGdkMkZ5Ym1sdVp5aGNiaUFnSUNCbVlXeHpaU3hjYmlBZ0lDQnVZVzFsSUNzZ0p5QnBjeUJqWVd4c2FXNW5JR0VnVW1WaFkzUWdZMjl0Y0c5dVpXNTBJR1JwY21WamRHeDVMaUFuSUN0Y2JpQWdJQ0FuVlhObElHRWdabUZqZEc5eWVTQnZjaUJLVTFnZ2FXNXpkR1ZoWkM0Z1UyVmxPaUJvZEhSd09pOHZabUl1YldVdmNtVmhZM1F0YkdWbllXTjVabUZqZEc5eWVTZGNiaUFnS1NBNklHNTFiR3dwTzF4dUlDQnRiMjVwZEc5eVEyOWtaVlZ6WlNnbmNtVmhZM1JmYkdWbllXTjVYMlpoWTNSdmNubGZZMkZzYkNjc0lIc2dkbVZ5YzJsdmJqb2dNeXdnYm1GdFpUb2dibUZ0WlNCOUtUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2QyRnlia1p2Y2xCc1lXbHVSblZ1WTNScGIyNVVlWEJsS0hSNWNHVXBJSHRjYmlBZ2RtRnlJR2x6VW1WaFkzUkRiR0Z6Y3lBOVhHNGdJQ0FnZEhsd1pTNXdjbTkwYjNSNWNHVWdKaVpjYmlBZ0lDQjBlWEJsYjJZZ2RIbHdaUzV3Y205MGIzUjVjR1V1Ylc5MWJuUkRiMjF3YjI1bGJuUWdQVDA5SUNkbWRXNWpkR2x2YmljZ0ppWmNiaUFnSUNCMGVYQmxiMllnZEhsd1pTNXdjbTkwYjNSNWNHVXVjbVZqWldsMlpVTnZiWEJ2Ym1WdWRDQTlQVDBnSjJaMWJtTjBhVzl1Snp0Y2JpQWdhV1lnS0dselVtVmhZM1JEYkdGemN5a2dlMXh1SUNBZ0lDaGNJbkJ5YjJSMVkzUnBiMjVjSWlBaFBUMGdjSEp2WTJWemN5NWxibll1VGs5RVJWOUZUbFlnUHlCM1lYSnVhVzVuS0Z4dUlDQWdJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQW5SR2xrSUc1dmRDQmxlSEJsWTNRZ2RHOGdaMlYwSUdFZ1VtVmhZM1FnWTJ4aGMzTWdhR1Z5WlM0Z1ZYTmxJR0JEYjIxd2IyNWxiblJnSUdsdWMzUmxZV1FnSnlBclhHNGdJQ0FnSUNBbmIyWWdZRU52YlhCdmJtVnVkQzUwZVhCbFlDQnZjaUJnZEdocGN5NWpiMjV6ZEhKMVkzUnZjbUF1SjF4dUlDQWdJQ2tnT2lCdWRXeHNLVHRjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0JwWmlBb0lYUjVjR1V1WDNKbFlXTjBWMkZ5Ym1Wa1JtOXlWR2hwYzFSNWNHVXBJSHRjYmlBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lIUjVjR1V1WDNKbFlXTjBWMkZ5Ym1Wa1JtOXlWR2hwYzFSNWNHVWdQU0IwY25WbE8xeHVJQ0FnSUNBZ2ZTQmpZWFJqYUNBb2VDa2dlMXh1SUNBZ0lDQWdJQ0F2THlCcWRYTjBJR2x1WTJGelpTQjBhR2x6SUdseklHRWdabkp2ZW1WdUlHOWlhbVZqZENCdmNpQnpiMjFsSUhOd1pXTnBZV3dnYjJKcVpXTjBYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnRiMjVwZEc5eVEyOWtaVlZ6WlNoY2JpQWdJQ0FnSUNBZ0ozSmxZV04wWDI1dmJsOWpiMjF3YjI1bGJuUmZhVzVmYW5ONEp5eGNiaUFnSUNBZ0lDQWdleUIyWlhKemFXOXVPaUF6TENCdVlXMWxPaUIwZVhCbExtNWhiV1VnZlZ4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lDQWdLRndpY0hKdlpIVmpkR2x2Ymx3aUlDRTlQU0J3Y205alpYTnpMbVZ1ZGk1T1QwUkZYMFZPVmlBL0lIZGhjbTVwYm1jb1hHNGdJQ0FnSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ2RVYUdseklFcFRXQ0IxYzJWeklHRWdjR3hoYVc0Z1puVnVZM1JwYjI0dUlFOXViSGtnVW1WaFkzUWdZMjl0Y0c5dVpXNTBjeUJoY21VZ0p5QXJYRzRnSUNBZ0lDQW5kbUZzYVdRZ2FXNGdVbVZoWTNSY1hDZHpJRXBUV0NCMGNtRnVjMlp2Y20wdUoxeHVJQ0FnSUNrZ09pQnVkV3hzS1R0Y2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQjNZWEp1Um05eVRtOXVUR1ZuWVdONVJtRmpkRzl5ZVNoMGVYQmxLU0I3WEc0Z0lDaGNJbkJ5YjJSMVkzUnBiMjVjSWlBaFBUMGdjSEp2WTJWemN5NWxibll1VGs5RVJWOUZUbFlnUHlCM1lYSnVhVzVuS0Z4dUlDQWdJR1poYkhObExGeHVJQ0FnSUNkRWJ5QnViM1FnY0dGemN5QlNaV0ZqZEM1RVQwMHVKeUFySUhSNWNHVXVkSGx3WlNBcklDY2dkRzhnU2xOWUlHOXlJR055WldGMFpVWmhZM1J2Y25rdUlDY2dLMXh1SUNBZ0lDZFZjMlVnZEdobElITjBjbWx1WnlCY0lpY2dLeUIwZVhCbExuUjVjR1VnS3lBblhDSWdhVzV6ZEdWaFpDNG5YRzRnSUNrZ09pQnVkV3hzS1R0Y2JuMWNibHh1THlvcVhHNGdLaUJVY21GdWMyWmxjaUJ6ZEdGMGFXTWdjSEp2Y0dWeWRHbGxjeUJtY205dElIUm9aU0J6YjNWeVkyVWdkRzhnZEdobElIUmhjbWRsZEM0Z1JuVnVZM1JwYjI1eklHRnlaVnh1SUNvZ2NtVmliM1Z1WkNCMGJ5Qm9ZWFpsSUhSb2FYTWdjbVZtYkdWamRDQjBhR1VnYjNKcFoybHVZV3dnYzI5MWNtTmxMbHh1SUNvdlhHNW1kVzVqZEdsdmJpQndjbTk0ZVZOMFlYUnBZMDFsZEdodlpITW9kR0Z5WjJWMExDQnpiM1Z5WTJVcElIdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCemIzVnlZMlVnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQnlaWFIxY200N1hHNGdJSDFjYmlBZ1ptOXlJQ2gyWVhJZ2EyVjVJR2x1SUhOdmRYSmpaU2tnZTF4dUlDQWdJR2xtSUNoemIzVnlZMlV1YUdGelQzZHVVSEp2Y0dWeWRIa29hMlY1S1NrZ2UxeHVJQ0FnSUNBZ2RtRnlJSFpoYkhWbElEMGdjMjkxY21ObFcydGxlVjA3WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhaaGJIVmxJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCaWIzVnVaQ0E5SUhaaGJIVmxMbUpwYm1Rb2MyOTFjbU5sS1R0Y2JpQWdJQ0FnSUNBZ0x5OGdRMjl3ZVNCaGJua2djSEp2Y0dWeWRHbGxjeUJrWldacGJtVmtJRzl1SUhSb1pTQm1kVzVqZEdsdmJpd2djM1ZqYUNCaGN5QmdhWE5TWlhGMWFYSmxaR0FnYjI1Y2JpQWdJQ0FnSUNBZ0x5OGdZU0JRY205d1ZIbHdaWE1nZG1Gc2FXUmhkRzl5TGx4dUlDQWdJQ0FnSUNCbWIzSWdLSFpoY2lCcklHbHVJSFpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tIWmhiSFZsTG1oaGMwOTNibEJ5YjNCbGNuUjVLR3NwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpYjNWdVpGdHJYU0E5SUhaaGJIVmxXMnRkTzF4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0IwWVhKblpYUmJhMlY1WFNBOUlHSnZkVzVrTzF4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnZEdGeVoyVjBXMnRsZVYwZ1BTQjJZV3gxWlR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0I5WEc0Z0lIMWNibjFjYmx4dUx5OGdWMlVnZFhObElHRnVJRzlpYW1WamRDQnBibk4wWldGa0lHOW1JR0VnWW05dmJHVmhiaUJpWldOaGRYTmxJR0p2YjJ4bFlXNXpJR0Z5WlNCcFoyNXZjbVZrSUdKNUlHOTFjbHh1THk4Z2JXOWphMmx1WnlCc2FXSnlZWEpwWlhNZ2QyaGxiaUIwYUdWelpTQm1ZV04wYjNKcFpYTWdaMlYwY3lCdGIyTnJaV1F1WEc1MllYSWdURVZIUVVOWlgwMUJVa3RGVWlBOUlIdDlPMXh1ZG1GeUlFNVBUbDlNUlVkQlExbGZUVUZTUzBWU0lEMGdlMzA3WEc1Y2JuWmhjaUJTWldGamRFeGxaMkZqZVVWc1pXMWxiblJHWVdOMGIzSjVJRDBnZTMwN1hHNWNibEpsWVdOMFRHVm5ZV041Uld4bGJXVnVkRVpoWTNSdmNua3VkM0poY0VOeVpXRjBaVVpoWTNSdmNua2dQU0JtZFc1amRHbHZiaWhqY21WaGRHVkdZV04wYjNKNUtTQjdYRzRnSUhaaGNpQnNaV2RoWTNsRGNtVmhkR1ZHWVdOMGIzSjVJRDBnWm5WdVkzUnBiMjRvZEhsd1pTa2dlMXh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkSGx3WlNBaFBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJQ0FnTHk4Z1RtOXVMV1oxYm1OMGFXOXVJSFI1Y0dWeklHTmhibTV2ZENCaVpTQnNaV2RoWTNrZ1ptRmpkRzl5YVdWelhHNGdJQ0FnSUNCeVpYUjFjbTRnWTNKbFlYUmxSbUZqZEc5eWVTaDBlWEJsS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb2RIbHdaUzVwYzFKbFlXTjBUbTl1VEdWbllXTjVSbUZqZEc5eWVTa2dlMXh1SUNBZ0lDQWdMeThnVkdocGN5QnBjeUJ3Y205aVlXSnNlU0JoSUdaaFkzUnZjbmtnWTNKbFlYUmxaQ0JpZVNCU1pXRmpkRVJQVFNCM1pTQjFibmR5WVhBZ2FYUWdkRzhnWjJWMElIUnZYRzRnSUNBZ0lDQXZMeUIwYUdVZ2RXNWtaWEpzZVdsdVp5QnpkSEpwYm1jZ2RIbHdaUzRnU1hRZ2MyaHZkV3hrYmlkMElHaGhkbVVnWW1WbGJpQndZWE56WldRZ2FHVnlaU0J6YnlCM1pWeHVJQ0FnSUNBZ0x5OGdkMkZ5Ymk1Y2JpQWdJQ0FnSUdsbUlDaGNJbkJ5YjJSMVkzUnBiMjVjSWlBaFBUMGdjSEp2WTJWemN5NWxibll1VGs5RVJWOUZUbFlwSUh0Y2JpQWdJQ0FnSUNBZ2QyRnlia1p2Y2s1dmJreGxaMkZqZVVaaFkzUnZjbmtvZEhsd1pTazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnlaWFIxY200Z1kzSmxZWFJsUm1GamRHOXllU2gwZVhCbExuUjVjR1VwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNoMGVYQmxMbWx6VW1WaFkzUk1aV2RoWTNsR1lXTjBiM0o1S1NCN1hHNGdJQ0FnSUNBdkx5QlVhR2x6SUdseklIQnliMkpoWW14NUlHRWdiR1ZuWVdONUlHWmhZM1J2Y25rZ1kzSmxZWFJsWkNCaWVTQlNaV0ZqZEVOdmJYQnZjMmwwWlVOdmJYQnZibVZ1ZEM1Y2JpQWdJQ0FnSUM4dklGZGxJSFZ1ZDNKaGNDQnBkQ0IwYnlCblpYUWdkRzhnZEdobElIVnVaR1Z5YkhscGJtY2dZMnhoYzNNdVhHNGdJQ0FnSUNCeVpYUjFjbTRnWTNKbFlYUmxSbUZqZEc5eWVTaDBlWEJsTG5SNWNHVXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbG1JQ2hjSW5CeWIyUjFZM1JwYjI1Y0lpQWhQVDBnY0hKdlkyVnpjeTVsYm5ZdVRrOUVSVjlGVGxZcElIdGNiaUFnSUNBZ0lIZGhjbTVHYjNKUWJHRnBia1oxYm1OMGFXOXVWSGx3WlNoMGVYQmxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZMeUJWYm14bGMzTWdhWFFuY3lCaElHeGxaMkZqZVNCbVlXTjBiM0o1TENCMGFHVnVJSFJvYVhNZ2FYTWdjSEp2WW1GaWJIa2dZU0J3YkdGcGJpQm1kVzVqZEdsdmJpeGNiaUFnSUNBdkx5QjBhR0YwSUdseklHVjRjR1ZqZEdsdVp5QjBieUJpWlNCcGJuWnZhMlZrSUdKNUlFcFRXQzRnVjJVZ1kyRnVJR3AxYzNRZ2NtVjBkWEp1SUdsMElHRnpJR2x6TGx4dUlDQWdJSEpsZEhWeWJpQjBlWEJsTzF4dUlDQjlPMXh1SUNCeVpYUjFjbTRnYkdWbllXTjVRM0psWVhSbFJtRmpkRzl5ZVR0Y2JuMDdYRzVjYmxKbFlXTjBUR1ZuWVdONVJXeGxiV1Z1ZEVaaFkzUnZjbmt1ZDNKaGNFTnlaV0YwWlVWc1pXMWxiblFnUFNCbWRXNWpkR2x2YmloamNtVmhkR1ZGYkdWdFpXNTBLU0I3WEc0Z0lIWmhjaUJzWldkaFkzbERjbVZoZEdWRmJHVnRaVzUwSUQwZ1puVnVZM1JwYjI0b2RIbHdaU3dnY0hKdmNITXNJR05vYVd4a2NtVnVLU0I3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUIwZVhCbElDRTlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNBdkx5Qk9iMjR0Wm5WdVkzUnBiMjRnZEhsd1pYTWdZMkZ1Ym05MElHSmxJR3hsWjJGamVTQm1ZV04wYjNKcFpYTmNiaUFnSUNBZ0lISmxkSFZ5YmlCamNtVmhkR1ZGYkdWdFpXNTBMbUZ3Y0d4NUtIUm9hWE1zSUdGeVozVnRaVzUwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnZG1GeUlHRnlaM003WEc1Y2JpQWdJQ0JwWmlBb2RIbHdaUzVwYzFKbFlXTjBUbTl1VEdWbllXTjVSbUZqZEc5eWVTa2dlMXh1SUNBZ0lDQWdMeThnVkdocGN5QnBjeUJ3Y205aVlXSnNlU0JoSUdaaFkzUnZjbmtnWTNKbFlYUmxaQ0JpZVNCU1pXRmpkRVJQVFNCM1pTQjFibmR5WVhBZ2FYUWdkRzhnWjJWMElIUnZYRzRnSUNBZ0lDQXZMeUIwYUdVZ2RXNWtaWEpzZVdsdVp5QnpkSEpwYm1jZ2RIbHdaUzRnU1hRZ2MyaHZkV3hrYmlkMElHaGhkbVVnWW1WbGJpQndZWE56WldRZ2FHVnlaU0J6YnlCM1pWeHVJQ0FnSUNBZ0x5OGdkMkZ5Ymk1Y2JpQWdJQ0FnSUdsbUlDaGNJbkJ5YjJSMVkzUnBiMjVjSWlBaFBUMGdjSEp2WTJWemN5NWxibll1VGs5RVJWOUZUbFlwSUh0Y2JpQWdJQ0FnSUNBZ2QyRnlia1p2Y2s1dmJreGxaMkZqZVVaaFkzUnZjbmtvZEhsd1pTazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQmhjbWR6SUQwZ1FYSnlZWGt1Y0hKdmRHOTBlWEJsTG5Oc2FXTmxMbU5oYkd3b1lYSm5kVzFsYm5SekxDQXdLVHRjYmlBZ0lDQWdJR0Z5WjNOYk1GMGdQU0IwZVhCbExuUjVjR1U3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZM0psWVhSbFJXeGxiV1Z1ZEM1aGNIQnNlU2gwYUdsekxDQmhjbWR6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb2RIbHdaUzVwYzFKbFlXTjBUR1ZuWVdONVJtRmpkRzl5ZVNrZ2UxeHVJQ0FnSUNBZ0x5OGdWR2hwY3lCcGN5QndjbTlpWVdKc2VTQmhJR3hsWjJGamVTQm1ZV04wYjNKNUlHTnlaV0YwWldRZ1lua2dVbVZoWTNSRGIyMXdiM05wZEdWRGIyMXdiMjVsYm5RdVhHNGdJQ0FnSUNBdkx5QlhaU0IxYm5keVlYQWdhWFFnZEc4Z1oyVjBJSFJ2SUhSb1pTQjFibVJsY214NWFXNW5JR05zWVhOekxseHVJQ0FnSUNBZ2FXWWdLSFI1Y0dVdVgybHpUVzlqYTBaMWJtTjBhVzl1S1NCN1hHNGdJQ0FnSUNBZ0lDOHZJRWxtSUhSb2FYTWdhWE1nWVNCdGIyTnJJR1oxYm1OMGFXOXVMQ0J3Wlc5d2JHVWdkMmxzYkNCbGVIQmxZM1FnYVhRZ2RHOGdZbVVnWTJGc2JHVmtMaUJYWlZ4dUlDQWdJQ0FnSUNBdkx5QjNhV3hzSUdGamRIVmhiR3g1SUdOaGJHd2dkR2hsSUc5eWFXZHBibUZzSUcxdlkyc2dabUZqZEc5eWVTQm1kVzVqZEdsdmJpQnBibk4wWldGa0xpQlVhR2x6WEc0Z0lDQWdJQ0FnSUM4dklHWjFkSFZ5WlNCd2NtOXZabk1nZFc1cGRDQjBaWE4wYVc1bklIUm9ZWFFnWVhOemRXMWxJSFJvWVhRZ2RHaGxjMlVnWVhKbElHTnNZWE56WlhNdVhHNGdJQ0FnSUNBZ0lIUjVjR1V1ZEhsd1pTNWZiVzlqYTJWa1VtVmhZM1JEYkdGemMwTnZibk4wY25WamRHOXlJRDBnZEhsd1pUdGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lHRnlaM01nUFNCQmNuSmhlUzV3Y205MGIzUjVjR1V1YzJ4cFkyVXVZMkZzYkNoaGNtZDFiV1Z1ZEhNc0lEQXBPMXh1SUNBZ0lDQWdZWEpuYzFzd1hTQTlJSFI1Y0dVdWRIbHdaVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmpjbVZoZEdWRmJHVnRaVzUwTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM01wTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNoY0luQnliMlIxWTNScGIyNWNJaUFoUFQwZ2NISnZZMlZ6Y3k1bGJuWXVUazlFUlY5RlRsWXBJSHRjYmlBZ0lDQWdJSGRoY201R2IzSlFiR0ZwYmtaMWJtTjBhVzl1Vkhsd1pTaDBlWEJsS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVWFHbHpJR2x6SUdKbGFXNW5JR05oYkd4bFpDQjNhWFJvSUdFZ2NHeGhhVzRnWm5WdVkzUnBiMjRnZDJVZ2MyaHZkV3hrSUdsdWRtOXJaU0JwZEZ4dUlDQWdJQzh2SUdsdGJXVmthV0YwWld4NUlHRnpJR2xtSUhSb2FYTWdkMkZ6SUhWelpXUWdkMmwwYUNCc1pXZGhZM2tnU2xOWUxseHVJQ0FnSUhKbGRIVnliaUIwZVhCbExtRndjR3g1S0c1MWJHd3NJRUZ5Y21GNUxuQnliM1J2ZEhsd1pTNXpiR2xqWlM1allXeHNLR0Z5WjNWdFpXNTBjeXdnTVNrcE8xeHVJQ0I5TzF4dUlDQnlaWFIxY200Z2JHVm5ZV041UTNKbFlYUmxSV3hsYldWdWREdGNibjA3WEc1Y2JsSmxZV04wVEdWbllXTjVSV3hsYldWdWRFWmhZM1J2Y25rdWQzSmhjRVpoWTNSdmNua2dQU0JtZFc1amRHbHZiaWhtWVdOMGIzSjVLU0I3WEc0Z0lDaGNJbkJ5YjJSMVkzUnBiMjVjSWlBaFBUMGdjSEp2WTJWemN5NWxibll1VGs5RVJWOUZUbFlnUHlCcGJuWmhjbWxoYm5Rb1hHNGdJQ0FnZEhsd1pXOW1JR1poWTNSdmNua2dQVDA5SUNkbWRXNWpkR2x2Ymljc1hHNGdJQ0FnSjFSb2FYTWdhWE1nYzNWd2NHOXpaU0IwYnlCaFkyTmxjSFFnWVNCbGJHVnRaVzUwSUdaaFkzUnZjbmtuWEc0Z0lDa2dPaUJwYm5aaGNtbGhiblFvZEhsd1pXOW1JR1poWTNSdmNua2dQVDA5SUNkbWRXNWpkR2x2YmljcEtUdGNiaUFnZG1GeUlHeGxaMkZqZVVWc1pXMWxiblJHWVdOMGIzSjVJRDBnWm5WdVkzUnBiMjRvWTI5dVptbG5MQ0JqYUdsc1pISmxiaWtnZTF4dUlDQWdJQzh2SUZSb2FYTWdabUZqZEc5eWVTQnphRzkxYkdRZ2JtOTBJR0psSUdOaGJHeGxaQ0IzYUdWdUlFcFRXQ0JwY3lCMWMyVmtMaUJWYzJVZ1NsTllJR2x1YzNSbFlXUXVYRzRnSUNBZ2FXWWdLRndpY0hKdlpIVmpkR2x2Ymx3aUlDRTlQU0J3Y205alpYTnpMbVZ1ZGk1T1QwUkZYMFZPVmlrZ2UxeHVJQ0FnSUNBZ2QyRnlia1p2Y2t4bFoyRmplVVpoWTNSdmNubERZV3hzS0NrN1hHNGdJQ0FnZlZ4dUlDQWdJSEpsZEhWeWJpQm1ZV04wYjNKNUxtRndjR3g1S0hSb2FYTXNJR0Z5WjNWdFpXNTBjeWs3WEc0Z0lIMDdYRzRnSUhCeWIzaDVVM1JoZEdsalRXVjBhRzlrY3loc1pXZGhZM2xGYkdWdFpXNTBSbUZqZEc5eWVTd2dabUZqZEc5eWVTNTBlWEJsS1R0Y2JpQWdiR1ZuWVdONVJXeGxiV1Z1ZEVaaFkzUnZjbmt1YVhOU1pXRmpkRXhsWjJGamVVWmhZM1J2Y25rZ1BTQk1SVWRCUTFsZlRVRlNTMFZTTzF4dUlDQnNaV2RoWTNsRmJHVnRaVzUwUm1GamRHOXllUzUwZVhCbElEMGdabUZqZEc5eWVTNTBlWEJsTzF4dUlDQnlaWFIxY200Z2JHVm5ZV041Uld4bGJXVnVkRVpoWTNSdmNuazdYRzU5TzF4dVhHNHZMeUJVYUdseklHbHpJSFZ6WldRZ2RHOGdiV0Z5YXlCaElHWmhZM1J2Y25rZ2RHaGhkQ0IzYVd4c0lISmxiV0ZwYmk0Z1JTNW5MaUIzWlNkeVpTQmhiR3h2ZDJWa0lIUnZJR05oYkd4Y2JpOHZJR2wwSUdGeklHRWdablZ1WTNScGIyNHVJRWh2ZDJWMlpYSXNJSGx2ZFNkeVpTQnViM1FnYzNWd2NHOXpaU0IwYnlCd1lYTnpJR2wwSUhSdklHTnlaV0YwWlVWc1pXMWxiblJjYmk4dklHOXlJR055WldGMFpVWmhZM1J2Y25rc0lITnZJR2wwSUhkcGJHd2dkMkZ5YmlCNWIzVWdhV1lnZVc5MUlHUnZMbHh1VW1WaFkzUk1aV2RoWTNsRmJHVnRaVzUwUm1GamRHOXllUzV0WVhKclRtOXVUR1ZuWVdONVJtRmpkRzl5ZVNBOUlHWjFibU4wYVc5dUtHWmhZM1J2Y25rcElIdGNiaUFnWm1GamRHOXllUzVwYzFKbFlXTjBUbTl1VEdWbllXTjVSbUZqZEc5eWVTQTlJRTVQVGw5TVJVZEJRMWxmVFVGU1MwVlNPMXh1SUNCeVpYUjFjbTRnWm1GamRHOXllVHRjYm4wN1hHNWNiaTh2SUVOb1pXTnJjeUJwWmlCaElHWmhZM1J2Y25rZ1puVnVZM1JwYjI0Z2FYTWdZV04wZFdGc2JIa2dZU0JzWldkaFkza2dabUZqZEc5eWVTQndjbVYwWlc1a2FXNW5JSFJ2WEc0dkx5QmlaU0JoSUdOc1lYTnpMbHh1VW1WaFkzUk1aV2RoWTNsRmJHVnRaVzUwUm1GamRHOXllUzVwYzFaaGJHbGtSbUZqZEc5eWVTQTlJR1oxYm1OMGFXOXVLR1poWTNSdmNua3BJSHRjYmlBZ0x5OGdWRTlFVHpvZ1ZHaHBjeUIzYVd4c0lHSmxJSEpsYlc5MlpXUWdZVzVrSUcxdmRtVmtJR2x1ZEc4Z1lTQmpiR0Z6Y3lCMllXeHBaR0YwYjNJZ2IzSWdjMjl0WlhSb2FXNW5MbHh1SUNCeVpYUjFjbTRnZEhsd1pXOW1JR1poWTNSdmNua2dQVDA5SUNkbWRXNWpkR2x2YmljZ0ppWmNiaUFnSUNCbVlXTjBiM0o1TG1selVtVmhZM1JNWldkaFkzbEdZV04wYjNKNUlEMDlQU0JNUlVkQlExbGZUVUZTUzBWU08xeHVmVHRjYmx4dVVtVmhZM1JNWldkaFkzbEZiR1Z0Wlc1MFJtRmpkRzl5ZVM1cGMxWmhiR2xrUTJ4aGMzTWdQU0JtZFc1amRHbHZiaWhtWVdOMGIzSjVLU0I3WEc0Z0lHbG1JQ2hjSW5CeWIyUjFZM1JwYjI1Y0lpQWhQVDBnY0hKdlkyVnpjeTVsYm5ZdVRrOUVSVjlGVGxZcElIdGNiaUFnSUNBb1hDSndjbTlrZFdOMGFXOXVYQ0lnSVQwOUlIQnliMk5sYzNNdVpXNTJMazVQUkVWZlJVNVdJRDhnZDJGeWJtbHVaeWhjYmlBZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ0oybHpWbUZzYVdSRGJHRnpjeUJwY3lCa1pYQnlaV05oZEdWa0lHRnVaQ0IzYVd4c0lHSmxJSEpsYlc5MlpXUWdhVzRnWVNCbWRYUjFjbVVnY21Wc1pXRnpaUzRnSnlBclhHNGdJQ0FnSUNBblZYTmxJR0VnYlc5eVpTQnpjR1ZqYVdacFl5QjJZV3hwWkdGMGIzSWdhVzV6ZEdWaFpDNG5YRzRnSUNBZ0tTQTZJRzUxYkd3cE8xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCU1pXRmpkRXhsWjJGamVVVnNaVzFsYm5SR1lXTjBiM0o1TG1selZtRnNhV1JHWVdOMGIzSjVLR1poWTNSdmNua3BPMXh1ZlR0Y2JseHVVbVZoWTNSTVpXZGhZM2xGYkdWdFpXNTBSbUZqZEc5eWVTNWZhWE5NWldkaFkzbERZV3hzVjJGeWJtbHVaMFZ1WVdKc1pXUWdQU0IwY25WbE8xeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJRkpsWVdOMFRHVm5ZV041Uld4bGJXVnVkRVpoWTNSdmNuazdYRzRpWFgwPSIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBSZWFjdFByb3BUeXBlTG9jYXRpb25zXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBrZXlNaXJyb3IgPSByZXF1aXJlKFwiLi9rZXlNaXJyb3JcIik7XG5cbnZhciBSZWFjdFByb3BUeXBlTG9jYXRpb25zID0ga2V5TWlycm9yKHtcbiAgcHJvcDogbnVsbCxcbiAgY29udGV4dDogbnVsbCxcbiAgY2hpbGRDb250ZXh0OiBudWxsXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFByb3BUeXBlTG9jYXRpb25zO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGVtcHR5RnVuY3Rpb25cbiAqL1xuXG5mdW5jdGlvbiBtYWtlRW1wdHlGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBhcmc7XG4gIH07XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIGFuZCBkaXNjYXJkcyBpbnB1dHM7IGl0IGhhcyBubyBzaWRlIGVmZmVjdHMuIFRoaXMgaXNcbiAqIHByaW1hcmlseSB1c2VmdWwgaWRpb21hdGljYWxseSBmb3Igb3ZlcnJpZGFibGUgZnVuY3Rpb24gZW5kcG9pbnRzIHdoaWNoXG4gKiBhbHdheXMgbmVlZCB0byBiZSBjYWxsYWJsZSwgc2luY2UgSlMgbGFja3MgYSBudWxsLWNhbGwgaWRpb20gYWxhIENvY29hLlxuICovXG5mdW5jdGlvbiBlbXB0eUZ1bmN0aW9uKCkge31cblxuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJucyA9IG1ha2VFbXB0eUZ1bmN0aW9uO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc0ZhbHNlID0gbWFrZUVtcHR5RnVuY3Rpb24oZmFsc2UpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc1RydWUgPSBtYWtlRW1wdHlGdW5jdGlvbih0cnVlKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsID0gbWFrZUVtcHR5RnVuY3Rpb24obnVsbCk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVGhpcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNBcmd1bWVudCA9IGZ1bmN0aW9uKGFyZykgeyByZXR1cm4gYXJnOyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5RnVuY3Rpb247XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGludmFyaWFudFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICtcbiAgICAgICAgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdJbnZhcmlhbnQgVmlvbGF0aW9uOiAnICtcbiAgICAgICAgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJnc1thcmdJbmRleCsrXTsgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJykpXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5eVpXRmpkQzlzYVdJdmFXNTJZWEpwWVc1MExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSWk4cUtseHVJQ29nUTI5d2VYSnBaMmgwSURJd01UTXRNakF4TkN3Z1JtRmpaV0p2YjJzc0lFbHVZeTVjYmlBcUlFRnNiQ0J5YVdkb2RITWdjbVZ6WlhKMlpXUXVYRzRnS2x4dUlDb2dWR2hwY3lCemIzVnlZMlVnWTI5a1pTQnBjeUJzYVdObGJuTmxaQ0IxYm1SbGNpQjBhR1VnUWxORUxYTjBlV3hsSUd4cFkyVnVjMlVnWm05MWJtUWdhVzRnZEdobFhHNGdLaUJNU1VORlRsTkZJR1pwYkdVZ2FXNGdkR2hsSUhKdmIzUWdaR2x5WldOMGIzSjVJRzltSUhSb2FYTWdjMjkxY21ObElIUnlaV1V1SUVGdUlHRmtaR2wwYVc5dVlXd2daM0poYm5SY2JpQXFJRzltSUhCaGRHVnVkQ0J5YVdkb2RITWdZMkZ1SUdKbElHWnZkVzVrSUdsdUlIUm9aU0JRUVZSRlRsUlRJR1pwYkdVZ2FXNGdkR2hsSUhOaGJXVWdaR2x5WldOMGIzSjVMbHh1SUNwY2JpQXFJRUJ3Y205MmFXUmxjMDF2WkhWc1pTQnBiblpoY21saGJuUmNiaUFxTDF4dVhHNWNJblZ6WlNCemRISnBZM1JjSWp0Y2JseHVMeW9xWEc0Z0tpQlZjMlVnYVc1MllYSnBZVzUwS0NrZ2RHOGdZWE56WlhKMElITjBZWFJsSUhkb2FXTm9JSGx2ZFhJZ2NISnZaM0poYlNCaGMzTjFiV1Z6SUhSdklHSmxJSFJ5ZFdVdVhHNGdLbHh1SUNvZ1VISnZkbWxrWlNCemNISnBiblJtTFhOMGVXeGxJR1p2Y20xaGRDQW9iMjVzZVNBbGN5QnBjeUJ6ZFhCd2IzSjBaV1FwSUdGdVpDQmhjbWQxYldWdWRITmNiaUFxSUhSdklIQnliM1pwWkdVZ2FXNW1iM0p0WVhScGIyNGdZV0p2ZFhRZ2QyaGhkQ0JpY205clpTQmhibVFnZDJoaGRDQjViM1VnZDJWeVpWeHVJQ29nWlhod1pXTjBhVzVuTGx4dUlDcGNiaUFxSUZSb1pTQnBiblpoY21saGJuUWdiV1Z6YzJGblpTQjNhV3hzSUdKbElITjBjbWx3Y0dWa0lHbHVJSEJ5YjJSMVkzUnBiMjRzSUdKMWRDQjBhR1VnYVc1MllYSnBZVzUwWEc0Z0tpQjNhV3hzSUhKbGJXRnBiaUIwYnlCbGJuTjFjbVVnYkc5bmFXTWdaRzlsY3lCdWIzUWdaR2xtWm1WeUlHbHVJSEJ5YjJSMVkzUnBiMjR1WEc0Z0tpOWNibHh1ZG1GeUlHbHVkbUZ5YVdGdWRDQTlJR1oxYm1OMGFXOXVLR052Ym1ScGRHbHZiaXdnWm05eWJXRjBMQ0JoTENCaUxDQmpMQ0JrTENCbExDQm1LU0I3WEc0Z0lHbG1JQ2hjSW5CeWIyUjFZM1JwYjI1Y0lpQWhQVDBnY0hKdlkyVnpjeTVsYm5ZdVRrOUVSVjlGVGxZcElIdGNiaUFnSUNCcFppQW9abTl5YldGMElEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWduYVc1MllYSnBZVzUwSUhKbGNYVnBjbVZ6SUdGdUlHVnljbTl5SUcxbGMzTmhaMlVnWVhKbmRXMWxiblFuS1R0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCcFppQW9JV052Ym1ScGRHbHZiaWtnZTF4dUlDQWdJSFpoY2lCbGNuSnZjanRjYmlBZ0lDQnBaaUFvWm05eWJXRjBJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lHVnljbTl5SUQwZ2JtVjNJRVZ5Y205eUtGeHVJQ0FnSUNBZ0lDQW5UV2x1YVdacFpXUWdaWGhqWlhCMGFXOXVJRzlqWTNWeWNtVmtPeUIxYzJVZ2RHaGxJRzV2YmkxdGFXNXBabWxsWkNCa1pYWWdaVzUyYVhKdmJtMWxiblFnSnlBclhHNGdJQ0FnSUNBZ0lDZG1iM0lnZEdobElHWjFiR3dnWlhKeWIzSWdiV1Z6YzJGblpTQmhibVFnWVdSa2FYUnBiMjVoYkNCb1pXeHdablZzSUhkaGNtNXBibWR6TGlkY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJSFpoY2lCaGNtZHpJRDBnVzJFc0lHSXNJR01zSUdRc0lHVXNJR1pkTzF4dUlDQWdJQ0FnZG1GeUlHRnlaMGx1WkdWNElEMGdNRHRjYmlBZ0lDQWdJR1Z5Y205eUlEMGdibVYzSUVWeWNtOXlLRnh1SUNBZ0lDQWdJQ0FuU1c1MllYSnBZVzUwSUZacGIyeGhkR2x2YmpvZ0p5QXJYRzRnSUNBZ0lDQWdJR1p2Y20xaGRDNXlaWEJzWVdObEtDOGxjeTluTENCbWRXNWpkR2x2YmlncElIc2djbVYwZFhKdUlHRnlaM05iWVhKblNXNWtaWGdySzEwN0lIMHBYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHVnljbTl5TG1aeVlXMWxjMVJ2VUc5d0lEMGdNVHNnTHk4Z2QyVWdaRzl1SjNRZ1kyRnlaU0JoWW05MWRDQnBiblpoY21saGJuUW5jeUJ2ZDI0Z1puSmhiV1ZjYmlBZ0lDQjBhSEp2ZHlCbGNuSnZjanRjYmlBZ2ZWeHVmVHRjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCcGJuWmhjbWxoYm5RN1hHNGlYWDA9IiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICpcbiAqIEBwcm92aWRlc01vZHVsZSBrZXlNaXJyb3JcbiAqIEB0eXBlY2hlY2tzIHN0YXRpYy1vbmx5XG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKFwiLi9pbnZhcmlhbnRcIik7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICB2YXIgQ09MT1JTID0ga2V5TWlycm9yKHtibHVlOiBudWxsLCByZWQ6IG51bGx9KTtcbiAqICAgdmFyIG15Q29sb3IgPSBDT0xPUlMuYmx1ZTtcbiAqICAgdmFyIGlzQ29sb3JWYWxpZCA9ICEhQ09MT1JTW215Q29sb3JdO1xuICpcbiAqIFRoZSBsYXN0IGxpbmUgY291bGQgbm90IGJlIHBlcmZvcm1lZCBpZiB0aGUgdmFsdWVzIG9mIHRoZSBnZW5lcmF0ZWQgZW51bSB3ZXJlXG4gKiBub3QgZXF1YWwgdG8gdGhlaXIga2V5cy5cbiAqXG4gKiAgIElucHV0OiAge2tleTE6IHZhbDEsIGtleTI6IHZhbDJ9XG4gKiAgIE91dHB1dDoge2tleTE6IGtleTEsIGtleTI6IGtleTJ9XG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG52YXIga2V5TWlycm9yID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgdmFyIGtleTtcbiAgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOViA/IGludmFyaWFudChcbiAgICBvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSxcbiAgICAna2V5TWlycm9yKC4uLik6IEFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0LidcbiAgKSA6IGludmFyaWFudChvYmogaW5zdGFuY2VvZiBPYmplY3QgJiYgIUFycmF5LmlzQXJyYXkob2JqKSkpO1xuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmV0W2tleV0gPSBrZXk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5TWlycm9yO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl5WldGamRDOXNhV0l2YTJWNVRXbHljbTl5TG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lMeW9xWEc0Z0tpQkRiM0I1Y21sbmFIUWdNakF4TXkweU1ERTBMQ0JHWVdObFltOXZheXdnU1c1akxseHVJQ29nUVd4c0lISnBaMmgwY3lCeVpYTmxjblpsWkM1Y2JpQXFYRzRnS2lCVWFHbHpJSE52ZFhKalpTQmpiMlJsSUdseklHeHBZMlZ1YzJWa0lIVnVaR1Z5SUhSb1pTQkNVMFF0YzNSNWJHVWdiR2xqWlc1elpTQm1iM1Z1WkNCcGJpQjBhR1ZjYmlBcUlFeEpRMFZPVTBVZ1ptbHNaU0JwYmlCMGFHVWdjbTl2ZENCa2FYSmxZM1J2Y25rZ2IyWWdkR2hwY3lCemIzVnlZMlVnZEhKbFpTNGdRVzRnWVdSa2FYUnBiMjVoYkNCbmNtRnVkRnh1SUNvZ2IyWWdjR0YwWlc1MElISnBaMmgwY3lCallXNGdZbVVnWm05MWJtUWdhVzRnZEdobElGQkJWRVZPVkZNZ1ptbHNaU0JwYmlCMGFHVWdjMkZ0WlNCa2FYSmxZM1J2Y25rdVhHNGdLbHh1SUNvZ1FIQnliM1pwWkdWelRXOWtkV3hsSUd0bGVVMXBjbkp2Y2x4dUlDb2dRSFI1Y0dWamFHVmphM01nYzNSaGRHbGpMVzl1YkhsY2JpQXFMMXh1WEc1Y0luVnpaU0J6ZEhKcFkzUmNJanRjYmx4dWRtRnlJR2x1ZG1GeWFXRnVkQ0E5SUhKbGNYVnBjbVVvWENJdUwybHVkbUZ5YVdGdWRGd2lLVHRjYmx4dUx5b3FYRzRnS2lCRGIyNXpkSEoxWTNSeklHRnVJR1Z1ZFcxbGNtRjBhVzl1SUhkcGRHZ2dhMlY1Y3lCbGNYVmhiQ0IwYnlCMGFHVnBjaUIyWVd4MVpTNWNiaUFxWEc0Z0tpQkdiM0lnWlhoaGJYQnNaVHBjYmlBcVhHNGdLaUFnSUhaaGNpQkRUMHhQVWxNZ1BTQnJaWGxOYVhKeWIzSW9lMkpzZFdVNklHNTFiR3dzSUhKbFpEb2diblZzYkgwcE8xeHVJQ29nSUNCMllYSWdiWGxEYjJ4dmNpQTlJRU5QVEU5U1V5NWliSFZsTzF4dUlDb2dJQ0IyWVhJZ2FYTkRiMnh2Y2xaaGJHbGtJRDBnSVNGRFQweFBVbE5iYlhsRGIyeHZjbDA3WEc0Z0tseHVJQ29nVkdobElHeGhjM1FnYkdsdVpTQmpiM1ZzWkNCdWIzUWdZbVVnY0dWeVptOXliV1ZrSUdsbUlIUm9aU0IyWVd4MVpYTWdiMllnZEdobElHZGxibVZ5WVhSbFpDQmxiblZ0SUhkbGNtVmNiaUFxSUc1dmRDQmxjWFZoYkNCMGJ5QjBhR1ZwY2lCclpYbHpMbHh1SUNwY2JpQXFJQ0FnU1c1d2RYUTZJQ0I3YTJWNU1Ub2dkbUZzTVN3Z2EyVjVNam9nZG1Gc01uMWNiaUFxSUNBZ1QzVjBjSFYwT2lCN2EyVjVNVG9nYTJWNU1Td2dhMlY1TWpvZ2EyVjVNbjFjYmlBcVhHNGdLaUJBY0dGeVlXMGdlMjlpYW1WamRIMGdiMkpxWEc0Z0tpQkFjbVYwZFhKdUlIdHZZbXBsWTNSOVhHNGdLaTljYm5aaGNpQnJaWGxOYVhKeWIzSWdQU0JtZFc1amRHbHZiaWh2WW1vcElIdGNiaUFnZG1GeUlISmxkQ0E5SUh0OU8xeHVJQ0IyWVhJZ2EyVjVPMXh1SUNBb1hDSndjbTlrZFdOMGFXOXVYQ0lnSVQwOUlIQnliMk5sYzNNdVpXNTJMazVQUkVWZlJVNVdJRDhnYVc1MllYSnBZVzUwS0Z4dUlDQWdJRzlpYWlCcGJuTjBZVzVqWlc5bUlFOWlhbVZqZENBbUppQWhRWEp5WVhrdWFYTkJjbkpoZVNodlltb3BMRnh1SUNBZ0lDZHJaWGxOYVhKeWIzSW9MaTR1S1RvZ1FYSm5kVzFsYm5RZ2JYVnpkQ0JpWlNCaGJpQnZZbXBsWTNRdUoxeHVJQ0FwSURvZ2FXNTJZWEpwWVc1MEtHOWlhaUJwYm5OMFlXNWpaVzltSUU5aWFtVmpkQ0FtSmlBaFFYSnlZWGt1YVhOQmNuSmhlU2h2WW1vcEtTazdYRzRnSUdadmNpQW9hMlY1SUdsdUlHOWlhaWtnZTF4dUlDQWdJR2xtSUNnaGIySnFMbWhoYzA5M2JsQnliM0JsY25SNUtHdGxlU2twSUh0Y2JpQWdJQ0FnSUdOdmJuUnBiblZsTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFJiYTJWNVhTQTlJR3RsZVR0Y2JpQWdmVnh1SUNCeVpYUjFjbTRnY21WME8xeHVmVHRjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCclpYbE5hWEp5YjNJN1hHNGlYWDA9IiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIG1hcE9iamVjdFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBFeGVjdXRlcyB0aGUgcHJvdmlkZWQgYGNhbGxiYWNrYCBvbmNlIGZvciBlYWNoIGVudW1lcmFibGUgb3duIHByb3BlcnR5IGluIHRoZVxuICogb2JqZWN0IGFuZCBjb25zdHJ1Y3RzIGEgbmV3IG9iamVjdCBmcm9tIHRoZSByZXN1bHRzLiBUaGUgYGNhbGxiYWNrYCBpc1xuICogaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czpcbiAqXG4gKiAgLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAqICAtIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgLSB0aGUgb2JqZWN0IGJlaW5nIHRyYXZlcnNlZFxuICpcbiAqIFByb3BlcnRpZXMgdGhhdCBhcmUgYWRkZWQgYWZ0ZXIgdGhlIGNhbGwgdG8gYG1hcE9iamVjdGAgd2lsbCBub3QgYmUgdmlzaXRlZFxuICogYnkgYGNhbGxiYWNrYC4gSWYgdGhlIHZhbHVlcyBvZiBleGlzdGluZyBwcm9wZXJ0aWVzIGFyZSBjaGFuZ2VkLCB0aGUgdmFsdWVcbiAqIHBhc3NlZCB0byBgY2FsbGJhY2tgIHdpbGwgYmUgdGhlIHZhbHVlIGF0IHRoZSB0aW1lIGBtYXBPYmplY3RgIHZpc2l0cyB0aGVtLlxuICogUHJvcGVydGllcyB0aGF0IGFyZSBkZWxldGVkIGJlZm9yZSBiZWluZyB2aXNpdGVkIGFyZSBub3QgdmlzaXRlZC5cbiAqXG4gKiBAZ3JlcCBmdW5jdGlvbiBvYmplY3RNYXAoKVxuICogQGdyZXAgZnVuY3Rpb24gb2JqTWFwKClcbiAqXG4gKiBAcGFyYW0gez9vYmplY3R9IG9iamVjdFxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBwYXJhbSB7Kn0gY29udGV4dFxuICogQHJldHVybiB7P29iamVjdH1cbiAqL1xuZnVuY3Rpb24gbWFwT2JqZWN0KG9iamVjdCwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgaWYgKCFvYmplY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2YXIgcmVzdWx0ID0ge307XG4gIGZvciAodmFyIG5hbWUgaW4gb2JqZWN0KSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBuYW1lKSkge1xuICAgICAgcmVzdWx0W25hbWVdID0gY2FsbGJhY2suY2FsbChjb250ZXh0LCBvYmplY3RbbmFtZV0sIG5hbWUsIG9iamVjdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwT2JqZWN0O1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQ29weXJpZ2h0IDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgbW9uaXRvckNvZGVVc2VcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGludmFyaWFudCA9IHJlcXVpcmUoXCIuL2ludmFyaWFudFwiKTtcblxuLyoqXG4gKiBQcm92aWRlcyBvcGVuLXNvdXJjZSBjb21wYXRpYmxlIGluc3RydW1lbnRhdGlvbiBmb3IgbW9uaXRvcmluZyBjZXJ0YWluIEFQSVxuICogdXNlcyBiZWZvcmUgd2UncmUgcmVhZHkgdG8gaXNzdWUgYSB3YXJuaW5nIG9yIHJlZmFjdG9yLiBJdCBhY2NlcHRzIGFuIGV2ZW50XG4gKiBuYW1lIHdoaWNoIG1heSBvbmx5IGNvbnRhaW4gdGhlIGNoYXJhY3RlcnMgW2EtejAtOV9dIGFuZCBhbiBvcHRpb25hbCBkYXRhXG4gKiBvYmplY3Qgd2l0aCBmdXJ0aGVyIGluZm9ybWF0aW9uLlxuICovXG5cbmZ1bmN0aW9uIG1vbml0b3JDb2RlVXNlKGV2ZW50TmFtZSwgZGF0YSkge1xuICAoXCJwcm9kdWN0aW9uXCIgIT09IHByb2Nlc3MuZW52Lk5PREVfRU5WID8gaW52YXJpYW50KFxuICAgIGV2ZW50TmFtZSAmJiAhL1teYS16MC05X10vLnRlc3QoZXZlbnROYW1lKSxcbiAgICAnWW91IG11c3QgcHJvdmlkZSBhbiBldmVudE5hbWUgdXNpbmcgb25seSB0aGUgY2hhcmFjdGVycyBbYS16MC05X10nXG4gICkgOiBpbnZhcmlhbnQoZXZlbnROYW1lICYmICEvW15hLXowLTlfXS8udGVzdChldmVudE5hbWUpKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW9uaXRvckNvZGVVc2U7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OXlaV0ZqZEM5c2FXSXZiVzl1YVhSdmNrTnZaR1ZWYzJVdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqdEJRVUZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdktpcGNiaUFxSUVOdmNIbHlhV2RvZENBeU1ERTBMQ0JHWVdObFltOXZheXdnU1c1akxseHVJQ29nUVd4c0lISnBaMmgwY3lCeVpYTmxjblpsWkM1Y2JpQXFYRzRnS2lCVWFHbHpJSE52ZFhKalpTQmpiMlJsSUdseklHeHBZMlZ1YzJWa0lIVnVaR1Z5SUhSb1pTQkNVMFF0YzNSNWJHVWdiR2xqWlc1elpTQm1iM1Z1WkNCcGJpQjBhR1ZjYmlBcUlFeEpRMFZPVTBVZ1ptbHNaU0JwYmlCMGFHVWdjbTl2ZENCa2FYSmxZM1J2Y25rZ2IyWWdkR2hwY3lCemIzVnlZMlVnZEhKbFpTNGdRVzRnWVdSa2FYUnBiMjVoYkNCbmNtRnVkRnh1SUNvZ2IyWWdjR0YwWlc1MElISnBaMmgwY3lCallXNGdZbVVnWm05MWJtUWdhVzRnZEdobElGQkJWRVZPVkZNZ1ptbHNaU0JwYmlCMGFHVWdjMkZ0WlNCa2FYSmxZM1J2Y25rdVhHNGdLbHh1SUNvZ1FIQnliM1pwWkdWelRXOWtkV3hsSUcxdmJtbDBiM0pEYjJSbFZYTmxYRzRnS2k5Y2JseHVYQ0oxYzJVZ2MzUnlhV04wWENJN1hHNWNiblpoY2lCcGJuWmhjbWxoYm5RZ1BTQnlaWEYxYVhKbEtGd2lMaTlwYm5aaGNtbGhiblJjSWlrN1hHNWNiaThxS2x4dUlDb2dVSEp2ZG1sa1pYTWdiM0JsYmkxemIzVnlZMlVnWTI5dGNHRjBhV0pzWlNCcGJuTjBjblZ0Wlc1MFlYUnBiMjRnWm05eUlHMXZibWwwYjNKcGJtY2dZMlZ5ZEdGcGJpQkJVRWxjYmlBcUlIVnpaWE1nWW1WbWIzSmxJSGRsSjNKbElISmxZV1I1SUhSdklHbHpjM1ZsSUdFZ2QyRnlibWx1WnlCdmNpQnlaV1poWTNSdmNpNGdTWFFnWVdOalpYQjBjeUJoYmlCbGRtVnVkRnh1SUNvZ2JtRnRaU0IzYUdsamFDQnRZWGtnYjI1c2VTQmpiMjUwWVdsdUlIUm9aU0JqYUdGeVlXTjBaWEp6SUZ0aExYb3dMVGxmWFNCaGJtUWdZVzRnYjNCMGFXOXVZV3dnWkdGMFlWeHVJQ29nYjJKcVpXTjBJSGRwZEdnZ1puVnlkR2hsY2lCcGJtWnZjbTFoZEdsdmJpNWNiaUFxTDF4dVhHNW1kVzVqZEdsdmJpQnRiMjVwZEc5eVEyOWtaVlZ6WlNobGRtVnVkRTVoYldVc0lHUmhkR0VwSUh0Y2JpQWdLRndpY0hKdlpIVmpkR2x2Ymx3aUlDRTlQU0J3Y205alpYTnpMbVZ1ZGk1T1QwUkZYMFZPVmlBL0lHbHVkbUZ5YVdGdWRDaGNiaUFnSUNCbGRtVnVkRTVoYldVZ0ppWWdJUzliWG1FdGVqQXRPVjlkTHk1MFpYTjBLR1YyWlc1MFRtRnRaU2tzWEc0Z0lDQWdKMWx2ZFNCdGRYTjBJSEJ5YjNacFpHVWdZVzRnWlhabGJuUk9ZVzFsSUhWemFXNW5JRzl1YkhrZ2RHaGxJR05vWVhKaFkzUmxjbk1nVzJFdGVqQXRPVjlkSjF4dUlDQXBJRG9nYVc1MllYSnBZVzUwS0dWMlpXNTBUbUZ0WlNBbUppQWhMMXRlWVMxNk1DMDVYMTB2TG5SbGMzUW9aWFpsYm5ST1lXMWxLU2twTzF4dWZWeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJRzF2Ym1sMGIzSkRiMlJsVlhObE8xeHVJbDE5IiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQ29weXJpZ2h0IDIwMTQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqXG4gKiBAcHJvdmlkZXNNb2R1bGUgd2FybmluZ1xuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgZW1wdHlGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL2VtcHR5RnVuY3Rpb25cIik7XG5cbi8qKlxuICogU2ltaWxhciB0byBpbnZhcmlhbnQgYnV0IG9ubHkgbG9ncyBhIHdhcm5pbmcgaWYgdGhlIGNvbmRpdGlvbiBpcyBub3QgbWV0LlxuICogVGhpcyBjYW4gYmUgdXNlZCB0byBsb2cgaXNzdWVzIGluIGRldmVsb3BtZW50IGVudmlyb25tZW50cyBpbiBjcml0aWNhbFxuICogcGF0aHMuIFJlbW92aW5nIHRoZSBsb2dnaW5nIGNvZGUgZm9yIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRzIHdpbGwga2VlcCB0aGVcbiAqIHNhbWUgbG9naWMgYW5kIGZvbGxvdyB0aGUgc2FtZSBjb2RlIHBhdGhzLlxuICovXG5cbnZhciB3YXJuaW5nID0gZW1wdHlGdW5jdGlvbjtcblxuaWYgKFwicHJvZHVjdGlvblwiICE9PSBwcm9jZXNzLmVudi5OT0RFX0VOVikge1xuICB3YXJuaW5nID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQgKSB7Zm9yICh2YXIgYXJncz1bXSwkX18wPTIsJF9fMT1hcmd1bWVudHMubGVuZ3RoOyRfXzA8JF9fMTskX18wKyspIGFyZ3MucHVzaChhcmd1bWVudHNbJF9fMF0pO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnYHdhcm5pbmcoY29uZGl0aW9uLCBmb3JtYXQsIC4uLmFyZ3MpYCByZXF1aXJlcyBhIHdhcm5pbmcgJyArXG4gICAgICAgICdtZXNzYWdlIGFyZ3VtZW50J1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGNvbnNvbGUud2FybignV2FybmluZzogJyArIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpICB7cmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107fSkpO1xuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3YXJuaW5nO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl5WldGamRDOXNhV0l2ZDJGeWJtbHVaeTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl2S2lwY2JpQXFJRU52Y0hseWFXZG9kQ0F5TURFMExDQkdZV05sWW05dmF5d2dTVzVqTGx4dUlDb2dRV3hzSUhKcFoyaDBjeUJ5WlhObGNuWmxaQzVjYmlBcVhHNGdLaUJVYUdseklITnZkWEpqWlNCamIyUmxJR2x6SUd4cFkyVnVjMlZrSUhWdVpHVnlJSFJvWlNCQ1UwUXRjM1I1YkdVZ2JHbGpaVzV6WlNCbWIzVnVaQ0JwYmlCMGFHVmNiaUFxSUV4SlEwVk9VMFVnWm1sc1pTQnBiaUIwYUdVZ2NtOXZkQ0JrYVhKbFkzUnZjbmtnYjJZZ2RHaHBjeUJ6YjNWeVkyVWdkSEpsWlM0Z1FXNGdZV1JrYVhScGIyNWhiQ0JuY21GdWRGeHVJQ29nYjJZZ2NHRjBaVzUwSUhKcFoyaDBjeUJqWVc0Z1ltVWdabTkxYm1RZ2FXNGdkR2hsSUZCQlZFVk9WRk1nWm1sc1pTQnBiaUIwYUdVZ2MyRnRaU0JrYVhKbFkzUnZjbmt1WEc0Z0tseHVJQ29nUUhCeWIzWnBaR1Z6VFc5a2RXeGxJSGRoY201cGJtZGNiaUFxTDF4dVhHNWNJblZ6WlNCemRISnBZM1JjSWp0Y2JseHVkbUZ5SUdWdGNIUjVSblZ1WTNScGIyNGdQU0J5WlhGMWFYSmxLRndpTGk5bGJYQjBlVVoxYm1OMGFXOXVYQ0lwTzF4dVhHNHZLaXBjYmlBcUlGTnBiV2xzWVhJZ2RHOGdhVzUyWVhKcFlXNTBJR0oxZENCdmJteDVJR3h2WjNNZ1lTQjNZWEp1YVc1bklHbG1JSFJvWlNCamIyNWthWFJwYjI0Z2FYTWdibTkwSUcxbGRDNWNiaUFxSUZSb2FYTWdZMkZ1SUdKbElIVnpaV1FnZEc4Z2JHOW5JR2x6YzNWbGN5QnBiaUJrWlhabGJHOXdiV1Z1ZENCbGJuWnBjbTl1YldWdWRITWdhVzRnWTNKcGRHbGpZV3hjYmlBcUlIQmhkR2h6TGlCU1pXMXZkbWx1WnlCMGFHVWdiRzluWjJsdVp5QmpiMlJsSUdadmNpQndjbTlrZFdOMGFXOXVJR1Z1ZG1seWIyNXRaVzUwY3lCM2FXeHNJR3RsWlhBZ2RHaGxYRzRnS2lCellXMWxJR3h2WjJsaklHRnVaQ0JtYjJ4c2IzY2dkR2hsSUhOaGJXVWdZMjlrWlNCd1lYUm9jeTVjYmlBcUwxeHVYRzUyWVhJZ2QyRnlibWx1WnlBOUlHVnRjSFI1Um5WdVkzUnBiMjQ3WEc1Y2JtbG1JQ2hjSW5CeWIyUjFZM1JwYjI1Y0lpQWhQVDBnY0hKdlkyVnpjeTVsYm5ZdVRrOUVSVjlGVGxZcElIdGNiaUFnZDJGeWJtbHVaeUE5SUdaMWJtTjBhVzl1S0dOdmJtUnBkR2x2Yml3Z1ptOXliV0YwSUNrZ2UyWnZjaUFvZG1GeUlHRnlaM005VzEwc0pGOWZNRDB5TENSZlh6RTlZWEpuZFcxbGJuUnpMbXhsYm1kMGFEc2tYMTh3UENSZlh6RTdKRjlmTUNzcktTQmhjbWR6TG5CMWMyZ29ZWEpuZFcxbGJuUnpXeVJmWHpCZEtUdGNiaUFnSUNCcFppQW9abTl5YldGMElEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWhjYmlBZ0lDQWdJQ0FnSjJCM1lYSnVhVzVuS0dOdmJtUnBkR2x2Yml3Z1ptOXliV0YwTENBdUxpNWhjbWR6S1dBZ2NtVnhkV2x5WlhNZ1lTQjNZWEp1YVc1bklDY2dLMXh1SUNBZ0lDQWdJQ0FuYldWemMyRm5aU0JoY21kMWJXVnVkQ2RjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhV1lnS0NGamIyNWthWFJwYjI0cElIdGNiaUFnSUNBZ0lIWmhjaUJoY21kSmJtUmxlQ0E5SURBN1hHNGdJQ0FnSUNCamIyNXpiMnhsTG5kaGNtNG9KMWRoY201cGJtYzZJQ2NnS3lCbWIzSnRZWFF1Y21Wd2JHRmpaU2d2SlhNdlp5d2dablZ1WTNScGIyNG9LU0FnZTNKbGRIVnliaUJoY21kelcyRnlaMGx1WkdWNEt5dGRPMzBwS1R0Y2JpQWdJQ0I5WEc0Z0lIMDdYRzU5WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ2QyRnlibWx1Wnp0Y2JpSmRmUT09IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3MgPSB7XG5cdGxvZzogZnVuY3Rpb24gbG9nKHRleHQpIHtcblx0XHRjb25zb2xlLmxvZyh0ZXh0KTtcblx0fSxcblx0Z2V0OiBmdW5jdGlvbiBnZXQodXJsLCBjYWxsYmFjaykge1xuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUpIHtcblx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdHZhciByZXNwb25zZSA9IHhoci5yZXNwb25zZSA/IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKSA6IG51bGw7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeGhyLnN0YXR1cywgcmVzcG9uc2UpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHhoci5zdGF0dXMgPCA1MDApIHtcblx0XHRcdFx0XHRjYWxsYmFjayh4aHIuc3RhdHVzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdhamF4IGdldCBlcnJvcicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR4aHIub3BlbignR0VUJywgdXJsKTtcblx0XHR4aHIuc2VuZCgpO1xuXHR9LFxuXHRwb3N0OiBmdW5jdGlvbiBwb3N0KHVybCwgZGF0YSwgY2FsbGJhY2spIHtcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSBYTUxIdHRwUmVxdWVzdC5ET05FKSB7XG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHR2YXIgcmVzcG9uc2UgPSB4aHIucmVzcG9uc2UgPyBKU09OLnBhcnNlKHhoci5yZXNwb25zZSkgOiBudWxsO1xuXHRcdFx0XHRcdGNhbGxiYWNrKHhoci5zdGF0dXMsIHJlc3BvbnNlKTtcblx0XHRcdFx0fSBlbHNlIGlmICh4aHIuc3RhdHVzIDwgNTAwKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeGhyLnN0YXR1cyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignYWpheCBwb3N0IGVycm9yJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHhoci5vcGVuKCdQT1NUJywgdXJsKTtcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblx0XHR4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cdH0sXG5cdGNvb2tpZTogZnVuY3Rpb24gY29va2llKG5hbWUsIGNvb2tpZXMpIHtcblx0XHR2YXIgYyA9IHRoaXMuY29va2llcyhjb29raWVzKTtcblx0XHRyZXR1cm4gY1tuYW1lXTtcblx0fSxcblx0Y29va2llczogZnVuY3Rpb24gY29va2llcyhfY29va2llcykge1xuXHRcdHZhciBuYW1lVmFsdWVzID0gX2Nvb2tpZXMuc3BsaXQoJzsgJyk7XG5cdFx0dmFyIHJlc3VsdCA9IHt9O1xuXHRcdG5hbWVWYWx1ZXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuXHRcdFx0dmFyIGkgPSBpdGVtLnNwbGl0KCc9Jyk7XG5cdFx0XHRyZXN1bHRbaVswXV0gPSBpWzFdO1xuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGdldFF1ZXJ5VmFsdWU6IGZ1bmN0aW9uIGdldFF1ZXJ5VmFsdWUocXVlcnlTdHJpbmcsIG5hbWUpIHtcblx0XHR2YXIgYXJyID0gcXVlcnlTdHJpbmcubWF0Y2gobmV3IFJlZ0V4cChuYW1lICsgJz0oW14mXSspJykpO1xuXG5cdFx0aWYgKGFycikge1xuXHRcdFx0cmV0dXJuIGFyclsxXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgdGVzdHMgPSBbe1xuXHRpZDogMSxcblx0dGVzdDogZnVuY3Rpb24gdGVzdCgpIHtcblx0XHR2YXIgY29va2llcyA9IHtcblx0XHRcdGNzYXRpOiAnbWFqb20nLFxuXHRcdFx0b25lOiAndHdvJ1xuXHRcdH07XG5cblx0XHR2YXIgcmVzdWx0ID0gdHJ1ZTtcblxuXHRcdHZhciBjID0gY3MuY29va2llcygnY3NhdGk9bWFqb207IG9uZT10d28nKTtcblxuXHRcdGlmIChjLmNzYXRpICE9PSBjb29raWVzLmNzYXRpKSByZXN1bHQgPSBmYWxzZTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cbn0sIHtcblx0aWQ6IDIsXG5cdHRlc3Q6IGZ1bmN0aW9uIHRlc3QoKSB7XG5cdFx0cmV0dXJuICdiYXInID09PSBjcy5jb29raWUoJ2ZvbycsICdmb289YmFyOyB0ZT1tYWpvbScpO1xuXHR9XG59LCB7XG5cdGlkOiAzLFxuXHR0ZXN0OiBmdW5jdGlvbiB0ZXN0KCkge1xuXHRcdHJldHVybiAnMTIzJyA9PT0gY3MuZ2V0UXVlcnlWYWx1ZSgnP2NzYXRpPW1ham9tJnVzZXJfaWQ9MTIzJnZhbGFtaT1zZW1taScsICd1c2VyX2lkJyk7XG5cdH1cbn1dO1xuXG5pZiAoZmFsc2UpIHtcblx0dmFyIHJlc3VsdCA9IHRydWU7XG5cdHRlc3RzLmZvckVhY2goZnVuY3Rpb24gKHRlc3QpIHtcblx0XHRpZiAoIXRlc3QudGVzdCgpKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKHRlc3QuaWQgKyAnLiB0ZXN0IGZhaWxlZCcpO1xuXHRcdFx0cmVzdWx0ID0gZmFsc2U7XG5cdFx0fVxuXHR9KTtcblx0aWYgKHJlc3VsdCkge1xuXHRcdGNvbnNvbGUubG9nKCdBbGwgdGVzdCBzdWNjZWVkZWQhJyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjczsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBmb29kID0ge1xuXHRjbGllbnQ6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRpZDogeyB0eXBlOiAnaW50ZWdlcicgfSxcblx0XHRcdG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIG1pbkxlbmd0aDogMyB9LFxuXHRcdFx0ZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdGNhdGVnb3J5OiB7IHR5cGU6ICdzdHJpbmcnLCBtaW5MZW5ndGg6IDEgfSxcblx0XHRcdHBhbGVvOiB7IHR5cGU6ICdpbnRlZ2VyJywgZXE6IFsxLCA1LCAxMF0gfSxcblx0XHRcdGtldG86IHsgdHlwZTogJ2ludGVnZXInLCBlcTogWzEsIDUsIDEwXSB9LFxuXHRcdFx0ZW5hYmxlZDogeyB0eXBlOiAnYm9vbGVhbicgfVxuXHRcdH1cblx0fVxufTtcblxudmFyIHVzZXIgPSB7XG5cdGJsYW5rOiBmdW5jdGlvbiBibGFuaygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IG51bGwsXG5cdFx0XHRuYW1lOiAnJyxcblx0XHRcdHN0YXR1czogYmVsbGEuY29uc3RhbnRzLnVzZXJTdGF0dXMuR1VFU1Rcblx0XHR9O1xuXHR9LFxuXHRjbGllbnQ6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRpZDogeyB0eXBlOiBbJ3N0cmluZycsICdudWxsJ10sIG9wdGlvbmFsOiB0cnVlIH0sXG5cdFx0XHRuYW1lOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG5cdFx0XHRzdGF0dXM6IHsgdHlwZTogJ3N0cmluZycsIGVxOiBfLnZhbHVlcyhiZWxsYS5jb25zdGFudHMudXNlclN0YXR1cykgfVxuXHRcdH1cblx0fSxcblx0c2VydmVyOiB7XG5cdFx0dHlwZTogJ29iamVjdCcsXG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0aWQ6IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdG5hbWU6IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdHN0YXR1czogeyB0eXBlOiAnc3RyaW5nJywgZXE6IF8udmFsdWVzKGJlbGxhLmNvbnN0YW50cy51c2VyU3RhdHVzKSB9XG5cdFx0fVxuXHR9LFxuXHRjbGllbnRUb1NlcnZlcjogZnVuY3Rpb24gY2xpZW50VG9TZXJ2ZXIob2JqKSB7fSxcblx0c2VydmVyVG9DbGllbnQ6IGZ1bmN0aW9uIHNlcnZlclRvQ2xpZW50KG9iaikge31cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR1c2VyOiB1c2VyLFxuXHRmb29kOiBmb29kXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzID0gcmVxdWlyZSgnLi9oZWxwZXJzL2NzJyk7XG52YXIgc2NoZW1hcyA9IHJlcXVpcmUoJy4vc2NoZW1hcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0d2lzaDoge1xuXHRcdGdldDogZnVuY3Rpb24gZ2V0KGlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvd2lzaD9pZD0nICsgaWQsIGZ1bmN0aW9uIChzdGF0dXMsIHdpc2gpIHtcblx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0dmFyIHZhbGlkYXRpb24gPSBTY2hlbWFJbnNwZWN0b3IudmFsaWRhdGUoc2NoZW1hcy53aXNoLnNlcnZlciwgd2lzaCk7XG5cdFx0XHRcdFx0aWYgKCF2YWxpZGF0aW9uLnZhbGlkKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCd3aXNoIHZhbGlkYXRpb24gZXJyb3InLCB2YWxpZGF0aW9uLmZvcm1hdCgpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHNjaGVtYXMud2lzaC5zZXJ2ZXJUb0NsaWVudCh3aXNoKSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuTk9UX0ZPVU5EKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1dpc2ggbm90IGZvdW5kJyB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0KHdpc2gsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLndpc2guY2xpZW50LCB3aXNoKTtcblx0XHRcdGlmICh2YWxpZGF0aW9uLnZhbGlkKSB7XG5cdFx0XHRcdGNzLnBvc3QoJy93aXNoJywgc2NoZW1hcy53aXNoLmNsaWVudFRvU2VydmVyKHdpc2gpLCBmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdFx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSBjYWxsYmFjayh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0d2lzaExpc3Q6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvd2lzaExpc3QnLCBmdW5jdGlvbiAoc3RhdHVzLCB3aXNoTGlzdCkge1xuXHRcdFx0XHRpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuT0spIHtcblx0XHRcdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLndpc2hMaXN0LnNlcnZlciwgd2lzaExpc3QpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCd2YWlsZGF0aW9uJywgdmFsaWRhdGlvbik7XG5cdFx0XHRcdFx0aWYgKCF2YWxpZGF0aW9uLnZhbGlkKSBjb25zb2xlLmVycm9yKCd3aXNoTGlzdCBzZXJ2ZXIgdmFsaWRhdGlvbiBlcnJvcicpO1xuXHRcdFx0XHRcdGNhbGxiYWNrKHsgc3VjY2VzczogdHJ1ZSB9LCB3aXNoTGlzdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignd2lzaExpc3QgYWpheCBlcnJvcicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdHVzZXJTdGF0dXM6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvdXNlclN0YXR1cycsIGZ1bmN0aW9uIChzdGF0dXMsIHVzZXJTdGF0dXMpIHtcblx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHVzZXJTdGF0dXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdGxvZ2luOiBmdW5jdGlvbiBsb2dpbihsb2dpbkRhdGEsIGNhbGxiYWNrKSB7XG5cdFx0Y3MucG9zdCgnL2xvZ2luJywgbG9naW5EYXRhLCBmdW5jdGlvbiAoc3RhdHVzLCB1c2VyKSB7XG5cdFx0XHRpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuT0spIHtcblx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHVzZXIpO1xuXHRcdFx0fSBlbHNlIGlmIChzdGF0dXMgPT09IGJlbGxhLmNvbnN0YW50cy5yZXNwb25zZS5OT1RfRk9VTkQpIHtcblx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiBmYWxzZSB9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0bG9nb3V0OiBmdW5jdGlvbiBsb2dvdXQoY2FsbGJhY2spIHtcblx0XHRjcy5nZXQoJ2xvZ291dCcsIGZ1bmN0aW9uIChzdGF0dXMpIHtcblx0XHRcdGlmIChzdGF0dXMgPT09IGJlbGxhLmNvbnN0YW50cy5yZXNwb25zZS5PSykge1xuXHRcdFx0XHRjYWxsYmFjayh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cdGZvb2Q6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYXRlZ29yeUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvZm9vZHMvJyArIGNhdGVnb3J5SWQsIGZ1bmN0aW9uIChzdGF0dXMsIGZvb2RzKSB7fSk7XG5cdFx0fSxcblx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0KGZvb2QsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLmZvb2QuY2xpZW50LCBmb29kKTtcblxuXHRcdFx0aWYgKHZhbGlkYXRpb24udmFsaWQpIHtcblx0XHRcdFx0Y3MucG9zdCgnL2Zvb2QnLCBmb29kLCBmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdFx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjayh0cnVlLCBudWxsKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2soZmFsc2UsIFt7IHByb3BlcnR5OiAnc2VydmVyJywgbWVzc2FnZTogJ2Vycm9yJyB9XSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrKHZhbGlkYXRpb24udmFsaWQsIHZhbGlkYXRpb24uZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0TmFtZTogZnVuY3Rpb24gZ2V0TmFtZSgpIHtcblx0XHRcdHJldHVybiAndGhpcyBpcyBteSBuYW1lJztcblx0XHR9XG5cdH1cbn07Il19
