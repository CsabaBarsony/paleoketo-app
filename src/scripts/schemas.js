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
	blank: function() {
		return {
			id: null,
			name: '',
			status: bella.constants.userStatus.GUEST
		}
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
	clientToServer: function(obj) {

	},
	serverToClient: function(obj) {

	}
};

module.exports = {
	user: user,
	food: food
};
