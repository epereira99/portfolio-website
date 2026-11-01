export type StageId = "braga" | "porto" | "jonkoping" | "stockholm";

export type Stage = { id: StageId; city: string; header: string };

export const STAGES: Stage[] = [
  { id: "braga", city: "Braga", header: "BSc Computer Science · Universidade do Minho · 2017–2022" },
  { id: "porto", city: "Porto", header: "Deloitte · Cloud & DevOps → Integration Software · 2022–2024" },
  { id: "jonkoping", city: "Jönköping", header: "MSc AI Engineering · Jönköping University · 2024–2026" },
  { id: "stockholm", city: "Stockholm", header: "Effektify & personal projects · 2026–now" },
];
