# Prob Desk design system

Brand palette for the **CopilotKit web UI** (`ui/`), **ADK Web**, and the **`prob-desk` CLI** (Rich).

## Color tokens

| Token | Hex | Usage |
|--------|-----|--------|
| `white` | `#FFFFFF` | Surfaces on cards, chat bubbles, inputs |
| `bg` | `#E9FBFF` | Page background, subtle panels |
| `border` | `#BDF1FF` | Card borders, dividers, inactive chrome |
| `accent` | `#3CC7E8` | Primary buttons, links, focus rings, CLI emphasis |
| `ink` | `#115166` | Body text, headings, dark sidebar |

### CSS variables (`ui/src/app/globals.css`)

```css
--pd-white: #ffffff;
--pd-bg: #e9fbff;
--pd-border: #bdf1ff;
--pd-accent: #3cc7e8;
--pd-ink: #115166;
--pd-ink-deep: #0d3d4d;
```

### Brand gradients

Cool teal/cyan gradients for a professional trading-desk feel (not generic AI purple).

| Token | Role |
|--------|------|
| `--pd-gradient` | Hero / marketing accents — ink → accent diagonal |
| `--pd-gradient-subtle` | Dark nav sidebar (`pd-sidebar-bg`) |
| `--pd-gradient-surface` | CopilotKit chat panel background |
| `--pd-gradient-accent` | 2px accent bars under headers |
| `--pd-gradient-page` | Page body wash |

```css
--pd-gradient: linear-gradient(135deg, #0d3d4d 0%, #115166 38%, #1a8fad 72%, #3cc7e8 100%);
--pd-gradient-subtle: linear-gradient(180deg, #0f4a5c 0%, #115166 52%, #0d3d4d 100%);
--pd-gradient-surface: linear-gradient(180deg, #ffffff 0%, #f0fcff 55%, #e9fbff 100%);
--pd-gradient-accent: linear-gradient(90deg, #2eb8d9 0%, #3cc7e8 48%, #7ee0f4 100%);
--pd-gradient-page: linear-gradient(165deg, #e9fbff 0%, #f4fdff 45%, #dff6fc 100%);
```

**Usage guidelines**

- Use **one** gradient layer per region (sidebar *or* page wash, not both at full strength).
- Prefer `--pd-gradient-subtle` on `pd-ink` chrome; `--pd-gradient-surface` on chat/cards.
- Accent bars (`.pd-accent-bar`) and active nav pills may use `--pd-gradient-accent` sparingly.
- Chips / suggestion pills: `.pd-gradient-chip` + solid `pd-border`; hover shifts to `pd-bg`.
- CopilotKit: override `[data-copilotkit]` tokens inside `.copilotKitSidebar` in `globals.css` — do not fork CopilotKit components.

### Tailwind (`ui` theme)

| Class prefix | Maps to |
|--------------|---------|
| `pd-bg` | `#E9FBFF` |
| `pd-border` | `#BDF1FF` |
| `pd-accent` | `#3CC7E8` |
| `pd-ink` | `#115166` |

## Typography

- **UI:** `Geist` / system sans for chrome; `Geist Mono` for tickers and tool JSON.
- **Scale:** `text-sm` body, `text-base` chat, `text-lg` section titles, `text-2xl` hero.
- **Weight:** `font-semibold` headings, `font-medium` labels, `font-normal` prose.

## Spacing & radius

- Base unit: **4px** (Tailwind default).
- Cards: `p-4`–`p-6`, `gap-4` grids, `rounded-xl` cards, `rounded-lg` chips.
- Sidebar width: **280px** desktop; full-width sheet on small screens.

## Components (web)

| Component | Role |
|-----------|------|
| `ProbDeskLayout` | Branded shell: sidebar nav + main + chat dock |
| `KalshiMarketCard` | Ticker, title, yes/no prices from search tool results |
| `PortfolioSummary` | Balance / portfolio value from `kalshi_sdk_get_balance` |
| `AgentToolTrace` | Fallback trace for any Kalshi tool call |
| `KalshiGenerativeUI` | `useRenderToolCall` hooks for search / orderbook / balance |

Generative UI tool names must match ADK tool function names exactly (e.g. `kalshi_search_markets`).

## CLI palette (Rich)

Defined in `prob_desk/cli.py` as `PD_*` constants:

| Rich usage | Hex | Role |
|------------|-----|------|
| `PD_INK` | `#115166` | Titles, primary text |
| `PD_ACCENT` | `#3CC7E8` | Brand name, prompts, spinners |
| `PD_BORDER` | `#BDF1FF` | Panel borders |
| `PD_MUTED` | `#115166` + dim | Hints, cwd, secondary lines |
| `PD_WARN` | `#3CC7E8` | Warnings (API key missing) |
| `PD_ERROR` | `red` | Errors (semantic, not brand) |

Rich accepts hex styles: `[#3CC7E8]text[/]`.

## Logo & voice

- Product name: **Prob Desk** (two words).
- Agent persona: **trading_director** orchestrates quant, risk, execution, sentiment.
- Tone: precise, market-aware, no hype; cyan accent signals “live desk” not generic AI purple.

## Accessibility

- Text on `pd-bg`: use `pd-ink` (contrast OK for body).
- Buttons: `pd-ink` text on `pd-accent` or white on `pd-accent` for large CTAs.
- Focus: `ring-2 ring-pd-accent ring-offset-2 ring-offset-pd-bg`.
