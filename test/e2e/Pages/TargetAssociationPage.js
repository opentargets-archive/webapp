var Page = require("./Page.js");

var TargetAssociationPage = function () {
    Page.call(this);
    browser.get("/target/ENSG00000157764/associations");
};

TargetAssociationPage.prototype = Object.create(Page.prototype, {
    // Header
    header: {
        get: function () {
            var headerElem = element(by.css(".cttv-content-header"));
            browser.wait (function () {
                return headerElem.getText()
                    .then (function (val) {
                        var n = val.split("\n")[1].split(" ")[1];
                        return (n !== undefined && n>0);
                    });
            }, 3750);
            return headerElem;
        }
    },

    // Tab view selection
    tabSelection: {
        get: function () {
            return element(by.css(".nav-tabs"));
        }
    },
    tableSelection: {
        get: function () {
            return this.tabSelection.element(by.css("[heading='Table']"));
        }
    },
    selectTable: {
        get: function () {
            return this.tableSelection.element(by.tagName('a')).click();
        }
    },

    // Table
    tableHeader: {
        get: function () {
            var theader = element(by.css(".dataTables_info"));
            this.waitForLoad(theader);
            return theader;
        }
    },

    // bubbles elements
    bubblesView: {
        get: function () {
            var bubbles = element(by.css("cttv-target-associations-bubbles"));
            this.waitForLoad(bubbles);
            return bubbles;
        },
    },
    bubblesViewSvg: {
        get: function () {
            var svg = this.bubblesView.element(by.css("svg"));
            this.waitForLoad(svg);
            return svg;
        }
    },
    bubblesViewLegend: {
        get: function () {
            var legend = this.bubblesViewSvg.all(by.css("g")).get(2);
            this.waitForLoad(legend);
            return legend;
        }
    },

});

module.exports = TargetAssociationPage;
