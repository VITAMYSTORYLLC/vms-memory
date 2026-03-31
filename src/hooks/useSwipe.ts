import { useRef } from "react";
import { Haptics } from "@/utils/haptics";

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null);
  const endX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const minSwipeDistance = 40;

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    endX.current = null;
    startX.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    endX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (startX.current === null || endX.current === null) return;
    const distance = startX.current - endX.current;
    if (distance > minSwipeDistance) onSwipeLeft();
    if (distance < -minSwipeDistance) onSwipeRight();
    startX.current = null;
    endX.current = null;
  };

  // Mouse handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    endX.current = null;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    endX.current = e.clientX;
  };

  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (startX.current === null || endX.current === null) return;
    const distance = startX.current - endX.current;
    if (distance > minSwipeDistance) {
      onSwipeLeft();
      Haptics.light();
    }
    if (distance < -minSwipeDistance) {
      onSwipeRight();
      Haptics.light();
    }

    startX.current = null;
    endX.current = null;
  };

  const onMouseLeave = () => {
    if (isDragging.current) {
      onMouseUp();
    }
  };

  return {
    onTouchStart, onTouchMove, onTouchEnd,
    onMouseDown, onMouseMove, onMouseUp, onMouseLeave
  };
}
