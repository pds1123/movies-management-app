import { useNavigate, useParams } from "react-router";
import type TheaterCreation from "../models/TheaterCreation.model";
import { useState, useEffect } from "react";
import TheaterForm from "./TheaterForm";
import type { SubmitHandler } from "react-hook-form";
import Loading from "../../../components/Loading";
import apiClient from "../../../api/apiClient";
import type { AxiosError } from "axios";
import extractError from "../../../utils/extractErrors";

export default function EditTheater(){
    
     const {id} = useParams();
     const [model,setModel] = useState<TheaterCreation | undefined>(undefined);
     const navigate = useNavigate()
     const [errors, setErrors] = useState<string[]>([]);
 
     useEffect(() => {
         apiClient.get(`/theaters/${id}`).then(res => setModel(res.data));
     },[id])

    const onSubmit: SubmitHandler<TheaterCreation> =async(data) => {
        try{
            await apiClient.put(`/theaters/${id}`,data);
            navigate('/theaters');
        } catch(err){
            const errors = extractError(err as AxiosError);
            setErrors(errors);
        }
        }
    

    return (
        <>
            <h3>Edit Theater</h3>
            {model ? <TheaterForm errors={errors} onSubmit={onSubmit} model={model} /> : <Loading />}
            
        </>
    )
}
