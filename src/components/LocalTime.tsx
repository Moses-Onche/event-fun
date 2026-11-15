"use client";

import { useEffect, useState } from "react";

const UTC_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

/**
 * Renders a date in the viewer's own timezone. The server renders UTC first so
 * hydration matches, then the browser swaps in the local time.
 */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => `${new Date(iso).toLocaleString("en-US", UTC_FORMAT)} UTC`);

  useEffect(() => {
    setText(new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
  }, [iso]);

  return <time dateTime={iso}>{text}</time>;
}
