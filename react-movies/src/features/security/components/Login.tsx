import AuthenticationForm from "./AuthenticationForm";

export default function Login(){
    return (
        <section className="auth-page">
            <div className="auth-intro">
                <p>FRAME CINEMAS</p>
                <h1>Welcome back.</h1>
            </div>
            <AuthenticationForm url="/users/login" />
        </section>
    )
}
