const config = {
    apiUrl: import.meta.env.VITE_API_URL as string,
    baseUrl: import.meta.env.VITE_FE_BASE_URL as string,
};

// Validate that all required variables are present
for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
        console.warn(`Missing environment variable for config key: ${key}`)
    } else {
        console.log(key, value);
    }
}

export default config;