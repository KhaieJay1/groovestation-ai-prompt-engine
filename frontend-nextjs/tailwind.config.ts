import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'spotify-black': '#000000',
                'spotify-dark-gray': '#121212',
                'spotify-light-gray': '#282828',
                'spotify-hover': '#3E3E3E',
                'spotify-green': '#1ED760',
                'spotify-text-primary': '#FFFFFF',
                'spotify-text-secondary': '#B3B3B3',
            },
        },
    },
    plugins: [],
} satisfies Config;
