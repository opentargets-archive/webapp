var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

// Container is passed globally as the widget parent container
module.exports = function () {
    describe ('uniprot widget', function () {
        beforeEach (function () {
            widgetContainer = page.uwContainer(container);
        });
        it ("has a container", function () {
            expect(widgetContainer.isPresent()).to.eventually.be.equal(true);
        });
        it ("renders", function () {
            this.timeout(10000);
            var widgetContent = page.uwContent(container);
            expect(widgetContent).to.eventually.have.length.above(0);
        });
    });
};
