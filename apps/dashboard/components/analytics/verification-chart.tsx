'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface DailyData {
  date: string;
  verifications_successful: number;
  verifications_failed: number;
  verifications_total: number;
}

interface VerificationChartProps {
  data: DailyData[];
}

export function VerificationChart({ data }: VerificationChartProps) {
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    successful: day.verifications_successful || 0,
    failed: day.verifications_failed || 0,
    total: day.verifications_total || 0,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Verification Activity</CardTitle>
              <CardDescription>Daily verification requests over time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-muted-foreground">No data available yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <CardTitle className="text-base">Verification Activity</CardTitle>
            <CardDescription>Daily verification requests over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Area
                type="monotone"
                dataKey="successful"
                name="Successful"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSuccessful)"
              />
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFailed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/80" />
            <span className="text-xs text-muted-foreground">Successful</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
