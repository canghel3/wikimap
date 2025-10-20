import React, { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import type { WikiPage } from './types';
import config from '../config';

interface FindNearbyPagesProps {
    setMarkers: (pages: WikiPage[]) => void;
    zoomBegin: number;
}

//TODO: search when moving to new location
const FindNearbyPages: React.FC<FindNearbyPagesProps> = ({ setMarkers, zoomBegin = 15 }) => {
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [buttonText, setButtonText] = useState<string>('Zoom in to search');

    const updateButtonState = () => {
        // if a search is already in progress, do nothing.
        if (isSearching) return;

        if (map.getZoom() >= zoomBegin) {
            setButtonText('Search this area');
            setIsDisabled(false);
        } else {
            setButtonText('Zoom in to search');
            setIsDisabled(true);
        }
    };

    const map = useMapEvents({
        zoomend: () => updateButtonState(),
        load: () => updateButtonState()
    });

    //just some syntax that i found interesting: (pages: Omit<WikiPage, 'views'>[]): Promise<WikiPage[]>
    const getPageViews = async (pages: WikiPage[]): Promise<WikiPage[]> => {
        if (pages.length === 0) return [];
        try {
            const ids = pages.map(page => page.pageid).join(',');
            const url = `${config.apiUrl}/api/v1/pages/views?ids=${ids}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const data = await response.json();

            return pages.map(page => ({ ...page, views: data[page.pageid] || 0 }));
        } catch (error) {
            console.error("Failed to get wiki page views:", error);
            return pages.map(p => ({ ...p, views: 0 }));
        }
    };

    const getPageThumbnails = async (pages: WikiPage[]): Promise<WikiPage[]> => {
        if (pages.length === 0) return [];
        try {
            const ids = pages.map(page => page.pageid).join(',');
            const url = `${config.apiUrl}/api/v1/pages/thumbnails?ids=${ids}&width=200`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`Error: ${response.status}`);

            // data is of type: { [pageId: string]: { source: string, width: number, height: number } }
            const data = await response.json();

            // Safely map the thumbnails to the pages
            return pages.map(page => {
                // 1. Get the thumbnail object for the current page's ID.
                const thumbnailData = data[page.pageid];

                // 2. Add the thumbnail property to the page object.
                //    If thumbnailData exists, use its 'source'. Otherwise, the property will be undefined.
                return {
                    ...page,
                    thumbnail: thumbnailData ? thumbnailData.source : undefined
                };
            });
        } catch (error) {
            console.error("Failed to get wiki page thumbnails:", error);
            // If the entire request fails, return the original pages without thumbnails.
            return pages;
        }
    };

    const fetchWikipediaPages = async () => {
        setIsSearching(true);
        setIsDisabled(true);
        setButtonText("Seaching...");

        try {
            const bounds = map.getBounds();
            const bbox = `${bounds.getNorthEast().lat}|${bounds.getSouthWest().lng}|${bounds.getSouthWest().lat}|${bounds.getNorthEast().lng}`;
            const url = `${config.apiUrl}/api/v1/pages?bbox=${bbox}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.status}`);

            const data = await response.json();

            const pages: WikiPage[] = data.map((p: any) => ({ pageid: p.pageid, title: p.title, lat: p.lat, lon: p.lon }));

            const pagesWithViews = await getPageViews(pages);

            const pagesWithViewAndThumbnails = await getPageThumbnails(pagesWithViews);

            //TODO: use the fking builder pattern already
            setMarkers(pagesWithViewAndThumbnails);
        } catch (error) {
            console.error("Failed to fetch Wikipedia pages:", error);
            setIsSearching(false);
            setIsDisabled(false);
        } finally {
            setIsSearching(false);
            setIsDisabled(false);
            updateButtonState();
        }
    };

    return (
        <button className={`search-button ${isDisabled ? 'unavailable' : 'available'}`} onClick={fetchWikipediaPages} disabled={isDisabled}>
            {buttonText}
        </button>
    );
};

export default FindNearbyPages;