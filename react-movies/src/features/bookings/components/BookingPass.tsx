import type Booking from '../models/Booking.model';

export default function BookingPass({ booking, onCancel }: BookingPassProps) {
    const screeningTime = new Intl.DateTimeFormat('en-NZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(booking.startsAt));

    return (
        <article className={`booking-pass booking-pass-${booking.status.toLowerCase()}`}>
            <div className="booking-pass-main">
                <p className="booking-pass-label">FRAME CINEMAS reservation</p>
                <h2>{booking.movieTitle}</h2>
                <dl>
                    <div><dt>Screening</dt><dd>{screeningTime}</dd></div>
                    <div><dt>Cinema</dt><dd>{booking.theaterName}</dd></div>
                    <div><dt>Guests</dt><dd>{booking.ticketCount}</dd></div>
                    <div><dt>Status</dt><dd>{booking.status}</dd></div>
                </dl>
            </div>
            <div className="booking-pass-code">
                <span>Confirmation code</span>
                <strong>{booking.confirmationCode}</strong>
                <p>Show this code when you arrive.</p>
                {onCancel && booking.status === 'Confirmed' && new Date(booking.startsAt) > new Date() && (
                    <button type="button" className="booking-cancel" onClick={() => onCancel(booking.id)}>
                        Cancel reservation
                    </button>
                )}
            </div>
        </article>
    );
}

interface BookingPassProps {
    booking: Booking;
    onCancel?: (id: number) => void;
}
