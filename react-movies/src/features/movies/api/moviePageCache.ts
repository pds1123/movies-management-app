import apiClient from '../../../api/apiClient';
import type Screening from '../../bookings/models/Screening.model';
import type Movie from '../models/movie.model';

const movieDetails = new Map<number, Promise<Movie>>();
const movieScreenings = new Map<number, Promise<Screening[]>>();

function remember<T>(cache: Map<number, Promise<T>>, id: number, request: () => Promise<T>) {
    const existing = cache.get(id);
    if (existing) {
        return existing;
    }

    const pending = request().catch(error => {
        cache.delete(id);
        throw error;
    });
    cache.set(id, pending);
    return pending;
}

export function getMovieDetails(id: number) {
    return remember(movieDetails, id, async () => {
        const response = await apiClient.get<Movie>(`/movies/${id}`);
        return response.data;
    });
}

export function getMovieScreenings(id: number) {
    return remember(movieScreenings, id, async () => {
        const response = await apiClient.get<Screening[]>(`/screenings/movie/${id}`);
        return response.data;
    });
}

export async function refreshMovieScreenings(id: number) {
    movieScreenings.delete(id);
    return getMovieScreenings(id);
}

export function prefetchMoviePage(id: number) {
    void getMovieDetails(id).catch(() => undefined);
    void getMovieScreenings(id).catch(() => undefined);
}
