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
  "Water Leak / Burst Pipe": 36,
  "Blocked Drainage": 34,
  "Sewage Overflow": 45,
  "Unsafe Water Point": 45,
  "Flooding / Stagnant Water": 38,
  "Illegal Dumping": 28,
  "Uncollected Waste": 28,
  "Damaged Public Sanitation Facility": 30,
  "Other Utility Risk": 22,
  "Sewage Leak": 45,
  "Dirty Water": 45,
  "Burst Pipe": 36,
  Flooding: 38,
  "Broken Public Toilet": 30,
};
