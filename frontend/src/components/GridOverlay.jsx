import React from 'react';

const GridOverlay = ({ type }) => {
    if (type === 'none') return null;

    if (type === 'standard') {
        return (
            <div
                className="absolute inset-0 opacity-[0.3] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#1a1c1e 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
        );
    }

    if (type === 'isometric') {
        return (
            <div
                className="absolute inset-0 opacity-[0.2] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(30deg, #1a1c1e 1px, transparent 1px),
                        linear-gradient(150deg, #1a1c1e 1px, transparent 1px),
                        linear-gradient(90deg, #1a1c1e 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 69.28px, 40px 69.28px, 20px 34.64px',
                    backgroundPosition: '0 0, 0 0, -10px -17.32px'
                }}
            />
        );
    }

    if (type === 'perspective') {
        // A simple 1-point perspective illusion using CSS gradients
        return (
            <div
                className="absolute inset-0 opacity-[0.15] pointer-events-none overflow-hidden"
                style={{
                    background: `
                        repeating-linear-gradient(
                            to right,
                            transparent,
                            transparent 49px,
                            #1a1c1e 49px,
                            #1a1c1e 50px
                        )
                    `
                }}
            >
                {/* Horizontal lines getting closer together towards the horizon (top) */}
                <div
                    className="absolute inset-0 border-t border-[#1a1c1e]"
                    style={{
                        background: `
                            repeating-linear-gradient(
                                to bottom,
                                transparent,
                                transparent 10%,
                                #1a1c1e 10.5%,
                                transparent 10.5%,
                                transparent 25%,
                                #1a1c1e 25.5%,
                                transparent 25.5%,
                                transparent 45%,
                                #1a1c1e 45.5%,
                                transparent 45.5%,
                                transparent 70%,
                                #1a1c1e 70.5%,
                                transparent 70.5%
                            )
                        `
                    }}
                />
                {/* Diagonal perspective lines towards center */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
                            repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(26,28,30,0.5) 100px, rgba(26,28,30,0.5) 101px),
                            repeating-linear-gradient(-45deg, transparent, transparent 100px, rgba(26,28,30,0.5) 100px, rgba(26,28,30,0.5) 101px)
                        `
                    }}
                />
            </div>
        );
    }

    return null;
};

export default GridOverlay;
