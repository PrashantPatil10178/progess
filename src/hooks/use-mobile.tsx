"use client";

import { useEffect, useState } from "react";

/**
 * A hook that returns whether the current viewport is considered mobile
 * based on a media query for screen width.
 *
 * @returns {boolean} True if the viewport is considered mobile, false otherwise.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return;
    }

    // Create a media query for devices with a max-width of 768px
    const mobileMediaQuery = window.matchMedia("(max-width: 768px)");

    // Set the initial value
    setIsMobile(mobileMediaQuery.matches);

    // Define the handler function for media query changes
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Add the event listener
    mobileMediaQuery.addEventListener("change", handleMediaQueryChange);

    // Clean up the event listener on unmount
    return () => {
      mobileMediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  return isMobile;
}
