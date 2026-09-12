# Velora Design Direction

## 1. Design Intent

Velora should feel like a specialist Apple retailer: quiet, exact, premium, and helpful. The interface is a tool for choosing technology with confidence, not a visual demonstration of UI effects.

This direction follows an Impeccable design practice: make every visual decision serve hierarchy, comprehension, speed, and trust. The work should avoid generic AI-generated patterns, decorative excess, and interchangeable SaaS styling.

The chosen language is **high-contrast retail minimalism** with a restrained editorial edge. It uses graphite typography, cool white surfaces, Apple blue as a functional accent, generous whitespace, crisp separators, product-led imagery, and occasional hard-edged color blocks. It does not depend on gradients, floating glass panels, or rounded card grids.

## 2. Anti-Goals

Do not use:

- Purple-on-white SaaS styling.
- Blue-purple hero gradients or mesh backgrounds.
- Excessive cards nested inside cards.
- Every section placed inside a rounded container.
- Huge marketing copy before the customer can shop.
- Generic dashboard tiles with decorative icons and invented metrics.
- Soft shadows, glassmorphism, neon glows, or blurred blobs.
- Pill-shaped controls for ordinary buttons.
- Decorative illustrations that hide the actual product.
- Fake Apple-style marketing claims that are not present in product data.
- Low-contrast gray text for essential information.
- Motion that delays shopping or makes a page feel like a demo.

## 3. Visual Personality

**Keywords:** precise, warm, direct, material, edited, quiet confidence.

The interface should have the compositional discipline of a printed catalog and the directness of a well-made store fixture. Product photography carries the emotional weight. UI chrome stays disciplined so products remain legible.

## 4. Color System

Use a limited palette with clear semantic roles. Avoid a one-hue interface.

Suggested tokens:

```css
:root {
  --ink: #111111;
  --ink-muted: #5c5a55;
  --paper: #f5f5f7;
  --surface: #ffffff;
  --line: #d2d2d7;
  --line-strong: #111111;
  --signal: #0071e3;
  --signal-soft: #d9ebff;
  --success: #1d6b4f;
  --warning: #8a5a16;
  --danger: #b33131;
}
```

Rules:

- Use `--ink` on `--paper` for primary reading and navigation.
- Use `--signal` for actions, links, selected filters, and the primary purchase path.
- Use `--surface` to create quiet contrast without turning every group into a card.
- Use `--line-strong` for structural rules and key boundaries; use `--line` for secondary separation.
- Never encode status with color alone. Pair status color with text, shape, or icon.
- Check contrast for body text, disabled controls, focus indicators, and product metadata.

The exact palette may evolve with product photography, but the visual rule remains: cool neutral foundation, graphite typography, Apple blue for action and links, and restrained semantic colors. Blue is functional, not decorative.

## 5. Typography

Typography is the main design instrument. Choose a distinctive, high-quality sans or grotesk family for interface text and a contrasting display face only where it adds real character. Do not default to Arial, Roboto, Inter, or a system stack as the final art direction.

Recommended pairing direction:

- Display: a compact grotesk with strong punctuation and confident numerals.
- Interface/body: a highly readable humanist sans with clear lowercase forms.
- Price and order totals: tabular numerals from the interface family.

Type rules:

- Use high contrast in weight and size, not excessive decoration.
- Keep headings short and specific.
- Use sentence case for most labels and actions.
- Do not use negative letter-spacing as a style shortcut.
- Keep body text between 16px and 18px where possible.
- Use a compact uppercase eyebrow only for metadata, never for paragraphs.
- Price, quantity, and status should be scannable at a glance.

Suggested scale:

```text
Display:  clamp(2.75rem, 6vw, 6rem)
Page title: 2.25rem to 3.5rem
Section title: 1.5rem to 2rem
Body: 1rem to 1.125rem
Meta: 0.8125rem to 0.9375rem
```

Do not scale every type size fluidly. Use stable sizes for controls, prices, navigation, and dense admin tables.

## 6. Layout and Composition

### Storefront

- Use a full-width page background with a centered content column.
- Keep the header compact and useful: brand, search, account, cart.
- Let the first viewport show real products or a real product-led entry point.
- Use an asymmetric product grid when the inventory supports it; otherwise use a disciplined 3- or 4-column grid.
- Keep product images on a consistent aspect ratio so the layout never jumps.
- Use whitespace as separation before adding containers or borders.
- Use horizontal rules, offset labels, and aligned baselines to create rhythm.

### Product detail

Use a two-column composition on desktop: image gallery and purchase information. The purchase panel should be anchored by product name, price, stock state, quantity, and add-to-cart action. On mobile, image first, then purchase information, then description and related products.

### Cart and order review

Use a clear reading column with a fixed-width summary region on desktop. On mobile, keep the summary in normal document flow and repeat the primary action after the last meaningful decision. Do not hide totals inside a modal.

### Admin

Admin is an operational workspace with denser spacing, tables, filters, and explicit action states. It shares typography and color tokens with the storefront but does not imitate the storefront layout.

## 7. Shape, Borders, and Depth

- Default border radius: `0` to `4px`.
- Use a larger radius only when it communicates a real interaction pattern, such as a media crop or a dialog.
- Prefer one-pixel rules, offset blocks, and alignment for hierarchy.
- Avoid stacked cards. A repeated product item may be framed; the page section containing those items should remain unframed.
- Use shadows rarely and only for overlays that must separate from content.
- Buttons may be rectangular and tactile. Their affordance comes from contrast, spacing, and state change, not pill shapes.

## 8. Components

### Header

Persistent but compact. The cart count is a small numeric indicator, not a decorative bubble. Search should be a real control with a visible keyboard focus state.

### Product card

A product card should include:

- Stable image frame.
- Product name.
- Category or useful short descriptor.
- Price with tabular numerals.
- Stock-aware action.

The card should not contain a paragraph of invented marketing copy or multiple competing buttons.

### Buttons

- Primary: solid `--ink` with `--paper` text, or `--signal` when the action is the clear purchase signal.
- Secondary: transparent with a strong border or text treatment.
- Destructive: explicit text and semantic danger color; never hide cancellation behind an ambiguous icon.
- Icon-only controls are allowed for familiar actions such as close, back, increment, decrement, and remove, with accessible labels and tooltips where needed.

### Forms

Labels stay visible. Validation appears close to the field and does not rely on color alone. Auth forms should be narrow, calm, and free of decorative panels. Password and email errors must be specific enough to recover.

### Status

Use text labels for `PENDING`, `PAID`, `CANCELLED`, active/inactive, and stock states. A small marker or color accent can reinforce the label but cannot replace it.

### Empty and error states

Empty states should explain what is absent and provide one useful next action. Error states should say what failed, whether the customer\'s data was preserved, and how to retry. Avoid cartoon illustrations and vague copy such as "Something went wrong" without a recovery path.

## 9. Motion

Motion should clarify change, not perform personality.

Use:

- A short page-load reveal for the main content.
- A subtle stagger for product results when they first appear.
- Immediate feedback when an item enters the cart.
- A restrained transition for quantity or filter changes.

Avoid:

- Full-screen entrance animations.
- Continuous floating or pulsing elements.
- Parallax behind shopping content.
- Delayed buttons or checkout actions.
- Animations that move content after the customer has started reading.

Respect `prefers-reduced-motion: reduce` and remove nonessential movement.

## 10. Responsive Behavior

Design mobile as a first-class shopping context, not a collapsed desktop page.

- Keep tap targets at least 44px in the smallest dimension.
- Keep product cards readable at narrow widths without truncating the product name aggressively.
- Preserve stable image aspect ratios and control dimensions.
- Move cart summaries into document flow on mobile.
- Use a compact, clearly labeled navigation pattern when the header cannot fit.
- Keep focus order logical and visible.
- Test at narrow mobile, tablet, laptop, and wide desktop widths.

## 11. Accessibility

- Use semantic landmarks, headings, buttons, links, lists, and form labels.
- Provide alt text for product imagery; mark purely decorative imagery appropriately.
- Keep visible focus indicators with at least strong contrast against the surface.
- Announce cart updates and validation errors to assistive technology.
- Do not use hover as the only way to reveal information.
- Preserve keyboard access for search, filters, quantity controls, dialogs, and checkout.
- Ensure status, price, stock, and error information remains understandable without color perception.

## 12. Data-Aware UI Rules

- Product lists are driven by `GET /api/v1/products` and its `meta` pagination object.
- Category filters are driven by `GET /api/v1/categories`.
- Guest cart data is local; authenticated cart data is server-backed.
- After `POST /api/v1/cart/sync`, replace local state with the returned server cart.
- Never display a client-calculated order total as final authority.
- `POST /api/v1/orders` has no request body and creates an order from the entire server cart.
- Order status and stock conflicts must be rendered as explicit states.
- Admin analytics should show only the values returned by the analytics APIs, with the metric definition visible: total sales counts `PAID` orders, while total orders counts all orders.

## 13. Implementation Guardrails

Before adding a component, ask:

1. What customer decision does this help with?
2. Is this information already available through the existing API contract?
3. Can the same hierarchy be expressed with spacing and type instead of another card or border?
4. What are the loading, empty, error, unauthorized, and mobile states?
5. Does the component still make sense with real product images and long product names?

The frontend should be built as a small set of composable primitives and page-level compositions, not as a pile of visually unrelated screens. Keep the design tokens centralized, keep API access separate from rendering, and preserve a consistent visual grammar across customer and admin surfaces.
