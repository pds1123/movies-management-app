export default function Pagination(props: PaginationProps){

    const pages = [];
    const maxAmountOfPagesToDisplay = 5;
    const amoutOfPages = Math.ceil(props.totalAmountOfRecords / props.recordsPerPage);
    const radius = Math.floor(maxAmountOfPagesToDisplay / 2);

    for (let i = 1; i <= amoutOfPages; i++){
        if (i >= props.currentPage - radius && i<=props.currentPage + radius){
            pages.push(i);
        }
    }

    if (amoutOfPages === 0) return null;

    return (
        <>
            <div className="pagination-bar">
                    <div className="pagination-size">
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0" htmlFor="films-per-page">Films per page</label>
                            <select
                            id="films-per-page"
                            value={props.recordsPerPage}
                            onChange={e=> props.onPaginateChange(1, parseInt(e.target.value,10))}
                            className="form-select form-select-sm w-auto">
                                {props.recordsPerPageOptions.map(option => <option key={option}>{option}</option>)}
                            </select>
                        </div>
                    </div>
                    <nav aria-label="Pagination">
                        <ul className="pagination justify-content-center mb-0">
                            <li className= {`page-item ${props.currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link"
                                disabled={props.currentPage === 1}
                                onClick={() => props.onPaginateChange(props.currentPage - 1, props.recordsPerPage)}
                                >
                                    <span aria-hidden="true">←</span> Previous
                                </button>
                            </li >
                            {pages.map(page => (
                                <li key={page} className= {`page-item ${props.currentPage ===page ? 'active' : ''}`}>
                                <button className="page-link"
                                aria-current={props.currentPage === page ? 'page' : undefined}
                                onClick={() => props.onPaginateChange(page, props.recordsPerPage)}>
                                    {page}
                                </button>
                                </li>))}
                            <li className= {`page-item ${props.currentPage === amoutOfPages ? 'disabled' : ''}`}>
                                <button className="page-link" 
                                disabled={props.currentPage === amoutOfPages}
                                onClick={() => props.onPaginateChange(props.currentPage + 1, props.recordsPerPage)}
                                >
                                    Next <span aria-hidden="true">→</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
            </div>
        </>
    )
}

interface PaginationProps{
    currentPage: number;
    totalAmountOfRecords: number;
    recordsPerPage: number;
    recordsPerPageOptions: number[];
    onPaginateChange:(page: number,recordsPerPage: number) => void;
}
