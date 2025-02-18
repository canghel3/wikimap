import React, {useState, useEffect, useRef, useCallback, useMemo, RefObject} from "react";
import { MapContainer, TileLayer, Tooltip, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles'
import './styles/wikipage-frame.css'
import './styles/search-button.css'
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

const Main: React.FC = () => {
    const iframeRef = useRef<HTMLDivElement>(null);

    return (
        <div style={{ height: "100%", width:"100%"}}>
            <IframePopup iframeRef={iframeRef} />
            <MapComponent iframeRef={iframeRef} />
        </div>
    );
};

const MapComponent: React.FC<{iframeRef: React.RefObject<HTMLDivElement | null>}> = ({iframeRef}) => {
    const [wikiMarkers, setWikiMarkers] = useState<WikiPage[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number]>([45.75678167138013, 21.228344930015357]);

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

    return (
        <MapContainer key={userLocation.toString()} center={userLocation} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MarkerClusterGroup>
                {memoizedMarkers.map((page) => (
                   <CircleMarkerComponent page={page} iframeRef={iframeRef}/>
                ))}
            </MarkerClusterGroup>

            <FindNearbyPages setMarkers={setWikiMarkers} zoomBegin={15}/>
        </MapContainer>
    )
}

const CircleMarkerComponent: React.FC<{page: WikiPage, iframeRef: React.RefObject<HTMLDivElement | null>}> = ({page, iframeRef}) => {
    const map = useMap();

    return (
        <CircleMarker key={page.pageid}
                      radius={5}
                      center={[page.lat, page.lon]}
                      eventHandlers={{
                          click: () => {
                              console.log("clicked");
                              const url = `https://en.wikipedia.org/?curid=${page.pageid}`;

                              if (iframeRef.current) {
                                  const iframe = iframeRef.current.querySelector("iframe");
                                  if (iframe) {
                                      iframe.src = url;  // manually update the iframe src
                                  }
                              }

                              iframeRef.current?.classList.remove("hidden");
                              iframeRef.current?.classList.add("visible");

                              console.log("map", map)
                              map.flyTo([page.lat, page.lon], map.getZoom(), {duration: 1.5})
                          }
                      }}>
            {
                page.views && (
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                        {page.views}
                    </Tooltip>
                )}
        </CircleMarker>
    )
}

const IframePopup: React.FC<{iframeRef : React.RefObject<HTMLDivElement | null> }> = ({iframeRef}) => {
    const handleClickOutside = (event: MouseEvent) => {
        if (iframeRef.current && iframeRef.current.contains(event.target as Node)) {
            return;
        }

        const leafletInteractive = document.querySelectorAll(".leaflet-interactive");
        for (const marker of leafletInteractive) {
            if (marker.contains(event.target as Node)) {
                return;
            }
        }

        iframeRef.current?.classList.remove("visible");
        iframeRef.current?.classList.add("hidden");

        const iframe = iframeRef.current?.querySelector("iframe");
        if (iframe) {
            iframe.src = "";
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
    })


    return (
        <div ref={iframeRef} className={`iframe hidden`}>
            <iframe src={""} title="Wikipedia Page" style={{ width: "100%", height: "100%" }} />
        </div>
    );
};

const FindNearbyPages: React.FC<{ setMarkers: (pages: WikiPage[]) => void , zoomBegin : number}> = ({ setMarkers, zoomBegin = 15 }) => {
    const [disabled, setDisabled] = useState<boolean>(true);

    const map = useMapEvents({
        zoomend: () => {
            if (map.getZoom() >= zoomBegin) {
                const button = document.querySelector(`.search-button.unavailable`);
                if (button) {
                    button.classList.remove("unavailable");
                    button.classList.add("available");
                    button.textContent = "Search area"
                    setDisabled(false);
                }

                return;
            }

            const button = document.querySelector(`.search-button.available`);
            if (button) {
                button.classList.remove("available");
                button.classList.add("unavailable");
                button.textContent = "Zoom in to search"
                setDisabled(true);
            }
        }
    });

    const fetchWikipediaPages = async () => {
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
            className={`search-button unavailable`}
            onClick={fetchWikipediaPages}
            disabled={disabled}
        >
            Zoom in to search
        </button>
    );
};


export default Main;
