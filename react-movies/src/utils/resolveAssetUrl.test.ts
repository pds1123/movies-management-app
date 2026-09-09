import { afterEach, describe, expect, it, vi } from 'vitest';
import resolveAssetUrl from './resolveAssetUrl';

describe('resolveAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('replaces a loopback image host with the configured API host', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.frame.test/api');

    const result = resolveAssetUrl('http://127.0.0.1:5231/movies/poster.jpg');

    expect(result).toBe('https://api.frame.test/movies/poster.jpg');
  });

  it('leaves external image URLs unchanged', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.frame.test/api');
    const url = 'https://images.example/poster.jpg';

    expect(resolveAssetUrl(url)).toBe(url);
  });
});
