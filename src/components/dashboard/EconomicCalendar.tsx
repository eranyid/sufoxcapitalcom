import { useState } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CALENDAR_URL = 'https://sslecal2.investing.com?ecoDayBackground=%23000000&defaultFont=%23fa8c1e&innerBorderColor=%230066ff&columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5&calType=week&timeZone=17&lang=1';

const EconomicCalendar = () => {
  const [loadError, setLoadError] = useState(false);

  const handleOpenExternal = () => {
    window.open(CALENDAR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span>ECONOMIC CALENDAR</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenExternal}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open
        </Button>
      </div>
      
      <div className="p-0">
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Economic Calendar cannot be embedded in this environment.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </Button>
          </div>
        ) : (
          <iframe
            src={CALENDAR_URL}
            width="100%"
            className="h-[600px] md:h-[700px] lg:h-[650px] border-0"
            frameBorder="0"
            allowTransparency={true}
            onError={() => setLoadError(true)}
            title="Economic Calendar"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};

export default EconomicCalendar;
