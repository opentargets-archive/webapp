var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Home Page with page Object
var HomePage = require("./Pages/HomePage.js");

// Test common sections
var commonTests = require("./common.js");

// Home Page
describe ('cttv Home Page', function () {
    beforeEach (function () {
        this.timeout(10000);
        page = new HomePage();
    });

    // Title
    describe ('title', function () {
        beforeEach (function () {
            title = browser.getTitle();
        });
        it('is present', function () {
            title.then(function (t) {
                expect(t).to.be.ok;
            });
        });
        it('includes "CTTV Platform"', function () {
            title.then(function (t) {
                expect(browser.getTitle()).to.eventually.contain('CTTV Platform');
            });
        });
    });
    commonTests();
});
