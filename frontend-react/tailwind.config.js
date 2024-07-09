/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Sans: 'Inter',
      },
    boxShadow: {
    shape: '0 8 8 rgba(0, 0, 0, 0.1), 0px 4px 4px rgba(0, 0, 0, 0.1), 0px 2px 2px rgba(0, 0, 0, 0.1) 0px, 0px, 0px, 1px rgba(0, 0, 0, 0.1), isert 0px 0px 0px 1px rgba(255, 255, 2555, 0.03), isert 0px 1px 0px rgba(255, 255, 2555, 0.03)'}  
    },
    backgroundImage: {
      pattern: 'url(/bg.png)'
    },


    
  },
  plugins: [],
}