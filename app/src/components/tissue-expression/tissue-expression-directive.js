angular.module('otDirectives')
    .directive('otTissueExpression', ['$log', 'otApi', function ($log, otApi) {
        'use strict';

        return {

            restrict: 'AE',

            scope: {
                target: '=',
                // loadprogress : '=',
                filename: '@'
            },

            templateUrl: 'src/components/tissue-expression/tissue-expression.html',

            link: function (scope, elem, attrs) {
                scope.$watch('hierarchy', function (value) { $log.log(value); });
                // set the load progress flag to true before starting the API call
                // scope.loadprogress = true;

                // Watch for data changes
                scope.$watch(
                    'target',
                    function () {
                        // move otApi.getExpression ({ in here
                        // ......

                        if (scope.target) {
                            otApi.getExpression({
                                'method': 'GET',
                                'params': {
                                    gene: scope.target  // TODO: should be TARGET in API!!!
                                }
                            })
                                .then(

                                // success
                                    function (resp) {
                                    // set hte load progress flag to false once we get the results
                                    // scope.loadprogress = false;

                                        var data = resp.body.data[scope.target].tissues;

                                        // account for difference in ES2 ES5 versions of API
                                        if (!Array.isArray(data)) {
                                            $log.log('converting tissues object to array');
                                            data = Object.keys(data).map(function (key) {
                                                var tissue = data[key];
                                                tissue.label = key;
                                                return tissue;
                                            });
                                        }

                                        var systemHierarchy = {};
                                        var organHierarchy = {};
                                        data.forEach(function (tissue) {
                                            // check each tissue has at least one parent anatomical system
                                            // and at least one parent organ
                                            if (!tissue.anatomical_systems || tissue.anatomical_systems.length < 1) {
                                                $log.error(tissue.label + ' has no anatomical system');
                                            }
                                            if (!tissue.organs || tissue.organs.length < 1) {
                                                $log.error(tissue.label + ' has no anatomical system');
                                            }

                                            // create system hierarchy
                                            tissue.anatomical_systems.forEach(function (system) {
                                                // if the system hasn't yet been met, create it
                                                if (!(system in systemHierarchy)) {
                                                    systemHierarchy[system] = {
                                                        'label': system,
                                                        'children': []
                                                    };
                                                }
                                                // add the tissue
                                                systemHierarchy[system].children.push(tissue);
                                            });

                                            // create organ hierarchy
                                            tissue.organs.forEach(function (organ) {
                                                // if the organ hasn't yet been met, create it
                                                if (!(organ in organHierarchy)) {
                                                    organHierarchy[organ] = {
                                                        'label': organ,
                                                        'children': []
                                                    };
                                                }
                                                // add the tissue
                                                organHierarchy[organ].children.push(tissue);
                                            });
                                        });

                                        // convert to list
                                        scope.organs = Object.keys(organHierarchy)
                                            .map(function (key) {
                                                var organ = organHierarchy[key];
                                                organ.rna = {
                                                    'level': d3.max(organ.children, function (d) { return d.rna.level; })
                                                };
                                                organ.protein = {
                                                    'level': d3.max(organ.children, function (d) { return d.protein.level; })
                                                };
                                                return organ;
                                            });

                                        scope.anatomicalSystems = Object.keys(systemHierarchy)
                                            .map(function (key) {
                                                var system = systemHierarchy[key];
                                                system.rna = {
                                                    'level': d3.max(system.children, function (d) { return d.rna.level; })
                                                };
                                                system.protein = {
                                                    'level': d3.max(system.children, function (d) { return d.protein.level; })
                                                };
                                                return system;
                                            });

                                        scope.proteinLevelToPercent = function (level) {
                                            if (level <= 0) {
                                                // level 0 => not expressed
                                                // level -1 => no data
                                                return 0;
                                            }
                                            return level * 100 / 3;
                                        };
                                        scope.rnaLevelToPercent = function (level) {
                                            if (level <= 0) {
                                                // level 0 => not expressed
                                                // level -1 => no data
                                                return 0;
                                            }
                                            return level * 10;
                                        };
                                        // default
                                        scope.parents = scope.anatomicalSystems;
                                        scope.groupByRadioModel = 'anatomicalSystems';

                                        function sortBy (comparator) {
                                            scope.organs.sort(comparator);
                                            scope.organs.forEach(function (organ) {
                                                organ.children.sort(comparator);
                                            });
                                            scope.anatomicalSystems.sort(comparator);
                                            scope.anatomicalSystems.forEach(function (anatomicalSystem) {
                                                anatomicalSystem.children.sort(comparator);
                                            });
                                        }
                                        var rnaComparator = function (a, b) { return d3.descending(a.rna.level, b.rna.level); };
                                        var proteinComparator = function (a, b) { return d3.descending(a.protein.level, b.protein.level); };
                                        var labelComparator = function (a, b) { return d3.ascending(a.label, b.label); };
                                        scope.sortByRna = function () { sortBy(rnaComparator); };
                                        scope.sortByProtein = function () { sortBy(proteinComparator); };
                                        scope.sortByLabel = function () { sortBy(labelComparator); };

                                        // default
                                        scope.sortByLabel();
                                        scope.orderByRadioModel = 'az';

                                        scope.radioClick = function (arg) {
                                            $log.log('clicked with argument: ');
                                            $log.log(arg);
                                        };
                                    },

                                    // error
                                    otApi.defaultErrorHandler
                                );
                        }
                    }

                ); // end watch
            } // end link
        }; // end return
    }]);
