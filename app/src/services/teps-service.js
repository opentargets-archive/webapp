/* Services */

/**
*  Service that compiles the information about Target Enabling Packages (TEPs)
*  More info of this packages: http://www.thesgc.org/tep
*  This information is static and needs to be updated when new TEPs are made available
* */
angular.module('otServices')

    .factory('otTeps', [function () {
        'use strict';

        return {
            "ENSG00000124067": {
                "id": "ENSG00000124067",
                "symbol": "SLC12A4",
                "link": "https://www.thesgc.org/tep/slc12a4slc12a6",
                "disease": "Sickle cell disease (SCD), Neurological",
                "uniprot_id": "Q9UP95"
            },
            "ENSG00000082397": {
                "id": "ENSG00000082397",
                "symbol": "EPB41L3",
                "link": "https://www.thesgc.org/tep/epb41l3",
                "disease": "Neurodegeneration",
                "uniprot_id": "Q9Y2J2"
            },
            "ENSG00000168918": {
                "id": "ENSG00000168918",
                "symbol": "INPP5D",
                "link": "https://www.thesgc.org/tep/inpp5d",
                "disease": "Neurological Disorders",
                "uniprot_id": "Q92835"
            },
            "ENSG00000147065": {
                "id": "ENSG00000147065",
                "symbol": "MSN",
                "link": "https://www.thesgc.org/tep/moesin",
                "disease": "Alzheimer's disease",
                "uniprot_id": "P26038"
            },
            "ENSG00000041982": {
                "id": "ENSG00000041982",
                "symbol": "TNC",
                "link": "https://www.thesgc.org/tep/hfbg-c",
                "disease": "Inflammatory diseases",
                "uniprot_id": "P24821"
            },
            "ENSG00000164181": {
                "id": "ENSG00000164181",
                "symbol": "ELOVL7",
                "link": "https://www.thesgc.org/tep/elovl7",
                "disease": "Metabolic diseases",
                "uniprot_id": "A1L3X0"
            },
            "ENSG00000181192": {
                "id": "ENSG00000181192",
                "symbol": "DHTKD1",
                "link": "https://www.thesgc.org/tep/dhtkd1",
                "disease": "Metabolic diseases",
                "uniprot_id": "Q96HY7"
            },
            "ENSG00000152457": {
                "id": "ENSG00000152457",
                "symbol": "DCLRE1C",
                "link": "https://www.thesgc.org/tep/dclre1c",
                "disease": "Oncology",
                "uniprot_id": "Q96SD1"
            },
            "ENSG00000164458": {
                "id": "ENSG00000164458",
                "symbol": "TBXT",
                "link": "https://www.thesgc.org/tep/tbxt",
                "disease": "Cancer",
                "uniprot_id": "J3KP65"
            },
            "ENSG00000118007": {
                "id": "ENSG00000118007",
                "symbol": "STAG1",
                "link": "https://www.thesgc.org/tep/stag1",
                "disease": "Cancer",
                "uniprot_id": "Q8WVM7"
            },
            "ENSG00000177000": {
                "id": "ENSG00000177000",
                "symbol": "MTHFR",
                "link": "https://www.thesgc.org/tep/mthfr",
                "disease": "Metabolic disorders, Cancer",
                "uniprot_id": "P42898"
            },
            "ENSG00000158578": {
                "id": "ENSG00000158578",
                "symbol": "ALAS2",
                "link": "https://www.thesgc.org/tep/alas2",
                "disease": "Metabolic diseases",
                "uniprot_id": "P22557"
            },
            "ENSG00000213930": {
                "id": "ENSG00000213930",
                "symbol": "GALT",
                "link": "https://www.thesgc.org/tep/galt",
                "disease": "Metabolic diseases",
                "uniprot_id": "P07902"
            },
            "ENSG00000108479": {
                "id": "ENSG00000108479",
                "symbol": "GALK1",
                "link": "https://www.thesgc.org/tep/galK1",
                "disease": "Metabolic diseases",
                "uniprot_id": "P51570"
            },
            "ENSG00000160145": {
                "id": "ENSG00000160145",
                "symbol": "KALRN",
                "link": "https://www.thesgc.org/tep/kalrn",
                "disease": "Neurological Disorders",
                "uniprot_id": "O60229"
            },
            "ENSG00000136238": {
                "id": "ENSG00000136238",
                "symbol": "RAC1",
                "link": "https://www.thesgc.org/tep/rac1",
                "disease": "Neurological Disorders",
                "uniprot_id": "P63000"
            },
            "ENSG00000079999": {
                "id": "ENSG00000079999",
                "symbol": "KEAP1",
                "link": "https://www.thesgc.org/tep/keap1",
                "disease": "Neuropsychiatry",
                "uniprot_id": "Q14145"
            },
            "ENSG00000076321": {
                "id": "ENSG00000076321",
                "symbol": "KLHL20",
                "link": "https://www.thesgc.org/tep/klhl20",
                "disease": "Cancer, Neuropsychiatry",
                "uniprot_id": "Q9Y2M5"
            },
            "ENSG00000130382": {
                "id": "ENSG00000130382",
                "symbol": "MLLT1",
                "link": "https://www.thesgc.org/tep/mllt1",
                "disease": "Cancer",
                "uniprot_id": "Q03111"
            },
            "ENSG00000171303": {
                "id": "ENSG00000171303",
                "symbol": "KCNK3",
                "link": "https://www.thesgc.org/tep/task1",
                "disease": "Neurological Disorders",
                "uniprot_id": "O14649"
            },
            "ENSG00000160746": {
                "id": "ENSG00000160746",
                "symbol": "ANO10",
                "link": "https://www.thesgc.org/tep/tmem16k",
                "disease": "Neurological Disorders",
                "uniprot_id": "Q9NW15"
            },
            "ENSG00000138622": {
                "id": "ENSG00000138622",
                "symbol": "HCN4",
                "link": "https://www.thesgc.org/tep/HCN4",
                "disease": "Cardiovascular, Inflammation, and Neuro",
                "uniprot_id": "Q9Y3Q4"
            },
            "ENSG00000140876": {
                "id": "ENSG00000140876",
                "symbol": "NUDT7",
                "link": "https://www.thesgc.org/tep/NUDT7",
                "disease": "Metabolic diseases",
                "uniprot_id": "P0C024"
            },
            "ENSG00000173193": {
                "id": "ENSG00000173193",
                "symbol": "PARP14",
                "link": "https://www.thesgc.org/tep/PARP14",
                "disease": "Cancer, Inflammation",
                "uniprot_id": "Q460N5"
            },
            "ENSG00000104312": {
                "id": "ENSG00000104312",
                "symbol": "RIPK2",
                "link": "https://www.thesgc.org/tep/RIPK2",
                "disease": "Inflammatory diseases",
                "uniprot_id": "O43353"
            },
            "ENSG00000101323": {
                "id": "ENSG00000101323",
                "symbol": "HAO1",
                "link": "https://www.thesgc.org/tep/HAO1",
                "disease": "Metabolic disorders",
                "uniprot_id": "Q9UJM8"
            },
            "ENSG00000168143": {
                "id": "ENSG00000168143",
                "symbol": "FAM83B",
                "link": "https://www.thesgc.org/tep/FAM83B",
                "disease": "Cancer",
                "uniprot_id": "Q5T0W9"
            },
            "ENSG00000106683": {
                "id": "ENSG00000106683",
                "symbol": "LIMK1",
                "link": "https://www.thesgc.org/tep/LIMK1",
                "disease": "Neuropsychiatry",
                "uniprot_id": "P53667"
            },
            "ENSG00000198924": {
                "id": "ENSG00000198924",
                "symbol": "DCLRE1A",
                "link": "https://www.thesgc.org/tep/DCLRE1A",
                "disease": "Cancer",
                "uniprot_id": "Q6PJP8"
            },
            "ENSG00000172269": {
                "id": "ENSG00000172269",
                "symbol": "DPAGT1",
                "link": "https://www.thesgc.org/tep/DPAGT1",
                "disease": "Neuropsychiatry and neuro genetic disorders",
                "uniprot_id": "Q9H3H5"
            },
            "ENSG00000008311": {
                "id": "ENSG00000008311",
                "symbol": "AASS",
                "link": "https://www.thesgc.org/tep/AASS",
                "disease": "Metabolic & Neurological disorders",
                "uniprot_id": "Q9UDR5"
            },
            "ENSG00000196632": {
                "id": "ENSG00000196632",
                "symbol": "WNK3",
                "link": "https://www.thesgc.org/tep/WNK3",
                "disease": "Metabolic diseases",
                "uniprot_id": "Q9BYP7"
            },
            "ENSG00000094631": {
                "id": "ENSG00000094631",
                "symbol": "HDAC6",
                "link": "https://www.thesgc.org/tep/HDAC6",
                "disease": "Oncology",
                "uniprot_id": "Q9UBN7"
            },
            "ENSG00000146247": {
                "id": "ENSG00000146247",
                "symbol": "PHIP",
                "link": "https://www.thesgc.org/tep/PHIP",
                "disease": "Cancer",
                "uniprot_id": "Q8WWQ0"
            },
            "ENSG00000108469": {
                "id": "ENSG00000108469",
                "symbol": "RECQL5",
                "link": "https://www.thesgc.org/tep/RECQL5",
                "disease": "Cancer",
                "uniprot_id": "O94762"
            },
            "ENSG00000143379": {
                "id": "ENSG00000143379",
                "symbol": "SETDB1",
                "link": "https://www.thesgc.org/tep/SETDB1",
                "disease": "Oncology",
                "uniprot_id": "Q15047"
            },
            "ENSG00000167258": {
                "id": "ENSG00000167258",
                "symbol": "CDK12",
                "link": "https://www.thesgc.org/tep/CDK12",
                "disease": "Oncology",
                "uniprot_id": "Q9NYV4"
            },
            "ENSG00000120733": {
                "id": "ENSG00000120733",
                "symbol": "KDM3B",
                "link": "https://www.thesgc.org/tep/KDM3B",
                "disease": "Cancer",
                "uniprot_id": "Q7LBC6"
            },
            "ENSG00000186280": {
                "id": "ENSG00000186280",
                "symbol": "KDM4D",
                "link": "https://www.thesgc.org/tep/KDM4D",
                "disease": "Cancer",
                "uniprot_id": "Q6B0I6"
            }
        };
    }]);
