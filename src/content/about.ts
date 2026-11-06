// Placeholder copy for the campfire's things (src/about/Campfire.tsx): Eduardo to rewrite in his own words.
export type CampItemId = "sporting" | "kit" | "football" | "snowboard" | "tv";

export type CampItem = { id: CampItemId; title: string; body: string };

export const CAMP_ITEMS: CampItem[] = [
  { id: "sporting", title: "Sporting CP", body: "My club. Green and white hoops, win or lose." },
  { id: "kit", title: "Eduardo · 19", body: "My own shirt, from the team I play for." },
  { id: "football", title: "Football", body: "Never far from a ball. Five-a-side whenever there's a pitch and a few friends." },
  { id: "snowboard", title: "Snowboard", body: "Winters up north taught me to snowboard. Still falling, less often." },
  { id: "tv", title: "Old TV", body: "Grew up on cartoons and video games in front of one of these." },
];
