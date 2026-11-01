"use client";

import dynamic from "next/dynamic";
import { ScrollDriver } from "@/journey/ScrollDriver";

const JourneyCanvas = dynamic(() => import("@/journey/scene/JourneyCanvas").then((m) => m.JourneyCanvas), { ssr: false });

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <JourneyCanvas />
    </>
  );
}
