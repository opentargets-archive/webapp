angular.module('otDirectives')
    .directive('otTargetGenomeBrowser', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                var efo = attrs.efo;
                var w = (attrs.width || elem[0].parentNode.offsetWidth) - 40;
                scope.$watch(function () { return attrs.target; }, function (target) {
                    if (target === '') {
                        return;
                    }
                    var newDiv = document.createElement('div');
                    newDiv.id = 'otTargetGenomeBrowser';
                    elem[0].appendChild(newDiv);

                    var gB = tnt.board.genome()
                        .species('human')
                        .gene(attrs.target)
                        .context(20)
                        .width(w);

                    gB.rest().prefix('/proxy/rest.ensembl.org').protocol('').domain('');
                    var theme = targetGenomeBrowser()
                        .efo(efo)
                        .cttvRestApi(otApi.getSelf());
                    theme(gB, document.getElementById('otTargetGenomeBrowser'));
                });
            }
        };
    }]);
