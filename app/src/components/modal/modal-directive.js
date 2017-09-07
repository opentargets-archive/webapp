angular.module('otDirectives')
    .directive('otModal', [function () {
        'use strict';

        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                header: '@',        // the text to be displayed in the header
                hasClose: '=?',      // show the round close button top right corner [true | false]
                hasOk: '=?',         // show ok button [true | false]
                hasCancel: '=?',     // show cancel button [true | false]
                okLabel: '@?',       // text of the OK button [ String ]
                cancelLabel: '@?',   // text of the Cancel button [ String ]
                onOk: '&',          // OK callback [ function ]
                onCancel: '&'       // cancel callback [function ]
            },
            templateUrl: 'src/components/modal/modal.html',
            link: function (scope, elem, attrs, ctrl, transclude) {
                transclude(scope.$parent, function (clone) {
                    elem.find('modal-body-content').replaceWith(clone);
                });

                scope.okLabel = scope.okLabel || 'OK';
                scope.cancelLabel = scope.cancelLabel || 'Cancel';

                scope.dismiss = function () {
                    if (scope.onCancel) {
                        scope.onCancel();
                    }
                    elem.scope().$dismiss();
                };
                scope.ok = function () {
                    if (scope.onOk) {
                        scope.onOk();
                    }
                    elem.scope().$close();
                };
            }

        };
    }]);
