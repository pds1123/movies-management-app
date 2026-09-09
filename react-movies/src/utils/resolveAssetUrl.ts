const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);

export default function resolveAssetUrl(assetUrl: string) {
    if (!assetUrl) {
        return assetUrl;
    }

    try {
        const parsedAssetUrl = new URL(assetUrl, window.location.origin);

        if (!loopbackHosts.has(parsedAssetUrl.hostname)) {
            return assetUrl;
        }

        const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin);
        parsedAssetUrl.protocol = apiUrl.protocol;
        parsedAssetUrl.hostname = apiUrl.hostname;
        parsedAssetUrl.port = apiUrl.port;

        return parsedAssetUrl.toString();
    } catch {
        return assetUrl;
    }
}
