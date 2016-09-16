

/* Services */

angular.module('cttvServices', []).


    /**
     * Some utility services.
     */
    factory('cttvUtils', ['$log', '$window', '$rootScope', function($log, $window, $rootScope) {
        'use strict';

        var cttvUtilsService = {};

        /**
         * Inspects the browser name and version and
         * sets browser.name and browser.version properties.
         */
        cttvUtilsService.browser = {
            init: function () {
                this.name = this.searchString(this.dataBrowser) || "Other";
                this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "Unknown";
            },
            searchString: function (data) {
                for (var i = 0; i < data.length; i++) {
                    var dataString = data[i].string;
                    this.versionSearchString = data[i].subString;

                    if (dataString.indexOf(data[i].subString) !== -1) {
                        return data[i].identity;
                    }
                }
            },
            searchVersion: function (dataString) {
                var index = dataString.indexOf(this.versionSearchString);
                if (index === -1) {
                    return;
                }

                var rv = dataString.indexOf("rv:");
                if (this.versionSearchString === "Trident" && rv !== -1) {
                    return parseFloat(dataString.substring(rv + 3));
                } else {
                    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
                }
            },

            dataBrowser: [
                {string: navigator.userAgent, subString: "Chrome", identity: "Chrome"},
                {string: navigator.userAgent, subString: "MSIE", identity: "IE"},
                {string: navigator.userAgent, subString: "Trident", identity: "IE"},
                {string: navigator.userAgent, subString: "Firefox", identity: "Firefox"},
                {string: navigator.userAgent, subString: "Safari", identity: "Safari"},
                {string: navigator.userAgent, subString: "Opera", identity: "Opera"}
            ]

        };
        cttvUtilsService.browser.init();


        /**
         * Set the default tabletools (i.e.) options, including the export button
         * @param obj: the datatable config object, or an empty object
         * @param title: the name to be used to save the file.
         *               E.g. "bob" will produce bob.pdf and bob.csv when exporting in those formats.
         *
         */
        cttvUtilsService.setTableToolsParams = function(obj, title){

            //obj.sDom = '<"pull-left" T><"pull-right" f>rt<"pull-left" i><"pull-right" p>';
            //obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" T>rt<"pull-left small" l><"pull-right small" p>>';

            obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>rt<"pull-left small" l><"pull-right small" p>>';
            obj.buttons = [
                // {
                //     extend: 'copy', //extend: 'copyHtml5',
                //     text: "<span class='fa fa-files-o' title='Copy to clipboard'><span>",
                // },
                {
                    extend: 'csv', //extend: 'csvHtml5',
                    text: "<span class='fa fa-download' title='Download as .csv'><span>",
                    title: title//,
                    //exportOptions: {
                    //    columns: ':visible'
                    //}
                }
            ];

            return obj;
        };

        cttvUtilsService.setTableToolsParamsExportColumns = function(obj, title){

            obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>rt<"pull-left small" l><"pull-right small" p>>';
            obj.buttons = [
                {
                    extend: 'csv', //extend: 'csvHtml5',
                    text: "<span class='fa fa-download' title='Download as .csv'><span>",
                    title: title,
                    exportOptions: {
                        columns: [1,2,4,6,7,8,9,10,11,12,13]
                    }
                }
            ];

            return obj;
        };




        cttvUtilsService.colorScales = {
            BLUE_0_1 : d3.scale.linear()
                        .domain([0,1])
                        //.range(["#CBDCEA", "#005299"]), // blue orig
                        //.range(["#AEDEF7", "#0091EB"]),
                        //.range(["#97D5F5", "#0081D2"]),
                        .range(["#B6DDFC", "#0052A3"]), // extra brand blue
                        //.range(["#FFD0CB", "#FF6350"]), // brand red

            BLUE_1_3 : d3.scale.linear()
                        .domain([1,3])
                        .range(["#B6DDFC", "#0052A3"]),

            BLUE_RED : d3.scale.linear()
                        .domain([-1,1])
                        .range(['#582A72', '#AAAA39'])

        };

        cttvUtilsService.search = {
            translateKeys : function (searchObj) {
                for (var key in searchObj) {
                    switch (key) {
                        case "score_min":
                        searchObj.filterbyscorevalue_min = searchObj.score_min;
                        delete searchObj.score_min;
                        break;
                        case "score_max":
                        searchObj.filterbyscorevalue_max = searchObj.score_max;
                        delete searchObj.score_max;
                        break;
                        case "score_str":
                        searchObj.stringency = searchObj.score_str;
                        delete searchObj.score_str;
                        break;
                    }
                }
                return searchObj;
            },

            format : function (searchObj) {
                var opts = [];
                for (var key in searchObj) {
                    opts.push(key + "=" + searchObj[key]);
                }
                var searchStr = opts.join("&");
                return "?" + searchStr;
            },

            searchString : function(key, value){
                var url = $window.location.href.split("?");
                // var search = window.location.href.split('?')[1] || "";
                url[1] = url[1] || "";

                // in no args supplied, return the query string
                if(arguments.length === 0){
                    return url[1];
                }

                // else set the values

                // we want to APPEND the value to the URL,
                // to keep the order in which the filters are applied
                // and if the same value is already set in the string, we need to remove it first

                var search = url[1].split("&");
                search = _.without(search, key+"="+value);
                search.push(key+"="+value);
                $log.log(search);
                url[1] = search.join("&");
                $window.location.href = url.join("?");
            }

        };

        cttvUtilsService.checkPath = function (obj, path){
            var prop;
            var props = path.split('.');

            while( prop = props.shift() ){
                if(!obj.hasOwnProperty(prop)){
                    return false;
                }
                obj = obj[prop];
            }
            return true;
        };

        // n: number
        // t: tick
        cttvUtilsService.roundToNearest = function(n,t){
            return (Math.round(n/t)*t);
        };

        cttvUtilsService.floatPrettyPrint = function (x) {
            var value = x;
            if (x < 0.0001) {
                value = value.toExponential(2);
            } else {
                value = value.toFixed(2);
            }
            return value;
        };

        cttvUtilsService.getPmidsList = function(refs){
            refs = refs || [];  // to avoid undefined errors
            return refs.map(function (ref) {
                return ref.lit_id.split('/').pop();
            });
        };



        cttvUtilsService.getPublicationsString = function(pmidsList){
            pmidsList = pmidsList || [];  // to avoid undefined errors
            var pub = "";
            if (pmidsList.length>0){
                pub = "<span class='cttv-publications-string'>";
                    pub += "<span class='badge'>"+pmidsList.length+"</span>";
                    pub += ( pmidsList.length===1 ? " publication" : " publications" );
                    if (pmidsList.length===1) {
                        pub = '<a class="cttv-external-link" target="_blank" href="//europepmc.org/abstract/MED/' + pmidsList[0] + '">'+pub+'</a>';
                    } else {
                        var pmids = pmidsList.map(function (ref) {
                            return "EXT_ID:" + ref;
                        }).join (" OR ");
                        pub = '<a class="cttv-external-link" target="_blank" href="//europepmc.org/search?query=' + pmids + '">'+pub+'</a>';
                    }
                pub += "</span>";
            }
            return pub;
        };

        cttvUtilsService.clearErrors = function () {
            $rootScope.showApiError500 = false;
        };


        /* TODO */
        cttvUtilsService.objToString = function(obj){
            var s = "";
            for(var i in obj){

            }
            return s;
        }


        // Defers a call x ms
        // If a new call is made before the time expires, discard the initial one and start deferring again
        // cttvUtilsService.defer = function (cbak, ms) {
        //     var tick;
        //
        //     var defer_cancel = function () {
        //         var args = Array.prototype.slice.call(arguments);
        //         var that = this;
        //         clearTimeout(tick);
        //         tick = setTimeout (function () {
        //             cbak.apply (that, args);
        //         }, time);
        //     };
        //
        //     return defer_cancel;
        // };

        return cttvUtilsService;
    }])



    .factory('cttvModal', ['$log', '$window', '$rootScope', '$uibModal', function($log, $window, $rootScope, $uibModal) {
        var modalService = {};

        /*modalService.modalInstance; // the single modal instance?
        modalService.sayHello  = function(){$log.log("hello world")};
        modalService.test = function(){
            $log.log("modal test!");
            $uibModal.open({
                template: '<cttv-modal header="I am a test modal" on-ok="$uibModalInstance.sayHello()" hasok="true">'
                              +'<p>And this is the content</p>'
                          +'</cttv-modal>',
                size: "sm",
                // controller: ['$uibModalInstance',
                //                 function($uibModalInstance){
                //                     $log.log($uibModalInstance);
                //                     return $uibModalInstance.dismiss(bob);
                //             }]
            });
        }*/

        // open; instance is stored as modalInstance so can always be retrieved (assuming)
        /*modalService.open = function(o){
            if(modalService.modalInstance){
                modalService.modalInstance.close();
            }
            modalService.modalInstance = $uibModal.open(o);
            return modalService.modalInstance;
        }*/



        return modalService;
    }])



