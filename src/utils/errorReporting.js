export function reportClientError(error, context = {}) {
  const safeContext = {
    area: context.area || "app",
    route: globalThis.location?.pathname || "",
  };

  if (import.meta.env.DEV) {
    console.error("Make Kenya Clean client error", {
      message:
        error instanceof Error ? error.message : String(error),
      context: safeContext,
    });
  }
}

export function userMessageForError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");

  if (!message) {
    return "Something went wrong. Please try again.";
  }

  if (
    /permission|policy|jwt|token|database|sql|schema/i.test(
      message
    )
  ) {
    return "We could not complete that request safely. Please try again or contact Make Kenya Clean support.";
  }

  return message;
}
