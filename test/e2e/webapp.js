var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Index Page
// describe('cttv index page', function() {
//     beforeEach (function () {
//         browser.get('index.html', 10000);
//     });
//
//     it('should have a title', function() {
//         expect(browser.getTitle()).to.eventually.equal('CTTV Core - Home');
//     });
//
//     describe ('footer', function () {
//         it('has a footer', function () {
//             var footerElem = element(by.css(".footer"));
//             expect(footerElem.isPresent()).to.eventually.equal(true);
//         });
//         it('contains a link to the FAQ', function () {
//             var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
//             expect(footerFAQlink.isPresent()).to.eventually.equal(true);
//         });
//         it('links the FAQ', function () {
//             var footerFAQlink = element(by.css('.footer a[href="/faq"]'));
//             footerFAQlink.click();
//             //browser.waitForAngular();
//             expect(browser.getCurrentUrl()).to.eventually.contain("/faq");
//         });
//         it('contains a link to the Release Notes', function () {
//             var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
//             expect(footerRNlink.isPresent()).to.eventually.equal(true);
//         });
//         it('links the Release Notes', function () {
//             var footerRNlink = element(by.css('.footer a[href="/release-notes"]'));
//             footerRNlink.click();
//             expect(browser.getCurrentUrl()).to.eventually.contain("/release-notes");
//         });
//     });
// });
//
//
// // Target Associations Page
// describe ('cttv target association page', function () {
//     beforeEach(function () {
//         browser.get('/target/ENSG00000157764/associations');
//     });
//     describe ('bubbles view', function () {
//         beforeEach(function () {
//             svg = element(by.css('cttv-target-associations-bubbles svg'));
//             waitForLoad(svg);
//         });
//         it('the container exists', function () {
//             var container = element(by.css("cttv-target-associations-bubbles"));
//             expect(container.isPresent()).to.eventually.equal(true);
//         });
//         it('the container renders a svg', function () {
//             expect(svg.isPresent()).to.eventually.equal(true);
//         });
//         it('has dimensions', function () {
//             expect(svg.getAttribute('width')).to.eventually.be.above(0);
//             expect(svg.getAttribute('height')).to.eventually.be.above(0);
//         });
//         describe ('legend', function () {
//             it ('is present', function () {
//                 var legend = element.all(by.css("svg g")).get(2);
//                 expect(legend.isPresent());
//             });
//         });
//     });
// });

// Target Profile Page
describe ('cttv target profile page', function () {
    beforeEach(function () {
        browser.get('/target/ENSG00000157764');
    });
    describe ('pathways', function () {
        it ("has the pathways section", function (){
            var pathwaySection = element(by.css("div[heading=Pathways]"));
            expect(pathwaySection.isPresent()).to.eventually.equal(true);
        });
        it ("has correct links in all the entries", function () {
            this.timeout(10000);
            waitForSpinner();

            // Open the accordion panel
            var pathwayPanelLink = element(by.css("div[heading=Pathways] .accordion-toggle"));
            expect(pathwayPanelLink.isPresent()).to.eventually.equal(true);
            pathwayPanelLink.click();


            expect(element(by.css("div[heading=Pathways] .panel-body")).isPresent()).to.eventually.equal(true);
            waitForVisible(element(by.css("div[heading=Pathways] .panel-body")));
            element.all(by.repeater('pathway in pathways')).then (function (paths) {
                for (var i=0; i<paths.length; i++) {
                    var a = paths[i].element(by.tagName("a"));
                    expect(a.isPresent()).to.eventually.equal(true);
                    var l = paths[i].element(by.tagName("a"));
                    l.getAttribute("href").then(function (url) {
                        console.log(url);
                        var reactId = url.split("/").pop();
                        console.log(reactId);
                        l.click().then (function () {
                            console.log("CLICKED!!");
                            browser.getAllWindowHandles().then (function (handles) {
                                browser.switchTo().window(handles[1]).then (function () {
                                    expect(browser.driver.getTitle()).to.eventually.contain(reactId);
                                    browser.switchTo().window(handles[0]);
                                });
                            });
                        });
                    });
                    //console.log("========");
                    //console.log(l);
                    // var l = paths[i].element(by.tagName("a"));
                    // l.click();
                    // browser.getCurrentUrl().then(function (url) {
                    //     console.log(url);
                    // });
                }
            });
        });
        // it ("links to correct urls", function () {
        //     element.all(by.repeater('pathway in pathways'))
        //         .then (function (paths) {
        //             for (var i=0; i<paths.lenght; i++) {
        //                 var a = paths[i]
        //             }
        //             var a = paths[0].element(by.css(""));
        //
        //         })
        // })
    });
});

// Aux functions
function waitForLoad(elem) {
    browser.wait (function () {
        var deferred = protractor.promise.defer();
        //element(by.css('cttv-target-associations-bubbles svg'))
        elem
            .isPresent()
            .then(function (val) {
                deferred.fulfill(val);
            }
        );
        return deferred.promise;
    }, 3000);
}

function waitForVisible(elem) {
    browser.wait (function () {
        var deferred = protractor.promise.defer();
        elem
            .isDisplayed()
            .then (function (val) {
                deferred.fulfill(val);
            }
        );
        return deferred.promise;
    }, 3000);
}

function waitForSpinner() {
    browser.wait (function () {
        var deferred = protractor.promise.defer();
        var spinner = element(by.tagName("cttv-page-progress-spinner"));
        spinner
            .isDisplayed()
            .then (function (val) {
                console.log(val);
                deferred.fulfill(!val);
            }
        );
        return deferred.promise;
    }, 3000);
}
