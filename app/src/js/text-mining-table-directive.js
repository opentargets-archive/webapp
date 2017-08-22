angular.module('cttvDirectives')
    .directive('textMiningTable', ['$log',
        'cttvAPIservice',
        'cttvUtils',
        '$timeout',
        'cttvConfig',
        'cttvConsts',
        'cttvDictionary',
        'upperCaseFirstFilter',
        'clearUnderscoresFilter',
        '$q',
        function ($log,
            cttvAPIservice,
            cttvUtils,
            $timeout,
            cttvConfig,
            cttvConsts,
            cttvDictionary,
            upperCaseFirst,
            clearUnderscores,
            $q) {
            'use strict';

            var draw = 1;

            function getMatchedSentences(data) {
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
                        }
                        else {//title
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
                    }
                    else {
                        count[sentence.section]++;
                    }
                });

                return count;
            };

            // group sentences in each section into one sentence
            var prepareSectionSentences = function (sentences) {
                var sectionSentenceMap = {};
                sentences.map(function (sentence) {

                    if (sentence.section != 'abstract') {
                        if (sectionSentenceMap[sentence.section] === undefined) {
                            sectionSentenceMap[sentence.section] = '';
                            sectionSentenceMap[sentence.section] += '<li>' + sentence.formattedText + '</li>';
                        }
                        else {
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
                    }
                    else {
                        sectionSentenceMap[sentence.section] += ' ' + sentence.formattedText + ' ';
                    }
                });

                return sectionSentenceMap;
            };


            function parseServerResponse(data) {
                var newData = [];

                var accessLevelPrivate = '<span class=\'cttv-access-private\' title=\'private data\'></span>'; //"<span class='fa fa-users' title='private data'>G</span>";
                var accessLevelPublic = '<span class=\'cttv-access-public\' title=\'public data\'></span>'; //"<span class='fa fa-users' title='public data'>P</span>";
                var cat_list = ['title', 'intro', 'result', 'discussion', 'conclusion', 'other'];   // preferred sorting order

                function formatAuthor(author) {
                    return author.short_name;
                }

                for (var i = 0; i < data.length; i++) {
                    var d = data[i];
                    var row = [];

                    // 0 - Access level
                    row.push((d.access_level == cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate);

                    // 1 - Disease label
                    row.push(d.disease.efo_info.label);

                    // 2 Publication ID (hidden)
                    var parts = d.evidence.literature_ref.lit_id.split('/');
                    var pubmedId = parts.pop();
                    row.push(pubmedId);

                    // Authors formatting
                    var authorStr = '(No authors provided)';
                    if (d.literature.authors) {
                        authorStr = formatAuthor(d.literature.authors[0]);
                        if (d.literature.authors.length > 2) {
                            authorStr += ' <i>et al</i>';
                        } else if (d.literature.authors.length === 2) {
                            authorStr += ' and ' + formatAuthor(d.literature.authors[1]);
                        }
                        authorStr += '.';
                    }

                    // 3 - Abstract
                    if (!d.literature.title && !d.literature.abstract && !d.literature.journal_data) {
                        row.push('N/A');
                    } else {
                        var abstractSentences = getMatchedSentences(d);
                        var abstractSection = 'Abstract';
                        var abstractText = d.literature.abstract || 'Not abstract supplied.';
                        var abstract = '<div id=\'' + pubmedId + abstractSection + '\'>' + abstractText + '</div>';

                        var abstractString = '<p class=\'small\'><span onclick=\'angular.element(this).scope().displaySentences("' + pubmedId + abstractSection + '")\'style=\'cursor:pointer\'><i class=\'fa fa-chevron-circle-down\' aria-hidden=\'true\'></i>&nbsp;<span class=\'bold\'>Abstract</span></p>';
                        // var matchedSentences = $('#literature-table').DataTable().row(rowIdx).data()[5]; //this is details

                        var title = d.literature.title || '';
                        // var abstractSentences;
                        //
                        // if ($scope.search.tables.literature.abstractSentences[data[2]][data[6]]) {
                        //     abstractSentences = $scope.search.tables.literature.abstractSentences[data[2]][data[6]][data[7]];
                        // }
                        if (abstractSentences && abstract) {

                            abstractSentences.map(function (f) {
                                var pos = abstract.indexOf(f.raw);
                                //abstract = abstract.replace(f.raw, f.formattedHighlighted);
                                abstract = abstract.replace(f.raw, f.formatted);

                                // If not in the abstract, try the title
                                if (pos === -1) {
                                    pos = title.indexOf(f.raw);
                                    title = title.replace(f.raw, f.formatted);
                                }
                            });

                        }
                        // var journalVolume = d.journalInfo.volume ? d.journalInfo.volume : "";
                        // var journalIssue = d.journalInfo.issue ? "(" + d.journalInfo.issue + ")" : "";
                        // var pageInfo = d.pageInfo ? ":" + d.pageInfo : "";
                        // var journalInfo = (d.journalInfo.journal.medlineAbbreviation || d.journalInfo.journal.title) + " " + journalVolume + journalIssue + pageInfo;
                        var journalInfo = (d.literature.journal_data.medlineAbbreviation || d.literature.journal_data.title || '');
                        if (!journalInfo) {
                            journalInfo = '';
                        }

                        journalInfo += ' ' + d.literature.journal_reference;

                        var titleAndSource = '<span class=large><a href=\'#\' onClick=\'angular.element(this).scope().openEuropePmc(' + pubmedId + ')\'>' + title + '</a></span>'
                            + '<br />'
                            + '<span class=small>' + authorStr + ' ' + journalInfo + '</span>';

                        // PMID
                        var pmidStr = '<span style="color:#aaaaaa">PMID: ' + pubmedId + '</span>';

                        // matched sentences
                        d.evidence.literature_ref.mined_sentences.sort(function (a, b) {
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

                            var section = upperCaseFirst(clearUnderscores(sent.section));
                            var sentenceString = '';
                            if (section != 'Title' && section != 'Abstract') {

                                if (previousSection != sent.section) {
                                    if (previousSection != null) { //this is not the first section with matched sentences
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


                        row.push(titleAndSource + '<br/>' + pmidStr + '<br/><br/>' + abstractString + abstract + ' <p class=small>' + (matchedSentences || 'no matches available') + '</p>');

                    }

                    // row.push(d.literature.abstract || "");

                    // 4 - Year
                    var date = d.literature.date;
                    var year = 'N/A';
                    if (date) {
                        year = moment(date).year();
                    }
                    row.push(year);

                    // TODO: Export has been disabled, so these fields are not in use at the moment. Revise and if they are not needed anymore change the table
                    // 5 - Title
                    row.push(d.literature.title || '');

                    // 6 -- Authors
                    row.push('');

                    // 7 -- Journal
                    row.push('');

                    // 8 -- Abstract
                    row.push('');

                    // 9 -- Matches
                    row.push('');

                    // 10 -- URL
                    row.push('');

                    newData.push(row);
                }

                return newData;
            }

            var setupTable = function (table, target, disease, filename, download) {
                return $(table).DataTable({
                    'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',
                    // TODO: We are disabling the download for now because there may be too many items
                    'buttons': [
                        {
                            text: '<span class=\'fa fa-download\' title=\'Download as CSV (max 200 articles)\'></span>',
                            action: download
                        }
                    ],
                    // "buttons": [],
                    'processing': false,
                    'searching': false,
                    'serverSide': true,
                    'autoWidth': false,
                    'ajax': function (data, cbak, params) {
                        // order options
                        // mappings:
                        // 0 => access level
                        // 1 => Disease
                        // 2 => Pubmed Id (hidden)
                        // 3 => Abstract
                        // 4 => Year
                        // 5 => Title (hidden -- used for export)
                        // 6 => Authors (hidden -- used for export)
                        // 7 => Journal (hidden -- used for export)
                        // 8 => Abstract (hidden -- used for export)
                        // 9 => Matches (hidden -- used for export)
                        // 10 => URL (hidden -- used for export)
                        var mappings = {
                            1: 'disease.efo_info.label',
                            4: 'literature.date'
                        };

                        // We save the order condition for the server side rendering to use it for the download
                        dirScope.order = [];
                        for (var i = 0; i < data.order.length; i++) {
                            var prefix = data.order[i].dir === 'asc' ? '~' : '';
                            dirScope.order.push(prefix + mappings[data.order[i].column]);
                        }

                        var opts = {
                            target: target,
                            disease: disease,
                            datasource: cttvConfig.evidence_sources.literature,
                            size: data.length,
                            from: data.start,
                            sort: dirScope.order,
                            search: data.search.value,
                            draw: draw
                        };
                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };
                        cttvAPIservice.getFilterBy(queryObject)
                            .then(function (resp) {
                                var dtData = parseServerResponse(resp.body.data);
                                var o = {
                                    recordsTotal: resp.body.total,
                                    recordsFiltered: resp.body.total,
                                    data: dtData,
                                    draw: draw
                                };
                                draw++;
                                cbak(o);
                            });
                    },
                    'ordering': true,
                    'order' : [[4, 'desc']],
                    'orderMulti': false,
                    'columnDefs': [
                        {
                            'targets': [2, 5, 6, 7, 8, 9, 10],
                            'visible': false
                        },
                        {
                            'targets': [4],
                            'orderSequence': ['desc', 'asc']
                        },
                        {
                            'targets': [1],
                            'orderSequence': ['asc', 'desc']
                        },
                        {
                            'targets': [3],
                            'orderable': false
                        },
                        {
                            'targets': [0],    // the access-level (public/private icon)
                            'visible': cttvConfig.show_access_level,
                            'width': '3%'
                        },
                        {
                            'targets': [1], //disease?
                            'width': '12%'
                        }
                    ]
                }, (filename + '-text_mining'));
            };

            var dirScope;

            return {
                restrict: 'EA',
                templateUrl: 'src/partials/text-mining-table.html',
                scope: {
                    target: '=',
                    disease: '=',
                    filename: '='
                },
                link: function (scope, elem, attrs) {
                    dirScope = scope;
                    scope.openEuropePmc = function (pmid) {
                        var URL = 'http://europepmc.org/abstract/MED/' + pmid;
                        window.open(URL);
                    };

                    scope.displaySentences = function (id) {
                        //make the collapse content to be shown or hide
                        $('#' + id).toggle('fast');
                    };

                    scope.$watchGroup(['target', 'disease', 'filename'], function (vals) {
                        if (!scope.target || !scope.disease || !scope.filename) {
                            return;
                        }
                        $timeout(function () {
                            setupTable(document.getElementById('literature2-table'), scope.target, scope.disease, scope.filename, scope.downloadTable);
                        }, 0);
                        // setupTable();
                    });

                    // TODO: If we move all the evidence tables to server side, this should be abstracted out probably in a service
                    scope.downloadTable = function () {
                        var size = 200;
                        var opts = {
                            disease: scope.disease,
                            target: scope.target,
                            datasource: cttvConfig.evidence_sources.literature,
                            // format: 'csv',
                            size: size,
                            from: 0,
                            sort: dirScope.order,
                            fields: ['disease.efo_info.label', 'literature.references', 'literature.title', 'literature.authors']
                        };

                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };

                        cttvAPIservice.getFilterBy(queryObject)
                            .then (function (resp) {
                                var totalText = 'disease,publication id,title,authors\n';
                                var data = resp.body.data;
                                for (var i=0; i<data.length; i++) {
                                    var d = data[i];
                                    var row = [];
                                    // Disease
                                    row.push(d.disease.efo_info.label);
                                    // Publication id
                                    row.push(d.literature.references[0].lit_id.split('/').pop());
                                    // title
                                    row.push('\"' + d.literature.title + '\"');
                                    // Authors
                                    var authorsStr = '';
                                    if (d.literature.authors) {
                                        var authors = d.literature.authors.map(function (k) {
                                            return k.short_name;
                                        });
                                        authorsStr = '\"' + authors.join(', ') + '\"';
                                    }
                                    row.push(authorsStr);

                                    totalText += row.join(',');
                                    totalText += '\n';
                                }
                                var b = new Blob([totalText], {type: 'text/csv;charset=utf-8'});
                                saveAs(b, scope.filename + '.csv');
                            });

                        // First make a call to know how many rows there are:
                        // var optsPreFlight = {
                        //     disease: scope.disease,
                        //     target: scope.target,
                        //     size: 0,
                        //     datasource: cttvConfig.evidence_sources.literature,
                        //
                        // };
                        // var queryObject = {
                        //     method: 'GET',
                        //     params: optsPreFlight
                        // };
                        // cttvAPIservice.getFilterBy(queryObject)
                        //     .then (function (resp) {
                        //         var total = resp.body.total;
                        //
                        //         var promise = $q(function (resolve) {
                        //             resolve("");
                        //         });
                        //         var totalText = "";
                        //         var promises = [];
                        //         for (var i=0; i<total; i+=size) {
                        //             promises.push({
                        //                 from: i,
                        //                 total: size
                        //             });
                        //         }
                        //         promises.forEach (function (p) {
                        //             promise = promise.then (function () {
                        //                 return getNextChunk(p.total, p.from);
                        //             })
                        //         });
                        //         promise.then (function (res) {
                        //             var b = new Blob ([totalText], {type: "text/csv;charset=utf-8"});
                        //             saveAs(b, scope.filename + ".csv");
                        //         });
                        //
                        //         function getNextChunk(size, from) {
                        //             var opts = {
                        //                 disease: scope.disease,
                        //                 target: scope.target,
                        //                 datasource: cttvConfig.evidence_sources.literature,
                        //                 format: "csv",
                        //                 size: size,
                        //                 from: from
                        //             };
                        //
                        //             var queryObject = {
                        //                 method: 'GET',
                        //                 params: opts
                        //             };
                        //
                        //             return cttvAPIservice.getFilterBy(queryObject)
                        //                 .then(function (resp) {
                        //                     var moreText = resp.body;
                        //                     if (from > 0) {
                        //                         // Not in the first page, so remove the header row
                        //                         moreText = moreText.split("\n").slice(1).join("\n");
                        //                     }
                        //                     totalText += moreText;
                        //                 });
                        //         }
                        //
                        //     });
                    };

                }
            };
        }])
;