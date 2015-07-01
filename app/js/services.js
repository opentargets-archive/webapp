'use strict';


/* Services */

angular.module('cttvServices', []).


    /**
     * A service to handle search in the app.
     * This talks to the API service
     */
    factory('cttvUtils', ['$log', function($log) {


        var cttvUtilsService = {};



        /**
         * Set the default tabletools (i.e.) options, including the export button
         * @param obj: the datatable config object, or an empty object
         * @param title: the name to be used to save the file.
         *               E.g. "bob" will produce bob.pdf and bob.csv when exporting in those formats.
         *
         */
        cttvUtilsService.setTableToolsParams = function(obj, title){

            //obj.sDom = '<"pull-left" T><"pull-right" f>rt<"pull-left" i><"pull-right" p>';
            obj.sDom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" T>rt<"pull-left small" l><"pull-right small" p>>';
            obj.oTableTools= {
                    "sSwfPath": "swfs/copy_csv_xls_pdf.swf",
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
                                {
                                    "sExtends": "pdf",
                                    "sButtonText": "<span class='fa fa-file-pdf-o' style='padding-right:7px'></span>PDF",
                                    "sTitle": title
                                }/*,
                                {
                                    "sExtends": "print",
                                    "sButtonText": "<span class='fa fa-print' style='padding-right:7px'></span>Print"
                                }*/
                            ],
                        }
                     ]
                }
            return obj;
        }



        cttvUtilsService.colorScales = {
            BLUE_0_1 : d3.scale.linear()
                        .domain([0,1])
                        .range(["#CBDCEA", "#005299"]), // blue orig
        }



        cttvUtilsService.location = {

            searchString : function(key, value){

                var url = window.location.href.split("?");
                // var search = window.location.href.split('?')[1] || "";
                url[1] = url[1] || "";

                // in no args supplied, return the query string
                if(arguments.length == 0){
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
                window.location.href = url.join("?");
            }

        }



        return cttvUtilsService;
    }]);







