export type StageId = "braga" | "porto" | "jonkoping" | "stockholm" | "personal";

/** chapter: the title card shown through the stage, also the header's main line. dot: a coloured full stop after the title.
 * logo: shown in the card's top corner.
 * degree: slug of a degree (content/degrees.ts) the chapter opens like a project.
 * Eduardo's words for each stage, shown on the right, live in content/stories.ts. */
export type Stage = {
  id: StageId;
  city: string;
  header: string;
  chapter: { title: string; detail: string; dot?: string; logo?: { src: string; alt: string } };
  degree?: string;
};

export const STAGES: Stage[] = [
  {
    id: "braga",
    city: "Braga",
    header: "BSc Computer Science · Universidade do Minho · 2017–2022",
    chapter: {
      title: "BSc Computer Science",
      detail: "Universidade do Minho · 2017–2022",
      logo: { src: "/uminho-mark.png", alt: "University of Minho" },
    },
    degree: "bsc-computer-science",
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
    chapter: {
      title: "MSc AI Engineering",
      detail: "Jönköping University · 2024–2026",
      logo: { src: "/ju-mark.png", alt: "Jönköping University" },
    },
    degree: "msc-ai-engineering",
  },
  {
    id: "stockholm",
    city: "Stockholm",
    header: "Effektify · Growth & AI · Aug–Oct 2026",
    chapter: {
      title: "Effektify",
      detail: "Growth & AI · Aug–Oct 2026",
      logo: { src: "/logos/effektify.png", alt: "Effektify" },
    },
  },
  {
    id: "personal",
    city: "Personal",
    header: "Personal projects",
    chapter: { title: "Personal projects", detail: "Built in my own time" },
  },
];
