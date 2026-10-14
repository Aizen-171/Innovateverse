# Design System Specification
## INNOVATEVERSE: AI-Powered Campus Innovation Platform
**Style Direction:** Editorial Technology & AI-Native Aesthetic  
**Implementation:** Pure Vanilla CSS Tokens & Modular Component Styles  
**Version:** 1.0.0

---

### 1. Philosophy & Aesthetic Identity

InnovateVerse departs from generic purple-gradient hackathon tropes. Instead, it adopts an **Editorial Technology** aesthetic:
- **Tone:** Authoritative, high-tech, academic yet energetic, trustworthy.
- **Atmosphere:** Deep midnight surfaces (`#080c14` to `#0f172a`) with crisp border luminescence and razor-sharp typographic hierarchy.
- **Color Accents:** Restrained indigo (`#6366f1`), electric cyan (`#38bdf8`), and deep violet (`#8b5cf6`) reserved strictly for interactive affordances, metrics, and AI intelligence signals.
- **Motion:** Subtle, physics-informed micro-interactions (180ms - 300ms ease-out) that never impede task completion or cause motion fatigue.

---

### 2. Design Tokens

#### 2.1 Color Palette
```css
:root {
  /* Surfaces & Backgrounds */
  --bg-canvas: #070a12;          /* Root application canvas */
  --bg-surface: #0e1422;         /* Cards, navigation headers */
  --bg-surface-raised: #141c2e;  /* Elevated panels, dropdowns */
  --bg-surface-active: #1b263e;  /* Hover and active states */
  --bg-surface-input: #090e1a;   /* Form field fill */

  /* Luminescence & Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.14);
  --border-focus: #6366f1;
  --border-highlight: rgba(99, 102, 241, 0.35);

  /* Typography Colors */
  --text-primary: #f8fafc;       /* Highest contrast headers and titles */
  --text-secondary: #94a3b8;     /* Body paragraphs and descriptions */
  --text-tertiary: #64748b;      /* Metadata, timestamps, captions */
  --text-disabled: #475569;      /* Disabled labels */

  /* Brand Accents */
  --accent-primary: #6366f1;     /* Editorial Indigo */
  --accent-primary-hover: #4f46e5;
  --accent-primary-glow: rgba(99, 102, 241, 0.2);

  --accent-cyan: #06b6d4;        /* Live telemetry / AI scanning */
  --accent-cyan-glow: rgba(6, 182, 212, 0.2);

  --accent-violet: #8b5cf6;      /* AI Copilot & Intelligence */
  --accent-violet-glow: rgba(139, 92, 246, 0.25);

  /* Semantic Feedback */
  --color-success: #10b981;      /* Emerald */
  --color-success-bg: rgba(16, 185, 129, 0.12);
  --color-warning: #f59e0b;      /* Amber */
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-danger: #ef4444;       /* Rose */
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-info: #3b82f6;         /* Sky */
  --color-info-bg: rgba(59, 130, 246, 0.12);
}
```

#### 2.2 Typography Scale
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Type Scale */
  --text-display: clamp(2.25rem, 4vw, 3.25rem); /* Hero headlines */
  --text-h1: clamp(1.75rem, 3vw, 2.25rem);      /* Page titles */
  --text-h2: 1.5rem;                            /* Section titles */
  --text-h3: 1.1875rem;                         /* Card headers */
  --text-body: 0.9375rem;                       /* Paragraphs */
  --text-body-sm: 0.84375rem;                   /* Auxiliary copy */
  --text-caption: 0.75rem;                      /* Badges, tags, timestamps */
}
```

#### 2.3 Spacing & Layout
```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  --max-w-content: 1240px;
}
```

---

### 3. Component Standards

#### 3.1 Buttons
- **Primary:** Solid indigo background with subtle glow, crisp white text, 10px radius, hover translateY(-1px).
- **Secondary:** Surface raised with subtle border, high contrast white text, clean hover state.
- **Copilot / Intelligence:** Violet gradient with spark icon, subtle animated shimmer border on hover.
- **Danger:** Subtle red outline and fill with high contrast text for destructive actions (e.g. project deletion).

#### 3.2 Cards & Surfaces
- Layered surfaces using `background: var(--bg-surface)` and `border: 1px solid var(--border-subtle)`.
- Cards implement an ambient hover micro-lift:
  `transform: translateY(-2px); border-color: var(--border-highlight); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);`

#### 3.3 Stage Badges & Categories
- **Ideation:** Blue badge (`rgba(59, 130, 246, 0.15)` text `#60a5fa`).
- **Prototype:** Violet badge (`rgba(139, 92, 246, 0.15)` text `#c084fc`).
- **In Progress:** Amber badge (`rgba(245, 158, 11, 0.15)` text `#fbbf24`).
- **Showcase Ready:** Emerald badge (`rgba(16, 185, 129, 0.15)` text `#34d399`).

#### 3.4 AI Copilot Diagnostic Card
- Distinctive midnight-violet framing.
- Radial score gauge with progress color mapping (Green for 80+, Amber for 60-79).
- Two-column grid with structured pill badges for Target Users, Critical Assumptions, and Lean MVP Suggestions.

---

### 4. Accessibility & Responsiveness

1. **Focus States:** Every interactive element has an explicit, high-contrast keyboard focus ring (`outline: 2px solid var(--accent-primary); outline-offset: 2px`).
2. **Touch Targets:** All clickable actions meet or exceed 44x44px bounding boxes on mobile screens.
3. **Screen Readers:** Landmark roles (`main`, `nav`, `header`, `dialog`), `aria-labelledby`, `aria-describedby`, and explicit button labels.
4. **Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
