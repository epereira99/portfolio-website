"use client";

import { ScrollDriver } from "@/journey/ScrollDriver";
import { LowpolyWalk } from "@/journey/lowpoly/LowpolyWalk";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

export default function Classic() {
  return (
    <>
      <ScrollDriver />
      <LowpolyWalk />
      <main>
        <JourneyOverlay />
      </main>
      <BottomBar />
      <ProjectDialog />
    </>
  );
}
