import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateAllocations } from '@/lib/calculations';

interface SectorData {
  name: string;
  weight: number;
  return: number;
}

// Default custom index data (user can edit)
const defaultCustomData: SectorData[] = [
  { name: 'Technology', weight: 25, return: 2.5 },
  { name: 'Financials', weight: 18, return: -0.8 },
  { name: 'Healthcare', weight: 15, return: 1.2 },
  { name: 'Consumer', weight: 12, return: 0.5 },
  { name: 'Industrials', weight: 10, return: -1.5 },
  { name: 'Energy', weight: 8, return: 3.2 },
  { name: 'Materials', weight: 6, return: -0.3 },
  { name: 'Utilities', weight: 4, return: 0.1 },
  { name: 'Real Estate', weight: 2, return: -2.1 },
];

type ViewMode = 'portfolio' | 'custom';

export function SectorMap() {
  const { transactions, valuations } = usePortfolio();
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [customData, setCustomData] = useState<SectorData[]>(defaultCustomData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ weight: string; return: string }>({ weight: '', return: '' });

  // Derive portfolio sectors from asset type allocations
  const portfolioSectors = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) {
      return [];
    }

    const allocations = calculateAllocations(transactions, valuations, 'assetType');
    
    // Map asset types to sector-like names and add placeholder returns
    // In a real scenario, user would input returns manually
    return allocations.map(alloc => ({
      name: alloc.name,
      weight: alloc.percentage,
      return: 0, // User would manually update returns
    }));
  }, [transactions, valuations]);

  const sectorData = viewMode === 'portfolio' ? portfolioSectors : customData;

  // Calculate contribution for each sector
  const dataWithContribution = useMemo(() => {
    return sectorData.map(sector => ({
      ...sector,
      contribution: (sector.weight / 100) * sector.return,
    }));
  }, [sectorData]);

  // Total weighted return
  const totalReturn = useMemo(() => {
    return dataWithContribution.reduce((sum, s) => sum + s.contribution, 0);
  }, [dataWithContribution]);

  // Color functions
  const getReturnColor = (returnVal: number): string => {
    if (returnVal > 0) {
      const intensity = Math.min(returnVal / 5, 1);
      return `hsl(142, ${60 + intensity * 20}%, ${35 + intensity * 15}%)`;
    } else if (returnVal < 0) {
      const intensity = Math.min(Math.abs(returnVal) / 5, 1);
      return `hsl(0, ${60 + intensity * 20}%, ${35 + intensity * 15}%)`;
    }
    return 'hsl(var(--muted))';
  };

  const getTextColorClass = (returnVal: number): string => {
    if (returnVal > 0) return 'text-terminal-positive';
    if (returnVal < 0) return 'text-terminal-negative';
    return 'text-muted-foreground';
  };

  // Edit handlers
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValues({
      weight: customData[index].weight.toString(),
      return: customData[index].return.toString(),
    });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    
    const newData = [...customData];
    newData[editingIndex] = {
      ...newData[editingIndex],
      weight: parseFloat(editValues.weight) || 0,
      return: parseFloat(editValues.return) || 0,
    };
    setCustomData(newData);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValues({ weight: '', return: '' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SectorData & { contribution: number } }> }) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border p-3 rounded-md shadow-lg">
        <p className="font-mono font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">Weight: <span className="text-foreground">{data.weight.toFixed(1)}%</span></p>
        <p className={`text-sm ${getTextColorClass(data.return)}`}>
          Return: {data.return >= 0 ? '+' : ''}{data.return.toFixed(2)}%
        </p>
        <p className={`text-sm ${getTextColorClass(data.contribution)}`}>
          Contribution: {data.contribution >= 0 ? '+' : ''}{data.contribution.toFixed(3)}%
        </p>
      </div>
    );
  };

  return (
    <Card className="bloomberg-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-sm font-mono text-primary">SECTOR MAP</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Intraday return by sector (based on my data)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">View:</span>
            <Button
              variant={viewMode === 'portfolio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('portfolio')}
              className="text-xs h-7"
            >
              Portfolio
            </Button>
            <Button
              variant={viewMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('custom')}
              className="text-xs h-7"
            >
              Custom Index
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sectorData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sector data available.</p>
            <p className="text-xs mt-1">
              {viewMode === 'portfolio' 
                ? 'Add transactions and valuations to see portfolio breakdown.' 
                : 'Switch to Custom Index to enter data manually.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataWithContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="weight"
                    nameKey="name"
                  >
                    {dataWithContribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getReturnColor(entry.return)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-4">
                <span className="text-xs text-muted-foreground">Total Weighted Return: </span>
                <span className={`font-mono font-semibold ${getTextColorClass(totalReturn)}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(3)}%
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-mono">Sector</TableHead>
                    <TableHead className="text-xs font-mono text-right">Weight %</TableHead>
                    <TableHead className="text-xs font-mono text-right">Return %</TableHead>
                    <TableHead className="text-xs font-mono text-right">Contrib.</TableHead>
                    {viewMode === 'custom' && <TableHead className="text-xs w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataWithContribution.map((sector, index) => (
                    <TableRow key={sector.name} className="text-xs">
                      <TableCell className="font-mono py-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: getReturnColor(sector.return) }}
                          />
                          {sector.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={editValues.weight}
                            onChange={(e) => setEditValues(prev => ({ ...prev, weight: e.target.value }))}
                            className="w-16 h-6 text-xs p-1"
                          />
                        ) : (
                          <span className="font-mono">{sector.weight.toFixed(1)}</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right py-2 font-mono ${getTextColorClass(sector.return)}`}>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={editValues.return}
                            onChange={(e) => setEditValues(prev => ({ ...prev, return: e.target.value }))}
                            className="w-16 h-6 text-xs p-1"
                          />
                        ) : (
                          <span>{sector.return >= 0 ? '+' : ''}{sector.return.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right py-2 font-mono ${getTextColorClass(sector.contribution)}`}>
                        {sector.contribution >= 0 ? '+' : ''}{sector.contribution.toFixed(3)}
                      </TableCell>
                      {viewMode === 'custom' && (
                        <TableCell className="py-2">
                          {editingIndex === index ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={saveEdit}>
                                <Check className="h-3 w-3 text-terminal-positive" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancelEdit}>
                                <X className="h-3 w-3 text-terminal-negative" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(index)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-terminal-positive" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-terminal-negative" />
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Neutral</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
