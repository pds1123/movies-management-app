import { useState, useEffect } from "react";
import MoviesList from "../../movies/components/MoviesList";
import type LandingPageDTO from "../models/LandingPageDTO";
import apiClient from "../../../api/apiClient";
import AlertContext from "../../../utils/AlertContext.ts";
import Button from "../../../components/Button.tsx";

export default function LandingPage() {

    const [movies, setMovies] = useState<LandingPageDTO>();
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [])

    async function loadRecords() {
        setMovies(undefined);
        setHasError(false);

        try {
            const res = await apiClient.get<LandingPageDTO>('/movies/landing', { timeout: 8000 });
            setMovies(res.data);
        } catch {
            setHasError(true);
        }
    }

    if (hasError) {
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
            <AlertContext.Provider value={() => loadRecords()}>
                <section className="programme-section" aria-labelledby="now-showing-title">
                    <div className="section-heading">
                        <h2 id="now-showing-title">In Theaters</h2>
                    </div>
                    <MoviesList movies={movies?.inTheaters} />
                </section>

                <section className="programme-section programme-section-upcoming" aria-labelledby="coming-soon-title">
                    <div className="section-heading">
                        <h2 id="coming-soon-title">Upcoming Releases</h2>
                    </div>
                    <MoviesList movies={movies?.upcomingReleases} />
                </section>
            </AlertContext.Provider>
        </div>
    )
}
