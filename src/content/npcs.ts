import type { PlaceId } from "./places";

/** A real person standing in the world. Eduardo writes each line; approved: the person has consented to it. */
export type Npc = { id: string; name: string; place: PlaceId; line: string; approved: boolean };

// Filled in by Eduardo (spec §9, phase 2).
export const NPCS: Npc[] = [];

export function visibleNpcs(list: Npc[] = NPCS): Npc[] {
  return list.filter((n) => n.approved);
}
