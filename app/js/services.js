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
            obj.sDom = '<"clear small" i><"pull-left small" f><"pull-right" T>rt<"pull-left small" l><"pull-right small" p>';
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


        return cttvUtilsService;
    }]);


