import { useState, useEffect } from "react";
import MoviesList from "../../movies/components/MoviesList";
import type LandingPageDTO from "../models/LandingPageDTO";
import apiClient from "../../../api/apiClient";
import AlertContext from "../../../utils/AlertContext.ts";

export default function LandingPage() {

    const [movies, setMovies] = useState<LandingPageDTO>({});

    useEffect(() => {
        loadRecords();
    }, [])

    function loadRecords() {
        apiClient.get<LandingPageDTO>('/movies/landing').then(res => {
            setMovies(res.data);
        });
    }

    return (
        <div className="programme-page">
            <AlertContext.Provider value={() => loadRecords()}>
                <section className="programme-section" aria-labelledby="now-showing-title">
                    <div className="section-heading">
                        <h2 id="now-showing-title">In Theaters</h2>
                    </div>
                    <MoviesList movies={movies.inTheaters} />
                </section>

                <section className="programme-section programme-section-upcoming" aria-labelledby="coming-soon-title">
                    <div className="section-heading">
                        <h2 id="coming-soon-title">Upcoming Releases</h2>
                    </div>
                    <MoviesList movies={movies.upcomingReleases} />
                </section>
            </AlertContext.Provider>
        </div>
    )
}
