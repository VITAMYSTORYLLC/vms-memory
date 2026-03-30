# VitaMyStory — Project Structure & Style Guide

## Directory Map

```
/
├── app/                             # Next.js App Router routes ONLY
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home route (/)
│   ├── globals.css                  # Global styles
│   ├── apple-icon.png               # iOS home screen icon (Next.js convention)
│   ├── icon.png                     # Favicon (Next.js convention)
│   ├── api/                         # Server-side route handlers
│   │   ├── create-book-checkout/    # Stripe checkout
│   │   ├── cron/reminders/          # Vercel cron job
│   │   ├── notify/                  # Push notification sender
│   │   ├── submit-answer/           # Family answer submission
│   │   └── sw-config/               # Service worker config
│   └── [route]/                     # Each page route lives here
│       └── page.tsx
│
├── components/                      # Shared, reusable UI
│   ├── ui/                          # Primitive, stateless UI atoms
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   ├── ArrowButton.tsx
│   │   └── Toast.tsx
│   └── layout/                      # App shell components
│       ├── BottomNav.tsx
│       ├── SplashScreen.tsx
│       ├── PageTransition.tsx
│       ├── AddMenu.tsx
│       └── FirebaseErrorGuard.tsx
│
├── features/                        # Feature-sliced components
│   ├── auth/                        # Authentication & onboarding
│   │   ├── AuthForm.tsx
│   │   ├── AuthModal.tsx
│   │   ├── GuestBanner.tsx
│   │   └── LandingScreen.tsx
│   ├── stories/                     # Story creation, viewing, sharing
│   │   ├── StoryCarousel.tsx
│   │   ├── ShareCard.tsx
│   │   ├── CommentSection.tsx
│   │   ├── StoryComments.tsx
│   │   ├── EngagementBar.tsx
│   │   ├── MemoryFlash.tsx
│   │   ├── RefineModal.tsx
│   │   ├── ExportModal.tsx
│   │   └── BookPdf.tsx
│   ├── family/                      # Family connections & collaboration
│   │   ├── FriendPicker.tsx
│   │   └── PendingAnswers.tsx
│   └── milestones/                  # Achievement celebrations & tutorials
│       ├── MilestoneCelebration.tsx
│       ├── MilestoneWrapper.tsx
│       └── PostTutorial.tsx
│
├── hooks/                           # Custom React hooks
│   ├── useAuth.ts
│   ├── useAudioRecorder.ts
│   ├── useDictation.ts
│   ├── useEngagement.ts
│   ├── useFriends.ts
│   ├── usePushNotifications.ts
│   ├── useSwipe.ts
│   └── useSync.ts
│
├── context/                         # React context providers
│   └── MemoryContext.tsx            # Central app state
│
├── lib/                             # Third-party client initialization
│   ├── firebase.ts                  # Firebase client SDK
│   └── firebaseAdmin.ts             # Firebase Admin SDK (server-side only)
│
├── utils/                           # Pure utility functions
│   ├── index.ts                     # General helpers
│   ├── ai.ts                        # Gemini AI integration
│   ├── engagement.ts                # Social engagement (likes, comments, shares)
│   ├── haptics.ts                   # Haptic feedback (Web API)
│   ├── questions.ts                 # Question generation logic
│   ├── storage.ts                   # Firebase Storage upload/delete
│   └── text.tsx                     # Text formatting (returns JSX)
│
├── types/                           # TypeScript interfaces
│   └── index.ts
│
├── constants/                       # App-wide constants
│   └── index.ts                     # TEXT (i18n EN/ES), QUESTIONS, LS keys
│
├── public/                          # Static assets
│   ├── assets/
│   │   ├── images/                  # Logos, OG image, tutorial images
│   │   │   ├── logo-transparent.png
│   │   │   ├── logo-dark.png
│   │   │   ├── logo-white.png
│   │   │   ├── og-image.png
│   │   │   ├── tutorial-1.png
│   │   │   └── tutorial-2.png
│   │   └── icons/                   # PWA icons
│   │       ├── icon-192x192.png
│   │       └── icon-512x512.png
│   ├── manifest.json                # PWA manifest (must stay at root)
│   ├── firebase-messaging-sw.js     # Firebase messaging service worker
│   ├── sw.js                        # Main PWA service worker
│   └── workbox-*.js                 # Workbox caching library
│
└── docs/                            # Project documentation & specs
    ├── STYLE_GUIDE.md               # This file
    ├── APP_DOCUMENTATION.md
    ├── QUICK_REFERENCE.md
    └── GEMINI.md
```

---

## Where New Code Lives

### Adding a new page

Create a folder inside `app/`:

```
app/[route-name]/
└── page.tsx
```

The page file imports components using `@/` aliases only — no relative `../` paths crossing into other directories.

### Adding a new UI component

**Reusable across the entire app with no domain knowledge** → `components/ui/`

Examples: buttons, inputs, modals shells, toasts.

Rules:
- No Firebase imports
- No context imports
- No business logic

**App shell or navigation** → `components/layout/`

Examples: nav bars, wrappers, error boundaries.

### Adding a feature-specific component

Identify which feature domain it belongs to and place it in the corresponding `features/<domain>/` folder. If no existing domain fits, create a new one:

```
features/payments/
└── CheckoutButton.tsx
```

A component belongs in `features/` (not `components/`) when it cannot be reused across different feature domains without modification.

### Adding a custom hook

All hooks go in `hooks/`. One hook per file, filename starts with `use`.

```
hooks/useMyFeature.ts
```

Rules:
- Export as named export
- Encapsulate Firebase, device APIs, or complex stateful logic
- No JSX — hooks return data and callbacks, not components

### Adding utility functions

`utils/` is for pure functions. No React, no side effects beyond what the function signature explicitly communicates.

```
utils/myHelper.ts
```

If a utility is tightly coupled to Firebase reads/writes, put it in `utils/engagement.ts` or `utils/storage.ts` patterns and use `@/lib/firebase` for the db/storage import.

### Adding server-side logic

All API routes live inside `app/api/`. Each route is a folder with a `route.ts` file:

```
app/api/[endpoint-name]/
└── route.ts
```

Server-only Firebase logic uses `@/lib/firebaseAdmin`. Never import `firebaseAdmin` in client components.

### Adding types

Add to `types/index.ts`. This file is imported everywhere — keep it flat and well-commented.

### Adding constants or i18n strings

Add to `constants/index.ts`. The `TEXT` object has both `en` and `es` keys for every string. Always add both languages together.

### Adding images or icons

- Logos and general images → `public/assets/images/`
- PWA icons → `public/assets/icons/`
- Reference in code as `/assets/images/filename.png`

Do NOT move `sw.js`, `workbox-*.js`, or `firebase-messaging-sw.js` — they must remain at the `public/` root for the browser's service worker scope to work correctly.

---

## Import Style

Always use the `@/` alias. Never use relative paths (`../../`) that cross directory boundaries.

```ts
// Correct
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { TEXT } from "@/constants";
import type { Person } from "@/types";

// Wrong
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../hooks/useAuth";
```

Relative imports (`./`) are acceptable only for siblings within the same folder:

```ts
// OK — both files are in features/auth/
import { AuthForm } from "./AuthForm";
```

---

## Key Constraints

| Rule | Reason |
|------|--------|
| `app/` contains routes only | Next.js App Router convention; shared code at root is cleaner and avoids accidental route collisions |
| `components/ui/` has no Firebase or context | These components must remain portable and testable in isolation |
| `lib/firebaseAdmin` is server-side only | Firebase Admin SDK uses Node.js APIs; importing it in a client component crashes the browser bundle |
| Service workers stay at `public/` root | Browsers enforce that a service worker's scope is the directory it is served from |
| `app/apple-icon.png` and `app/icon.png` stay in `app/` | Next.js App Router resolves these as special metadata files by convention |
