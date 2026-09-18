export default interface Screening {
    id: number;
    movieId: number;
    movieTitle: string;
    theaterId: number;
    theaterName: string;
    startsAt: string;
    capacity: number;
    availableSeats: number;
    status: string;
}
