angular.module('otServices')
/**
 * Some utility services.
 */
    .factory('otUtils', ['$window', '$rootScope', 'otConsts', '$sce', function ($window, $rootScope, otConsts, $sce) {
        'use strict';

        var otUtilsService = {};

        /**
     * Inspects the browser name and version and
     * sets browser.name and browser.version properties.
     */
        otUtilsService.browser = {
            init: function () {
                this.name = this.searchString(this.dataBrowser) || 'Other';
                this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'Unknown';
            },
            searchString: function (data) {
                for (var i = 0; i < data.length; i++) {
                    var dataString = data[i].string;
                    this.versionSearchString = data[i].subString;

                    if (dataString.indexOf(data[i].subString) !== -1) {
                        return data[i].identity;
                    }
                }
            },
            searchVersion: function (dataString) {
                var index = dataString.indexOf(this.versionSearchString);
                if (index === -1) {
                    return;
                }

                var rv = dataString.indexOf('rv:');
                if (this.versionSearchString === 'Trident' && rv !== -1) {
                    return parseFloat(dataString.substring(rv + 3));
                } else {
                    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
                }
            },

            dataBrowser: [
                {string: navigator.userAgent, subString: 'Chrome', identity: 'Chrome'},
                {string: navigator.userAgent, subString: 'MSIE', identity: 'IE'},
                {string: navigator.userAgent, subString: 'Trident', identity: 'IE'},
                {string: navigator.userAgent, subString: 'Firefox', identity: 'Firefox'},
                {string: navigator.userAgent, subString: 'Safari', identity: 'Safari'},
                {string: navigator.userAgent, subString: 'Opera', identity: 'Opera'}
            ]

        };
        otUtilsService.browser.init();


        /**
     * Set the default tabletools (i.e.) options, including the export button
     * @param obj: the datatable config object, or an empty object
     * @param title: the name to be used to save the file.
     *               E.g. "bob" will produce bob.pdf and bob.csv when exporting in those formats.
     *
     */
        otUtilsService.setTableToolsParams = function (obj, title) {
        // obj.sDom = '<"pull-left" T><"pull-right" f>rt<"pull-left" i><"pull-right" p>';
        // obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" T>rt<"pull-left small" l><"pull-right small" p>>';

            obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>rt<"pull-left small" l><"pull-right small" p>>';
            obj.buttons = [
            // {
            //     extend: 'copy', //extend: 'copyHtml5',
            //     text: "<span class='fa fa-files-o' title='Copy to clipboard'><span>",
            // },
                {
                    extend: 'csv', // extend: 'csvHtml5',
                    text: '<span class=\'fa fa-download\' title=\'Download as .csv\'><span>',
                    title: title// ,
                // exportOptions: {
                //    columns: ':visible'
                // }
                }
            ];

            return obj;
        };

        otUtilsService.setTableToolsParamsExportColumns = function (obj, title) {
            obj.dom = '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>rt<"pull-left small" l><"pull-right small" p>>';
            obj.buttons = [
                {
                    extend: 'csv', // extend: 'csvHtml5',
                    text: '<span class=\'fa fa-download\' title=\'Download as .csv\'><span>',
                    title: title,
                    exportOptions: {
                        columns: [1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13]
                    }
                }
            ];

            return obj;
        };


        otUtilsService.colorScales = {
            BLUE_0_1: d3.scale.linear()
                .domain([0, 1])
                .range(['#CBDCEA', '#005299']), // blue orig
            // .range(["#AEDEF7", "#0091EB"]),
            // .range(["#97D5F5", "#0081D2"]),
            // .range(["#B6DDFC", "#0052A3"]), // extra brand blue
            // .range(["#FFFF00", '#007AFF']), // yellow - blue
            // .range(["#feffd8", '#2354a3']), // yellow - blue (shorter range)
            // .range(["#feffd8", '#081d58']), // yellow - blue (longer range ylgrbu)
            // .range(["#fbf583", '#0465b2']), // yellow - blue (custom)
            // .range(["#fbf583", '#375E97']), // sky - sunflower (custom)
            // .range(['#FED69C', "#2A4E6E"]), // yellow - blue (custom made)
            // .range(["#FFFFd8", '#007AFF']), // toned down yellow - blue
            // .range(["#FFD0CB", "#FF6350"]), // brand red

            BLUE_1_10: d3.scale.linear()
                .domain([1, 10])
                .range(['#CBDCEA', '#005299']),

            BLUE_1_3: d3.scale.linear()
                .domain([1, 3])
                .range(['#B6DDFC', '#0052A3']),

            BLUE_RED: d3.scale.linear()
                .domain([-1, 1])
                .range(['#582A72', '#AAAA39'])

        };

        otUtilsService.search = {
            translateKeys: function (searchObj) {
                for (var key in searchObj) {
                    switch (key) {
                    case 'score_min':
                        searchObj.filterbyscorevalue_min = searchObj.score_min;
                        delete searchObj.score_min;
                        break;
                    case 'score_max':
                        searchObj.filterbyscorevalue_max = searchObj.score_max;
                        delete searchObj.score_max;
                        break;
                    case 'score_str':
                        searchObj.stringency = searchObj.score_str;
                        delete searchObj.score_str;
                        break;
                    }
                }
                return searchObj;
            },

            format: function (searchObj) {
                var opts = [];
                for (var key in searchObj) {
                    opts.push(key + '=' + searchObj[key]);
                }
                var searchStr = opts.join('&');
                return '?' + searchStr;
            },

            searchString: function (key, value) {
                var url = $window.location.href.split('?');
                // var search = window.location.href.split('?')[1] || "";
                url[1] = url[1] || '';

                // in no args supplied, return the query string
                if (arguments.length === 0) {
                    return url[1];
                }

                // else set the values

                // we want to APPEND the value to the URL,
                // to keep the order in which the filters are applied
                // and if the same value is already set in the string, we need to remove it first

                var search = url[1].split('&');
                search = _.without(search, key + '=' + value);
                search.push(key + '=' + value);
                url[1] = search.join('&');
                $window.location.href = url.join('?');
            }

        };

        otUtilsService.checkPath = function (obj, path) {
            var prop;
            var props = path.split('.');

            // while (prop = props.shift()) {
            while (props.length > 0) {
                prop = props.shift();
                if (!obj.hasOwnProperty(prop)) {
                    return false;
                }
                obj = obj[prop];
            }
            return true;
        };

        // n: number
        // t: tick
        otUtilsService.roundToNearest = function (n, t) {
            return (Math.round(n / t) * t);
        };

        otUtilsService.floatPrettyPrint = function (x) {
            var value = x;
            if (x < 0.0001) {
                value = value.toExponential(2);
            } else {
                value = value.toFixed(2);
            }
            return value;
        };

        otUtilsService.getPmidsList = function (refs) {
            refs = refs || [];  // to avoid undefined errors
            return refs.map(function (ref) {
                if (ref.lit_id[ref.lit_id.length - 1] === '/') {
                    ref.lit_id = ref.lit_id.substring(0, ref.lit_id.length - 1);
                }
                return ref.lit_id.split('/').pop();
            });
        };

        // otUtilsService.getPublicationsField = function(refs) {
        //     refs = refs || [];  // to avoid undefined errors
        //
        //     var pub = '';
        //     pub = '<span class=\'ot-publications-string\'>';
        //     pub += '<span class=\'badge\'>' + refs.length + '</span>';
        //     pub += (refs.length === 1 ? ' publication' : ' publications');
        //     if (refs.length === 1) {
        //         pub = '<a class="ot-external-link" target="_blank" href="' + refs[0].lit_id + '">' + pub + '</a>';
        //     } else {
        //         var pmids = pmidsList.map(function (ref) {
        //             return 'EXT_ID:' + ref;
        //         }).join(' OR ');
        //         pub = '<a class="ot-external-link" target="_blank" href="//europepmc.org/search?query=' + pmids + '">' + pub + '</a>';
        //     }
        //     pub += '</span>';
        //     return pub;
        // };

        otUtilsService.getPublicationsString = function (pmidsList) {
            pmidsList = pmidsList || [];  // to avoid undefined errors
            var pub = '';
            if (pmidsList.length > 0) {
                pub = '<span class=\'ot-publications-string\'>';
                pub += '<span class=\'badge\'>' + pmidsList.length + '</span>';
                pub += (pmidsList.length === 1 ? ' publication' : ' publications');
                var pmids = pmidsList.map(function (ref) {
                    if (ref.substring(0, 3) === 'PMC') {
                        return ref;
                    }
                    return 'EXT_ID:' + ref;
                }).join(' OR ');
                pub = '<a class="ot-external-link" target="_blank" href="//europepmc.org/search?query=' + pmids + '">' + pub + '</a>';
                pub += '</span>';
            }
            return pub;
        };

        otUtilsService.clearErrors = function () {
            $rootScope.showApiError500 = false;
        };

        // Input: array with ensembl ids
        // Output: array with the significant bits of the ensembl ids
        otUtilsService.compressTargetIds = function (ids) {
            var compressed = [];
            for (var i = 0; i < ids.length; i++) {
                var target = ids[i];
                for (var pos = 4; pos < target.length; pos++) {
                    if (target[pos] !== '0') {
                        var c = target.slice(pos, target.length);
                        compressed.push(c);
                        break;
                    }
                }
            }

            return compressed;
        };

        // Input: array with the significant bits of an ensembl id
        // Output: array with the expanded ids
        otUtilsService.expandTargetIds = function (compressedIds) {
            var targets = [];

            for (var i = 0; i < compressedIds.length; i++) {
                var compT = compressedIds[i];
                var expanded = 'ENSG' + (Array(12 - compT.length).join('0') + compT);
                targets.push(expanded);
            }
            return targets;
        };


        otUtilsService.addMatchedBy = function (r) {
            console.log(r);
            var matches = {
                human: 0,
                ortholog: 0,
                drug: 0,
                phenotype: 0
            };
            for (var h in r.highlight) {
                if (h === 'id' || h === 'score' || h === 'type') {
                    continue;
                }
                if (h.startsWith('ortholog')) {
                    matches.ortholog++;
                } else if (h.startsWith('drugs')) {
                    matches.drug++;
                } else if (h.startsWith('phenotypes.label')) {
                    matches.phenotype++;
                } else {
                    matches.human++;
                }
            }

            if (!matches.human) {
                if (matches.ortholog) {
                    r.orthologMatch = true;
                }
                if (matches.drug) {
                    r.drugMatch = true;
                    var drugsObj = {};
                    var drugsHighlight = r.highlight['drugs.evidence_data'] || r.highlight['drugs.drugbank'];
                    var parser = new DOMParser();
                    for (var i=0; i<drugsHighlight.length; i++) {
                        var thisDrug = drugsHighlight[i];
                        var el = parser.parseFromString(thisDrug, 'text/xml');
                        drugsObj[el.firstChild.textContent.toUpperCase()] = 1;
                    }
                    r.drugs = Object.keys(drugsObj);
                }
                if (matches.phenotype) {
                    r.phenotypeMatch = true;
                }
            } else {
                for (var h2 in r.highlight) {
                    if (h2.indexOf('ortholog') === 0 || h2.indexOf('drug') === 0 || h2.indexOf('phenotypes.label') === 0) {
                        delete r.highlight[h2];
                    }
                }
            }
        };

        // Defers a call x ms
        // If a new call is made before the time expires, discard the initial one and start deferring again
        // otUtilsService.defer = function (cbak, ms) {
        //     var tick;
        //
        //     var defer_cancel = function () {
        //         var args = Array.prototype.slice.call(arguments);
        //         var that = this;
        //         clearTimeout(tick);
        //         tick = setTimeout (function () {
        //             cbak.apply (that, args);
        //         }, time);
        //     };
        //
        //     return defer_cancel;
        // };

        /*
         * Search for given eco_code id in the specified evidence_codes_info array
         * and returns corresponding label, or eco_code id if not found
         */
        otUtilsService.getEcoLabel = function (arr, eco) {
            var label = eco;
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][0].eco_id === eco) {
                        label = arr[i][0].label;
                        break;
                    }
                }    
            }
            return label;
        };

        /**
         * Takes an array and formats it to an HTML list (returns a string)
         */
        otUtilsService.arrayToList = function (arr, oneToString) {
            if (oneToString && arr.length === 1) {
                return arr[0];
            }
            return '<ul><li>' + arr.join('</li><li>') + '</li></ul>';
        };

        /**
         *
         */
        otUtilsService.ucFirst = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
        };

        /**
         * 
         */
        otUtilsService.getDatasourceById = function (id) {
            return Object.keys(otConsts.datasources)
                .filter(function (i) {
                    return otConsts.datasources[i].id === id;
                })
                .map(function (j) {
                    return otConsts.datasources[j];
                })[0];
        };


        /**
         * 
         */
        otUtilsService.getDatatypeById = function (id) {
            return Object.keys(otConsts.datatypes)
                .filter(function (i) {
                    return otConsts.datatypes[i].id === id;
                })
                .map(function (j) {
                    return otConsts.datatypes[j];
                })[0];
        };


        /**
         * 
         */
        otUtilsService.allelicComposition2Html = function (allele) {
            return allele.replace(/<(.*?)>/g, function (match) { return '<sup>' + match.substr(1, match.length - 2) + '</sup>'; });
        }

        return otUtilsService;
    }]);
