var cs = require('./helpers/cs');
var schemas = require('./schemas');

module.exports = {
	wish: {
		get: function(id, callback) {
			cs.get('/wish?id=' + id, (status, wish) => {
				if(status === bella.constants.response.OK) {
					var validation = SchemaInspector.validate(schemas.wish.server, wish);
					if(!validation.valid) {
						console.error('wish validation error', validation.format());
					}
					callback({ success: true }, schemas.wish.serverToClient(wish));
				}
				else if(status === bella.constants.response.NOT_FOUND) {
					callback({ success: false, message: 'Wish not found' });
				}
			});
		},
		post: function(wish, callback) {
			var validation = SchemaInspector.validate(schemas.wish.client, wish);
			if(validation.valid) {
				cs.post('/wish', schemas.wish.clientToServer(wish), (status) => {
					if(status === bella.constants.response.OK) callback({ success: true });
				});
			}
		}
	},
	wishList: {
		get: function(callback) {
			cs.get('/wishList', (status, wishList) => {
				if(status === bella.constants.response.OK) {
					var validation = SchemaInspector.validate(schemas.wishList.server, wishList);
					console.log('vaildation', validation);
					if(!validation.valid) console.error('wishList server validation error');
					callback({ success: true }, wishList);
				}
				else {
					console.error('wishList ajax error');
				}
			});
		}
	},
	userStatus: {
		get: function(callback) {
			cs.get('/userStatus', (status, userStatus) => {
				if(status === bella.constants.response.OK) {
					callback({ success: true }, userStatus);
				}
			});
		}
	},
	login: function(loginData, callback) {
		cs.post('/login', loginData, (status, user) => {
			if(status === bella.constants.response.OK) {
				callback({ success: true }, user);
			}
			else if(status === bella.constants.response.NOT_FOUND) {
				callback({ success: false });
			}
		});
	},
	logout: function(callback) {
		cs.get('logout', (status) => {
			if(status === bella.constants.response.OK) {
				callback({ success: true });
			}
		});
	},
	food: {
		get: function(categoryId, callback) {
			cs.get('/foods/' + categoryId, (status, foods) => {
			});
		},
		post: function(food, callback) {
			var validation = SchemaInspector.validate(schemas.food.client, food);

			if (validation.valid) {
				cs.post('/food', food, (status) => {
					if(status === bella.constants.response.OK) {
						callback(true, null);
					}
					else {
						callback(false, [{ property: 'server', message: 'error' }]);
					}
				});
			}
			else {
				callback(validation.valid, validation.error);
			}
		},
		getName: function() {
			return 'this is my name';
		}
	}
};
