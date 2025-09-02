import React, {useEffect, useMemo, useRef} from "react";
import {CircleMarker, Popup, useMap, useMapEvents} from "react-leaflet";
import L from "leaflet";
import type { WikiPage } from "./types"; // Import the shared type

// Props for CircleMarkerComponent
interface CircleMarkerComponentProps {
    page: WikiPage;
    isSelected: boolean;
    onSelect: (pageId: string) => void;
}

const CircleMarkerComponent: React.FC<CircleMarkerComponentProps> = ({ page, isSelected, onSelect }) => {
    const markerRef = useRef<L.CircleMarker | null>(null);

    const map = useMap()

    const showPopup = () => {
        if (isSelected && markerRef.current) {
            markerRef.current.openPopup()
        }
    }

    const handleMarkerClick = () => {
        onSelect(page.pageid); // notify the mediator
        map.flyTo([page.lat, page.lon], map.getZoom(), { duration: 1.0 });
    };

    useEffect(() => {
        if (isSelected) {
            map.on("moveend", showPopup);
            map.on("zoomend", showPopup);

            // Cleanup function to remove listeners
            return () => {
                map.off("moveend", showPopup);
                map.off("zoomend", showPopup);
            };
        } else {
            // Also remove listeners when marker is deselected
            map.off("moveend", showPopup);
            map.off("zoomend", showPopup);
        }
    }, [isSelected, map]);

    const color = isSelected ? "red" : "blue";

    return (
        <CircleMarker
            ref={markerRef}
            key={page.pageid}
            radius={5}
            center={[page.lat, page.lon]}
            pathOptions={{ color }}
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