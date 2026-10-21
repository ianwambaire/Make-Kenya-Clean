import { RISK_DESCRIPTIONS } from "../constants/riskDescriptions";

export default function RiskGuide({ urgency = false }) {
  return (
    <details className="risk-guide">
      <summary>What do {urgency ? "urgency" : "risk"} levels mean?</summary>
      <p>
        {urgency
          ? "Urgency is how quickly you think the issue needs attention. The Maji Risk Index is calculated separately from the issue type, urgency, nearby sensitive places, and photo evidence. The two levels may differ."
          : "The Maji Risk Index is a system-calculated score from 0 to 100 that helps teams prioritize reports. It is separate from the urgency chosen by the reporter. A higher score means greater assessed risk."}
      </p>
      <dl>
        {Object.entries(RISK_DESCRIPTIONS).map(([label, explanation]) => (
          <div key={label}><dt>{label}</dt><dd>{explanation}</dd></div>
        ))}
      </dl>
      <p>A priority level does not guarantee a response time.</p>
    </details>
  );
}
