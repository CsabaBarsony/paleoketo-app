(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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
},{"../../helpers/cs":2,"../../schemas":3,"../../server":4}],2:[function(require,module,exports){
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
		console.log('All tests succeeded!');
	}
}

module.exports = cs;
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{"./helpers/cs":2,"./schemas":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwic3JjL3NjcmlwdHMvY29tcG9uZW50cy91c2VyL3VzZXIuanMiLCJzcmMvc2NyaXB0cy9oZWxwZXJzL2NzLmpzIiwic3JjL3NjcmlwdHMvc2NoZW1hcy5qcyIsInNyYy9zY3JpcHRzL3NlcnZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcyA9IHJlcXVpcmUoJy4uLy4uL2hlbHBlcnMvY3MnKTtcbnZhciBzY2hlbWFzID0gcmVxdWlyZSgnLi4vLi4vc2NoZW1hcycpO1xudmFyIHNlcnZlciA9IHJlcXVpcmUoJy4uLy4uL3NlcnZlcicpO1xudmFyIHN0YXRlcyA9IHtcblx0R0xPQkFMOiAnR0xPQkFMJyxcblx0U0laRTogJ1NJWkUnLFxuXHRDT05URU5UOiAnQ09OVEVOVCcsXG5cdFNNQUxMOiAnU01BTEwnLFxuXHRCSUc6ICdCSUcnLFxuXHRMT0dJTjogJ0xPR0lOJyxcblx0UkVHSVNURVI6ICdSRUdJU1RFUicsXG5cdERFVEFJTFM6ICdERVRBSUxTJ1xufTtcbnZhciBjb250ZW50cyA9IHtcblx0TE9HSU46ICdMT0dJTicsXG5cdFJFR0lTVEVSOiAnUkVHSVNURVInLFxuXHRERVRBSUxTOiAnREVUQUlMUydcbn07XG52YXIgc3RhdGVDaGFydCA9IFN0YXRpdnVzLmNyZWF0ZVN0YXRlY2hhcnQoKTtcblxudmFyIFVzZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnVXNlcicsXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG5cdFx0dmFyIHVzZXIgPSBzY2hlbWFzLnVzZXIuYmxhbmsoKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXM6ICdHVUVTVCcsXG5cdFx0XHR1c2VyTmFtZTogdXNlci5uYW1lLFxuXHRcdFx0b3BlbmVkOiBmYWxzZSxcblx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRzLkxPR0lOLFxuXHRcdFx0ZXJyb3JNZXNzYWdlOiAnJ1xuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiBjb21wb25lbnREaWRNb3VudCgpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0c3RhdGVDaGFydC5hZGRTdGF0ZShzdGF0ZXMuR0xPQkFMLCB7XG5cdFx0XHRzdWJzdGF0ZXNBcmVDb25jdXJyZW50OiB0cnVlLFxuXHRcdFx0c3RhdGVzOiBbe1xuXHRcdFx0XHRuYW1lOiBzdGF0ZXMuU0laRSxcblx0XHRcdFx0aW5pdGlhbFN1YnN0YXRlOiBzdGF0ZXMuU01BTEwsXG5cdFx0XHRcdHN0YXRlczogW3tcblx0XHRcdFx0XHRuYW1lOiBzdGF0ZXMuU01BTEwsXG5cdFx0XHRcdFx0ZW50ZXJTdGF0ZTogZnVuY3Rpb24gZW50ZXJTdGF0ZSgpIHtcblx0XHRcdFx0XHRcdF90aGlzLnNldFN0YXRlKHsgb3BlbmVkOiBmYWxzZSB9KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRvZ2dsZVNpemU6IGZ1bmN0aW9uIHRvZ2dsZVNpemUoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdvVG9TdGF0ZShzdGF0ZXMuQklHKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRuYW1lOiBzdGF0ZXMuQklHLFxuXHRcdFx0XHRcdGVudGVyU3RhdGU6IGZ1bmN0aW9uIGVudGVyU3RhdGUoKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZXRTdGF0ZSh7IG9wZW5lZDogdHJ1ZSB9KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRvZ2dsZVNpemU6IGZ1bmN0aW9uIHRvZ2dsZVNpemUoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdvVG9TdGF0ZShzdGF0ZXMuU01BTEwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fV1cblx0XHRcdH0sIHtcblx0XHRcdFx0bmFtZTogc3RhdGVzLkNPTlRFTlQsXG5cdFx0XHRcdGluaXRpYWxTdWJzdGF0ZTogc3RhdGVzLkxPR0lOLFxuXHRcdFx0XHRzdGF0ZXM6IFt7XG5cdFx0XHRcdFx0bmFtZTogc3RhdGVzLkxPR0lOLFxuXHRcdFx0XHRcdGVudGVyU3RhdGU6IGZ1bmN0aW9uIGVudGVyU3RhdGUoKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZXRTdGF0ZSh7IGNvbnRlbnQ6IGNvbnRlbnRzLkxPR0lOIH0pO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bG9naW5TdWNjZXNzOiBmdW5jdGlvbiBsb2dpblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmdvVG9TdGF0ZShzdGF0ZXMuREVUQUlMUyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0bmFtZTogc3RhdGVzLlJFR0lTVEVSLFxuXHRcdFx0XHRcdGVudGVyU3RhdGU6IGZ1bmN0aW9uIGVudGVyU3RhdGUoKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZXRTdGF0ZSh7IGNvbnRlbnQ6IGNvbnRlbnRzLlJFR0lTVEVSIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdG5hbWU6IHN0YXRlcy5ERVRBSUxTLFxuXHRcdFx0XHRcdGVudGVyU3RhdGU6IGZ1bmN0aW9uIGVudGVyU3RhdGUoKSB7XG5cdFx0XHRcdFx0XHRfdGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnRzLkRFVEFJTFMsXG5cdFx0XHRcdFx0XHRcdHVzZXJOYW1lOiBiZWxsYS5kYXRhLnVzZXIuZ2V0KCkubmFtZVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XVxuXHRcdFx0fV1cblx0XHR9KTtcblxuXHRcdHN0YXRlQ2hhcnQuaW5pdFN0YXRlcyhzdGF0ZXMuR0xPQkFMKTtcblxuXHRcdGJlbGxhLmRhdGEudXNlci5zdWJzY3JpYmUoZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHN3aXRjaCAodXNlci5zdGF0dXMpIHtcblx0XHRcdFx0Y2FzZSBiZWxsYS5jb25zdGFudHMudXNlclN0YXR1cy5MT0dHRURfSU46XG5cdFx0XHRcdFx0c3RhdGVDaGFydC5zZW5kRXZlbnQoJ2xvZ2luU3VjY2VzcycsIHVzZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIGJlbGxhLmNvbnN0YW50cy51c2VyU3RhdHVzLkdVRVNUOlxuXHRcdFx0XHRcdHN0YXRlQ2hhcnQuc2VuZEV2ZW50KCdsb2dvdXRTdWNjZXNzJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoY3MuY29va2llKCd1c2VyX2lkJywgZG9jdW1lbnQuY29va2llKSAmJiBjcy5jb29raWUoJ3Rva2VuJywgZG9jdW1lbnQuY29va2llKSkge1xuXHRcdFx0c2VydmVyLnVzZXJTdGF0dXMuZ2V0KGZ1bmN0aW9uIChyZXN1bHQsIHVzZXJTdGF0dXMpIHtcblx0XHRcdFx0YmVsbGEuZGF0YS51c2VyLnNldCh1c2VyU3RhdHVzLCBfdGhpcyk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YmVsbGEuZGF0YS51c2VyLnNldCgnc3RhdHVzJywgYmVsbGEuY29uc3RhbnRzLnVzZXJTdGF0dXMuR1VFU1QsIHRoaXMpO1xuXHRcdH1cblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNvbnRlbnQsIGRpc3BsYXksIGVycm9yTWVzc2FnZTtcblxuXHRcdGlmICh0aGlzLnN0YXRlLm9wZW5lZCkge1xuXHRcdFx0c3dpdGNoICh0aGlzLnN0YXRlLmNvbnRlbnQpIHtcblx0XHRcdFx0Y2FzZSBjb250ZW50cy5MT0dJTjpcblx0XHRcdFx0XHRjb250ZW50ID0gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdiYy11c2VyLXBvcHVwJyB9LFxuXHRcdFx0XHRcdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCB7IHR5cGU6ICd0ZXh0JywgcmVmOiAnbmFtZScsIGRlZmF1bHRWYWx1ZTogJ2EnIH0pLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnYnInLCBudWxsKSxcblx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JywgeyB0eXBlOiAndGV4dCcsIHJlZjogJ3Bhc3N3b3JkJywgZGVmYXVsdFZhbHVlOiAnMScgfSksXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KCdicicsIG51bGwpLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdFx0J2J1dHRvbicsXG5cdFx0XHRcdFx0XHRcdHsgb25DbGljazogdGhpcy5sb2dpbiB9LFxuXHRcdFx0XHRcdFx0XHQnTG9naW4nXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudCgnYnInLCBudWxsKSxcblx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHRcdCdhJyxcblx0XHRcdFx0XHRcdFx0eyBocmVmOiAnJywgb25DbGljazogdGhpcy5yZWdpc3RlciB9LFxuXHRcdFx0XHRcdFx0XHQncmVnaXN0ZXInXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBjb250ZW50cy5SRUdJU1RFUjpcblx0XHRcdFx0XHRjb250ZW50ID0gUmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdiYy11c2VyLXBvcHVwJyB9LFxuXHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdFx0J3NwYW4nLFxuXHRcdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0XHQncmVnaXN0cmF0aW9uIGZvcm0uLi4nXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBjb250ZW50cy5ERVRBSUxTOlxuXHRcdFx0XHRcdGNvbnRlbnQgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0J3VzZXIgZGV0YWlscy4uLidcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHN3aXRjaCAodGhpcy5zdGF0ZS5jb250ZW50KSB7XG5cdFx0XHRjYXNlIGNvbnRlbnRzLkxPR0lOOlxuXHRcdFx0Y2FzZSBjb250ZW50cy5SRUdJU1RFUjpcblx0XHRcdFx0ZGlzcGxheSA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J2EnLFxuXHRcdFx0XHRcdHsgaHJlZjogJycsIG9uQ2xpY2s6IHRoaXMudG9nZ2xlU2l6ZSB9LFxuXHRcdFx0XHRcdCdsb2dpbi9yZWdpc3Rlcidcblx0XHRcdFx0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIGNvbnRlbnRzLkRFVEFJTFM6XG5cdFx0XHRcdGRpc3BsYXkgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdCdhJyxcblx0XHRcdFx0XHR7IGhyZWY6ICcnLCBvbkNsaWNrOiB0aGlzLnRvZ2dsZVNpemUgfSxcblx0XHRcdFx0XHQndXNlcidcblx0XHRcdFx0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnYmMtdXNlcicgfSxcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdzcGFuJyxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0J1UgJyxcblx0XHRcdFx0ZGlzcGxheVxuXHRcdFx0KSxcblx0XHRcdGNvbnRlbnRcblx0XHQpO1xuXHR9LFxuXHR0b2dnbGVTaXplOiBmdW5jdGlvbiB0b2dnbGVTaXplKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0c3RhdGVDaGFydC5zZW5kRXZlbnQoJ3RvZ2dsZVNpemUnKTtcblx0fSxcblx0bG9naW46IGZ1bmN0aW9uIGxvZ2luKCkge1xuXHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0c2VydmVyLmxvZ2luKHtcblx0XHRcdHVzZXJuYW1lOiB0aGlzLnJlZnMubmFtZS52YWx1ZSxcblx0XHRcdHBhc3N3b3JkOiB0aGlzLnJlZnMucGFzc3dvcmQudmFsdWVcblx0XHR9LCBmdW5jdGlvbiAocmVzdWx0LCBkYXRhKSB7XG5cdFx0XHRpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcblx0XHRcdFx0YmVsbGEuZGF0YS51c2VyLnNldChkYXRhLCBfdGhpczIpO1xuXHRcdFx0XHRfdGhpczIuc2V0U3RhdGUoeyBlcnJvck1lc3NhZ2U6ICcnIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X3RoaXMyLnNldFN0YXRlKHsgZXJyb3JNZXNzYWdlOiAnV3JvbmcgdXNlcm5hbWUgb3IgcGFzc3dvcmQnIH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9LFxuXHRsb2dvdXQ6IGZ1bmN0aW9uIGxvZ291dChlKSB7XG5cdFx0dmFyIF90aGlzMyA9IHRoaXM7XG5cblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0c2VydmVyLmxvZ291dChmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcblx0XHRcdFx0YmVsbGEuZGF0YS51c2VyLnNldChzY2hlbWFzLnVzZXIuYmxhbmsoKSwgX3RoaXMzKTtcblx0XHRcdFx0X3RoaXMzLnNldFN0YXRlKHsgb3BlbmVkOiBmYWxzZSB9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0cmVnaXN0ZXI6IGZ1bmN0aW9uIHJlZ2lzdGVyKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdH1cbn0pO1xuXG5SZWFjdERPTS5yZW5kZXIoUmVhY3QuY3JlYXRlRWxlbWVudChVc2VyLCBudWxsKSwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hlYWRlcicpKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcyA9IHtcblx0bG9nOiBmdW5jdGlvbiBsb2codGV4dCkge1xuXHRcdGNvbnNvbGUubG9nKHRleHQpO1xuXHR9LFxuXHRnZXQ6IGZ1bmN0aW9uIGdldCh1cmwsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gWE1MSHR0cFJlcXVlc3QuRE9ORSkge1xuXHRcdFx0XHRpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0dmFyIHJlc3BvbnNlID0geGhyLnJlc3BvbnNlID8gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpIDogbnVsbDtcblx0XHRcdFx0XHRjYWxsYmFjayh4aHIuc3RhdHVzLCByZXNwb25zZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoeGhyLnN0YXR1cyA8IDUwMCkge1xuXHRcdFx0XHRcdGNhbGxiYWNrKHhoci5zdGF0dXMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ2FqYXggZ2V0IGVycm9yJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuXHRcdHhoci5zZW5kKCk7XG5cdH0sXG5cdHBvc3Q6IGZ1bmN0aW9uIHBvc3QodXJsLCBkYXRhLCBjYWxsYmFjaykge1xuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUpIHtcblx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdHZhciByZXNwb25zZSA9IHhoci5yZXNwb25zZSA/IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKSA6IG51bGw7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeGhyLnN0YXR1cywgcmVzcG9uc2UpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHhoci5zdGF0dXMgPCA1MDApIHtcblx0XHRcdFx0XHRjYWxsYmFjayh4aHIuc3RhdHVzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdhamF4IHBvc3QgZXJyb3InKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0eGhyLm9wZW4oJ1BPU1QnLCB1cmwpO1xuXHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXHRcdHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblx0fSxcblx0Y29va2llOiBmdW5jdGlvbiBjb29raWUobmFtZSwgY29va2llcykge1xuXHRcdHZhciBjID0gdGhpcy5jb29raWVzKGNvb2tpZXMpO1xuXHRcdHJldHVybiBjW25hbWVdO1xuXHR9LFxuXHRjb29raWVzOiBmdW5jdGlvbiBjb29raWVzKF9jb29raWVzKSB7XG5cdFx0dmFyIG5hbWVWYWx1ZXMgPSBfY29va2llcy5zcGxpdCgnOyAnKTtcblx0XHR2YXIgcmVzdWx0ID0ge307XG5cdFx0bmFtZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0XHR2YXIgaSA9IGl0ZW0uc3BsaXQoJz0nKTtcblx0XHRcdHJlc3VsdFtpWzBdXSA9IGlbMV07XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblx0Z2V0UXVlcnlWYWx1ZTogZnVuY3Rpb24gZ2V0UXVlcnlWYWx1ZShxdWVyeVN0cmluZywgbmFtZSkge1xuXHRcdHZhciBhcnIgPSBxdWVyeVN0cmluZy5tYXRjaChuZXcgUmVnRXhwKG5hbWUgKyAnPShbXiZdKyknKSk7XG5cblx0XHRpZiAoYXJyKSB7XG5cdFx0XHRyZXR1cm4gYXJyWzFdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cbn07XG5cbnZhciB0ZXN0cyA9IFt7XG5cdGlkOiAxLFxuXHR0ZXN0OiBmdW5jdGlvbiB0ZXN0KCkge1xuXHRcdHZhciBjb29raWVzID0ge1xuXHRcdFx0Y3NhdGk6ICdtYWpvbScsXG5cdFx0XHRvbmU6ICd0d28nXG5cdFx0fTtcblxuXHRcdHZhciByZXN1bHQgPSB0cnVlO1xuXG5cdFx0dmFyIGMgPSBjcy5jb29raWVzKCdjc2F0aT1tYWpvbTsgb25lPXR3bycpO1xuXG5cdFx0aWYgKGMuY3NhdGkgIT09IGNvb2tpZXMuY3NhdGkpIHJlc3VsdCA9IGZhbHNlO1xuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufSwge1xuXHRpZDogMixcblx0dGVzdDogZnVuY3Rpb24gdGVzdCgpIHtcblx0XHRyZXR1cm4gJ2JhcicgPT09IGNzLmNvb2tpZSgnZm9vJywgJ2Zvbz1iYXI7IHRlPW1ham9tJyk7XG5cdH1cbn0sIHtcblx0aWQ6IDMsXG5cdHRlc3Q6IGZ1bmN0aW9uIHRlc3QoKSB7XG5cdFx0cmV0dXJuICcxMjMnID09PSBjcy5nZXRRdWVyeVZhbHVlKCc/Y3NhdGk9bWFqb20mdXNlcl9pZD0xMjMmdmFsYW1pPXNlbW1pJywgJ3VzZXJfaWQnKTtcblx0fVxufV07XG5cbmlmIChmYWxzZSkge1xuXHR2YXIgcmVzdWx0ID0gdHJ1ZTtcblx0dGVzdHMuZm9yRWFjaChmdW5jdGlvbiAodGVzdCkge1xuXHRcdGlmICghdGVzdC50ZXN0KCkpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IodGVzdC5pZCArICcuIHRlc3QgZmFpbGVkJyk7XG5cdFx0XHRyZXN1bHQgPSBmYWxzZTtcblx0XHR9XG5cdH0pO1xuXHRpZiAocmVzdWx0KSB7XG5cdFx0Y29uc29sZS5sb2coJ0FsbCB0ZXN0cyBzdWNjZWVkZWQhJyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjczsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBmb29kID0ge1xuXHRjbGllbnQ6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRpZDogeyB0eXBlOiAnaW50ZWdlcicgfSxcblx0XHRcdG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIG1pbkxlbmd0aDogMyB9LFxuXHRcdFx0ZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdGNhdGVnb3J5OiB7IHR5cGU6ICdzdHJpbmcnLCBtaW5MZW5ndGg6IDEgfSxcblx0XHRcdHBhbGVvOiB7IHR5cGU6ICdpbnRlZ2VyJywgZXE6IFsxLCA1LCAxMF0gfSxcblx0XHRcdGtldG86IHsgdHlwZTogJ2ludGVnZXInLCBlcTogWzEsIDUsIDEwXSB9LFxuXHRcdFx0ZW5hYmxlZDogeyB0eXBlOiAnYm9vbGVhbicgfVxuXHRcdH1cblx0fVxufTtcblxudmFyIHVzZXIgPSB7XG5cdGJsYW5rOiBmdW5jdGlvbiBibGFuaygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aWQ6IG51bGwsXG5cdFx0XHRuYW1lOiAnJyxcblx0XHRcdHN0YXR1czogYmVsbGEuY29uc3RhbnRzLnVzZXJTdGF0dXMuR1VFU1Rcblx0XHR9O1xuXHR9LFxuXHRjbGllbnQ6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRpZDogeyB0eXBlOiBbJ3N0cmluZycsICdudWxsJ10sIG9wdGlvbmFsOiB0cnVlIH0sXG5cdFx0XHRuYW1lOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG5cdFx0XHRzdGF0dXM6IHsgdHlwZTogJ3N0cmluZycsIGVxOiBfLnZhbHVlcyhiZWxsYS5jb25zdGFudHMudXNlclN0YXR1cykgfVxuXHRcdH1cblx0fSxcblx0c2VydmVyOiB7XG5cdFx0dHlwZTogJ29iamVjdCcsXG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0aWQ6IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdG5hbWU6IHsgdHlwZTogJ3N0cmluZycgfSxcblx0XHRcdHN0YXR1czogeyB0eXBlOiAnc3RyaW5nJywgZXE6IF8udmFsdWVzKGJlbGxhLmNvbnN0YW50cy51c2VyU3RhdHVzKSB9XG5cdFx0fVxuXHR9LFxuXHRjbGllbnRUb1NlcnZlcjogZnVuY3Rpb24gY2xpZW50VG9TZXJ2ZXIob2JqKSB7fSxcblx0c2VydmVyVG9DbGllbnQ6IGZ1bmN0aW9uIHNlcnZlclRvQ2xpZW50KG9iaikge31cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHR1c2VyOiB1c2VyLFxuXHRmb29kOiBmb29kXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzID0gcmVxdWlyZSgnLi9oZWxwZXJzL2NzJyk7XG52YXIgc2NoZW1hcyA9IHJlcXVpcmUoJy4vc2NoZW1hcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0d2lzaDoge1xuXHRcdGdldDogZnVuY3Rpb24gZ2V0KGlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvd2lzaD9pZD0nICsgaWQsIGZ1bmN0aW9uIChzdGF0dXMsIHdpc2gpIHtcblx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0dmFyIHZhbGlkYXRpb24gPSBTY2hlbWFJbnNwZWN0b3IudmFsaWRhdGUoc2NoZW1hcy53aXNoLnNlcnZlciwgd2lzaCk7XG5cdFx0XHRcdFx0aWYgKCF2YWxpZGF0aW9uLnZhbGlkKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCd3aXNoIHZhbGlkYXRpb24gZXJyb3InLCB2YWxpZGF0aW9uLmZvcm1hdCgpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHNjaGVtYXMud2lzaC5zZXJ2ZXJUb0NsaWVudCh3aXNoKSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuTk9UX0ZPVU5EKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1dpc2ggbm90IGZvdW5kJyB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0KHdpc2gsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLndpc2guY2xpZW50LCB3aXNoKTtcblx0XHRcdGlmICh2YWxpZGF0aW9uLnZhbGlkKSB7XG5cdFx0XHRcdGNzLnBvc3QoJy93aXNoJywgc2NoZW1hcy53aXNoLmNsaWVudFRvU2VydmVyKHdpc2gpLCBmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdFx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSBjYWxsYmFjayh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0d2lzaExpc3Q6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvd2lzaExpc3QnLCBmdW5jdGlvbiAoc3RhdHVzLCB3aXNoTGlzdCkge1xuXHRcdFx0XHRpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuT0spIHtcblx0XHRcdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLndpc2hMaXN0LnNlcnZlciwgd2lzaExpc3QpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCd2YWlsZGF0aW9uJywgdmFsaWRhdGlvbik7XG5cdFx0XHRcdFx0aWYgKCF2YWxpZGF0aW9uLnZhbGlkKSBjb25zb2xlLmVycm9yKCd3aXNoTGlzdCBzZXJ2ZXIgdmFsaWRhdGlvbiBlcnJvcicpO1xuXHRcdFx0XHRcdGNhbGxiYWNrKHsgc3VjY2VzczogdHJ1ZSB9LCB3aXNoTGlzdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignd2lzaExpc3QgYWpheCBlcnJvcicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdHVzZXJTdGF0dXM6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvdXNlclN0YXR1cycsIGZ1bmN0aW9uIChzdGF0dXMsIHVzZXJTdGF0dXMpIHtcblx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHVzZXJTdGF0dXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cdGxvZ2luOiBmdW5jdGlvbiBsb2dpbihsb2dpbkRhdGEsIGNhbGxiYWNrKSB7XG5cdFx0Y3MucG9zdCgnL2xvZ2luJywgbG9naW5EYXRhLCBmdW5jdGlvbiAoc3RhdHVzLCB1c2VyKSB7XG5cdFx0XHRpZiAoc3RhdHVzID09PSBiZWxsYS5jb25zdGFudHMucmVzcG9uc2UuT0spIHtcblx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiB0cnVlIH0sIHVzZXIpO1xuXHRcdFx0fSBlbHNlIGlmIChzdGF0dXMgPT09IGJlbGxhLmNvbnN0YW50cy5yZXNwb25zZS5OT1RfRk9VTkQpIHtcblx0XHRcdFx0Y2FsbGJhY2soeyBzdWNjZXNzOiBmYWxzZSB9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0bG9nb3V0OiBmdW5jdGlvbiBsb2dvdXQoY2FsbGJhY2spIHtcblx0XHRjcy5nZXQoJ2xvZ291dCcsIGZ1bmN0aW9uIChzdGF0dXMpIHtcblx0XHRcdGlmIChzdGF0dXMgPT09IGJlbGxhLmNvbnN0YW50cy5yZXNwb25zZS5PSykge1xuXHRcdFx0XHRjYWxsYmFjayh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cdGZvb2Q6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uIGdldChjYXRlZ29yeUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y3MuZ2V0KCcvZm9vZHMvJyArIGNhdGVnb3J5SWQsIGZ1bmN0aW9uIChzdGF0dXMsIGZvb2RzKSB7fSk7XG5cdFx0fSxcblx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0KGZvb2QsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgdmFsaWRhdGlvbiA9IFNjaGVtYUluc3BlY3Rvci52YWxpZGF0ZShzY2hlbWFzLmZvb2QuY2xpZW50LCBmb29kKTtcblxuXHRcdFx0aWYgKHZhbGlkYXRpb24udmFsaWQpIHtcblx0XHRcdFx0Y3MucG9zdCgnL2Zvb2QnLCBmb29kLCBmdW5jdGlvbiAoc3RhdHVzKSB7XG5cdFx0XHRcdFx0aWYgKHN0YXR1cyA9PT0gYmVsbGEuY29uc3RhbnRzLnJlc3BvbnNlLk9LKSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjayh0cnVlLCBudWxsKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2soZmFsc2UsIFt7IHByb3BlcnR5OiAnc2VydmVyJywgbWVzc2FnZTogJ2Vycm9yJyB9XSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrKHZhbGlkYXRpb24udmFsaWQsIHZhbGlkYXRpb24uZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0TmFtZTogZnVuY3Rpb24gZ2V0TmFtZSgpIHtcblx0XHRcdHJldHVybiAndGhpcyBpcyBteSBuYW1lJztcblx0XHR9XG5cdH1cbn07Il19
