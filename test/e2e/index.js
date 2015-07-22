var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;


// Index Page
describe('cttv index page', function() {
    beforeEach (function () {
        browser.get('index.html', 10000);
    });

    it('should have a title', function() {
        expect(browser.getTitle()).to.eventually.equal('CTTV Core - Home');
    });

    describe ('footer', function () {
        it('has a footer', function () {
            var footerElem = element(by.css(".footer"));
            expect(footerElem.isPresent()).to.eventually.equal(true);
        });
        it('contains a link to the FAQ', function () {
            var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
            expect(footerFAQlink.isPresent()).to.eventually.equal(true);
        });
        it('links the FAQ', function () {
            var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
            footerFAQlink.click();
            //browser.waitForAngular();
            expect(browser.getCurrentUrl()).to.eventually.contain("/faq");
        });
        it('contains a link to the Release Notes', function () {
            var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
            expect(footerRNlink.isPresent()).to.eventually.equal(true);
        });
        it('links the Release Notes', function () {
            var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
            footerRNlink.click();
            expect(browser.getCurrentUrl()).to.eventually.contain("/release-notes");
        });
    });
});
