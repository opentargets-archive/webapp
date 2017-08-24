angular.module('cttvDirectives')

    .directive('cttvSizeListener', [function () {
        'use strict';

        return {
            restrict: 'AE',

            scope: {
                onresize: '=?'
            },

            // template: '<iframe style="width:100%; height:100%; visibility:hidden"></iframe>',
            template: '<div style=\'width:100%; height:0; margin:0; padding:0; overflow:hidden; visibility:hidden; z-index:-1\'>'
                     + '    <iframe style=\'width:100%; height:0; border:0; visibility:visible; margin:0\' />'
                     // +"    <iframe style='width:0; height:100%; border:0; visibility:visible; margin:0' />"
                     + '</div>',

            link: function (scope, elem) {
                var iframe = elem[0].children[0].children[0].contentWindow || elem[0].children[0].children[0];

                iframe.onresize = function (evt) {
                    // $log.log("onresize( "+evt.target.innerWidth+" x "+evt.target.innerHeight+" )");
                    if (scope.onresize) {
                        scope.onresize({w: evt.target.innerWidth, h: evt.target.innerHeight});
                    }
                };
            }
        };
    }]);
