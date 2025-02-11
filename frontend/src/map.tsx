import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles'
import {LatLng} from "leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Define a type for Wikipedia pages
interface WikiPage {
    views: number;
    pageid: number;
    title: string;
    lat: number;
    lon: number;
}

interface PageViewsResponse {
    query: {
        pages: {
            [pageId: string]: {
                pageviews?: { [date: string]: number | null };
            };
        };
    };
}

const FindNearbyPages: React.FC<{ setMarkers: (pages: WikiPage[]) => void , zoomBegin : number}> = ({ setMarkers, zoomBegin = 15 }) => {
    const map = useMap(); // access the current map instance

    const fetchWikipediaPages = async () => {
        try {
            const zoom = map.getZoom();
            if (zoom < zoomBegin) {
                alert("zoom in to search pages.")
                return;
            }

            const bounds = map.getBounds()
            const bbox = [
                bounds.getNorthEast().lat, // maxLat (North)
                bounds.getSouthWest().lng, // minLon (West)
                bounds.getSouthWest().lat, // minLat (South)
                bounds.getNorthEast().lng  // maxLon (East)
            ].join('|');

            const url = `http://localhost:9876/api/v1/points?bbox=${bbox}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            const pages: WikiPage[] = data.map((page: any) => ({
                pageid: page.pageid,
                title: page.title,
                lat: page.lat,
                lon: page.lon,
            }));

            setMarkers(pages);

            // await updatePageRankings(pages);
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
        }
    };

    const updatePageRankings = async (pages: WikiPage[], batchSize = 15) => {
        try {
            let newPages : WikiPage[] = [];
            for (let i = 0; i < pages.length; i += batchSize) {
                const batch = pages.slice(i, i + batchSize);
                const pageIdsQueryParam = batch.map(page => page.pageid).join("|");

                console.log("Fetching page views for IDs:", pageIdsQueryParam);

                const pageViewsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageviews&pageids=${pageIdsQueryParam}&format=json&origin=*`;
                const pageViewsResponse = await fetch(pageViewsUrl);
                if (!pageViewsResponse.ok) throw new Error(`Error: ${pageViewsResponse.status} ${pageViewsResponse.statusText}`);

                const pageViewsData: PageViewsResponse = await pageViewsResponse.json();

                const getPageViews = (data: PageViewsResponse) => {
                    if (!data?.query?.pages) return;

                    for (const pageId in data.query.pages) {
                        const pageCounts = data.query.pages[pageId];

                        let totalViews = 0;
                        let min = 0;
                        let max = 0;

                        if (pageCounts.pageviews) {
                            for (const date in pageCounts.pageviews) {
                                const views = pageCounts.pageviews[date];
                                if (typeof views === "number") {
                                    if (views < min) {
                                        min = views;
                                    }

                                    if (views > max) {
                                        max = views;
                                    }

                                    totalViews += views;
                                }
                            }
                        }

                        let element = pages.find((p) => p.pageid.toString() == pageId);
                        console.log(`setting at ${pages[i].lat} - ${pages[i].lon} views ${totalViews}` );
                        let item : WikiPage = {
                            views: totalViews,
                            pageid : element!.pageid,
                            lat: element!.lat,
                            lon: element!.lon,
                            title: element!.title
                        }

                        newPages.push(item);
                    }
                };

                getPageViews(pageViewsData)
                // break;

                console.log("Page Views Data:", pageViewsData);
            }

            setMarkers(newPages);
        } catch (error) {
            console.error("Failed to fetch page views:", error);
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
