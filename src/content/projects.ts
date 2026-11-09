import type { StageId } from "./stages";
import { DEGREES } from "./degrees";

/** The Projects menu's three folders, in the order they branch out. */
export const TOPICS = [
  { id: "software", label: "Software" },
  { id: "ai", label: "AI" },
  { id: "awards", label: "Awards" },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"];

export type Project = {
  slug: string;
  title: string;
  stage: StageId;
  topic?: TopicId; // its folder in the Projects menu; degrees have none
  order: number; // within its stage, 0-based
  subtitle: string;
  tags: string[];
  color?: string; // the card's top graphic; without one (degrees) the card has none
  sections: { heading: string; body: string }[];
  lists?: { heading: string; items: string[] }[]; // e.g. a degree's subjects
  logo?: { src: string; alt: string }; // shown at the card's top right, beside the title
  // polaroids taped beside the dialog; caption is handwritten. long: a tall document, enlarged at reading width to scroll.
  // wide: a 16:9 screenshot, shown whole instead of cropped to the portrait frame
  images?: { src: string; alt: string; caption?: string; long?: boolean; wide?: boolean }[];
  link?: { href: string; label: string }; // e.g. the published thesis, under the tags
};

export const PROJECTS: Project[] = [
  {
    slug: "mambu-migration",
    title: "Mambu migration tool",
    stage: "porto",
    topic: "software",
    order: 0,
    subtitle: "Automated core-banking configuration migrations, reused across client projects.",
    logo: { src: "/logos/western-union.png", alt: "Western Union" },
    tags: ["Python", "REST APIs", "AWS Lambda", "Mambu"],
    color: "#2d2d2d",
    sections: [
      {
        heading: "The problem",
        body:
          "On a core-banking project for Western Union built on Mambu, every new environment had to be configured by hand. " +
          "Copying the configuration from one environment to another was slow, repetitive and easy to get wrong.",
      },
      {
        heading: "What I built",
        body:
          "I was asked to automate it, and built a Python script that takes two Mambu environments " +
          "and, through the Mambu REST API, clones the configuration of the first into the second. " +
          "It was later hosted as an AWS Lambda function, so a migration ran on demand instead of by hand.",
      },
      {
        heading: "Result",
        body:
          "Setting up an environment went from long manual work to a single run. " +
          "The tool outlived the project it was built for: it was reused on other client projects, including other international banks.",
      },
    ],
  },
  {
    slug: "azure-ml-integrations",
    title: "Claim document classification and extraction",
    stage: "porto",
    topic: "software",
    order: 1,
    subtitle: "Reading insurance claim documents automatically instead of typing them in by hand.",
    logo: { src: "/logos/ageas.png", alt: "Ageas" },
    tags: ["C#/.NET", "Azure ML", "Azure Functions", "Service Bus", "SQL"],
    color: "#12304a",
    sections: [
      {
        heading: "The problem",
        body:
          "Ageas Seguros, a large insurance company in Portugal, receives all kinds of documents with every claim: " +
          "invoices, doctor's notes, prescriptions and more, sometimes as PDFs and sometimes as photos. " +
          "An employee looked at each one and typed its information into the system by hand. " +
          "The goal was to remove that step: recognise what each document is, then extract its data automatically.",
      },
      {
        heading: "What I built",
        body:
          "A .NET orchestrator that connects Ageas's system to machine-learning models hosted in Azure. " +
          "For each document it calls a classification model to find out what type of document it is, saves the answer, " +
          "then sends the document to the extraction model for that type and saves the extracted data in a SQL database. " +
          "It runs on Azure Functions, with Service Bus carrying the messages between steps and Blob Storage holding the documents. " +
          "I wrote the code as a junior developer, with senior developers owning the architecture.",
      },
      {
        heading: "Result",
        body:
          "I delivered the integration layer and the system went into production, " +
          "the first step of a plan to phase out the manual typing gradually. I then moved on to another project.",
      },
    ],
  },
  {
    slug: "outsystems-salesforce",
    title: "OutSystems–Salesforce integration layer",
    stage: "porto",
    topic: "software",
    order: 2,
    subtitle: "Serving Salesforce data to an OutSystems front end, and loading company data into Salesforce every night.",
    logo: { src: "/logos/ageas.png", alt: "Ageas" },
    tags: ["C#/.NET", "Azure", "REST APIs", "OutSystems", "Salesforce"],
    color: "#1a2f4a",
    sections: [
      {
        heading: "The problem",
        body:
          "Ageas Seguros was building a front end in OutSystems on top of a Salesforce back end. " +
          "The front end needed only a small, simple slice of the Salesforce data. " +
          "And much of the data Salesforce needed didn't live there: it sat in other databases and systems across the company.",
      },
      {
        heading: "What I built",
        body:
          "An integration layer in .NET on Azure that consumes the Salesforce API, simplifies the data, " +
          "and exposes its own API that sends OutSystems only what it needs. " +
          "Alongside it, a nightly load that brings the data from the company's other systems into Salesforce: " +
          "hundreds of thousands of records every night. " +
          "We were two developers, overseen by a senior developer.",
      },
      {
        heading: "Result",
        body:
          "I built the majority of both, wrote the documentation, and handed it over to my colleagues before I left the project.",
      },
    ],
  },
  {
    slug: "unet-segmentation",
    title: "Land analysis with U-Net segmentation",
    stage: "jonkoping",
    topic: "ai",
    order: 0,
    subtitle: "Computer-vision proof of concept on orthophotos and elevation data.",
    logo: { src: "/logos/jordbruksverket.png", alt: "Jordbruksverket" },
    tags: ["U-Net", "Computer vision", "Lantmäteriet API"],
    color: "#1f3a24",
    images: [
      {
        src: "/projects/unet-segmentation-prorata.webp",
        alt: "Aerial photo of a grazed pasture dotted with piles of stones and rocky patches",
        caption: "What prorata looks like",
      },
      {
        src: "/projects/unet-segmentation-preprocessing.webp",
        alt: "Four panels of one orthophoto: the original with field outlines, annotations blended over it, colored masks with prorata in red, and the image with the background removed",
        caption: "Masks for training",
      },
    ],
    sections: [
      {
        heading: "The problem",
        body:
          "Jordbruksverket, the Swedish Board of Agriculture, pays out about SEK 13 billion a year in farm support. " +
          "For pasture, the eligible area is reduced by how much of it is covered by trees, bushes and rocks, the \"prorata\" share. " +
          "Domain experts spend long hours outlining it by hand on orthophotos, sometimes it can only be judged with an in-person visit, " +
          "and the backlog of fields still to annotate has led to fines from the EU. " +
          "The agency was keen on AI but unsure where to apply it, and our team was there to turn that interest into a proof of concept " +
          "that identifies prorata automatically.",
      },
      {
        heading: "What I built",
        body:
          "After researching image-segmentation methods, I worked with one other developer on a U-Net model that segments prorata features " +
          "from orthophotos, adding elevation data from the Lantmäteriet API for context. " +
          "I wrote preprocessing that applies the annotation masks to the orthophotos. Training on whole images, over 230 million pixels each " +
          "and mostly field, was far too slow and unbalanced, so I cut them into 512×512 patches with as many prorata patches as field ones. " +
          "I also built a bridge tool that turns Lantmäteriet orthophoto tiles into links opening BASEN, the agency's annotation software, " +
          "at the right coordinates, so the annotation team could go straight to each location.",
      },
      {
        heading: "Result",
        body:
          "Data access came late, and the model was too heavy for a laptop: an overnight run finished 5 of 50 epochs in 14 hours. " +
          "GPU access couldn't be set up in time, so instead of a trained model we delivered a presentation with the method, " +
          "the hardware and infrastructure it needs, and a roadmap for taking it further.",
      },
    ],
  },
  {
    slug: "jonkoping-sodra",
    title: "Player analysis for Jönköpings Södra",
    stage: "jonkoping",
    topic: "ai",
    order: 1,
    subtitle: "Automated scouting reports from Wyscout and SofaScore data for the football club.",
    logo: { src: "/logos/jonkopings-sodra.png", alt: "Jönköpings Södra IF" },
    tags: ["Python", "Wyscout API", "SofaScore API", "Supabase"],
    color: "#3a1d24",
    images: [
      {
        src: "/projects/jonkoping-sodra.webp",
        alt: "A generated scouting report for striker L. Lyck: profile radar, position, shot, pass and dribble maps, heatmaps and a league comparison",
        caption: "Scouting report",
        long: true,
      },
    ],
    sections: [
      {
        heading: "The problem",
        body:
          "Jönköping University and Jönköpings Södra, a small Swedish football club, announced a partnership to build an analytics hub for the club. " +
          "I love football so I contacted the teacher responsible and joined as a volunteer, owning the player-analysis section. " +
          "A small club has no data department: management and the coach needed a quick, repeatable way to see how a player really performs.",
      },
      {
        heading: "What I built",
        body:
          "A Python pipeline that pulls match events and advanced stats from the Wyscout API and player information from SofaScore, " +
          "and caches league-wide data so reports rebuild quickly. Each player is benchmarked against the league's players in the same position, " +
          "bucketed by where they spent the most minutes. " +
          "From that it generates a self-contained report per player: a pizza chart against the position's benchmarks, comparison radars, " +
          "a position map, a shot map sized by xG, assist, dribble and pass maps, heatmaps, " +
          "and position-specific views such as wingers' dribbles against xG + xA.",
      },
      {
        heading: "Result",
        body: "The reports are published to the club's analytics dashboard, where management and the coach can open them for any player.",
      },
    ],
  },
  {
    slug: "jibs-entrepreneurship-challenge",
    title: "JIBS Entrepreneurship Challenge",
    stage: "jonkoping",
    topic: "awards",
    order: 2,
    subtitle: "1st place with a plan for zero food waste at a family business, built in 24 hours.",
    logo: { src: "/logos/mardskog-lindkvist.png", alt: "Mårdskog & Lindkvist AB" },
    tags: ["Case competition", "Entrepreneurship", "Sustainability"],
    color: "#3a3016",
    images: [
      {
        src: "/projects/jibs-entrepreneurship-challenge.webp",
        alt: "Eduardo and his three teammates in front of the JIBS Entrepreneurship Challenge backdrop",
        caption: "1st place · 2025",
      },
    ],
    sections: [
      {
        heading: "The case",
        body:
          "24 hours on a real case from Mårdskog & Lindkvist AB: make the business more sustainable " +
          "while staying true to the family company's core values. We set ourselves one ambitious goal: 0% food waste.",
      },
      {
        heading: "Our solution",
        body:
          "Three steps. An AI-powered demand forecasting model, so the company stops over- and understocking. " +
          "An expiration-date tracking system, so near-expiring food is caught before it goes to waste. " +
          "And giving back to the community: food that is close to its date is donated to charities, " +
          "used at community events or sold on Too Good To Go.",
      },
      {
        heading: "Result",
        body:
          "1st place, with Marta Sikora, Sára Czifrik and Greta Czovek. I couldn't be at the grand final, " +
          "but I knew my team would get it done, and they did.",
      },
    ],
  },
  {
    slug: "jibs-case-competition",
    title: "JIBS 24h Case Competition",
    stage: "jonkoping",
    topic: "awards",
    order: 3,
    subtitle: "1st place again: taking Golfamore from SEO to AI-driven search, and into the Dutch market.",
    logo: { src: "/logos/golfamore.png", alt: "Golfamore" },
    tags: ["Case competition", "Consulting", "AI search", "Market entry"],
    color: "#16303a",
    images: [
      {
        src: "/projects/jibs-case-competition.webp",
        alt: "Eduardo and his three teammates holding the Golfamore Case Challenge Winner cheque",
        caption: "1st place, again!",
      },
    ],
    sections: [
      {
        heading: "The case",
        body:
          "People are moving from search engines like Google to LLMs like ChatGPT, Gemini and Perplexity. " +
          "Golfamore asked us for a strategic plan to go from SEO dominance to leading in AI-driven search, " +
          "and for a market entry strategy into the Netherlands.",
      },
      {
        heading: "Our solution",
        body:
          "Make Golfamore a first-class data provider, not just a brand in search results. Three phases: " +
          "grow its digital footprint for LLMs, with the Dutch market first; build an open API; " +
          "then partner with an LLM as a trusted data source.",
      },
      {
        heading: "Result",
        body:
          "1st place, organised by the Case Consulting Club, with the same team: Greta Czovek, Marta Sikora and Sára Czifrik. " +
          "This one taught us to turn complex digital innovation into a compelling story with a step-by-step plan.",
      },
    ],
  },
  {
    slug: "saab-thesis",
    title: "AI Driven Sensor Optimization for Marksman Posture Analysis - Master Thesis",
    stage: "jonkoping",
    topic: "ai",
    order: 4,
    subtitle: "Which motion-capture sensors does it take to predict how well someone shoots?",
    logo: { src: "/logos/saab.png", alt: "Saab" },
    tags: ["PyTorch", "Motion capture", "Feature importance", "Ablation"],
    color: "#1b2440",
    link: { href: "https://www.diva-portal.org/smash/get/diva2:2074089/FULLTEXT01.pdf", label: "Read the thesis" },
    images: [
      {
        src: "/projects/saab-thesis.webp",
        alt: "Thesis poster: motion capture, AI models, shooting predictions and sensor importance, with model accuracy results, in collaboration with Saab",
        caption: "The thesis poster",
      },
    ],
    sections: [
      {
        heading: "The question",
        body:
          "Saab is exploring motion capture to measure shooting performance and give feedback during training, and wanted to investigate how many sensors are needed to accurately track meaningful data. " +
          "Can full-body shooting kinematics predict burst-fire performance, and how few motion-capture sensors " +
          "can you keep while still predicting it well?",
      },
      {
        heading: "What we did",
        body:
          "We designed and ran our own data collection: 20 shooters, 10 experienced and 10 inexperienced, each " +
          "calibrated in a motion-capture suit, shooting 2 rounds of 30 targets with 3-round bursts per target. " +
          "We built a framework that combines the motion capture with the virtual-shooting simulator's output, " +
          "studied the biomechanics behind weapon stability, accuracy and bullet dispersion in automatic fire, " +
          "and trained neural networks to identify shooters' experience and performance, as well as predict recoil and burst outcomes, from their motion data. " +
          "We then used feature-importance and ablation analyses on these neural networks to find the smallest sensor set that keeps the predictions.",
      },
      {
        heading: "Result",
        body:
          "The best models reached an F1-score of 0.91 on a shooter's performance level, 0.76 on experience, 0.69 on recoil direction " +
          "and 0.41 on single-burst outcome. Sensor importance was dominated by the arms (58%), followed by the legs (10%) and the spine (9%).",
      },
      {
        heading: "Our advice on sensors",
        body:
          "Keep sensors across the whole upper body, not just the shooting arm. The arms carried most of the signal, " +
          "but a reduced set of the six arm joints (shoulder, elbow and wrist on both sides) did worse on every target than all 22 joints. " +
          "And to read recoil, keep sensors with good acceleration sensing, which matters most in the moments after each shot. " +
          "These are evidence-guided recommendations from what the models relied on; " +
          "the next step is to physically remove sensors and measure how much the predictions degrade.",
      },
    ],
  },
  {
    slug: "financial-hub",
    title: "Financial Hub",
    stage: "personal",
    topic: "software",
    order: 0,
    subtitle: "Multi-bank finance app with tenant isolation and LLM categorization.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Claude API", "Vercel"],
    color: "#2a2145",
    link: { href: "https://financial-hub-dev.vercel.app", label: "Live app (invite-only)" },
    images: [
      {
        src: "/projects/financial-hub-dashboard.webp",
        alt: "Financial Hub's monthly dashboard with demo data: October spending against the average, a donut of where it went, biggest changes and a category table",
        caption: "The monthly dashboard",
        wide: true,
      },
    ],
    sections: [
      {
        heading: "The problem",
        body:
          "I wanted one private place to see where my money actually goes. Bank exports come in different formats and currencies, " +
          "and commercial trackers either charge or want a bank connection through a data broker. " +
          "Financial Hub runs on statement exports the user already has the right to download.",
      },
      {
        heading: "What I built",
        body:
          "A Next.js app on Vercel with PostgreSQL. Statements import from Revolut out of the box; for any other bank's CSV or Excel file, " +
          "Claude proposes a column mapping from a sample of rows, which is validated before use. Duplicates are caught by a fingerprint, " +
          "so overlapping statements are fine, and every transaction is converted at the exchange rate of its own day. " +
          "Categories come from a cascade: your own choices, then learned merchants, then rules, and Claude only for merchants never seen before, " +
          "receiving merchant names and nothing else, never amounts or dates. " +
          "Households get Mine, Ours and Everything views with settle-up for shared costs. " +
          "Each user's data is isolated in three layers: Postgres row-level security, a scoped data layer, and a cross-tenant test per module; " +
          "the app refuses to start if its database role could bypass the security.",
      },
      {
        heading: "Result",
        body:
          "Live and invite-only, with a dashboard, a searchable transaction list and spending trends. " +
          "Built over about 400 commits, with 160 test files.",
      },
    ],
  },
  {
    slug: "effektify-reconciliation",
    title: "Deal reconciliation agents",
    stage: "stockholm",
    topic: "ai",
    order: 0,
    subtitle: "AI agents keep Slack and HubSpot in sync, used daily by the sales team.",
    logo: { src: "/logos/effektify.png", alt: "Effektify" },
    tags: ["Python", "AI agents", "Claude", "HubSpot API", "Slack"],
    color: "#3a2216",
    sections: [
      {
        heading: "The problem",
        body:
          "Effektify's sales team celebrates every closed deal in a Slack channel, informally and in Swedish " +
          "(\"avtal påskrivet\", \"5 000 kr/mån × 3 mån\"), but often never logged it in HubSpot, the CRM. " +
          "So HubSpot, and every revenue figure built on it, was missing deals.",
      },
      {
        heading: "What I built",
        body:
          "Three scheduled AI agents and a Slack bot. Every day, the first agent reads the new posts, decides which are really signed deals " +
          "(not \"signing on Friday\"), and turns them into structured records with MRR, term, contract value and ARR; when something is ambiguous " +
          "it asks the person who posted a specific question and settles it from their reply. " +
          "Every evening, a second agent compares those deals with a HubSpot export, matching company names despite legal suffixes and allowing " +
          "5% on amounts, and keeps a reconciliation list. " +
          "Every morning, a third re-checks against a fresh export and has the bot message each rep whose deals are still missing or wrong, " +
          "cheeky but friendly. " +
          "The bot, Annoying Steve, written in Python, is the only part that holds the Slack and HubSpot tokens: the agents send it commands " +
          "through a private relay channel, and it obeys only approved senders and channels. Nothing ever writes to HubSpot automatically.",
      },
      {
        heading: "Result",
        body:
          "The system is in daily use by the sales team. Every run is logged, and managers can close exceptions, " +
          "like a discount agreed after posting, from a tracker page.",
      },
    ],
  },
];

export function projectsForTopic(id: TopicId): Project[] {
  return PROJECTS.filter((p) => p.topic === id);
}

export function projectsForStage(id: StageId): Project[] {
  return PROJECTS.filter((p) => p.stage === id).sort((a, b) => a.order - b.order);
}

/** Projects, plus the degrees that open the same way from their chapter. */
export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug) ?? DEGREES.find((d) => d.slug === slug);
}
