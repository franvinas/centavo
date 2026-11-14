export interface AnalyticsSummary {
  totalSpent: number;
  transactionCount: number;
  dailyAverage: number;
  pendingConversionCount?: number;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
  pendingConversionCount?: number;
}

export interface TimeSeriesPoint {
  period: string; // "YYYY-MM"
  total: number;
  pendingConversionCount?: number;
}

export interface CurrencySpending {
  currency: string;
  originalTotal: number;
  baseTotal: number;
  count: number;
  pendingConversionCount?: number;
}

export interface TagSpending {
  tagId: string;
  name: string;
  total: number;
  count: number;
  pendingConversionCount?: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  byCategory: CategorySpending[];
  overTime: TimeSeriesPoint[];
  byCurrency: CurrencySpending[];
  byTag: TagSpending[];
  baseCurrency: string;
  periodLabel: string;
  /** Selected period as YYYY-MM-DD, used to link to the filtered list. */
  periodFrom: string;
  periodTo: string;
  timePeriodLabel: string;
}
