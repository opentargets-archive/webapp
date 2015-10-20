var Page = require("./Page.js");

var Section = function (id) {
    "use strict";
    Page.call(this);
};

Section.prototype = Object.create (Page.prototype, {
    section: {
        value: function (name) {
            return element(by.css("div[attr-section-name=" + name + "]"));
        },
    },
    toggleSection: {
        value: function (name) {
            var sec = this.section(name);
            var openLink = sec.element(by.css(".accordion-toggle"));
            openLink.click();
            var body = sec.element(by.css(".panel-body"));
            this.waitForVisible(body);

            return sec;
        }
    },

    // Will toggle if it is not open
    openSection: {
        value: function (name) {
            var self = this;
            var sec = this.section(name);
            var secBodyDiv = sec.element(by.css(".panel-collapse"));
            //var secBody = this.sectionBody(name);
            secBodyDiv.getCssValue("height").then (function (val) {
                if (val === "0px") {
                    return self.toggleSection(name);
                }
            });
        }
    },

    sectionBody: {
        value: function (name) {
            var sec = this.section(name);
            return sec.element(by.css(".panel-body"));
        }
    },
});

module.exports = Section;
