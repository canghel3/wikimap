import React, { useState, useEffect, useRef } from "react";
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
            Search this area
        </button>
    );
};

const Map: React.FC = () => {
    const [wikiMarkers, setWikiMarkers] = useState<WikiPage[]>([]);
    const [userLocation, setUserLocation] = useState<number[]>([0, 0]);
    const [pageUrl, setPageUrl] = useState<string | null>(null);
    let [iframeVisibility, setIframeVisibility] = useState<boolean>(false);

    const popupRef = useRef<HTMLDivElement>(null);

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

    const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
            setIframeVisibility(false);
        }
    };

    useEffect(() => {
        if (iframeVisibility) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [iframeVisibility]);

    return (
        <div style={{ height: "100%", width:"100%"}}>
            {iframeVisibility && (<div
                ref={popupRef}
                style={{
                    position: "fixed",
                    top: "0%",
                    left: "0%",
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    zIndex: 1000,
                    width: "35%",
                    height: "100%",
                    overflowY: "auto",
                }}
            >
                <iframe

                    src={pageUrl!}
                    title="Wikipedia Page"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: "8px",
                    }}
                />
            </div>)}

            <MapContainer key={userLocation.toString()} center={[userLocation[0], userLocation[1]]} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {wikiMarkers.map((page) => (
                    <CircleMarker key={page.pageid}
                                  radius={5}
                                  center={[page.lat, page.lon]}
                                  eventHandlers={{
                                      click: () => {
                                          console.log("clicked", page.pageid);
                                          // fetchPageContent(page.pageid)
                                          setPageUrl(`https://en.wikipedia.org/?curid=${page.pageid}`);
                                          setIframeVisibility(true);
                                      }
                                  }}>
                        {/*<Popup>*/}
                        {/*    <a*/}
                        {/*        href={`https://en.wikipedia.org/?curid=${page.pageid}`}*/}
                        {/*        target="_blank"*/}
                        {/*        rel="noopener noreferrer"*/}
                        {/*    >*/}
                        {/*        {page.title}*/}
                        {/*    </a>*/}
                        {/*</Popup>*/}
                    </CircleMarker>
                ))}

                <FindNearbyPages setMarkers={setWikiMarkers} />
            </MapContainer>

        </div>
    );
};

export default Map;
