'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StatusChartProps {
  active: number;
  expired: number;
  revoked: number;
}

const COLORS = {
  active: '#22c55e',
  expired: '#eab308',
  revoked: '#ef4444',
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
      <Card>
        <CardHeader>
          <CardTitle>Credential Status</CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No credentials yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credential Status</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => {
                  const numValue = value as number;
                  return [`${numValue} (${((numValue / total) * 100).toFixed(0)}%)`, ''];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
