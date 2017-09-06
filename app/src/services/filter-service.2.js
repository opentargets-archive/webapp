angular.module('cttvServices')
    .factory('cttvFiltersService2', ['cttvAPIservice', 'cttvUtils', 'cttvLocationState', '$injector', 'cttvConfig',
        function (cttvAPIservice, cttvUtils, cttvLocationState, $injector, cttvConfig) {
            var pageFacetNames = [];
            var pageFacets = [];
            var facetParsers = {};
            var facetsGlobal;

            function init () {
                // load the parsers once
                for (var i in cttvConfig.facets) {
                    var facet = cttvConfig.facets[i];
                    var parser = _.camelCase(facet.options.element) + 'Parser';
                    facetParsers[facet.key] = $injector.get(_.camelCase(parser));
                }

                // construct object of global methods (like update)
                facetsGlobal = {
                    update: update,
                    getUrlObject: getUrlObject,
                    lastClicked: null
                };
            }

            /**
     * Set the facets to be shown on the current page.
     * The order in which they're added is also the order
     * in which they'll appear in the UI.
     *
     * @param facetConfig - array of objects containing facet keys
     */
            var setPageFacetNamesFromConfig = function (facetConfig) {
                // note this is a modified version of "pageFacetsStack"" that
                // does "reset" first as well, since the two are always consecutive

                // set and remove the nesting
                pageFacetNames = facetConfig.map(function (obj) {
                    return obj.type;
                });
            };

            var updatePageFacetsFromApiData = function (apiData, countsKey) {
                // reset (but maintain the list for angular)
                pageFacets.length = 0;

                // iterate the relevant facet names (from config) and see what
                // is in the api data
                pageFacetNames.map(function (facetName) {
                    // get further facet info from non-page-specific facet config
                    var facetConfig = cttvConfig.facets[facetName];

                    // parse the api data and construct the facet object
                    var facet = facetParsers[facetConfig.key].parse(facetConfig.key, apiData, facetsGlobal, countsKey, facetConfig.options);

                    // store
                    pageFacets.push(facet);
                });

                // update the state
                refreshFromFacetsUrlObject();

                // TODO: track events in piwik...
            };

            var setFacetsUrlObject = function () {
                // create new object, then pass through each facet for serialization
                var urlObj = {};
                pageFacets.forEach(function (facet) {
                    urlObj = facet.serialize(urlObj);
                });
                cttvLocationState.setStateFor('fcts', urlObj);
            };

            var getUrlObject = function () {
                return cttvLocationState.getState().fcts;
            };

            var refreshFromFacetsUrlObject = function () {
                // retrieve the url object
                var urlObj = getUrlObject();

                // pass to each facet for any necessary state refresh
                pageFacets.forEach(function (facet) {
                    facet.deserialize(urlObj);
                });
            };

            var getPageFacets = function () {
                return pageFacets;
            };

            var update = function () {
                // updateSelected() // what does this do?
                setFacetsUrlObject();
            };

            init();

            return {
                setPageFacetNamesFromConfig: setPageFacetNamesFromConfig,
                updatePageFacetsFromApiData: updatePageFacetsFromApiData,
                getPageFacets: getPageFacets,
                update: update
            };
        }]);
