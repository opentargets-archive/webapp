var CttvPage = function () {};

CttvPage.prototype = Object.create ({},{
    // Common sections in all pages
    footer: {
        get: function () {
            return element(by.css(".footer"));
        }
    },
    footerFAQlink: {
        get: function () {
            var faqLink = this.footer.element(by.css("a[href='/faq']"));
            this.waitForVisible(faqLink);
            return faqLink;
        }
    },
    footerReleaseNotesLink: {
        get: function () {
            var rnLink = this.footer.element(by.css("a[href='/release-notes']"));
            this.waitForVisible(rnLink);
            return rnLink;
        }
    },

    openSection: {
        value: function (section) {
            var openLink = section.element(by.css(".accordion-toggle"));
            openLink.click();
            var body = section.element(by.css(".panel-body"));
            this.waitForVisible(body);
            return body;
        }
    },
    window: {
        get: function () {
            return browser.getWindowHandle();
        }
    },

    waitForSpinner: {
        value : function () {
            browser.wait (function () {
                var deferred = protractor.promise.defer();
                var spinner = element(by.tagName("cttv-page-progress-spinner"));
                spinner
                    .isDisplayed()
                    .then (function (val) {
                        // console.log(val);
                        deferred.fulfill(!val);
                    });
                return deferred.promise;
            }, 10000);
        }
    },
    waitForLoad: {
        value: function (elem) {
            browser.wait (function () {
                var deferred = protractor.promise.defer();
                //element(by.css('cttv-target-associations-bubbles svg'))
                elem
                    .isPresent()
                    .then(function (val) {
                        deferred.fulfill(val);
                    });
                return deferred.promise;
            }, 10000);
        }
    },
    waitForVisible: {
        value: function (elem) {
            browser.wait (function () {
                var deferred = protractor.promise.defer();
                elem
                    .isDisplayed()
                    .then (function (val) {
                        deferred.fulfill(val);
                    });
                return deferred.promise;
            }, 10000);
        }
    },
});

module.exports = exports = CttvPage;
