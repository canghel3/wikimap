import React, {useRef} from "react";
import {CircleMarker, Popup, useMap} from "react-leaflet";
import L from "leaflet";
import type { WikiPage } from "./types";

interface CircleMarkerComponentProps {
    page: WikiPage;
    onSelect: (marker: L.CircleMarker | null, pageId: string, resetFunc: () => void) => void;
}

const CircleMarkerComponent: React.FC<CircleMarkerComponentProps> = ({ page, onSelect }) => {
    const markerRef = useRef<L.CircleMarker | null>(null);

    let isSelected = false;
    const map = useMap()

    const reset = () => {
        isSelected = false;
        markerRef.current?.closePopup();
    }

    const handleMarkerClick = () => {
        isSelected = true;

        if (markerRef.current) {
            onSelect(markerRef.current, page.pageid, reset); // notify the mediator
            markerRef.current?.openPopup();
            map.flyTo([page.lat, page.lon], map.getZoom(), { duration: 1.0 });
        }
    };

    return (
        <CircleMarker
            ref={markerRef}
            key={page.pageid}
            radius={5}
            center={[page.lat, page.lon]}
            pathOptions={{color: "blue", weight: 2}}
            eventHandlers={{
                click: handleMarkerClick,
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => {
                    if (!isSelected) {
                        e.target.closePopup();
                    }
                }
            }}
        >
            <Popup autoClose={false} closeOnClick={false} autoPan={false}>
                <div style={{ textAlign: "center" }}>
                    <strong>{page.title}</strong><br />
                    {page.views} views in the last month<br />
                </div>
            </Popup>
        </CircleMarker>
    );
};

export default CircleMarkerComponent;