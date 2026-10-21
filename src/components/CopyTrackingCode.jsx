import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyTrackingCode({ code }) {
  const [status, setStatus] = useState("");
  const timer = useRef(null);
  const fallbackInput = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      fallbackInput.current.focus();
      fallbackInput.current.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        // Keep the selectable code visible for manual copying.
      }
      setStatus(copied ? "Copied" : "Select and copy the code below.");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 4000);
  }

  return (
    <div className="tracking-copy">
      <button type="button" className="btn secondary-btn" onClick={copyCode}>
        {status === "Copied" ? <Check size={18} /> : <Copy size={18} />}
        {status === "Copied" ? "Copied" : "Copy tracking code"}
      </button>
      <input ref={fallbackInput} aria-label="Tracking code to copy" readOnly value={code} />
      <span role="status">{status}</span>
    </div>
  );
}
