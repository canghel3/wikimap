import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles'
import {LatLng} from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Define a type for Wikipedia pages
interface WikiPage {
    views: number;
    pageid: string;
    title: string;
    lat: number;
    lon: number;
}

interface PageViewsResponse {
    [pageId: string]: number | null;
    // query: {
    //     pages: {
    //         [pageId: string]: {
    //             pageviews?: { [date: string]: number | null };
    //         };
    //     };
    // };
}

const FindNearbyPages: React.FC<{ setMarkers: (pages: WikiPage[]) => void , zoomBegin : number}> = ({ setMarkers, zoomBegin = 15 }) => {
    const map = useMap(); // access the current map instance

    const fetchWikipediaPages = async () => {
        const zoom = map.getZoom();
        if (zoom < zoomBegin) {
            alert("zoom in to search pages.")
            return;
        }

        try {
            const bounds = map.getBounds()
            const bbox = [
                bounds.getNorthEast().lat, // maxLat (North)
                bounds.getSouthWest().lng, // minLon (West)
                bounds.getSouthWest().lat, // minLat (South)
                bounds.getNorthEast().lng  // maxLon (East)
            ].join('|');

            const url = `http://localhost:9876/api/v1/pages?bbox=${bbox}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            const pages: WikiPage[] = data.map((page: any) => ({
                pageid: page.pageid,
                title: page.title,
                lat: page.lat,
                lon: page.lon,
            }));

            console.log("pages without views\n", pages);

            setMarkers(pages);

            const pagesWithViews = await getPageViews(pages);

            console.log("pages with views\n", pagesWithViews);

            setMarkers(pagesWithViews);
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
        }
    };

    const getPageViews = async (pages: WikiPage[]) : Promise<WikiPage[]> => {
        try {

            console.log("before", pages)
            let ids : string[] = [];
            pages.forEach((value, index, array) => {
                console.log(value, index);
                ids.push(value.pageid);
            });

            console.log("views 1", pages);
            console.log("views 2", ids.join(","));
            const url = `http://localhost:9876/api/v1/pages/views?ids=${ids.join(",")}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            Object.keys(data).forEach(key => {
                let index = pages.findIndex(page => page.pageid.toString() === key)
                if (index > -1 && index < pages.length) {
                    let page = pages[index];
                    page.views = data[key];
                    pages[index] = page;
                }
            });

            return pages;
        } catch (error) {
            console.error("failed to get wiki page views:", error);
            return pages;
        }
    }

    return (
        <button
            onClick={fetchWikipediaPages}
            style={{
                position: "absolute",
                top: "5%",
                left: "50%",
                padding: "10px 20px",
                backgroundColor: "white",
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

                <MarkerClusterGroup>
                    {wikiMarkers.map((page) => (
                        <CircleMarker key={page.pageid}
                                      radius={5}
                                      center={[page.lat, page.lon]}
                                      eventHandlers={{
                                          click: () => {
                                              console.log("clicked", page.pageid);
                                              setPageUrl(`https://en.wikipedia.org/?curid=${page.pageid}`);
                                              setIframeVisibility(true);
                                          }
                                      }}>
                            {
                                page.views && (
                                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                                        {page.views}
                                    </Tooltip>
                            )}
                        </CircleMarker>
                    ))}
                </MarkerClusterGroup>

                <FindNearbyPages setMarkers={setWikiMarkers} zoomBegin={15}/>
            </MapContainer>

        </div>
    );
};

export default Map;
