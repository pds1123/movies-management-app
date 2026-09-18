import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerInstance {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getIframe: () => HTMLIFrameElement;
    getPlayerState: () => number;
    getVolume: () => number;
    isMuted: () => boolean;
    mute: () => void;
    pauseVideo: () => void;
    playVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    unMute: () => void;
}

interface YouTubePlayerEvent {
    data: number;
    target: YouTubePlayerInstance;
}

interface YouTubeApi {
    Player: new (element: HTMLElement, options: {
        events: {
            onReady: (event: YouTubePlayerEvent) => void;
            onStateChange: (event: YouTubePlayerEvent) => void;
        };
        playerVars: Record<string, number>;
        videoId: string;
    }) => YouTubePlayerInstance;
    PlayerState: {
        PLAYING: number;
    };
}

declare global {
    interface Window {
        YT?: YouTubeApi;
        onYouTubeIframeAPIReady?: () => void;
    }
}

let youtubeApiPromise: Promise<YouTubeApi> | undefined;

function loadYouTubeApi(): Promise<YouTubeApi> {
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    if (!youtubeApiPromise) {
        youtubeApiPromise = new Promise((resolve, reject) => {
            const existingCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                existingCallback?.();
                if (window.YT) {
                    resolve(window.YT);
                }
            };

            const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
            if (existingScript) {
                existingScript.addEventListener('error', () => reject(new Error('YouTube player failed to load')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            script.addEventListener('error', () => reject(new Error('YouTube player failed to load')), { once: true });
            document.head.appendChild(script);
        });
    }

    return youtubeApiPromise;
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) {
        return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

interface YouTubePlayerProps {
    title: string;
    videoId: string;
    videoUrl: string;
}

export default function YouTubePlayer({ title, videoId, videoUrl }: YouTubePlayerProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayerInstance | undefined>(undefined);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [volume, setVolume] = useState(100);

    useEffect(() => {
        let cancelled = false;
        let progressTimer: number | undefined;

        loadYouTubeApi().then(api => {
            if (cancelled || !mountRef.current) {
                return;
            }

            playerRef.current = new api.Player(mountRef.current, {
                videoId,
                playerVars: {
                    controls: 0,
                    fs: 1,
                    playsinline: 1,
                    rel: 0
                },
                events: {
                    onReady: event => {
                        event.target.getIframe().title = `${title} trailer`;
                        setDuration(event.target.getDuration());
                        setIsMuted(event.target.isMuted());
                        setVolume(event.target.getVolume());
                        setIsReady(true);
                    },
                    onStateChange: event => {
                        setIsPlaying(event.data === api.PlayerState.PLAYING);
                    }
                }
            });

            progressTimer = window.setInterval(() => {
                const player = playerRef.current;
                if (!player) {
                    return;
                }

                setCurrentTime(player.getCurrentTime());
                setDuration(player.getDuration());
                setIsPlaying(player.getPlayerState() === api.PlayerState.PLAYING);
            }, 500);
        }).catch(() => {
            setIsReady(false);
        });

        return () => {
            cancelled = true;
            if (progressTimer) {
                window.clearInterval(progressTimer);
            }
            playerRef.current?.destroy();
            playerRef.current = undefined;
        };
    }, [title, videoId]);

    function togglePlayback() {
        if (!isReady || !playerRef.current) {
            return;
        }

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }

    function toggleMute() {
        if (!isReady || !playerRef.current) {
            return;
        }

        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    }

    function changeVolume(nextVolume: number) {
        if (!playerRef.current) {
            return;
        }

        playerRef.current.setVolume(nextVolume);
        if (nextVolume > 0 && playerRef.current.isMuted()) {
            playerRef.current.unMute();
            setIsMuted(false);
        }
        setVolume(nextVolume);
    }

    function seek(nextTime: number) {
        playerRef.current?.seekTo(nextTime, true);
        setCurrentTime(nextTime);
    }

    async function enterFullscreen() {
        await wrapperRef.current?.requestFullscreen();
    }

    return (
        <div className="youtube-player" ref={wrapperRef}>
            <div className="youtube-player-stage" ref={mountRef} />
            <div className="youtube-controls" aria-label={`${title} trailer controls`}>
                <button type="button" onClick={togglePlayback} disabled={!isReady}
                    aria-label={isPlaying ? 'Pause trailer' : 'Play trailer'}>
                    <span className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`} aria-hidden="true" />
                </button>

                <span className="youtube-time">{formatTime(currentTime)}</span>
                <input className="youtube-progress" type="range" min="0" max={duration || 0}
                    step="0.1" value={Math.min(currentTime, duration || 0)}
                    onChange={event => seek(Number(event.target.value))}
                    disabled={!isReady} aria-label="Trailer progress" />
                <span className="youtube-time">{formatTime(duration)}</span>

                <button type="button" onClick={toggleMute} disabled={!isReady}
                    aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}>
                    <span className={`bi ${isMuted || volume === 0 ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`} aria-hidden="true" />
                </button>
                <input className="youtube-volume" type="range" min="0" max="100" value={volume}
                    onChange={event => changeVolume(Number(event.target.value))}
                    disabled={!isReady} aria-label="Trailer volume" />

                <a href={videoUrl} target="_blank" rel="noreferrer" aria-label="Watch trailer on YouTube">
                    <span className="bi bi-youtube" aria-hidden="true" />
                </a>
                <button type="button" onClick={enterFullscreen} aria-label="Enter fullscreen">
                    <span className="bi bi-fullscreen" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
