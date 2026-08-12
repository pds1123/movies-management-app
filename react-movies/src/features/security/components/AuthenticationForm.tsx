import { useForm, type SubmitHandler } from "react-hook-form";
import type UserCredentials from "../models/UserCredentials.model";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import apiClient from "../../../api/apiClient";
import type AuthenticationResponse from "../models/AuthenticationResponse.model";
import { getClaims, storeToken } from "../utils/HandleJWT";
import { useContext, useState } from "react";
import AuthenticationContext from "../utils/AuthenticationContext";
import { useNavigate } from "react-router";
import extractIdentityErrors from "../utils/extractIdentityErrors";
import type { AxiosError } from "axios";
import DisplayErrors from "../../../components/DisplayErrors";
import Button from "../../../components/Button";

export default function AuthenticationForm(props: AuthenticationFormProps) {

    const {update} = useContext(AuthenticationContext);
    const navigate = useNavigate();
    const [myErrors, setErrors] = useState<string[]>([]);

    const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } =
        useForm<UserCredentials>({
            resolver: yupResolver(validationRules),
            mode: 'onChange'
        })
        
        const onSubmit: SubmitHandler<UserCredentials> = async (data) => {
            try{
                const response = await apiClient.post<AuthenticationResponse>(props.url, data);
                storeToken(response.data);
                update(getClaims());
                navigate('/');
            }
            catch(err){
                const errors = extractIdentityErrors(err as AxiosError);
                setErrors(errors);
            }
        }

    return (
        <div className="auth-form-wrap">
            <DisplayErrors errors={myErrors} />
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" className="form-control" autoComplete="email" {...register('email')} />
                    {errors.email && <p className="error">{errors.email.message}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" className="form-control" autoComplete={props.url.includes('login') ? 'current-password' : 'new-password'}
                    {...register('password')} />
                    {errors.password && <p className="error">{errors.password.message}</p>}
                </div>
                <div className="form-actions">
                    <Button type="submit" disabled={!isValid || isSubmitting}>
                        {isSubmitting ? 'Please wait...' : props.url.includes('login') ? 'Sign in' : 'Create account'}</Button>
                </div>
            </form>
        </div>
    )

}

interface AuthenticationFormProps {
    url: string;
}

const validationRules = yup.object({
    email: yup.string().required('The email is required'),
    password: yup.string().required('The password is required')
})
