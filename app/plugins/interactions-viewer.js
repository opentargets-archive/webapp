angular.module('plugins')
    .directive('interactionsViewer', ['$log', '$timeout', function ($log, $timeout) {
        return {
            restrict: 'E',
            template: '<div class="center-div" id=interactionsViewer></div>',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, elem, attrs) {
                var iv = interactionsViewer()
                    .uniprotId(scope.target.uniprot_id)
                    .size(600)
                    .proxy('/proxy/')
                    .labelSize(60)
                    .on("load", function (d) {
                        console.log("data loaded! ", d);
                    })
                    .on("click", function (d) {
                        console.log("clicked on node...", d);
                    });

                $timeout(function () {
                    iv(document.getElementById("interactionsViewer"));
                }, 0);
            }
        }
    }]);
