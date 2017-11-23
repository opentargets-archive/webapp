angular.module('otPlugins')
    .directive('otPostgap', function () {
       return {
           restrict: 'E',
           templateUrl: 'plugins/postgap/postgap.html',
           scope: {
               target: '=',
               width: '='
           },
           link: function (scope, elem) {
               var ps = postgapViewer()
                   .gene(scope.target.id);
               console.log(elem[0]);
               ps(elem[0]);
           }
       };
    });
