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
            template: // the close button
                      '<div class="modal-close-btn" ng-if="hasClose" ng-click="dismiss()">'
                     + '    <span class="fa fa-circle"></span><span class="fa fa-times"></span>'
                     + '</div>'
                     // the header
                     + '<div ng-if="header" class="modal-header"><h4>{{header}}</h4></div>'
                     // the body:
                     // the modal-body-content tag is only so it can be selected and replaced easily
                     + '<div class="modal-body"><modal-body-content></modal-body-content></div>'
                     // the footer
                     + '<div ng-if="hasOk || hasCancel" class="modal-footer">'
                     + '    <button ng-if="hasCancel" class="btn btn-warning" type=button ng-click="dismiss()">{{cancelLabel}}</button>'
                     + '    <button ng-if="hasOk" class="btn btn-primary" type=button ng-click="ok()">{{okLabel}}</button>'
                     + '</div>',

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
