import type { StageId } from "./stages";

export type Project = {
  slug: string;
  title: string;
  stage: StageId;
  order: number; // within its stage, 0-based
  stageLabel: string;
  subtitle: string;
  tags: string[];
  color: string;
  sections: { heading: string; body: string }[];
};

// Write-ups are placeholders until the copy is written (spec §11).
const placeholder = ["The problem", "What I built", "Result"].map((heading) => ({ heading, body: "Coming soon." }));

export const PROJECTS: Project[] = [
  {
    slug: "mambu-migration",
    title: "Mambu migration tool",
    stage: "porto",
    order: 0,
    stageLabel: "Porto · Deloitte",
    subtitle: "Automated core-banking configuration migrations, reused across client projects.",
    tags: ["Python", "REST APIs", "AWS"],
    color: "#2d2d2d",
    sections: placeholder,
  },
  {
    slug: "azure-ml-integrations",
    title: "Azure ML integrations",
    stage: "porto",
    order: 1,
    stageLabel: "Porto · Deloitte",
    subtitle: "Connecting client enterprise systems to Azure Machine Learning models.",
    tags: ["C#/.NET", "Azure ML"],
    color: "#12304a",
    sections: placeholder,
  },
  {
    slug: "unet-segmentation",
    title: "Land analysis with U-Net segmentation",
    stage: "jonkoping",
    order: 0,
    stageLabel: "Jönköping · Jordbruksverket",
    subtitle: "Computer-vision proof of concept on orthophotos and elevation data.",
    tags: ["U-Net", "Computer vision", "Lantmäteriet API"],
    color: "#1f3a24",
    sections: placeholder,
  },
  {
    slug: "saab-thesis",
    title: "Predicting shooting performance from motion",
    stage: "jonkoping",
    order: 1,
    stageLabel: "Jönköping · Master thesis · Saab",
    subtitle: "Neural networks that predict marksmanship from full-body motion capture.",
    tags: ["PyTorch", "Motion capture", "Ablation"],
    color: "#1b2440",
    sections: placeholder,
  },
  {
    slug: "financial-hub",
    title: "Financial Hub",
    stage: "stockholm",
    order: 0,
    stageLabel: "Stockholm · Personal project",
    subtitle: "Multi-bank finance app with tenant isolation and LLM categorization.",
    tags: ["Next.js", "PostgreSQL", "Claude"],
    color: "#2a2145",
    sections: placeholder,
  },
  {
    slug: "effektify-reconciliation",
    title: "Deal reconciliation agents",
    stage: "stockholm",
    order: 1,
    stageLabel: "Stockholm · Effektify",
    subtitle: "AI agents keep Slack and HubSpot in sync, used daily by the sales team.",
    tags: ["Python", "AI agents", "HubSpot API", "Slack"],
    color: "#3a2216",
    sections: placeholder,
  },
];

export function projectsForStage(id: StageId): Project[] {
  return PROJECTS.filter((p) => p.stage === id).sort((a, b) => a.order - b.order);
}

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
