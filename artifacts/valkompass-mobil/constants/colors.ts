/**
 * Semantic design tokens synced from the Valkompass web app (index.css).
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#111a2b',
    tint: '#33455c',

    // Core surfaces
    background: '#f8fafc',
    foreground: '#111a2b',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#111a2b',

    // Primary action color (buttons, links, active states)
    primary: '#33455c',
    primaryForeground: '#f8fafc',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#f1f5f9',
    secondaryForeground: '#1e293b',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f1f5f9',
    mutedForeground: '#64748b',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#eff6ff',
    accentForeground: '#1d4ed8',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Success (done states)
    success: '#059669',

    // Borders and input outlines
    border: '#e2e8f0',
    input: '#e2e8f0',
  },

  radius: 12,
};

export default colors;
