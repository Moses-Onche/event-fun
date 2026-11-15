export const SITE_NAME = "EventFun";

export const CATEGORIES = [
  "Music",
  "Tech",
  "Business",
  "Arts & Culture",
  "Food & Drink",
  "Sports & Fitness",
  "Community",
  "Education",
  "Party & Nightlife",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
