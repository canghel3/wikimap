import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {MapContainer, TileLayer} from 'react-leaflet';
import L from "leaflet";
import { divIcon, point } from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles';
import './styles/wikipage-frame.css';
import './styles/search-button.css';

import type { WikiPage } from "./components/types";
import CircleMarkerComponent from "./components/marker";
import IframePopup from "./components/iframe";
import FindNearbyPages from "./components/search";

const defaultZoom = 3;

const Main: React.FC = () => {
    return (
        <div style={{ height: "100%", width: "100%" }}>
            <MapComponent />
        </div>
    );
};

const MapComponent: React.FC = () => {
    const [wikiMarkers, setWikiMarkers] = useState<WikiPage[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number]>([0, 0]);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    let selectedMarkerRef = useRef<L.CircleMarker | null>(null);
    let resetFuncRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
            (err) => console.log("Error acquiring geolocation.", err)
        );
    }, []);

    // when the userLocation is obtained, adjust the map view without remounting the map
    useEffect(() => {
        if (mapRef.current && (userLocation[0] !== 0 || userLocation[1] !== 0)) {
            mapRef.current.setView(userLocation, defaultZoom);
        }
    }, [userLocation]);

    const selectedPage = useMemo(() =>
            wikiMarkers.find(p => p.pageid === selectedPageId),
        [selectedPageId, wikiMarkers]
    );

    const handleMarkerSelect = (marker: L.CircleMarker | null, pageId: string | null, resetFunc: (() => void) | null) => {
        selectedMarkerRef.current?.setStyle({
            color: "blue",
            weight: 2
        })

        if(resetFuncRef.current) {
            resetFuncRef.current();
        }

        marker?.setStyle({
            color: "red",
            weight: 3
        })

        resetFuncRef.current = resetFunc;

        selectedMarkerRef.current = marker;
        setSelectedPageId(pageId);
    }

    const markers = useMemo(() => {
        return wikiMarkers.map((page) => (
                <CircleMarkerComponent
                    key={page.pageid}
                    page={page}
                    onSelect={handleMarkerSelect}
                />
            ))
    }, [wikiMarkers])

    // const createClusterCustomIcon = function (cluster : typeof MarkerClusterGroup) {
    //     return new divIcon({
    //         html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    //         className: "custom-marker-cluster",
    //         iconSize: point(33, 33, true)
    //     });
    // };

    return (
        <>
            <MapContainer ref={mapRef} center={[0, 0]} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MarkerClusterGroup /*iconCreateFunction={createClusterCustomIcon}*/>
                    {markers}
                </MarkerClusterGroup>
                <FindNearbyPages setMarkers={setWikiMarkers} zoomBegin={15} />
            </MapContainer>
            <IframePopup selectedPage={selectedPage} onClose={() => handleMarkerSelect(null, null, null)} />
        </>
    );
};

export default Main;