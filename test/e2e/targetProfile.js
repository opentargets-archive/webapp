var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

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


// Target Profile Page with page Object
var TargetProfilePage = require("./Pages/TargetProfilePage.js");
describe ('cttv target profile page 2', function () {
    beforeEach (function () {
        this.timeout(15000);
        page = new TargetProfilePage();
        page.waitForSpinner();
    });

    describe ('pathways', function () {
        // beforeEach (function () {
        //     this.timeout = 10000;
        //     pathways = page.pathwaySection;
        // });

        it ("has a pathways section", function () {
            this.timeout(10000);
            var pathways = page.pathwaySection;
            expect(pathways.isPresent()).to.eventually.equal(true);
        });

        it ("has correct links in all entries", function () {
            // Open the pathways panel
            expect(page.pathwayPanelLink.isPresent()).to.eventually.equal(true);
            page.pathwayPanelLink.click();
            //...
        });
    });
});

// Target Profile Page
describe ('cttv target profile page', function () {
    beforeEach(function () {
        this.timeout(10000);
        browser.get('/target/ENSG00000157764');
    });
    describe ('pathways', function () {
        it ("has the pathways section", function (){
            var pathwaySection = element(by.css("div[heading=Pathways]"));
            expect(pathwaySection.isPresent()).to.eventually.equal(true);
        });
        it ("has correct links in all the entries", function () {
            this.timeout(20000);
            page.waitForSpinner();

            // Open the pathways panel
            var pathwayPanelLink = element(by.css("div[heading=Pathways] .accordion-toggle"));
            expect(pathwayPanelLink.isPresent()).to.eventually.equal(true);
            pathwayPanelLink.click();


            expect(element(by.css("div[heading=Pathways] .panel-body")).isPresent()).to.eventually.equal(true);
            page.waitForVisible(element(by.css("div[heading=Pathways] .panel-body")));

            var appWindow = browser.getWindowHandle();

            element.all(by.repeater('pathway in pathways')).each (function (path) {
                var a = path.element(by.tagName("a"));
                expect(a.isPresent()).to.eventually.equal(true);

                var name;
                a.getText()
                    .then (function (myName) {
                        name = myName;
                        return myName;
                    })
                    .then (function (myName) {
                        a.click();
                        return myName;
                    })
                    .then (function (myName) {
                        var handles = browser.getAllWindowHandles();
                        return handles;
                    })
                    .then (function (handles) {
                        browser.switchTo().window(handles[handles.length-1]);
                    })
                    .then (function () {
                        return browser.driver.getTitle();
                    })
                    .then (function (title) {
                        console.log("TITLE: " + title + "  -- contains -- " + name);
                        browser.switchTo().window(appWindow);
                        expect(title).to.contain(name);
                    });
            });
        });
    });
});

// Aux functions
// function waitForLoad(elem) {
//     browser.wait (function () {
//         var deferred = protractor.promise.defer();
//         //element(by.css('cttv-target-associations-bubbles svg'))
//         elem
//             .isPresent()
//             .then(function (val) {
//                 deferred.fulfill(val);
//             }
//         );
//         return deferred.promise;
//     }, 3000);
// }
//
// function waitForVisible(elem) {
//     browser.wait (function () {
//         var deferred = protractor.promise.defer();
//         elem
//             .isDisplayed()
//             .then (function (val) {
//                 deferred.fulfill(val);
//             }
//         );
//         return deferred.promise;
//     }, 3000);
// }
//
// function waitForSpinner() {
//     browser.wait (function () {
//         var deferred = protractor.promise.defer();
//         var spinner = element(by.tagName("cttv-page-progress-spinner"));
//         spinner
//             .isDisplayed()
//             .then (function (val) {
//                 deferred.fulfill(!val);
//             }
//         );
//         return deferred.promise;
//     }, 3000);
// }
