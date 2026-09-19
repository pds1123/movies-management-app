import { NavLink } from 'react-router';
import { cinemaDetails } from '../../../config/cinemaDetails';
import cinemaInterior from '../../../assets/auth-cinema-background.jpg';

export default function AboutPage() {
    return (
        <article className="about-page">
            <header className="about-masthead">
                <figure className="about-image">
                    <img
                        src={cinemaInterior}
                        alt="The softly lit hallway leading into a FRAME CINEMAS screening room"
                    />
                    <figcaption>Lantern Lane, Auckland</figcaption>
                </figure>
                <div className="about-opening">
                    <p className="about-kicker">Independent cinema in Auckland</p>
                    <h1>Films to discover.<br />Room to linger.</h1>
                    <p className="about-deck">
                        FRAME brings independent releases, restored classics and documentaries
                        into one carefully changing programme.
                    </p>
                    <NavLink className="about-link" to="/movies/filter">
                        Browse the programme <span aria-hidden="true">→</span>
                    </NavLink>
                </div>
            </header>

            <section className="about-manifesto">
                <h2>We programme for curiosity, not volume.</h2>
                <div className="about-copy">
                    <p>
                        Our schedule stays deliberately focused. A new independent film might sit beside
                        a restored classic, a documentary or a filmmaker season. Each title has time to
                        find its audience.
                    </p>
                    <p>
                        The cinema is made for unhurried evenings: meet before the screening, settle in,
                        and stay for the conversation after the credits.
                    </p>
                </div>
            </section>

            <section className="about-visit" aria-labelledby="visit-title">
                <div className="about-visit-intro">
                    <p>Visit FRAME</p>
                    <h2 id="visit-title">Before the lights go down.</h2>
                    <p>Come early. The doors open half an hour before the first film.</p>
                </div>
                <dl className="about-details">
                    <div><dt>Address</dt><dd>{cinemaDetails.address}</dd></div>
                    <div><dt>Hours</dt><dd>Tuesday to Sunday, from 5pm</dd></div>
                    <div><dt>Contact</dt><dd><a href={`mailto:${cinemaDetails.generalEmail}`}>{cinemaDetails.generalEmail}</a></dd></div>
                    <div><dt>Access</dt><dd>Step-free entrance and accessible seating. Email us before your visit if you would like assistance.</dd></div>
                </dl>
            </section>

            <footer className="about-next">
                <h2>Membership opens reservations.</h2>
                <div>
                    <p>Ask our team about current membership options, pricing and availability.</p>
                    <NavLink className="about-link" to="/membership">
                        Ask about membership <span aria-hidden="true">→</span>
                    </NavLink>
                </div>
            </footer>
        </article>
    );
}
