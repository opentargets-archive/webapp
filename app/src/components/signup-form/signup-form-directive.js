angular.module('otDirectives')
    .directive('otSignupForm', ['$uibModal', function ($uibModal) {
        'use strict';

        return {
            restrict: 'E',
            scope: {},
            // templateUrl: 'src/components/signup-form/signup-form.html',
            template: '<div><a class="btn btn-info" ng-click="openSignupForm()">Sign up!</a></div>',
            link: function (scope) {
                scope.openSignupForm = function () {
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
                        size: 'sm',
                        scope: scope
                    });
                };
            }

        };
    }]);
