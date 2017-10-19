# Specification for the expression facets API behaviour

In what follows we summarise the behaviour and UI elements we agreed to have in the RNA expression facet
Note that what follows has been agreed by UX, front-end and back-end. Any differences in the current implementation should be discussed and approved.
Note also, that what follows is both a logical specification and (in less extend) part of the actual design.

All these specs should be converted into both web and api tests to make sure they are respected. 

## UI behaviours

| Status | UI ID | Behaviour | Notes |
| -- | -- | -- | -- |
| [ ] | 1 | The facet always shows all the tissues available. | Not only the ones for which the current set of targets are expressed. |
| [ ] | 2 | Individual tissues can be organised into organ/anatomical systems. | |
| [ ] | 3 | Users can select individual tissues to filter by. | Except tissues with target counts of 0 that should be disabled. |
| [ ] | 4 | Each tissue displays a target count representing the number of targets *expressed* (above the cutoff)in that tissue. | If *only* one tissue is selected, its target counts should match the page target count after selecting it. |
| [ ] | 5 | Upon selecting a tissue a specificity histogram is displayed. |
| [ ] | 6 | Each bar in this specificity histogram represents the number of targets expressed in the tissue/s according to their specificity. | z-score binning covering 1->6 levels. |
| [ ] | 7 | Selecting a bar in the specificity histogram results in filtering the results table / heatmap, the rest of the facets (including the tissues and their counts) and the page target count. | But not the histogram itself. |
| [ ] | 8 | Deselecting all the tissues implies resetting the specificity histogram (ie, no specificity selected). | |
| [ ] | 9 | Selecting more than one tissue involves an OR logic. The specificity histogram needs to be updated with the specificity of the targets in (and only in) those tissues. | |
| [ ] | 10 | The possibility to facet for baseline expression level should be taken into account, although we are not implementing it at this time. | |

### Things to test (not yet agreed on)
- Should the specificity histogram range from cutoff expression or from z-score 0 (ie the mean)?


## API behaviours

| Status | API ID | Behaviour | Notes |
| -- | -- | -- | -- |
| [ ] | 1 | The API supports payloads with tissue(s) fields for specificity and baseline independently. | The baseline is to support #UI10. |
| [ ] | 2 | The API supports payloads with specificity level field. | |
| [ ] | 3 | The API supports payloads with baseline expression level field. | To support #UI10. |
| [ ] | 4 | The API supports payloads with facets fields accepting an array of returning facets. | These are the specific facets returned by the call, not the ones considered as input. |
| [ ] | 5 | The API supports payloads with a field of input facets. | These are the other facets affecting the ones we want in return. |
| [ ] | 6 | The API supports specificity tissue facet. | Assuming we can have a base level in the specificity meaning above the cutoff threshold. This is the returned facet for #API1. |
| [ ] | 7 | The API supports a specificity level facet. | This is the returned facet for API#2 |
| [ ] | 8 | The specificity level facet returns PDF and not CDF. | It is impossible to calculate PDF from CDF in the UI if more than 1 tissue are selected. |
| [ ] | 9 | The API supports baseline tissue facet. | To support #UI10. But there is no need for a baseline expression level facet. |
| [ ] | 10 | In reference to #UI1 the tissues facet response should include all tissues with target counts of 0 or more. | This may require an extra ES call to get all the tissues every time the facet is calculated. |

API4 and API5 have the objective to be able to call each facet specifying its inputs and outputs to handle all the facet logic in the UI.


## General behaviours

The API behaviour allows one call in the UI per facet, so all the logic and special cases needed to support all these specs are self contained in the UI logic.
