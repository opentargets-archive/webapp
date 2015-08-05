var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;




// Target Associations Page
describe ('cttv target association page', function () {
    beforeEach(function () {
        browser.get('/target/ENSG00000157764/associations');
    });
    describe ('bubbles view', function () {
        beforeEach(function () {
            svg = element(by.css('cttv-target-associations-bubbles svg'));
            waitForLoad(svg);
        });
        it('the container exists', function () {
            var container = element(by.css("cttv-target-associations-bubbles"));
            expect(container.isPresent()).to.eventually.equal(true);
        });
        it('the container renders a svg', function () {
            expect(svg.isPresent()).to.eventually.equal(true);
        });
        it('has dimensions', function () {
            expect(svg.getAttribute('width')).to.eventually.be.above(0);
            expect(svg.getAttribute('height')).to.eventually.be.above(0);
        });
        describe ('legend', function () {
            it ('is present', function () {
                var legend = element.all(by.css("svg g")).get(2);
                expect(legend.isPresent());
            });
        });
    });
});

// Aux functions
function waitForLoad(elem) {
    browser.wait (function () {
        var deferred = protractor.promise.defer();
        //element(by.css('cttv-target-associations-bubbles svg'))
        elem
            .isPresent()
            .then(function (val) {
                deferred.fulfill(val);
            }
        );
        return deferred.promise;
    }, 3000);
}
