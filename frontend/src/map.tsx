import React, {useState, useEffect, useRef, useCallback, useMemo, RefObject} from "react";
import { MapContainer, TileLayer, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles'
import './styles/wikipage-frame.css'
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

            setMarkers(pages);

            const pagesWithViews = await getPageViews(pages);

            setMarkers(pagesWithViews);
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
        }
    };

    const getPageViews = async (pages: WikiPage[]) : Promise<WikiPage[]> => {
        try {
            let ids : string[] = pages.map(page => page.pageid);
            const url = `http://localhost:9876/api/v1/pages/views?ids=${ids.join(",")}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            const updatePages = pages.map(page => ({
                ...page,
                views : data[page.pageid] || 0,
            }));

            return updatePages;
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
    const pageUrl = useRef<string | null>(null);
    const iframeVisibility = useRef(false);

    const popupRef = useRef<HTMLDivElement>(null);

    const memoizedMarkers = useMemo(() => wikiMarkers, [wikiMarkers]);

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
            iframeVisibility.current = false;
            pageUrl.current = null;

            popupRef.current?.classList.remove("visible");
            popupRef.current?.classList.add("hidden");
        }
    };

    const handleMarkerClick = useCallback((page: WikiPage) => {
        console.log("clicked", page.pageid);
        const newUrl = `https://en.wikipedia.org/?curid=${page.pageid}`;

        if (popupRef.current) {
            const iframe = popupRef.current.querySelector("iframe");
            if (iframe) {
                iframe.src = newUrl;  // manually update the iframe src
            }
        }

        iframeVisibility.current = true;
        popupRef.current?.classList.remove("hidden");
        popupRef.current?.classList.add("visible");
    }, []); // empty dependency array ensures the function reference doesn't change


    useEffect(() => {
        if (iframeVisibility) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [iframeVisibility]);

    return (
        <div style={{ height: "100%", width:"100%"}}>
            {<IframePopup pageUrl={pageUrl} iFrameRef={popupRef} />}

            <MapContainer key={userLocation.toString()} center={[userLocation[0], userLocation[1]]} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MarkerClusterGroup>
                    {memoizedMarkers.map((page) => (
                        <CircleMarker key={page.pageid}
                                      radius={5}
                                      center={[page.lat, page.lon]}
                                      eventHandlers={{
                                          click: () => {
                                              handleMarkerClick(page)
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

const IframePopup: React.FC<{ pageUrl: RefObject<string | null>, iFrameRef : React.Ref<HTMLDivElement> }> = ({ pageUrl, iFrameRef}) => {
    return (
        <div ref={iFrameRef} className={`iframe hidden`}>
            <iframe src={pageUrl.current!} title="Wikipedia Page" style={{ width: "100%", height: "100%" }} />
        </div>
    );
};


export default Map;
