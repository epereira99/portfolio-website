"use client";

import { ScrollDriver } from "@/journey/ScrollDriver";
import { MemoryWalk } from "@/journey/memory/MemoryWalk";
import { VoyageMap } from "@/journey/voyage/VoyageMap";
import { StageHeader } from "@/ui/StageHeader";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <MemoryWalk />
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
