# Adding a new data source to any of the available data types

Adding a new data source to any of the existing data types does not involve any change in the web code. You will just be dealing with changes in a several configuration files.

## Quick overview of configuration

All configuration files live in `app/config` and are organized in folders for each specific config section. Config files are merged at build time.

```
consts
    default.json
datasources
    default.json
datatypes
    default.json
dictionary
    default.json
general
    default.json
```
All the folders under `app/config` contain a `default.json` file that contains the configuration used by the public version of the Open Targets web application.
If you want to override any field in the configuration object, create a new file named `custom.json` in the same folder. In `custom.json` include the properties you want to override.

### Example

In the evidence table, you need to display the column to distinguish public and private data. This is defined by the `show_access_level` property in `general/default.json`.

Create (if not already existing) the file `general/custom.json`.
Your file structure now looks like this
```
consts
    default.json
datasources
    default.json
datatypes
    default.json
dictionary
    default.json
general
    custom.json
    default.json
```
Add the following to `custom.json`:

```
    {
        "show_access_level" : true
    }
```
Build the webapp again.

## Adding a new data source

Datatypes are defined in `config/datatypes/`. You will need to add the new datatsource to the relevant 
* `default.json` modify this if you're adding datasources to the public version.
* `custom.json` modify this if your're adding to your private version only.

The example below shows how to add to the public version.

### 1. Define the datasource

Choose a name for your data source. We normally use all capitals and join all words of the name with underscores. For example `UNIPROT_SOMATIC`.

Datasources are defined in `config/datasources/`:
* `default.json` modify this if you're adding to the public version.
* `custom.json` modify this if your're adding to your private version only.

```
"UNIPROT_SOMATIC": {
    "id": "uniprot_somatic",
    "label": "Uniprot somatic",
    "infoUrl": "/data-sources#uniprot_somatic",
    "infoTemplate": "uniprot-somatic.md"
}
```
* *id*: the name of the data source as understood by the rest api
* *label*: the label of the data source as you want it displayed in the webapp (typically in the list of data sources in the evidence tables, facets, etc)
* *infoUrl*: url to the explanation of the data source (help pages)
* *infoTemplate*: markdown file with description for help page. This

### 2. Add datasource to evidence datatypes

The list of evidence sources are defined in the general app config `config/general/`:
* `default.json` modify this if you're adding to the public version.
* `custom.json` modify this if your're adding to your private version only.
```
"evidence_sources" : {
    "genetic_association" : {
        "common" : ["GWAS", "PHEWAS"],
        "rare" : ["UNIPROT", "EVA", "UNIPROT_LITERATURE", "GENE_2_PHENOTYPE", "GENOMICS_ENGLAND"]
    },
    "somatic_mutation": ["CANCER_GENE_CENSUS", "UNIPROT_SOMATIC", "EVA_SOMATIC", "INTOGEN"],
    "known_drug" : ["CHEMBL"],
    "rna_expression" : ["EXPRESSION_ATLAS"],
    "pathway" : ["REACTOME", "SLAPENRICH"],
    "animal_model" : ["PHENODIGM"],
    "literature" : ["EPMC"]
},
```
*Note*

*`evidence_sources` will probably be retired in the future. For this reason datasources are also added to each datatype definition in `config/datatypes` but this is not currently used yet.*

### 3. That's all!

Next time you build and load the web application the new data source will be shown in the facets of the associations pages and the data displayed in the corresponding evidence table.
