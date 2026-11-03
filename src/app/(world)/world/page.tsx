import { World } from "@/world/World";
import { WORLD } from "@/world/view";

export const metadata = { title: "Bug Hunter · Eduardo Pereira" };

export default function WorldPage() {
  return <World initial={WORLD} />;
}
