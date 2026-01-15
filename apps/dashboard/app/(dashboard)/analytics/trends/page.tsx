'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

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

  const trendColor = data?.trend.direction === 'up' ? 'text-emerald-600' :
                     data?.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600';

  const anomalyCount = data?.anomalies?.filter(a => a.is_anomaly).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-3xl text-black uppercase">Trend Analysis</h1>
          <p className="font-retro text-gray-600 mt-1">
            Analyze trends, forecasts, and anomalies in your data
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px] border-2 border-gray-300 font-retro">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black bg-white">
            <SelectItem value="verifications" className="font-retro">Verifications</SelectItem>
            <SelectItem value="trust_score" className="font-retro">Trust Score</SelectItem>
            <SelectItem value="credentials" className="font-retro">Credentials Issued</SelectItem>
          </SelectContent>
        </Select>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[140px] border-2 border-gray-300 font-retro">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black bg-white">
            <SelectItem value="7" className="font-retro">Last 7 days</SelectItem>
            <SelectItem value="30" className="font-retro">Last 30 days</SelectItem>
            <SelectItem value="90" className="font-retro">Last 90 days</SelectItem>
            <SelectItem value="365" className="font-retro">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] border-2 border-gray-300 font-retro">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent className="border-2 border-black bg-white">
            <SelectItem value="hour" className="font-retro">Hourly</SelectItem>
            <SelectItem value="day" className="font-retro">Daily</SelectItem>
            <SelectItem value="week" className="font-retro">Weekly</SelectItem>
            <SelectItem value="month" className="font-retro">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="border-4 border-red-500 bg-red-50 p-4">
          <p className="font-retro text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <p className="font-retro text-sm text-gray-600 uppercase">Trend</p>
              </div>
              <div className="p-4">
                <div className={`flex items-center gap-2 font-pixel text-xl ${trendColor}`}>
                  <TrendIcon className="h-5 w-5" />
                  {data.trend.change_percent > 0 ? '+' : ''}{data.trend.change_percent}%
                </div>
              </div>
            </div>

            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <p className="font-retro text-sm text-gray-600 uppercase">Average</p>
              </div>
              <div className="p-4">
                <p className="font-pixel text-xl text-black">{data.trend.average.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <p className="font-retro text-sm text-gray-600 uppercase">Min / Max</p>
              </div>
              <div className="p-4">
                <p className="font-pixel text-xl text-black">{data.trend.min} / {data.trend.max}</p>
              </div>
            </div>

            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <p className="font-retro text-sm text-gray-600 uppercase">Anomalies</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 font-pixel text-xl text-black">
                  {anomalyCount > 0 && (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  {anomalyCount}
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border-4 border-black bg-white">
            <div className="bg-gray-50 border-b-4 border-black p-4">
              <h2 className="font-pixel text-lg text-black uppercase">Data Points</h2>
              <p className="font-retro text-sm text-gray-600">
                {data.data.length} data points over {data.days} days
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.data.map((point, i) => {
                  const anomaly = data.anomalies?.find(
                    a => a.timestamp === point.timestamp
                  );
                  const isAnomaly = anomaly?.is_anomaly;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 border-2 ${
                        isAnomaly ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <span className="font-retro text-gray-600 text-sm">
                        {new Date(point.timestamp).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-retro font-bold text-black">{point.value}</span>
                        {isAnomaly && (
                          <span className="font-retro text-xs uppercase px-2 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-300">
                            Anomaly
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Forecast */}
          {data.forecast && data.forecast.length > 0 && (
            <div className="border-4 border-black bg-white">
              <div className="bg-gray-50 border-b-4 border-black p-4">
                <h2 className="font-pixel text-lg text-black uppercase">Forecast</h2>
                <p className="font-retro text-sm text-gray-600">
                  Projected values for the next {data.forecast.length} periods
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {data.forecast.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border-2 border-blue-300 bg-blue-50"
                    >
                      <span className="font-retro text-gray-600 text-sm">
                        {new Date(point.timestamp).toLocaleDateString()}
                      </span>
                      <span className="font-retro font-bold text-blue-600">{point.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
