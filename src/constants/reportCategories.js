export const REPORT_CATEGORIES = [
  "Water Leak / Burst Pipe",
  "Blocked Drainage",
  "Sewage Overflow",
  "Unsafe Water Point",
  "Flooding / Stagnant Water",
  "Illegal Dumping",
  "Uncollected Waste",
  "Damaged Public Sanitation Facility",
  "Other Utility Risk",
];

export const LEGACY_REPORT_CATEGORIES = [
  "Sewage Leak",
  "Dirty Water",
  "Burst Pipe",
  "Flooding",
  "Broken Public Toilet",
];

export const REPORT_FILTER_CATEGORIES = [
  ...REPORT_CATEGORIES,
  ...LEGACY_REPORT_CATEGORIES,
];

export const DEFAULT_REPORT_CATEGORY = REPORT_CATEGORIES[0];

export const REPORT_CATEGORY_RISK_SCORES = {
  "Water Leak / Burst Pipe": 25,
  "Blocked Drainage": 25,
  "Sewage Overflow": 35,
  "Unsafe Water Point": 30,
  "Flooding / Stagnant Water": 35,
  "Illegal Dumping": 20,
  "Uncollected Waste": 20,
  "Damaged Public Sanitation Facility": 25,
  "Other Utility Risk": 10,
  "Sewage Leak": 35,
  "Dirty Water": 30,
  "Burst Pipe": 25,
  Flooding: 35,
  "Broken Public Toilet": 25,
};
