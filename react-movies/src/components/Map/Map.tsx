import { MapContainer, Marker, Popup, TileLayer, useMapEvent } from "react-leaflet";
import type Coordinate from "./coordinate.model";
import { useState } from "react";

export default function Map(props: MapProps){

    const [coordiates, setCoordinates] = useState(props.coordinates);

    function handleCoordinate(coordiate: Coordinate) {
        setCoordinates([coordiate]);
        props.setCoordinate?.(coordiate);
    }
    
    return (
        <MapContainer center={[-36.85,174.76]}
        zoom={14} scrollWheelZoom={true} className="frame-map">
            <TileLayer attribution="FRAME CINEMAS · OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {props.allowClicks ? <HandleMapClick setCoordinate={handleCoordinate} /> : undefined}

            {coordiates?.map(coordiate => <Marker key={coordiate.lat + coordiate.lng}
                position={[coordiate.lat,coordiate.lng]}>
                    {coordiate.message ? <Popup>{coordiate.message}</Popup> : undefined}
                </Marker>)}

        </MapContainer>
    )
}

interface MapProps {
    coordinates? :Coordinate[];
    setCoordinate?:(coordinate:Coordinate) => void;
    allowClicks: boolean;
}

function HandleMapClick(props: {setCoordinate(coordiate: Coordinate): void}){
    useMapEvent('click', e=>{
        props.setCoordinate({lat:e.latlng.lat, lng:e.latlng.lng})
    })
    return null;
}
