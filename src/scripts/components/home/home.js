//var ReactDOM = require('react-dom');

var Home = React.createClass({
	render: function() {
		return (<div>Home</div>);
	}
});

//console.log(ReactDOM);

ReactDOM.render(
	<Home />,
	document.getElementById('main-section')
);
