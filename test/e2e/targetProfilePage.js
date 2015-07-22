var TargetProfilePage = function () {
    browser.get("/target/ENSG00000157764");
};

TargetProfilePage.prototype = Object.create({}, {
        pathwaySection: {
            get: function () {
                return element(by.css("div[heading=Pathways]"));
            }
        },
        pathwayPanelLink: {
            get: function () {
                return element(by.css("div[heading=Pathways] .accordion-toggle"));
            }
        },
        waitForSpinner: {
            value: function () {
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
        }
});

module.exports = TargetProfilePage;
