// src/FloorPlan.tsx
import React, { useEffect } from 'react';
import type { MapData } from './types';

interface FloorPlanProps {
    data: MapData | null;
    iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({ data, iframeRef }) => {
    
    useEffect(() => {
        const iframe = iframeRef.current;
        if (data && iframe?.contentWindow) {
            // Ждем, пока iframe полностью загрузится
            const handleLoad = () => {
                iframe.contentWindow?.postMessage({ type: 'LOAD_DATA', payload: data }, '*');
            };
            iframe.addEventListener('load', handleLoad);
            
            // Если iframe уже загружен к моменту получения данных
            if (iframe.contentDocument?.readyState === 'complete') {
                 iframe.contentWindow?.postMessage({ type: 'LOAD_DATA', payload: data }, '*');
            }

            return () => iframe.removeEventListener('load', handleLoad);
        }
    }, [data, iframeRef]);

    return (
        <iframe
            ref={iframeRef}
            src="/floorplan/index.html"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="FloorPlan Renderer"
        />
    );
};