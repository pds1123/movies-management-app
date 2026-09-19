import { useContext, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { NavLink } from 'react-router';
import apiClient from '../../../api/apiClient';
import DisplayErrors from '../../../components/DisplayErrors';
import { cinemaDetails } from '../../../config/cinemaDetails';
import AuthenticationContext from '../../security/utils/AuthenticationContext';
import extractErrors from '../../../utils/extractErrors';
import type Membership from '../models/Membership.model';

export default function MembershipPage() {
    const { claims } = useContext(AuthenticationContext);
    const [membership, setMembership] = useState<Membership>();
    const [errors, setErrors] = useState<string[]>([]);
    const isLoggedIn = claims.length > 0;

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        apiClient.get<Membership>('/memberships/mine')
            .then(response => setMembership(response.data))
            .catch((error: AxiosError) => setErrors(extractErrors(error)));
    }, [isLoggedIn]);

    const emailSubject = encodeURIComponent('FRAME CINEMAS membership enquiry');
    const emailBody = encodeURIComponent(
        'Hello FRAME CINEMAS,\n\nI would like to enquire about becoming a member. My registered account email is:\n\nThank you.'
    );
    const membershipEmailLink = `mailto:${cinemaDetails.membershipEmail}?subject=${emailSubject}&body=${emailBody}`;

    return (
        <article className="membership-page">
            <header className="editorial-header">
                <p className="eyebrow">FRAME membership</p>
                <h1>One membership.<br />A year of remarkable films.</h1>
                <p className="editorial-lead">
                    A paid FRAME membership gives you access to reserve a place for every available screening.
                </p>
            </header>

            <DisplayErrors errors={errors} />

            {isLoggedIn && !membership && errors.length === 0 && (
                <div className="membership-loading" role="status">Checking your membership...</div>
            )}

            {membership?.status === 'Active' && (
                <section className="membership-card" aria-label="Active membership">
                    <div>
                        <p className="membership-card-label">FRAME CINEMAS member</p>
                        <h2>{membership.membershipNumber}</h2>
                        <p>Active since {formatMembershipDate(membership.joinedAt)}</p>
                    </div>
                    <span className="status-badge status-active">Active</span>
                    <NavLink to="/bookings">View my reservations</NavLink>
                </section>
            )}

            {membership?.status === 'Cancelled' && (
                <section className="membership-state">
                    <p className="eyebrow">Membership inactive</p>
                    <h2>Your membership is currently cancelled.</h2>
                    <p>Email our team from the address used for your FRAME account and we can reactivate it.</p>
                    <a className="btn btn-primary" href={membershipEmailLink}>Email membership team</a>
                </section>
            )}

            {(!isLoggedIn || membership?.status === 'Non-member') && (
                <section className="membership-join">
                    <div className="membership-steps">
                        <p className="eyebrow">How to join</p>
                        <ol>
                            <li><span>01</span><div><h2>Create your account</h2><p>Use the email address you want linked to your membership.</p></div></li>
                            <li><span>02</span><div><h2>Send us an enquiry</h2><p>Email the membership team to ask about current pricing and availability.</p></div></li>
                            <li><span>03</span><div><h2>We confirm it</h2><p>After your membership is arranged, your member number appears here and reservations unlock.</p></div></li>
                        </ol>
                    </div>
                    <aside className="membership-contact">
                        <p className="eyebrow">Membership enquiries</p>
                        <h2>Ask about joining FRAME.</h2>
                        <p>{cinemaDetails.membershipEmail}</p>
                        {!isLoggedIn && <NavLink className="btn btn-outline-primary" to="/register">Create account</NavLink>}
                        <a className="btn btn-primary" href={membershipEmailLink}>Email membership team</a>
                    </aside>
                </section>
            )}

            <footer className="membership-note">
                <strong>Good to know</strong>
                <p>Membership belongs to one registered account. Each member can reserve one place per screening.</p>
            </footer>
        </article>
    );
}

function formatMembershipDate(value?: string) {
    if (!value) return 'your activation date';
    return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(value));
}
