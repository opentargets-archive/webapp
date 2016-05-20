 /*  Service to keep track of lazy loaded resources  */

angular.module('cttvServices')

    .factory ('lazy', ['$log', '$q', '$http', 'cttvConfig', function ($log, $q, $http, cttvConfig) {
        'use strict';

        // var targetSections = cttvConfig.targetSections;
        // var meta = {};
        // for (var i=0; i<targetSections.length; i++) {
        //     if (targetSections[i].dependencies) {
        //         meta = _.extend(meta, targetSections[i].dependencies);
        //     }
        // }
        //
        // // Configure Systemjs
        // System.config({
        //     "baseURL": "./",
        //     "defaultJSExtensions": false,
        //     "transpiler": false,
        //     "paths": {
        //         "github:*": "jspm_packages/github/*"
        //     },
        //
        //     "map": {
        //         "css": "github:/systemjs/plugin-css@0.1.21/css.js"
        //     },
        //     "meta": meta
        // });


        var ll = {
            import: function (file) {
                // Systemjs has already been configured based on config sections in app.js
                return System.import(file);
            },
       };

      return ll;
    }]);
