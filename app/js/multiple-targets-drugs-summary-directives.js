angular.module('cttvDirectives')

.directive ('multipleTargetsDrugsSummary', ['$log', 'cttvAPIservice', 'cttvConfig', function ($log, cttvAPIservice, cttvConfig) {
    'use strict';

    return {
        restrict: 'E',
        template: '' +
        '<div ng-show="drugs">' +
        '    <h3>Drugs for {{targets.length}} targets</h3>' +
        '    <drug-summary ng-repeat="target in drugs" target="target"></drug>' +
        '</div>',
        scope: {
            targets: '='
        },
        link: function (scope, el, attrs) {
            scope.$watch('targets', function () {
                if (!scope.targets) {
                    return;
                }

                var queryObject = {
                    method: 'POST',
                    trackCall: false,
                    params: {
                        target: scope.targets.map(function (d) {return d.ensembl_gene_id;}),
                        size: 1000,
                        datasource: cttvConfig.evidence_sources.known_drug,
                        fields: [
                            "disease.efo_info",
                            "drug",
                            "evidence",
                            "target",
                            "access_level"
                        ]
                    }
                };
                cttvAPIservice.getFilterBy(queryObject)
                    .then (function (resp) {
                        var drugs = {};
                        for (var i=0; i<resp.body.data.length; i++) {
                            var ev = resp.body.data[i];
                            var target = ev.target.gene_info.symbol;
                            var drug = ev.drug.molecule_name;
                            var id = ev.drug.id[0];
                            if (!drugs[target]) {
                                drugs[target] = {
                                    target: target,
                                    drugs: []
                                };
                            }
                            drugs[target].drugs[drug] = {
                                name: drug,
                                id: id
                            };
                        }
                        var drugsArr = _.values(drugs);
                        for (var j=0; j<drugsArr.length; j++) {
                            drugsArr[j].drugs = _.values(drugsArr[j].drugs);
                        }
                        scope.drugs = drugsArr;
                    });

            });
        }
    };
}])
.directive('drugSummary', ['$log', function ($log) {
    'use strict';

    return {
        restrict: 'E',
        template: '' +
        '<div ng-click="showDrugs=!showDrugs" style="cursor:pointer">' +
        '   {{target.target}} -- {{target.drugs.length}} drugs' +
        '</div>' +
        '<div ng-show=showDrugs>' +
        '     <span ng-repeat="drug in target.drugs">' +
        '        <a target=_blank href="{{drug.id}}">' +
        '           <i class="cttv-drug">{{drug.name}}</i>' +
        '        </a>' +
        '     </span>' +
        '</div>',
        scope: {
            target: '='
        }
    };
}]);
