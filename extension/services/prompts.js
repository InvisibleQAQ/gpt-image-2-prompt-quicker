const GITHUB_PROMPTS_URL = 'https://raw.githubusercontent.com/glidea/banana-prompt-quicker/main/prompts.json';
const PROMPTS_CACHE_KEY = 'banana_prompts_cache';
const PROMPTS_CACHE_DURATION = 60 * 60 * 1000; // 60 min

window.PromptManager = {
    async get() {
        return window.Fetcher.fetchWithCache(
            GITHUB_PROMPTS_URL,
            PROMPTS_CACHE_KEY,
            PROMPTS_CACHE_DURATION,
            async (prompts) => {
                await Promise.all(prompts.map(async (prompt) => {
                    if (prompt.reference_image_urls && Array.isArray(prompt.reference_image_urls)) {
                        const base64Images = await Promise.all(
                            prompt.reference_image_urls.map(async (url) => {
                                try {
                                    const file = await window.Utils.urlToFile(url, 'image.jpg');
                                    return await window.Utils.compressReferenceImage(file);
                                } catch (err) {
                                    console.error(`Failed to process image ${url}:`, err);
                                    return null;
                                }
                            })
                        );
                        prompt.referenceImages = base64Images.filter(img => img !== null);
                    }
                }));
                return prompts;
            }
        );
    }
};
