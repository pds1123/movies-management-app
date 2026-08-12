import * as yup from "yup"
import type CreateGenre from "../models/CreateGenre.model"
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm, type SubmitHandler } from "react-hook-form"
import { NavLink } from "react-router"
import Button from "../../../components/Button"
import firstLetterUppercase from "../../../validations/firstLetterUppercase"
import DisplayErrors from "../../../components/DisplayErrors"


export default function GenreForm(props: GenreFormProps){
    const {register, handleSubmit, formState: {errors, isValid, isSubmitting}} = useForm<CreateGenre>({
        resolver: yupResolver(validationRules),
        mode: 'onChange',
        defaultValues: props.model ?? {name: ''}
    })
    return (
        <>
            <DisplayErrors errors={props.errors} />
            <form className="admin-form admin-form-compact" onSubmit={handleSubmit(props.onSubmit)}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input  autoComplete="off" className="form-control" {...register('name')} />
                    {errors.name && <p className="error">{errors.name.message}</p>}
                </div>

                <div className="form-actions">
                    <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save genre'}</Button>
                    <NavLink className="btn btn-link" to={"/genres"}>Cancel</NavLink>
                </div>

            </form>   
        </>     
    )
}

interface GenreFormProps{
    onSubmit: SubmitHandler<CreateGenre>;
    model?: CreateGenre;
    errors: string[]
}

const validationRules = yup.object({
    name: yup.string().required('the name is required').test(firstLetterUppercase())
    //name: yup.string().required('the name is required')
})
