import { useState, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mapping from portfolio geography names to ISO country codes / regions
const regionToCountries: Record<string, string[]> = {
  'North America': ['USA', 'CAN', 'MEX'],
  'US': ['USA'],
  'USA': ['USA'],
  'Europe': ['GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'CHE', 'AUT', 'SWE', 'NOR', 'DNK', 'FIN', 'IRL', 'PRT', 'GRC', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'HRV', 'SVK', 'SVN', 'LTU', 'LVA', 'EST', 'LUX', 'MLT', 'CYP'],
  'Asia Pacific': ['CHN', 'JPN', 'KOR', 'TWN', 'HKG', 'SGP', 'AUS', 'NZL', 'IND', 'IDN', 'MYS', 'THA', 'PHL', 'VNM'],
  'Asia': ['CHN', 'JPN', 'KOR', 'TWN', 'HKG', 'SGP', 'IND', 'IDN', 'MYS', 'THA', 'PHL', 'VNM'],
  'Japan': ['JPN'],
  'China': ['CHN'],
  'Israel': ['ISR'],
  'IL': ['ISR'],
  'Global': [], // Special case - will highlight all
  'Emerging Markets': ['BRA', 'RUS', 'IND', 'CHN', 'ZAF', 'MEX', 'IDN', 'TUR', 'SAU', 'ARG', 'THA', 'MYS', 'PHL', 'COL', 'CHL', 'PER', 'EGY', 'PAK', 'BGD', 'VNM'],
  'EM': ['BRA', 'RUS', 'IND', 'CHN', 'ZAF', 'MEX', 'IDN', 'TUR', 'SAU', 'ARG', 'THA', 'MYS', 'PHL', 'COL', 'CHL', 'PER', 'EGY', 'PAK', 'BGD', 'VNM'],
  'Latin America': ['BRA', 'MEX', 'ARG', 'COL', 'CHL', 'PER', 'VEN', 'ECU', 'BOL', 'PRY', 'URY'],
  'Middle East': ['ISR', 'SAU', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR', 'JOR', 'LBN', 'IRN', 'IRQ', 'TUR', 'EGY'],
};

// ISO 3166-1 alpha-3 to numeric mapping for matching with TopoJSON
const countryNameToISO: Record<string, string> = {
  'United States of America': 'USA',
  'United States': 'USA',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  'United Kingdom': 'GBR',
  'Germany': 'DEU',
  'France': 'FRA',
  'Italy': 'ITA',
  'Spain': 'ESP',
  'Netherlands': 'NLD',
  'Belgium': 'BEL',
  'Switzerland': 'CHE',
  'Austria': 'AUT',
  'Sweden': 'SWE',
  'Norway': 'NOR',
  'Denmark': 'DNK',
  'Finland': 'FIN',
  'Ireland': 'IRL',
  'Portugal': 'PRT',
  'Greece': 'GRC',
  'Poland': 'POL',
  'Czechia': 'CZE',
  'Hungary': 'HUN',
  'Romania': 'ROU',
  'Bulgaria': 'BGR',
  'Croatia': 'HRV',
  'Slovakia': 'SVK',
  'Slovenia': 'SVN',
  'Lithuania': 'LTU',
  'Latvia': 'LVA',
  'Estonia': 'EST',
  'Luxembourg': 'LUX',
  'Malta': 'MLT',
  'Cyprus': 'CYP',
  'China': 'CHN',
  'Japan': 'JPN',
  'South Korea': 'KOR',
  'Taiwan': 'TWN',
  'Hong Kong': 'HKG',
  'Singapore': 'SGP',
  'Australia': 'AUS',
  'New Zealand': 'NZL',
  'India': 'IND',
  'Indonesia': 'IDN',
  'Malaysia': 'MYS',
  'Thailand': 'THA',
  'Philippines': 'PHL',
  'Vietnam': 'VNM',
  'Brazil': 'BRA',
  'Russia': 'RUS',
  'South Africa': 'ZAF',
  'Turkey': 'TUR',
  'Saudi Arabia': 'SAU',
  'Argentina': 'ARG',
  'Colombia': 'COL',
  'Chile': 'CHL',
  'Peru': 'PER',
  'Egypt': 'EGY',
  'Pakistan': 'PAK',
  'Bangladesh': 'BGD',
  'Israel': 'ISR',
  'United Arab Emirates': 'ARE',
  'Qatar': 'QAT',
  'Kuwait': 'KWT',
  'Oman': 'OMN',
  'Bahrain': 'BHR',
  'Jordan': 'JOR',
  'Lebanon': 'LBN',
  'Iran': 'IRN',
  'Iraq': 'IRQ',
  'Venezuela': 'VEN',
  'Ecuador': 'ECU',
  'Bolivia': 'BOL',
  'Paraguay': 'PRY',
  'Uruguay': 'URY',
};

interface GeographicHeatMapProps {
  data: { name: string; value: number; percentage: number }[];
}

const COLORS = ['#FF8C00', '#4A90D9', '#50C878', '#FFD700', '#9370DB', '#FF6B6B', '#20B2AA', '#DDA0DD'];

export function GeographicHeatMap({ data }: GeographicHeatMapProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Zoom and pan state
  const [position, setPosition] = useState({ coordinates: [0, 25] as [number, number], zoom: 1 });

  const handleZoomIn = useCallback(() => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }, [position.zoom]);

  const handleZoomOut = useCallback(() => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }, [position.zoom]);

  const handleReset = useCallback(() => {
    setPosition({ coordinates: [0, 25], zoom: 1 });
  }, []);

  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);
  
  // Create a weight map for each ISO country code
  const countryWeights: Record<string, number> = {};
  let hasGlobal = false;
  let globalWeight = 0;

  data.forEach(item => {
    const regionName = item.name;
    const weight = item.percentage;

    if (regionName === 'Global') {
      hasGlobal = true;
      globalWeight = weight;
      return;
    }

    const countries = regionToCountries[regionName] || [];
    countries.forEach(iso => {
      countryWeights[iso] = (countryWeights[iso] || 0) + weight;
    });
  });

  // Get max weight for color scale
  const maxWeight = Math.max(...Object.values(countryWeights), hasGlobal ? globalWeight : 0, 1);

  // Color scale using app theme - from muted to primary (orange)
  const colorScale = scaleLinear<string>()
    .domain([0, maxWeight])
    .range(['hsl(0, 0%, 16%)', 'hsl(30, 100%, 50%)']); // secondary to primary

  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.name;
    const iso = countryNameToISO[countryName];
    
    if (iso && countryWeights[iso]) {
      return colorScale(countryWeights[iso]);
    }
    
    // If global allocation, give a base color to all
    if (hasGlobal && globalWeight > 0) {
      return colorScale(globalWeight * 0.3);
    }
    
    return 'hsl(0, 0%, 11%)'; // card background
  };

  const getCountryWeight = (geo: any): number => {
    const countryName = geo.properties.name;
    const iso = countryNameToISO[countryName];
    if (iso && countryWeights[iso]) {
      return countryWeights[iso];
    }
    return 0;
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <div>
          <span className="text-primary">■</span> Geographic Distribution
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomIn}
            disabled={position.zoom >= 8}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomOut}
            disabled={position.zoom <= 1}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleReset}
            disabled={position.zoom === 1 && position.coordinates[0] === 0 && position.coordinates[1] === 25}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {/* World Heat Map - Full Width */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="terminal-label">Distribution</p>
            <p className="text-[9px] text-muted-foreground">Drag to pan • Scroll to zoom</p>
          </div>
          <div className="w-full h-[280px] md:h-[340px]">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={handleMoveEnd}
                minZoom={1}
                maxZoom={8}
              >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const weight = getCountryWeight(geo);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(geo)}
                        stroke="hsl(0, 0%, 22%)"
                        strokeWidth={0.4}
                        style={{
                          default: { outline: 'none' },
                          hover: { 
                            fill: weight > 0 ? 'hsl(30, 100%, 60%)' : 'hsl(0, 0%, 20%)',
                            outline: 'none',
                            cursor: weight > 0 ? 'pointer' : 'default'
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
          </div>
          
          {/* Color Legend - Full Width */}
          <div className="w-full mt-3">
            <div 
              className="h-2 rounded-sm"
              style={{
                background: 'linear-gradient(to right, hsl(0, 0%, 16%), hsl(30, 100%, 50%))'
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-muted-foreground">0%</span>
              <span className="text-[9px] font-mono text-muted-foreground">100%</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="terminal-label text-left py-2">Geographic</th>
                <th className="terminal-label text-right py-2">Value</th>
                <th className="terminal-label text-right py-2">Weight</th>
                <th className="terminal-label text-right py-2 w-32">Bar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.name} className="border-b border-border/20 hover:bg-primary/5">
                  <td className="py-2 flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-mono text-xs">{item.name}</span>
                  </td>
                  <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                    ${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="font-mono text-xs text-right tabular-nums font-medium">
                    {item.percentage.toFixed(2)}%
                  </td>
                  <td className="py-2 pl-4">
                    <div className="h-3 bg-muted/30 rounded-sm overflow-hidden">
                      <div 
                        className="h-full rounded-sm transition-all duration-500"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-3 font-mono">
            Total analyzed: ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
