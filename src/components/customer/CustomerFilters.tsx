import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';

interface CustomerFiltersProps {
  search?: string;
  status?: string;
  industry?: string;
  industries: string[];
  totalResults: number;
  filteredResults: number;
}

export default function CustomerFilters({
  search = '',
  status = 'all',
  industry = 'all',
  industries,
  totalResults,
  filteredResults
}: CustomerFiltersProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <CardTitle className="text-gray-800">Search & Filter</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form method="GET" className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                name="search"
                placeholder="Search customers..."
                defaultValue={search}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              name="status"
              defaultValue={status}
              className="w-full sm:w-[140px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              name="industry"
              defaultValue={industry}
              className="w-full sm:w-[160px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              Filter
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredResults > 0 && (
              <span>
                Showing <span className="font-semibold">{filteredResults}</span> of{' '}
                <span className="font-semibold">{totalResults}</span> customers
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
