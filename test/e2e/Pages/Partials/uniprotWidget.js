
var UniprotWidget = function () {};

UniprotWidget.prototype = Object.create (Object.prototype, {
    uwContainer: {
        enumerable: true,
        value: function (sectionBody) {
            return sectionBody.element(by.css('#uniprotProteinFeatureViewer'));
        }
    },
    uwContent: {
        enumerable: true,
        value: function (sectionBody) {
            var container = this.uwContainer(sectionBody);
            this.waitForContent(container, 3000);
            return container.all(by.css("*"));
        }
    }
});

module.exports = UniprotWidget;
