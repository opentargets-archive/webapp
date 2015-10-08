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
            this.timeout(20000);
            // Open the pathways panel
            expect(page.pathwayPanelLink.isPresent()).to.eventually.equal(true);
            page.pathwayPanelLink.click();

            expect(page.pathwayPanelBody.isPresent()).to.eventually.equal(true);

            var appWindow = browser.getWindowHandle();
            page.pathwayLinks.each (function (path) {
                // The links
                var a = path.element(by.tagName("a"));
                expect(a.isPresent()).to.eventually.equal(true);

                var name;
                path.getText()
                    .then (function (myName) {
                        console.log(myName);
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
            //...
        });
    });
});
