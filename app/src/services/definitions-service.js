/* Services */

angular.module('otServices')

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    .factory('otDefinitions', [function () {
        'use strict';

        var definitions = {
            'ENRICHMENT.DISEASES': {
                'description': 'This is the probability (expressed as a p-value) of finding a disease associated with this set of targets. The lower this value, the higher the probability your targets are specific to the disease',
                'link': ''
            },
            'ENRICHMENT.GO': {
                'description': 'This is the probability (expressed as a p-value) of finding a Gene Ontology term associated with this set of targets. The lower this value, the higher the higher the probability your targets are specific to the term',
                'link': ''
            },
            'ENRICHMENT.PATHWAYS': {
                'description': 'This is the probability (expressed as a p-value) of finding a pathway associated with this set of targets. The lower this value, the higher the probability your targets are specific to the pathway',
                'link': ''
            },
            'KEEPLOADEDLISTS': {
                'description': 'If this option is checked your lists will be stored in the browser for easier access. You can still remove them at any time',
                'link': ''
            },
            'TEP': {
                'description': 'TEPs provide a critical mass of reagents and knowledge on a protein target to allow rapid biochemical and chemical exploration and characterisation of proteins with genetic linkage to key disease areas. Click on this icon to know more about TEPs',
                'link': 'http://www.thesgc.org/tep'
            },
            'FACET.SPECIFICITY': {
                'description': 'Show only targets which are expressed in the selected tissues <strong>more than</strong> the rest of the tissues.',
                'link': '/faq#tissue-specificity'
            },
            'FACET.BASELINE': {
                'description': 'Each target has an expression level per tissue based on normalised counts. You can filter targets by a set of tissues and an expression level.',
                'link': ''
            },
            'POSTGAP.GTEX': {
                'description': 'The max(1 - p-value) across all tissues for the eQTL between the target and variant (source: GTEx).',
                'link': 'https://www.gtexportal.org/home/'
            },
            'POSTGAP.DHS': {
                'description': '(1 - false discovery rate) for linked sites (via correlated DNase hypersensitivity) containing variant and target (source: DHS).',
                'link': ''
            },
            'POSTGAP.FANTOM5': {
                'description': '(1 - false discovery rate) for linked sites (miRNAs and their promoters) containing variant and target (source: Fantom5).',
                'link': 'http://fantom.gsc.riken.jp/5/'
            },
            'POSTGAP.PCHIC': {
                'description': 'The max normalized Promoter Capture Hi-C score (given by CHiCAGO) for linked sites containing variant and target (across all tissues).',
                'link': 'https://www.babraham.ac.uk/our-research/nuclear-dynamics/peter-fraser/research/promoter-capture-hic'
            },
            'POSTGAP.VEP': {
                'description': 'The max value of Ensembl\s Variant Effect Predictor for the variant across transcripts of the target',
                'link': 'http://www.ensembl.org/info/docs/tools/vep/index.html'
            },
            'POSTGAP.REGULOME': {
                'description': 'Summary of the RegulomeDB score for the variant (RegulomeDB categories 1 and 2 are mapped to 1.0; category 3 is mapped to 0.5).',
                'link': 'http://www.regulomedb.org/help'
            },
            'POSTGAP.NEAREST': {
                'description': 'The target\'s transcription start site is the nearest to the variant.',
                'link': ''
            },
            'POSTGAP.SCORE': {
                'description': 'The overall target to variant score (between 0 and 1), which is calculated from VEP, GTEx, DHS, Fantom5, PCHiC and Nearest.',
                'link': '/faq#postgap-v2g-score' // TODO: Add detailed process to FAQ
            },
            'POSTGAP.R2': {
                'description': 'The linkage disequilibrium (r^2) between the variant and the GWAS variant. POSTGAP applies a minimum threshold of 0.7.',
                'link': ''
            }
        };

        return definitions;
    }]);
