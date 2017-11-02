/**
 * Somatic mutations table
 * 
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the somatic mutation data table */
    .directive('otSomaticMutationTable', ['otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', 'otClearUnderscoresFilter', '$log', function (otApi, otConsts, otUtils, otConfig, $location, otDictionary, otClearUnderscoresFilter, $log) {
        'use strict';
        // var datasources = otConsts.datasources;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/somatic-mutation-table/somatic-mutation-table.html',

            scope: {
                title: '@?',    // optional title for filename export
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


                function getMutationData () {
                    scope.ext.isLoading = true;
                    filename = (scope.title || (attrs.target + '-' + attrs.disease)).replace(/ /g, '_') + '-somatic_mutations';
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
                                    initTableMutations();
                                } else {
                                    $log.warn('Empty response : somatic mutations');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            // $scope.search.tables.somatic_mutations.is_open = $scope.search.tables.somatic_mutations.data.length>0 || false;
                            scope.ext.isLoading = false;
                        });
                }


                function formatMutationsDataToArray (data) {
                    var newdata = [];
                    data.forEach(function (item) {
                        var row = [];
                        try {
                            // col 0: data origin: public / private
                            row.push((item.access_level !== otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // col 1: disease
                            row.push(item.disease.efo_info.label);

                            var mutation_types = '';
                            var samples = '';
                            var pattern = '';

                            if (item.evidence.known_mutations && item.evidence.known_mutations.length) {
                                for (var i = 0; i < item.evidence.known_mutations.length; i++) {
                                    var m = item.evidence.known_mutations[i];
                                    if (item.sourceID === otConsts.datasources.INTOGEN.id) {
                                        mutation_types += '<div>' + otClearUnderscoresFilter(item.target.activity || otDictionary.NA);
                                    } else if (item.sourceID === otConsts.dbs.UNIPROT_SOMATIC) {
                                        mutation_types += '<div>missense variant</div>';
                                    } else {
                                        mutation_types += '<div>' + otClearUnderscoresFilter(m.preferred_name || otDictionary.NA) + '</div>';
                                    }
                                    if (m.number_samples_with_mutation_type) {
                                        samples += '<div>' + m.number_samples_with_mutation_type + '/' + m.number_mutated_samples || otDictionary.NA + '</div>';
                                    } else {
                                        samples = otDictionary.NA;
                                    }
                                    pattern += '<div>' + (m.inheritance_pattern || otDictionary.NA) +  '</div>';
                                }
                            }

                            // col2: mutation type
                            row.push(mutation_types);

                            // col3: samples
                            row.push(samples);

                            // col4: inheritance pattern
                            row.push(pattern);

                            // col 5: evidence source
                            row.push('<a href=\'' + item.evidence.urls[0].url + '\' target=\'_blank\' class=\'ot-external-link\'>' + item.evidence.urls[0].nice_name + '</a>');

                            // cols 6: publications
                            var refs = [];
                            if (checkPath(item, 'evidence.provenance_type.literature.references')) {
                                refs = item.evidence.provenance_type.literature.references;
                            }
                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(pmidsList.length ? otUtils.getPublicationsString(pmidsList) : 'N/A');

                            // col 7: pub ids (hidden)
                            row.push(pmidsList.join(', '));

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            $log.log('Error parsing somatic mutation data:');
                            $log.log(e);
                        }
                    });

                    return newdata;
                }


                function initTableMutations () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatMutationsDataToArray(scope.ext.data),
                        // "ordering" : true,
                        'order': [[1, 'asc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [7],
                                'visible': false
                            },
                            // now set the widths
                            {
                                'targets': [1, 2, 4, 5],
                                'width': '18%'
                            },
                            {
                                'targets': [3],
                                'width': '9%'
                            }
                        ]
                    }, filename));
                }
            }
        };
    }]);
