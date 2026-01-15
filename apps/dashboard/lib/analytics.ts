/**
 * Analytics utilities for trend analysis and forecasting
 */

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  change_percent: number;
  average: number;
  min: number;
  max: number;
}

export interface AnomalyResult {
  timestamp: string;
  value: number;
  expected: number;
  deviation: number;
  is_anomaly: boolean;
}

/**
 * Calculate trend from data points
 */
export function calculateTrend(data: DataPoint[]): TrendAnalysis {
  if (data.length === 0) {
    return {
      direction: 'stable',
      change_percent: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const values = data.map(d => d.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate change from first to last value
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const changePercent = firstValue !== 0
    ? ((lastValue - firstValue) / firstValue) * 100
    : 0;

  // Determine direction
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (changePercent > 5) {
    direction = 'up';
  } else if (changePercent < -5) {
    direction = 'down';
  }

  return {
    direction,
    change_percent: Math.round(changePercent * 100) / 100,
    average: Math.round(average * 100) / 100,
    min,
    max,
  };
}

/**
 * Calculate moving average for smoothing
 */
export function movingAverage(data: DataPoint[], windowSize: number): DataPoint[] {
  if (data.length < windowSize) return data;

  const result: DataPoint[] = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, d) => sum + d.value, 0) / windowSize;
    result.push({
      timestamp: data[i].timestamp,
      value: Math.round(avg * 100) / 100,
    });
  }

  return result;
}

/**
 * Detect anomalies using simple standard deviation method
 */
export function detectAnomalies(
  data: DataPoint[],
  threshold: number = 2
): AnomalyResult[] {
  if (data.length < 3) {
    return data.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
      expected: d.value,
      deviation: 0,
      is_anomaly: false,
    }));
  }

  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);

  return data.map(d => {
    const deviation = stdDev !== 0 ? (d.value - mean) / stdDev : 0;
    return {
      timestamp: d.timestamp,
      value: d.value,
      expected: Math.round(mean * 100) / 100,
      deviation: Math.round(deviation * 100) / 100,
      is_anomaly: Math.abs(deviation) > threshold,
    };
  });
}

/**
 * Simple linear forecast for next N periods
 */
export function forecast(data: DataPoint[], periods: number): DataPoint[] {
  if (data.length < 2) return [];

  // Simple linear regression
  const n = data.length;
  const values = data.map(d => d.value);
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Get time interval from data
  const firstDate = new Date(data[0].timestamp);
  const lastDate = new Date(data[data.length - 1].timestamp);
  const intervalMs = (lastDate.getTime() - firstDate.getTime()) / (n - 1);

  // Generate forecast
  const result: DataPoint[] = [];
  for (let i = 0; i < periods; i++) {
    const futureIndex = n + i;
    const forecastValue = intercept + slope * futureIndex;
    const forecastDate = new Date(lastDate.getTime() + intervalMs * (i + 1));

    result.push({
      timestamp: forecastDate.toISOString(),
      value: Math.max(0, Math.round(forecastValue * 100) / 100), // Don't go negative
    });
  }

  return result;
}

/**
 * Group data by time period (hour, day, week, month)
 */
export function groupByPeriod(
  data: DataPoint[],
  period: 'hour' | 'day' | 'week' | 'month'
): DataPoint[] {
  const groups = new Map<string, number[]>();

  for (const point of data) {
    const date = new Date(point.timestamp);
    let key: string;

    switch (period) {
      case 'hour':
        key = `${date.toISOString().slice(0, 13)}:00:00.000Z`;
        break;
      case 'day':
        key = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10) + 'T00:00:00.000Z';
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;
        break;
    }

    const existing = groups.get(key) || [];
    existing.push(point.value);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .map(([timestamp, values]) => ({
      timestamp,
      value: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
