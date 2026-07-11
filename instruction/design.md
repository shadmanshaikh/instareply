# Instagram AI DM Agent — Design System & UI Specification

> **Theme:** Minimalist OLED Dark Mode (Primary Black, Secondary White) with high-contrast elements, glassmorphism, and premium typography.

---

## 1. Color Palette

We utilize a deep, pure black (`#000000`) as the primary canvas, offset by cool grays and sharp white borders/text. This creates a high-contrast, premium aesthetic similar to modern developer tools (Vercel, Linear).

```css
:root {
  /* Brand Colors */
  --bg-primary: #000000;         /* Primary deep black background */
  --bg-secondary: #0a0a0a;       /* Secondary dark gray for cards/sections */
  --bg-tertiary: #121212;        /* Accent gray for hovered elements */
  
  --border-primary: #1f1f1f;     /* Subtle border divider */
  --border-secondary: #2e2e2e;   /* Stronger border for focus states/hover */
  
  --text-primary: #ffffff;       /* Pure white for primary headings/actions */
  --text-secondary: #888888;     /* Muted gray for body text/subtitles */
  --text-muted: #555555;         /* Dark gray for disabled states/timestamps */
  
  --accent-glow: rgba(255, 255, 255, 0.05); /* Soft white glow */
  
  /* Status Colors */
  --status-active: #ffffff;      /* Active state indicator (White dot/indicator) */
  --status-inactive: #333333;    /* Paused/Inactive state (Dark gray) */
  --status-error: #ff3333;       /* High-priority errors (Subtle red) */
}
```

---

## 2. Typography

We will use **Inter** or **Outfit** as the primary typeface for a geometric, modern look.

- **Headings (H1, H2, H3):** Bold, stark white, tight letter-spacing (`-0.02em`).
- **Body & Controls:** Regular (`400`) or Medium (`500`), high legibility, clean line-heights (`1.5`).

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}
```

---

## 3. UI Components Style Guide

### 3.1 Sidebar & Navigation
- **Background:** `--bg-secondary` (`#0a0a0a`)
- **Right Border:** `1px solid var(--border-primary)`
- **Navigation Links:** Transition from muted gray text to stark white text on hover. Soft white background highlighting on active items (`var(--bg-tertiary)`).

### 3.2 Glassmorphism Cards
To keep the design alive and premium, cards will feature a subtle background translucency with micro-borders:
```css
.card {
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  border-color: var(--border-secondary);
  box-shadow: 0 0 20px var(--accent-glow);
}
```

### 3.3 Buttons & Interactive Controls
Stark, premium high-contrast buttons:
- **Primary Button:** Stark white background, pure black text. Hover scales it up slightly (`1.02x`) and adds a subtle white outer glow.
- **Secondary Button:** Black background, white border (`var(--border-primary)`), white text. Hover transitions border to `--border-secondary` and background to `--bg-secondary`.

```css
.btn-primary {
  background-color: var(--text-primary);
  color: var(--bg-primary);
  font-weight: 500;
  border-radius: 6px;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: scale(1.01);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}
```

---

## 4. Chat Interface Architecture

To optimize readability in the chat logs:
- **User Messages:** Bubbles with black backgrounds, white borders (`1px solid var(--border-secondary)`), aligned to the right.
- **AI Agent Messages:** Clean, borderless layout with subtle gray background (`--bg-secondary`), aligned to the left.
- **System Logs:** Monospaced small text (`--text-muted`) showing execution time, latency, and tokens spent.

---

## 5. Micro-Animations & Transitions

1. **Hover States:** Smooth `0.2s` transitions on colors, border colors, and transforms.
2. **Active Status Glow:** A pulsing keyframe animation for the active auto-reply indicator:
```css
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-primary);
  animation: pulse 2s infinite;
}
```
3. **Incoming Message Transition:** Slide up and fade in (`cubic-bezier(0.16, 1, 0.3, 1)`) for incoming chat log items to simulate real-time updates.
