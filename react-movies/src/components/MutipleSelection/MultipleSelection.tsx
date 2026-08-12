import type MultipleSelectionDTO from "./MutipleSelectionDTO.model";
import styles from './MutipleSelection.module.css'

export default function MultipleSelection(props: MultipleSelectionProps){

    function select(item: MultipleSelectionDTO){
        const selected = [...props.selected,item];
        const nonSelected = props.nonSelected.filter(value => value !== item);
        props.onChange(selected, nonSelected);
    }

    function deselect(item: MultipleSelectionDTO){
        const nonSelected = [...props.nonSelected, item];
        const selected = props.selected.filter(value => value !== item);
        props.onChange(selected, nonSelected);
    }

    function selectAll(){
        const selected = [...props.selected, ...props.nonSelected];
        const nonSelected: MultipleSelectionDTO[] = [];
        props.onChange(selected, nonSelected);
    }

    function deselectAll(){
        const nonSelected = [...props.nonSelected, ...props.selected];
        const selected: MultipleSelectionDTO[] = [];
        props.onChange(selected, nonSelected);
    }


    return (
        <div className={styles.multipleSelectors}>
            <div className={styles.group}>
            <span>Available</span>
            <ul className={styles.list}>
                {props.nonSelected.map(item => <li key={item.key}>
                    <button type="button" onClick={() => select(item)}>{item.description}</button></li>)}
            </ul>
            </div>

            <div className={styles.buttons}>
                <button onClick={selectAll} type="button" aria-label="Select all"><span aria-hidden="true">→</span></button>
                <button onClick={deselectAll} type="button" aria-label="Deselect all"><span aria-hidden="true">←</span></button>
            </div>

            <div className={styles.group}>
            <span>Selected</span>
            <ul className={styles.list}>
                {props.selected.map(item => <li key={item.key}><button type="button" onClick={() => deselect(item) }>{item.description}</button></li>)}
            </ul>
            </div>
        </div>
    )

}

interface MultipleSelectionProps {
    selected: MultipleSelectionDTO[];
    nonSelected: MultipleSelectionDTO[];
    onChange(selected: MultipleSelectionDTO[],nonSelected: MultipleSelectionDTO[]): void;
}
