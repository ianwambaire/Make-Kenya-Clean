export const RISK_DESCRIPTIONS = {
  Low: "Routine issue with limited immediate risk.",
  Medium: "Needs attention but no immediate danger.",
  High: "Significant risk requiring prompt response.",
  Critical: "Immediate or severe risk requiring priority attention.",
};

export function riskTooltip(label) {
  return `Maji Risk Index: ${label || "Unknown"}. ${RISK_DESCRIPTIONS[label] || "Risk level is not available."} Calculated by the system; separate from the reporter's urgency choice.`;
}
