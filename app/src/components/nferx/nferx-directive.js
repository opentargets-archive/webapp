
angular.module('otDirectives')
    .directive('otNferx', [
        'otApi',
        'otConsts',
        function (otApi,
                  otConsts) {
            'use strict';



            return {
                restrict: 'AE',
                templateUrl: 'src/components/nferx/nferx.html',

                scope: {
                    ext: '=?'
                },
                link: function (scope, elem, attrs) {
                    scope.ext.hasError = false;
                    scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                        if (attrs.target && attrs.disease) {
                            processNferxData( );
                        }
                    });



                    function processNferxData () {
                        scope.ext.isLoading = true;
                        var queryObject = {
                            method: 'GET',
                            trackCall: false,
                            params: {
                                target: attrs.target,
                                disease: attrs.disease,
                                datasource: otConsts.dbs.NFERX,
                                size: 10,
                                //TODO currectly direct arg is not supported by evidence api
                                direct: true
                            }
                        };

                        return otApi.getFilterBy(queryObject)
                            .then(function (resp) {
                                if (resp.body.data) {
                                    scope.ext.data = resp.body.data;
                                    parseServerResponse(resp.body.data);
                                }
                            });
                    }

                    function parseServerResponse( data) {
                        scope.nferx_records = false;
                        for (var i = 0; i < data.length; i++) {
                            var d = data[i];
                            //TODO - this check won't be needed once the api supports direct=True
                            if(d.disease.id == attrs.disease){
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

                }
            }
        }])
;