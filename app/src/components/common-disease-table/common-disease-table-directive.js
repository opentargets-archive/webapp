/* Evidence tables Directives */

angular.module('otDirectives')

    .directive('otCommonDiseaseTable', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', '$log', 'otClearUnderscoresFilter', 'otDictionary', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, $log, otClearUnderscoresFilter, otDictionary) {
        'use strict';
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/common-disease-table/common-disease-table.html',

            scope: {
                output: '@?',    // optional output for filename export
                ext: '=?'       // optional external object to pass things out of the directive; TODO: this should remove teh need for all parameters above
            },

            link: function (scope, elem, attrs) {
                scope.otDictionary = otDictionary;
                scope.ext.hasError = false;
                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    if (attrs.target && attrs.disease) {
                        getData();
                    }
                });

                // Q: DO WE NEED THIS??? A: Yes, this makes the sorting by p-value work correctly (although could perhaps be implemented in cols definition)
                jQuery.fn.dataTableExt.oSort['pval-more-asc'] = function (x, y) {
                    var a = x.split('<')[0];
                    var b = y.split('<')[0];
                    return a - b;
                };
                jQuery.fn.dataTableExt.oSort['pval-more-desc'] = function (x, y) {
                    var a = x.split('<')[0];
                    var b = y.split('<')[0];
                    return b - a;
                };

                function getData () {
                    scope.ext.isLoading = true;
                    var opts = {
                        size: 1000,
                        datasource: otConfig.evidence_sources.genetic_association.common,
                        fields: [
                            'unique_association_fields',
                            'disease',
                            'evidence',
                            'variant',
                            'target',
                            'sourceID',
                            'access_level'
                        ]
                    };

                    if (attrs.target) {
                        opts.target = attrs.target;
                    }
                    if (attrs.disease) {
                        opts.disease = attrs.disease;
                    }
                    _.extend(opts, searchObj);

                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };

                    return otApi.getFilterBy(queryObject)
                        .then(
                            function (resp) {
                                if (resp.body.data) {
                                    scope.ext.data = resp.body.data;
                                    initTable();
                                } else {
                                    $log.warn('Empty response : common disease data');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.ext.isLoading = false;
                        });
                }


                /*
                 * Takes the data object returned by the API and formats it
                 * to an array of arrays to be displayed by the dataTable widget.
                 */
                function formatDataToArray (data) {
                    var newdata = [];
                    data.forEach(function (item) {
                        // create rows:
                        var row = [];

                        try {
                            var db = item.sourceID;

                            // col 0: data origin: public / private
                            row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // 1: disease name
                            row.push(item.disease.efo_info.label);

                            // 2: Variant
                            var mut = '<a class=\'ot-external-link\' href=\'http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=' + item.variant.id.split('/').pop() + '\' target=\'_blank\'>' + item.variant.id.split('/').pop() + '</a>';
                            row.push(mut);

                            // 3: variant type
                            var t = otClearUnderscoresFilter(otUtils.getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop()));
                            row.push(t);

                            // 4: evidence source
                            if (item.sourceID === otConsts.datasources.PHEWAS_23andme.id) {
                                row.push('<a class=\'ot-external-link\' href=\'https://test-rvizapps.biogen.com/23andmeDev/\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            } else if (item.sourceID === otConsts.datasources.PHEWAS.id) {
                                row.push('<a class=\'ot-external-link\' href=\'https://phewascatalog.org/phewas\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            } else {
                                row.push('<a class=\'ot-external-link\' href=\'https://www.ebi.ac.uk/gwas/search?query=' + item.variant.id.split('/').pop() + '\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            }

                            // 5: p-value
                            var msg = item.evidence.variant2disease.resource_score.value.toPrecision(1);
                            // if (item.sourceID === otConsts.datasources.PHEWAS.id) {
                            //     msg += '<div style="margin-top:5px;">Cases: ' + item.unique_association_fields.cases + '<br />Odds ratio: ' + parseFloat(item.unique_association_fields.odds_ratio).toPrecision(2) + '</div>';
                            // } else if (item.sourceID === otConsts.datasources.PHEWAS_23andme.id) {
                            //     msg += '<br/>Cases: ' + item.unique_association_fields.cases + '<br />Odds ratio: ' + parseFloat(item.unique_association_fields.odds_ratio).toPrecision(2) + '<br />Phenotype: ' + item.unique_association_fields.phenotype;
                            // }
                            row.push(msg);

                            // 6: odds ratio (gwas / phewas)
                            var odds = item.unique_association_fields.odd_ratio || item.unique_association_fields.odds_ratio || ''; // otDictionary.NA;
                            if ((item.unique_association_fields.odd_ratio || item.unique_association_fields.odds_ratio) && item.unique_association_fields.confidence_interval) {
                                odds += '<br />';
                                odds += '(' + item.unique_association_fields.confidence_interval + ')';
                            }
                            row.push(odds);

                            // 7: publications
                            var refs = [];
                            if (checkPath(item, 'evidence.variant2disease.provenance_type.literature.references')) {
                                refs = item.evidence.variant2disease.provenance_type.literature.references;
                            }

                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(pmidsList.length ? otUtils.getPublicationsString(pmidsList) : 'N/A');
                            // row.push(refs.length ? otUtils.getPublicationsField(refs) : 'N/A');

                            // 8: Publication ids (hidden)
                            row.push(pmidsList.join(', '));

                            // 9, 10: hidden columns for filtering
                            row.push(item.variant.id.split('/').pop()); // variant
                            row.push(otClearUnderscoresFilter(item.sourceID)); // evidence source

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            scope.ext.hasError = true;
                            $log.error('Error parsing common disease data:');
                            $log.error(e);
                        }
                    });
                    return newdata;
                }

                var dropdownColumns = [1, 2, 3, 4];

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.ext.data),
                        'ordering': true,
                        'order': [[1, 'asc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'sType': 'pval-more',
                                'targets': 5
                            },
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [8],
                                'visible': false
                            },
                            {
                                'targets': [1, 3, 7],
                                'width': '15%'
                            },
                            {
                                'targets': [2, 4, 5, 6],
                                'width': '12%'
                            },
                            {
                                'targets': [2],
                                'mRender': otColumnFilter.mRenderGenerator(9),
                                'mData': otColumnFilter.mDataGenerator(2, 9)
                            },
                            {
                                'targets': [4],
                                'mRender': otColumnFilter.mRenderGenerator(10),
                                'mData': otColumnFilter.mDataGenerator(4, 10)
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, (scope.output ? scope.output + '-' : '') + '-common_diseases'));
                }
            }
        };
    }]);
