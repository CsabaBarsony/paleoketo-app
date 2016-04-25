'use strict';

var _ = require('lodash');
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookie = require('cookie-parser');
var portNumber = 3000;
var USER_STATUS = {
	GUEST: 'GUEST',
	LOGGED_IN: 'LOGGED_IN'
}
var userTokens = {};
var db = require('./database/data');

function getUser(user) {
	return {
		id: user.id,
		name: user.name
	}
}

function randomString(length) {
	var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var randomString = '';
	for (var i = 0; i < length; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz, randomPoz + 1);
	}
	return randomString;
}

function authorize(req) {
	if(!req.cookies || !req.cookies.user_id || !req.cookies.token ) return false;
	return userTokens[req.cookies.user_id].token === req.cookies.token;
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../public')));

app.use(cookie());

app.listen(portNumber);

console.log('Server is running on port ' + portNumber + '...');

app.post('/login', function(req, res){
	var users = db.table('users');
	users.get('name', req.body.username)
		.then(function(user) {
			if(user.password === req.body.password) {
				var random = randomString(32);
				userTokens[user.id] = random;
				res.cookie('user_id', user.id);
				res.cookie('token', random);
				var userData = getUser(user);
				userData.status = USER_STATUS.LOGGED_IN;

				res.send(userData);
			}
			else res.status(404).send('wrong username or password');
		}).catch(function() {
			res.status(404).send('wrong username or password');
		});
	return;
	
	db.query('select * from user where name = \'' + req.body.username + '\'', (err, rows) => {
		if(rows.length === 1) {
			var user = rows[0];
			
		}
		else {
			res.status(404).send('wrong username');
		}
	});
});

app.get('/userStatus', function(req, res) {
	var user = userTokens[req.cookies.user_id];
	if(user) {
		var userStatus = user.token === req.cookies.token ? USER_STATUS.LOGGED_IN : USER_STATUS.GUEST;
		var users = db.table('users');
		
		users.get('id', req.cookies.user_id)
			.then(function(user) {
			user.status = userStatus;
			res.send(user);
		}).catch(function() {
			res.status(404).send();
		});
	}
	else {
		res.status(404).send();
	}
});

app.get('/logout', function(req, res) {
	if(userTokens[req.cookies.user_id]) {
		userTokens[req.cookies.user_id] = null;
	}

	res.cookie('token', 'expired').send();
});

app.get('/user', function(req, res) {
	var data = getUser(req.query.id);
	data ? res.send(data) : res.status(404).send();
});

app.get('/foods/:foodGroupId', function(req, res) {
	db.query('select * from nutrients where food_group_id = \'' + req.params.foodGroupId + '\'', function(err, rows) {
		if(!err) {
			res.send(rows);
		}
		else {
			res.status(400).send();
		}
	});
});

app.post('/food', function(req, res) {
	db.query('UPDATE `nutrients` SET' +
		'  `name` = \'' 					+ req.body.name +
		'\', `description` = \'' 			+ req.body.description +
		'\', `category` = \'' 				+ req.body.category +
		'\', `paleo` = \'' 					+ req.body.paleo +
		'\', `keto` = \'' 					+ req.body.keto +
		'\', `enabled` = \'' 				+ (req.body.enabled ? 1 : 0) +
		'\' WHERE `nutrients`.`id` = ' 		+ req.body.id +
		';', function(err) {
		if(err) {
			console.log(err);
			res.status(400).send();
		}
		else {
			res.send();
		}
	});
});
