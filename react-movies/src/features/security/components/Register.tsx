import AuthenticationForm from "./AuthenticationForm";

export default function Register(){
    return (
        <section className="auth-page">
            <div className="auth-intro">
                <p>FRAME CINEMAS</p>
                <h1>Create an account.</h1>
            </div>
            <AuthenticationForm url="/users/register" />
        </section>
    )
}
