/* Controllers */

angular.module('otControllers')

    /**
     * TargetDiseaseController
     * Controller for the Gene <-> Disease page
     * It loads the evidence for the given target <-> disease pair
     */
    .controller('TargetDiseaseController', ['$scope', '$location', 'otApi', 'otUtils', 'otConsts', 'otConfig', '$analytics', 'otLocationState', '$anchorScroll', '$q', function ($scope, $location, otApi, otUtils, otConsts, otConfig, $analytics, otLocationState, $anchorScroll, $q) {
        'use strict';

        otLocationState.init();   // does nothing, but ensures the otLocationState service is instantiated and ready
        otUtils.clearErrors();

        var searchObj = otUtils.search.translateKeys($location.search());

        // var dbs = otConsts.dbs;
        var datatypes = otConsts.datatypes;

        // initialize object to communicate with tables based on config plugins
        $scope.tables = {};
        otConfig.evidenceSections.forEach(function (item) {
            $scope.tables[item.name] = {};
            Object.keys(item).forEach(function (key) {
                $scope.tables[item.name][key] = item[key];
            });
        });

        $scope.search = {
            info: {
                data: {},
                efo_path: [],
                efo: {},
                gene: {},
                title: ''
            },

            flower_data: [], // processFlowerData([]), // so we initialize the flower to something
            association_score: {}
        };

        $scope.datatypes = datatypes;


        // =================================================
        //  I N F O
        // =================================================


        /**
         * Get the information for target and disease,
         * i.e. to fill the two boxes at the top of the page
         */
        var getInfo = function () {
            return $q.all([
                // array of promises
                otApi.getTarget({
                    method: 'GET',
                    params: {
                        target_id: $scope.search.target
                    }
                })
                    .then(function (resp) {
                        console.log("get target info");
                        $scope.search.info.gene = resp.body;
                        return resp;
                    }, otApi.defaultErrorHandler)
                ,
                otApi.getDisease({
                    method: 'GET',
                    params: {
                        code: $scope.search.disease
                    }
                })
                    .then(
                        function (resp) {
                            console.log("get disease info....");
                            $scope.search.info.efo = resp.body;
                            // TODO: This is not returned by the api yet. Maybe we need to remove it later
                            $scope.search.info.efo.efo_code = $scope.search.disease;
                            $scope.search.info.efo.efo = $scope.search.disease;
                        },
                        otApi.defaultErrorHandler
                    )

            ]);
        };


        var updateTitle = function (t, d) {
            $scope.search.info.title = (t + '-' + d).split(' ').join('_');
        };


        // =================================================
        //  F L O W E R
        // =================================================

        /*
         * takes a datasources array and returns an array of objects {value: number, label:string}
         */
        function processFlowerData (data) {
            var fd = [];

            for (var i = 0; i < otConsts.datatypesOrder.length; i++) {
                var dkey = otConsts.datatypes[otConsts.datatypesOrder[i]];
                var key = otConsts.datatypesOrder[i];
                fd.push({
                    'value': data ? data[dkey] : 0,
                    'label': otConsts.datatypesLabels[key],
                    'active': true
                });
            }

            return fd;
        }


        var getFlowerData = function () {
            var opts = {
                target: $scope.search.target,
                disease: $scope.search.disease,
                facets: false
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };

            return otApi.getAssociations(queryObject)
                .then(function (resp) {
                    $scope.search.association_score = resp.body.data[0].association_score;
                    if (!resp.body.data.length) {
                        $scope.search.flower_data = processFlowerData();
                    } else {
                        $scope.search.flower_data = processFlowerData(resp.body.data[0].association_score.datatypes);
                        updateTitle(resp.body.data[0].target.gene_info.symbol, resp.body.data[0].disease.efo_info.label);
                    }
                }, otApi.defaultErrorHandler);
        };


        // =================================================
        //  S C O P E   M E T H O D S
        // =================================================

        $scope.sectionOpen = function (who) {
            // Fire a target associations tree event for piwik to track
            $analytics.eventTrack('evidence', {'category': 'evidence', 'label': who});
        };

        // =================================================
        //  M A I N   F L O W
        // =================================================

        var path = $location.path().split('/');
        // parse parameters
        $scope.search.target = path[2];
        $scope.search.disease = path[3];

        var render = function (new_state) {
            var view = new_state.view || {};
            var sec = view.sec;
            if (sec && sec[0]){
                var i = $scope.sections.findIndex(function (s) {
                    return s.config.datatype === sec[0];
                });
                if (i >= 0) {
                    $scope.sections[i].defaultVisibility = true;
                    $scope.sections[i].currentVisibility = true;

                    // scrolling before we have the data is unlikely to work:
                    // at best it will scroll a little bit, but not much, because there won't be any height to allow scolling
                    // leaving this here for now.
                    // TODO: will have to think of a more elegant way of managing this, for example load all data in sequence
                    $anchorScroll('tables');
                }
            }
        };

        $scope.$on(otLocationState.STATECHANGED, function (e, new_state, old_state) {
            // at the moment this shouldn't be trigger other than when rerouting from an old style link
            render(new_state, old_state);
        });

        // if old link, do a rerouting to new style links
        if (!otLocationState.getState().view && otLocationState.getState().sec) {
            $location.search('view=sec:' + otLocationState.getState().sec);
        }

        // and fire the info search
        getInfo()
            .then(getFlowerData())
            .then(function () {
                // plugins
                $scope.sections = otConfig.evidenceSections;
                // Initialize visibility values
                for (var t = 0; t < $scope.sections.length; t++) {
                    $scope.sections[t].defaultVisibility = $scope.sections[t].visible || false;
                    $scope.sections[t].currentVisibility = $scope.sections[t].visible || false;
                }
                render(otLocationState.getState(), otLocationState.getOldState());
            });
    }]);
