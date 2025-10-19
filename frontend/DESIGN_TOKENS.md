# Design Tokens - Login Interface

## Spacing Scale
```
space-y-3  → 12px (0.75rem)  - Tight spacing (header elements)
space-y-4  → 16px (1rem)     - Default content spacing
space-y-5  → 20px (1.25rem)  - Form element spacing
space-y-6  → 24px (1.5rem)   - Section spacing
```

## Heights
```
h-9   → 36px (2.25rem)  - Small buttons/inputs
h-10  → 40px (2.5rem)   - Default button size
h-11  → 44px (2.75rem)  - Large inputs/buttons (current)
h-12  → 48px (3rem)     - Tab container
```

## Border Radius
```
rounded-md   → 6px (0.375rem)   - Small elements
rounded-lg   → 8px (0.5rem)     - Inputs, buttons (current)
rounded-xl   → 12px (0.75rem)   - Cards
rounded-2xl  → 16px (1rem)      - Icon container
```

## Shadows
```
shadow-sm  → 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md  → 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg  → 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

## Focus Rings
```
ring-1  → 1px ring (old)
ring-2  → 2px ring (current) - Better visibility
ring-offset-2 → 2px offset for focus ring
```

## Colors (from globals.css)

### Light Mode
```css
--background: 0 0% 100%              /* White */
--foreground: 222.2 84% 4.9%         /* Near Black */
--primary: 221 83% 53%               /* Blue */
--primary-foreground: 210 40% 98%    /* Off White */
--muted: 210 40% 96.1%               /* Light Gray */
--muted-foreground: 215.4 16.3% 46.9% /* Gray */
--border: 214.3 31.8% 91.4%          /* Light Border */
--input: 214.3 31.8% 91.4%           /* Input Border */
--ring: 221 83% 53%                  /* Focus Ring Blue */
```

### Dark Mode
```css
--background: 222.2 84% 4.9%         /* Near Black */
--foreground: 210 40% 98%            /* Off White */
--primary: 221 83% 53%               /* Blue (same) */
--muted: 217.2 32.6% 17.5%           /* Dark Gray */
--muted-foreground: 215 20.2% 65.1%  /* Light Gray */
--border: 217.2 32.6% 17.5%          /* Dark Border */
```

## Typography

### Font Sizes
```
text-xs   → 12px (0.75rem)   - Helper text, demo credentials
text-sm   → 14px (0.875rem)  - Labels, inputs, buttons
text-base → 16px (1rem)      - Button text (emphasized)
text-3xl  → 30px (1.875rem)  - Page title
```

### Font Weights
```
font-medium    → 500  - Regular buttons, labels
font-semibold  → 600  - (not currently used)
font-bold      → 700  - Page title
font-extrabold → 800  - (removed, now using bold)
```

## Transitions
```
transition-colors → Only color properties
transition-all    → All properties (current)
duration-200      → 200ms
duration-300      → 300ms
ease-in-out       → Smooth easing
```

## Opacity Modifiers
```
/10  → 10% opacity - Background tints
/20  → 20% opacity - Border variations
/30  → 30% opacity - Muted backgrounds
/50  → 50% opacity - Half opacity
/70  → 70% opacity - Placeholder text
/90  → 90% opacity - Hover states
```

## Component-Specific Tokens

### Card
```tsx
className="rounded-xl border bg-card text-card-foreground shadow-md"
```

### Input
```tsx
className="h-11 rounded-lg border px-4 py-2 focus-visible:ring-2"
```

### Button (Primary)
```tsx
className="h-11 rounded-lg bg-primary text-primary-foreground shadow-md hover:shadow-lg active:scale-[0.98]"
```

### Tabs
```tsx
// TabsList
className="h-11 rounded-lg bg-muted/50 border border-border/30"

// TabsTrigger
className="rounded-md px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
```

## Layout Constraints

### Container
```
max-w-[448px]  → 448px maximum width
min-h-screen   → Full viewport height
```

### Padding
```
px-4   → 16px horizontal
px-6   → 24px horizontal (card content)
py-2   → 8px vertical
py-6   → 24px vertical (card content)
py-12  → 48px vertical (page container)
```

## Background Gradients

### Light Mode
```
bg-gradient-to-br from-slate-50 to-slate-100
```

### Dark Mode
```
bg-gradient-to-br from-slate-950 to-slate-900
```

## Usage Examples

### Consistent Input Styling
```tsx
<Input className="h-11 rounded-lg focus-visible:ring-2" />
```

### Consistent Button Styling
```tsx
<Button className="h-11 rounded-lg shadow-md hover:shadow-lg">
  Submit
</Button>
```

### Consistent Spacing
```tsx
<form className="space-y-5">
  {/* Form elements */}
</form>
```

### Card with Proper Shadow
```tsx
<Card className="border-border/50 shadow-lg">
  {/* Content */}
</Card>
```

## Accessibility Standards Met

- ✅ Minimum touch target size: 44px (h-11)
- ✅ Color contrast ratio: WCAG AA compliant
- ✅ Focus indicators: 2px visible rings
- ✅ Keyboard navigation: Full support
- ✅ Screen reader: Semantic HTML maintained

## Browser Support

All CSS features used are supported in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes

1. All spacing uses Tailwind's default 4px (0.25rem) scale
2. Colors use HSL for better theme support
3. Shadows follow a consistent elevation system
4. Border radius increases with element importance
5. Focus rings use offset for better visibility against backgrounds



