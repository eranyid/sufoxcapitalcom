import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CPIDataPoint {
  date: string; // YYYY-MM format
  value: number;
}

interface CPIResponse {
  success: boolean;
  data?: CPIDataPoint[];
  source?: string;
  error?: string;
}

// Fallback CPI data (approximate values based on CBS historical data)
const FALLBACK_CPI: Record<string, number> = {
  '2020-01': 100.0, '2020-06': 99.8, '2020-12': 99.5,
  '2021-01': 99.7, '2021-06': 101.1, '2021-12': 102.8,
  '2022-01': 103.2, '2022-06': 106.0, '2022-12': 107.5,
  '2023-01': 108.0, '2023-06': 109.3, '2023-12': 110.2,
  '2024-01': 110.5, '2024-06': 111.8, '2024-12': 112.5,
  '2025-01': 112.8, '2025-06': 113.5, '2025-12': 114.0,
};

export function useIsraelCPI() {
  const [cpiData, setCpiData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('fallback');

  useEffect(() => {
    async function fetchCPI() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke<CPIResponse>(
          'fetch-israel-cpi'
        );

        if (fnError) {
          console.warn('Error fetching CPI from CBS:', fnError);
          throw fnError;
        }

        if (data?.success && data.data && data.data.length > 0) {
          // Convert array to record
          const cpiRecord: Record<string, number> = {};
          for (const point of data.data) {
            cpiRecord[point.date] = point.value;
          }
          setCpiData(cpiRecord);
          setSource(data.source || 'Israeli CBS');
          console.log(`Loaded ${Object.keys(cpiRecord).length} CPI data points from CBS`);
        } else {
          throw new Error(data?.error || 'No CPI data received');
        }
      } catch (err) {
        console.warn('Using fallback CPI data:', err);
        setCpiData(FALLBACK_CPI);
        setSource('fallback (CBS unavailable)');
        setError('Using approximate values - CBS API unavailable');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCPI();
  }, []);

  // Get CPI for a specific date
  const getCPI = (dateStr: string): number => {
    const monthKey = dateStr.substring(0, 7); // YYYY-MM
    
    if (cpiData[monthKey]) {
      return cpiData[monthKey];
    }

    // Find closest available CPI
    const sortedKeys = Object.keys(cpiData).sort();
    if (sortedKeys.length === 0) return 100; // Default base

    const lastKey = sortedKeys[sortedKeys.length - 1];
    const firstKey = sortedKeys[0];

    if (monthKey > lastKey) return cpiData[lastKey];
    if (monthKey < firstKey) return cpiData[firstKey];

    // Find closest previous month
    for (let i = sortedKeys.length - 1; i >= 0; i--) {
      if (sortedKeys[i] <= monthKey) {
        return cpiData[sortedKeys[i]];
      }
    }

    return cpiData[firstKey];
  };

  // Get current (latest) CPI
  const getCurrentCPI = (): number => {
    const sortedKeys = Object.keys(cpiData).sort();
    if (sortedKeys.length === 0) return 100;
    return cpiData[sortedKeys[sortedKeys.length - 1]];
  };

  // Get CPI base year info
  const getBaseInfo = () => {
    const sortedKeys = Object.keys(cpiData).sort();
    return {
      firstDate: sortedKeys[0] || 'N/A',
      lastDate: sortedKeys[sortedKeys.length - 1] || 'N/A',
      dataPoints: sortedKeys.length,
    };
  };

  return {
    cpiData,
    getCPI,
    getCurrentCPI,
    getBaseInfo,
    isLoading,
    error,
    source,
  };
}
