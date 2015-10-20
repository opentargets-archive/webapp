var GenomeBrowser = function () {};

GenomeBrowser.prototype = Object.create (Object.prototype, {
    gbContainer: {
        enumerable: true,
        value: function (sectionBody) {
            return sectionBody.element(by.css("#cttvTargetGenomeBrowser"));
        }
    },
    gbContent: {
        enumerable: true,
        value: function (sectionBody) {
            var container = this.gbContainer(sectionBody);
            this.waitForContent(container, 3000);
            return container.all(by.css("*"));
        }
    },
    gbVis: {
        enumerable: true,
        value: function (sectionBody) {
            //var vis = this.gbContainer(sectionBody).element(by.tagName("svg"));
            var vis = this.gbContainer(sectionBody).element(by.css("g.tnt_g"));
            this.waitForVisible(vis);
            return vis;
        }
    },
    gbTracks: {
        enumerable: true,
        value: function (sectionBody) {
            var vis = this.gbVis(sectionBody);
            var tracks = vis.all(by.css(".tnt_track"));
            return tracks;
        }
    },
    gbGenes: {
        enumerable: true,
        value: function (sectionBody) {
            var tracks = this.gbTracks(sectionBody);
        }
    },
});

module.exports = GenomeBrowser;
