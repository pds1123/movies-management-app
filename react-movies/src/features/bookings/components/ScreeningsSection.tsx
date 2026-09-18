import { useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import type { AxiosError } from 'axios';
import apiClient from '../../../api/apiClient';
import DisplayErrors from '../../../components/DisplayErrors';
import AuthenticationContext from '../../security/utils/AuthenticationContext';
import type Theater from '../../theaters/models/Theater.model';
import extractErrors from '../../../utils/extractErrors';
import customConfirm from '../../../utils/customConfirm';
import type Booking from '../models/Booking.model';
import type Screening from '../models/Screening.model';
import BookingPass from './BookingPass';

export default function ScreeningsSection({ movieId, movieTitle, theaters }: ScreeningsSectionProps) {
    const { claims } = useContext(AuthenticationContext);
    const location = useLocation();
    const [screenings, setScreenings] = useState<Screening[]>();
    const [booking, setBooking] = useState<Booking>();
    const [errors, setErrors] = useState<string[]>([]);
    const [submittingId, setSubmittingId] = useState<number>();
    const [startsAt, setStartsAt] = useState('');
    const [capacity, setCapacity] = useState(30);
    const [theaterId, setTheaterId] = useState(theaters[0]?.id ?? 0);
    const [creating, setCreating] = useState(false);

    const isLoggedIn = claims.length > 0;
    const isAdmin = claims.some(claim => claim.name === 'isadmin');

    const loadScreenings = useCallback(async () => {
        const response = await apiClient.get<Screening[]>(`/screenings/movie/${movieId}`);
        setScreenings(response.data);
    }, [movieId]);

    useEffect(() => {
        loadScreenings().catch((error: AxiosError) => setErrors(extractErrors(error)));
    }, [loadScreenings]);

    useEffect(() => {
        if (theaters.length > 0 && theaterId === 0) {
            setTheaterId(theaters[0].id);
        }
    }, [theaterId, theaters]);

    async function reserve(screening: Screening) {
        setSubmittingId(screening.id);
        setErrors([]);
        try {
            const response = await apiClient.post<Booking>(`/bookings/screening/${screening.id}`);
            setBooking(response.data);
            await loadScreenings();
        } catch (error) {
            setErrors(extractErrors(error as AxiosError));
        } finally {
            setSubmittingId(undefined);
        }
    }

    async function createScreening(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        setErrors([]);
        try {
            await apiClient.post('/screenings', {
                movieId,
                theaterId,
                startsAt: new Date(startsAt).toISOString(),
                capacity
            });
            setStartsAt('');
            await loadScreenings();
        } catch (error) {
            setErrors(extractErrors(error as AxiosError));
        } finally {
            setCreating(false);
        }
    }

    async function cancelScreening(id: number) {
        setErrors([]);
        try {
            await apiClient.delete(`/screenings/${id}`);
            await loadScreenings();
        } catch (error) {
            setErrors(extractErrors(error as AxiosError));
        }
    }

    return (
        <section className="screenings-section" aria-labelledby="screenings-title">
            <div className="section-heading">
                <h2 id="screenings-title">Screenings</h2>
                <p>Reserve now, pay when you arrive.</p>
            </div>

            <DisplayErrors errors={errors} />

            {screenings && screenings.length > 0 ? (
                <div className="screening-list">
                    {screenings.map(screening => {
                        const date = new Date(screening.startsAt);
                        const soldOut = screening.availableSeats === 0;
                        return (
                            <article className="screening-row" key={screening.id}>
                                <div className="screening-date">
                                    <span>{new Intl.DateTimeFormat('en-NZ', { weekday: 'short' }).format(date)}</span>
                                    <strong>{new Intl.DateTimeFormat('en-NZ', { day: 'numeric' }).format(date)}</strong>
                                    <span>{new Intl.DateTimeFormat('en-NZ', { month: 'short' }).format(date)}</span>
                                </div>
                                <div className="screening-info">
                                    <h3>{new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', minute: '2-digit' }).format(date)}</h3>
                                    <p>{screening.theaterName}</p>
                                </div>
                                <p className={`screening-availability ${soldOut ? 'is-sold-out' : ''}`}>
                                    {soldOut ? 'Sold out' : `${screening.availableSeats} places available`}
                                </p>
                                <div className="screening-actions">
                                    {isLoggedIn ? (
                                        <button type="button" className="btn btn-primary"
                                            onClick={() => reserve(screening)}
                                            disabled={soldOut || submittingId === screening.id}>
                                            {submittingId === screening.id ? 'Reserving...' : 'Reserve'}
                                        </button>
                                    ) : (
                                        <NavLink className="btn btn-primary"
                                            to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`}>
                                            Sign in to reserve
                                        </NavLink>
                                    )}
                                    {isAdmin && (
                                        <button type="button" className="screening-cancel"
                                            onClick={() => customConfirm(
                                                () => void cancelScreening(screening.id),
                                                'Cancel this screening and its reservations?',
                                                'Cancel screening'
                                            )}>Cancel screening</button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : screenings ? (
                <div className="screenings-empty">
                    <p>New screening times will be added soon.</p>
                </div>
            ) : (
                <div className="screenings-empty"><p>Loading screenings...</p></div>
            )}

            {booking && (
                <div className="booking-confirmation" role="status">
                    <p className="booking-confirmation-title">Reservation confirmed</p>
                    <BookingPass booking={booking} />
                    <NavLink to="/bookings">View all my reservations</NavLink>
                </div>
            )}

            {isAdmin && theaters.length > 0 && (
                <form className="screening-admin-form" onSubmit={createScreening}>
                    <div>
                        <h3>Add a screening</h3>
                        <p>Create another time for {movieTitle}.</p>
                    </div>
                    <label>Starts at
                        <input type="datetime-local" value={startsAt} required
                            onChange={event => setStartsAt(event.target.value)} />
                    </label>
                    <label>Cinema
                        <select value={theaterId} onChange={event => setTheaterId(Number(event.target.value))}>
                            {theaters.map(theater => <option key={theater.id} value={theater.id}>{theater.name}</option>)}
                        </select>
                    </label>
                    <label>Capacity
                        <input type="number" min="1" max="1000" value={capacity} required
                            onChange={event => setCapacity(Number(event.target.value))} />
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={creating || !startsAt}>
                        {creating ? 'Adding...' : 'Add screening'}
                    </button>
                </form>
            )}
        </section>
    );
}

interface ScreeningsSectionProps {
    movieId: number;
    movieTitle: string;
    theaters: Theater[];
}
