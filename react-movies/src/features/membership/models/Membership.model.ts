export default interface Membership {
    membershipNumber?: string;
    status: 'Active' | 'Cancelled' | 'Non-member';
    joinedAt?: string;
    updatedAt?: string;
}
