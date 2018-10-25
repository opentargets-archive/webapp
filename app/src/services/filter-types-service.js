angular.module('otFacets')
    .factory('otFilterTypes', ['$analytics', 'otGoogleAnalytics', function ($analytics, otGoogleAnalytics) {
        function trackWithAnalytics (label) {
            $analytics.eventTrack('collectionLabel', {
                'category': 'associationFacet',
                'label': label
            });
            otGoogleAnalytics.trackEvent('associations', 'facet', label);
        }

        // BooleanFilter represents a single toggleable leaf checkbox
        function BooleanFilter (config, facetsGlobal) {
            this.key = config.key || '';
            this.label = config.label || '';
            this.count = config.count || 0;
            this.enabled = (this.count > 0) && (config.enabled === undefined ? true : config.enabled);
            this.checked = (config.checked === undefined) ? false : config.checked;
            this.facetsGlobal = facetsGlobal;
        }
        BooleanFilter.prototype.toggle = function () {
            // update internal state
            this.setChecked(!this.checked);
            // send analytics
            trackWithAnalytics(this.label);
            // trigger url update (with all facet data)
            this.facetsGlobal.update();
        };
        BooleanFilter.prototype.setChecked = function (value) {
            if (this.enabled) {
                this.checked = value;
            }
            return this.checked;
        };

        // NestedBooleanFilter represents a single (possibly nested) toggleable checkbox 
        function NestedBooleanFilter (config, facetsGlobal) {
            this.key = config.key || '';
            this.label = config.label || '';
            this.count = config.count || 0;
            this.enabled = (this.count > 0) && (config.enabled === undefined ? true : config.enabled);
            this.checked = (config.checked === undefined) ? false : config.checked;
            this.facetsGlobal = facetsGlobal;
            this.facetName = config.facetName;
            this.children = config.children;
            this.parents = [];
            this.hideCount = config.hideCount || false;
            this.shouldToggleChildren = config.shouldToggleChildren || false;
        }
        NestedBooleanFilter.prototype.addParent = function (parent) {
            this.parents.push(parent);
        };
        NestedBooleanFilter.prototype.toggle = function () {
            // new state
            var newState = !(this.checked || this.allChildrenChecked());
            // update internal state
            this.setChecked(newState);
            // update children (not typical)
            if (this.shouldToggleChildren) {
                this.children.forEach(function (child) {
                    child.setChecked(newState);
                });
            }
            // send analytics
            trackWithAnalytics(this.label);
            // set the last clicked to this
            this.setLastClicked();
            // trigger url update (with all facet data)
            this.facetsGlobal.update();
        };
        NestedBooleanFilter.prototype.setChecked = function (value) {
            if (this.enabled) {
                this.checked = value;

                // test parents for "some but not all" case, warranting de-check
                // if a parent of this filter has "some but not all" children checked,
                // it cannot be checked, and this process needs to "bubble up"
                this.parents.forEach(function (parent) {
                    if (!parent.shouldToggleChildren) {
                        var checkedChildrenCount = 0;
                        if (parent.children) {
                            parent.children.forEach(function (child) {
                                checkedChildrenCount += child.checked ? 1 : 0;
                            });
                        }

                        var someButNotAll = ((checkedChildrenCount > 0) &&
                              (checkedChildrenCount < parent.children.length));
                        parent.setChecked(parent.checked && !someButNotAll);
                    }
                });
            }
        };
        NestedBooleanFilter.prototype.getCheckedChildren = function () {
            var checkedChildren = [];
            if (this.children) {
                checkedChildren = this.children.filter(function (filter) {
                    return filter.checked;
                });
            }
            return checkedChildren;
        };
        NestedBooleanFilter.prototype.allChildrenChecked = function () {
            return (this.children &&
            this.children.length > 0 &&
            (this.children.length === this.getCheckedChildren().length));
        };
        NestedBooleanFilter.prototype.someChildren = function () {
            return (this.children &&
            this.children.length > 0);
        };
        NestedBooleanFilter.prototype.someChildrenChecked = function () {
            return (this.someChildren() &&
            this.getCheckedChildren().length > 0 &&
            (this.children.length > this.getCheckedChildren().length));
        };
        NestedBooleanFilter.prototype.isLastClicked = function () {
            if (!this.children || this.children.length === 0) {
                return false;
            }
            return this.children.some(function (filter) {
                return filter.facetsGlobal.lastClicked === (filter.facetName + ':' + filter.key);
            });
        };
        NestedBooleanFilter.prototype.setLastClicked = function () {
            this.facetsGlobal.lastClicked = this.facetName + ':' + this.key;
        };

        // IntegerFilter represents an integer valued filter
        // (eg. for rna_expression_level)
        function IntegerHistogramFilter (config) {
            this.key = config.key || '';
            this.value = 5;
            this.min = 1;
            this.max = 10;
            this.histogramData = config.histogramData;
        }

        return {
            BooleanFilter: BooleanFilter,
            NestedBooleanFilter: NestedBooleanFilter,
            IntegerHistogramFilter: IntegerHistogramFilter
        };
    }]);
