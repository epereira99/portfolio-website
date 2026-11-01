export type StageId = "braga" | "porto" | "jonkoping" | "stockholm";

/** chapter: the title card shown on entering the stage, also the header's main line. */
export type Stage = { id: StageId; city: string; header: string; chapter: { title: string; detail: string } };

export const STAGES: Stage[] = [
  {
    id: "braga",
    city: "Braga",
    header: "BSc Computer Science · Universidade do Minho · 2017–2022",
    chapter: { title: "BSc Computer Science", detail: "Universidade do Minho · 2017–2022" },
  },
  {
    id: "porto",
    city: "Porto",
    header: "Deloitte · Cloud & DevOps → Integration Software · 2022–2024",
    chapter: { title: "Deloitte", detail: "Cloud & DevOps → Integration Software · 2022–2024" },
  },
  {
    id: "jonkoping",
    city: "Jönköping",
    header: "MSc AI Engineering · Jönköping University · 2024–2026",
    chapter: { title: "MSc AI Engineering", detail: "Jönköping University · 2024–2026" },
  },
  {
    id: "stockholm",
    city: "Stockholm",
    header: "Effektify & personal projects · 2026–now",
    chapter: { title: "Effektify", detail: "Growth & AI · personal projects · 2026–now" },
  },
];
