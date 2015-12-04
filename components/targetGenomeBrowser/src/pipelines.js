var pipelines = function () {

    var rest = {
        ensembl: undefined,
        cttv: undefined,
    };

    var snps = {};
    var data;
    var highlight = {};

    var p = {};

    p.rare = function (genes, efo) {
        var opts, url;
        if (efo) {
            opts = getOpts (genes, ["uniprot", "eva"], efo);
            url = rest.cttv.url.filterby ();
            return rest.cttv.call(url, undefined, opts)
                .then (function (resp) {
                    cttv_highlight(resp);
                    return p.rare(genes);
                });
        }

        opts = getOpts(genes, ["uniprot", "eva"]);
        url = rest.cttv.url.filterby();
        return rest.cttv.call(url, undefined, opts)
            .then (cttv_clinvar)
            .then (ensembl_call_snps)
            .then (ensembl_parse_clinvar_snps)
            .then (extent);
    };

    p.common = function (genes, efo) {
        var opts, url;
        if (efo) {
            opts = getOpts (genes, ["gwas_catalog"], efo);
            url = rest.cttv.url.filterby ();
            return rest.cttv.call(url, undefined, opts)
                .then (function (resp) {
                    cttv_highlight(resp);
                    return p.common (genes);
                });
        }
        opts = getOpts(genes, ["gwas_catalog"]);
        url = rest.cttv.url.filterby ();

        return rest.cttv.call(url, undefined, opts)
            .then (cttv_gwas)
            .then (ensembl_call_snps)
            .then (ensembl_parse_gwas_snps)
            .then (extent);
    };

    // STEPS
    var cttv_highlight = function (resp) {
        for (var i=0; i<resp.body.data.length; i++) {
            var rec = resp.body.data[i];
            var snp_name = rec.variant.id[0].split("/").pop();
            highlight[snp_name] = 1;
        }
    };

    var cttv_clinvar = function (resp) {
        for (var i=0; i<resp.body.data.length; i++) {
            var rec = resp.body.data[i];
            if (rec.type === "genetic_association") {
                var this_snp = rec.variant.id[0];
                var snp_name = this_snp.split("/").pop();
                var variantDB = rec.evidence.gene2variant.provenance_type.database;
                var clinvarId;
                if (variantDB.dbxref) {
                    clinvarId = variantDB.dbxref.url.split("/").pop();
                }
                var this_disease = rec.disease.efo_info;
                var this_target = rec.target.gene_info;

                var refs = [];
                if (rec.evidence.variant2disease.provenance_type.literature) {
                        refs = rec.evidence.variant2disease.provenance_type.literature.references.map(function (ref) {
                            return ref.lit_id.split("/").pop();
                        });
                }

                if (snps[snp_name] === undefined) {
                    snps[snp_name] = {};
                    snps[snp_name].target = this_target;
                    snps[snp_name].name = snp_name;
                    snps[snp_name].efo = [];
                    snps[snp_name].associations = [];
                    snps[snp_name].clinvarId = clinvarId;
                }
                if (highlight[snp_name]) {
                    snps[snp_name].highlight = true;
                }


                var association = {
                    "efo": this_disease.efo_id,
                    "label": this_disease.label,
                    "name": snp_name,
                    "target": this_target.symbol,
                    "pmids": refs
                };
                snps[snp_name].associations.push(association);
                snps[snp_name].efo.push(this_disease.efo_id);

            } else {
                console.error(rec);
            }
        }
        // snps = clinvarSNPs;
        var snp_names = Object.keys(snps);
        return snp_names;
    };

    var ensembl_parse_clinvar_snps = function (resp) {
        // data = [];
        for (var snp_name in resp.body) {
            var snp = resp.body[snp_name];
            var info = snps[snp_name];
            info.pos = snp.mappings[0].start;
            info.val = 1;
            // data.push(info);
        }

        return snps;
    };

    var extent = function (data) {

        var a = [];
        for (var snp in data) {
            if (data.hasOwnProperty(snp)) {
                a.push(data[snp]);
            }
        }

        var xt = d3.extent(a, function (d) {
            return d.pos;
        });
        return {
            extent: xt,
            snps: snps
        };
    };

    var ensembl_parse_gwas_snps = function (resp) {
        // data = [];
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
                var info = snps[snp_name];
                info.pos = snp.mappings[0].start;
                info.val = 1 - min(info.study);
                // data.push(info);
            }
        }
        return snps;
    };

    var ensembl_call_snps = function (snp_names) {
        var var_url = rest.ensembl.url.variation ({
            species : "human"
        });

        if (snp_names.length) {
            return rest.ensembl
                .call(var_url, {
                    "ids" : snp_names
                });
        }

        // If there are not snps, don't call ensembl
        return new Promise (function (resolve, reject) {
            resolve({body:{}});
        });

    };

    var cttv_gwas = function (resp) {
        for (var i=0; i<resp.body.data.length; i++) {
            var rec = resp.body.data[i];
            var this_snp = rec.variant.id[0];
            var this_disease = rec.disease.efo_info;
            var snp_name = this_snp.split("/").pop();
            var this_target = rec.target.gene_info;
            if (snps[snp_name] === undefined) {
                snps[snp_name] = {};
                snps[snp_name].target = this_target;
                snps[snp_name].study = [];
                snps[snp_name].name = snp_name;
                snps[snp_name].efo = [];
            }
            if (highlight[snp_name]) {
                snps[snp_name].highlight = true;
            }
            snps[snp_name].efo.push(this_disease.efo_id);
            snps[snp_name].study.push ({
                "pmid": rec.evidence.variant2disease.provenance_type.literature.references[0].lit_id,
                "pvalue": rec.evidence.variant2disease.resource_score.value,
                "efo": this_disease.efo_id,
                "efo_label": this_disease.label
            });
        }

        //snps = gwasSNPs;
        var snp_names = Object.keys(snps);
        return snp_names;
    };


    // API
    p.ensemblRestApi = function (r) {
        if (!arguments.length) {
            return rest.ensembl;
        }
        rest.ensembl = r;
        return this;
    };

    p.cttvRestApi = function (r) {
        if (!arguments.length) {
            return rest.cttv;
        }
        rest.cttv = r;
        return this;
    };

    function getOpts (genes, datasources, efo) {
        var opts = {
            //target : genes,
            //_post: genes,
            target: [genes],
            size : 1000,
            datasource : datasources,
            fields : [
                "target.gene_info",
                "disease.efo_info",
                "variant",
                "evidence",
                // "unique_association_fields",
                "type"
            ]
        };
        if (efo !== undefined) {
            opts.disease = [efo];
            opts.expandefo = false;
        }
        return opts;
    }

    return p;
};

module.exports = exports = pipelines;
