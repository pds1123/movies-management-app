import type React from "react";
import Loading from "./Loading"

export default function GeneriscList<T>(props: GeneriscList<T>){

    if(!props.list){
        return props.loadingUI ? props.loadingUI : <Loading />
    } else if (props.list.length === 0){
        return props.emptyListUI ?? <div className="empty-state"><p>There are no items to display.</p></div>
    } else {
        return props.children;
    }

}

interface GeneriscList<T>{
    list: T[] | undefined;
    children: React.ReactNode;
    loadingUI?: React.ReactNode;
    emptyListUI?: React.ReactNode;
}
