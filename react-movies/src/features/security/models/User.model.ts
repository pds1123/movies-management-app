export default interface User {
    id: string;
    email: string;
    membershipNumber?: string;
    membershipStatus: 'Active' | 'Cancelled' | 'Non-member';
}
