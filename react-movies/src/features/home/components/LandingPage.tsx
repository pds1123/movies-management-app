import { useState, useEffect, useRef } from "react";
import MoviesList from "../../movies/components/MoviesList";
import type LandingPageDTO from "../models/LandingPageDTO";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/Button.tsx";

export default function LandingPage() {

    const initialMovies = useRef(readCachedProgramme()).current;
    const [movies, setMovies] = useState<LandingPageDTO | undefined>(initialMovies);
    const [loadState, setLoadState] = useState<ProgrammeLoadState>(initialMovies ? 'ready' : 'loading');
    const wakingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const requestController = useRef<AbortController | undefined>(undefined);

    useEffect(() => {
        loadRecords(Boolean(initialMovies));

        return () => {
            requestController.current?.abort();
            if (wakingTimer.current) {
                clearTimeout(wakingTimer.current);
            }
        }
    }, [])

    async function loadRecords(preserveExisting = false) {
        if (!preserveExisting) {
            setMovies(undefined);
            setLoadState('loading');
        }
        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;

        if (wakingTimer.current) {
            clearTimeout(wakingTimer.current);
        }

        if (!preserveExisting) {
            wakingTimer.current = setTimeout(() => {
                setLoadState(current => current === 'loading' ? 'waking' : current);
            }, 6_000);
        }

        try {
            const res = await apiClient.get<LandingPageDTO>('/movies/landing', {
                signal: controller.signal
            });
            setMovies(res.data);
            writeCachedProgramme(res.data);
            setLoadState('ready');
        } catch {
            if (!controller.signal.aborted) {
                setLoadState(preserveExisting ? 'ready' : 'error');
            }
        } finally {
            if (requestController.current === controller && wakingTimer.current) {
                clearTimeout(wakingTimer.current);
                wakingTimer.current = undefined;
            }
            if (requestController.current === controller) {
                requestController.current = undefined;
            }
        }
    }

    if (loadState === 'waking') {
        return (
            <section className="programme-section" aria-labelledby="programme-waking-title">
                <div className="section-heading">
                    <h2 id="programme-waking-title">Preparing the programme</h2>
                </div>
                <div className="programme-error" role="status" aria-label="Preparing programme">
                    <span className="loading-mark" aria-hidden="true"></span>
                    <div>
                        <h3>The cinema service is waking up.</h3>
                        <p>This portfolio demo may take up to a minute after a quiet period. The programme will appear automatically.</p>
                    </div>
                </div>
            </section>
        )
    }

    if (loadState === 'error') {
        return (
            <section className="programme-section" aria-labelledby="programme-unavailable-title">
                <div className="section-heading">
                    <h2 id="programme-unavailable-title">Programme unavailable</h2>
                </div>
                <div className="programme-error" role="alert">
                    <span className="programme-error-icon bi bi-wifi-off" aria-hidden="true"></span>
                    <div>
                        <h3>We couldn't load the films.</h3>
                        <p>Check that the cinema service is running, then try again.</p>
                    </div>
                    <Button onClick={() => loadRecords()}>Retry programme</Button>
                </div>
            </section>
        )
    }

    return (
        <div className="programme-page">
            <section className="programme-section" aria-labelledby="now-showing-title">
                <div className="section-heading">
                    <h2 id="now-showing-title">In Theaters</h2>
                </div>
                <MoviesList movies={movies?.inTheaters} onMovieDeleted={() => loadRecords(true)} />
            </section>

            <section className="programme-section programme-section-upcoming" aria-labelledby="coming-soon-title">
                <div className="section-heading">
                    <h2 id="coming-soon-title">Upcoming Releases</h2>
                </div>
                <MoviesList movies={movies?.upcomingReleases} onMovieDeleted={() => loadRecords(true)} />
            </section>
        </div>
    )
}

type ProgrammeLoadState = 'loading' | 'waking' | 'ready' | 'error';

const PROGRAMME_CACHE_KEY = 'frame-programme';
const PROGRAMME_CACHE_TTL = 5 * 60 * 1000;

interface CachedProgramme {
    savedAt: number;
    programme: LandingPageDTO;
}

function readCachedProgramme() {
    try {
        const raw = sessionStorage.getItem(PROGRAMME_CACHE_KEY);
        if (!raw) {
            return undefined;
        }

        const cached = JSON.parse(raw) as CachedProgramme;
        if (Date.now() - cached.savedAt > PROGRAMME_CACHE_TTL) {
            sessionStorage.removeItem(PROGRAMME_CACHE_KEY);
            return undefined;
        }

        return cached.programme;
    } catch {
        sessionStorage.removeItem(PROGRAMME_CACHE_KEY);
        return undefined;
    }
}

function writeCachedProgramme(programme: LandingPageDTO) {
    try {
        sessionStorage.setItem(PROGRAMME_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            programme
        } satisfies CachedProgramme));
    } catch {
        // Storage can be unavailable in privacy modes. The network response is still usable.
    }
}
