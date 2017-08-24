
angular.module('cttvDirectives')
    .directive('otFacebookFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            template: '<div class="fb-page"'
                        + '    data-href="https://www.facebook.com/OpenTargets/"'
                        + '    data-tabs="timeline"'
                        + '    data-small-header="true"'
                        + '    data-adapt-container-width="true"'
                        + '    data-hide-cover="false"'
                        + '    data-show-facepile="false"'
                        + '    height="400">'
                        + '    <blockquote cite="https://www.facebook.com/OpenTargets/" class="fb-xfbml-parse-ignore"><a href="https://www.facebook.com/OpenTargets/">Open Targets</a></blockquote>'
                        + '</div>',
            link: function () {
                try {
                    FB.XFBML.parse();
                } catch (e) {
                    $log.warn('Cannot load Facebook feed');
                }
            }
        };
    }]);
