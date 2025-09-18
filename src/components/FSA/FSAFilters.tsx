import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  RefreshCw,
  Download,
  Clock,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FSAFiltersProps {
  currentTimeframe: string;
  currentZoneId?: string;
}

export default function FSAFilters({
  currentTimeframe,
  currentZoneId
}: FSAFiltersProps) {
  const router = useRouter();
  
  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];
  
  const handleTimeframeChange = (timeframe: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('timeframe', timeframe);
    router.push(`?${params.toString()}`);
  };
  
  const handleClearZone = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('zoneId');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Timeframe Selection */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Timeframe Filter */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Timeframe</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleTimeframeChange(timeframe.value)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
                  currentTimeframe === timeframe.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
        {/* Zone Filter */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Zone</span>
          </div>
          <div className="flex items-center gap-3">
            {currentZoneId ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 shadow-md">
                <span className="text-sm font-bold text-green-700">
                  Zone {currentZoneId}
                </span>
                <button
                  onClick={handleClearZone}
                  className="text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-1 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 font-medium italic bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                All zones
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-purple-200/50">
        <form method="GET">
          <input type="hidden" name="timeframe" value={currentTimeframe} />
          {currentZoneId && <input type="hidden" name="zoneId" value={currentZoneId} />}
          <input type="hidden" name="refresh" value="true" />
          <Button 
            type="submit" 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300 hover:bg-green-100 text-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Refresh</span>
          </Button>
        </form>
        
        <form action="/api/fsa/export" method="POST">
          <input type="hidden" name="timeframe" value={currentTimeframe} />
          {currentZoneId && <input type="hidden" name="zoneId" value={currentZoneId} />}
          <Button 
            type="submit"
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
