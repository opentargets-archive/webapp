# Adding a new data source to any of the available data types

Adding a new data source to any of the existing data types does not involve any change in the web code. You will just be dealing with changes in a several configuration files.
All these configuration files live in `app/config`.

All the folders under `app/config` contain a `default.json` file that contains the configuration used by the public version of the Open Targets web application.
In general, if you want to override any field in the configuration object, create a new file under the same folder (for example add a new json file `myconfig.json` in `general`) and include in that json file the properties you want to override.

In the list shown below change `default.json` for your specific file (`myconfig.json`) if you are not adding this new data source in the public version.


## To add a new data source follow these steps:
 
1. Choose a name for your data source. We normally use all capitals and for convenience join all words of the name with underscores. For example `UNIPROT_SOMATIC`.

2. Add this name to the list of data sources for its data type in `app/config/general/default.json`.

3. Add a new entry in `app/config/consts/default.json` in `dbs` and `dbs_info_url` using the name defined above as key. In the `dbs` entry the value of the new entry should be the name of the data source as understood by the rest api. In `dbs_info_url` the new entry value should be the url to the explanation of the data source.

4. Add a new entry in `app/config/dictionary/default.json` using as key the name defined above and as value the label of the data source as you want it displayed in the web (typically in the list of data sources in the evidence tables).

That's all! Next time you build and load the web application the new data source will be shown in the facets of the associations pages and the data displayed in the corresponding evidence table.
