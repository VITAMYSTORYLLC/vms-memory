'use client';

import { useMemory } from '@/context/MemoryContext';
import MilestoneCelebration from './MilestoneCelebration';

// Thin client component that reads milestone state from context
// and renders the full-screen celebration overlay.
export default function MilestoneWrapper() {
  const { pendingMilestone, dismissMilestone } = useMemory();
  return (
    <MilestoneCelebration
      milestone={pendingMilestone}
      onDismiss={dismissMilestone}
    />
  );
}
