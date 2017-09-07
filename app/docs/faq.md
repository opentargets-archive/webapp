
## Frequently asked questions


* [What can I search for?](#what_can_I search_for)
* [What is a target?](#target)
* [How are diseases described?](#diseases)
* [What is the Experimental Factor Ontology?](#efo)
* [ Where does the data come from?](#data)
* [How is the association score calculated?](#score)
* [How are the articles shown in the Bibliography on the Target Profile page chosen?](#biblio)
* [How do you use the information I enter into the CTTV Target Validation platform?](#data_use)
* [How do I cite the CTTV Target Validation Platform?](#citation)


#### <a name="what_can_I search_for"></a>What can I search for?

To find a target you can search for the gene or protein name and symbol (including their synonyms)
as annotated in the major biological databases. To find a disease you can search for the common disease
name and its synonyms (including some abbreviations) as described in the [EFO ontology](http://www.ebi.ac.uk/efo/)

#### <a name="target"></a>What is a target?

A target can be a protein, protein complex or RNA molecule, but we integrate evidence through the gene that codes for
the target. We use [Ensembl gene identifiers](http://www.ensembl.org/info/genome/genebuild/genome_annotation.html)
within the platform to organise the associations but display the target by the [HGNC gene symbol](http://www.genenames.org)
but you can search with protein or gene names and we recognise most synonyms. If you cannot find your target please
contact us with details at support@targetvalidation.org.

#### <a name="diseases"></a>How are diseases described?

We map diseases to terms in the [Experimental Factor Ontology](http://www.ebi.ac.uk/efo/) (EFO). This enables us to integrate evidence
from different sources and to describe relationships between diseases.

#### <a name="efo"></a>What is the Experimental Factor Ontology?

The [EFO ontology](http://www.ebi.ac.uk/efo/) provides a systematic, machine-readable description of many components of biological systems including diseases and
phenotypes. It combines parts of several biological ontologies, such as anatomy, disease and chemical compounds. The
scope of EFO is to support the annotation, analysis and visualization of data handled by many groups at the [EMBL-EBI](http://www.ebi.ac.uk)
and as the core ontology for the [Centre for Therapeutic Target Validation](http://about.targetvalidation.org).

#### <a name="data"></a>Where does the data come from?

The evidence in the CTTV platform comes from a number of public databases of biological data. These are
described in detail on the [data sources](/data-sources) page.

#### <a name="score"></a>How is the association score calculated?

To indicate the relative strength for each piece of evidence associating a target with a disease we calculate a score
between 0 and 1. These scores are combined within each data type to give an overall score for the
data type. The score for each data type corresponds to the amount of fill of the corresponding petal on the [Evidence page](/about#evidence).

The data type scores are combined to give an overall association score. The value of association score is represented by
the depth of the blue colour shown in the views of the [Disease Association page](/about#disease_assoc) and the 
[Target Association page](/about#target_assoc). More details are given on the [scoring](/scoring) page.

#### <a name="biblio"></a>How are the articles shown in the Bibliography on the Target Profile page chosen?

The list of citations appearing in the Bibliography section of the Target Profile page (e.g.
[BRAF](/target/ENSG00000157764) comes from the literature citations used to annotate the corresponding
protein entry in [UniProt](http://www.uniprot.org).

#### <a name="data_use"></a>How do you use the information I enter into the CTTV Target Validation platform?

We do not analyse the nature of any specific queries (target or disease names) processed via the website except for the
purposes of improving the site. We use standard encryption methods including https:// to maintain the security of the
searches. For further details please see our [terms of use](/terms-of-use).

Some of the components of the site are provided by third parties (e.g. the UniProt protein viewer) or make use of services
provided by third parties, mostly from other groups in the EMBL-EBI (e.g. the genome browser uses the Ensembl REST API). In addition we provide
links out to other web sites such as [COSMIC](http://cancer.sanger.ac.uk/cosmic). Use of these services is covered by their own terms of use.

#### <a name="citation"></a>How do I cite the CTTV Target Validation Platform?

See [here](/about#citation)
