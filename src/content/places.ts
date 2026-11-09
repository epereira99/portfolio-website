export type PlaceId =
  | "childhood-house"
  | "uminho"
  | "deloitte"
  | "current-house"
  | "ju"
  | "saab"
  | "jordbruksverket"
  | "effektify";

/** A spot on the world map. side: which bank of the river. degree: slug in content/degrees.ts an academy opens. */
export type Place = { id: PlaceId; name: string; city?: string; side: "portugal" | "sweden"; degree?: string };

export const PLACES: Place[] = [
  { id: "childhood-house", name: "Childhood house", side: "portugal" },
  { id: "uminho", name: "UMinho academy", city: "Braga", side: "portugal", degree: "bsc-computer-science" },
  { id: "deloitte", name: "Deloitte", city: "Porto", side: "portugal" },
  { id: "current-house", name: "Current house", side: "sweden" },
  { id: "ju", name: "Jönköping University academy", city: "Jönköping", side: "sweden", degree: "msc-ai-engineering" },
  { id: "saab", name: "Saab", city: "Jönköping", side: "sweden" },
  { id: "jordbruksverket", name: "Jordbruksverket", city: "Jönköping", side: "sweden" },
  { id: "effektify", name: "Effektify", city: "Stockholm", side: "sweden" },
];

export function placeById(id: PlaceId): Place {
  return PLACES.find((p) => p.id === id)!;
}
