angular.module('otDirectives')
    .directive('otSignupForm', ['$uibModal', function ($uibModal) {
        'use strict';

        return {
            restrict: 'E',
            scope: {},
            // templateUrl: 'src/components/signup-form/signup-form.html',
            template: '<div><a class="btn btn-success" ng-click="openSignupForm()">Sign up to our newsletter</a></div>',
            link: function (scope, element) {
                scope.openSignupForm = function () {
                    scope.myForm = $uibModal.open({
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
                        // template: '<ot-modal header="Download as PNG" on-ok="test()" has-ok="true" ok-label="test" has-cancel="true">'
                        //               + '<div class="modal-body-center">'
                        //                   + '<div id="mc_embed_signup">'
                        //                   + '    <form action="https://opentargets.us17.list-manage.com/subscribe/post?u=d11d0467053c1d4b918eb8738&amp;id=aa83c5e27a" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>'
                        //                   + '        <div id="mc_embed_signup_scroll">'
                        //                   + '        <label for="mce-EMAIL">Subscribe to our mailing list</label>'
                        //                   + '        <input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>'
                        //                   + '        <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->'
                        //                   + '        <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_d11d0467053c1d4b918eb8738_aa83c5e27a" tabindex="-1" value=""></div>'
                        //                   + '        <div class="clear"><input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button"></div>'
                        //                   + '        </div>'
                        //                   + '    </form>'
                        //                   + '</div>'
                        //               + '</div>'
                        //           + '</ot-modal>',
                        size: 'md',
                        scope: scope
                    })
                        .result.then(
                            function () {}, 
                            function (res) {}   // this is required with the new version of Angular, or every modal.close() triggers an error in the console
                        )
                };

                scope.test = function () {
                    // mailchimp.username = 'opentargets'
                    // mailchimp.dc = 'us17'
                    // mailchimp.u = 'd11d0467053c1d4b918eb8738'
                    // mailchimp.id = 'aa83c5e27a'

                }
            }

        };
    }]);
