// Server-side component - charts replaced with static summaries

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportData } from './types';

interface IndustrialDataReportProps {
  reportData: ReportData;
}

export function IndustrialDataReport({ reportData }: IndustrialDataReportProps) {
  if (!reportData) return null;
  
  return (
    <div className="space-y-6">
      {/* Machine Downtime Summary */}
      {reportData.machineDowntime && reportData.machineDowntime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Machine Downtime Summary</CardTitle>
            <CardDescription>Overview of machine downtime metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {reportData.summary?.totalMachinesWithDowntime || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Machines</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(reportData.summary?.totalDowntimeHours * 10) / 10 || 0} hrs
                  </div>
                  <div className="text-sm text-green-700">Total Downtime</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-amber-50 to-amber-100">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-amber-900">
                    {Math.floor(reportData.summary?.averageDowntimePerMachine / 60) || 0}h {reportData.summary?.averageDowntimePerMachine % 60 || 0}m
                  </div>
                  <div className="text-sm text-amber-700">Avg. Downtime/Machine</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.floor(Math.min(...reportData.machineDowntime.map((m: any) => m.totalDowntimeMinutes || 0)) / 60) || 0}h {Math.min(...reportData.machineDowntime.map((m: any) => m.totalDowntimeMinutes || 0)) % 60 || 0}m
                  </div>
                  <div className="text-sm text-purple-700">Min. Downtime</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Downtime Table */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Detailed Downtime</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Downtime</TableHead>
                      <TableHead>Incidents</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.machineDowntime.map((machine: any) => (
                      <TableRow key={machine.machineId}>
                        <TableCell className="font-medium">{machine.machineId}</TableCell>
                        <TableCell>{machine.customer}</TableCell>
                        <TableCell>{(machine.totalDowntimeMinutes / 60).toFixed(1)} hrs</TableCell>
                        <TableCell>{machine.incidents}</TableCell>
                        <TableCell>{machine.openIncidents}</TableCell>
                        <TableCell>{machine.resolvedIncidents}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
