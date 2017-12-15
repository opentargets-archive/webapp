/* Evidence tables Directives */

angular.module('otDirectives')

    .directive('otPostgapTable', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', '$log', 'otClearUnderscoresFilter', 'otDictionary', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, $log, otClearUnderscoresFilter, otDictionary) {
        'use strict';
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/postgap-table/postgap-table.html',

            scope: {
                title: '@?',    // optional title for filename export
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

                // DO WE NEED THIS???
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
                            row.push((item.access_level !== otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // disease name
                            row.push(item.disease.efo_info.label);

                            // Variant
                            var mut = '<a class=\'ot-external-link\' href=\'http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=' + item.variant.id.split('/').pop() + '\' target=\'_blank\'>' + item.variant.id.split('/').pop() + '</a>';
                            row.push(mut);

                            // variant type
                            var t = otClearUnderscoresFilter(otUtils.getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop()));
                            row.push(t);

                            // evidence source
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

                            // p-value
                            var msg = item.evidence.variant2disease.resource_score.value.toPrecision(1);

                            if (item.sourceID === otConsts.datasources.PHEWAS.id) {
                                msg += '<div style="margin-top:5px;">Cases: ' + item.unique_association_fields.cases + '<br />Odds ratio: ' + parseFloat(item.unique_association_fields.odds_ratio).toPrecision(2) + '</div>';
                            } else if (item.sourceID === otConsts.datasources.PHEWAS_23andme.id) {
                                msg += '<br/>Cases: ' + item.unique_association_fields.cases + '<br />Odds ratio: ' + parseFloat(item.unique_association_fields.odds_ratio).toPrecision(2) + '<br />Phenotype: ' + item.unique_association_fields.phenotype;
                            }
                            row.push(msg);

                            // POSTGAP STUFF
                            // GWAS Variant (in LD)
                            row.push(item.evidence.variant2disease.lead_snp_rsid);
                            // r2
                            row.push(parseFloat(item.unique_association_fields.r2).toPrecision(3));
                            // POSTGAP Score
                            row.push(item.evidence.gene2variant.metadata.funcgen.ot_g2v_score.toPrecision(3));
                            // GTEx
                            row.push(item.evidence.gene2variant.metadata.funcgen.gtex_score.toPrecision(3));
                            // DHS
                            row.push(item.evidence.gene2variant.metadata.funcgen.dhs_score.toPrecision(3));
                            // Fantom5
                            row.push(item.evidence.gene2variant.metadata.funcgen.fantom5_score.toPrecision(3));
                            // PCHiC
                            row.push(item.evidence.gene2variant.metadata.funcgen.pchic_score.toPrecision(3));
                            // VEP
                            row.push(item.evidence.gene2variant.metadata.funcgen.vep_score);
                            // Regulome
                            row.push(item.evidence.gene2variant.metadata.funcgen.regulome_score);
                            // Nearest
                            row.push(item.evidence.gene2variant.metadata.funcgen.is_nearest_gene);
                            // END POSTGAP STUFF

                            // publications
                            var refs = [];
                            if (checkPath(item, 'evidence.variant2disease.provenance_type.literature.references')) {
                                refs = item.evidence.variant2disease.provenance_type.literature.references;
                            }

                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(pmidsList.length ? otUtils.getPublicationsString(pmidsList) : 'N/A');
                            // row.push(refs.length ? otUtils.getPublicationsField(refs) : 'N/A');

                            // Publication ids (hidden)
                            row.push(pmidsList.join(', '));

                            // hidden columns for filtering
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

                var dropdownColumns = [1, 2, 3, 4, 6, 15];

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
                                'targets': [17],
                                'visible': false
                            },
                            {
                                'targets': [3, 6],
                                'width': '14%'
                            },
                            {
                                'targets': [1, 5],
                                'width': '10%'
                            },
                            {
                                'targets': [2],
                                'width': '14%',
                                'mRender': otColumnFilter.mRenderGenerator(18),
                                'mData': otColumnFilter.mDataGenerator(2, 18)
                            },
                            {
                                'targets': [4],
                                'width': '14%',
                                'mRender': otColumnFilter.mRenderGenerator(19),
                                'mData': otColumnFilter.mDataGenerator(4, 19)
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, (scope.title ? scope.title + '-' : '') + '-common_diseases'));
                }
            }
        };
    }]);
