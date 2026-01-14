'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

interface StatusChartProps {
  active: number;
  expired: number;
  revoked: number;
}

const COLORS = {
  active: '#10b981',  // emerald-500
  expired: '#f59e0b', // amber-500
  revoked: '#ef4444', // red-500
};

export function StatusChart({ active, expired, revoked }: StatusChartProps) {
  const data = [
    { name: 'Active', value: active, color: COLORS.active },
    { name: 'Expired', value: expired, color: COLORS.expired },
    { name: 'Revoked', value: revoked, color: COLORS.revoked },
  ].filter((item) => item.value > 0);

  const total = active + expired + revoked;

  if (total === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <CardTitle className="text-base">Credential Status</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <PieChartIcon className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-muted-foreground">No credentials yet</p>
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
            <PieChartIcon className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <CardTitle className="text-base">Credential Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}
                formatter={(value) => {
                  const numValue = value as number;
                  return [`${numValue} (${((numValue / total) * 100).toFixed(0)}%)`, ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom Legend */}
        <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
          {[
            { name: 'Active', value: active, color: COLORS.active },
            { name: 'Expired', value: expired, color: COLORS.expired },
            { name: 'Revoked', value: revoked, color: COLORS.revoked },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium">
                {item.value} <span className="text-muted-foreground">({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
