/**
 * Somatic mutations table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the somatic mutation data table */
    .directive('otSomaticMutationTable', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', 'otClearUnderscoresFilter', '$log', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, otDictionary, otClearUnderscoresFilter, $log) {
        'use strict';
        // var datasources = otConsts.datasources;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;
        var multilineRenderJoinTag = '<span style="display:none">, </span><br />';

        return {
            restrict: 'AE',

            templateUrl: 'src/components/somatic-mutation-table/somatic-mutation-table.html',

            scope: {
                output: '@?',    // optional output for filename export
                ext: '=?'       // optional external object to pass things out of the directive; TODO: this should remove teh need for all parameters above
            },

            link: function (scope, elem, attrs) {
                scope.ext.hasError = false;

                var filename = '';

                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    if (attrs.target && attrs.disease) {
                        getMutationData();
                    }
                });


                // Custom sort functions
                // required to sort samples numbers while handling N/A values correctly
                var na2Num = function (n) {
                    return (n === otDictionary.NA ? -1 : n);
                }
                jQuery.fn.dataTableExt.oSort['samples-asc'] = function (a, b) {
                    a = na2Num(a);
                    b = na2Num(b);
                    return a - b;
                };
                jQuery.fn.dataTableExt.oSort['samples-desc'] = function (a, b) {
                    a = na2Num(a);
                    b = na2Num(b);
                    return b - a;
                };

                function getMutationData () {
                    scope.ext.isLoading = true;
                    var opts = {
                        size: 1000,
                        datasource: otConfig.evidence_sources.somatic_mutation,
                        fields: [
                            'disease.efo_info', // disease
                            'evidence.evidence_codes_info',  // evidence source
                            'evidence.urls',
                            'evidence.known_mutations',
                            'evidence.provenance_type',
                            'evidence.known_mutations',
                            'access_level',
                            'unique_association_fields.mutation_type',
                            'target.activity',
                            'sourceID'
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
                                    filename = (scope.output || (attrs.target + '-' + attrs.disease)).replace(/ /g, '_') + '-somatic_mutations';
                                    initTableMutations();
                                } else {
                                    $log.warn('Empty response : somatic mutations');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.ext.isLoading = false;
                        });
                }


                function formatMutationsDataToArray (data) {
                    var newdata = [];
                    data.forEach(function (item) {
                        var row = [];
                        try {
                            // col 0: data origin: public / private
                            row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // col 1: disease
                            row.push(item.disease.efo_info.label);

                            // 2 - 4: work out type, samples and pattern
                            var mutation_types = [];
                            var samples = [];
                            var pattern = [];

                            if (item.evidence.known_mutations && item.evidence.known_mutations.length) {
                                for (var i = 0; i < item.evidence.known_mutations.length; i++) {
                                    // (2) mutation type
                                    var m = item.evidence.known_mutations[i];
                                    if (item.sourceID === otConsts.datasources.INTOGEN.id) {
                                        mutation_types.push(otClearUnderscoresFilter(item.target.activity || otDictionary.NA));
                                    } else if (item.sourceID === otConsts.datasources.UNIPROT_SOMATIC.id) {
                                        mutation_types.push('missense variant');
                                    } else {
                                        mutation_types.push(otClearUnderscoresFilter(m.preferred_name || otDictionary.NA).trim());
                                    }

                                    // (3) samples
                                    if (m.number_samples_with_mutation_type) {
                                        samples.push(m.number_samples_with_mutation_type + ' / ' + (m.number_samples_tested || otDictionary.NA));
                                    } else if (m.number_mutated_samples) {
                                        samples.push(m.number_mutated_samples + ' / ' + (m.number_samples_tested || otDictionary.NA));
                                    } else {
                                        samples.push(otDictionary.NA);
                                    }

                                    // (4) pattern
                                    pattern.push(m.inheritance_pattern || otDictionary.NA);
                                }
                            }

                            // col2: mutation type
                            row.push(mutation_types);

                            // col3: samples
                            row.push(samples);

                            // col4: samples tested (for sorting only)
                            row.push(
                                (item.evidence.known_mutations && item.evidence.known_mutations.length) ? 
                                    item.evidence.known_mutations[0].number_samples_tested || otDictionary.NA
                                    :
                                    otDictionary.NA
                            );

                            // col 5: inheritance pattern
                            row.push(pattern);

                            // col 6: evidence source
                            var idString = '';
                            if (item.sourceID === otConsts.datasources.EVA_SOMATIC.id) {
                                idString = '<p class="text-lowlight"><small>(ID: ' + item.evidence.urls[0].url.split('/').pop() + ')</small></p>';
                            }
                            row.push('<a href=\'' + item.evidence.urls[0].url + '\' target=\'_blank\' class=\'ot-external-link\'>' + item.evidence.urls[0].nice_name + '</a>' + idString);

                            // cols 7: publications
                            var refs = [];
                            if (checkPath(item, 'evidence.provenance_type.literature.references')) {
                                refs = item.evidence.provenance_type.literature.references;
                            }
                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(pmidsList.length ? otUtils.getPublicationsString(pmidsList) : 'N/A');

                            // col 8: pub ids (hidden)
                            row.push(pmidsList.join(', '));

                            // col 9: columns for filtering only (hidden)
                            row.push(item.evidence.urls[0].nice_name); // evidence source

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            $log.log('Error parsing somatic mutation data:');
                            $log.log(e);
                        }
                    });

                    return newdata;
                }

                var dropdownColumns = [1, 6];

                function initTableMutations () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatMutationsDataToArray(scope.ext.data),
                        // 'ordering': true,
                        'order': [[3, 'desc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            // set visibilities
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [4, 8],
                                'visible': false,
                                'searchable': false
                            },
                            // set the widths
                            {
                                'targets': [1, 2],
                                'width': '20%'
                            },
                            {
                                'targets': [5, 6],
                                'width': '17%'
                            },
                            {
                                'targets': [3],
                                'width': '12%'
                            },
                            // set sorting and filters
                            {
                                'targets': [3],
                                'orderData': [4]
                            },
                            {
                                'targets': [4],
                                'sType': 'samples'
                            },
                            {
                                'targets': [2, 3, 5],
                                'render': function (data) {
                                    return data.join(multilineRenderJoinTag);
                                }
                            },
                            {
                                'targets': [6],
                                'mRender': otColumnFilter.mRenderGenerator(9),
                                'mData': otColumnFilter.mDataGenerator(6, 9)
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, filename));
                }
            }
        };
    }]);
