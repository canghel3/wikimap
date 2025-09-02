import React, { useRef } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { WikiPage } from "./types"; // Import the shared type

// Props for CircleMarkerComponent
interface CircleMarkerComponentProps {
    page: WikiPage;
    isSelected: boolean;
    onSelect: (pageId: string) => void;
}

const CircleMarkerComponent: React.FC<CircleMarkerComponentProps> = ({ page, isSelected, onSelect }) => {
    const map = useMap();
    const popupRef = useRef<L.Popup | null>(null);

    const handleMarkerClick = () => {
        onSelect(page.pageid); // Notify the mediator
        map.flyTo([page.lat, page.lon], map.getZoom(), { duration: 1.0 });
        popupRef.current?.openPopup()
    };

    const color = isSelected ? "red" : "blue";

    return (
        <CircleMarker
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
            <Popup ref={popupRef} autoClose={false} closeOnClick={false} autoPan={false}>
                <div style={{ textAlign: "center" }}>
                    <strong>{page.title}</strong><br />
                    {page.views} views in the last month<br />
                </div>
            </Popup>
        </CircleMarker>
    );
};

export default CircleMarkerComponent;