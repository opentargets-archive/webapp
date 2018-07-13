angular.module('otPlugins')
    .directive('otTargetFeatures', ['$timeout', 'otConsts', function ($timeout, otConsts) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/target-features/target-features.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                scope.uniprot = {
                    id: scope.target.uniprot_id,
                    subunits: scope.target.uniprot_subunit,
                    locations: scope.target.uniprot_subcellular_location,
                    accessions: scope.target.uniprot_accessions,
                    keywords: scope.target.uniprot_keywords
                };

                $timeout(function () {
                    var ProtVista = require('ProtVista');
                    new ProtVista({
                        proxy: otConsts.PROXY,
                        el: '#upfv',
                        uniprotacc: scope.target.uniprot_accessions[0],
                        exclusions: ['seqInfo']
                    });
                }, 0);
            }
        };
    }]);
