import { useState, useEffect, useRef } from "react";
import MoviesList from "../../movies/components/MoviesList";
import type LandingPageDTO from "../models/LandingPageDTO";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/Button.tsx";

export default function LandingPage() {

    const [movies, setMovies] = useState<LandingPageDTO>();
    const [loadState, setLoadState] = useState<ProgrammeLoadState>('loading');
    const wakingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const requestController = useRef<AbortController | undefined>(undefined);

    useEffect(() => {
        loadRecords();

        return () => {
            requestController.current?.abort();
            if (wakingTimer.current) {
                clearTimeout(wakingTimer.current);
            }
        }
    }, [])

    async function loadRecords() {
        setMovies(undefined);
        setLoadState('loading');
        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;

        if (wakingTimer.current) {
            clearTimeout(wakingTimer.current);
        }

        wakingTimer.current = setTimeout(() => {
            setLoadState(current => current === 'loading' ? 'waking' : current);
        }, 6_000);

        try {
            const res = await apiClient.get<LandingPageDTO>('/movies/landing', {
                signal: controller.signal
            });
            setMovies(res.data);
            setLoadState('ready');
        } catch {
            if (!controller.signal.aborted) {
                setLoadState('error');
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
                    <Button onClick={loadRecords}>Retry programme</Button>
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
                <MoviesList movies={movies?.inTheaters} onMovieDeleted={loadRecords} />
            </section>

            <section className="programme-section programme-section-upcoming" aria-labelledby="coming-soon-title">
                <div className="section-heading">
                    <h2 id="coming-soon-title">Upcoming Releases</h2>
                </div>
                <MoviesList movies={movies?.upcomingReleases} onMovieDeleted={loadRecords} />
            </section>
        </div>
    )
}

type ProgrammeLoadState = 'loading' | 'waking' | 'ready' | 'error';
