window.Fetcher = {
    async fetchWithCache(url, key, duration, transformFn = null) {
        try {
            const timestampKey = `${key}_time`;

            // 1. Check cache
            const cache = await chrome.storage.local.get([key, timestampKey]);
            const cachedData = cache[key];
            const cacheTime = cache[timestampKey];
            const now = Date.now();

            if (cachedData && cacheTime && (now - cacheTime < duration)) {
                return cachedData;
            }

            // 2. Fetch from Network
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let data = await response.json();

            // 3. Transform if needed
            if (transformFn) {
                data = await transformFn(data);
            }

            // 4. Update cache
            await chrome.storage.local.set({
                [key]: data,
                [timestampKey]: now
            });
            return data;

        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);

            // 5. Fallback to cache if available (even if expired)
            const cache = await chrome.storage.local.get([key]);
            return cache[key] || []; // Return empty array if nothing in cache
        }
    }
};
