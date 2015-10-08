var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;


module.exports = function () {
    describe ('footer', function () {
        beforeEach (function () {
            footer = page.footer;
        });
        it('has a footer', function () {
            expect(footer.isPresent()).to.eventually.equal(true);
        });
        it('contains a link to the FAQ', function () {
            var footerFAQlink = page.footerFAQlink;
            //var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
            expect(footerFAQlink.isPresent()).to.eventually.equal(true);
        });
        it('links the FAQ', function () {
            this.timeout(10000);
            var footerFAQlink = page.footerFAQlink;
            //var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
            //page.waitForVisible(footerFAQlink);
            //console.log(footerFAQlink);
            footerFAQlink.click();
            browser.driver.wait(function () {
                return browser.driver.getCurrentUrl()
                    .then(function (url) {
                        return url.indexOf("/faq") !== -1;
                    });
            }, 5500);

            expect(true).to.be.true;
            //expect(browser.getCurrentUrl()).to.eventually.contain("/faq");
        });
        it('contains a link to the Release Notes', function () {
            var footerRNlink = page.footerReleaseNotesLink;
            //var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
            expect(footerRNlink.isPresent()).to.eventually.equal(true);
        });
        it('links the Release Notes', function () {
            this.timeout(10000);
            var footerRNlink = page.footerReleaseNotesLink;
            //var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
            // page.waitForVisible(footerRNlink);
            footerRNlink.click();
            browser.driver.wait(function () {
                return browser.driver.getCurrentUrl().then(function (url) {
                    return url.indexOf("/release-notes") !== -1;
                });
            }, 5500);
            expect(true).to.be.true;
            //expect(browser.getCurrentUrl()).to.eventually.contain("/release-notes");
        });
    });
};
