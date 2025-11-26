import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Track visitor when they land on the site
export const useVisitorTracking = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Get visitor's IP and location info from ipapi.co (free API)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        // Log the visit
        await supabase.from('visitor_logs' as any).insert({
          ip_address: data.ip || 'Unknown',
          user_agent: navigator.userAgent,
          page_url: window.location.href,
          referrer: document.referrer || 'Direct',
          country: data.country_name || null,
          city: data.city || null,
        });
      } catch (error) {
        // Fallback if IP API fails
        try {
          await supabase.from('visitor_logs' as any).insert({
            ip_address: 'Unknown',
            user_agent: navigator.userAgent,
            page_url: window.location.href,
            referrer: document.referrer || 'Direct',
            country: null,
            city: null,
          });
        } catch (fallbackError) {
          console.error('Failed to track visit:', fallbackError);
        }
      }
    };

    trackVisit();
  }, []);
};
