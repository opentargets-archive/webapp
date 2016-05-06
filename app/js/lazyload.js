/*  Service to keep track of lazy loaded resources  */

angular.module('cttvServices')

    .factory ('lazy', ['$log', '$q', '$http', function ($log, $q, $http) {
        'use strict';

        var scriptPromises = {};

        var ll = {
            getJs: function(path) {
                var deferred = $q.defer();
                $http.get(path).then(function(response) {
                    deferred.resolve(response.data);
                });
                return deferred.promise;
           },
           loadScript: function (file) {
               if (!scriptPromises[file]) {
                   var deferred = $q.defer();
                   //cache promise
                   scriptPromises[file] = deferred.promise;

                   //inject js into a script tag
                   ll.getJs(file)
                       .then (function (scriptData) {
                           console.log(scriptData);
                           var script = document.createElement('script');
                           script.src = 'data:text/javascript,' + encodeURI(scriptData);
                           script.onload = function() {
                               // now the script is ready for use, resolve promise to add the script's directive element
                               // scope.$apply(deferred.resolve());
                               deferred.resolve();
                           };
                           document.body.appendChild(script);
                       });
                   return deferred.promise;
               } else { //this script has been loaded before
                   return scriptPromises[file]; //return the resolved promise from cache
               }
           }
       };

      return ll;
    }]);
