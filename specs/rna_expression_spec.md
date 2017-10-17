# Specification for the expression facets API behaviour
In what follows, I have tried to map the expected UI behaviours to requirements on the API request/response cycle. While there are two independent facets that may be used (for baseline and specificity), the following requirements should apply equally to both.

Note that what follows is the idealised pattern that should be agreed by UX, front-end and back-end. Any differences in the current implementation can then be updated. Hopefully, this then minimizes too many iterations.

Note also, that what follows is a logical specification, so the actual design is limited by this, but still flexible.

## UI behaviours

| UI ID | Behaviour | Notes |
| -- | -- | -- |
| 1 | Users can select individual tissues to filter by. | |
| 2 | Users can select a threshold level to filter by. | |
| 3 | Each tissue displays a target count. | |
| 4 | Each level displays a target count. | |
| 5 | The levels 1-n should represent expression above the cutoff threshold. | |
| 6 | Targets below the cutoff threshold should have level 0. | The 0/-1 distinction is more relevant on the target profile page. |
| 7 | Targets with no expression data should have level -1. | The 0/-1 distinction is more relevant on the target profile page. |
| 8 | If no level is set and a user selects a tissue, the level should also be set (to 1). | This makes the filter immediately effective on tissue selection. |
| 9 | Each tissue's target count should represent 'the number of targets expressed in that tissue at the specified level, or 1+, if no level is specified' | 1+ in the unset level case because of **UI8**. |
| 10 | No tissue with a target count of zero should ever be visible. | Could not reasonably click. However, means the tissue list might shrink based on level. |
| 11 | Individual tissues can be organised into organ/anatomical systems. | To aid searching of a large tissue list (84+). |
| 12 | Selection of multiple tissues should use OR logic. | Consequently, tissues' target counts can be larger than the page target count. |
| 13 | Each level's target count should represent 'the number of targets expressed at that level in the specified tissue set, or all tissues, if no tissues are specified.' | Not cumulative. |
| 14 | The levels and their target counts should be represented as a histogram. | |
| 15 | The (selected) levels' target counts should sum to the page target count. | |
| 16 | After selecting a tissue, the (prior) target count should match the (post) page target count. | |
| 17 | After selecting the level, the (prior) sum of currentlevel-n target counts should match the (post) page target count. | |

### Contentious items
`UI8`, `UI10`, `UI12`

## API specs
Currently, the facets data is retrieved for all facets in a single POST request to the `association/filter` endpoint.

The expression facets are relevant only to the disease associations page, so the request payload is assumed to contain a `disease` field (array of one element), as well as the standard `facets` field (boolean; set to `true`).

Ideally, each spec in the following table should be testable.

| API ID | UI ID | Requirement |
| -- | -- | -- |
| 1 | 1 | API supports payloads with tissue(s) field. |
| 2 | 2 | API supports payloads with level field. |
| 3 | 3 | API response contains target counts per level. Ideally PDF not CDF. |
| 4 | 4 | API response contains target counts per tissue. |
| 5 | 5 | API response should consider levels 1-n as meaning *expressed* (in raw terms or in terms of specificity). |
| 6 | 6 | API response should consider level 0 to mean *below the cutoff threshold*. |
| 7 | 7 | API response should consider level -1 to mean *no RNAseq data exists for this target*. |
| 8 | 9 | Payload with absent `level` field should infer `level>=1` when aggregating tissue target counts. |
| 9 | 9 | Payload with `level=k` field should infer `level>=k` when aggregating tissue target counts. |
| 10 | 10 | Response can contain tissues with zero target counts, but it is not required (if they exist, front-end will filter them). |
| 11 | 11 | Response should contain one or more organ label and one or more anatomical system label per tissue. |
| 12 | 12, 13 | Payload with array of tissues. Response levels' target counts should be count of targets at each specific level in **any** of the array of tissues. |
| 13 | 12, 13 | Payload with no tissues. Response levels' target counts should be count of targets at each specific level in **any** of the full set of tissues. |
| 13 | 13 | API response should ideally contain PDF values (ie. not cumulative). It can only contain a CDF if *Down the rabbit hole...* is resolved, else the PDF cannot be reconstructed by front-end. |
| 14 | 15 | API response should ensure levels' target counts sum equals page target count. (See *Down the rabbit hole...*) |

## Issue: No self application and OR
`UI16` fails and will fail on will fail on **any** facet as long as we combine `UI12` with the paradigm `A facet doesn't apply to itself`. Selecting a single item in a given facet is fine; the problem occurs when two or more items **share** targets.
**How do we resolve this?**

## Issue: Down the rabbit hole...
Having thought about the behavioural requirements, it seems that `UI12` and `UI15` are incompatible (also affects `UI17`). Assuming `UI12`, suppose we focus on the following table:

| | tissue A | tissue B | tissue C |
| -- | -- | -- | -- |
| gene X | 3 | 4 | 5 |

Now, when calculating the levels' target counts, A will include X, as will B and C. This means gene X has been counted more than once, so `UI15` will fail, since there is only one gene.
**How do we resolve this?**

## Which API specs are not currently met?

### Applies to both baseline and specificity
Checking the `UI*` expected behaviours against the current implementation, the failing items are:

| Behaviour | Comment |
| -- | -- |
| `UI9` | Test: Are the tissues' target counts the same with or without the `level=1` set. |
| `UI13, UI15, UI17` | Test: Select several tissues and then incrementally change the level parameter; the change in page target count should match the count of the bar added/removed. |
| `UI16` | Test: Select two or more tissues sequentially and check that the page target count after refresh matches the number on each newly selected tissue (one at a time). Fails when two tissues' target sets overlap (see *No self application and OR*). |

### Applies to baseline only
Checking the `UI*` expected behaviours against the current implementation, the failing items (in addition those applying to baseline and specificity) are:

| Behaviour | Comment |
| -- | -- |

### Applies to specificity only
Checking the `UI*` expected behaviours against the current implementation, the failing items (in addition those applying to baseline and specificity) are:
| Behaviour | Comment |
| -- | -- |
| `UI5-7` | Test: Verify against zscore specification (see [this doc](https://github.com/opentargets/expression_analysis/blob/master/rna_expression_analysis.ipynb)). Currently, specificity table values [-1 = below mean, 0 = mean to top decile, 1-n = bins on top decile]. Proposed fix: move to [-1 = gene not present, 0 = gene below cutoff threshold, 1-n = bins on all possible z-score values within (-inf, +inf)] |
