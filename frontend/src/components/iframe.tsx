import React, { useRef, useEffect } from 'react';
import type { WikiPage } from './types';

interface IframePopupProps {
    selectedPage: WikiPage | undefined;
    onClose: () => void;
}

const IframePopup: React.FC<IframePopupProps> = ({ selectedPage, onClose }) => {
    const iframeContainerRef = useRef<HTMLDivElement | null>(null);

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

    if (!selectedPage) {
        // do not render the iframe at all when there is no selected page to avoid empty src warnings
        return null;
    }

    const url = `https://en.wikipedia.org/?curid=${selectedPage.pageid}`;

    return (
        <div ref={iframeContainerRef} className="iframe visible">
            <button className="close-button" onClick={onClose}>×</button>
            <iframe src={url} title="Wikipedia Page" style={{ width: "100%", height: "100%", border: 'none' }} />
        </div>
    );
};

export default IframePopup;