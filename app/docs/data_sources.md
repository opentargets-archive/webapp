CTTV Platform Data Sources
==========================

The CTTV platform collects and integrates data from various data sources that we believe are important to target identification and prioritisation.
Within the platform we distinguish between individual **data sources** which correspond to the database that supplies the data, and **data types** which
are groupings of data from different data sources. Data from an individual data source can contribute to different data types, if there is a logical split
in the data. For instance [EVA](http://www.ebi.ac.uk/eva/?Home) contains both germline and somatic mutations, and hence contributes to both the
[Genetic associations](#genetic) and [Somatic mutation](#somatic) data types.

<a name="genetic"></a>Genetic associations
----------

Genetic associations are classified as associaions to either common or rare diseases. We use data from the GWAS catalog from Genome Wide Association Studies (GWAS)
for common disese and mutations in clinical samples from European Variation Archive (EVA) or UniProt annotation for rare genetic diseases (Mendelian diseases).

### <a name="gwas"></a>GWAS Catalog
The [GWAS catalog](https://www.ebi.ac.uk/gwas/) provides evidence on the association of targets (genes) and diseases from Genome Wide Association Studies (GWAS).
GWAS Catalog provides a list of the most associated variants (SNPs) by genomic region with the disease from each study. The GWAS Catalog data includes
associations with p-values ≤ 10-5. Although the standard in the field for significance of an association in GWAS is for the
p-value to be ≤ 5 x10-8, we provide sub-threshold values to broaden the coverage of diseases. The association is assigned the most
likely gene by assessing the probable link between SNP and gene using a CTTV custom annotation pipeline. SNPs are assigned to a gene by first considering any
deleterious consequence within the gene's coding region, then whether it is located within the gene's introns or regulatory regions and finally identifying
the gene promoter to which it is nearest if there is no other data available.

### <a name="uniprot"></a>UniProt
The EMBL-EBI [UniProt](http://www.uniprot.org) database is a comprehensive, high-quality and freely accessible resource of protein sequence and functional
information manually curated from the literature and public databases including Online Mendelian Inheritance in Man (OMIM). The UniProt database supplies
curated information on rare genetic diseases (Mendelian diseases). In this data, evidence that a target is associated with a disease comes primarily
from deleterious mutation within the protein coding region of the gene in diseased individuals and segregation within families. In cases where
UniProt curators have curated an association between a target and disease but do not supply a specific mutation we refer to this data source as
<a name="unilit"></a>UniProt Literature.

### <a name="eva"></a>European Variation Archive (EVA)

The EMBL-EBI [European Variation Archive](http://www.ebi.ac.uk/eva/?Home) (EVA) is an open-access database of all types of genetic variation data from human.
For target - disease evidence in rare genetic disease we take clinically relevant data from EVA where the variation/mutation is considered pathogenic
or likely pathogenics. These data originate primarily from the [ClinVar](http://www.ncbi.nlm.nih.gov/clinvar/) archive, which includes OMIM.

<a name="somatic"></a>Somatic mutations
---

Mutations that may have clinical or treatment implications in cancer and other diseases are extracted from the following resources:

### <a name="census"></a>The Cancer Gene Census
The Wellcome Trust Sanger Institute [COSMIC](http://cancer.sanger.ac.uk/cosmic) database provides evidence from somatic mutations on likely cancer
drivers as manually curated in the [Cancer Gene Census](http://cancer.sanger.ac.uk/census). The COSMIC Cancer Gene Census is a catalogue of genes
for which mutations have been causally implicated in cancer.

### <a name="eva_somatic"></a>European Variation Archive (EVA)
The EMBL-EBI [European Variation Archive](http://www.ebi.ac.uk/eva/?Home) (EVA) also contains data on somatic mutations in cancer and other diseases.

Drugs
----

### <a name="chembl"></a>ChEMBL

The EMBL-EBI [ChEMBL](https://www.ebi.ac.uk/chembl/) database provides evidence from known drugs where the drug can be connected to a disease
and a known target. ChEMBL is an open access database that contains compound bioactivity data against drug targets. Currently, data on FDA-approved,
marketed drugs (i.e. those which are approved for clinical trials in the USA) are being displayed. Clinical indication data from other countries
is being reviewed and processed.

RNA expression
----

### <a name="atlas"></a>Expression Atlas
The EMBL-EBI Expression Atlas database provides information on gene expression patterns under different biological conditions. For CTTV, the
Expression Atlas database supplies evidence from gene expression changes in studies that compare disease samples with normal samples, or in some
cases with other disease samples. In addition the Expression Atlas provides baseline expression information for each target, which can be found on
the [Target Profile](/about#target_profile) page.

<a name="text_mining"></a>Text mining
-----

Evidence of disease associated genes can be extracted automatically by mining the up-to-date and worldwide biomedical literature corpus.
[Europe PubMed Central](https://europepmc.org/) (Europe PMC) is a unique, free, information resource for biomedical and health researchers
that provides access to 30.4 million+ abstracts and 3.3 million+ full text research articles from PubMed and PubMed Central. For CTTV,
Europe PMC supplies evidence of links between genes and diseases by mining the titles, abstracts and full text research articles using an
entity-to-entity recognition approach.

<a name="reactome"></a>Affected pathways
-------
The [Reactome](http://www.reactome.org) database manually curates and identifies reaction pathways that are affected by pathogenic mutations.

<a name="mouse"></a>Animal models
-------
The Wellcome Trust Sanger Institute [PhenoDigm](http://www.sanger.ac.uk/resources/databases/phenodigm/) database provides evidence on associations
of targets and disease via gene knockout mouse models. The orthologous human gene to the one knocked out in the mouse is identified. The phenotypic
effects in the mutant mouse are then mapped to phenotypes associated with human diseases and probable matches are identified and scored.
