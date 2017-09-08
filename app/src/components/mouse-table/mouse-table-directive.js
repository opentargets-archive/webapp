/* Evidence tables Directives */

angular.module('otDirectives')

    /*
     * Probability:
     * evidence.association_scrore.probability.value
     * 
     * Mouse phenotypes:
     * show the values for each key (e.g. circling, imapired balance, deafness, etc)
     * evidence.properties.evidence_chain[1].biological object.properties.experiment_specific
     * 
     * Human phenotypes:
     * same as for moouse phenotypes
     * biological object.properties.experiment specific
     */

    .directive('otMouseTable', ['otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', '$log', function (otApi, otConsts, otUtils, otConfig, $location, otDictionary, $log) {
        'use strict';

        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/mouse-table/mouse-table.html',

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
                        datasource: otConfig.evidence_sources.animal_model,
                        fields: [
                            'disease',
                            'evidence',
                            'scores',
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
                                    $log.warn('Empty response : mouse data');
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
                            row.push(item.disease.efo_info.label);    // or item.disease.efo_info.label ???

                            // human
                            row.push('<ul>' + item.evidence.disease_model_association.human_phenotypes.map(function (hp) { return '<li>' + hp.label + '</li>'; }).join('') + '</ul>');

                            // mouse
                            row.push('<ul>' + item.evidence.disease_model_association.model_phenotypes.map(function (hp) { return '<li>' + hp.label + '</li>'; }).join('') + '</ul>');

                            // mouse model
                            var mousemodel = processMouseModelLinks(item.evidence.biological_model.allelic_composition, item.evidence.biological_model.allele_ids)
                                                + '<br/ >'
                                                + '<span class=\'small text-lowlight\'>' + item.evidence.biological_model.genetic_background + '</span>';
                            row.push(mousemodel);


                            // evidence source
                            row.push(otDictionary.PHENODIGM);

                            // score -- hidden column now
                            row.push((item.scores.association_score).toFixed(2));


                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            scope.errorFlag = true;
                            $log.error('Error parsing mouse data:');
                            $log.error(e);
                        }
                    });
                    return newdata;
                }


                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.data),
                        'autoWidth': false,
                        'paging': true,
                        'ordering': true,
                        'order': [[6, 'des']],
                        'columnDefs': [
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [6],    // score
                                'visible': false
                            },
                            {
                                'targets': [2, 3, 4],
                                'width': '20%'
                            },
                            {
                                'targets': [5],
                                'width': '10%'
                            }
                        ]
                    }, (scope.title ? scope.title + '-' : '') + '-mouse_models'));
                }


                /*
                 * Takes a string like "Casr<Nuf>/Casr<+>" and returns "Casr<sup>Nuf</sup>/Casr<sup>+</sup>"
                 */
                function processMouseModelData (mmd) {
                    return mmd.replace(/<(.*?)>/g, function (match) { return '<sup>' + match.substr(1, match.length - 2) + '</sup>'; });
                }


                /*
                 * Takes a string like "Casr<Nuf>/Casr<+>" and a string of ids like "MGI:3054788|MGI:3054788"
                 * returns the original string with <a href> tags around each part "Casr<Nuf>" and "Casr<+>"
                 */
                function processMouseModelLinks (mmd, id) {
                    var mmds = mmd.split('/');
                    var ids = id.split('|');
                    for (var i = 0; i < mmds.length; i++) {
                        if (ids[i]) {
                            mmds[i] = '<a href=\'http://informatics.jax.org/accession/' + ids[i] + '\' target=\'_blank\'>' + processMouseModelData(mmds[i]) + '</a>';
                        }
                    }
                    return mmds.join('/');
                }
            }
        };
    }]);
