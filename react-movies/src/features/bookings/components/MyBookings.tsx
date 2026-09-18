import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import apiClient from '../../../api/apiClient';
import DisplayErrors from '../../../components/DisplayErrors';
import extractErrors from '../../../utils/extractErrors';
import customConfirm from '../../../utils/customConfirm';
import type Booking from '../models/Booking.model';
import BookingPass from './BookingPass';

export default function MyBookings() {
    const [bookings, setBookings] = useState<Booking[]>();
    const [errors, setErrors] = useState<string[]>([]);

    async function loadBookings() {
        const response = await apiClient.get<Booking[]>('/bookings/mine');
        setBookings(response.data);
    }

    useEffect(() => {
        loadBookings().catch((error: AxiosError) => setErrors(extractErrors(error)));
    }, []);

    async function cancelBooking(id: number) {
        setErrors([]);
        try {
            await apiClient.delete(`/bookings/${id}`);
            await loadBookings();
        } catch (error) {
            setErrors(extractErrors(error as AxiosError));
        }
    }

    function confirmCancellation(id: number) {
        customConfirm(
            () => void cancelBooking(id),
            'Cancel this reservation?',
            'Cancel reservation'
        );
    }

    return (
        <section className="bookings-page">
            <header className="page-heading">
                <p>YOUR VISITS</p>
                <h1>My reservations</h1>
            </header>
            <DisplayErrors errors={errors} />
            {bookings && bookings.length > 0 ? (
                <div className="booking-pass-list">
                    {bookings.map(booking => (
                        <BookingPass key={booking.id} booking={booking} onCancel={confirmCancellation} />
                    ))}
                </div>
            ) : bookings ? (
                <div className="empty-state"><p>You have no reservations yet.</p></div>
            ) : (
                <div className="empty-state"><p>Loading reservations...</p></div>
            )}
        </section>
    );
}
