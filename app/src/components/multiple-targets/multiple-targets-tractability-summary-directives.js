angular.module('otDirectives')

    .directive('multipleTargetsTractabilitySummary', ['otUtils', '$timeout', function (otUtils, $timeout) {
        'use strict';

        var tractabilityCategories = {
            smallmolecule: [
                {
                    label: 'Clinical precedence',
                    labelHtml: 'Clinical precedence',  // multiline html label for display
                    buckets: [1, 2, 3]
                },

                {
                    label: 'Discovery precedence',
                    labelHtml: 'Discovery precedence',
                    buckets: [4, 7]
                },

                {
                    label: 'Predicted tractable',
                    labelHtml: 'Predicted tractable',
                    buckets: [5, 6, 8]
                }

                // , {
                //     label: 'Unknown',
                //     labelHtml: 'Unknown',
                //     buckets: [10]
                // }
            ],

            antibody: [
                {
                    label: 'Clinical precedence',
                    labelHtml: 'Clinical precedence',
                    buckets: [1, 2, 3]
                },

                {
                    label: 'Predicted tractable high confidence',
                    labelHtml: 'Predicted tractable <br />high confidence',
                    buckets: [4, 5]
                },

                {
                    label: 'Predicted tractable - medium to low confidence',
                    labelHtml: 'Predicted tractable <br />mid-low confidence',
                    buckets: [6, 7, 8, 9]
                }

                // {
                //     label: 'Unknown',
                //     labelHtml: 'Unknown',
                //     buckets: [10]
                // }
            ]
        };


        /**
         * Return the HTML string for a cell based on target ID (for the link) and value.
         * @param {String} id gene ID (e.g. ensembl gene id)
         * @param {*} val represents whethere there is data (>0) or not (0); it's the count of matching buckets
         */
        function getCellHtml (id, val) {
            var html = '';
            if (val > 0) {
                html = '<span><a href="/target/' + id + '?view=sec:tractability"><span class="cell-background tractable"><span class="heatmap-cell-val">1</span></span></a></span>';
            } else {
                html = '<span><span class="no-data cell-background" title="No data"></span></span>';
            }
            return html;
        }


        /**
         * Format the tractability data for a given target/category against our category mapping
         * @param {String} category either 'smallmolecule' or 'antibody'
         * @param {Oject} target contains id, symbol and tractability data
         */
        function formatTractabilityDataToArray (category, target) {
            return tractabilityCategories[category].map(function (cat) {
                // check how many (if any) category buckets match this target buckets; that value is used to genereate the cell HTML
                return getCellHtml(target.id, cat.buckets.filter(function (value) { return -1 !== target.tractability[category].buckets.indexOf(value); }).length);
            });
        }


        /**
         * Format the data to an array for displaying in datatables
         * @param {Array} d API response data (already filtered)
         */
        function formatDataToArray (d) {
            return d.map(function (t) {
                return ['<a href="/target/' + t.id + '">' + t.symbol + '</a>']
                    .concat(formatTractabilityDataToArray('smallmolecule', t))
                    .concat(formatTractabilityDataToArray('antibody', t));
            });
        }


        /*
         * Setup the table cols and return the DataTable object
         */
        var setupTable = function (table, data, filename) {
            var t = $(table).DataTable(otUtils.setTableToolsParams({
                'data': data,
                'ordering': true,
                'autoWidth': false,
                'paging': true,
                'columnDefs': [
                    {'orderSequence': ['desc', 'asc'], 'targets': '_all'},
                    {'orderSequence': ['asc', 'desc'], 'targets': [0]}
                ]
            }, filename));
            return t;
        };


        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-tractability-summary.html',
            scope: {
                target: '='
            },
            link: function (scope, elem) {
                scope.cols = tractabilityCategories;

                // process the tractability data:
                // filter out targets with no tractability data (or 'unknown' / empty buckets)
                // then map it to just gene info and tractability data
                var tractabilitydata = scope.target
                    .filter(function (t) {
                        return t.tractability
                                && (
                                    (t.tractability.smallmolecule && t.tractability.smallmolecule.buckets && t.tractability.smallmolecule.buckets.length > 0)
                                    ||
                                    (t.tractability.antibody && t.tractability.antibody.buckets && t.tractability.antibody.buckets.length > 0)
                                );
                    })
                    .map(function (t) {
                        return {
                            symbol: t.approved_symbol,
                            id: t.ensembl_gene_id,
                            tractability: t.tractability
                        };
                    });

                // setup with datatables
                var table = elem[0].getElementsByTagName('table');

                $timeout(function () {
                    setupTable(table, formatDataToArray(tractabilitydata), 'multiple-targets-tractability-summary');
                }, 0);
            }
        };
    }]);
