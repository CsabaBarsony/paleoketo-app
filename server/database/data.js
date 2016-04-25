var mysql = require('mysql'),
	db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'paleoketo'
	});

var tables = {
	users: {
			get: (fieldName, fieldValue) => {
				return new Promise(function(resolve, reject) {
					db.query('select * from users where ' + fieldName + ' = \'' + fieldValue + '\'', function (err, rows) {
						if(rows.length === 1) {
							resolve(rows[0]);
						}
						else {
							reject('fail');
						}
					});
				});
			}
		}
};

module.exports = {
	connect: () => {
		db.connect();
	},
	table: function(table) {
		return tables[table];
	}
};