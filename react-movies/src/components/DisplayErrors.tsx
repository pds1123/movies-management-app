export default function DisplayErrors(props: DisplayErrorsProps){
    if (props.errors.length === 0) return null;

    return (
            <div className="error-summary" role="alert">
                <strong>Check the following:</strong>
                <ul>
                {props.errors.map(err => <li key={err}>{err}</li>)}
                </ul>
            </div>
    )
}

interface DisplayErrorsProps{
    errors: string[];
}
