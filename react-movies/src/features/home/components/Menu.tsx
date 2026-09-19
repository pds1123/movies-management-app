import { NavLink } from "react-router";
import Authorized from "../../security/components/Authorized";
import { useContext } from "react";
import AuthenticationContext from "../../security/utils/AuthenticationContext";
import Button from "../../../components/Button";
import { logout } from "../../security/utils/HandleJWT";
import { useState } from "react";

export default function Menu() {

    const {claims, update} = useContext(AuthenticationContext);
    const [menuOpen, setMenuOpen] = useState(false);

    function getUserName(){
        return claims.filter(x => x.name === 'email')[0]?.value;
    }

    function closeMenu(){
        setMenuOpen(false);
    }

    return (
        <header className="site-header">
            <nav className="site-nav" aria-label="Main navigation">
                <NavLink to="/" className="brand-mark" onClick={closeMenu} aria-label="FRAME CINEMAS home">
                    <span>FRAME</span>
                    <span>CINEMAS</span>
                </NavLink>

                <button
                    className="menu-toggle"
                    type="button"
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(current => !current)}
                >
                    <span></span><span></span>
                </button>

                <div className={`site-nav-links ${menuOpen ? 'is-open' : ''}`}>
                    <ul className="nav-primary">
                        <li>
                            <NavLink to="/movies/filter" onClick={closeMenu}>
                                Filter Movies</NavLink>
                        </li>
                        <li>
                            <NavLink to="/about" onClick={closeMenu}>About</NavLink>
                        </li>
                        <li>
                            <NavLink to="/membership" onClick={closeMenu}>Membership</NavLink>
                        </li>

                        <Authorized claims={['isadmin']}
                            authorized={<>
                                <li>
                                    <NavLink to="/genres" onClick={closeMenu}>Genres</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/actors" onClick={closeMenu}>Actors</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/theaters" onClick={closeMenu}>Theaters</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/movies/create" onClick={closeMenu}>Create Movie</NavLink>
                                </li>
                                 <li>
                                    <NavLink to="/users" onClick={closeMenu}>Users</NavLink>
                                </li>
                            </>}
                        />
                    </ul>

                    <div className="nav-account">
                            <Authorized 
                                authorized={<>
                                    <NavLink to="/bookings" onClick={closeMenu}>My bookings</NavLink>
                                    <span className="account-name">Hello, {getUserName()}</span>
                                    <Button 
                                        className="nav-text-button"
                                    onClick={() => {
                                        logout();
                                        update([]);
                                        closeMenu();
                                    }}>Log out</Button>
                                </>}

                                notAuthorized={
                                    <>
                                        <NavLink to="/register" onClick={closeMenu}>Register</NavLink>
                                        <NavLink to="/login" className="nav-sign-in" onClick={closeMenu}>Login</NavLink>
                                    </>
                                }
                            />
                    </div>
                </div>
            </nav>
        </header>
    )
}
