import { redirect } from "next/navigation";

// About me is the camp by the road near the journey's end, in the home page's 3D world (src/about/Campfire.tsx).
export default function About() {
  redirect("/#about");
}
