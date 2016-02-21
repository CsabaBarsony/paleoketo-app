"use strict";

var _ = require('lodash');
var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
var cookie = require('cookie-parser');
var portNumber = 3000;

var mysql = require('mysql');
var db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'paleoketo'
});

db.connect();

var userTokens = {};

var questList = {
	'1': {
		id: '1',
		title: 'Old scotch whisky',
		description: 'I\'d like to have on old scotch whisky',
		userId: '1'
	},
	'2': {
		id: '2',
		title: 'Robot dog',
		description: 'I want a robot dog',
		userId: '2'
	}
};

function getQuest(id) {
	var quest = questList[id];
	if(quest) {
		var user = userTokens[quest.userId];

		return {
			id: quest.id,
			title: quest.title,
			descrjiption: quest.description,
			user: {
				id: user.id,
				name: user.name
			}
		}
	}
	else {
		return null;
	}
}

function setQuest(quest, rId, userId) {
	return {
		id: quest.id || rId,
		title: quest.title,
		description: quest.description,
		userId: quest.user.id || userId
	};
}

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

app.use(express.static(path.join(__dirname, "../public")));

app.use(cookie());

app.listen(portNumber);

console.log("Server is running on port " + portNumber + "...");

app.post('/login', function(req, res){
	db.query('select * from user where name = \'' + req.body.username + '\'', (err, rows) => {
		if(rows.length === 1) {
			var user = rows[0];
			if(user.password === req.body.password) {
				var random = randomString(32);
				userTokens[user.id] = random;
				res.cookie('user_id', user.id);
				res.cookie('token', random);
				var userData = getUser(user);
				userData.status = 'LOGGED_IN';

				res.send(userData);
			}
			else res.status(404).send('wrong password');
		}
		else {
			res.status(404).send('wrong username');
		}
	});
});

app.get('/userStatus', function(req, res) {
	var user = userTokens[req.cookies.user_id];
	if(user) {
		var userStatus = user.token === req.cookies.token ? 'LOGGED_IN' : 'GUEST';
		db.query('select * from user where id = ' + req.cookies.user_id, (err, rows) => {
			if(!err && rows.length === 1) {
				var userData = getUser(rows[0]);
				userData.status = userStatus;
				res.send(userData);
			}
			else {
				res.status(404).send('wrong user');
			}
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

app.get('/wishList', function(req, res) {
	db.query('select * from wish', (err, rows) => {
		res.send()
	});
	res.send(_.map(questList, q => getQuest(q.id)));
});

app.get('/wish', function(req, res) {
	var data = getQuest(req.query.id);
	data ? res.send(data) : res.status(404).send();
});

app.post('/wish', function(req, res) {
	if(authorize(req)) {
		if(req.body.id) {
			if(questList[req.body.id].userId === req.cookies.user_id) {
				questList[req.body.id] = setQuest(req.body);
				res.send(getQuest(req.body.id));
				console.log(questList);
			}
			else {
				res.status(500).send();
			}
		}

		else {
			var rId = randomString(10);
			questList[rId] = setQuest(req.body, rId, req.cookies.user_id);
			console.log(questList);
			res.send(getQuest(rId));
		}
	}
	else {
		res.status(500).send();
	}
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
