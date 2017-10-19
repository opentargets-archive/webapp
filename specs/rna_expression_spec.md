# Specification for the expression facets API behaviour

In what follows we summarise the behaviour and UI elements we agreed to have in the RNA expression facet
Note that what follows has been agreed by UX, front-end and back-end. Any differences in the current implementation should be discussed and approved.
Note also, that what follows is both a logical specification and (in less extend) part of the actual design.

All these specs should be converted into both web and api tests to make sure they are respected. 

## UI behaviours

| Status | UI ID | Behaviour | Notes |
| -- | -- | -- | -- |
| <ul><li>[]</li><li> | 1 | The facet shows all the tissues available. | Not only the ones for which the current set of targets are expressed. |
| [ ] | 2 | Individual tissues can be organised into organ/anatomical systems. | |
| [ ] | 3 | Users can select individual tissues to filter by. | Except tissues with target counts of 0 that should be disabled. |
| [ ] | 4 | Each tissue displays a target count representing the number of targets *expressed* in that tissue. | If *only* one tissue is selected, its target counts should match the page target count. |
| [ ] | 5 | Upon selecting a tissue a specificity histogram is displayed. |
| [ ] | 6 | Each bar in this specificity histogram represents the number of targets expressed in the tissue/s according to their specificity. | z-score binning covering 0->6 levels. |
| [ ] | 7 | Selecting a bar in the specificity histogram results in filtering the results table / heatmap, the rest of the facets (including the tissues and their counts) and the page target count. | But not the histogram itself. |
| [ ] | 8 | Deselecting all the tissues implies resetting the specificity histogram (ie, no specificity selected). | |
| [ ] | 9 | Selecting more than one tissue involves an OR logic. The specificity histogram needs to be updated with the specificity of the targets in those tissues. | |
| [ ] | 10 | The possibility to facet for baseline expression level should be taken into account, although we are not implementing it at this time. | |


## API behaviours

| Status | API ID | Behaviour | Notes |
| -- | -- | -- | -- |
| [ ] | 1 | The API supports payloads with tissue(s) fields. | |
| [ ] | 2 | The API supports payloads with specificity level field. | |
| [ ] | 3 | The API supports payloads with baseline expression level field. | To support #UI9. |
| [ ] | 4 | The API supports payloads with facets fields accepting an array. | These are the specific facets returned by the call, not the ones considered as input. |
| [ ] | 5 | The API supports payloads with a field of input facets. | These are the other facets affecting the ones we want in return. |
| [ ] | 6 | The API supports a unique tissue facet that corresponds to baseline expression levels. | |
| [ ] | 7 | The API supports a specificity level facet. | |
| [ ] | 8 | The specificity level facet returns PDF and not CDF. | It is impossible to calculate PDF from CDF in the UI if more than 1 tissue is selected. |
| [ ] | 9 | The API supports a baseline expression facet. | To support #UI10. But there is no need for a baseline expression level facet. |

## Web app - API communication

| Status | COMM ID | Behaviour | Notes |
| -- | -- | -- | -- |
| [ ] | 1 | Each facet makes a call to the API specifying the facet fields it needs in return and the payload to calculate them. |  |
| [ ] | 2 | The tissues facet needs to make a second call to get the correct counts of targets *expressed* (baseline expression level above threshold) in the tissue if no specificity level is set. | The counts if no specificity or baseline expression level is set defaults to all genes expressed or not |
