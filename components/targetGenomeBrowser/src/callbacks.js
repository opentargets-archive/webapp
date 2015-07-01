var rest = require("tnt.ensembl")()
    .proxyUrl("/ensembl");

var c = {};
c.snps = {};
c.data = {};
c.data.gwas = [];
c.data.clinvar = [];

// CLINVAR
c.cttv_clinvar = function (resp) {
    var clinvarSNPs = {};
    for (var i=0; i<resp.body.data.length; i++) {
        var this_snp = resp.body.data[i];
        var this_disease = resp.body.data[i].biological_object;
        var this_target = resp.body.data[i].biological_subject;
        var snp_name = this_snp.evidence.evidence_chain[1].biological_subject.properties.experiment_specific.rsId;
        var clinvarId = this_snp.evidence.evidence_chain[0].biological_object.about[0].split("/").pop();

        if (clinvarSNPs[snp_name] === undefined) {
            var refs = this_snp.evidence.evidence_chain[1].evidence.provenance_type.literature.references;
            var refsText = refs.map(function (d) {
                return d.lit_id.split("/").pop()
            })
            var association = {
                "efo" : this_snp.biological_object.efo_info[0][0].efo_id,
                "label" : this_snp.biological_object.efo_info[0][0].label,
                "name"  : snp_name,
                "target" : this_target.about[0],
                "pmids"  : refsText
            };
            clinvarSNPs[snp_name] = {};
            clinvarSNPs[snp_name].name = snp_name;
            clinvarSNPs[snp_name].association = association;
            clinvarSNPs[snp_name].clinvarId = clinvarId;
        }
    }
    c.snps["clinvar"] = clinvarSNPs;
    var snp_names = Object.keys(c.snps["clinvar"]);
    return snp_names;
};

c.ensembl_call_snps = function (snp_names) {
    var var_url = rest.url.variation ({
        species : "human"
    });
    return rest.call(var_url, {
        "ids" : snp_names
    })
};


c.ensembl_parse_clinvar_snps = function (resp) {
    c.data.clinvar = [];
    for (var snp_name in resp.body) {
        var snp = resp.body[snp_name];
        var info = c.snps["clinvar"][snp_name];
        info.pos = snp.mappings[0].start;
        info.val = 1;
        c.data.clinvar.push(info);
    }

    var clinvar_extent = d3.extent(c.data.clinvar, function (d) {
        return d.pos
    });
    return clinvar_extent;
};

c.gene = function (resp) {
    return resp.body;
};

// GWAS
c.cttv_gwas = function (resp) {
    var gwasSNPs = {};
    for (var i=0; i<resp.body.data.length; i++) {
        var this_snp = resp.body.data[i].evidence;
        var this_disease = resp.body.data[i].biological_object;
        var snp_name = this_snp.evidence_chain[0].biological_object.about[0].split("/").pop();
        if (gwasSNPs[snp_name] === undefined) {
            gwasSNPs[snp_name] = {};
            gwasSNPs[snp_name].study = [];
            gwasSNPs[snp_name].name = snp_name;
        }
        gwasSNPs[snp_name].study.push ({
            "pmid"   : this_snp.evidence_chain[1].evidence.provenance_type.literature.references[0].lit_id.split("/").pop(),
            "pvalue" : this_snp.evidence_chain[1].evidence.association_score.pvalue.value.toExponential(),
            "name"   : this_snp.evidence_chain[0].biological_object.about[0].split("/").pop(),
            "efo"    : this_disease.efo_info[0][0].efo_id,
            "efo_label" : this_disease.efo_info[0][0].label
        });
    }
    c.snps["gwas"] = gwasSNPs;
    var snp_names = Object.keys(c.snps["gwas"]);
    return snp_names;
};

c.ensembl_parse_gwas_snps = function (resp) {
    //var min_pos, max_pos;
    c.data.gwas = [];
    var min = function (arr) {
        var m = Infinity;
        var len = arr.length;
        while (len--) {
            var v = +arr[len].pvalue;
            if (v < m) {
                m = v;
            }
        }
        return m;
    };
    for (var snp_name in resp.body) {
        if (resp.body.hasOwnProperty(snp_name)) {
            var snp = resp.body[snp_name];
            var info = c.snps["gwas"][snp_name];
            info.pos = snp.mappings[0].start;
            info.val = 1 - min(info["study"]);
            c.data.gwas.push(info)
        }
    }
    var gwas_extent = d3.extent(c.data.gwas, function (d) {
        return d.pos
    });
    return gwas_extent;
};

module.exports = exports = c;
