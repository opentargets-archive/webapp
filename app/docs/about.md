## About the CTTV Target Validation Platform

The Center for Therapeutic Target Validation (CTTV) platform brings together evidence which associates potential
drug targets with diseases. Its aim is to help users identify and prioritise potential targets for further investigation.

The platform brings together evidence from multiple data types that can be relevant to target identification and prioritisation.
These data are described in detail on the [data sources](/data_sources) page.

A target can be a protein, protein complex or RNA molecule. We integrate evidence through the gene that codes for
the target using [Ensembl gene identifiers](http://www.ensembl.org/info/genome/genebuild/genome_annotation.html). We display the
target by the [HGNC gene symbol](http://www.genenames.org) but you can search for it using protein or gene names
and most synonyms as explained in [What can I search for](/faq#what_can_I search_for).

We map diseases to terms in the [Experimental Factor Ontology](http://www.ebi.ac.uk/efo/) (EFO), which enables us to
describe relationships between diseases. For more details see [How are diseases described?](/faq#diseases)

  * [Getting Started](#getting_started)
  * [Target Association page](#target_assoc)
  * [Disease Association page](#disease_assoc)
  * [Target-Disease Evidence page](#evidence)
  * [Target Profile Page](#target_profile)
  * [Disease Profile page](#disease_profile)
  * [Filters](#filters)
  * [Citation](#citation)
  * [Support and Further Information](#support)

### <a name="getting_started"></a>Getting Started

The platform supports workflows starting from either a target or disease and presents the evidence for target – disease
associations in a number of ways through Association and Evidence pages. We also present related information on the target
or the disease itself through the [Target Profile](#target_profile) and [Disease Profile](#disease_profile) pages.

A search box is available on the home page or at the top of every other page. To find a target of interest, either enter
the gene or protein name, symbol or synonym. To find a disease you can search for the common disease name or its synonyms
(including some abbreviations) provided the disease label and its synonyms are part of the [EFO](http://www.ebi.ac.uk/efo/).

### <a name="target_assoc"></a>Target Association page

After searching for a target and selecting the target you will be taken to the Target Association page which provides an
overview of all diseases associated to a target.

Three views of the associations are available organised by the tabs at the top:
  * Bubbles view,
  * Table view and
  * Tree view.

Filters are available on the left of the page to restrict the associations that are displayed by data type or to focus
on a therapeutic area (see [filters](#filters)).

#### Bubbles View

This view groups diseases into 'bubbles' by therapeutic area. Each large bubble corresponds to a therapeutic area and
consists of smaller bubbles representing diseases within this area. A disease can belong to several therapeutic areas
and therefore can appear within more than one therapeutic area bubble.

The strength of the association between the target and a particular disease is represented by the size of the corresponding
disease bubble and the depth of its blue colour: The larger the bubble and the deeper the colour, the stronger the association.

Mouse over a bubble to display the full name of the disease and the score associating it with the target. Clicking on a
bubble opens a pop-up with several links: Click on the flower icon or to ‘View evidence details’ to view the detailed
[Target-Disease Evidence](#evidence) page for the association, click on the ‘P’ icon to view the Disease Profile page
or the ‘A’ icon to view all the target associations of that disease.

To zoom in on a particular therapeutic area, click on the corresponding therapeutic area filter on the left hand side.
To zoom out of a particular therapeutic area, click on the therapeutic area filter again. You can also filter the bubbles
by data types using the corresponding filter on the left hand side.

#### Table View

This view lists all diseases associated to a particular gene ordered by the association score. Scores are represented by the depth
of blue colour. Cells representing associations with no evidence are coloured white. In this view we show evidence from the
lower parts of the disease hierarchy aggregated into higher terms. So for instance in the [BRAF Target Association](/target/ENSG00000157764/associations)
page, evidence is shown for higher level terms such as skin disease, or carcinoma.

The filters work as before on this view and in addition the associations can be ordered by the association scores for individual data
types by clicking the arrow in the table header. To order by several data types, shift-click the table headers. There is also a search box
available and typing into the box will restrict the diseases displayed to those that match the search string. For example try typing "Mela"
into the search box on the [BRAF](/target/ENSG00000157764/associations) table view to restrict the diseases
to types of melanoma.

#### Tree View

The ‘Tree’ view allows visualisation of evidence across the therapeutic areas in a tree representing the relationships of diseases.
Therapeutic areas have a square symbol, while the other disease nodes are circles. The depth of the blue fill of the node indicates the
association score at that node. Top-level disease categories are shown at a fixed position. Clicking on a disease opens a pop-up menu
that provides links to various other pages, but also allows branches of the tree to be collapsed down to simplify the visualisation.
Clicking on a collapsed disease will allow the branches to be opened again.

### <a name="disease_assoc"></a>Disease Association page

This page provides a table view of all potential targets associated to a disease ordered by the association score. The depth of blue colour
for the cells in the association score and for the individual data types again indicates the strength of the association. Targets can be filtered
by data type and also by involvement in Reactome reaction pathways as described [below](#filters). The associations can be ordered
by the association scores for individual data types by clicking the arrow in the table header. To order by several data types, shift-click
the table headers.

There is also a search box available and typing into the box will restrict the targets displayed to those that match the search string.
For example try typing "IL" into the search box on the [Asthma](/disease/EFO_0000270/associations) table
view to restrict the targets largely to Interleukins.

### <a name="evidence"></a>Target-Disease Evidence page

After viewing an association in either the Target Association page or Disease Association page, details of the underlying evidence
can be accessed by clicking on the target/disease or the evidence cells of the table view, or by selecting the evidence flower, or
'View evidence details' in the bubble or tree views. This displays the Target-Disease Evidence page.  At the top of this page is a panel
indicating the association that is being examined, and a flower that shows the score for each data type as the petals of a flower.  The
extent of the blue fill of the flower petal indicates the strength of the association for that data type. Details of the data types can be
found [here](/data_sources).

The sections below contain the details of the evidence available for this association in each data type. If evidence is available
for a particularly datatype the section header will contain bold black text and clicking on the header will open our a table that describes the
available data and the source. In some cases (e.g. Genetic associations) there will also be a tab available that displays a graphical
view of the data (e.g. through a genome browser). If there is no evidence in a datatype the header will be greyed out and clicking on
the header will open out a section indicating there is "No data available".

In each of the evidence tables, the columns may be sorted by the data, by clicking on the arrows in the table header. The tables can also be
searched for matches to text by typing in the 'Search:' box. Details of the content of the tables follow:

#### Genetic associations
This section splits into common disease evidence from Genome Wide Association Studies ([GWAS catalog](/data_sources#gwas)),
and rare disease evidence from Mendelian disease ([UniProt](/data_sources#uniprot) and [European Variation Archive](/data_sources#eva)).

For GWAS data we provide the identity of the SNP that was reported as the strongest association withe reported p value and the evidence that
links the SNP to the target.

For rare disease, we report the mutation if it is available and the curated cosequence of the mutation.

#### Somatic mutations
Somatic mutation evidence is provided primarily for cancers, from the [Cancer Gene Census](/data_sources#census). This data is a summary of multiple
and sometimes many somatic mutations that support the association of a target to disease, and we provide the details of the mutation types
observed that contribute to the overall summary annotation.

In addition somatic mutation data can also come from the [European Variation Archive](/data_sources#eva_somatic)

#### Drugs
This section lists FDA approved and marketed drugs that associate a specific target to a specific disease. The drug to target association
and drug to disease associations are curated by [ChEMBL](/data_sources#chembl) from multiple evidence sources as listed.

#### Affected pathways
Evidence in this section reflects specific curation in [Reactome](/data_sources#reactome) of a molecular mechanism that affects a pathway leading to disease.

#### RNA expression

The RNA expression data table shows gene changes for which the log2 fold change is greater than 1 or less than -1 and p-value is less than 0.05
(after Benjamini & Hochberg (1995) FDR correction). The percentile rank column shows the relative rank of the gene expression fold change of
that gene in comparison to all other genes for this experiment.

#### Text mining
The Literature Mining data table shows the most relevant research articles based on the number of times an association between a gene and a
disease is found in sentences across the article and highlights the terms in the relevant sentences.  Clicking on the number in the Matched
sentences column will reveal a pop-up with all relevant sentences from the article.

#### Animal models
The table shows the mapping of the human and mouse phenotypes together withthe identity of the mouse knockout mutation that provides the
evidence from the [Phenodigm](/data_sources#mouse) database.


### <a name="target_profile"></a>Target Profile Page

The Target Profile page summarises relevant information about a particular target outside of the context of a specific disease association.
The Target profile can be accessed either by clicking the target name in the Target-Disease Evidence page, or the "View BRAF profile" link
in the Target Association page.

The sections of the page open out when they are clicked to reveal the information either as text or tables, or as a graphical display or both.
Information available here includes:

  * A summary of the target function from [UniProt](http://www.uniprot.org),
  * Protein and gene synonyms.
  * Protein information from [UniProt](http://www.uniprot.org) including a graphical protein feature viewer,
  * Variants, isoforms and genomic context information section displaying common disease variants and rare disease mutations associated with diseases
  relative to the alternative transcripts (isoforms) of the gene, supplied from [Ensembl](http://www.ensembl.org),
  * Protein Baseline Expression displays data from the [Human Protein Atlas](http://www.proteinatlas.org/) expression analysis at either the protein or
  RNA level. Expression levels are classified as low, medium and high as [described](http://www.proteinatlas.org/about/assays+annotation),
  * RNA Baseline Expression displays RNA expression levels from large scale RNA-seq profiling of normal tissues. We include data from six different
  studies to provide a wide coverage of different tissues. Data is provided by the EMBL-EBI [Expression Atlas](https://www.ebi.ac.uk/gxa/home),
  * Gene Ontology terms,
  * Protein Structure information from [PDBe](https://www.ebi.ac.uk/pdbe),
  * Reaction pathway information from [Reactome](http://www.reactome.org),
  * Information on FDA approved and marketed drugs that interact with the target from the [ChEMBLl](https://www.ebi.ac.uk/chembl/) database. In the
  Target Profile page, all drugs for this target are displayed independent of disease,
  * Target Family
  * Bibliography information including the sources of literature data used to annotate the corresponding protein entry in
  EMBL-EBI [UniProt](http://www.uniprot.org) and is provided through [EUROPE PubMed Central](https://europepmc.org/).

### <a name="disease_profile"></a>Disease Profile page

The Disease Profile page provides a summary of the disease and is accessed by clicking on the disease name in name in the Target-Disease Evidence page, or
the "View disease profile" link in the Disease Association page, or the ‘P’ icon  from a pop-up menu.

The Disease Profile page provides a description of the disease and its synonyms from the [EFO](/faq#efo) and its relationship
to other diseases in the ontology. This page also displays the relationships of a disease to its immediate parents and children within the
[EFO](/faq#efo) hierarchy. Clicking on ‘View target associations’ links to the Disease Association page for that disease.

The Drug section on this page provides a list of all FDA-approved and marketed drugs to treat this disease.

### <a name="filters"></a>Filters

A general concept in the platform is that a set of associations can be filtered according to properties of the associations.
The following filters are currently available:

  * Data types: The diseases or targets displayed on the Association page are restricted to those having evidence from the selected data types.
  * Therapeutic areas: This filter restricts diseases shown on the Target Association page by those in the therapeutic areas selected.
  * Pathway types: This filter restricts the targets shown on the Disease Association page to those occurring in the selected [Reactome](http://www.reactome.org) pathway types and individual pathways.

When a Data types or Pathway types filter is applied the number of associations shown on the page is updated, and the number of associations
available in the other filters on the page is also updated. Multiple Data types or Pathway types filters can be applied at the same time.
Where multiple views are available as in the Target Association page, the filters apply across each of the views.

The filters are displayed by default at the top level of the classification. Where additional sub-divisions are available, as for the
Pathway types, clicking the arrow next to a particular Pathway type shows the individual pathways that this type consists of. Clicking
on the arrow for a Therapeutic area filter lists the individual diseases within this area.

### <a name="citation"></a>Citation

If you find the CTTV Target Validation Platform useful, please consider citing us as below:

The CTTV Target Validation Platform [www.targetvalidation.org](www.targetvalidation.org)

### <a name="support"></a>Support and Further Information


For support and feedback on the platform email <support@targetvalidation.org>

If you want to be kept up to date on CTTV and platform developments, email <info@targetvalidation.org>
