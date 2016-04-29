angular.module('plugins')
    .directive('pdbTarget', ['$log', '$compile', function ($log, $compile) {
        'use strict';

        return {
            restrict: 'E',
            template: "<p>The target that has been passed is {{target}}",
            scope: {
                target: '@'
            },
            link: function (scope, element, attrs) {
                // var template = '<pdb-prints pdb-ids="[\'1cbs\']" settings=\'{"orientation": "horizontal", "size": 64 }\'></pdb-prints>';
                // var template = '<pdb-topology-viewer entry-id="1aqd" entity-id="1"></pdb-topology-viewer>';

                var template = '<pdb-prints pdb-ids="[\'' + scope.target + '\']" settings=\'{"orientation": "horizontal", "size": 64 }\'></pdb-prints>';

                template = template + '<pdb-seq-viewer style="margin:30px" entry-id="' + scope.target + '" entity-id="1" viewer-type="pdbViewer" settings=\'{"width": 700, "height": 350}\'></pdb-seq-viewer>';

                template = template + '<div style="margin: 30px;position:relative;width:500px;height:500px;"><pdb-lite-mol pdb-id="' + scope.target + '" load-ed-maps="true"></pdb-lite-mol></div>';

                var compiled = $compile(template)(scope);
                element.append(compiled);
            }
        };
    }]);
