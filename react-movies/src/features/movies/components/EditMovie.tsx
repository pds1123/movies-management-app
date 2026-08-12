import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type MovieCreation from "../models/MovieCreation.model";
import type { SubmitHandler } from "react-hook-form";
import MovieForm from "./MovieForm";
import Loading from "../../../components/Loading";
import type MoviesPutGet from "../models/MoviesPutGet.model";
import apiClient from "../../../api/apiClient";
import formatDate from "../../../utils/formatDate";
import type { AxiosError } from "axios";
import extractErrors from "../../../utils/extractErrors";
import convertMovieToFormData from "../utlis/convertMovieToFormData";

export default function EditMovie(){
    
    const {id} = useParams();
    const [model,setModel] = useState<MovieCreation | undefined>(undefined);
    const [moviesPutGet, setMoviesPutGet] = useState<MoviesPutGet>();
    const navigate = useNavigate();
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(()=>{
        // const timerID = setTimeout(() => {
        //     setModel({title: 'spider-Man', releaseDate: '2019-07-03', trailer:'my url', poster:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/960px-Cat_November_2010-1a.jpg'})
        // },1000);

        // return ()=>clearInterval(timerID);
        apiClient.get<MoviesPutGet>(`/movies/putget/${id}`).then(res => {
            const movie = res.data.movie;
            const movieCreation: MovieCreation = {
                title: movie.title,
                releaseDate: formatDate(movie.releaseDate),
                trailer: movie.trailer,
                poster: movie.poster
            }
            setModel(movieCreation);
            setMoviesPutGet(res.data);
        })

    }, [id])


    const onSubmit: SubmitHandler<MovieCreation> = async (data) =>{
        // await new Promise(resolve => setTimeout(resolve,2000));
        // console.log(data);
        try {
            const formData = convertMovieToFormData(data);
            await apiClient.putForm(`/movies/${id}`, formData);
            navigate(`/movie/${id}`);
        }
        catch(err) {
            const errors = extractErrors(err as AxiosError);
            setErrors(errors);
        }
    }

    // const nonSelectedGenres: Genre[] = [{id:2, name: 'Drama'}]
    // const selectedGenres: Genre[] = [{id: 1, name: 'Action'}]

    // const nonSelectedTheaters: Theater[] = [{ id: 1, name: 'Sambil', latitude: 0, longitude: 0 }];
    // const selectedTheaters: Theater[] = [{ id: 2, name: 'Agora', latitude: 0, longitude: 0 }];



    return (
        
        <>
            <h3>Edit Movie</h3>
            {model && moviesPutGet ?  <MovieForm errors={errors} model={model} onSubmit={onSubmit}
                selectedGenres={moviesPutGet.selectedGenres}
                nonSelectedGenres={moviesPutGet.nonSelectedGenres}
                selectedTheaters={moviesPutGet.selectedTheaters}
                nonSelectedTheaters={moviesPutGet.nonSelectedTheaters}
                selectedActors={moviesPutGet.actors}
            
            /> : <Loading />}
        </>
    )
}
