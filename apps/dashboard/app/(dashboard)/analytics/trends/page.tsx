'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface TrendData {
  metric: string;
  period: string;
  days: number;
  data: DataPoint[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    change_percent: number;
    average: number;
    min: number;
    max: number;
  };
  forecast?: DataPoint[];
  anomalies?: {
    timestamp: string;
    value: number;
    expected: number;
    deviation: number;
    is_anomaly: boolean;
  }[];
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [metric, setMetric] = useState('verifications');
  const [days, setDays] = useState('30');
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    fetchTrends();
  }, [metric, days, period]);

  async function fetchTrends() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        metric,
        days,
        period,
        include_forecast: 'true',
        include_anomalies: 'true',
      });

      const res = await fetch(`/api/analytics/trends?${params}`);
      const json = await res.json();

      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || 'Failed to fetch trends');
      }
    } catch {
      setError('Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  }

  const TrendIcon = data?.trend.direction === 'up' ? TrendingUp :
                    data?.trend.direction === 'down' ? TrendingDown : Minus;

  const trendColor = data?.trend.direction === 'up' ? 'text-emerald-400' :
                     data?.trend.direction === 'down' ? 'text-red-400' : 'text-white/60';

  const anomalyCount = data?.anomalies?.filter(a => a.is_anomaly).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Trend Analysis</h1>
          <p className="text-white/60 mt-1">
            Analyze trends, forecasts, and anomalies in your data
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verifications">Verifications</SelectItem>
            <SelectItem value="trust_score">Trust Score</SelectItem>
            <SelectItem value="credentials">Credentials Issued</SelectItem>
          </SelectContent>
        </Select>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Hourly</SelectItem>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        </div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trend</CardDescription>
                <CardTitle className={`flex items-center gap-2 ${trendColor}`}>
                  <TrendIcon className="h-5 w-5" />
                  {data.trend.change_percent > 0 ? '+' : ''}{data.trend.change_percent}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average</CardDescription>
                <CardTitle>{data.trend.average.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Min / Max</CardDescription>
                <CardTitle>{data.trend.min} / {data.trend.max}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Anomalies</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  {anomalyCount > 0 && (
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  )}
                  {anomalyCount}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Points</CardTitle>
              <CardDescription>
                {data.data.length} data points over {data.days} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.data.map((point, i) => {
                  const anomaly = data.anomalies?.find(
                    a => a.timestamp === point.timestamp
                  );
                  const isAnomaly = anomaly?.is_anomaly;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isAnomaly ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'
                      }`}
                    >
                      <span className="text-white/60 text-sm">
                        {new Date(point.timestamp).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{point.value}</span>
                        {isAnomaly && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                            Anomaly
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Forecast */}
          {data.forecast && data.forecast.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Forecast</CardTitle>
                <CardDescription>
                  Projected values for the next {data.forecast.length} periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.forecast.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    >
                      <span className="text-white/60 text-sm">
                        {new Date(point.timestamp).toLocaleDateString()}
                      </span>
                      <span className="font-medium text-blue-400">{point.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
