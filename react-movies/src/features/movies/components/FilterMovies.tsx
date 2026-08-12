import { useForm, type SubmitHandler } from "react-hook-form"
import type FilterMoviesDTO from "../models/FilterMoviesDTO.model"
import Button from "../../../components/Button";
import MoviesList from "./MoviesList";
import Pagination from "../../../components/Pagination";
import { useFilterMovies } from "../hooks/useFilterMovies";

export default function FilterMovies() {

    const initialValues: FilterMoviesDTO = {
        title: '',
        genreId: 0,
        inTheaters: false,
        upcomingReleases: false
    }

    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<FilterMoviesDTO>({
        defaultValues: initialValues
    })

    const onSubmit: SubmitHandler<FilterMoviesDTO> = async (data) => {
        await useFilterMoviesHook.loadRecords(data);
    }

    const useFilterMoviesHook = useFilterMovies(initialValues, setValue);


    return (
        <div className="browse-page">
            <header className="page-heading">
                <h1>Filter Movies</h1>
            </header>
            <form className="filter-panel"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="filter-field filter-search">
                    <label htmlFor="movie-title">Film title</label>
                    <input id="movie-title" placeholder="Search by title" autoComplete="off" className="form-control"
                        {...register('title')} />
                </div>
                <div className="filter-field">
                    <label htmlFor="movie-genre">Genre</label>
                    <select id="movie-genre" className="form-select" {...register('genreId')}>
                        <option value="0">All genres</option>
                        {useFilterMoviesHook.genres.map(genre => <option
                            key={genre.id} value={genre.id}>{genre.name}</option>)}
                    </select>
                </div>
                <fieldset className="filter-status">
                    <legend>Status</legend>
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="upcomingReleases"
                            {...register('upcomingReleases')} />
                        <label className="form-check-label" htmlFor="upcomingReleases">
                            Upcoming releases
                        </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="inTheaters"
                            {...register('inTheaters')} />
                        <label className="form-check-label" htmlFor="inTheaters">
                            In theaters
                        </label>
                    </div>
                </fieldset>

                <div className="filter-actions">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Filtering...' : 'Filter'}
                    </Button>
                    <Button className="btn btn-link" onClick={() => {
                        reset();
                        useFilterMoviesHook.loadRecords(initialValues);
                    }}>
                        Clear filters
                    </Button>
                </div>

            </form>

            <div className="browse-pagination">
                <Pagination currentPage={useFilterMoviesHook.page} 
                recordsPerPage={useFilterMoviesHook.recordsPerPage}
                    totalAmountOfRecords={useFilterMoviesHook.totalAmountOfRecords}
                    recordsPerPageOptions={[5, 20, 50]}
                    onPaginateChange={(page, recordsPerPage) => {
                        useFilterMoviesHook.setPage(page);
                       useFilterMoviesHook.setRecordsPerPage(recordsPerPage)
                    }}
                />
            </div>

            <div className="browse-results">
                <MoviesList movies={useFilterMoviesHook.movies} />
            </div>
        </div>
    )
}
