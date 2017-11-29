angular.module('otControllers')

    .controller('SignupFormController', ['$scope', '$element', '$http', function ($scope, $element, $http) {
        'use strict';

        $scope.mySubmit = function () {
            $element.find('form')[0].submit();
        };

        $scope.ajaxSubmit = function () {
            var form = $element.find('form')[0];
            // https://formspree.io/lucaf@ebi.ac.uk

            // console.log(form);
            var userdata = {};
            var inputs = form.getElementsByClassName('form-control');
            for (var i = 0; i < inputs.length; i++) {
                userdata[inputs[i].name] = inputs[i].value;
            }
            // userdata.u='d11d0467053c1d4b918eb8738';
            // userdata.id='aa83c5e27a';
            // console.log(userdata);

            $http({
                method: 'POST',
                url: 'https://formspree.io/lucaf@ebi.ac.uk',
                // url: 'https://opentargets.us17.list-manage.com/subscribe/post?u=d11d0467053c1d4b918eb8738&amp;id=aa83c5e27a',
                // url: 'https://opentargets.us17.list-manage.com/subscribe/post-json',
                data: userdata,
                params: userdata
            })
                .then(
                    function (resp) {
                        console.log('response', resp);
                    },
                    function (resp) {
                        console.warn(resp);
                    }
                );
        };
    }]);
