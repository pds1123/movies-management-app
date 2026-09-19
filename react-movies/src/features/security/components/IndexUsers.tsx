import Swal from "sweetalert2";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/Button";
import IndexEntities from "../../../components/IndexEntities";
import { useEntities } from "../../../hooks/useEntities"
import type EditClaim from "../models/EditClaim.model";
import type User from "../models/User.model"
import type { AxiosError } from "axios";
import extractErrors from "../../../utils/extractErrors";
import customConfirm from "../../../utils/customConfirm";

export default function IndexUsers() {

    const usersHook = useEntities<User>('/users/usersList');

    async function makeAdmin(email: string) {
        await editAdmin('/users/makeadmin', email);
    }

    async function removeAdmin(email: string) {
        await editAdmin('/users/removeadmin', email);
    }

    async function editAdmin(url: string, email: string) {
        const editClaimDTO: EditClaim = { email };

        await apiClient.post(url, editClaimDTO);
        Swal.fire({title: 'Success', icon: 'success', text: 'The operation was done successfully'});
    }

    async function activateMembership(email: string, reactivating: boolean) {
        try {
            await apiClient.post('/memberships/activate', { email });
            usersHook.loadRecords();
            await Swal.fire({
                title: reactivating ? 'Membership reactivated' : 'Membership activated',
                icon: 'success',
                text: `${email} can now reserve screenings.`
            });
        } catch (error) {
            await showError(error as AxiosError);
        }
    }

    async function cancelMembership(email: string) {
        try {
            await apiClient.post('/memberships/cancel', { email });
            usersHook.loadRecords();
            await Swal.fire({
                title: 'Membership cancelled',
                icon: 'success',
                text: `${email} can no longer make reservations.`
            });
        } catch (error) {
            await showError(error as AxiosError);
        }
    }

    async function showError(error: AxiosError) {
        await Swal.fire({
            title: 'Membership not updated',
            icon: 'error',
            text: extractErrors(error).join(' ')
        });
    }

    return (
        <>
            <IndexEntities<User> title="Users" url="/users" {...usersHook}>
                {(users) => <>
                    <thead className="table-light">
                        <tr>
                            <th scope="col">Email</th>
                            <th scope="col">Membership</th>
                            <th scope="col" className="text-end">Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map(user => <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>
                                <span className={`status-badge status-${user.membershipStatus.toLowerCase().replace('-', '')}`}>
                                    {user.membershipStatus}
                                </span>
                                {user.membershipNumber && <small className="membership-number">{user.membershipNumber}</small>}
                            </td>
                            <td className="text-end user-actions">
                                {user.membershipStatus === 'Active' ? (
                                    <Button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => customConfirm(
                                            () => void cancelMembership(user.email),
                                            'Cancel this membership?',
                                            'Cancel membership',
                                            'The member will no longer be able to reserve screenings.'
                                        )}>
                                        Cancel membership
                                    </Button>
                                ) : (
                                    <Button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => void activateMembership(user.email, user.membershipStatus === 'Cancelled')}>
                                        {user.membershipStatus === 'Cancelled' ? 'Reactivate membership' : 'Make member'}
                                    </Button>
                                )}
                                <Button onClick={() => makeAdmin(user.email)} className="btn btn-sm btn-outline-primary">Make admin</Button>
                                <Button onClick={() => removeAdmin(user.email)} className="btn btn-sm btn-outline-danger">Remove admin</Button>
                            </td>
                        </tr>)}
                    </tbody>
                </>}
            </IndexEntities>
        </>
    )
}
