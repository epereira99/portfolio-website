"use client";

import dynamic from "next/dynamic";
import { ScrollDriver } from "@/journey/ScrollDriver";
import { VoyageMap } from "@/journey/voyage/VoyageMap";
import { StageHeader } from "@/ui/StageHeader";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

const JourneyCanvas = dynamic(() => import("@/journey/scene/JourneyCanvas").then((m) => m.JourneyCanvas), { ssr: false });

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <JourneyCanvas />
      <VoyageMap />
      <StageHeader />
      <main>
        <JourneyOverlay />
      </main>
      <BottomBar />
      <ProjectDialog />
    </>
  );
}
