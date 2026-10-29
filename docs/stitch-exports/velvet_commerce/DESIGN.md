---
name: Velvet Commerce
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#564147'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#897177'
  outline-variant: '#ddbfc6'
  surface-tint: '#ab2b63'
  primary: '#951753'
  on-primary: '#ffffff'
  primary-container: '#b5336b'
  on-primary-container: '#ffdce5'
  inverse-primary: '#ffb0c9'
  secondary: '#7b5804'
  on-secondary: '#ffffff'
  secondary-container: '#fdcd74'
  on-secondary-container: '#785601'
  tertiary: '#554b4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e6366'
  on-tertiary-container: '#efe1e4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e2'
  primary-fixed-dim: '#ffb0c9'
  on-primary-fixed: '#3e001e'
  on-primary-fixed-variant: '#8b0b4b'
  secondary-fixed: '#ffdea6'
  secondary-fixed-dim: '#eec068'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#eddfe2'
  tertiary-fixed-dim: '#d1c3c6'
  on-tertiary-fixed: '#211a1c'
  on-tertiary-fixed-variant: '#4e4447'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system serves professional beauty supply commerce, tailored specifically for salon owners, stylists, and cosmetics retailers across Colombia and Latin America. The visual language balances wholesale efficiency with the tactile luxury of the beauty sector. 

The aesthetic is Modern Tactile Warmth: a clean, editorial structure paired with soft rounded geometry, generous breathing room, and warm ambient undertones. It rejects cold, transactional B2B aesthetics in favor of a trustworthy, aspirational atmosphere that honors the craft of salon entrepreneurs. Visual interactions evoke care and professionalism, reinforcing partnership and reliability for high-frequency purchasing.

## Colors

The palette establishes an immediate identity of beauty authority and warmth:

- **Primary (`#B5336B` - Deep Rose):** Used for primary conversion points, active states, key data highlights, and prominent brand accents. Never over-saturated across large background areas; kept focused on actionable targets.
- **Secondary (`#D4A853` - Champagne Gold):** Serves as an accent for prestige tags, wholesale tiers (e.g., Club Profesional), verified badges, and subtle border highlights.
- **Tertiary & Containers (`#FFF0F3` - Blush, `#FCE7F0` - Rose Mist):** Applied to card backdrops, promo banners, notification containers, and active item indicators.
- **Canvas & Neutrals:**
  - Base canvas: `#FAFAF8` (Warm White) to eliminate sterile monitor glare.
  - Surface elevation: `#FFFFFF` (Pure White).
  - Primary text: `#2D2D2D` (Charcoal).
  - Secondary text / borders: `#64748B` (Slate) and `#E2E8F0` (Muted Slate).
- **Semantics:**
  - Success: `#10B981` (Order confirmations, wholesale margins).
  - Warning: `#F59E0B` (Payment pending, dispatch alerts).
  - Danger / Stock Alert: `#E11D48` (Agotado, Pocas unidades).

## Typography

The type system blends the characterful, human geometry of Plus Jakarta Sans for titles and navigation labels with the neutral, high-legibility precision of Inter for data-heavy inventory tables, invoices, and product specifications.

### Localization & Currency Rules
- All currency values must use Colombian Peso formatting: `$ 120.000 COP` or `$ 120.000` with non-breaking spaces between symbol, magnitude, and currency code.
- Thousands are separated by periods (`.`), and cents are separated by commas (`,00`), though wholesale ordering standardizes on rounded integer representations without cents.
- Promotional discounts must show baseline prices crossed out in `body-sm` muted charcoal (`#64748B`), with wholesale unit prices in `headline-sm` Deep Rose (`#B5336B`).

## Layout & Spacing

The layout is built around an adaptive 12-column grid on desktop (`1200px` max-width container) that shifts to a 6-column grid on tablet (`768px - 1024px`) and a 4-column flow on mobile devices (`< 768px`).

- **Grid Dynamics:** Desktop utilizes `2rem` margins and `1.25rem` gutters. Mobile utilizes `1rem` margins and `0.75rem` gutters to maximize screen space for dual-column product cards.
- **Rhythm & Whitespace:** Density remains comfortable. Catalog sections employ generous vertical rhythm (`space-xl`) between categorized shelves, while wholesale line items utilize dense `space-sm` row padding to enable rapid batch scanning.
- **Touch Targets:** On touch viewports, interactive elements (steppers, filter chips, cart buttons) adhere to a strict minimum hit area of `44px x 44px`.

## Elevation & Depth

Depth is established through soft ambient light and tinted under-casts rather than harsh grey drop-shadows:

- **Surface Levels:** 
  - Base: Warm White (`#FAFAF8`).
  - Level 1 (Product Cards, Category Panels): Pure White (`#FFFFFF`) with a 1px border of `#F1E5E9` and a soft ambient shadow: `0 4px 20px -2px rgba(181, 51, 107, 0.05)`.
  - Level 2 (Flyouts, Quick-cart Drawers, Dropdowns): Pure White (`#FFFFFF`) with `0 12px 32px -4px rgba(45, 45, 45, 0.08)`.
  - Level 3 (Modals, Bulk Import Dialogs): Pure White with backdrop blur (`backdrop-filter: blur(8px)`) over an overlay of `rgba(45, 45, 45, 0.45)`.
- **Card Accents:** Highlighted wholesale bundles utilize a dual-tone border strategy—soft blush border with an inset top-glow rendered via `box-shadow: inset 0 2px 0 0 #D4A853`.

## Shapes

The interface embraces organic, friendly contours without compromising information architecture. 

- Base components (Inputs, Standard Badges, Tooltips) use `0.5rem` (`rounded-md`).
- Primary Cards, SKU containers, and modals use `1rem` (`rounded-xl` / `rounded-2xl`).
- Category discovery pills and promotional tags use full pill geometry (`9999px`).
- Images always match their parent card's interior curvature with consistent border-radius clipping.

## Components

### Buttons
- **Primary:** Background `#B5336B`, text `#FFFFFF`, rounded `0.75rem`, font `label-lg`. Hover: `#9C2558`. Focus: `3px ring rgba(181, 51, 107, 0.25)`.
- **Secondary / Wholesale Quick-Add:** Border `1.5px solid #B5336B`, text `#B5336B`, background `transparent`. Hover: `#FFF0F3`.
- **Gold Accent (VIP / Salon Pro):** Background `#D4A853`, text `#FFFFFF`, font `label-lg`.

### Product & B2B Cards
- Structured with an image frame set on `#FFFFFF`, padded with `space-sm`.
- Includes a dedicated wholesale price module: highlighted unit cost alongside bulk tier breakdown (e.g., *Docena: $ 18.500 c/u*).
- Stock indicator pills positioned at the card header:
  - In Stock: Background `#ECFDF5`, text `#065F46` ("Disponible").
  - Low Stock: Background `#FFF1F2`, text `#BE123C` ("Últimas 5 uds").

### Inputs & Quantity Steppers
- **Inputs:** Height `44px`, background `#FFFFFF`, border `1px solid #CBD5E1`, rounded `0.5rem`. Focus shifts border to `#B5336B` with zero harsh outline.
- **Wholesale Stepper:** Compact inline controller with increment/decrement tap targets flanking a direct numeric input field for high-volume purchasing (e.g., `+10`, `+50` quick toggles).

### Chips & Filter Pills
- Inactive: Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#2D2D2D`.
- Active: Background `#B5336B`, text `#FFFFFF`, border `1px solid #B5336B`.
- Rounded `9999px` with padding `space-xs` vertical, `space-md` horizontal.

### Selection Controls (Checkboxes & Radios)
- Checkboxes: `20px x 20px`, rounded `0.375rem`. Checked state fills `#B5336B` with white checkmark.
- Radios: `20px x 20px`, circular. Checked state shows concentric `#B5336B` center ring with `4px` gap.

### Wholesale Order Summary Drawer
- Sticky bottom dock on mobile, right-side sliding sheet on desktop.
- Displays running subtotal, calculated IVA (19%), minimum wholesale threshold tracker bar, and a single checkout call-to-action in Deep Rose.