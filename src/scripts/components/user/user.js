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
	getInitialState: function() {
		var user = schemas.user.blank();

		return {
			status: 'GUEST',
			userName: user.name,
			opened: false,
			content: contents.LOGIN,
			errorMessage: ''
		}
	},
	componentDidMount: function() {
		stateChart.addState(states.GLOBAL, {
			substatesAreConcurrent: true,
			states: [
				{
					name: states.SIZE,
					initialSubstate: states.SMALL,
					states: [
						{
							name: states.SMALL,
							enterState: () => {
								this.setState({ opened: false });
							},
							toggleSize: function() {
								this.goToState(states.BIG);
							}
						},
						{
							name: states.BIG,
							enterState: () => {
								this.setState({ opened: true });
							},
							toggleSize: function() {
								this.goToState(states.SMALL);
							}
						}
					]
				},
				{
					name: states.CONTENT,
					initialSubstate: states.LOGIN,
					states: [
						{
							name: states.LOGIN,
							enterState: () => {
								this.setState({ content: contents.LOGIN })
							},
							loginSuccess: function() {
								this.goToState(states.DETAILS)
							}
						},
						{
							name: states.REGISTER,
							enterState: () => {
								this.setState({ content: contents.REGISTER })
							}
						},
						{
							name: states.DETAILS,
							enterState: () => {
								this.setState({
									content: contents.DETAILS,
									userName: bella.data.user.get().name
								})
							}
						}
					]
				}
			]
		});

		stateChart.initStates(states.GLOBAL);

		bella.data.user.subscribe((user) => {
			switch(user.status) {
				case bella.constants.userStatus.LOGGED_IN:
					stateChart.sendEvent('loginSuccess', user);
					break;
				case bella.constants.userStatus.GUEST:
					stateChart.sendEvent('logoutSuccess');
					break;
			}
		});

		if(cs.cookie('user_id', document.cookie) && cs.cookie('token', document.cookie)) {
			server.userStatus.get((result, userStatus) => {
				bella.data.user.set(userStatus, this);
			});
		}
		else {
			bella.data.user.set('status', bella.constants.userStatus.GUEST, this);
		}
	},
	render: function() {
		var content, display, errorMessage;

		if(this.state.opened) {
			switch(this.state.content) {
				case contents.LOGIN:
					content = (
						<div className="bc-user-popup">
							{errorMessage}
							<input type="text" ref="name" defaultValue="a" /><br />
							<input type="text" ref="password" defaultValue="1" /><br />
							<button onClick={this.login}>Login</button><br />
							<a href="" onClick={this.register}>register</a>
						</div>
					);
					break;
				case contents.REGISTER:
					content = (
						<div className="bc-user-popup">
							<span>registration form...</span>
						</div>
					);
					break;
				case contents.DETAILS:
					content = (
						<div>user details...</div>
					);
					break;
			}
		}

		switch(this.state.content) {
			case contents.LOGIN:
			case contents.REGISTER:
				display = (<a href="" onClick={this.toggleSize}>login/register</a>);
				break;
			case contents.DETAILS:
				display = (<a href="" onClick={this.toggleSize}>user</a>);
				break;
		}

		return (
			<div className="bc-user">
				<span>U {display}</span>
				{content}
			</div>
		);
	},
	toggleSize: function(e) {
		e.preventDefault();
		stateChart.sendEvent('toggleSize');
	},
	login: function() {
		server.login({
			username: this.refs.name.value,
			password: this.refs.password.value
		}, (result, data) => {
			if(result.success) {
				bella.data.user.set(data, this);
				this.setState({ errorMessage: '' });
			}
			else {
				this.setState({ errorMessage: 'Wrong username or password' });
			}
		});
	},
	logout: function(e) {
		e.preventDefault();
		server.logout((result) => {
			if(result.success) {
				bella.data.user.set(schemas.user.blank(), this);
				this.setState({ opened: false });
			}
		});
	},
	register: function(e) {
		e.preventDefault();
	}
});

ReactDOM.render(
	<User />,
	document.getElementById('header')
);
