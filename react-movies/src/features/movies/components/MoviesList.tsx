import GeneriscList from "../../../components/GenericList";
import type Movie from "../models/movie.model";
import DisplayMovie from "./DisplayMovie";
import styles from './MovieList.module.css'

export default function MovieList(props: MovieListProps){
    
   return (
   <GeneriscList list={props.movies}
    loadingUI={
        <div className={styles.loadingGrid} role="status" aria-label="Loading films">
            <span className="visually-hidden">Loading films</span>
            {[0, 1, 2, 3, 4].map(item => <span className={styles.loadingPoster} key={item} aria-hidden="true" />)}
        </div>
    }
    emptyListUI={<div className="empty-state"><span className="bi bi-film" aria-hidden="true"></span><p>No films are available yet.</p></div>}
    >
        <div className={styles.div}>
            {props.movies?.map(movie=><DisplayMovie key={movie.id} movie={movie}/>)}
        </div>
   </GeneriscList>
   )
}

interface MovieListProps{
    movies?: Movie[];
}
