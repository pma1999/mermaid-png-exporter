import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Breakpoints for responsive design
 * These values define the max-width for each breakpoint
 * @constant
 */
export const BREAKPOINTS = {
    mobile: 768,   // ≤768px: phones and small tablets in portrait
    tablet: 1024,  // 769-1024px: tablets
    desktop: 1025, // >1024px: desktop
};

/**
 * Custom hook for responsive breakpoint detection
 * Uses CSS media queries via matchMedia for reliable detection
 * 
 * @returns {Object} { isMobile, isTablet, isDesktop, width }
 * 
 * @example
 * const { isMobile, isTablet, isDesktop } = useMediaQuery();
 * if (isMobile) return <MobileLayout />;
 */
export function useMediaQuery() {
    // Initialize with actual window width (0 if SSR)
    const getWidth = useCallback(() => {
        if (typeof window === 'undefined') return BREAKPOINTS.desktop;
        return window.innerWidth;
    }, []);

    const [width, setWidth] = useState(getWidth);

    // Effect to set correct width on mount and handle resize
    useEffect(() => {
        // Immediately set width on mount (critical for mobile)
        setWidth(window.innerWidth);

        // Use both resize event AND matchMedia for reliable detection
        const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile}px)`);
        const tabletQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet}px)`);

        // Handler for resize events
        let resizeTimeout;
        const handleResize = () => {
            // Immediate update for first call, debounced for subsequent
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setWidth(window.innerWidth);
            }, 50); // Reduced debounce for faster response
        };

        // Handler for media query changes (more reliable than resize)
        const handleMediaChange = () => {
            setWidth(window.innerWidth);
        };

        // Listen to both resize and media query changes
        window.addEventListener('resize', handleResize);

        // Modern browsers support addEventListener on matchMedia
        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener('change', handleMediaChange);
            tabletQuery.addEventListener('change', handleMediaChange);
        } else {
            // Fallback for older browsers
            mobileQuery.addListener(handleMediaChange);
            tabletQuery.addListener(handleMediaChange);
        }

        // Cleanup
        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
            if (mobileQuery.removeEventListener) {
                mobileQuery.removeEventListener('change', handleMediaChange);
                tabletQuery.removeEventListener('change', handleMediaChange);
            } else {
                mobileQuery.removeListener(handleMediaChange);
                tabletQuery.removeListener(handleMediaChange);
            }
        };
    }, []);

    // Memoize the breakpoint calculations
    const breakpoints = useMemo(() => ({
        isMobile: width <= BREAKPOINTS.mobile,
        isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
        isDesktop: width > BREAKPOINTS.tablet,
        width,
    }), [width]);

    return breakpoints;
}

/**
 * Get responsive value based on current breakpoint
 * 
 * @param {Object} options - Values for each breakpoint
 * @param {any} options.mobile - Value for mobile
 * @param {any} options.tablet - Value for tablet (falls back to mobile)
 * @param {any} options.desktop - Value for desktop (falls back to tablet)
 * @param {Object} breakpoints - Result from useMediaQuery
 * @returns {any} The appropriate value for current breakpoint
 */
export function getResponsiveValue(options, breakpoints) {
    const { isMobile, isTablet } = breakpoints;

    if (isMobile) {
        return options.mobile;
    }
    if (isTablet) {
        return options.tablet ?? options.mobile;
    }
    return options.desktop ?? options.tablet ?? options.mobile;
}
