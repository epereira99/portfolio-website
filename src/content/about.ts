// Placeholder copy for the campfire's things (src/about/Campfire.tsx): Eduardo to rewrite in his own words.
export type CampItemId = "sporting" | "kit" | "snowboard" | "tv";

export type CampItem = { id: CampItemId; title: string; body: string };

export const CAMP_ITEMS: CampItem[] = [
  { id: "sporting", title: "Sporting CP", body: "I am a huge Sporting CP fan. Absolutely can not miss a game." },
  { id: "kit", title: "Eduardo · 19", body: "I played at FC Tadim, my local club for about 12 years. I was a striker!" },
  { id: "snowboard", title: "Snowboard", body: "I can get down a slope. But i might spend some time in the ground..." },
  { id: "tv", title: "Old TV", body: "My favorite fantasy show is Game of Thrones. And I love the Westeros universe!" },
];

// Asking him at the camp (src/about/chat.ts): starter questions for Eduardo to confirm, and the notice the brief requires.
export const STARTERS = [
  "What did you do at Jordbruksverket?",
  "Tell me about your thesis with Saab",
  "What football team do you support?",
  "What kind of role are you looking for?",
];
export const CHAT_NOTICE = "This is an AI assistant, answers may be imperfect. Questions may be logged to improve it.";
