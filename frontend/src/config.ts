const config = {
    apiUrl: import.meta.env.VITE_API_URL as string,
    baseUrl: import.meta.env.BASE_URL as string,
};

// Validate that all required variables are present
for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
        throw new Error(`Missing environment variable for config key: ${key}`);
    } else {
        console.log(key, value);
    }
}

export default config;