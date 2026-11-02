export type StageId = "braga" | "porto" | "jonkoping" | "stockholm";

/** chapter: the title card shown through the stage, also the header's main line. dot: a coloured full stop after the title. */
export type Stage = { id: StageId; city: string; header: string; chapter: { title: string; detail: string; dot?: string } };

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
    chapter: { title: "Deloitte", detail: "Cloud & DevOps → Integration Software · 2022–2024", dot: "#86bc25" }, // Deloitte's green dot
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
