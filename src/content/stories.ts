import type { Beat } from "@/journey/beats";
import type { StageId } from "./stages";

// Your story, told beside him as he walks. Each stage is a list of blocks; each block is a list of lines, one chat
// bubble per line. A stage's time is shared equally between its blocks. In a block, the lines appear one after
// another, stay a moment, then the whole block fades away, and there's a quiet gap before the next block starts.
// At most 3 bubbles are on screen at once (2 on a phone).
//
// A line can bring in project cards, under the chapter, by naming them (their slug from content/projects.ts):
//   { say: "I built an automation for Western Union.", show: "mambu-migration" },
//   { say: "Two projects at once.", show: ["unet-segmentation", "jonkoping-sodra"] },
// A card appears with the line that mentions it and goes away with its block (or when a later line names another).
// An empty list ([]) shows nothing there: no placeholder.

export const STORIES: Record<StageId, Beat[][]> = {
  // BSc Computer Science · Universidade do Minho · 2017–2022
  braga: [
    [
      { say: "This is where it all started." },
      { say: "I was 17, and I jumped into the world of computer science." },
      { say: "Yes, back in the dark ages, when there was no AI to bail you out." },
      {
        say: "When all we had was Stack Overflow, coffee, and that random guy who somehow fixed your three-day bug in 10 minutes.",
      },
      {
        say: "Courses were very demanding, but it built the foundation for my career.",
      },
      {
        say: "I learned a lot, and I made some amazing friends, who are still close friends today.",
      },
    ],
  ],

  // Deloitte · Cloud & DevOps → Integration Software · 2022–2024
  porto: [
    [
      { say: "Deloitte is where I became a professional." },
      { say: "I started out working with cloud and infrastructure." },
      {
        say: "And I used APIs to build an automation tool for a project at Western Union.",
        show: "mambu-migration",
      },
      { say: "It was later sold to other clients in the financial services sector." },
    ],
    [
      { say: "I took part in other PoCs and small projects with Python and React." },
      { say: "But something was missing. I wanted more…" },
      { say: "I made the move from Cloud & DevOps to Software Development." },
      { say: "I started building integration software in .NET, where I built my own APIs." },
      {
        say: "First in an ML document classification project for Ageas, a big insurance player in Portugal.",
        show: "azure-ml-integrations",
      },
      // Drafted from your CV to finish your "And then…": rewrite it in your own words.
      {
        say: "And then an integration layer connecting OutSystems front ends with Salesforce, through Azure.",
        show: "outsystems-salesforce",
      },
    ],
  ],

  // MSc AI Engineering · Jönköping University · 2024–2026
  jonkoping: [
    [
      { say: "Life was great, but AI piqued my curiosity." },
      { say: "So I moved across Europe to beautiful Jönköping." },
      { say: "Here I learned all about AI, and made lots of friends." },
      {
        say: "I did some amazing projects with Jordbruksverket and Jönköpings Södra.",
        show: ["unet-segmentation", "jonkoping-sodra"],
      },
      { say: "I even won 2 case competitions!", show: ["jibs-entrepreneurship-challenge", "jibs-case-competition"] },
      { say: "But the peak was a really cool thesis at Saab.", show: "saab-thesis" },
    ],
    [
      { say: "Now I knew AI, and I had my degree. I was ready to go home." },
      { say: "But Sweden stole my heart." },
      { say: "Well, one Swede in particular stole my heart." },
    ],
  ],

  // Effektify · Growth & AI · Aug–Oct 2026
  stockholm: [
    [
      {
        say: "I moved to Stockholm and started an internship at Effektify, where I'm building automations that make their day-to-day easier.",
        show: "effektify-reconciliation",
      },
    ],
  ],

  // Personal projects
  // Five equal blocks, so the three projects get the same time: the empty first one sits under the chapter title, the
  // empty last one under the ending (both take that part of this stage's time).
  personal: [
    [],
    // Drafts, so each project has a line to come in with: rewrite them in your own words.
    [{ say: "And in my own time, I build things like Financial Hub.", show: "financial-hub" }],
    [{ say: "And this website, every tree and campfire on it.", show: "portfolio-website" }],
    [{ say: "Plus the AI that answers as me at the campfire.", show: "portfolio-rag" }],
    [{ say: "Go to the About Me section and ask it something!", show: "portfolio-rag" }],
    [],
  ],
};

// Beside him at the very end, as "The next chapter starts here." appears.
// Said on the home screen, before the first stage, while he faces you; the lines come in as you start scrolling.
export const INTRO_STORY: string[] = [
  "Hey, great to see you here.",
  "My name is Eduardo, I'm an AI/ML and Software engineer and this is my website!",
  "I'm a yapper, so let's take a walk and I'll tell you all about my journey.",
];

export const ENDING_STORY: string[] = ["It's been a crazy journey!", "And i would love you to be a part of it!", "So sent me an email, or a message on LinkedIn, and let's talk for real!"];
  