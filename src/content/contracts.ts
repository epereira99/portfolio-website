import type { PlaceId } from "./places";
import { placeById } from "./places";
import { PROJECTS, type Project } from "./projects";

/** A project as a contract on the boards. places: every place whose board pins it; the first is its village. */
export type Contract = Project & {
  places: PlaceId[];
  date: string;
  duration: string;
  reason: string;
  goal: string;
  work: string;
  done: boolean;
};

// Placeholder copy until Eduardo writes each contract (spec §9, phase 2).
const soon = { duration: "Coming soon.", reason: "Coming soon.", goal: "Coming soon.", work: "Coming soon." };

const FIELDS: Record<string, Omit<Contract, keyof Project>> = {
  "mambu-migration": { ...soon, places: ["deloitte"], date: "2022–2024", done: true },
  "azure-ml-integrations": { ...soon, places: ["deloitte"], date: "2022–2024", done: true },
  "unet-segmentation": { ...soon, places: ["jordbruksverket", "ju"], date: "2024–2026", done: true },
  "saab-thesis": {
    ...soon,
    places: ["saab", "ju"],
    date: "2024–2026",
    done: true,
    reason:
      "Saab is exploring motion capture to measure shooting performance, but doesn't know how many sensors it needs.",
    goal: "Find the smallest sensor setup that still predicts performance.",
    work:
      "Collected shooting data on Saab's simulator, built CNN models to predict shooting performance, then used " +
      "feature-importance and ablation analyses to find the minimum sensor configuration that preserves predictive performance.",
  },
  "financial-hub": { ...soon, places: ["current-house"], date: "2026–now", done: false },
  "effektify-reconciliation": { ...soon, places: ["effektify"], date: "2026–now", done: false },
};

export const CONTRACTS: Contract[] = PROJECTS.map((p) => ({ ...p, ...FIELDS[p.slug] }));

export function contractBySlug(slug: string): Contract | undefined {
  return CONTRACTS.find((c) => c.slug === slug);
}

export function contractsFor(place: PlaceId | "all"): Contract[] {
  return place === "all" ? CONTRACTS : CONTRACTS.filter((c) => c.places.includes(place));
}

export function villageLabel(c: Contract): string {
  const p = placeById(c.places[0]);
  return p.city ? `${p.name} · ${p.city}` : p.name;
}
