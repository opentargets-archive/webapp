angular.module('otControllers')

    .controller('SignupFormController', ['$scope', '$element', function ($scope, $element) {
        'use strict';

        $scope.mySubmit = function () {
            $element.find('form')[0].submit();
        };
    }]);
