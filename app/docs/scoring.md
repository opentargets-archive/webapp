Scoring target-disease associations
===================================

One of the aims of the CTTV platform is to allow prioritisation of targets based on their associated evidence. We have
developed a scoring system to help you to answer questions such as:

  * Which targets have the most evidence for association with a specific disease?
  * What is the relative weight of evidence between different targets for a disease?

The score quantifies what CTTV believe to be the key factors relating to the confidence in the evidence.

<a name="Association_score"></a>The Association Score
--------------------

The overall association score between a target and a disease is a numerical value indicating the strength of the association. The value is in the range 0 to 1,
with 1 indicating the strongest associations. Negative scores will correspond to negative evidence (although not implemented in the current version). A score of 0
corresponds to no evidence.

The overall association score is produced by combining the scores for the target and disease from the individual [data types](/data_sources) (genetic associations,
known drugs, etc.), and is represented as a flower where each petal represents a different data type. The amount of filled colour in each petal represents
the relative score within each data type.

Each association data type results from the integration of one or multiple data sources, and the association score for each data type depends on the
underlying strength of each piece of evidence supporting an associations.

Computing the Association Score
-----

To compute the association score, we first start by generating a score for each piece of evidence within a data type. This score summarises the strength of this
evidence by accounting for factors specific to the data type that affect the relative strength.  Specifically we define the score as

**S** = *f* . *S* . *C* . *a*

where

  * **S** is the score,
  * *f* is a term that take into account the frequency of the occurrence of the evidence in the database,
  * *S* is a term that represents the strength of the effect, for instance the severity of the mutation in a genetic evidence,
  * *C* is a term that reflects the confidence of the observation for the evidence,
  * *a* is a heuristic term used to adjust the score to reflect the relative contribution of the data type to the overall association score.

The factors involved in computing the evidence score are summarised in the table [below](#factors)

To calculate an overall score for the data type we try to reflect both the fact that seeing multiple occurrences of evidence that supports
an association provides replication, while at the same time if many pieces of evidence supporting the association have been seen, adding an
additional one does not have great value. Hence we calculate the sum of the harmonic series of the individual evidence scores ordered by value.

To obtain the overall association scores for a target and a disease, we calculate the sum of the harmonic series of the individual data type scores
adjusting the contribution of each data type using a heuristic weighting.

At each score stage of score calculation, the value of the score is capped to 1 which represents a highly confident association.  Thus highly confident curated evidence
always scores 1.

The current scoring implementation is actively being developed and CTTV is working on a statistical framework to refine the scoring scheme.

<a name="factors"></a>

| Data type | Contributing Factors to Score |
|----------|-------------------------------|
| Drugs | ChEMBL Score: Drug development pipeline progression score (Pre-clinical, Phase I, Phase II, Phase III, Phase IV, Approved)|
| RNA Expression | Expression Atlas score: p-value, abs(log2(fold_change)),  rank|
| Genetic Associations | GWAS Catalog score: [target to variant mapping score](/variants), GWAS association p value,  sample_size, severity score|
| |EVA normalised score: [target to variant mapping score](/variants), pathogenicity score from ClinVar|
| |UniProt score: 0.5 (maybe affected by) or 1 (is affected by) depending on curation confidence|
| Somatic Mutations| COSMIC score: 1 (curated)|
||EVA score: target to variant score, pathogenicity score from ClinVar|
| Literature Mining|Europe PMC normalised co-occurrence score: title co-occurrences score + abstract co-occurrences score + full text co-occurrences score|
| Affected Pathways | Reactome score: 1 (curated)|
| Animal Models | [Phenodigm similarity score](http://database.oxfordjournals.org/content/2013/bat025)|
