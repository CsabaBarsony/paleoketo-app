var cs = {
	log: function(text){
		console.log(text);
	},
	get: function(url, callback){
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					var response = xhr.response ? JSON.parse(xhr.response) : null;
					callback(xhr.status, response);
				}
				else if (xhr.status < 500) {
					callback(xhr.status);
				}
				else {
					console.error('ajax get error');
				}
			}
		};
		xhr.open('GET', url);
		xhr.send();
	},
	post: function(url, data, callback){
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					var response = xhr.response ? JSON.parse(xhr.response) : null;
					callback(xhr.status, response);
				}
				else if(xhr.status < 500) {
					callback(xhr.status);
				}
				else {
					console.error('ajax post error');
				}
			}
		};
		xhr.open('POST', url);
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.send(JSON.stringify(data));
	},
	cookie: function(name, cookies) {
		var c = this.cookies(cookies);
		return c[name];
	},
	cookies: function(cookies) {
		var nameValues = cookies.split('; ');
		var result = {};
		nameValues.forEach(function(item) {
			var i = item.split('=');
			result[i[0]] = i[1];
		});
		return result;
	},
	getQueryValue: function(queryString, name) {
		var arr = queryString.match(new RegExp(name + '=([^&]+)'));

		if(arr) {
			return arr[1];
		}
		else {
			return null;
		}
	}
};

var tests = [
	{
		id: 1,
		test: function() {
			var cookies = {
				csati: 'majom',
				one: 'two'
			};

			var result = true;

			var c = cs.cookies('csati=majom; one=two');

			if(c.csati !== cookies.csati) result = false;

			return result;
		}
	},
	{
		id: 2,
		test: function() {
			return ('bar' === cs.cookie('foo', 'foo=bar; te=majom'));
		}
	},
	{
		id: 3,
		test: function() {
			return '123' === cs.getQueryValue('?csati=majom&user_id=123&valami=semmi', 'user_id');
		}
	}
];

if(false) {
	var result = true;
	tests.forEach(function(test) {
		if(!test.test()) {
			console.error(test.id + '. test failed');
			result = false;
		}
	});
	if(result) {
		console.log('All tests succeeded!');
	}
}

module.exports = cs;