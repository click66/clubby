/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        primary: "#2d464c",
        secondary: "#6a737d",
        accent: "#ddeff0",
        success: "#28a745",
        error: "#dc3545",
        warning: '#ffc107',
      
        background: "#f8f9fa",
        text: "#495057",
      
        light: "#f2f9f9",
        dark: "#1a2c32",
      },
    },
  },
  plugins: [],
};

/**
 * https://uicolors.app/
 * 'blue-chill': {
    '50': '#f2f9f9',
    '100': '#ddeff0',
    '200': '#bfe0e2',
    '300': '#92cace',
    '400': '#5faab1',
    '500': '#438e96',
    '600': '#3b757f',
    '700': '#356169',
    '800': '#325158',
    '900': '#2d464c',
    '950': '#1a2c32',
},
 */