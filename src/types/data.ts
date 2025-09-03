
export interface ClassData {
  'Class name': string;
  'Class date': string;
  'Location': string;
  'Teacher First Name': string;
  'Teacher Last Name': string;
  'Checked in': string;
  'Late cancellations': string;
  'Total Revenue': string;
  'Time (h)': string;
  'Non Paid Customers': string;
}

export interface RawClassInstance {
  classDate: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
  period: string;
  checkedIn: number;
  lateCancelled: number;
  totalRevenue: number;
  totalTime: number;
  totalNonPaid: number;
}

export interface ProcessedData {
  uniqueID: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  location: string;
  teacherName: string;
  period: string;
  totalOccurrences: number;
  totalCancelled: number;
  totalCheckins: number;
  totalEmpty: number;
  totalNonEmpty: number;
  classAverageIncludingEmpty: string;
  classAverageExcludingEmpty: string;
  totalRevenue: string;
  totalTime: string;
  totalNonPaid: number;
  rawData?: RawClassInstance[];
}

export interface FilterOption {
  field: keyof ProcessedData;
  operator: string;
  value: string;
}

export interface SortOption {
  field: keyof ProcessedData;
  direction: 'asc' | 'desc';
}

export interface MetricData {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  drilldown?: {
    title: string;
    items: Array<{
      label: string;
      value: string | number;
    }>;
  };
}

export type ViewMode = 'table' | 'grid' | 'kanban' | 'timeline' | 'pivot';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'scatter';
  dataKey: keyof ProcessedData;
  labelKey?: keyof ProcessedData;
  title: string;
  showLegend?: boolean;
}

export interface TopBottomClassData {
  id: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  teacherName: string;
  location: string;
  averageAttendance: number;
  totalOccurrences: number;
  totalCheckins: number;
  totalRevenue: number;
  isTopPerformer: boolean;
  detailedData: ProcessedData[];
}

export interface KanbanItem {
  id: string;
  title: string;
  data: ProcessedData;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  content: string;
  data: ProcessedData;
}

export interface PivotData {
  rowField: keyof ProcessedData;
  columnField: keyof ProcessedData;
  valueField: keyof ProcessedData;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
}

export interface TopBottomOptions {
  count: number;
  includeTrainers: boolean;
  minOccurrences: number;
}
