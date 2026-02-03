export interface AnalyticsSummary {
  totalSpent: number;
  transactionCount: number;
  dailyAverage: number;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
}

export interface TimeSeriesPoint {
  period: string; // "YYYY-MM"
  total: number;
}

export interface CurrencySpending {
  currency: string;
  originalTotal: number;
  baseTotal: number;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  byCategory: CategorySpending[];
  overTime: TimeSeriesPoint[];
  byCurrency: CurrencySpending[];
  baseCurrency: string;
  periodLabel: string;
  timePeriodLabel: string;
}
