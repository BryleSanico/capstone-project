import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as sqliteService from "../../services/sqliteService";
import { eventsQueryKey } from "../data/useEvents";
import { logger } from "../../utils/system/logger";

export const useEventCacheHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const hydrateCache = async () => {
      try {
        // Create the tables
        await sqliteService.initDB();

        // Hydrate Event Data ONLY
        logger.info("[Hydration] Hydrating event data...");
        const cachedEvents = await sqliteService.getEvents();
        if (cachedEvents.length > 0) {
          queryClient.setQueryData([...eventsQueryKey, "list", "", "All"], {
            pages: [
              {
                events: cachedEvents,
                totalCount: cachedEvents.length,
                nextPage: 2,
              },
            ],
            pageParams: [1],
          });
        }
        logger.info(
          `[Hydration] Hydrated ${cachedEvents.length} public events.`
        );
      } catch (error) {
        logger.error("[Hydration] Failed to hydrate event cache:", error);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateCache();
  }, [queryClient]); // Only runs once

  return { isHydrated };
};
