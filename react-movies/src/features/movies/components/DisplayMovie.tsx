import { NavLink } from "react-router";
import type Movie from "../models/movie.model";
import styles from './DisplayMovie.module.css'
import Button from "../../../components/Button";
import customConfirm from "../../../utils/customConfirm";
import apiClient from "../../../api/apiClient";
import { useContext } from "react";
import AlertContext from "../../../utils/AlertContext";
import Authorized from "../../security/components/Authorized";

export default function DisplayMovie(props: DisplayMovieProps){
    
    const buildLink = () => `/movie/${props.movie.id}`
    const alert = useContext(AlertContext);

    async function deleteMovie(){
        await apiClient.delete(`/movies/${props.movie.id}`);
        alert();
    }

    const releaseDate = new Intl.DateTimeFormat('en-NZ', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(props.movie.releaseDate));
    
    return (
        <article className={styles.movie}>
            <NavLink to={buildLink()} className={styles.posterLink} aria-label={`View ${props.movie.title}`}>
                <img src={props.movie.poster} alt={`${props.movie.title} poster`} loading="lazy" />
            </NavLink>
            <div className={styles.details}>
                <p className={styles.date}>From {releaseDate}</p>
                <h3><NavLink to={buildLink()}>{props.movie.title}</NavLink></h3>
            </div>
            <div className={styles.adminActions}>
                <Authorized claims={['isadmin']}
                    authorized={<>
                        <NavLink to={`/movies/edit/${props.movie.id}`} className='btn btn-sm btn-outline-primary'>Edit</NavLink>
                        <Button className="btn btn-sm btn-outline-danger" onClick={() => customConfirm(() => deleteMovie())}>Delete</Button>
                    </>}
                />
            </div>
        </article>
    )

}
interface DisplayMovieProps{
    movie: Movie;
}
