var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('cttv webapp page', function() {
    it('should have a title', function() {
	browser.get('app/index.html');
	expect(browser.getTitle()).to.eventually.equal('Search test');
    });
});
