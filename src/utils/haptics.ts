/**
 * Simple Haptic feedback utility for VitaMyStory
 * Uses the Web Vibration API where supported.
 */

export const Haptics = {
    /**
     * A short, sharp vibration for subtle clicks/taps.
     */
    light: () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
        }
    },

    /**
     * A slightly stronger vibration for more significant actions.
     */
    medium: () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(20);
        }
    },

    /**
     * A "heartbeat" pulse pattern for meaningful moments like saving.
     */
    success: () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([20, 30, 20]);
        }
    },

    /**
     * A warning pattern for errors or deletions.
     */
    warning: () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([40, 100, 40]);
        }
    }
};
