import React from 'react';
import { motion } from 'framer-motion';

const ARCHITECTURAL_ASSETS = [
    {
        id: 'door-single',
        name: 'Single Door',
        viewBox: '0 0 100 100',
        path: 'M10,90 L10,10 L90,10 A80,80 0 0,0 10,90 Z',
        type: 'asset'
    },
    {
        id: 'door-double',
        name: 'Double Door',
        viewBox: '0 0 100 100',
        path: 'M50,90 L50,10 M10,90 L10,10 A40,40 0 0,1 50,50 M90,90 L90,10 A40,40 0 0,0 50,50',
        type: 'asset'
    },
    {
        id: 'window-standard',
        name: 'Standard Window',
        viewBox: '0 0 100 50',
        path: 'M10,10 L90,10 L90,40 L10,40 Z M10,25 L90,25 M30,10 L30,40 M70,10 L70,40',
        type: 'asset'
    },
    {
        id: 'stairs-straight',
        name: 'Straight Stairs',
        viewBox: '0 0 100 100',
        path: 'M10,10 L90,10 L90,90 L10,90 Z M10,30 L90,30 M10,50 L90,50 M10,70 L90,70',
        type: 'asset'
    },
    {
        id: 'toilet',
        name: 'Toilet',
        viewBox: '0 0 100 100',
        path: 'M20,10 L80,10 L80,30 L20,30 Z M40,30 L60,30 A20,30 0 0,1 60,90 L40,90 A20,30 0 0,1 40,30 Z',
        type: 'asset'
    },
    {
        id: 'sink',
        name: 'Sink',
        viewBox: '0 0 100 100',
        path: 'M10,10 L90,10 L90,60 L10,60 Z M30,30 A20,15 0 0,0 70,30 A20,15 0 0,0 30,30 Z M48,42 A2,2 0 1,0 52,42 A2,2 0 1,0 48,42 Z',
        type: 'asset'
    }
];

const AssetLibrary = ({ onSelectAsset }) => {
    // For a simpler MVP without complex HTML5 drag/drop relative coordinates to canvas,
    // we'll make this click-to-place. User clicks asset in library, then cursor changes, 
    // and next click on canvas places it.

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 bg-white border-l-2 border-ink-primary shadow-2xl flex flex-col z-20 h-full overflow-hidden"
        >
            <div className="p-4 border-b-2 border-ink-primary bg-[#f9f7f2]">
                <h2 className="text-sm font-black text-ink-primary uppercase tracking-widest">Stencils</h2>
                <p className="text-[10px] text-ink-primary/60 mt-1">Select an asset, then click on the canvas to place it.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                    {ARCHITECTURAL_ASSETS.map(asset => (
                        <button
                            key={asset.id}
                            onClick={() => onSelectAsset(asset)}
                            className="bg-white border-2 border-ink-primary/20 p-2 rounded-sm hover:border-terra-600 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 aspect-square group"
                            title={asset.name}
                        >
                            <svg
                                viewBox={asset.viewBox}
                                className="w-12 h-12 stroke-ink-primary stroke-[3px] fill-transparent group-hover:stroke-terra-600 transition-colors"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d={asset.path} />
                            </svg>
                            <span className="text-[8px] font-black uppercase text-center text-ink-primary/70">{asset.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AssetLibrary;
