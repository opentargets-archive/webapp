// TODO: otLocationState is needed here to ensure it picks up the initial page load's
// $locationChangeSuccess event, so that the facets respond to url changes.
// It would be better to clearly specify otLocationState's init code and trigger on app load.
/* eslint-disable angular/di-unused */
angular.module('otControllers')

    /**
     * Simple controller to expose the current page to the feedback button controller
     */
    .controller('FeedbackController', ['$scope', '$location', 'otLocationState', '$uibModal', function ($scope, $location, otLocationState, $uibModal) {
        'use strict';
        // expose the location;
        // note that exposing the page as $location.absUrl() does not work as that would not update when URL changes
        $scope.location = $location;
        $scope.showSocialMedia = false;

        // perhaps we should use our locationstate service instead?
        $scope.$on('$locationChangeSuccess', function () {
            // when the location is back to the homepage, we hide the social media icons and show the "follow us" instead...
            if ($location.path() === '/') {
                $scope.showSocialMedia = false;
            }
        });

        $scope.openSignupForm = function () {
            $uibModal.open({
                animation: true,
                // template: "<div class=modal-header>PNG scale factor</div><div class='modal-body modal-body-center'><span class=png-scale-factor-selection><input type=radio name=pngScale value=1 checked ng-model='$parent.currScale'> 1x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=2 ng-model='$parent.currScale'> 2x</span><span class=png-scale-factor-selection><input type=radio name=pngScale value=3 ng-model='$parent.currScale'> 3x</span></div><div class=modal-footer><button class='btn btn-primary' type=button ng-click='export(this)' onclick='angular.element(this).scope().$dismiss()'>OK</button></div>",
                // template: '<ot-modal header="Download as PNG" on-ok="export()" has-ok="true" ok-label="Download" has-cancel="true">'
                //               + '<div class="modal-body-center">'
                //                   + '<p>Select scale factor for the image</p>'
                //                   + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="1" ng-model="$parent.currScale"> 1x</span>'
                //                   + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="2" ng-model="$parent.currScale"> 2x</span>'
                //                   + '<span class="png-scale-factor-selection"><input type="radio" name="pngScale" value="3" ng-model="$parent.currScale"> 3x</span>'
                //               + '</div>'
                //           + '</ot-modal>',
                templateUrl: 'src/components/signup-form/signup-form.html',
                size: 'md',
                scope: $scope
            })
                .result.then(
                    function () {}, 
                    function (res) {}   // this is required with the new version of Angular, or every modal.close() triggers an error in the console
                );
        };

        $scope.openFeedbackForm = function () {
            $uibModal.open({
                animation: true,
                templateUrl: 'src/components/signup-form/feedback-form.html',
                size: 'md',
                scope: $scope
            })
                .result.then(
                    function () {}, 
                    function (res) {}   // this is required with the new version of Angular, or every modal.close() triggers an error in the console
                );
        };
    }]);

