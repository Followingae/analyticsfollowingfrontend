# AED Custom Font Implementation

## Overview
This directory contains the `aed-Regular.otf` font file which provides the official UAE AED currency symbol.

## How It Works
The custom font contains only three characters: A, E, and D.
- **A & E are blank** (invisible)
- **D contains the new AED symbol**

When the CSS class `aed-currency` is applied to text containing "AED", the font automatically displays the new symbol instead of the letters.

## Implementation
1. **Font Loading**: The font is loaded in `src/app/layout.tsx` using Next.js `localFont`
2. **CSS Class**: `.aed-currency` class is defined in `src/app/globals.css`
3. **Usage**: Apply the `aed-currency` class to any element containing "AED" text

## Usage Examples

### Basic Usage
```jsx
<span className="aed-currency">AED</span> 1,000
```

### With formatCurrency Function
```jsx
// formatCurrency returns "AED 1,000"
<span className="aed-currency">{formatCurrency(1000)}</span>
```

### In Components
```jsx
<div className="price aed-currency">
  {formatCurrency(campaign.budget)}
</div>
```

## Fallback Behavior
If the font fails to load (e.g., in emails or unsupported browsers), "AED" remains as readable fallback text.

## Files Modified
- `src/app/layout.tsx` - Font loading
- `src/app/globals.css` - CSS class definition
- All currency formatting functions - Updated to return "AED X,XXX" format
- Multiple components - Added `aed-currency` class to currency displays