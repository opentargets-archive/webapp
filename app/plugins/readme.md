# Plugins

Profile (target and disease) and evidence pages of the OpenTargets platform employ a "plugin" architecture for flexibility and easier customization of content.
On these pages, each section is a plugin loaded in lazy fashion.

## What is a plugin?
In general computing terms, a plugin is "a software component that adds a specific feature to an existing computer program". If, for example, you've used Adobe Photoshop, then you've probably encountered plugins.

On the OpenTargets platform a plugin is essentially an AngularJS directive (JS file + HTML template) that defines, for example, a visualization. This is a standard approach in AngularJS. What's interesting is how these directives are loaded.

## How does it work on the platform?
Plugins (directives) are organized in directories in `app/plugins`: one directory for each plugin, each containing JS and HTML files (indeed a plugin directory can contain a number of files, all those needed for the visualization).
Pages and plugins are configured in the config JSON file.

```
- app
    - config
        ...
        - general
            - default.json

- plugins
    ...
    - drugs
        drugs-display-directive.js
        drugs-display.html
    ...

- src
    - pages
        ... 
        - disease-profile
            - disease-controller.js
            - disease.html
        - evidence
            - target-disease-controller.js
            - target-disease.html
        ...
        - target-profile
            - target-controller.js
            - target.html
        
```

### Configuration (JSON)

Each section on the page is configured via the JSON config file, where each plugin is defined. So, for example, for the *Drugs* plugin on the *Target profile* page:
```
"targetSections": [
    {
        "name": "drugs",
        "element": "ot-drugs-display",
        "heading": "Drugs",
        "track": true
    }
    ...
]
```


### Page (HTML)

Typically a plugin-based page is built on an `accordion` to enforce lazy loading - a plugin is loaded only when the relative section is expanded.
A `plugin-loader` directive is created for each *section* in the JSON config.

```
 <uib-accordion>
    <div uib-accordion-group ng-repeat="section in sections">
        ...
        <ot-plugin-loader>
```
The `otPluginLoader` is responsible for dynamically loading the actual plugin when the displayed (i.e. when the accordion panel is first displayed).
This means each plugin files (JS, HTML) are only loaded when being displayed.



## Options


### PluginLoader

#### target (=, Object) ####
The target object available on target profile page or evidence page.

#### disease (=, Object) ####
The disease object available on disease profile page or evidence page.

#### plugin (=, String) ####
The 'element' from the JSON (see `Configuration` below).

#### visible (@, Boolean) ####
Boolean flag to define initial visibility.

#### dependencies (=, Object) ####
The dependencies object from the JSON. See *Configuration* section below for details of the JSON.

#### track (=, Boolean) ####
Flag to enable tracking of interaction/use for this plugin (from config JSON). If `true` then we track an event in `$analitics` with `action`, `page` and `label` parameters (see below).

#### page (=, String) ####
The name of the page to be shown in the tracking.

#### action (=, String) ####
The name of the action to be used in the tracking for this plugin.

#### label (=, String) ####
The label to be used in the tracking for this plugin.

#### ext (=, Object) ####
The object used to communicate information back to the page.

```
<ot-plugin-loader 
    target="search.info.gene" 
    disease="search.info.efo" 
    plugin="section.element" 
    visible="{{section.currentVisibility}}"
    dependencies="section.dependencies" 
    page="evidence"
    action="evidence"
    track="section.track"
    label="section.name"
    ext="tables[section.name]"
    class="scroll-table-panel"
    ng-show="tables[section.name].data.length>0">
</ot-plugin-loader>
```


### Configuration

Below are the options that can be specified in the JSON.

#### name (String) ####
The name of the plugin.

#### element (String) ####
The name of the directive, e.g. "ot-drugs-display"

#### heading (String) ####
The heading to be displayed for the plugin (i.e. in the accordion).

#### track (Boolean, optional) ####
Boolean flag to enable tracking.

#### new (Boolean, optional) ####
Boolean flag to enable the `new` icon on the accordion heading to show this is a new feature. It will need to be manually removed when obsolete.

#### dependencies (Object, optional) ####
Specifies the dependencies to be loaded for this plugin. The lazy loading is via SystemJS - for information about the parameters see the [relevant documentation on GitHub](https://github.com/systemjs/systemjs/blob/master/docs/module-formats.md).
```
"dependencies": {
    "vendor/bio-pv.min.js": {
        "format": "global"
    }
}
```



## Tips




## Example

Plugin files
```
    plugins/
        somatic-mutation/
            somatic-mutation-directive.js
            somatic-mutation.html
```

default.json (part)
```
"evidenceSections": [
    {
        "name": "somaticMutation",
        "element": "ot-somatic-mutation",
        "heading": "Somatic mutation",
        "track": true,
        "config": {
            "datatype": "somatic_mutation"
        }
    }
}
```

target-disease.html (part)
```
<uib-accordion close-others="false">
    <div uib-accordion-group 
        ng-repeat="section in sections" 
        is-open="section.defaultVisibility" 
        attr-section-name="{{section.name}}" 
        class="panel-default">

        <!-- accordion header -->
        <uib-accordion-heading>
            <span ng-click='section.currentVisibility = !section.currentVisibility' class="text-nolight" ng-class="{ 'text-disabled': search.association_score.datatypes[section.config.datatype]==0 }">{{section.heading}}</span>
        </uib-accordion-heading>
        
        <div ot-progress-spinner size="30" ng-show="tables[section.name].isLoading || tables[section.name].data === undefined"></div>
        
        <!-- the main plugin -->
        <ot-plugin-loader 
            target="search.info.gene" 
            disease="search.info.efo" 
            plugin="section.element" 
            visible="{{section.currentVisibility}}"
            dependencies="section.dependencies" 
            page="evidence"
            action="evidence"
            track="section.track"
            label="section.name"
            ext="tables[section.name]"
            class="scroll-table-panel"
            ng-show="tables[section.name].data.length>0">
        </ot-plugin-loader>

        <!-- no data -->
        <div ng-show="tables[section.name].data.length===0">No data available</div>

        <!-- error -->
        <uib-alert type="danger" ng-show="tables[section.name].hasError" ng-cloak style="margin-top:15px">
            <span class="fa fa-exclamation-triangle" aria-hidden="true"></span> There was an error retrieving {{tables[section.name].heading}} data. Please try again later.
        </uib-alert>

    </div>

</uib-accordion>
```

somatic-mutation.html
```
<!-- plugin template -->
<div ng-show="ext.data.length>0">
    <ot-source-list list="sources"></ot-source-list>
    <ot-somatic-mutation-table 
        target="{{target.id}}"
        disease="{{disease.efo}}"
        title="{{target.approved_symbol}}-{{disease.label}}"
        ext="ext">
    </ot-somatic-mutation-table>
</div>
<div ng-show="ext.data.length==0"><p>No data available</p></div>
```

somatic-mutation-directive.js
```
angular.module('otPlugins')
    .directive('otSomaticMutation', ['otConfig', 'otUtils', function (otConfig, otUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/somatic-mutation/somatic-mutation.html',
            scope: {
                target: '=',
                disease: '=',
                ext: '=?'
            },
            link: function (scope) {
                scope.ext = scope.ext || {};
                scope.sources = otConfig.evidence_sources.somatic_mutation.map(function (s) {
                    otConsts.datasources object
                    var ds = otUtils.getDatasourceById(s);

                    return {
                        label: ds.label,
                        url: ds.infoUrl
                    };
                });
            }
        };
    }]);
```