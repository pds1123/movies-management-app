import GeneriscList from "../../../components/GenericList";
import type Movie from "../models/movie.model";
import DisplayMovie from "./DisplayMovie";
import styles from './MovieList.module.css'

export default function MovieList(props: MovieListProps){
    
   return (
   <GeneriscList list={props.movies}

    emptyListUI={<>there are no movies to display</>}
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