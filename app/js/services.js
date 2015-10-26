

/* Services */

angular.module('cttvServices', []).


    /**
     * Some utility services.
     */
    factory('cttvUtils', ['$log', '$window', function($log, $window) {
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

            obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>rt<"pull-left small" l><"pull-right small" p>>',
            obj.buttons = [
                //'csvHtml5'
                {
                    extend: 'csvHtml5',
                    text: "<span class='fa fa-download'>",
                    title: title//,
                    //exportOptions: {
                    //    columns: ':visible'
                    //}
                }
            ];
            /*
            obj.oTableTools= {
                    "sSwfPath": "swfs/copy_csv_xls.swf",
                    "aButtons": [
                        {
                            "sExtends":    "collection",
                            "sButtonText": "<span class='fa fa-download'>",
                            "aButtons": [
                                {
                                    "sExtends": "copy",
                                    "sButtonText": "<span class='fa fa-files-o' style='padding-right:7px'></span>Copy"
                                },
                                {
                                    "sExtends": "csv",
                                    "sButtonText": "<span class='fa fa-file-excel-o' style='padding-right:7px'></span>Excel/CSV",
                                    "sTitle": title
                                },
                                // {
                                //     "sExtends": "pdf",
                                //     "sButtonText": "<span class='fa fa-file-pdf-o' style='padding-right:7px'></span>PDF",
                                //     "sTitle": title
                                // },
                                // {
                                //     "sExtends": "print",
                                //     "sButtonText": "<span class='fa fa-print' style='padding-right:7px'></span>Print"
                                // }
                            ],
                        }
                     ]
                };
            */
            return obj;
        };



        cttvUtilsService.colorScales = {
            BLUE_0_1 : d3.scale.linear()
                        .domain([0,1])
                        .range(["#CBDCEA", "#005299"]), // blue orig
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
        }

        return cttvUtilsService;
    }]);
