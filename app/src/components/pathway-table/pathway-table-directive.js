/* Evidence tables Directives */

angular.module('otDirectives')

    /*
     * Directive to display the pathwyas data table 
     * pathway 1   Target context  .biological_subject.properties.target_type
     * pathway 2   Protein complex members .biological_subject.about
     * pathway 3   Activity    .biological_subject.properties.activity
     * pathway 4   Additional context  .evidence.properties.experiment_specific.additional_properties
     * pathway 5   Provenance - SourceDB   .evidence.urls.linkouts
     * pathway 6   Provenance - References .evidence.provenance_type.literature.pubmed_refs
     * pathway 7   Date asserted   .evidence.date_asserted
     * pathway 8   Evidence codes  .evidence.evidence_codes
     */
    .directive('otPathwayTable', ['otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', '$log', 'otClearUnderscoresFilter', function (otApi, otConsts, otUtils, otConfig, $location, otDictionary, $log, otClearUnderscoresFilter) {
        'use strict';
        // var dbs = otConsts.dbs;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/pathway-table/pathway-table.html',

            scope: {
                loadFlag: '=?',    // optional load-flag: true when loading, false otherwise. links to a var to trigger spinners etc...
                data: '=?',        // optional data link to pass the data out of the directive
                title: '=?',       // optional title for filename export
                errorFlag: '=?'    // optional error-flag: pass a var to hold parsing-related errors
            },

            link: function (scope, elem, attrs) {
                scope.errorFlag = false;
                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    if (attrs.target && attrs.disease) {
                        getData();
                    }
                });

                function getData () {
                    scope.loadFlag = true;
                    var opts = {
                        size: 1000,
                        datasource: otConfig.evidence_sources.pathway,
                        fields: [
                            'target',
                            'disease',
                            'evidence',
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
                                    scope.data = resp.body.data;
                                    initTable();
                                } else {
                                    $log.warn('Empty response : pathway expression');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.loadFlag = false;
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
                            // col 0: data origin: public / private
                            row.push((item.access_level !== otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // disease
                            row.push(item.disease.efo_info.label);

                            // overview
                            row.push('<a class=\'ot-external-link\' href=\'' + item.evidence.urls[0].url + '\' target=\'_blank\'>' + item.evidence.urls[0].nice_name + '</a>');

                            // activity
                            row.push(otDictionary[item.target.activity.toUpperCase()] || otClearUnderscoresFilter(item.target.activity)); // "up_or_down"->"unclassified" via dictionary

                            // mutations
                            var mut = otDictionary.NA;
                            if (item.evidence.known_mutations && item.evidence.known_mutations.length > 0) {
                                mut = otUtils.arrayToList(item.evidence.known_mutations.map(function (i) { return i.preferred_name || otDictionary.NA; }), true);
                            }
                            row.push(mut);

                            // evidence codes
                            row.push('Curated in ' + item.evidence.provenance_type.database.id);

                            // publications
                            var refs = [];
                            if (checkPath(item, 'evidence.provenance_type.literature.references')) {
                                refs = item.evidence.provenance_type.literature.references;
                            }
                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(otUtils.getPublicationsString(pmidsList));

                            // Publication ids (hidden)
                            row.push(pmidsList.join(', '));

                            newdata.push(row); // use push() so we don't end up with empty rows
                        } catch (e) {
                            scope.errorFlag = true;
                            $log.error('Error parsing pathways data:');
                            $log.error(e);
                        }
                    });
                    return newdata;
                }


                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.data),
                        'ordering': true,
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
                            {
                                'targets': [3, 4, 5, 6],
                                'width': '14%'
                            },
                            {
                                'targets': [1],
                                'width': '18%'
                            }
                        ]
                    }, (scope.title ? scope.title + '-' : '') + '-disrupted_pathways'));
                }
            }
        };
    }]);
