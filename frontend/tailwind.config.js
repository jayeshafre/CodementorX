/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        mono: [
          'Fira Code',
          'Monaco',
          'Cascadia Code',
          'Roboto Mono',
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'Courier New',
          'monospace',
        ],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // CodementorX Brand Colors
        'electric-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0066ff', // Primary electric blue
          600: '#0052cc',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        'tech-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00d084', // Primary tech green
          600: '#00a366',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },

        'code-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8b5cf6', // Primary code purple
          600: '#a855f7',
          700: '#9333ea',
          800: '#7c3aed',
          900: '#6b21a8',
          950: '#581c87',
        },

        'neon-cyan': {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00ffff', // Neon cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },

        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#0066ff", // Electric blue
          600: "#0052cc",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },

        // Enhanced semantic colors
        destructive: { 
          DEFAULT: "#ef4444", 
          foreground: "#fff",
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          900: "#7f1d1d",
        },
        success: { 
          DEFAULT: "#00d084", 
          foreground: "#fff",
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#00d084",
          600: "#00a366",
          900: "#14532d",
        },
        warning: { 
          DEFAULT: "#f59e0b", 
          foreground: "#fff",
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          900: "#78350f",
        },
        info: { 
          DEFAULT: "#0066ff", 
          foreground: "#fff",
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#0066ff",
          600: "#0052cc",
          900: "#1e3a8a",
        },
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0066ff 0%, #00d084 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3385ff 0%, #33da9a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6 0%, #00ffff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'gradient-light': 'linear-gradient(135deg, #f8faff 0%, #f0f9ff 50%, #f0fff4 100%)',
        'tech-pattern': 'radial-gradient(circle at 2px 2px, rgba(0, 102, 255, 0.08) 1px, transparent 0)',
        'tech-pattern-dense': 'radial-gradient(circle at 1px 1px, rgba(0, 102, 255, 0.1) 1px, transparent 0)',
        'circuit-pattern': `
          linear-gradient(90deg, rgba(0, 102, 255, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(0, 102, 255, 0.1) 1px, transparent 1px)
        `,
        'holographic': `
          linear-gradient(45deg, 
            rgba(0, 102, 255, 0.1),
            rgba(0, 208, 132, 0.1),
            rgba(139, 92, 246, 0.1),
            rgba(0, 255, 255, 0.1)
          )
        `,
      },

      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        "2xl": "0 25px 50px -12px rgba(0,0,0,0.25)",
        inner: "inset 0 2px 4px rgba(0,0,0,0.06)",
        
        // CodementorX specific shadows
        'glow': '0 4px 20px rgba(0, 102, 255, 0.15)',
        'glow-lg': '0 8px 30px rgba(0, 102, 255, 0.25)',
        'glow-xl': '0 12px 40px rgba(0, 102, 255, 0.3)',
        'glow-green': '0 4px 20px rgba(0, 208, 132, 0.15)',
        'glow-green-lg': '0 8px 30px rgba(0, 208, 132, 0.25)',
        'glow-purple': '0 4px 20px rgba(139, 92, 246, 0.15)',
        'glow-purple-lg': '0 8px 30px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 4px 20px rgba(0, 255, 255, 0.15)',
        'neon': '0 0 10px rgba(0, 102, 255, 0.1), inset 0 0 10px rgba(0, 102, 255, 0.05)',
        'neon-strong': '0 0 20px rgba(0, 102, 255, 0.3), inset 0 0 20px rgba(0, 102, 255, 0.1)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 40px rgba(31, 38, 135, 0.5)',
      },

      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "3xl": "1920px",
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },

      animation: {
        // CodementorX specific animations
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 1.5s infinite',
        'slide-in-up': 'slideInUp 0.6s ease-out',
        'slide-in-down': 'slideInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.6s ease-out',
        'typing-bounce': 'typingBounce 1.4s infinite ease-in-out both',
        'digital-rain': 'digitalRain 2s linear infinite',
        'circuit': 'circuit 3s ease-in-out infinite',
        'holographic': 'holographic 3s ease infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(0, 102, 255, 0.15)' },
          '50%': { boxShadow: '0 8px 30px rgba(0, 102, 255, 0.3)' },
        },
        'pulse-glow': {
          'from': { boxShadow: '0 4px 20px rgba(0, 102, 255, 0.15)' },
          'to': { boxShadow: '0 8px 30px rgba(0, 102, 255, 0.25)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        slideInUp: {
          'from': { transform: 'translateY(30px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          'from': { transform: 'translateY(-30px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-30px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          'from': { transform: 'translateX(30px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { transform: 'scale(0.9)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        typingBounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        digitalRain: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        circuit: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        holographic: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'gradient-y': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center bottom'
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '400% 400%',
            'background-position': 'right center'
          },
        },
      },

      backdropBlur: {
        xs: '2px',
      },

      backdropBrightness: {
        25: '.25',
        175: '1.75',
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'tech': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },

      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#0066ff',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: '#0052cc',
                textShadow: '0 0 8px rgba(0, 102, 255, 0.3)',
              },
            },
            code: {
              color: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '0.75rem',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
            },
          },
        },
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    // Custom CodementorX plugin
    function({ addUtilities, addComponents, theme }) {
      addUtilities({
        '.text-gradient-primary': {
          background: 'linear-gradient(135deg, #0066ff 0%, #00d084 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-secondary': {
          background: 'linear-gradient(135deg, #3385ff 0%, #33da9a 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-accent': {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #00ffff 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.bg-glass-dark': {
          'background': 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.hover-lift': {
          'transition': 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-4px)',
            'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
        '.tech-pattern-bg': {
          'background-image': 'radial-gradient(circle at 2px 2px, rgba(0, 102, 255, 0.08) 1px, transparent 0)',
          'background-size': '20px 20px',
        },
        '.tech-pattern-dense-bg': {
          'background-image': 'radial-gradient(circle at 1px 1px, rgba(0, 102, 255, 0.1) 1px, transparent 0)',
          'background-size': '10px 10px',
        },
        '.circuit-bg': {
          'background-image': 'linear-gradient(90deg, rgba(0, 102, 255, 0.1) 1px, transparent 1px), linear-gradient(rgba(0, 102, 255, 0.1) 1px, transparent 1px)',
          'background-size': '20px 20px',
        },
        '.neon-border': {
          'border': '1px solid rgba(0, 102, 255, 0.3)',
          'box-shadow': '0 0 10px rgba(0, 102, 255, 0.1), inset 0 0 10px rgba(0, 102, 255, 0.05)',
        },
        '.glow-text': {
          'text-shadow': '0 0 10px rgba(0, 102, 255, 0.5)',
        },
      });

      addComponents({
        '.btn-codementorx': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '0.75rem 1.5rem',
          'font-size': '0.875rem',
          'font-weight': '600',
          'border-radius': '0.75rem',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'background': 'linear-gradient(135deg, #0066ff 0%, #00d084 100%)',
          'color': 'white',
          'border': 'none',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 8px 25px rgba(0, 102, 255, 0.25)',
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
          '&:disabled': {
            'opacity': '0.5',
            'cursor': 'not-allowed',
            'transform': 'none',
            'box-shadow': 'none',
          },
        },
        
        '.btn-codementorx-secondary': {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '0.75rem 1.5rem',
          'font-size': '0.875rem',
          'font-weight': '600',
          'border-radius': '0.75rem',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'background': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(10px)',
          'color': '#0066ff',
          'border': '1px solid #0066ff',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.1)',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'background': 'rgba(255, 255, 255, 0.95)',
            'box-shadow': '0 8px 25px rgba(0, 102, 255, 0.15)',
          },
        },

        '.card-codementorx': {
          'background': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(20px)',
          'border-radius': '1rem',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          'overflow': 'hidden',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-4px)',
            'box-shadow': '0 12px 40px rgba(0, 102, 255, 0.2)',
          },
        },

        '.chat-bubble-user': {
          'position': 'relative',
          'background': 'linear-gradient(135deg, #0066ff 0%, #00d084 100%)',
          'color': 'white',
          'padding': '1rem',
          'border-radius': '1rem',
          'border-top-right-radius': '0.25rem',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          'backdrop-filter': 'blur(10px)',
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'right': '-8px',
            'top': '50%',
            'transform': 'translateY(-50%)',
            'width': '0',
            'height': '0',
            'border': '8px solid transparent',
            'border-left-color': '#0066ff',
          },
        },

        '.chat-bubble-bot': {
          'position': 'relative',
          'background': 'rgba(255, 255, 255, 0.9)',
          'backdrop-filter': 'blur(10px)',
          'color': '#374151',
          'padding': '1rem',
          'border-radius': '1rem',
          'border-top-left-radius': '0.25rem',
          'border': '1px solid rgba(229, 231, 235, 0.5)',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'left': '-8px',
            'top': '50%',
            'transform': 'translateY(-50%)',
            'width': '0',
            'height': '0',
            'border': '8px solid transparent',
            'border-right-color': 'rgba(255, 255, 255, 0.9)',
          },
        },

        '.code-bracket': {
          'position': 'relative',
          'padding': '1rem',
          'border-radius': '0.75rem',
          'background': 'linear-gradient(135deg, #0066ff 0%, #00d084 100%)',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          '&::before, &::after': {
            'content': '""',
            'position': 'absolute',
            'width': '12px',
            'height': '12px',
            'border': '2px solid rgba(255, 255, 255, 0.8)',
          },
          '&::before': {
            'top': '8px',
            'left': '8px',
            'border-right': 'none',
            'border-bottom': 'none',
          },
          '&::after': {
            'bottom': '8px',
            'right': '8px',
            'border-left': 'none',
            'border-top': 'none',
          },
        },

        '.input-codementorx': {
          'width': '100%',
          'padding': '0.75rem 1rem',
          'font-size': '1rem',
          'border': '1px solid rgba(0, 102, 255, 0.2)',
          'border-radius': '0.5rem',
          'background': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(10px)',
          'transition': 'all 0.3s ease',
          'min-height': '48px',
          '&:focus': {
            'outline': 'none',
            'border-color': '#0066ff',
            'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
            'background': 'rgba(255, 255, 255, 0.95)',
          },
          '&::placeholder': {
            'color': 'rgba(107, 114, 128, 0.7)',
          },
        },

        '.typing-indicator': {
          'display': 'flex',
          'align-items': 'center',
          'space-x': '0.25rem',
          '.dot': {
            'width': '0.5rem',
            'height': '0.5rem',
            'background-color': '#9ca3af',
            'border-radius': '50%',
            'animation': 'typingBounce 1.4s infinite ease-in-out both',
            '&:nth-child(1)': {
              'animation-delay': '-0.32s',
            },
            '&:nth-child(2)': {
              'animation-delay': '-0.16s',
            },
          },
        },

        '.code-block-codementorx': {
          'background': '#1e1e1e',
          'color': '#d4d4d4',
          'border-radius': '0.75rem',
          'padding': '1rem',
          'font-family': 'Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
          'font-size': '0.875rem',
          'border': '1px solid rgba(139, 92, 246, 0.2)',
          'box-shadow': '0 4px 20px rgba(139, 92, 246, 0.15)',
          'position': 'relative',
          'overflow-x': 'auto',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'top': '0',
            'left': '0',
            'right': '0',
            'height': '30px',
            'background': 'linear-gradient(to right, #ff5f57, #ffbd2e, #28ca42)',
            'border-radius': '0.75rem 0.75rem 0 0',
            'opacity': '0.8',
          },
        },

        '.alert-codementorx': {
          'border-radius': '0.75rem',
          'padding': '1rem',
          'border': '1px solid',
          'backdrop-filter': 'blur(10px)',
          'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.1)',
          '&.success': {
            'background': 'rgba(240, 253, 244, 0.8)',
            'border-color': 'rgba(34, 197, 94, 0.3)',
            'color': '#166534',
            'box-shadow': '0 4px 20px rgba(0, 208, 132, 0.15)',
          },
          '&.error': {
            'background': 'rgba(254, 242, 242, 0.8)',
            'border-color': 'rgba(239, 68, 68, 0.3)',
            'color': '#991b1b',
            'box-shadow': '0 4px 20px rgba(239, 68, 68, 0.15)',
          },
          '&.warning': {
            'background': 'rgba(255, 251, 235, 0.8)',
            'border-color': 'rgba(245, 158, 11, 0.3)',
            'color': '#92400e',
            'box-shadow': '0 4px 20px rgba(245, 158, 11, 0.15)',
          },
          '&.info': {
            'background': 'rgba(239, 246, 255, 0.8)',
            'border-color': 'rgba(0, 102, 255, 0.3)',
            'color': '#1e40af',
            'box-shadow': '0 4px 20px rgba(0, 102, 255, 0.15)',
          },
        },
      });
    },
  ],
};