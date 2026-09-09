import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router"
import apiClient from "../../../api/apiClient";
import type Movie from "../models/movie.model";
import Loading from "../../../components/Loading";
import type Coordinate from "../../../components/Map/coordinate.model";
import Map from '../../../components/Map/Map';
import resolveAssetUrl from "../../../utils/resolveAssetUrl";

export default function MovieDetail() {

    const { id } = useParams();
    const [movie, setMovie] = useState<Movie>();

    useEffect(() => {
        apiClient.get<Movie>(`/movies/${id}`).then(res => {
            setMovie(res.data);
        })
    }, [id])

    if (!movie) {
        return <Loading />
    }

    const dateFormatted = new Intl.DateTimeFormat('en-NZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(new Date(movie.releaseDate));

    function getYoutubeEmbedURL(url: string): string | undefined {
        try {
            const objUrl = new URL(url);
            const videoId = objUrl.hostname === 'youtu.be'
                ? objUrl.pathname.slice(1)
                : objUrl.searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
        } catch {
            return undefined;
        }
    }

    function transformCoordinates(): Coordinate[]{
        return movie!.theaters!.map(t => {
            const coordinate: Coordinate = {lat: t.latitude, lng: t.longitude, message: t.name}
            return coordinate
        })
    }

    return (
        <article className="film-detail">
            <NavLink to="/" className="back-link"><span aria-hidden="true">←</span> Back to programme</NavLink>

            <header className="film-detail-header">
                <div>
                    <p className="film-release">At FRAME from {dateFormatted}</p>
                    <h1>{movie.title}</h1>
                </div>

                {movie.genres && movie.genres.length > 0 && (
                    <div className="genre-list" aria-label="Genres">
                        {movie.genres.map(genre => <span key={genre.id}>{genre.name}</span>)}
                    </div>
                )}
            </header>

            <div className="film-media-grid">
                <img className="film-poster" src={resolveAssetUrl(movie.poster)} alt={`${movie.title} poster`} />
                {getYoutubeEmbedURL(movie.trailer) ? (
                    <div className="trailer-frame">
                        <iframe title={`${movie.title} trailer`} allowFullScreen
                            src={getYoutubeEmbedURL(movie.trailer)}>
                        </iframe>
                    </div>
                ) : (
                    <div className="trailer-unavailable"><span className="bi bi-play-circle" aria-hidden="true"></span><p>Trailer unavailable</p></div>
                )}
            </div>

                {movie.actors && movie.actors.length > 0 && (
                    <section className="cast-section" aria-labelledby="cast-title">
                        <h2 id="cast-title">Cast</h2>
                        <div className="cast-list">
                            {movie.actors.map(actor => (
                                <div key={actor.id} className="cast-member">
                                    <img src={resolveAssetUrl(actor.picture)} alt="" />
                                        <div>
                                            <strong>{actor.name}</strong>
                                            <span>{actor.character}</span>
                                        </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {movie.theaters && movie.theaters.length > 0 && <section className="cinema-map" aria-labelledby="cinema-map-title">
                        <div className="section-heading">
                            <h2 id="cinema-map-title">Where it’s showing</h2>
                            <p>{movie.theaters.map(theater => theater.name).join(' · ')}</p>
                        </div>
                        <Map coordinates={transformCoordinates()} allowClicks={false} />
                    </section>}
        </article>
    )
}
