var colors = {
    // proteins
    "protein coding"        : d3.rgb('#A00000'),
    "pseudogene"            : d3.rgb('#666666'),
    "processed transcript"  : d3.rgb('#0033FF'),
    "ncRNA"                 : d3.rgb('#8B668B'),
    "antisense"             : d3.rgb('#CBDD8B'),
    "TR gene"               : d3.rgb('#AA00AA'),

    // transcripts
    "non coding transcript" : d3.rgb('#8B668B'),
};

var legends = {
    // gene biotypes
    "protein_coding"                     : "protein coding",
    "pseudogene"                         : "pseudogene",
    "processed_pseudogene"               : "pseudogene",
    "transcribed_processed_pseudogene"   : "pseudogene",
    "unprocessed_pseudogene"             : "pseudogene",
    "polymorphic_pseudogene"             : "pseudogene",
    "unitary_pseudogene"                 : "pseudogene",
    "transcribed_unprocessed_pseudogene" : "pseudogene",
    "TR_V_pseudogene"                    : "pseudogene",
    "processed_transcript"               : "processed transcript",
    "TEC"                                : "processed transcript",
    "sense_overlapping"                  : "processed transcript",
    "miRNA"                              : "ncRNA",
    "lincRNA"                            : "ncRNA",
    "misc_RNA"                           : "ncRNA",
    "snoRNA"                             : "ncRNA",
    "snRNA"                              : "ncRNA",
    "rRNA"                               : "ncRNA",
    "antisense"                          : "antisense",
    "sense_intronic"                     : "antisense",
    "TR_V_gene"                          : "TR gene",
    "TR_C_gene"                          : "TR gene",
    "TR_J_gene"                          : "TR gene",
    "TR_D_gene"                          : "TR gene",


    // transcript biotypes
    "retained_intron"                    : "non coding transcript",
    "nonsense_mediated_decay"            : "protein coding",
};

module.exports = exports = {
    color : colors,
    legend : legends,
};
