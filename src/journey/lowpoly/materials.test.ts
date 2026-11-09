import { expect, test } from "vitest";
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial } from "three";
import { figureMaterials, flatMaterials } from "./materials";

const model = (...names: string[]) => {
  const root = new Group();
  for (const name of names) root.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name, color: "#3f66a3" })));
  return root;
};
const worn = (root: Group) => root.children.map((m) => (m as Mesh).material);

// React runs memoised setup twice in development: whatever the second run returns must be what the meshes wear.
test("the scene's flat materials survive being set up twice", () => {
  const root = model("ground", "path", "ground");
  flatMaterials(root);
  const bySlot = flatMaterials(root);
  expect(worn(root)).toEqual([bySlot.get("ground"), bySlot.get("path"), bySlot.get("ground")]);
});

test("the walker's tintable materials survive being set up twice, keeping his own colours", () => {
  const root = model("jeans");
  figureMaterials(root);
  const [{ material, base }] = figureMaterials(root);
  expect(worn(root)).toEqual([material]);
  expect(base.getHexString()).toBe(new Color("#3f66a3").getHexString());
});
