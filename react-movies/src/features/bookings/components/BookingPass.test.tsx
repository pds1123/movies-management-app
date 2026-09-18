import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type Booking from '../models/Booking.model';
import BookingPass from './BookingPass';

const booking: Booking = {
  id: 14,
  screeningId: 8,
  movieTitle: 'Paris, Texas (1984)',
  theaterName: 'FRAME CINEMAS',
  startsAt: '2099-09-20T07:30:00Z',
  ticketCount: 2,
  confirmationCode: 'FC-ABCD-1234',
  checkInToken: 'private-check-in-token',
  status: 'Confirmed',
  createdAt: '2026-09-18T07:30:00Z'
};

describe('BookingPass', () => {
  it('renders the reservation details without exposing the check-in token', () => {
    render(<BookingPass booking={booking} />);

    expect(screen.getByRole('heading', { name: booking.movieTitle })).toBeInTheDocument();
    expect(screen.getByText(booking.confirmationCode)).toBeInTheDocument();
    expect(screen.getByText(booking.theaterName)).toBeInTheDocument();
    expect(screen.queryByText(booking.checkInToken)).not.toBeInTheDocument();
  });

  it('passes the booking id to the cancellation handler', () => {
    const onCancel = vi.fn();
    render(<BookingPass booking={booking} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel reservation' }));

    expect(onCancel).toHaveBeenCalledWith(booking.id);
  });
});
