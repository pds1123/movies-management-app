import { NavLink } from "react-router";
import apiClient from "../api/apiClient";
import Loading from "./Loading";
import Pagination from "./Pagination";
import GeneriscList from "./GenericList";
import Button from "./Button";
import customConfirm from "../utils/customConfirm";

export default function IndexEntities<T>(props: IndexEntitiesProps<T>){
    async function deleteEntity(id: number){
        await apiClient.delete(`${props.url}/${id}`);
        if(props.page===1){
            props.loadRecords();
        } else {
            props.setPage(1);
        }
    }

        const buildButtons = (editUrl: string, id: number) => <>
        <NavLink to={editUrl} className="btn btn-sm btn-outline-primary me-2">
            <i className="bi bi-pencil me-1"></i> Edit
        </NavLink>
        <Button onClick={() => customConfirm(() => deleteEntity(id))} className="btn btn-sm btn-outline-danger me-2">
            <i className="bi bi-trash me-1"></i> Delete
        </Button>
    </>

        return (
            <section className="admin-page">
                <header className="admin-page-heading">
                    <div>
                        <p>FRAME administration</p>
                        <h1>{props.title}</h1>
                    </div>
                    {props.urlCreate && props.entity ?
                        <NavLink to={props.urlCreate} className="btn btn-primary"><i className="bi bi-plus-lg" aria-hidden="true"></i>{props.entity}</NavLink>
                    : undefined}
                </header>
                {props.loading ? <Loading /> : <>
                    <div className="admin-pagination">
                        <Pagination
                            totalAmountOfRecords={props.totalAmountOfRecords}
                            currentPage={props.page}
                            recordsPerPage={props.recordsPerPage}
                            onPaginateChange={(page, recordsPerPage) => {
                            props.setPage(page);
                            props.setRecordsPerPage(recordsPerPage)
                            }}
                            recordsPerPageOptions={[5,20,50]}/>
                    </div>
                    <GeneriscList list={props.entities} emptyListUI={<div className="empty-state"><span className="bi bi-inbox" aria-hidden="true"></span><p>No records found.</p></div>}>
                        <div className="table-wrap">
                            <table className="table table-hover align-middle">
                                 {props.children(props.entities!, buildButtons)}
                            </table>
                        </div>
                    </GeneriscList>
                </>}
            </section>
        )
    
}

interface IndexEntitiesProps<T> {
    title: string;
    entity?: string;
    entities?: T[];
    url: string;
    urlCreate?: string;
    page: number;
    recordsPerPage: number;
    totalAmountOfRecords: number;
    loading: boolean;
    loadRecords: () => void;
    setPage: (page: number) => void;
    setRecordsPerPage: (recordsPerPage: number) => void;
    children: (entities: T[], 
        buildButtons: (editUrl: string, id: number) => React.ReactNode
    ) => React.ReactNode
    
}
