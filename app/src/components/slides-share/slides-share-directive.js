angular.module('otDirectives')
    .directive('slidesShare', ['$timeout', function ($timeout) {
        'use strict';
        return {
            restrict: 'EA',
            scope: {},
            template: '<div id="pdf-slides"></div>',
            link: function () {
                $timeout(function () {
                    PDFObject.embed("OpenTargets_Platform_Let.sGetStarted_DGH_ID_DCS.pdf", "#pdf-slides");
                }, 0);
            }
        };
    }]);
