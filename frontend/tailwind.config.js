/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./legal/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        /* Apple-style semantic colors - mapped to CSS variables in theme.css */
        brand: {
          50: "#E8F0FE",
          100: "#D1E0FC",
          500: "#0066CC",
          600: "#0052A3",
          700: "#004080",
          900: "#0B1F3A"
        },
        accent: {
          500: "#00A8E8",
          600: "#0090C9"
        },
        /* Semantic system colors (light mode defaults) */
        system: {
          background: "#FFFFFF",
          "secondary-background": "#F5F8FC",
          "tertiary-background": "#FFFFFF",
          fill: "rgba(120, 120, 128, 0.12)",
          "secondary-fill": "rgba(120, 120, 128, 0.08)",
          "tertiary-fill": "rgba(120, 120, 128, 0.04)",
          "quaternary-fill": "rgba(120, 120, 128, 0.02)",
        },
        label: {
          primary: "#1D1D1F",
          secondary: "#6E6E73",
          tertiary: "#8E8E93",
          quaternary: "#C7C7CC",
        },
        separator: {
          DEFAULT: "#E5E5EA",
          opaque: "#D1D1D6",
        },
        /* Status colors */
        success: {
          DEFAULT: "#30A14E",
          hover: "#288642",
        },
        warning: {
          DEFAULT: "#D29900",
          hover: "#B38400",
        },
        danger: {
          DEFAULT: "#D0021B",
          hover: "#B50017",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
        syne: ["Syne", "sans-serif"],
        outfit: ["Outfit", "system-ui", "sans-serif"],
      },
      /* Apple 4pt spacing scale */
      spacing: {
        '0': '0',
        '1': '4px',   /* 1 unit = 4pt */
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      /* Apple type scale (size/line-height) */
      fontSize: {
        'display': ['64px', { lineHeight: '72px', fontWeight: '800', letterSpacing: '-0.03em' }],
        'large-title': ['34px', { lineHeight: '41px', fontWeight: '700', letterSpacing: '0.37px' }],
        'title-1': ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '0.36px' }],
        'title-2': ['22px', { lineHeight: '28px', fontWeight: '700', letterSpacing: '0.35px' }],
        'title-3': ['20px', { lineHeight: '25px', fontWeight: '600', letterSpacing: '0.38px' }],
        'headline': ['17px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '-0.43px' }],
        'body': ['16px', { lineHeight: '22px', fontWeight: '400', letterSpacing: '-0.43px' }],
        'callout': ['16px', { lineHeight: '21px', fontWeight: '400', letterSpacing: '-0.32px' }],
        'subheadline': ['15px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '-0.24px' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400', letterSpacing: '-0.08px' }],
        'caption-1': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0px' }],
        'caption-2': ['11px', { lineHeight: '14px', fontWeight: '400', letterSpacing: '0.06px' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'apple-sm': '6px',   /* Small buttons, inputs */
        'apple-md': '8px',   /* Standard */
        'apple-lg': '12px',  /* Cards, primary buttons */
        'apple-xl': '16px',  /* Large cards, modals */
        'apple-2xl': '20px', /* Sheets */
        'apple-full': '9999px', /* Pills, badges */
      },
      boxShadow: {
        /* Apple-style elevation levels */
        'level-1': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'level-2': '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'level-3': '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'level-4': '0 12px 32px rgba(0, 0, 0, 0.1), 0 6px 16px rgba(0, 0, 0, 0.06)',
        'modal': '0 24px 48px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '250ms',
        'modal': '350ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        mesh: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'mesh': 'mesh 10s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      minHeight: {
        'touch': '44px',    /* iOS minimum touch target */
        'touch-sm': '36px', /* Compact */
        'touch-lg': '52px', /* Large */
      },
      minWidth: {
        'touch': '44px',
        'touch-sm': '36px',
        'touch-lg': '52px',
      },
    }
  },
  plugins: []
};
