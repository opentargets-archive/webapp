var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Container is passed globally as the widget parent container
module.exports = function () {
    describe ('Genome browser', function () {
        beforeEach (function () {
            widgetContainer = page.gbContainer(container);
        });
        it ("has a container", function () {
            expect(widgetContainer.isPresent()).to.eventually.be.equal(true);
        });
        it ("renders", function () {
            this.timeout(10000);
            var vis = page.gbVis(container);
            expect(vis.isPresent()).to.eventually.be.equal(true);
        });
        it ("has tracks", function () {
            this.timeout(8000);
            var tracks = page.gbTracks(container);
            expect(tracks).to.eventually.have.length.above(0);
        });
        it ("has the correct number of tracks", function () {
            this.timeout(8000);
            var tracks = page.gbTracks(container);
            expect(tracks.count()).to.eventually.have.length.equal(7);
        });
        // it ("has genes", function () {
        //     this.timeout(10000);
        //     var genes = page.gbGenes(container);
        //     expect (genes.count()).to.eventually.have.length.above(0);
        // });
        it ("has a common disease variants tracks");
        it ("has common disease vartiants");
        it ("has a rare disease variants tracks");
        it ("has rare disease variants");
        it ("has a reload button");
        it ("reloads");
        it ("has a location track");
        it ("has the correct information");
        it ("has a link to the ensembl gene");
        it ("links to the ensembl gene");
    });
};
