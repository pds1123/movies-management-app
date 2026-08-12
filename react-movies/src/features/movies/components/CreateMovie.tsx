import type { SubmitHandler } from "react-hook-form"
import type MovieCreation from "../models/MovieCreation.model"
import MovieForm from "./MovieForm";
import type Genre from "../../genres/models/Genre.model";
import type Theater from "../../theaters/models/Theater.model";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";
import type MoviesPostGet from "../models/MoviesPostGet.model";
import type { AxiosError } from "axios";
import extractErrors from "../../../utils/extractErrors";
import type Movie from "../models/movie.model";
import convertMovieToFormData from "../utlis/convertMovieToFormData";


export default function CreateMovie(){

    const [nonSelectedGenres, setNonSelectedGenres] = useState<Genre[]>([]);
    const [nonSelectedTheaters, setNonSelectedTheaters] = useState<Theater[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        apiClient.get<MoviesPostGet>('/movies/postget').then(res => {
            setNonSelectedGenres(res.data.genres);
            setNonSelectedTheaters(res.data.theaters);
            setLoading(false);
        })
    }, [])
    
    
    const onSubmit: SubmitHandler<MovieCreation> = async (data) =>{
       try {
            const formData = convertMovieToFormData(data);
            const response = await apiClient.postForm<Movie>('/movies', formData);
            const movie = response.data;
            navigate(`/movie/${movie.id}`);
       }
       catch(err){
            const errors = extractErrors(err as AxiosError);
            setErrors(errors);
       }
    }

    /*
    const nonSelectedGenres: Genre[] = [{id: 1, name: 'Action'}, {id:2, name: 'Drama'}]

    const nonSelectedTheaters: Theater[] = [{id: 1, name: 'Sambil', latitude: 0, longitude: 0},
        {id: 2, name: 'Agora', latitude: 0, longitude: 0}]
     */
    
    return (
        <>
            <h3>Create Movie</h3>
            {loading ? <Loading /> : <MovieForm onSubmit={onSubmit} nonSelectedGenres={nonSelectedGenres}
            selectedGenres={[]}
            nonSelectedTheaters={nonSelectedTheaters}
            selectedTheaters={[]}
            selectedActors={[]}
            errors={errors}
            />}
        </>
    )
}
