/** @type {import('tailwindcss').Config} */
export default {
content: [
'./index.html',
'./src/**/*.{js,jsx,ts,tsx}',
],
theme: {
extend: {
colors: {
background: '#0b0f1a',
muted: '#111827',
foreground: '#e5e7eb',
}
},
container: { center: true, padding: '1rem' }
},
plugins: [],
}