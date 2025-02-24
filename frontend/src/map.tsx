import React, {useState, useEffect, useRef, useCallback, useMemo, RefObject, use} from "react";
import { MapContainer, TileLayer, Tooltip, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import 'react-leaflet-markercluster/styles'
import './styles/wikipage-frame.css'
import './styles/search-button.css'
import L, {LatLng} from "leaflet";
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
    return (
        <div style={{ height: "100%", width:"100%"}}>
            <MapComponent />
        </div>
    );
};

const MapComponent: React.FC = () => {
    const [wikiMarkers, setWikiMarkers] = useState<WikiPage[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number]>([45.75678167138013, 21.228344930015357]);

    const iframeRef = useRef<HTMLDivElement>(null);
    const lastMarkerRef = useRef<L.CircleMarker | null>(null);

    const markerRefs = useRef<React.RefObject<L.CircleMarker | null>[]>([]); // ✅ Array of refs

    const memoizedMarkers = useMemo(() => wikiMarkers, [wikiMarkers]);
    const mapRef = useRef<L.Map | null>(null);

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
        <>
            <MapContainer ref={mapRef} key={userLocation.toString()} center={userLocation} zoom={16}
                          style={{height: "100%", width: "100%"}}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>

                <MarkerClusterGroup>
                    {wikiMarkers.map((page) => (
                        <CircleMarkerComponent
                            key={page.pageid}
                            page={page}
                            iframeRef={iframeRef}
                            lastMarkerRef={lastMarkerRef}
                        />
                    ))}
                </MarkerClusterGroup>

                <FindNearbyPages setMarkers={setWikiMarkers} zoomBegin={15}/>
                <IframePopup iframeRef={iframeRef} lastMarkerRef={lastMarkerRef} />
            </MapContainer>
        </>
    )
}

const CircleMarkerComponent: React.FC<{
    page: WikiPage;
    iframeRef: React.RefObject<HTMLDivElement | null>;
    lastMarkerRef: React.RefObject<L.CircleMarker | null>;
    defaultColor?: string;
}> = ({ page, iframeRef, lastMarkerRef, defaultColor }) => {
    const map = useMap();
    const markerRef = useRef<L.CircleMarker | null>(null);
    const popupRef = useRef<L.Popup | null>(null);

    const handleMarkerClick = () => {
        if (lastMarkerRef.current && markerRef) {
            if (lastMarkerRef.current === markerRef.current) {
                return;
            }
            lastMarkerRef.current.fire("add")
            lastMarkerRef.current.setStyle({ color: "blue" });
        }

        const url = `https://en.wikipedia.org/?curid=${page.pageid}`;
        iframeRef.current?.querySelector("iframe")?.setAttribute("src", url);

        lastMarkerRef.current = markerRef.current;
        markerRef.current?.setStyle({ color: "red" });

        iframeRef.current?.classList.remove("hidden");
        iframeRef.current?.classList.add("visible");

        map.flyTo([page.lat, page.lon], map.getZoom(), { duration: 1.0 });
    };

    return (
        <CircleMarker
            key={page.pageid}
            ref={markerRef}
            radius={5}
            center={[page.lat, page.lon]}
            pathOptions={{ color: defaultColor || "blue" }}
            eventHandlers={{
                click: handleMarkerClick,
                add: (e) => {
                    if (page.views >= 400) {
                        e.target.openPopup() // open popup when it's ready
                    } else {
                        e.target.closePopup()
                    }
                },
                mouseover: (e) => {
                    e.target.openPopup();
                },
                mouseout: (e) => {
                    if (markerRef?.current != lastMarkerRef?.current) {
                        if (page.views < 400) {
                            e.target.closePopup()
                        }
                    }
                }
            }}
        >
            {
                <Popup ref={popupRef} autoClose={false} closeOnClick={false} autoPan={false}>
                    <div style={{ textAlign: "center"}}>
                        <strong>{page.title}</strong><br />
                        {page.views} views in the last month<br />
                    </div>
                </Popup>
            }
        </CircleMarker>
    );
};


const IframePopup: React.FC<{iframeRef : React.RefObject<HTMLDivElement | null>, lastMarkerRef: React.RefObject<L.CircleMarker | null>}> = ({iframeRef, lastMarkerRef}) => {
    const map = useMap();

    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        lastMarkerRef.current?.fire("add")

        if (iframeRef.current?.contains(target)) return;

        let found = false;
        map.eachLayer((layer) => {
            if (found || !(layer instanceof L.CircleMarker)) return;

            const element = layer.getElement();
            if (element?.contains(target)) {
                found = true;
            } else {
                layer.setStyle({ color: "blue" });
            }
        });

        if (found) return;

        lastMarkerRef.current = null;
        iframeRef.current?.classList.replace("visible", "hidden");

        const iframe = iframeRef.current?.querySelector("iframe");
        if (iframe) iframe.src = "";
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
                    button.classList.add("available");
                    button.classList.remove("unavailable");
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
            const button = document.querySelector(`.search-button`);
            if (button) {
                button.textContent = "Searching..."
                button.classList.remove("available");
                button.classList.add("unavailable");
                setDisabled(true);
            }

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

            // setMarkers(pages);

            const pagesWithViews = await getPageViews(pages);

            setMarkers(pagesWithViews);

            if (button) {
                button.textContent = "Search area"
                button.classList.remove("unavailable");
                button.classList.add("available");
                setDisabled(false);
            }
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
