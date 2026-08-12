import { REPORT_CATEGORIES } from "../constants/reportCategories";

const minimumDescriptionLength = 20;

const suggestionRules = [
  {
    issueType: "Sewage Overflow",
    urgency: "Critical",
    riskLevel: "Critical",
    score: 95,
    keywords: [
      "sewage",
      "toilet",
      "wastewater",
      "foul smell",
      "sewer",
      "sewage overflow",
    ],
    reasons: [
      "Sewage and sewer-related reports can spread contamination quickly.",
      "This may require urgent sanitation response and public health follow-up.",
    ],
  },
  {
    issueType: "Unsafe Water Point",
    urgency: "High",
    riskLevel: "High",
    score: 88,
    keywords: [
      "dirty water",
      "unsafe water",
      "contaminated",
      "brown water",
      "smell",
      "turbid",
      "turbidity",
    ],
    reasons: [
      "Water quality keywords suggest possible unsafe supply or contamination.",
      "Unsafe water points can affect many residents if not verified quickly.",
    ],
  },
  {
    issueType: "Flooding / Stagnant Water",
    urgency: "High",
    riskLevel: "High",
    score: 84,
    keywords: [
      "stagnant water",
      "flooding",
      "flood",
      "flooded",
      "standing water",
    ],
    reasons: [
      "Standing or flood water can block access and increase sanitation risk.",
      "The report may need drainage or flood-response prioritization.",
    ],
  },
  {
    issueType: "Blocked Drainage",
    urgency: "High",
    riskLevel: "High",
    score: 82,
    keywords: [
      "blocked drain",
      "blocked drainage",
      "drainage",
      "drain blocked",
      "clogged drain",
    ],
    reasons: [
      "Drainage keywords suggest a possible blockage or overflow risk.",
      "Blocked drains can escalate during rainfall and affect nearby roads or homes.",
    ],
  },
  {
    issueType: "Water Leak / Burst Pipe",
    urgency: "High",
    riskLevel: "High",
    score: 80,
    keywords: [
      "burst pipe",
      "pipe leaking",
      "leak",
      "leaking",
      "water flowing",
      "pipe burst",
    ],
    reasons: [
      "Pipe or leak keywords suggest water loss or service disruption.",
      "Burst pipes can damage roads, contaminate water, or interrupt supply.",
    ],
  },
  {
    issueType: "Uncollected Waste",
    urgency: "High",
    riskLevel: "High",
    score: 72,
    keywords: [
      "uncollected",
      "waste overflow",
      "overflowing waste",
      "garbage pile",
      "trash pile",
    ],
    reasons: [
      "Waste accumulation can create sanitation and drainage risks.",
      "Overflowing waste may need collection or enforcement follow-up.",
    ],
  },
  {
    issueType: "Illegal Dumping",
    urgency: "Medium",
    riskLevel: "Medium",
    score: 64,
    keywords: [
      "garbage",
      "dumping",
      "trash",
      "waste",
      "illegal dumping",
      "dumped",
    ],
    reasons: [
      "Dumping keywords suggest a waste-management issue.",
      "Dumped waste can block drainage and create public sanitation risk.",
    ],
  },
  {
    issueType: "Damaged Public Sanitation Facility",
    urgency: "High",
    riskLevel: "High",
    score: 70,
    keywords: [
      "public toilet",
      "latrine",
      "sanitation facility broken",
      "toilet broken",
      "broken toilet",
    ],
    reasons: [
      "Public sanitation facility keywords suggest a service-access issue.",
      "Broken sanitation facilities can affect many residents or visitors.",
    ],
  },
];

function findMatchedKeywords(description, keywords) {
  return keywords.filter((keyword) =>
    description.includes(keyword)
  );
}

export function getReportSuggestion(description) {
  const normalizedDescription = description
    .trim()
    .toLowerCase();

  if (
    normalizedDescription.length <
    minimumDescriptionLength
  ) {
    return null;
  }

  const matches = suggestionRules
    .map((rule) => ({
      ...rule,
      matchedKeywords: findMatchedKeywords(
        normalizedDescription,
        rule.keywords
      ),
    }))
    .filter((rule) => rule.matchedKeywords.length > 0)
    .sort((first, second) => second.score - first.score);

  if (matches.length === 0) {
    return {
      suggestedIssueType: "Other Utility Risk",
      suggestedUrgency: "Medium",
      suggestedRiskLevel: "Medium",
      reasons: [
        "No strong keyword pattern was detected, so this should be reviewed as a general utility risk.",
      ],
      matchedKeywords: [],
    };
  }

  const bestMatch = matches[0];
  const reasons = Array.from(
    new Set(
      matches
        .slice(0, 2)
        .flatMap((match) => match.reasons)
    )
  ).slice(0, 3);

  return {
    suggestedIssueType: REPORT_CATEGORIES.includes(
      bestMatch.issueType
    )
      ? bestMatch.issueType
      : "Other Utility Risk",
    suggestedUrgency: bestMatch.urgency,
    suggestedRiskLevel: bestMatch.riskLevel,
    reasons,
    matchedKeywords: Array.from(
      new Set(
        matches.flatMap(
          (match) => match.matchedKeywords
        )
      )
    ),
  };
}
