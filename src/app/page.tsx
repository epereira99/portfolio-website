"use client";

import { ScrollDriver } from "@/journey/ScrollDriver";
import { LowpolyWalk } from "@/journey/lowpoly/LowpolyWalk";
import { StageHeader } from "@/ui/StageHeader";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <LowpolyWalk />
      <StageHeader />
      <main>
        <JourneyOverlay />
      </main>
      <BottomBar />
      <ProjectDialog />
    </>
  );
}
