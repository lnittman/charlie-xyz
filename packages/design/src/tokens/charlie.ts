export const charlieTokens = {
  colors: {
    // Primary brand colors from Charlie Labs
    primary: '#ABF716', // Charlie Labs lime green
    primaryHover: '#9BE516',
    primaryMuted: 'rgba(171, 247, 22, 0.2)',
    primarySubtle: 'rgba(171, 247, 22, 0.1)',
    
    // Background colors
    background: '#010101', // Near black
    backgroundSecondary: '#000000', // Pure black for cards
    backgroundOverlay: 'rgba(1, 1, 1, 0.8)',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A3A3A3', // Gray-400
    textMuted: '#6B7280', // Gray-500
    
    // Border colors
    border: '#374151', // Gray-800
    borderHover: 'rgba(171, 247, 22, 0.5)',
    
    // Status colors
    success: '#10B981', // Green-500
    warning: '#F59E0B', // Yellow-500
    error: '#EF4444', // Red-500
    info: '#3B82F6', // Blue-500
    
    // Semantic colors
    active: '#ABF716',
    idle: '#6B7280',
    blocked: '#EF4444',
    completed: '#10B981',
  },
  
  typography: {
    fonts: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(171, 247, 22, 0.3)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  gradients: {
    fadeOut: 'linear-gradient(to bottom, transparent, rgba(1, 1, 1, 0.8), #010101)',
    primary: 'linear-gradient(135deg, #ABF716 0%, #9BE516 100%)',
  },
} as const

export type CharlieTokens = typeof charlieTokens