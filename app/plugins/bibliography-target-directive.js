angular.module('plugins')
    .directive('bibliographyTarget', ['$log', '$http', function ($log, $http) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/bibliography-target.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                var bibliography = _.filter(scope.target.dbxrefs, function (t) {
                    return t.match(/^PubMed/);
                });
                var cleanBibliography = _.map(bibliography, function (t) {
                    return t.substring(7, t.lenght);
                });
                var pmidsLinks = (_.map(cleanBibliography, function (p) {
                    return 'EXT_ID:' + p;
                })).join(' OR ');
                scope.citations = {};

                $http.get('/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search?query=' + pmidsLinks + '&format=json')
                    .then(function (resp) {
                        scope.citations.count = resp.data.hitCount;
                        scope.citations.europepmcLink = '//europepmc.org/search?query=' + pmidsLinks;
                        var citations = resp.data.resultList.result;
                        for (var i = 0; i < citations.length; i++) {
                            var authorStr = citations[i].authorString;
                            if (authorStr[authorStr.length - 1] === '.') {
                                authorStr = authorStr.slice(0, -1);
                            }
                            var authors = authorStr.split(', ');
                            citations[i].authors = authors;
                        }
                        scope.citations.all = resp.data.resultList.result;
                    });
            }
        };
    }]);
