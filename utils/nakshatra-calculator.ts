import type { NakshatraPeriod } from '../types';

declare global {
    interface Window {
        SunCalc: any;
    }
}

// A Nakshatra is 13° 20' (or 13.333 degrees)
const NAKSHATRA_SPAN_DEGREES = 360 / 27;

// Swathi is the 15th Nakshatra. Nakshatras start from 0 degrees at the First Point of Aries.
// The calculation is (15 - 1) * 13.333...
const SWATHI_START_DEGREES_TROPICAL = (15 - 1) * NAKSHATRA_SPAN_DEGREES;
const SWATHI_END_DEGREES_TROPICAL = 15 * NAKSHATRA_SPAN_DEGREES;

/**
 * Calculates the Lahiri Ayanamsha for a given date.
 * Ayanamsha is the difference between the Tropical (seasonal) and Sidereal (fixed star) zodiacs.
 * This is a simplified model but accurate enough for this purpose.
 * @param date The date for which to calculate the Ayanamsha.
 * @returns The Ayanamsha value in degrees.
 */
const getLahiriAyanamsha = (date: Date): number => {
    // Lahiri Ayanamsha for J2000.0 (Jan 1, 2000, 12:00 UT)
    const AYANAMSHA_AT_J2000 = 23.85575;
    const J2000 = new Date('2000-01-01T12:00:00Z');
    
    // The precession rate is approx 50.29 arcseconds per year.
    const PRECESSION_RATE_DEG_PER_YEAR = 50.29 / 3600;
    
    const yearsSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    return AYANAMSHA_AT_J2000 + (yearsSinceJ2000 * PRECESSION_RATE_DEG_PER_YEAR);
};

/**
 * Gets the Moon's sidereal longitude for a given date.
 * It uses SunCalc to get the tropical longitude and then applies the Ayanamsha correction.
 * @param date The date for which to get the longitude.
 * @returns The sidereal longitude in degrees.
 */
const getLunarSiderealLongitude = (date: Date): number => {
    if (typeof window.SunCalc === 'undefined') {
        throw new Error("SunCalc library is not loaded. Please check the script tag in your HTML file.");
    }
    const moonPosition = window.SunCalc.getMoonPosition(date);
    // SunCalc returns longitude in radians, convert to degrees
    const tropicalLongitude = moonPosition.eclipticLon * (180 / Math.PI);
    
    const ayanamsha = getLahiriAyanamsha(date);
    
    let siderealLongitude = tropicalLongitude - ayanamsha;
    
    // Normalize to 0-360 degrees
    if (siderealLongitude < 0) {
        siderealLongitude += 360;
    }
    
    return siderealLongitude;
};

/**
 * Checks if a given longitude falls within the Swathi Nakshatra boundaries.
 * @param longitude The longitude in degrees to check.
 * @returns True if the longitude is within Swathi, false otherwise.
 */
const isSwathi = (longitude: number): boolean => {
    return longitude >= SWATHI_START_DEGREES_TROPICAL && longitude < SWATHI_END_DEGREES_TROPICAL;
}

/**
 * Asynchronously finds the current or next Swathi Nakshatra period.
 * It performs an iterative search to find the precise start and end times.
 * @param startDate The date from which to start searching.
 * @returns A promise that resolves to a NakshatraPeriod object.
 */
export const findCurrentOrNextSwathiPeriod = async (startDate: Date): Promise<NakshatraPeriod> => {
    let currentDate = new Date(startDate);
    
    // The Moon moves about 0.5 degrees per hour. Start with a coarse search.
    const coarseStep = 60 * 60 * 1000; // 1 hour
    const fineStep = 60 * 1000; // 1 minute
    
    let longitude = getLunarSiderealLongitude(currentDate);

    // If we are currently in Swathi, we need to find the start and end of this period.
    if (isSwathi(longitude)) {
        // Find the start by going backwards
        let startFinder = new Date(currentDate);
        while (isSwathi(getLunarSiderealLongitude(startFinder))) {
            startFinder.setTime(startFinder.getTime() - coarseStep);
        }
        // Refine to the minute
        while (!isSwathi(getLunarSiderealLongitude(startFinder))) {
            startFinder.setTime(startFinder.getTime() + fineStep);
        }
        const periodStart = startFinder;

        // Find the end by going forwards
        let endFinder = new Date(currentDate);
        while (isSwathi(getLunarSiderealLongitude(endFinder))) {
            endFinder.setTime(endFinder.getTime() + coarseStep);
        }
        // Refine to the minute
        while (isSwathi(getLunarSiderealLongitude(endFinder))) {
            endFinder.setTime(endFinder.getTime() + fineStep);
        }
        const periodEnd = endFinder;
        
        return { start: periodStart, end: periodEnd };
    }

    // If not in Swathi, find the start of the next period.
    let searchDate = new Date(currentDate);
    while (!isSwathi(getLunarSiderealLongitude(searchDate))) {
        searchDate.setTime(searchDate.getTime() + coarseStep);
    }
    // Refine to the minute
    while (isSwathi(getLunarSiderealLongitude(new Date(searchDate.getTime() - fineStep)))) {
       searchDate.setTime(searchDate.getTime() - fineStep);
    }
    const periodStart = searchDate;
    
    // Now find the end of that period
    let endFinder = new Date(periodStart);
    while(isSwathi(getLunarSiderealLongitude(endFinder))) {
        endFinder.setTime(endFinder.getTime() + coarseStep);
    }
    // Refine to the minute
    while(isSwathi(getLunarSiderealLongitude(endFinder))) {
         endFinder.setTime(endFinder.getTime() + fineStep);
    }
    const periodEnd = endFinder;

    return { start: periodStart, end: periodEnd };
};
