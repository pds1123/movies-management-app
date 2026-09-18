import { NavLink } from "react-router";
import type Movie from "../models/movie.model";
import styles from './DisplayMovie.module.css'
import Button from "../../../components/Button";
import customConfirm from "../../../utils/customConfirm";
import apiClient from "../../../api/apiClient";
import { useState } from "react";
import Authorized from "../../security/components/Authorized";
import resolveAssetUrl from "../../../utils/resolveAssetUrl";
import Swal from "sweetalert2";
import extractErrors from "../../../utils/extractErrors";
import type { AxiosError } from "axios";

export default function DisplayMovie(props: DisplayMovieProps){
    
    const buildLink = () => `/movie/${props.movie.id}`
    const [deleting, setDeleting] = useState(false);

    async function deleteMovie(){
        setDeleting(true);

        try {
            await apiClient.delete(`/movies/${props.movie.id}`);
            setDeleting(false);
            await props.onDeleted?.();
            await Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Movie deleted',
                text: `${props.movie.title} was removed.`,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true
            });
        } catch (error) {
            setDeleting(false);
            await Swal.fire({
                icon: 'error',
                title: 'Movie not deleted',
                text: extractErrors(error as AxiosError).join(' ')
            });
        }
    }

    const releaseDate = new Intl.DateTimeFormat('en-NZ', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(props.movie.releaseDate));
    
    return (
        <article className={styles.movie}>
            <NavLink to={buildLink()} className={styles.posterLink} aria-label={`View ${props.movie.title}`}>
                <img src={resolveAssetUrl(props.movie.poster)} alt={`${props.movie.title} poster`} loading="lazy" />
            </NavLink>
            <div className={styles.details}>
                <p className={styles.date}>From {releaseDate}</p>
                <h3><NavLink to={buildLink()}>{props.movie.title}</NavLink></h3>
                <span className={styles.viewCue} aria-hidden="true">
                    View film <span className="bi bi-arrow-up-right"></span>
                </span>
            </div>
            <div className={styles.adminActions}>
                <Authorized claims={['isadmin']}
                    authorized={<>
                        <NavLink to={`/movies/edit/${props.movie.id}`} className='btn btn-sm btn-outline-primary'>Edit</NavLink>
                        <Button className="btn btn-sm btn-outline-danger" disabled={deleting}
                            onClick={() => customConfirm(
                                () => void deleteMovie(),
                                `Delete ${props.movie.title}?`,
                                'Delete movie',
                                'Its screenings and reservations will also be removed.'
                            )}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </>}
                />
            </div>
        </article>
    )

}
interface DisplayMovieProps{
    movie: Movie;
    onDeleted?: () => void | Promise<void>;
}
