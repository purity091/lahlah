/**
 * Theme configuration and design tokens.
 * Centralized place for colors, spacing, and other design values.
 */

export const COLORS = {
    primary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },
    success: {
        50: '#ecfdf5',
        500: '#10b981',
        600: '#059669',
    },
    warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
    },
    error: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
    },
};

export const PRIORITY_COLORS = {
    High: 'bg-red-50 text-red-600 border-red-100',
    Medium: 'bg-orange-50 text-orange-600 border-orange-100',
    Low: 'bg-green-50 text-green-600 border-green-100',
};

export const PROJECT_COLORS = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
];

export const SECTOR_COLORS: Record<string, string> = {
    Marketing: 'bg-pink-500',
    Content: 'bg-purple-500',
    Engineering: 'bg-blue-500',
    Design: 'bg-orange-500',
    Sales: 'bg-green-500',
    Operations: 'bg-slate-500',
    Other: 'bg-gray-500',
};

export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
};

export const BORDER_RADIUS = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
};
