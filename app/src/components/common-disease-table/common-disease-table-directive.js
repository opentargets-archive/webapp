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

                // Custom sort functions
                // these are needed for certain fields like pval and prioritisation score
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
                            // var db = item.sourceID;

                            // col 0: data origin: public / private
                            row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // 1: disease name
                            row.push('<a href="/disease/' + item.disease.id + '">' + item.disease.efo_info.label + '</a>');

                            // 2: reported trait
                            row.push(
                                item.sourceID === otConsts.datasources.OT_GENETICS.id ? (
                                    '<a class=\'ot-external-link\' href=\'' + item.evidence.variant2disease.study_link + '\' target=\'_blank\'>' + item.disease.reported_trait + '</a>'
                                ) : (
                                    otDictionary.NA
                                )
                            );

                            // 3: publications
                            // since there is only 1 or no publications, here we show it as "author(year)"
                            // which is consistent with the genetics portal
                            var refs = [];
                            if (checkPath(item, 'evidence.variant2disease.provenance_type.literature.references')) {
                                refs = item.evidence.variant2disease.provenance_type.literature.references;
                            }
                            var pmidsList = otUtils.getPmidsList(refs);
                            var pubInfo = otDictionary.NA;
                            if (refs.length && refs[0].author) {
                                pubInfo = '<a class=\'ot-external-link\' href=\'' + refs[0].lit_id + '\' target=\'_blank\'>' + refs[0].author + ' (' + refs[0].year + ')</a>';
                            } else if (refs.length) {
                                pubInfo = otUtils.getPublicationsString(pmidsList);
                            }
                            row.push(pubInfo);

                            // 4: Publication ids (hidden)
                            row.push(pmidsList.join(', '));

                            // 5: Variant
                            var variants = '';
                            var variantId = '';
                            if (item.sourceID === otConsts.datasources.OT_GENETICS.id) {
                                variantId = (item.variant.rs_id || item.variant.id);
                                variants = '<a class=\'ot-external-link\' href=\'' + item.variant.source_link + '\' target=\'_blank\'>' + variantId + '</a>';
                            } else {
                                variantId = item.variant.id.split('/').pop();
                                variants = '<a class=\'ot-external-link\' href=\'http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=' + variantId + '\' target=\'_blank\'>' + variantId + '</a>';
                            }
                            row.push(variants);

                            // 6: variant type
                            var t = otClearUnderscoresFilter(otUtils.getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop()));
                            row.push(t);

                            // 7: p-value
                            // Note that occasionally the pvalue might be stored as a String (in the response JSON) which triggers an error
                            // so we cast it to a number to be safe
                            row.push(
                                (item.evidence.variant2disease.resource_score.mantissa && item.evidence.variant2disease.resource_score.exponent) ?
                                    item.evidence.variant2disease.resource_score.mantissa + 'e' + item.evidence.variant2disease.resource_score.exponent
                                    :
                                    '' + item.evidence.variant2disease.resource_score.value
                            );

                            // 8: Gene prioritisation
                            row.push(item.sourceID === otConsts.datasources.OT_GENETICS.id ? item.evidence.gene2variant.resource_score.value : -1);

                            // 9: evidence source
                            if (item.sourceID === otConsts.datasources.PHEWAS_23andme.id) {
                                row.push('<a class=\'ot-external-link\' href=\'https://test-rvizapps.biogen.com/23andmeDev/\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            } else if (item.sourceID === otConsts.datasources.PHEWAS.id) {
                                row.push('<a class=\'ot-external-link\' href=\'https://phewascatalog.org/phewas\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            } else if (item.sourceID === otConsts.datasources.OT_GENETICS.id) {
                                row.push('<a class=\'ot-external-link\' href=\'https://genetics.opentargets.org/study-locus/' 
                                    + item.evidence.variant2disease.study_link.split('/').pop() + '/'
                                    + item.variant.id + '\' target=\'_blank\'>'
                                    + otConsts.datasources.OT_GENETICS.label
                                    + '</a>');
                            } else {
                                row.push('<a class=\'ot-external-link\' href=\'https://www.ebi.ac.uk/gwas/search?query=' + item.variant.id.split('/').pop() + '\' target=\'_blank\'>'
                                    + otClearUnderscoresFilter(item.sourceID)
                                    + '</a>');
                            }

                            // 10-14: hidden columns for filtering and custom sorting
                            row.push(variantId); // variant
                            row.push(otClearUnderscoresFilter(item.sourceID)); // evidence source
                            row.push(item.disease.efo_info.label);
                            row.push(item.sourceID === otConsts.datasources.OT_GENETICS.id ? item.evidence.gene2variant.resource_score.value : -1); // gene prioritisation score
                            row.push(item.sourceID === otConsts.datasources.OT_GENETICS.id ? item.disease.reported_trait : otDictionary.NA);    // reported trait

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            scope.ext.hasError = true;
                            $log.error('Error parsing common disease data:');
                            $log.error(e);
                        }
                    });
                    return newdata;
                }

                var dropdownColumns = [1, 2, 5, 6, 9];

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.ext.data),
                        'ordering': true,
                        'order': [[8, 'desc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'sType': 'pval-more',
                                'targets': 7
                            },
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [4, 6],
                                'visible': false
                            },
                            {
                                'targets': [1, 2],
                                'width': '16%'
                            },
                            {
                                'targets': [3, 5, 6],
                                'width': '12%'
                            },
                            {
                                'targets': [7, 8],
                                'width': '12%'
                            },
                            {
                                'targets': [1],
                                'mRender': otColumnFilter.mRenderGenerator(12),
                                'mData': otColumnFilter.mDataGenerator(1, 12)
                            },
                            {
                                'targets': [5],
                                'mRender': otColumnFilter.mRenderGenerator(10),
                                'mData': otColumnFilter.mDataGenerator(5, 10)
                            },
                            {
                                'targets': [9],
                                'mRender': otColumnFilter.mRenderGenerator(11),
                                'mData': otColumnFilter.mDataGenerator(9, 11)
                            },
                            {
                                'targets': [8],
                                'mData': function (item, type) {
                                    if (type === 'sort') {
                                        return item[13];
                                    } else {
                                        return item[8] === -1 ? otDictionary.NA : item[8];
                                    }
                                }
                            },
                            {
                                'targets': [2],
                                'mRender': otColumnFilter.mRenderGenerator(14),
                                'mData': otColumnFilter.mDataGenerator(2, 14)
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, (scope.output ? scope.output + '-' : '') + '-common_diseases'));
                }
            }
        };
    }]);
