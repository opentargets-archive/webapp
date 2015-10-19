var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;


// Target Profile Page with page Object
var TargetProfilePage = require("./Pages/TargetProfilePage.js");


describe ('cttv target profile page', function () {
    beforeEach (function () {
        this.timeout(15000);
        page = new TargetProfilePage();
        page.waitForSpinner();
    });

    // Common tests
    //require("./common.js")();

    describe ('sections', function () {
        it ('has a Protein Information (from Uniprot) section', function () {
            var uniprotSection = page.section('Uniprot');
            expect (uniprotSection.isPresent()).to.eventually.equal(true);
        });

        it ('has a pathways section', function () {
            var pathwaysSection = page.section('Pathways');
            expect(pathwaysSection.isPresent()).to.eventually.equal(true);
        });
    });

    describe ('uniprot', function () {
        beforeEach (function () {
            this.timeout(15000);
            sectionName = 'Uniprot';
            page.openSection(sectionName);
        });

        it ("has 2 tabs", function () {
            var uniprotSectionBody = page.sectionBody(sectionName);
            expect (uniprotSectionBody.isPresent()).to.eventually.equal(true);
            expect(page.uniprotTabs).to.eventually.have.length(2);
        });

        it ("has a graphical tab", function () {
            var uniprotGraphicalTab = page.uniprotGraphicalTab;
            expect (uniprotGraphicalTab.get(0).isPresent()).to.eventually.equal(true);
        });

        describe ('graphical view', function () {
            beforeEach (function () {
                container = page.sectionBody(sectionName);
            });
            // Run uniprot widget tests
            require("./uniprotWidget.js")();
        });

    });

    describe ('pathways', function () {
        beforeEach (function () {
            this.timeout(15000);
            sectionName = 'Pathways';
            page.openSection(sectionName);
        });

        it ("has a non-empty body", function () {
            var pathwaysSectionBody = page.sectionBody(sectionName);
            // pathwaysBody.getText().then (function (val) {
            //     console.log(val);
            // });
            expect(pathwaysSectionBody.isPresent()).to.eventually.equal(true);
            expect(pathwaysSectionBody.getText()).to.eventually.not.be.empty;
        });

        it ("has correct links in all entries", function () {
            this.timeout(20000);
            // Open the pathways panel

            var appWindow = browser.getWindowHandle();
            page.pathwayLinks.each (function (path) {
                // The links
                var a = path.element(by.tagName("a"));
                expect(a.isPresent()).to.eventually.equal(true);

                var name;
                path.getText()
                    .then (function (myName) {
                        name = myName;
                    })
                    .then (function () {
                        return a.click();
                    })
                    .then (function () {
                        var handles = browser.getAllWindowHandles();
                        return handles;
                    })
                    .then (function (handles) {
                        return browser.switchTo().window(handles[handles.length-1]);
                    })
                    .then (function () {
                        // browser.driver.sleep(1000);
                        // Wait for the title of the page to be there...
                        browser.wait (function () {
                            var deferred = protractor.promise.defer();
                            browser.driver
                                .getTitle()
                                .then (function (title) {
                                    console.log(title);
                                    return deferred.fulfill(title.length > 10);
                                });
                            return deferred.promise;
                        }, 10000);

                        return browser.driver.getTitle();
                    })
                    .then (function (title) {
                        console.log("TITLE: " + title + "  -- contains -- " + name);
                        browser.switchTo().window(appWindow);
                        expect(title).to.contain(name);
                    });
            });
            //...
        });
    });
});
