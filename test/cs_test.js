describe('cs common helper', function() {
	it('getQueryValue should return query string value', function() {
		var queryString = '?csati=majom&user_id=123&valami=semmi';
		
		expect(cs.getQueryValue(queryString, 'csati'))	.toEqual('majom');
		expect(cs.getQueryValue(queryString, 'user_id')).toEqual('123');
		expect(cs.getQueryValue(queryString, 'valami'))	.toEqual('semmi');
	});
});