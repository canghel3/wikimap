import React, { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import type { WikiPage } from './types';

interface FindNearbyPagesProps {
    setMarkers: (pages: WikiPage[]) => void;
    zoomBegin: number;
}

const FindNearbyPages: React.FC<FindNearbyPagesProps> = ({ setMarkers, zoomBegin = 15 }) => {
    const [disabled, setDisabled] = useState<boolean>(true);

    const map = useMapEvents({
        zoomend: () => {
            const button = document.querySelector<HTMLButtonElement>('.search-button');
            if (!button) return;
            if (map.getZoom() >= zoomBegin) {
                button.classList.add("available");
                button.classList.remove("unavailable");
                button.textContent = "Search this area";
                setDisabled(false);
            } else {
                button.classList.remove("available");
                button.classList.add("unavailable");
                button.textContent = "Zoom in to search";
                setDisabled(true);
            }
        },
        load: () => map.fire('zoomend'),
    });

    const getPageViews = async (pages: Omit<WikiPage, 'views'>[]): Promise<WikiPage[]> => {
        if (pages.length === 0) return [];
        try {
            const ids = pages.map(page => page.pageid).join(',');
            const url = `http://localhost:9876/api/v1/pages/views?ids=${ids}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const data = await response.json();
            return pages.map(page => ({ ...page, views: data[page.pageid] || 0 }));
        } catch (error) {
            console.error("Failed to get wiki page views:", error);
            return pages.map(p => ({ ...p, views: 0 }));
        }
    };

    const fetchWikipediaPages = async () => {
        const button = document.querySelector<HTMLButtonElement>('.search-button');
        try {
            if (button) {
                button.textContent = "Searching...";
                setDisabled(true);
            }
            const bounds = map.getBounds();
            const bbox = `${bounds.getNorthEast().lat}|${bounds.getSouthWest().lng}|${bounds.getSouthWest().lat}|${bounds.getNorthEast().lng}`;
            const url = `http://localhost:9876/api/v1/pages?bbox=${bbox}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const data = await response.json();
            const pages: Omit<WikiPage, 'views'>[] = data.map((p: any) => ({ pageid: p.pageid, title: p.title, lat: p.lat, lon: p.lon }));
            const pagesWithViews = await getPageViews(pages);
            setMarkers(pagesWithViews);
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
        } finally {
            if (button && map.getZoom() >= zoomBegin) {
                button.textContent = "Search this area";
                setDisabled(false);
            }
        }
    };

    return (
        <button className="search-button unavailable" onClick={fetchWikipediaPages} disabled={disabled}>
            Zoom in to search
        </button>
    );
};

export default FindNearbyPages;