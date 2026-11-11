export const DEFAULT_NA_VALUE = "n/a";

/* filter configuration */

// cell types that use numeric filters
export const NUMERIC_CELL_TYPES = ["float", "integer", "pvalue", "percentage_cell"];
export const CATEGORICAL_FILTER_TYPES = ["select", "multiselect", "pie"];

// limits for categorical filters; excess aggregated into "Other"
// note for selects & pies max is actually value + 2 (n/a + Other)
export const MAX_SELECT_OPTS = 7; // maximum unique opts for select / multiselect
export const MAX_TOPICS = 15; // maximum number of terms (topics) for topic filter
export const MAX_PIE_SLICES = 5; // maximum unique pie slices

// cell rendering limits
export const DEFAULT_MAX_LENGTH = 200; // for truncating large text blocks
export const DEFAULT_VISIBLE_LIST_ITEMS = 3; // for lists of items before +N more is shown
