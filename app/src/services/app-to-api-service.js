/* Services */

angular.module('otServices')


    /**
     * A service to handle search in the app.
     * This talks to the API service
     */
    .factory('otAppToApi', [function () {
        'use strict';

        var APP_QUERY_Q = '',
            APP_QUERY_PAGE = 1,
            APP_QUERY_SIZE = 10;


        var otSearchService = {
            SEARCH: 'search',
            EVIDENCE: 'evidence'
        };


        otSearchService.createSearchInitObject = function () {
            return {
                query: {
                    q: APP_QUERY_Q,
                    page: APP_QUERY_PAGE,
                    size: APP_QUERY_SIZE
                },

                results: {}
            };
        };


        otSearchService.getApiQueryObject = function (type, queryObject) {
            var qo = {
                size: queryObject.size,
                from: (queryObject.page - 1) * queryObject.size
            };

            switch (type) {
            case this.SEARCH:
                qo.q = queryObject.q.title || queryObject.q;
                break;

            case this.EVIDENCE:
                qo.gene = queryObject.q.title || queryObject.q;
                qo.datastructure = 'simple';
                break;
            }

            return qo;
        };


        otSearchService.getSearch = function () {

        };


        return otSearchService;
    }]);
