import type React from "react";
import Loading from "./Loading"

export default function GeneriscList<T>(props: GeneriscList<T>){

    if(!props.list){
        return props.loadingUI ? props.loadingUI : <Loading />
    } else if (props.list.length === 0){
        return props.loadingUI ? props.emptyListUI : 'there are no elements to display'
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