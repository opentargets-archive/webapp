angular.module('otDirectives')
    .directive('nferxTable', [
        'otApi',
        'otConsts',
        function (otApi,
                  otConsts) {
            'use strict';

            function parseServerResponse(scope, data,disease_id) {
                scope.nferx_records = false;
                for (var i = 0; i < data.length; i++) {
                    var d = data[i];
                    //TODO - this check won't be needed once the api supports direct=True
                    if(d.disease.id == disease_id){
                        scope.nferx_document_count = d.unique_association_fields.document_count;
                        scope.nferx_records = true;
                        scope.target_label = d.target.gene_info.symbol;
                        scope.disease_label = d.disease.efo_info.label;
                        scope.link_url = d.unique_association_fields.link_url;
                        scope.cosine_dist = d.evidence.resource_score.value;
                        scope.cosine_dist_perc = d.evidence.resource_score.value * 100;

                    }
                }

            }

            var processNferxData = function ( scope, target, disease) {
                var queryObject = {
                    method: 'GET',
                    trackCall: false,
                    params: {
                        target: target,
                        disease: disease,
                        datasource: otConsts.dbs.NFERX,
                        size: 10,
                        //TODO currectly direct arg is not supported by evidence api
                        direct: true
                    }
                };

                return otApi.getFilterBy(queryObject)
                    .then(function (resp) {
                     parseServerResponse(scope, resp.body.data,disease);
                });
            }

            return {
                restrict: 'EA',
                templateUrl: 'src/components/nferx-table/nferx-table.html',

                scope: {

                    target: '=',
                    disease: '='
                },
                link: function (scope, elem, attrs) {

                    scope.$watchGroup(['total','target', 'disease','filename'], function (vals) {
                        if (!scope.target || !scope.disease ) {
                            return;
                        }

                        processNferxData( scope, scope.target, scope.disease);

                    });


                }
            }
        }])
;
