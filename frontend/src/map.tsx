import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";

// Define a type for Wikipedia pages
type WikiPage = {
    pageid: number;
    title: string;
    lat: number;
    lon: number;
};

const FindNearbyPages: React.FC<{ setMarkers: (pages: WikiPage[]) => void }> = ({ setMarkers }) => {
    const map = useMap(); // access the current map instance

    const fetchWikipediaPages = async () => {
        const center = map.getCenter();
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${center.lat}|${center.lng}&gsradius=10000&gslimit=100&format=json&origin=*`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            const pages: WikiPage[] = data.query.geosearch.map((page: any) => ({
                pageid: page.pageid,
                title: page.title,
                lat: page.lat,
                lon: page.lon,
            }));

            setMarkers(pages); // update markers on the map
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
        }
    };

    return (
        <button
            onClick={fetchWikipediaPages}
            style={{
                position: "absolute",
                top: "5%",
                left: "50%",
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "black",
                border: "1px solid black",
                borderRadius: "5px",
                zIndex: 1000,
                cursor: "pointer",
            }}
        >
            Search Wikipedia Pages
        </button>
    );
};

const Map: React.FC = () => {
    const [wikiMarkers, setWikiMarkers] = useState<WikiPage[]>([]);
    const [userLocation, setUserLocation] = useState<number[]>([0, 0]);


    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                setUserLocation([position.coords.latitude, position.coords.longitude])
                console.log(position.coords);
            })
        } else {
            console.log("Geolocation is not supported")
        }
    }, [])

    return (
        <div style={{ height: "100%", width:"100%"}}>
            <MapContainer key={userLocation.toString()} center={[userLocation[0], userLocation[1]]} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {wikiMarkers.map((page) => (
                    <CircleMarker key={page.pageid} radius={5} center={[page.lat, page.lon]}>
                        <Popup>
                            <a
                                href={`https://en.wikipedia.org/?curid=${page.pageid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {page.title}
                            </a>
                        </Popup>
                    </CircleMarker>
                ))}

                <FindNearbyPages setMarkers={setWikiMarkers} />
            </MapContainer>

        </div>
    );
};

export default Map;
