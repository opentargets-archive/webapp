/**
 * Text mining table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')
    .directive('otTextMiningTable', [
        'otApi',
        '$timeout',
        'otConfig',
        'otConsts',
        'otUpperCaseFirstFilter',
        'otClearUnderscoresFilter',
        '$http',
        function (
            otApi,
            $timeout,
            otConfig,
            otConsts,
            otUpperCaseFirstFilter,
            otClearUnderscoresFilter,
            $http) {
            'use strict';

            var draw = 1;

            function getMatchedSentences (data) {
                var unicode_re = /u([\dABCDEF]{4})/gi;
                var match;

                var abstractSentences = [];
                // WARNING: Unicode characters are encoded in the response, we convert them to symbol
                data.evidence.literature_ref.mined_sentences.map(function (sentence) {
                    sentence.breakpoints = [];
                    var text = sentence.text;
                    while ((match = unicode_re.exec(text)) !== null) {
                        var pos = match.index;
                        sentence.text = sentence.text.replace('u' + match[1], String.fromCharCode(parseInt(match[1], 16)));
                        sentence.breakpoints.push({
                            'type': 'unicode',
                            'pos': pos,
                            'extra': '',
                            'span': 1
                        });
                    }
                });

                // create breakpoints for each sentence (unicodeChars, targets and diseases)
                // Order the breakpoints
                // var pubmedId = data.evidence.literature_ref.lit_id.split("/").pop();
                data.evidence.literature_ref.mined_sentences.map(function (sentence) {
                    if (sentence.t_start !== sentence.t_end) {
                        sentence.breakpoints.push({
                            'type': 't_start',
                            'pos': sentence.t_start,
                            'extra': '<span class="highlight-primary text-content-highlight">'
                        });
                        sentence.breakpoints.push({
                            'type': 't_end',
                            'pos': sentence.t_end + 1,
                            'extra': '</span>'
                        });
                    }

                    if (sentence.d_start !== sentence.d_end) {
                        sentence.breakpoints.push({
                            'type': 'd_start',
                            'pos': sentence.d_start,
                            'extra': '<span class="highlight-warning text-content-highlight">'
                        });
                        sentence.breakpoints.push({
                            'type': 'd_end',
                            'pos': sentence.d_end + 1,
                            'extra': '</span>'
                        });
                    }
                    // Sort the breakpoints by pos
                    sentence.breakpoints = sentence.breakpoints.sort(function (a, b) {
                        return a.pos - b.pos;
                    });

                    // Calculate the acc of offsets
                    sentence.breakpoints = _.reduce(sentence.breakpoints, function (bps, bp, i) {
                        bp.acc = i ? (bps[i - 1].acc + bps[i - 1].extra.length) : 0;
                        bps.push(bp);
                        return bps;
                    }, []);

                    var text = sentence.text;
                    sentence.breakpoints.map(function (bp) {
                        if (bp.extra) {
                            text = text.slice(0, bp.pos + bp.acc) + bp.extra + text.slice(bp.pos + bp.acc);
                        }
                    });

                    if (sentence.section === 'abstract' || sentence.section === 'title') {
                        var highlightedSentence = '<span class="highlight-info text-content-highlight">' + text + '</span>';
                        if (sentence.section === 'abstract') {
                            abstractSentences.push({
                                'raw': sentence.text.trim(),
                                'formatted': text,
                                'formattedHighlighted': highlightedSentence
                            });
                        } else { // title
                            abstractSentences.push({
                                'raw': sentence.text.trim(),
                                'formatted': text
                            });
                        }
                    }
                    if (sentence.section === 'abstract') {
                        sentence.formattedHighlightedText = '<span class="highlight-info text-content-highlight">' + text + '</span>';
                    }

                    sentence.formattedText = text;
                });

                return abstractSentences;
            }

            // count the number of sentences in each section
            var countSentences = function (sentences) {
                var count = {};
                sentences.map(function (sentence) {
                    if (count[sentence.section] === undefined) {
                        count[sentence.section] = 1;
                    } else {
                        count[sentence.section]++;
                    }
                });

                return count;
            };

            // group sentences in each section into one sentence
            var prepareSectionSentences = function (sentences) {
                var sectionSentenceMap = {};
                sentences.map(function (sentence) {
                    if (sentence.section !== 'abstract') {
                        if (sectionSentenceMap[sentence.section] === undefined) {
                            sectionSentenceMap[sentence.section] = '';
                            sectionSentenceMap[sentence.section] += '<li>' + sentence.formattedText + '</li>';
                        } else {
                            sectionSentenceMap[sentence.section] += '<li>' + sentence.formattedText + '</li>';
                        }
                    }
                });

                return sectionSentenceMap;
            };

            // group sentences in each section into one sentence
            var prepareSectionSentencesSimple = function (sentences) {
                var sectionSentenceMap = {};
                sentences.map(function (sentence) {
                    if (sectionSentenceMap[sentence.section] === undefined) {
                        sectionSentenceMap[sentence.section] = '';
                        sectionSentenceMap[sentence.section] += ' ' + sentence.formattedText + ' ';
                    } else {
                        sectionSentenceMap[sentence.section] += ' ' + sentence.formattedText + ' ';
                    }
                });

                return sectionSentenceMap;
            };

            function formatAuthor (author) {
                return author.lastName + ' ' + author.initials;
            }

            /*
             * Takes the data object returned by the API and formats it
             * to an array of arrays to be displayed by the dataTable widget.
             */
            function formatDataToArray (data) {
                var newData = [];

                var cat_list = ['title', 'intro', 'result', 'discussion', 'conclusion', 'other'];   // preferred sorting order

                data.forEach(function (d, i) {
                    var row = [];
                    var dlit = d.evidence.literature_ref; // data literature - now we use the epmc data
                    var pubmedId = dlit.data.pmid;


                    // 0 - Access level
                    row.push((d.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                    // 1 - Disease label
                    row.push(
                        '<a href="/disease/' + (d.disease.efo_info.efo_id.split('/').pop()) + '">'
                        + d.disease.efo_info.label
                        + '</a>'
                    );

                    // 3 - Publication (title, abstract etc)

                    // Authors formatting - now from evidence.literature_ref.data
                    var authorStr = '(No authors provided)';
                    if (dlit.data.authorList) {
                        authorStr = formatAuthor(dlit.data.authorList.author[0]);
                        if (dlit.data.authorList.author.length > 2) {
                            authorStr += ' <i>et al</i>';
                        } else if (dlit.data.authorList.author.length === 2) {
                            authorStr += ' and ' + formatAuthor(dlit.data.authorList.author[1]);
                        }
                        authorStr += '.';
                    }

                    // Abstract
                    if (!dlit.data.title && !dlit.data.abstractText && !dlit.data.journalInfo.journal) {
                        row.push('N/A');
                    } else {
                        var abstractSentences = getMatchedSentences(d);
                        var abstractSection = 'Abstract';
                        var abstractText = dlit.data.abstractText || 'Not abstract supplied.';
                        var abId = pubmedId + abstractSection + '--' + i;
                        var abstract = '<div id=\'' + abId + '\'>' + abstractText + '</div>';

                        var abstractString = '<p class=\'small\'><span onclick=\'angular.element(this).scope().displaySentences("' + abId + '")\'style=\'cursor:pointer\'><i class=\'fa fa-chevron-circle-down\' aria-hidden=\'true\'></i>&nbsp;<span class=\'bold\'>Abstract</span></p>';

                        var title = dlit.data.title || '';

                        if (abstractSentences && abstract) {
                            abstractSentences.map(function (f) {
                                var pos = abstract.indexOf(f.raw);
                                abstract = abstract.replace(f.raw, f.formatted);

                                // If not in the abstract, try the title
                                if (pos === -1) {
                                    pos = title.indexOf(f.raw);
                                    title = title.replace(f.raw, f.formatted);
                                }
                            });
                        }

                        // journal info
                        var journalInfo = (dlit.data.journalInfo.journal.medlineAbbreviation || dlit.data.journalInfo.journal.title || '');
                        // journal reference
                        var jref = dlit.data.journalInfo.volume + '(' + dlit.data.journalInfo.issue + '):' + dlit.data.pageInfo;
                        journalInfo += ' ' + jref;

                        var titleAndSource = '<span class=large><a href="http://europepmc.org/abstract/MED/' + pubmedId + '" target="_blank">' + title + '</a></span>'
                        + '<br />'
                        + '<span class=small>' + authorStr + ' ' + journalInfo + '</span>';

                        // PMID
                        var pmidStr = '<span class="text-lowlight">PMID: ' + pubmedId + '</span>';

                        // matched sentences
                        dlit.mined_sentences.sort(function (a, b) {
                            var a = a.section.toLowerCase();
                            var b = b.section.toLowerCase();

                            var ai = cat_list.length;
                            var bi = cat_list.length;
                            cat_list.forEach(function (li, i) {
                                if (a.substr(0, li.length) === li) {
                                    ai = i;
                                }
                                if (b.substr(0, li.length) === li) {
                                    bi = i;
                                }
                            });

                            return +(ai > bi) || +(ai === bi) - 1;
                        });

                        var sectionCount = countSentences(d.evidence.literature_ref.mined_sentences);
                        var sectionSentences = prepareSectionSentences(d.evidence.literature_ref.mined_sentences);
                        var sectionSentencesSimple = prepareSectionSentencesSimple(d.evidence.literature_ref.mined_sentences);
                        var previousSection = null;

                        var matchedSentences = d.evidence.literature_ref.mined_sentences.map(function (sent) {
                            var section = otUpperCaseFirstFilter(otClearUnderscoresFilter(sent.section));
                            var sentenceString = '';
                            if (section !== 'Title' && section !== 'Abstract') {
                                if (previousSection !== sent.section) {
                                    if (previousSection !== null) { // this is not the first section with matched sentences
                                        sentenceString = sentenceString + '</div>';
                                    }
                                    sentenceString += '<p class=\'small\'><span onclick=\'angular.element(this).scope().displaySentences("' + pubmedId + sent.section + '")\'style=\'cursor:pointer\'><i class=\'fa fa-chevron-circle-down\' aria-hidden=\'true\'></i>&nbsp;<span class=\'bold\'>' + section + ': </span>' + sectionCount[sent.section];
                                    if (sectionCount[sent.section] === 1) {
                                        sentenceString += ' matched sentence</span></p>';
                                    } else {
                                        sentenceString += ' matched sentences</span></p>';
                                    }
                                    previousSection = sent.section;
                                }

                                sentenceString += '<div id=\'' + pubmedId + sent.section + '\' style=\'display:none\'><ul style=\'margin-left: 10px;\'>' + sectionSentences[sent.section] + '</ul></div>';
                            }

                            return sentenceString;
                        }).join('') + '</div>';


                        row.push(
                            titleAndSource + '<br/>'
                            + pmidStr + '<br/><br/>'
                            + abstractString
                            + abstract
                            + ' <p class=small>'
                            + (matchedSentences || 'no matches available')
                            + '</p>'
                        );
                    }

                    // 4 - Year
                    // Note we could use something like year = moment(date).year() if needed to parse a date string
                    row.push(dlit.data.pubYear || 'N/A');

                    newData.push(row);
                });

                return newData;
            }


            var initTable = function (table, target, disease, filename, download, scope) {
                return $(table).DataTable({
                    'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',
                    'buttons': [
                        {
                            text: '<span class=\'fa fa-download\' title=\'Download as CSV (max 200 articles)\'></span>',
                            action: download
                        }
                    ],
                    'processing': false,
                    'searching': false,
                    'serverSide': true,
                    'autoWidth': false,
                    'ajax': function (data, cbak) {
                        // mappings:
                        // 0 => access level
                        // 1 => Disease
                        // 2 => Abstract
                        // 3 => Year
                        var mappings = {
                            // once pmid is indexed in elasticsearch we can use:
                            // 'evidence.literature_ref.lit_id'
                            3: 'evidence.date_asserted'
                        };

                        scope.ext.isLoading = true;

                        // We save the order condition for the server side rendering to use it for the download
                        dirScope.order = [];
                        for (var i = 0; i < data.order.length; i++) {
                            var prefix = data.order[i].dir === 'asc' ? '~' : '';
                            dirScope.order.push(prefix + mappings[data.order[i].column]);
                        }

                        var opts = {
                            target: target,
                            disease: disease,
                            datasource: otConfig.evidence_sources.literature,
                            size: data.length,
                            from: data.start,
                            sort: dirScope.order,
                            search: data.search.value,
                            draw: draw,
                            fields: [
                                'disease.efo_info.label',
                                'disease.efo_info.efo_id',
                                'evidence.literature_ref',
                                'evidence.date_asserted'
                            ]
                        };
                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };
                        // get basic literature info from our API
                        otApi.getFilterBy(queryObject)

                            // get abstract data
                            .then(function (resp) {
                                var pmids = resp.body.data.map(function (d) {
                                    return 'ext_id:' + d.evidence.literature_ref.lit_id.split('/').pop();
                                }).join(' OR ');

                                // get data from EPMC
                                return $http.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search?query='+pmids+'&format=json&resultType=core')
                                    .then(function (resp2) {
                                        // decorate our API repsonse with the abstract data:
                                        // create a new field: 'evidence.literature_ref.data'
                                        resp.body.data.forEach(function (d) {
                                            d.evidence.literature_ref.data = resp2.data.resultList.result.find(function (i) {
                                                return i.pmid === d.evidence.literature_ref.lit_id.split('/').pop();
                                            });
                                        });
                                        return resp;
                                    });
                            })

                            // process literature info
                            .then(function (resp) {
                                scope.ext.total = resp.body.total;  // we need to have the scope object here (passed by reference) in order to update the total
                                scope.ext.data = resp.body.data;
                                var dtData = formatDataToArray(resp.body.data);
                                var o = {
                                    recordsTotal: resp.body.total,
                                    recordsFiltered: resp.body.total,
                                    data: dtData,
                                    draw: draw
                                };
                                draw++;

                                return o;
                            })

                            // process data for table
                            .then(function (resp) {
                                cbak(resp);
                            })

                            .finally(function () {
                                scope.ext.isLoading = false;
                            });
                    },
                    'ordering': true,
                    'order': [[3, 'desc']],
                    'orderMulti': false,
                    'columnDefs': [
                        {
                            // access-level (public/private icon)
                            'targets': [0],
                            'visible': otConfig.show_access_level,
                            'width': '3%'
                        },
                        {
                            // disease
                            'targets': [1],
                            'orderable': false,
                            'width': '12%'
                        },
                        {
                            // abstract
                            'targets': [2],
                            'orderable': false
                        },
                        {
                            // year
                            'targets': [3],
                            'orderSequence': ['desc', 'asc']
                        }
                    ]
                }, (filename + '-text_mining'));
            };

            var dirScope;

            return {
                restrict: 'AE',
                templateUrl: 'src/components/text-mining-table/text-mining-table.html',
                scope: {
                    title: '@?',    // optional title for filename export
                    ext: '=?'       // optional external object to pass things out of the directive; TODO: this should remove teh need for all parameters above
                },
                link: function (scope, elem, attrs) {
                    scope.ext.hasError = false;
                    dirScope = scope;
                    var filename = scope.title;


                    scope.displaySentences = function (id) {
                        // make the collapse content to be shown or hide
                        $('#' + id).toggle('fast');
                    };


                    scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }, function () { return scope.title; }], function () {
                        if (!attrs.target || !attrs.disease || !scope.title) {
                            return;
                        }
                        $timeout(function () {
                            filename = (scope.title || (attrs.target + '-' + attrs.disease)).replace(/ /g, '_') + '-text-mining';
                            initTable(elem[0].getElementsByTagName('table'), attrs.target, attrs.disease, filename, scope.downloadTable, scope);
                        }, 0);
                    });


                    // TODO: If we move all the evidence tables to server side, this should be abstracted out probably in a service
                    scope.downloadTable = function () {
                        scope.ext.isLoading = true; // set the loading flag; to be honest this is so fast that one can't even see the spinner
                        var size = 200;
                        var opts = {
                            disease: attrs.disease, // scope.disease,
                            target: attrs.target, // scope.target,
                            datasource: otConfig.evidence_sources.literature,
                            // format: 'tab',  // use with OPTION 2 only
                            size: size,
                            from: 0,
                            sort: dirScope.order,
                            fields: ['target.id', 'target.gene_info.symbol', 'disease.id', 'disease.efo_info.label', 'evidence.literature_ref.lit_id']
                        };

                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };

                        otApi.getFilterBy(queryObject)
                            .then(function (resp) {
                                // OPTION 2 - tsv directly from API
                                // If we get data in .tsv from our API, then we can save it directly ith this:
                                // var b = new Blob([resp.body], {type: 'text/tsv;charset=utf-8'});
                                // saveAs(b, filename + '.tsv');

                                // OPTION 3 - process and save as csv/tsv
                                var dt = resp.body.data.map(function (d) {
                                    return [
                                        d.target.id,
                                        d.target.gene_info.symbol,
                                        d.disease.id,
                                        d.disease.efo_info.label,
                                        d.evidence.literature_ref.lit_id,
                                        d.evidence.literature_ref.lit_id.split('/').pop()
                                    ].join('\t');
                                }).join('\n');
                                dt = (opts.fields.join('\t') + '\tpmid\n' ) + dt;

                                saveAs(
                                    new Blob([dt], {type: 'text/tsv;charset=utf-8'}),
                                    filename + '.tsv'
                                );
                            })
                            .finally(function () {
                                scope.ext.isLoading = false;
                            });
                    };
                }
            };
        }]);
