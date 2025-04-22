/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
    "!./src/components/employee_management/**/*", 
    "!./src/pages/employee-management/**/*",
    "!./node_modules"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
