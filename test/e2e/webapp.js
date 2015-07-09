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


// Target Associations Page
describe ('cttv target association page', function () {
    beforeEach(function () {
        browser.get('/target/ENSG00000157764/associations');
    });
    describe ('bubbles view', function () {
        it('the container exists', function () {
            var container = element(by.css("cttv-target-associations-bubbles"));
            expect(container.isPresent());
        });
        it('the container renders a svg', function () {
            var svg = element(by.css('cttv-target-associations-bubbles svg'));
            //browser.wait(svg.isPresent());
            browser.wait (function () {
                var deferred = protractor.promise.defer();
                element(by.css('cttv-target-associations-bubbles svg')).isPresent().then(function (val) {
                    deferred.fulfill(val);
                });
                return deferred.promise;
            }, 3000);
            //browser.wait(element(by.css('cttv-target-associations-bubbles svg')).isPresent);
            expect(svg.isPresent()).to.eventually.equal(true);
            //expect(svg.isPresent()).toBeTruthy();
        });
        it('has dimensions', function () {
            var svg = element(by.css('cttv-target-associations-bubbles svg'));
            browser.waitForAngular();
            svg.getAttribute('width')
                .then(function(width) {
                    console.log("WIDTH: " + width);
                });
        });
        describe ('legend', function () {
            it ('is present', function () {
                var legend = element.all(by.css("svg g")).get(2);
                expect(legend.isPresent());
            });
            // it ('has the bar', function () {
            //     var bar = element(by.css("svg>g:nth-child(2)>rect"));
            //     expect(bar.isPresent());
            // });
            // it ('has the fill bar', function () {
            //     var fillBar = element(by.css("svg>g:nth-child(2)>rect:nth-child(2)"));
            //     expect(fillBar.isPresent());
            // });
            // it ('fill bar is lower or equal width than empty bar', function () {
            //     browser.getTitle().then (function (title) {
            //         console.log("TITLE: " + title);
            //     });
            //
            //     var emptyBar = element(by.css("svg>g:nth-child(2)>rect"));
            //     var fillBar = element(by.css("svg>g:nth-child(2)>rect:nth-child(2)"));
            //
            //     browser.debugger();
            //
            //     emptyBar.getAttribute("width").then(function (val) {
            //         console.log(">" + val);
            //     });
            //     //expect(emptyBar.getAttribute("width") >= fillBar.getAttribute("width"));
            // });
        });
    });
});


// Target Profile Page
describe ('cttv target profile page', function () {

});
