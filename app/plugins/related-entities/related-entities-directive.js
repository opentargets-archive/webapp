angular.module('otPlugins')
    .directive('otRelatedTargets', [function () {
        'use strict';
        return {
            restrict: 'E',
            templateUrl: 'plugins/related-entities/related-targets.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope) {
                scope.entitySymbol = scope.target.symbol;
                scope.entity = 'target';
            }
        }
    }]);

angular.module('otPlugins')
    .directive('otRelatedDiseases', [function () {
        'use strict';
        return {
            restrict: 'E',
            templateUrl: 'plugins/related-entities/related-diseases.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope) {
                scope.entitySymbol = scope.disease.label;
                scope.entity = 'disease';
            }
        }
    }]);

angular.module('otDirectives')
    .directive('otRelatedDiseasesOverview', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                width: '=',
                related: '=',
                disease: '='
            },
            link: function (scope, element) {
                scope.entities = 'diseases';
                scope.otherEntities = 'targets';
                scope.entitySymbol = scope.disease.label;

                var id = scope.disease.efo;
                var opts = {
                    id: id
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getDiseaseRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.disease.label, scope.entities);

                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);

// angular.module('otDirectives')
//     .directive('otSubject2Object', ['otUtils', 'otConsts', function (otUtils, otConsts) {
//         'use strict';
//         var color = '#377bb5';
//
//         return {
//             restrict: 'E',
//             template: '<div>Top diseases associated with blah, blah and blah, blah</div>' +
//                       '<div></div>' +
//                       '<ot-matrix-legend style="float:right" legend-text="legendText" colors="colors" layout="h"></ot-matrix-legend>',
//             scope: {
//                 subject: '=',
//                 object: '=',
//                 shared: '=',
//                 entity: '=',
//                 width: '='
//             },
//             link: function (scope, el) {
//                 scope.$watchGroup(['subject', 'object', 'shared'], function() {
//                     if (!scope.subject || !scope.object || !scope.shared) {
//                         return;
//                     }
//
//                     console.log(scope.subject);
//                     console.log(scope.object);
//                     console.log(scope.shared);
//
//                     var shared = scope.shared.sort(function (a, b) {
//                         if (scope.entity === 'target') {
//                             return (b[scope.subject.approved_symbol].score + b[scope.object.name].score) -
//                                 (a[scope.subject.approved_symbol].score + a[scope.object.name].score);
//                         } else {
//                             return (b[scope.subject.label].score + b[scope.object.label].score) -
//                                 (a[scope.subject.label].score + a[scope.object.label].score)
//
//                         }
//                     });
//
//                     var container = el[0].getElementsByTagName('div')[1];
//                     d3.select(container).selectAll('*').remove();
//
//                     var width = scope.width / 2;
//                     var topOffset = 30;
//                     var height = (shared.length * 30);
//                     var svg = d3.select(container)
//                         .append('svg')
//                         .attr('width', width)
//                         .attr('height', height + topOffset)
//                         .append('g')
//                         .attr('transform', 'translate(0, ' + topOffset + ')');
//
//                     var subjSymbol = scope.entity === 'target' ? scope.subject.approved_symbol : scope.subject.label; // ???
//                     var subjId = scope.entity === 'target' ? scope.subject.ensembl_gene_id : scope.subject.efo; // ???
//                     var objSymbol = scope.entity === 'target' ? scope.object.name : scope.object.label; // ???
//                     var objId = scope.entity === 'target' ? scope.object.geneId : scope.object.efo; // ???
//
//
//                     // Dimensions of the plot...
//                     // <- 20% -> <- 5% -> <---- 50% ---> <- 5% -> <- 20% ->
//                     var labelPerc, bracesPerc, linksPerc;
//                     if (scope.entity === 'target') {
//                         labelPerc = 20;
//                         bracesPerc = 5;
//                         linksPerc = 50;
//                     } else {
//                         labelPerc = 35;
//                         bracesPerc = 5;
//                         linksPerc = 20;
//                     }
//
//                     var labelOffset = (labelPerc * width) / 100;
//                     var bracesOffset = (bracesPerc * width) / 100;
//                     var linksOffset = (linksPerc * width) / 100;
//
//                     // Links are plotted from 25% to 75%
//                     var linksG = svg
//                         .append('g')
//                         .attr('transform', 'translate(' + (labelOffset + bracesOffset + (linksOffset / 2)) + ', 0)');
//                     var linkNodes = linksG.selectAll('.linkNode')
//                         .data(shared)
//                         .enter()
//                         .append('g')
//                         .attr('class', 'linkNode')
//                         .attr('transform', function (d, i) {
//                             // initial positions
//                             // return 'translate(0,' + (i * 30) + ')';
//                             return 'translate(0,' + (height / 2) + ')';
//                         });
//
//                     var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig
//
//                     // actual links
//                     // hover tooltip on object / subject links
//                     // var linkTooltip;
//                     // function showLinkTooltip(t, d, score) {
//                     //     var obj = {};
//                     //     obj.header = '';
//                     //     obj.body = t + ' - ' + d + ' (score: ' + otUtils.floatPrettyPrint(score) + ')';
//                     //     linkTooltip = tooltip.plain()
//                     //         .width(180)
//                     //         .show_closer(false)
//                     //         .call(this, obj);
//                     // }
//
//                     function processFlowerData (data) {
//                         var fd = [];
//
//                         for (var i = 0; i < otConsts.datatypesOrder.length; i++) {
//                             var dkey = otConsts.datatypes[otConsts.datatypesOrder[i]];
//                             var key = otConsts.datatypesOrder[i];
//                             fd.push({
//                                 // "value": lookDatasource(data, otConsts.datatypes[key]).score,
//                                 'value': data ? data[dkey] : 0,
//                                 'label': otConsts.datatypesLabels[key],
//                                 'active': true
//                             });
//                         }
//                         return fd;
//                     }
//                     function showAssociationsTooltip(data) {
//                         console.log(data);
//                         var flowerDataSubj = processFlowerData(data[subjSymbol].datatypes);
//                         var flowerDataObj = processFlowerData(data[objSymbol].datatypes);
//
//                         var div = document.createElement('div');
//                         var leftDiv = d3.select(div)
//                             .style('width', '80%')
//                             .style('margin', 'auto')
//                             .append('div')
//                             .style('width', '50%')
//                             .style('float', 'left');
//                         leftDiv.append('h5')
//                             .text(subjSymbol);
//                         var flower1Div = leftDiv
//                             .append('a')
//                             .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
//                             .append('div');
//                         leftDiv.append('a')
//                             .attr('class', 'cttv_flowerLink')
//                             .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
//                             .append('div')
//                             .text('View evidence');
//
//
//                         var rightDiv = d3.select(div)
//                             .append('div')
//                             .style('margin-left', '50%');
//                         rightDiv.append('h5')
//                             .text(objSymbol);
//                         var flower2Div = rightDiv.append('div')
//                             .append('a')
//                             .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
//                             .append('div');
//                         rightDiv.append('a')
//                             .attr('class', 'cttv_flowerLink')
//                             .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
//                             .append('div')
//                             .text('View evidence');
//
//                         var flower1 = flowerView()
//                             .values(flowerDataSubj)
//                             .diagonal(140)
//                             .fontsize(8);
//                         flower1(flower1Div.node());
//
//                         var flower2 = flowerView()
//                             .values(flowerDataObj)
//                             .diagonal(140)
//                             .fontsize(8);
//                         flower2(flower2Div.node());
//
//                         var obj = {};
//                         obj.header = 'Associations with ' + data.label;
//                         obj.body = div.innerHTML;
//                         tooltip.plain()
//                             .id('flowersView')
//                             .width(300)
//                             .call(this, obj);
//                     }
//
//                     // subject
//                     linkNodes
//                         .append('line')
//                         .attr('x1', -linksOffset / 2)
//                         .attr('x2', 0)
//                         .attr('y1', 0)
//                         .attr('y2', 0)
//                         .style('stroke-width', '2px')
//                         .style('stroke', function (d) {
//                             return colorScale(d[subjSymbol].score);
//                         // })
//                         // .on('mouseover', function (d) {
//                         //     showLinkTooltip.call(this, scope.target.approved_symbol, d.label, d[scope.target.approved_symbol].score)
//                         // })
//                         // .on('mouseout', function () {
//                         //     linkTooltip.close();
//                         });
//
//                     // object
//                     linkNodes
//                         .append('line')
//                         .attr('x1', 0)
//                         .attr('x2', linksOffset / 2)
//                         .attr('y1', 0)
//                         .attr('y2', 0)
//                         .style('stroke-width', '2px')
//                         .style('stroke', function (d) {
//                             return colorScale(d[objSymbol].score);
//                         // })
//                         // .on('mouseover', function (d) {
//                         //     showLinkTooltip.call(this, scope.related.name, d.label, d[scope.related.name].score)
//                         // })
//                         // .on('mouseout', function () {
//                         //     linkTooltip.close();
//                         });
//
//                     // labels for links
//                     linkNodes
//                         .append('text')
//                         .attr('x', 0)
//                         .attr('y', -8)
//                         .attr('text-anchor', 'middle')
//                         .attr('fill', '#666666')
//                         .style('opacity', 0)
//                         .style('cursor', 'pointer')
//                         .style('font-size', '0.9em')
//                         .text(function (d) {
//                             return d.label;
//                         })
//                         .on('click', showAssociationsTooltip);
//
//
//                     // nodes for links
//                     linkNodes
//                         .append('circle')
//                         .attr('cx', 0)
//                         .attr('cy', 0)
//                         .attr('r', 5)
//                         .attr('fill', color)
//                         .style('cursor', 'pointer')
//                         .on('click', showAssociationsTooltip);
//
//                     var linksTransition = linkNodes
//                         .transition()
//                         .duration(1000)
//                         .delay(function (d, i) {
//                             return i*100;
//                         })
//                         .attr('transform', function (d, i) {
//                             return 'translate(0,' + (i * 30) + ')';
//                         });
//                     linksTransition.select('text')
//                         .style('opacity', 1);
//
//
//                     // braces1
//                     var braces1 = svg
//                         .append('g')
//                         .attr('transform', 'translate(' + (labelOffset) + ',0)');
//                     braces1.selectAll('.braces1')
//                         .data(shared)
//                         .enter()
//                         .append('path')
//                         .attr('d', function (d, i) {
//                             // return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
//                             return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (bracesOffset) + ',' + (height / 2);
//                         })
//                         .attr('fill', 'none')
//                         .style('stroke-width', '2px')
//                         .attr('stroke', function (d) {
//                             return colorScale(d[subjSymbol].score);
//                         });
//                     braces1
//                         .selectAll('path')
//                         .transition()
//                         .duration(1000)
//                         .delay(function (d, i) {
//                             return i*100;
//                         })
//                         .attr('d', function (d, i) {
//                             return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
//                         });
//
//                     // braces2
//                     var braces2 = svg
//                         .append('g')
//                         .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset) + ',0)');
//                     braces2.selectAll('.braces2')
//                         .data(shared)
//                         .enter()
//                         .append('path')
//                         .attr('d', function (d, i) {
//                             // return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
//                             return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (-bracesOffset) + ',' + (height / 2);
//                         })
//                         .attr('fill', 'none')
//                         .style('stroke-width', '2px')
//                         .attr('stroke', function (d) {
//                             return colorScale(d[objSymbol].score);
//                         });
//                     braces2
//                         .selectAll('path')
//                         .transition()
//                         .duration(1000)
//                         .delay(function (d, i) {
//                            return i*100;
//                         })
//                         .attr('d', function (d, i) {
//                             return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
//                         });
//
//                     // Entity nodes
//                     var ent1G = svg
//                         .append('g')
//                         .attr('transform', 'translate(' + (labelOffset - 5) + ',' + (height / 2) + ')');
//                     ent1G
//                         .append('circle')
//                         .attr('cx', 0)
//                         .attr('cy', 0)
//                         .attr('r', 5)
//                         .attr('fill', color);
//                     ent1G
//                         .append('text')
//                         .attr('x', -5)
//                         .attr('y', 0)
//                         .attr('text-anchor', 'end')
//                         .attr('alignment-baseline', 'middle')
//                         .attr('fill', '#666666')
//                         .text(subjSymbol);
//
//                     var ent2G = svg
//                         .append('g')
//                         .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset + 5) + ',' + (height / 2) + ')');
//                     ent2G
//                         .append('circle')
//                         .attr('cx', 0)
//                         .attr('cy', 0)
//                         .attr('r', 5)
//                         .attr('fill', color);
//                     ent2G
//                         .append('text')
//                         .attr('x', 5)
//                         .attr('y', 0)
//                         .attr('text-anchor', 'start')
//                         .attr('alignment-baseline', 'middle')
//                         .attr('fill', '#666666')
//                         .text(objSymbol);
//
//                     scope.shared = undefined;
//
//                     // legend
//                     scope.legendText = 'Score';
//                     scope.colors = [];
//                     for (var i = 0; i <= 100; i += 25) {
//                         var j = i / 100;
//                         // scope.labs.push(j);
//                         scope.colors.push({color: colorScale(j), label: j});
//                     }
//                     scope.legendData = [
//                         // {label:"Therapeutic Area", class:"no-data"}
//                     ];
//
//                 })
//             }
//         };
//     }]);

// angular.module('otDirectives')
//     .directive('otRelatedEntityDetails', ['otApi', '$q', function (otApi, $q) {
//         'use strict';
//
//         return {
//             restrict: 'E',
//             template: '<ot-subject-2-object subject="subject" object="object" shared="shared" entity="entity" width="width"></ot-subject-2-object>',
//             scope: {
//                 subject: '=',
//                 object: '=',
//                 width: '=',
//                 entity: '='
//             },
//             link: function (scope) {
//                 scope.$watch('object', function () {
//                     if (scope.object) {
//                         console.log(scope.entity);
//                         console.log(scope.subject);
//                         console.log(scope.object);
//
//                         var subjId = (scope.entity === 'target' ? scope.subject.ensembl_gene_id : scope.subject.efo);
//                         var objId = (scope.entity === 'target' ? scope.object.geneId : scope.object.efo);
//                         var subjSymbol = (scope.entity === 'target' ? scope.subject.approved_symbol : scope.subject.label); // ??
//                         var objSymbol = (scope.entity === 'target' ? scope.object.name : scope.object.label); // ??
//
//                         console.log(subjId + ', ' + objId + ', ' + subjSymbol + ', ' + objSymbol);
//
//                         // Get the best 10 diseases|targets for target1|disease1 and any of the shared diseases|targets...
//                         var optsSubj;
//                         var optsObj;
//                         if (scope.entity === 'target') {
//                             optsSubj = {
//                                 target: [subjId],
//                                 disease: scope.object.shared,
//                                 size: 10
//                             };
//                             optsObj = {
//                                 target: [objId],
//                                 disease: scope.object.shared,
//                                 size: 10
//                             };
//                         } else {
//                             optsSubj = {
//                                 target: scope.object.shared,
//                                 disease: [scope.subject.efo], // ??
//                                 size: 10
//                             };
//                             optsObj = {
//                                 target: scope.object.shared,
//                                 disease: [scope.object.efo], // ??
//                                 size: 10
//                             };
//                         }
//
//                         var querySubj = {
//                             method: 'POST',
//                             trackCall: false,
//                             params: optsSubj
//                         };
//
//                         var queryObj = {
//                             method: 'POST',
//                             trackCall: false,
//                             params: optsObj
//                         };
//
//
//                         var subjPromise = otApi.getAssociations(querySubj);
//                         var objPromise = otApi.getAssociations(queryObj);
//                         $q.all([subjPromise, objPromise])
//                             .then(function (resps) {
//                                 var shared = {};
//                                 // var diseases = {};
//                                 var missingShared = {};
//                                 // var missingDiseases = {};
//
//                                 missingShared[subjId] = {};
//                                 missingShared[objId] = {};
//                                 resps[0].body.data.map(function (d) {
//                                     var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
//                                     var sharedId = (scope.entity === 'target' ? d.disease.id : d.target.id);
//
//                                     // var disLabel = d.disease.efo_info.label;
//                                     shared[sharedLabel] = {
//                                         id: sharedId,
//                                         label: sharedLabel
//                                     };
//                                     shared[sharedLabel][subjSymbol] = {
//                                         id: subjId,
//                                         label: subjSymbol,
//                                         score: d.association_score.overall,
//                                         datatypes: d.association_score.datatypes
//                                     };
//                                     // record this disease as a possible missing disease for the object
//                                     missingShared[objId][sharedId] = true;
//                                     shared[sharedLabel][objSymbol] = {
//                                         id: objId,
//                                         label: objSymbol,
//                                         // score is set to 0 here and to the real score in the next map
//                                         score: 0
//                                     };
//                                 });
//
//                                 resps[1].body.data.map(function (d) {
//                                     var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
//                                     var sharedId = (scope.entity === 'target' ? d.disease.id : d.target.id);
//
//                                     // check if this shared entity has already been set in the prev map
//                                     if (shared[sharedLabel]) {
//                                         delete missingShared[objId][sharedId];
//                                         shared[sharedLabel][objSymbol].score = d.association_score.overall;
//                                         shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes;
//                                     } else {
//                                         // If not already in the shared object
//                                         missingShared[subjId][sharedId] = true;
//                                         shared[sharedLabel] = {
//                                             id: sharedId,
//                                             label: sharedLabel
//                                         };
//                                         shared[sharedLabel][objSymbol] = {
//                                             id: objId,
//                                             label: objSymbol,
//                                             score: d.association_score.overall,
//                                             datatypes: d.association_score.datatypes
//                                         };
//                                         shared[sharedLabel][subjSymbol] = {
//                                             id: subjId,
//                                             label: subjSymbol,
//                                             score: 0
//                                         };
//                                     }
//                                     // return d.disease.efo_info.label;
//                                 });
//
//                                 // Search for the missing diseases in both targets...
//                                 // create mock promises in case we don't have missing diseases for any of them
//                                 var missingSubjPromise = $q(function (resolve) {
//                                    resolve ({
//                                        body: {
//                                            data: []
//                                        }
//                                    });
//                                 });
//                                 var missingObjPromise = $q(function (resolve) {
//                                     resolve ({
//                                         body: {
//                                             data: []
//                                         }
//                                     });
//                                 });
//                                 if (Object.keys(missingShared[subjId])) {
//                                     var optsMissingSubj = {
//                                         target: (scope.entity === 'target' ? [subjId] : Object.keys(missingShared[subjId])),
//                                         disease: (scope.entity === 'target' ? (Object.keys(missingShared[subjId])) : [subjId])
//                                     };
//                                     var queryMissingSubj = {
//                                         method: 'POST',
//                                         trackCall: false,
//                                         params: optsMissingSubj
//                                     };
//                                     missingSubjPromise = otApi.getAssociations(queryMissingSubj);
//                                 }
//
//                                 if (Object.keys(missingShared[objId])) {
//                                     var optsMissingObj = {
//                                         target: (scope.entity === 'target' ? [objId] : Object.keys(missingShared[objId])),
//                                         disease: (scope.entity === 'target' ? Object.keys(missingShared[objId]) : [objId])
//                                     };
//                                     var queryMissingObj = {
//                                         method: 'POST',
//                                         trackCall: false,
//                                         params: optsMissingObj
//                                     };
//                                     missingObjPromise = otApi.getAssociations(queryMissingObj);
//                                 }
//
//                                 $q.all([missingSubjPromise, missingObjPromise])
//                                     .then (function (resps) {
//                                         resps[0].body.data.map(function (d) {
//                                             // var disLabel = d.disease.efo_info.label;
//                                             var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
//
//                                             shared[sharedLabel][subjSymbol].score = d.association_score.overall;
//                                             shared[sharedLabel][subjSymbol].datatypes = d.association_score.datatypes;
//                                         });
//                                         resps[1].body.data.map(function (d) {
//                                             // var disLabel = d.disease.efo_info.label;
//                                             var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
//                                             shared[sharedLabel][objSymbol].score = d.association_score.overall;
//                                             shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes
//                                         });
//
//                                         // convert diseases from object to array
//                                         var sharedArr = [];
//                                         for (var shared1 in shared) {
//                                             if (shared.hasOwnProperty(shared1)) {
//                                                 sharedArr.push(shared[shared1]);
//                                             }
//                                         }
//
//                                         scope.shared = sharedArr;
//                                     });
//
//                             });
//                     }
//                 });
//             }
//         };
//     }]);

angular.module('otDirectives')
    .directive('otRelatedDiseasesVis', ['otApi', '$q', 'otUtils', 'otConsts', function (otApi, $q, otUtils, otConsts) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                disease: '=',
                related: '=',
                width: '='
            },
            link: function (scope, element) {
                scope.entitiesType = 'disease';
                scope.api = otApi;
                scope.utils = otUtils;
                scope.consts = otConsts;
                scope.q = $q;

                var id = scope.disease.efo;
                var opts = {
                    id: id
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getTargetRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createVis(container, resp.body.data, scope);

                            // createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);


angular.module('otDirectives')
    .directive('otRelatedTargetsVis', ['otApi', '$q', 'otUtils', 'otConsts', function (otApi, $q, otUtils, otConsts) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                target: '=',
                related: '=',
                width: '='
            },
            link: function (scope, element) {
                scope.entitiesType = 'target';
                scope.api = otApi;
                scope.utils = otUtils;
                scope.consts = otConsts;
                scope.q = $q;

                var id = scope.target.id;
                var opts = {
                    id: id,
                    size: 20
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getTargetRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createVis(container, resp.body.data, scope);

                            // createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);


// angular.module('otDirectives')
//     .directive('otRelatedTargetsOverview', ['otApi', function (otApi) {
//         'use strict';
//
//         return {
//             restrict: 'E',
//             template: '<div></div>',
//             scope: {
//                 target: '=',
//                 related: '=',
//                 width: '='
//             },
//             link: function (scope, element) {
//                 scope.entities = 'targets';
//                 scope.otherEntities = 'diseases';
//                 scope.entitySymbol = scope.target.symbol;
//
//                 var id = scope.target.id;
//                 var opts = {
//                     id: id
//                 };
//                 var queryObject = {
//                     method: 'GET',
//                     params: opts
//                 };
//                 otApi.getTargetRelation(queryObject)
//                     .then(
//                         // success
//                         function (resp) {
//                             // var container = document.getElementById('ot-relations-plot');
//                             var container = element[0];
//                             createRelationsTree(container, resp.body.data, scope);
//                             // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
//                         },
//
//                         // error handler
//                         otApi.defaultErrorHandler
//                     );
//             }
//         };
//     }]);

function resetBubbles() {

}

function createVis(container, data, scope) {
    var maxWidth = 600;
    var width = scope.width > maxWidth ? maxWidth : (scope.width * 0.9);
    var subject = scope.entitySymbol;
    var entitiesType = scope.entitiesType; // "target" | "disease"

    var treeData = getTreeData(subject, data, entitiesType);

    var pack = d3.layout.pack()
        .size([width, width])
        .sort(null)
        .padding(10)
        .value(function (d) {
            return d.shared_count;
        });
    var nodes = pack(treeData);
    var svg = d3.select(container)
        .append('div')
        .style('position', 'relative')
        .append('svg')
        .attr('width', width)
        .attr('height', width)
        .append('g');

    resetBubbles();

    var bubbles = svg.selectAll('.relatedBubbles')
        .data(nodes, function (d) {
            return d.id;
        })
        .enter()
        .append('g')
        .attr('class', function (d) {
            if (d.parent) {
                return 'relatedBubble';
            } else {
                return 'rootRelatedBubble';
            }
        });

    // initial bubbles in the center and not shown
    // hover tooltip on track bars
    var sharedHoverTooltip;
    function showSharedHoverTooltip(data) {
        // var obj = {};
        // obj.header = '';
        // obj.body = data.val + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared between ' + subject + ' and ' + data.name + '<br />Click to get details';
        // sharedHoverTooltip = tooltip.plain()
        //     .width(180)
        //     .show_closer(false)
        //     .call(this, obj)
        var obj = {};
        // obj.header = data.shared_count + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared between ' + gene + ' and ' + data.name;
        obj.header = '';

        var div = document.createElement('div');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text(data.object + ' - ' + data.object_counts + ' associated ' + (data.entities_type === 'target' ? 'diseases' : 'targets'));
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text(data.subject + ' - ' + data.subject_counts + ' associated ' + (data.entities_type === 'target' ? 'diseases' : 'targets'));
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text('Intersection - ' + data.shared_count + ' associated ' + (data.entities_type === 'target' ? 'diseases' : 'targets'));
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text('Union - ' + data.union_count + ' associated ' + (data.entities_type === 'target' ? 'diseases' : 'targets'));

        var container = d3.select(div)
            .append('div');

        var sets = [
            {sets: [data.subject], size: data.subject_counts},
            {sets: [data.object], size: data.object_counts},
            {sets: [data.subject, data.object], size: data.shared_count}
        ];

        var chart = venn.VennDiagram()
            .width(160)
            .height(160);
        container.datum(sets).call(chart);
        container.selectAll('.venn-circle path')
            .style('fill', '#b2def9')
            .style('stroke', '#005299')
            .style('stroke-width', '2px');
        container.selectAll('.venn-circle text')
            .style('fill', '#005299');


        obj.body = div.innerHTML;
        sharedHoverTooltip = tooltip.plain()
            .width(220)
            .show_closer(false)
            .call(this, obj);
    }

    function subject2objectData(object) {
        // var subjId = (scope.entity === 'target' ? scope.subject.ensembl_gene_id : scope.subject.efo);
        // var objId = (scope.entity === 'target' ? scope.object.geneId : scope.object.efo);
        // var subjSymbol = (scope.entity === 'target' ? scope.subject.approved_symbol : scope.subject.label); // ??
        // var objSymbol = (scope.entity === 'target' ? scope.object.name : scope.object.label); // ??

        var subjId = object.subject_id;
        var objId = object.object_id;
        var subjSymbol = object.subject;
        var objSymbol = object.object;

        // Get the best 10 diseases|targets for target1|disease1 and any of the shared diseases|targets...
        var optsSubj;
        var optsObj;
        if (object.entities_type === 'target') {
            optsSubj = {
                target: [subjId],
                disease: object.shared,
                size: 10
            };
            optsObj = {
                target: [objId],
                disease: object.shared,
                size: 10
            };
        } else {
            optsSubj = {
                target: object.shared,
                disease: [subjId],
                size: 10
            };
            optsObj = {
                target: object.shared,
                disease: [objId], // ??
                size: 10
            };
        }

        var querySubj = {
            method: 'POST',
            trackCall: false,
            params: optsSubj
        };

        var queryObj = {
            method: 'POST',
            trackCall: false,
            params: optsObj
        };

        var otApi = scope.api;
        var $q = scope.q;

        var subjPromise = otApi.getAssociations(querySubj);
        var objPromise = otApi.getAssociations(queryObj);
        $q.all([subjPromise, objPromise])
            .then(function (resps) {
                var shared = {};
                // var diseases = {};
                var missingShared = {};
                // var missingDiseases = {};

                missingShared[subjId] = {};
                missingShared[objId] = {};
                resps[0].body.data.map(function (d) {
                    var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                    var sharedId = (object.entities_type === 'target' ? d.disease.id : d.target.id);

                    // var disLabel = d.disease.efo_info.label;
                    shared[sharedLabel] = {
                        id: sharedId,
                        label: sharedLabel
                    };
                    shared[sharedLabel][subjSymbol] = {
                        id: subjId,
                        label: subjSymbol,
                        score: d.association_score.overall,
                        datatypes: d.association_score.datatypes
                    };
                    // record this disease as a possible missing disease for the object
                    missingShared[objId][sharedId] = true;
                    shared[sharedLabel][objSymbol] = {
                        id: objId,
                        label: objSymbol,
                        // score is set to 0 here and to the real score in the next map
                        score: 0
                    };
                });

                resps[1].body.data.map(function (d) {
                    var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                    var sharedId = (object.entities_type === 'target' ? d.disease.id : d.target.id);

                    // check if this shared entity has already been set in the prev map
                    if (shared[sharedLabel]) {
                        delete missingShared[objId][sharedId];
                        shared[sharedLabel][objSymbol].score = d.association_score.overall;
                        shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes;
                    } else {
                        // If not already in the shared object
                        missingShared[subjId][sharedId] = true;
                        shared[sharedLabel] = {
                            id: sharedId,
                            label: sharedLabel
                        };
                        shared[sharedLabel][objSymbol] = {
                            id: objId,
                            label: objSymbol,
                            score: d.association_score.overall,
                            datatypes: d.association_score.datatypes
                        };
                        shared[sharedLabel][subjSymbol] = {
                            id: subjId,
                            label: subjSymbol,
                            score: 0
                        };
                    }
                    // return d.disease.efo_info.label;
                });

                // Search for the missing diseases in both targets...
                // create mock promises in case we don't have missing diseases for any of them
                var missingSubjPromise = $q(function (resolve) {
                    resolve ({
                        body: {
                            data: []
                        }
                    });
                });
                var missingObjPromise = $q(function (resolve) {
                    resolve ({
                        body: {
                            data: []
                        }
                    });
                });
                if (Object.keys(missingShared[subjId])) {
                    var optsMissingSubj = {
                        target: (object.entities_type === 'target' ? [subjId] : Object.keys(missingShared[subjId])),
                        disease: (object.entities_type === 'target' ? (Object.keys(missingShared[subjId])) : [subjId])
                    };
                    var queryMissingSubj = {
                        method: 'POST',
                        trackCall: false,
                        params: optsMissingSubj
                    };
                    missingSubjPromise = otApi.getAssociations(queryMissingSubj);
                }

                if (Object.keys(missingShared[objId])) {
                    var optsMissingObj = {
                        target: (object.entities_type === 'target' ? [objId] : Object.keys(missingShared[objId])),
                        disease: (object.entities_type === 'target' ? Object.keys(missingShared[objId]) : [objId])
                    };
                    var queryMissingObj = {
                        method: 'POST',
                        trackCall: false,
                        params: optsMissingObj
                    };
                    missingObjPromise = otApi.getAssociations(queryMissingObj);
                }

                $q.all([missingSubjPromise, missingObjPromise])
                    .then (function (resps) {
                        resps[0].body.data.map(function (d) {
                            // var disLabel = d.disease.efo_info.label;
                            var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);

                            shared[sharedLabel][subjSymbol].score = d.association_score.overall;
                            shared[sharedLabel][subjSymbol].datatypes = d.association_score.datatypes;
                        });
                        resps[1].body.data.map(function (d) {
                            // var disLabel = d.disease.efo_info.label;
                            var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                            shared[sharedLabel][objSymbol].score = d.association_score.overall;
                            shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes
                        });

                        // convert diseases from object to array
                        var sharedArr = [];
                        for (var shared1 in shared) {
                            if (shared.hasOwnProperty(shared1)) {
                                sharedArr.push(shared[shared1]);
                            }
                        }

                        ///////
                        // Show the shared entities
                        function processFlowerData(data) {
                            var fd = [];
                            var otConsts = scope.consts;
                            for (var i = 0; i < otConsts.datatypesOrder.length; i++) {
                                var dkey = otConsts.datatypes[otConsts.datatypesOrder[i]];
                                var key = otConsts.datatypesOrder[i];
                                fd.push({
                                    // "value": lookDatasource(data, otConsts.datatypes[key]).score,
                                    'value': data ? data[dkey] : 0,
                                    'label': otConsts.datatypesLabels[key],
                                    'active': true
                                });
                            }
                            return fd;
                        }

                        function showAssociationsTooltip(data) {
                            var flowerDataSubj = processFlowerData(data[subjSymbol].datatypes);
                            var flowerDataObj = processFlowerData(data[objSymbol].datatypes);

                            var div = document.createElement('div');
                            var leftDiv = d3.select(div)
                                .style('width', '80%')
                                .style('margin', 'auto')
                                .append('div')
                                .style('width', '50%')
                                .style('float', 'left');
                            leftDiv.append('h5')
                                .text(subjSymbol);
                            var flower1Div = leftDiv
                                .append('a')
                                .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
                                .append('div');
                            leftDiv.append('a')
                                .attr('class', 'cttv_flowerLink')
                                .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
                                .append('div')
                                .text('View evidence');


                            var rightDiv = d3.select(div)
                                .append('div')
                                .style('margin-left', '50%');
                            rightDiv.append('h5')
                                .text(objSymbol);
                            var flower2Div = rightDiv.append('div')
                                .append('a')
                                .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
                                .append('div');
                            rightDiv.append('a')
                                .attr('class', 'cttv_flowerLink')
                                .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
                                .append('div')
                                .text('View evidence');

                            var flower1 = flowerView()
                                .values(flowerDataSubj)
                                .diagonal(140)
                                .fontsize(8);
                            flower1(flower1Div.node());

                            var flower2 = flowerView()
                                .values(flowerDataObj)
                                .diagonal(140)
                                .fontsize(8);
                            flower2(flower2Div.node());

                            var obj = {};
                            obj.header = 'Associations with ' + data.label;
                            obj.body = div.innerHTML;
                            tooltip.plain()
                                .id('flowersView')
                                .width(300)
                                .call(this, obj);
                        }

                        var bracesOffset = width / 12;
                        var labelOffset = (2 * (width / 12));
                        var linksOffset = 6 * (width / 12);
                        // var height = (sharedArr.length * 30);
                        var color = '#377bb5';
                        var vOffset = 20;

                        var detailsG = svg
                            .append('g')
                            .attr('class', 'detailsView')
                            .attr('transform', 'translate(0, ' + vOffset + ')');

                        var linksG = detailsG
                            .append('g')
                            .attr('transform', 'translate(' + (labelOffset + bracesOffset + (linksOffset / 2)) + ', 0)');
                        var linkNodes = linksG.selectAll('.linkNode')
                            .data(sharedArr)
                            .enter()
                            .append('g')
                            .attr('class', 'linkNode')
                            .attr('transform', 'translate(0,' + (width / 2) + ')');

                        var otUtils = scope.utils;
                        var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig

                        linkNodes
                            .append('line')
                            .attr('x1', -linksOffset / 2)
                            .attr('x2', 0)
                            .attr('y1', 0)
                            .attr('y2', 0)
                            .style('stroke-width', '2px')
                            .style('stroke', function (d) {
                                return colorScale(d[subjSymbol].score);
                            });

                        // object
                        linkNodes
                            .append('line')
                            .attr('x1', 0)
                            .attr('x2', linksOffset / 2)
                            .attr('y1', 0)
                            .attr('y2', 0)
                            .style('stroke-width', '2px')
                            .style('stroke', function (d) {
                                return colorScale(d[objSymbol].score);
                            });

                        // labels for links
                        linkNodes
                            .append('text')
                            .attr('x', 0)
                            .attr('y', -8)
                            .attr('text-anchor', 'middle')
                            .attr('fill', '#666666')
                            .style('opacity', 0)
                            .style('cursor', 'pointer')
                            .style('font-size', '0.9em')
                            .text(function (d) {
                                return d.label;
                            })
                            .on('click', showAssociationsTooltip);


                        // nodes for links
                        linkNodes
                            .append('circle')
                            .attr('cx', 0)
                            .attr('cy', 0)
                            .attr('r', 5)
                            .attr('fill', color)
                            .style('cursor', 'pointer')
                            .on('click', showAssociationsTooltip);

                        var linksTransition = linkNodes
                            .transition()
                            .duration(1000)
                            .delay(function (d, i) {
                                return i*100;
                            })
                            .attr('transform', function (d, i) {
                                return 'translate(0,' + i * (width / sharedArr.length) + ')';
                            });
                        linksTransition.select('text')
                            .style('opacity', 1);


                        // braces1
                        var braces1 = detailsG
                            .append('g')
                            .attr('transform', 'translate(' + (labelOffset) + ',0)');
                        braces1.selectAll('.braces1')
                            .data(sharedArr)
                            .enter()
                            .append('path')
                            .attr('d', function (d, i) {
                                // return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
                                return 'M0,' + (width / 2) + ' C' + (bracesOffset) + ',' + (width / 2) + ' 0,' + (width / 2) + ' ' + (bracesOffset) + ',' + (width / 2);
                            })
                            .attr('fill', 'none')
                            .style('stroke-width', '2px')
                            .attr('stroke', function (d) {
                                return colorScale(d[subjSymbol].score);
                            });
                        braces1
                            .selectAll('path')
                            .transition()
                            .duration(1000)
                            .delay(function (d, i) {
                                return i*100;
                            })
                            .attr('d', function (d, i) {
                                return 'M0,' + (width / 2) + ' C' + (bracesOffset) + ',' + (width / 2) + ' 0,' + ((i * width / sharedArr.length)) + ' ' + (bracesOffset) + ',' + ((i * width / sharedArr.length));
                            });

                        // braces2
                        var braces2 = detailsG
                            .append('g')
                            .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset) + ',0)');
                        braces2.selectAll('.braces2')
                            .data(sharedArr)
                            .enter()
                            .append('path')
                            .attr('d', function (d, i) {
                                // return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
                                return 'M0,' + (width / 2) + ' C' + (-bracesOffset) + ',' + (width / 2) + ' 0,' + (width / 2) + ' ' + (-bracesOffset) + ',' + (width / 2);
                            })
                            .attr('fill', 'none')
                            .style('stroke-width', '2px')
                            .attr('stroke', function (d) {
                                return colorScale(d[objSymbol].score);
                            });
                        braces2
                            .selectAll('path')
                            .transition()
                            .duration(1000)
                            .delay(function (d, i) {
                                return i*100;
                            })
                            .attr('d', function (d, i) {
                                return 'M0,' + (width / 2) + ' C' + (-bracesOffset) + ',' + (width / 2) + ' 0,' + ((i * width / sharedArr.length)) + ' ' + (-bracesOffset) + ',' + ((i * width / sharedArr.length));
                            });


                    });

            });
    }

    function clickedNode(data) {

        // Create a new node for the subject
        // 1 find the top level element to place this new node
        var topLevelElement = this.parentNode.parentNode;
        var subject = (scope.entitiesType === 'target' ? scope.target : scope.disease);
        var subjLabel = (scope.entitiesType === 'target' ? subject.approved_symbol : subject.label);
        var labelOffset = width / 12;

        // places for the subject and object:
        var subjX = labelOffset;
        var objX = width - labelOffset;

        // Fade out all not selected nodes
        d3.select(topLevelElement).selectAll('.relatedBubble')
            .transition()
            .duration(1000)
            .style('opacity',0)
            .each('end', function (d) {
                d3.select(this).style('display', 'none');
            });

        // Create a subject node
        var subjectNode = d3.select(topLevelElement)
            .append('g')
            .attr('class', 'relatedBubble');
        var subjCircleNode = subjectNode
            .append('circle')
            .attr('cx', - labelOffset)
            .attr('cy', (width / 2) + 20)
            .attr('r', labelOffset - 5);
        var subjLabelNode = subjectNode
            .append('text')
            .attr('x', - labelOffset)
            .attr('y', (width / 2) + 20)
            .text(getText(subjLabel, data.r - 5));

        // Move the subject to its place
        subjCircleNode
            .transition()
            .duration(1000)
            .attr('cx', subjX);
        subjLabelNode
            .transition()
            .duration(1000)
            .attr('x', subjX);

        // Create an object node
        var clickedNode = d3.select(this);
        var clickedNodeOrigX = clickedNode.attr('cx');
        var clickedNodeOrigY = clickedNode.attr('cy');
        var clickedNodeOrigR = clickedNode.attr('r');

        var objectNode = d3.select(topLevelElement)
            .append('g')
            .attr('class', 'relatedBubble');
        var objCircleNode = objectNode
            .append('circle')
            .attr('cx', clickedNodeOrigX)
            .attr('cy', clickedNodeOrigY)
            .attr('r', clickedNodeOrigR);
        var objLabelNode = objectNode
            .append('text')
            .attr('x', clickedNodeOrigX)
            .attr('y', clickedNodeOrigY)
            .text(getText(data.object, clickedNodeOrigR));

        // Move the object to its place
        objCircleNode
            .transition()
            .duration(1000)
            .attr('cx', objX)
            .attr('cy', (width / 2) + 20)
            .attr('r', labelOffset - 5);
        objLabelNode
            .transition()
            .duration(1000)
            .attr('x', objX)
            .attr('y', (width / 2) + 20)
            .each('end', function () {
                // Add a way to deselect the node
                var crossG = objectNode
                    .append('g')
                    .attr('transform', 'translate(' + (objX + labelOffset - 10) + ',' + ((width / 2) - labelOffset + 20) + ')')
                    .on('click', function () {
                        // Remove the details view (links between subject and object)
                        d3.selectAll('.detailsView').remove();

                        // Remove the X
                        d3.select(this).remove();

                        // Move the subject node out of sight and remove them
                        subjCircleNode
                            .transition()
                            .duration(1000)
                            .attr('cx', -labelOffset - 3)
                            .each('end', function () {
                                subjCircleNode.remove();
                            });
                        subjLabelNode
                            .transition()
                            .duration(1000)
                            .attr('x', -labelOffset - 3)
                            .each('end', function () {
                                subjLabelNode.remove();
                            });

                        // Move the object node to its original place
                        objCircleNode
                            .transition()
                            .duration(1000)
                            .attr('cx', clickedNodeOrigX)
                            .attr('cy', clickedNodeOrigY)
                            .attr('r', clickedNodeOrigR)
                            .each('end', function () {
                                // restore the interaction with the nodes
                                d3.selectAll('.relatedBubble')
                                    .style('display', 'block')
                                    .transition()
                                    .duration(1000)
                                    .style('opacity', 1)
                                    .each('end', function () {
                                        objCircleNode.remove();
                                        objLabelNode.remove()

                                    })
                            });
                        objLabelNode
                            .transition()
                            .duration(1000)
                            .attr('x', clickedNodeOrigX)
                            .attr('y', clickedNodeOrigY);
                    });
                // crossG
                //     .append('circle')
                //     .attr('cx', 0)
                //     .attr('cy', 0)
                //     .attr('r', 10);
                crossG
                    .append('line')
                    .attr('x1', -8)
                    .attr('y1', -8)
                    .attr('x2', 8)
                    .attr('y2', 8);
                crossG
                    .append('line')
                    .attr('x1', -8)
                    .attr('y1', 8)
                    .attr('x2', 8)
                    .attr('y2', -8);
            });

        subject2objectData(data);
    }

    var circles = bubbles
        .append('circle')
        .attr('cx', (width / 2))
        .attr('cy', (width / 2))
        .attr('r', 0)
        .style('opacity', '0')
        .on('mouseover', showSharedHoverTooltip)
        .on('mouseout', function () {
            sharedHoverTooltip.close();
        })
        .on('click', function (d) {
            sharedHoverTooltip.close();
            clickedNode.call(this, d);
        });

    function getText(d, r) {
        if (d) {
            var maxLength = r / 4;
            if (d.length > maxLength) {
                return d.substring(0, maxLength - 3) + '...';
            }
            return d;
        }
        return '';
    }
    // labels
    bubbles
        .append('text')
        .attr('x', function (d) {
            return d.x;
        })
        .attr('y', function (d) {
            return d.y;
        })
        .style('opacity', 0)
        .text(function (d) {
            return getText(d.object, d.r);
        });


    // move the bubbles to their place
    circles.transition()
        .duration(1000)
        .delay(function(d,i) {
            return i * 100;
        })
        .attr('cx', function (d) {
            return d.x;
        })
        .attr('cy', function (d) {
            return d.y;
        })
        .attr('r', function (d) {
            return d.r;
        })
        .style('opacity', 1)
        .each('end', function (d) {
            var siblings = this.parentNode.childNodes;
            siblings.forEach(function (node) {
                if (node.nodeName === 'text') {
                    d3.select(node)
                        .transition()
                        .duration(1000)
                        .style('opacity', 1);
                }
            });
        })
}


function getTreeData(gene, data, entitiesType) {
    var tree = {};
    tree.name = gene;
    tree.children = [];
    for (var i=0; i<data.length; i++) {
        var d = data[i];
        tree.children.push({
            name: d.object.label,
            id: d.id,
            value: d.value,
            entities_type: entitiesType,
            shared_count: d.counts.shared_count,
            union_count: d.counts.union_count,
            shared: (entitiesType === 'target' ? d.shared_diseases : d.shared_targets),
            subject: d.subject.label,
            object: d.object.label,
            subject_counts: (entitiesType === 'target' ? d.subject.links.diseases_count : d.subject.links.targets_count),
            object_counts: (entitiesType === 'target' ? d.object.links.diseases_count : d.object.links.targets_count),
            object_id: d.object.id,
            subject_id: d.subject.id
        });
    }
    return tree;
}

