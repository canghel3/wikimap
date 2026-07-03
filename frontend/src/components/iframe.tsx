import React, { useRef, useEffect, useState } from 'react';
import type { WikiPage } from './types';

interface IframePopupProps {
    selectedPage: WikiPage | undefined;
    onClose: () => void;
}

const IframePopup: React.FC<IframePopupProps> = ({ selectedPage, onClose }) => {
    const iframeContainerRef = useRef<HTMLDivElement | null>(null);
    const [pageContent, setPageContent] = useState<string>("");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectedPage && iframeContainerRef.current && !iframeContainerRef.current.contains(event.target as Node)) {
                const isClickOnMarker = (event.target as HTMLElement).closest('.leaflet-marker-icon, .leaflet-interactive');
                if (!isClickOnMarker) {
                    onClose();
                    // iframeContainerRef.current.className.replace('visible', 'invisible');
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedPage, onClose]);

    useEffect(() => {
        if (selectedPage) {
            // Fetch the page extract from Wikipedia's REST API
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedPage.title)}`;
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    setPageContent(data.extract_html || data.extract || "No description available.");
                })
                .catch(() => {
                    setPageContent("<p>Failed to load content.</p>");
                });
        }
    }, [selectedPage]);

    if (!selectedPage) {
        // do not render the iframe at all when there is no selected page to avoid empty src warnings
        return null;
    }

    const externalUrl = `https://en.wikipedia.org/?curid=${selectedPage.pageid}`;

    return (
        <div ref={iframeContainerRef} className="iframe visible" style={{ padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>
            <button className="close-button" onClick={onClose}> X </button>

            <h2 style={{ marginTop: '30px' }}>{selectedPage.title}</h2>

            <div dangerouslySetInnerHTML={{ __html: pageContent }} />

            <div style={{ marginTop: '20px' }}>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                    Read full article on Wikipedia
                </a>
            </div>
        </div>
    );
};

export default IframePopup;