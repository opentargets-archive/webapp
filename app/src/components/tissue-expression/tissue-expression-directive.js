/**
    *
    * Options for configuration are:
    *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
    *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
    *
    * Example:
    *   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
    *
    *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
    *   This is useful in conjunction with a spinner where you can have ng-show="loading"
    */
    angular.module('cttvDirectives')
    .directive('cttvHpaTissueExpression', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                target : '=',
                //loadprogress : '=',
                filename : '@'
            },

            templateUrl: 'partials/tissue-expression.html',

            link: function (scope, elem, attrs) {
                scope.$watch('hierarchy', function(value) {$log.log(value);});
                // set the load progress flag to true before starting the API call
                //scope.loadprogress = true;

                // Watch for data changes
                scope.$watch(
                    'target',
                    function() {

                        // move cttvAPIservice.getExpression ({ in here
                        // ......

                        if( scope.target ){

                            cttvAPIservice.getExpression ({
                                "method": "GET",
                                "params" : {
                                    gene: scope.target  // TODO: should be TARGET in API!!!
                                }
                            })
                            .then(

                                // success
                                function (resp) {
                                    // set hte load progress flag to false once we get the results
                                    //scope.loadprogress = false;

                                    var data = resp.body.data[scope.target].tissues;

                                    // account for difference in ES2 ES5 versions of API
                                    if (!Array.isArray(data)) {
                                        $log.log('converting tissues object to array')
                                        data = Object.keys(data).map(function (key) {
                                            var tissue = data[key];
                                            tissue.label = key;
                                            return tissue;
                                        });
                                    }

                                    // TRANSFORM USING HIERARCHY
                                    // TODO: this should be done server side
                                    var systemHierarchy = {}
                                    var organHierarchy = {}
                                    data.forEach(function (tissue) {
                                      var hierarchyTissue = expressionHierarchy.tissues[tissue.label];

                                      // transform anatomical systems
                                      if (hierarchyTissue && hierarchyTissue.anatomical_systems) {
                                        hierarchyTissue.anatomical_systems.forEach(function (system) {
                                            if (!(system in systemHierarchy)) {
                                                var systemObj = expressionHierarchy.anatomical_systems[system]
                                                systemHierarchy[system] = {
                                                    // "efo_code": systemObj.efo_code,
                                                    "label": systemObj.label,
                                                    "children": []
                                                };
                                            }
                                            systemHierarchy[system].children.push(tissue);
                                        });
                                      }

                                      // transform organs
                                      if (hierarchyTissue && hierarchyTissue.organs) {
                                        hierarchyTissue.organs.forEach(function (organ) {
                                            if (!(organ in organHierarchy)) {
                                                var organObj = expressionHierarchy.organs[organ]
                                                organHierarchy[organ] = {
                                                    // "efo_code": organObj.efo_code,
                                                    "label": organObj.label,
                                                    "children": []
                                                };
                                            }
                                            organHierarchy[organ].children.push(tissue);
                                        });
                                      }
                                      
                                    });

                                    // convert to list
                                    scope.organs = Object.keys(organHierarchy)
                                                         .map(function (key) {
                                                             var organ = organHierarchy[key];
                                                             organ.rna = {
                                                                 "level": d3.max(organ.children, function (d) { return d.rna.level; })
                                                             }
                                                             organ.protein = {
                                                                 "level": d3.max(organ.children, function (d) { return d.protein.level; })
                                                             }
                                                             return organ;
                                                         })

                                    scope.anatomicalSystems = Object.keys(systemHierarchy)
                                                         .map(function (key) {
                                                             var system = systemHierarchy[key];
                                                             system.rna = {
                                                                 "level": d3.max(system.children, function (d) { return d.rna.level; })
                                                             }
                                                             system.protein = {
                                                                 "level": d3.max(system.children, function (d) { return d.protein.level; })
                                                             }
                                                             return system;
                                                         })

                                    scope.proteinLevelToPercent = function (level) {
                                        return level * 100 / 3;
                                    };
                                    scope.rnaLevelToPercent = function (level) {
                                        return level * 10;
                                    };
                                    // default
                                    scope.parents = scope.anatomicalSystems
                                    scope.groupByRadioModel = 'anatomicalSystems'

                                    function sortBy(comparator) {
                                        scope.organs.sort(comparator);
                                        scope.organs.forEach(function (organ) {
                                            organ.children.sort(comparator)
                                        })
                                        scope.anatomicalSystems.sort(comparator);
                                        scope.anatomicalSystems.forEach(function (anatomicalSystem) {
                                            anatomicalSystem.children.sort(comparator)
                                        })
                                    }
                                    var rnaComparator = function (a, b) { return d3.descending(a.rna.level, b.rna.level); };
                                    var proteinComparator = function (a, b) { return d3.descending(a.protein.level, b.protein.level); };
                                    var labelComparator = function (a, b) { return d3.ascending(a.label, b.label); };
                                    scope.sortByRna = function () { sortBy(rnaComparator); }
                                    scope.sortByProtein = function () { sortBy(proteinComparator); }
                                    scope.sortByLabel = function () { sortBy(labelComparator); }
                                    
                                    // default
                                    scope.sortByLabel();
                                    scope.orderByRadioModel = 'az'

                                    scope.radioClick = function (arg) {
                                        $log.log('clicked with argument: ');
                                        $log.log(arg);
                                    }
                                },

                                // error
                                cttvAPIservice.defaultErrorHandler
                            );
                        }
                    }

                ); // end watch

            } // end link
        }; // end return
    }])