import React, {useRef} from "react";
import {Marker, Popup, useMap} from "react-leaflet";
import L from "leaflet";
import type { WikiPage } from "./types";

import defaultMarkerIcon from '../assets/default-marker.png';
import selectedMarkerIcon from '../assets/selected-marker.png';

interface MarkerComponentProps {
    page: WikiPage;
    onSelect: (marker: L.Marker | null, pageId: string, resetFunc: () => void) => void;
}

const MarkerComponent: React.FC<MarkerComponentProps> = ({ page, onSelect }) => {
    const markerRef = useRef<L.Marker | null>(null);

    let isSelected = false;
    const map = useMap()

    const reset = () => {
        isSelected = false;
        markerRef.current?.setIcon(defaultIcon);
        markerRef.current?.closePopup();
    }

    const handleMarkerClick = () => {
        isSelected = true;

        if (markerRef.current) {
            onSelect(markerRef.current, page.pageid, reset); // notify the mediator
            markerRef.current?.openPopup();
            markerRef.current?.setIcon(selectedIcon);
            map.flyTo([page.lat, page.lon], map.getZoom(), { duration: 1.0 });
        }
    };

    const defaultIcon = L.icon({
        iconUrl: defaultMarkerIcon,
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });

    const selectedIcon = L.icon({
        iconUrl: selectedMarkerIcon,
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });

    return (
        <Marker
            ref={markerRef}
            key={page.pageid}
            position={[page.lat, page.lon]}
            icon={defaultIcon}
            eventHandlers={{
                click: handleMarkerClick,
                mouseover: (e: L.LeafletMouseEvent) => e.target.openPopup(),
                mouseout: (e: L.LeafletMouseEvent) => {
                    if (!isSelected) {
                        e.target.closePopup();
                    }
                }
            }}
        >
            <Popup autoClose={false} closeOnClick={false} autoPan={false}>
                <div style={{ textAlign: "center" }}>
                    <strong>{page.title}</strong><br />
                    {page.views} views last month<br />
                </div>
            </Popup>
        </Marker>
    );
};

export default MarkerComponent;