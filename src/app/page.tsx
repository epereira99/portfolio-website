"use client";

import { ScrollDriver } from "@/journey/ScrollDriver";
import { DioramaWalk } from "@/journey/diorama/DioramaWalk";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <DioramaWalk />
      <main>
        <JourneyOverlay />
      </main>
      <BottomBar />
      <ProjectDialog />
    </>
  );
}
