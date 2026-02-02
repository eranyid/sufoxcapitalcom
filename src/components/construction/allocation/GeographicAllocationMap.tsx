import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Position, REGION_LABELS, Region } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';
import { Globe, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mapping from position country names to ISO codes
const countryNameToISO: Record<string, string> = {
  'United States': 'USA',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  'United Kingdom': 'GBR',
  'Germany': 'DEU',
  'France': 'FRA',
  'Italy': 'ITA',
  'Spain': 'ESP',
  'Netherlands': 'NLD',
  'Switzerland': 'CHE',
  'Sweden': 'SWE',
  'Japan': 'JPN',
  'China': 'CHN',
  'South Korea': 'KOR',
  'Taiwan': 'TWN',
  'Hong Kong': 'HKG',
  'Singapore': 'SGP',
  'Australia': 'AUS',
  'India': 'IND',
  'Israel': 'ISR',
  'UAE': 'ARE',
  'Saudi Arabia': 'SAU',
  'Qatar': 'QAT',
  'Brazil': 'BRA',
  'Chile': 'CHL',
  'Argentina': 'ARG',
  'Colombia': 'COL',
  'South Africa': 'ZAF',
  'Egypt': 'EGY',
  'Nigeria': 'NGA',
  'Kenya': 'KEN',
  'Global/Multi-Country': 'GLOBAL',
};

// Reverse mapping for display
const isoToCountryName: Record<string, string> = Object.fromEntries(
  Object.entries(countryNameToISO).map(([k, v]) => [v, k])
);

// Map region to ISO codes for regional positions
const regionToISOs: Record<Region, string[]> = {
  north_america: ['USA', 'CAN', 'MEX'],
  europe: ['GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'CHE', 'SWE', 'NOR', 'DNK', 'FIN', 'IRL', 'PRT', 'GRC', 'POL', 'AUT', 'BEL'],
  asia_pacific: ['JPN', 'CHN', 'KOR', 'TWN', 'HKG', 'SGP', 'AUS', 'NZL', 'IND', 'IDN', 'MYS', 'THA', 'PHL', 'VNM'],
  middle_east: ['ISR', 'ARE', 'SAU', 'QAT', 'KWT', 'OMN', 'BHR'],
  latin_america: ['BRA', 'CHL', 'ARG', 'COL', 'PER', 'MEX'],
  africa: ['ZAF', 'EGY', 'NGA', 'KEN', 'MAR'],
  global: [],
};

// Professional FT color palette
const REGION_COLORS: Record<Region, string> = {
  north_america: '#2A7AB9',
  europe: '#01B8AA',
  asia_pacific: '#FD625E',
  middle_east: '#F2C80F',
  latin_america: '#8AD4EB',
  africa: '#A66999',
  global: '#5F6B6D',
};

interface GeographicAllocationMapProps {
  positions: Position[];
  title?: string;
}

export function GeographicAllocationMap({ positions, title = 'Geographic Exposure' }: GeographicAllocationMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Aggregate by country and region
  const { countryData, regionData, maxWeight } = useMemo(() => {
    const countryMap: Record<string, { allocation: number; positions: string[] }> = {};
    const regionMap: Record<Region, number> = {
      north_america: 0,
      europe: 0,
      asia_pacific: 0,
      middle_east: 0,
      latin_america: 0,
      africa: 0,
      global: 0,
    };

    positions.forEach(pos => {
      // Track region
      regionMap[pos.region] += pos.allocation;

      // Track country
      const iso = countryNameToISO[pos.country];
      if (iso && iso !== 'GLOBAL') {
        if (!countryMap[iso]) {
          countryMap[iso] = { allocation: 0, positions: [] };
        }
        countryMap[iso].allocation += pos.allocation;
        countryMap[iso].positions.push(pos.name);
      }
    });

    const max = Math.max(...Object.values(countryMap).map(c => c.allocation), 1);
    
    return { 
      countryData: countryMap, 
      regionData: Object.entries(regionMap)
        .filter(([_, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ region: k as Region, allocation: v })),
      maxWeight: max 
    };
  }, [positions]);

  // Color scale
  const colorScale = scaleLinear<string>()
    .domain([0, maxWeight])
    .range(['hsl(var(--muted))', 'hsl(30, 100%, 50%)']);

  const getCountryColor = (geo: any) => {
    const name = geo.properties.name;
    const iso = countryNameToISO[name];
    
    if (iso && countryData[iso]) {
      return colorScale(countryData[iso].allocation);
    }
    return 'hsl(var(--muted) / 0.3)';
  };

  const getCountryInfo = (geo: any) => {
    const name = geo.properties.name;
    const iso = countryNameToISO[name];
    if (iso && countryData[iso]) {
      return countryData[iso];
    }
    return null;
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  if (positions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe size={14} className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Add positions to see geographic exposure</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe size={14} className="text-primary" />
            {title}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom(z => Math.min(z + 0.5, 4))}
            >
              <ZoomIn size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setZoom(z => Math.max(z - 0.5, 1))}
            >
              <ZoomOut size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleReset}
            >
              <RotateCcw size={12} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Map */}
        <div className="relative w-full h-[280px] bg-muted/10 rounded-lg overflow-hidden border border-border/30">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 140,
              center: [0, 25]
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ coordinates, zoom: z }) => {
                setCenter(coordinates as [number, number]);
                setZoom(z);
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const info = getCountryInfo(geo);
                    const isHovered = hoveredCountry === geo.properties.name;
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(geo)}
                        stroke={info ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                        strokeWidth={info ? (isHovered ? 1.5 : 0.8) : 0.3}
                        onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{
                          default: { 
                            outline: 'none',
                            transition: 'fill 0.2s ease'
                          },
                          hover: { 
                            fill: info ? 'hsl(30, 100%, 60%)' : 'hsl(var(--muted) / 0.5)',
                            outline: 'none',
                            cursor: info ? 'pointer' : 'default'
                          },
                          pressed: { outline: 'none' }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Hover tooltip */}
          {hoveredCountry && countryData[countryNameToISO[hoveredCountry]] && (
            <div className="absolute top-2 left-2 bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs font-medium">{hoveredCountry}</p>
              <p className="text-lg font-mono font-bold text-primary">
                {countryData[countryNameToISO[hoveredCountry]].allocation.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {countryData[countryNameToISO[hoveredCountry]].positions.length} position(s)
              </p>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="mt-3">
          <div 
            className="h-2 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(var(--muted)), hsl(30, 100%, 50%))`
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-muted-foreground">0%</span>
            <span className="text-[9px] font-mono text-muted-foreground">{maxWeight.toFixed(0)}%</span>
          </div>
        </div>

        {/* Region breakdown */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">By Region</p>
          <div className="space-y-1.5">
            {regionData.slice(0, 5).map(({ region, allocation }) => (
              <div key={region} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: REGION_COLORS[region] }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                  {REGION_LABELS[region]}
                </span>
                <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden flex-shrink-0">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${allocation}%`,
                      backgroundColor: REGION_COLORS[region]
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-semibold w-12 text-right flex-shrink-0">
                  {allocation.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Country details */}
        {Object.keys(countryData).length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Top Countries</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(countryData)
                .sort((a, b) => b[1].allocation - a[1].allocation)
                .slice(0, 6)
                .map(([iso, data]) => (
                  <div key={iso} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {isoToCountryName[iso] || iso}
                    </span>
                    <span className="text-xs font-mono font-semibold">
                      {data.allocation.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
