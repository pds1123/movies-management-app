export default interface Booking {
    id: number;
    screeningId: number;
    movieTitle: string;
    theaterName: string;
    startsAt: string;
    ticketCount: number;
    confirmationCode: string;
    checkInToken: string;
    status: string;
    createdAt: string;
    checkedInAt?: string;
}
