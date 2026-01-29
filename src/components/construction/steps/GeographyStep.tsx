import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GeographyAllocation, GEOGRAPHY_PRESETS } from '@/types/construction';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Globe, MapPin, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeographyStepProps {
  geography: GeographyAllocation;
  onUpdate: (geography: GeographyAllocation) => void;
}

const GEOGRAPHY_COLORS = {
  israel: 'hsl(var(--primary))',
  usa: 'hsl(210, 100%, 50%)',
  europe: 'hsl(45, 100%, 50%)',
  other: 'hsl(280, 60%, 50%)',
};

const GEOGRAPHY_LABELS: Record<keyof GeographyAllocation, string> = {
  israel: 'Israel',
  usa: 'USA',
  europe: 'Europe',
  other: 'Other',
};

const PRESET_LABELS: Record<keyof typeof GEOGRAPHY_PRESETS, string> = {
  israel_tilt: 'Israel Tilt',
  global: 'Global',
  us_centric: 'US-Centric',
  eu_centric: 'EU-Centric',
};

export function GeographyStep({ geography, onUpdate }: GeographyStepProps) {
  const total = Object.values(geography).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const updateValue = (key: keyof GeographyAllocation, value: number) => {
    onUpdate({ ...geography, [key]: Math.max(0, Math.min(100, value)) });
  };

  const applyPreset = (preset: keyof typeof GEOGRAPHY_PRESETS) => {
    onUpdate(GEOGRAPHY_PRESETS[preset]);
  };

  const chartData = Object.entries(geography).map(([key, value]) => ({
    name: GEOGRAPHY_LABELS[key as keyof GeographyAllocation],
    value,
    fill: GEOGRAPHY_COLORS[key as keyof GeographyAllocation],
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            Geographic Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(key as keyof typeof GEOGRAPHY_PRESETS)}
                  className="text-xs h-7"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {(Object.keys(geography) as (keyof GeographyAllocation)[]).map((key) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-2">
                    <MapPin size={12} style={{ color: GEOGRAPHY_COLORS[key] }} />
                    {GEOGRAPHY_LABELS[key]}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {geography[key]}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[geography[key]]}
                    onValueChange={([val]) => updateValue(key, val)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={geography[key]}
                    onChange={(e) => updateValue(key, Number(e.target.value))}
                    className="w-16 h-8 text-center text-xs"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-md",
            isValid ? "bg-primary/10" : "bg-destructive/10"
          )}>
            <span className="text-sm font-medium flex items-center gap-2">
              {isValid ? <Check size={14} className="text-primary" /> : <AlertCircle size={14} className="text-destructive" />}
              Total
            </span>
            <span className={cn(
              "text-sm font-mono font-bold",
              isValid ? "text-primary" : "text-destructive"
            )}>
              {total}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Allocation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
