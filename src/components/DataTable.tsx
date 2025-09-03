
import React, { useState, useMemo } from 'react';
import { ProcessedData, RawClassInstance } from '@/types/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Calendar, DollarSign, Clock, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DataTableProps {
  data: ProcessedData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<keyof ProcessedData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Find the max values for progress bars
  const maxValues = useMemo(() => {
    return {
      totalCheckins: Math.max(...data.map(item => item.totalCheckins)),
      totalRevenue: Math.max(...data.map(item => parseFloat(item.totalRevenue)))
    };
  }, [data]);

  // Filter data based on search query
  const filteredData = data.filter(item => {
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(
      value => value && typeof value === 'string' && value.toLowerCase().includes(query)
    );
  });

  // Sort data based on sort field and direction
  const sortedData = React.useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      // Determine if the values are numeric
      const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
      
      let comparison = 0;
      if (isNumeric) {
        comparison = Number(valueA) - Number(valueB);
      } else {
        comparison = String(valueA).localeCompare(String(valueB));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Calculate pagination
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const startIndex = pageIndex * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Column definitions
  const columns: Array<{ 
    key: keyof ProcessedData; 
    label: string; 
    icon?: React.ReactNode; 
    tooltip?: string;
    isNumeric?: boolean; 
  }> = [
    { key: 'cleanedClass', label: 'Class', icon: <Users size={14} />, tooltip: 'Class type' },
    { key: 'dayOfWeek', label: 'Day', icon: <Calendar size={14} />, tooltip: 'Day of the week' },
    { key: 'classTime', label: 'Time', icon: <Clock size={14} />, tooltip: 'Class time' },
    { key: 'location', label: 'Location', tooltip: 'Class location' },
    { key: 'teacherName', label: 'Instructor', tooltip: 'Class instructor' },
    { key: 'period', label: 'Period', icon: <Calendar size={14} />, tooltip: 'Month and year' },
    { key: 'totalOccurrences', label: 'Occurrences', tooltip: 'Total number of times this class was scheduled', isNumeric: true },
    { key: 'totalCancelled', label: 'Cancelled', tooltip: 'Total cancelled sessions', isNumeric: true },
    { key: 'totalCheckins', label: 'Check-ins', tooltip: 'Total number of check-ins across all occurrences', isNumeric: true },
    { key: 'totalEmpty', label: 'Empty Classes', tooltip: 'Number of classes with zero attendance', isNumeric: true },
    { key: 'totalNonEmpty', label: 'Non-Empty', tooltip: 'Number of classes with at least one attendee', isNumeric: true },
    { key: 'classAverageIncludingEmpty', label: 'Avg. (All)', tooltip: 'Average attendance including empty classes', isNumeric: true },
    { key: 'classAverageExcludingEmpty', label: 'Avg. (Non-Empty)', tooltip: 'Average attendance excluding empty classes', isNumeric: true },
    { key: 'totalRevenue', label: 'Revenue (₹)', icon: <DollarSign size={14} />, tooltip: 'Total revenue generated', isNumeric: true },
    { key: 'totalTime', label: 'Hours', icon: <Clock size={14} />, tooltip: 'Total time in hours', isNumeric: true },
    { key: 'totalNonPaid', label: 'Non-Paid', tooltip: 'Total non-paid customers', isNumeric: true },
  ];

  const toggleRowExpand = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const handlePreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPageIndex(prev => Math.min(pageCount - 1, prev + 1));
  };

  const handleSort = (key: keyof ProcessedData) => {
    if (sortField === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: string | number) => {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    return `₹${numVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const renderCellValue = (row: ProcessedData | RawClassInstance, key: string) => {
    const value = row[key as keyof typeof row];
    
    if (key === 'totalRevenue' || key === 'revenue') {
      return formatCurrency(String(value));
    }
    
    if (value === undefined || value === null) {
      return '—';
    }
    
    return String(value);
  };

  const renderCellWithTooltip = (row: ProcessedData, column: typeof columns[0]) => {
    const value = row[column.key];
    const formattedValue = column.key === 'totalRevenue' ? formatCurrency(String(value)) : String(value);
    
    // For numeric columns, we can add a progress bar
    const showProgress = column.isNumeric && (
      column.key === 'totalCheckins' || 
      column.key === 'totalRevenue' || 
      column.key === 'classAverageIncludingEmpty' ||
      column.key === 'classAverageExcludingEmpty'
    );
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex flex-col w-full",
            column.key === 'cleanedClass' && "font-medium",
            column.isNumeric && "text-right"
          )}>
            <span className={cn(
              column.key === 'totalCheckins' && "font-semibold text-primary",
              (column.key === 'classAverageIncludingEmpty' || column.key === 'classAverageExcludingEmpty') && 
                "font-semibold"
            )}>
              {formattedValue}
            </span>
            
            {showProgress && (
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    column.key === 'totalCheckins' ? 'bg-primary' : 
                    column.key === 'totalRevenue' ? 'bg-green-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (
                      column.key === 'totalRevenue' 
                        ? (parseFloat(String(value)) / maxValues.totalRevenue) * 100 
                        : column.key === 'totalCheckins' 
                          ? (Number(value) / maxValues.totalCheckins) * 100
                          : parseFloat(String(value)) * 10
                    ))}%` 
                  }}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 max-w-xs bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border border-primary/20 shadow-lg rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              {column.icon && <span className="text-primary">{column.icon}</span>}
              <h4 className="font-medium">{column.label}</h4>
            </div>
            <div className="text-sm font-medium">{formattedValue}</div>
            {column.tooltip && (
              <p className="text-xs text-muted-foreground">{column.tooltip}</p>
            )}
            
            {column.key === 'totalCheckins' && (
              <div className="pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average per class:</span>
                  <span>{(Number(row.totalCheckins) / Number(row.totalOccurrences)).toFixed(1)}</span>
                </div>
              </div>
            )}
            
            {column.key === 'totalRevenue' && (
              <div className="pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average per class:</span>
                  <span>{formatCurrency(parseFloat(String(row.totalRevenue)) / Number(row.totalOccurrences))}</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search data across all columns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0">
              <TableRow>
                <TableHead className="w-14 p-2"></TableHead> {/* Expand button column */}
                {columns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className="font-semibold text-xs uppercase whitespace-nowrap px-6 py-4 cursor-pointer min-w-[120px]"
                    onClick={() => handleSort(column.key)}
                  >
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-1">
                          {column.icon && <span className="text-primary mr-1">{column.icon}</span>}
                          {column.label}
                          {sortField === column.key ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : null}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-3 w-64 bg-primary/5 backdrop-blur-sm border border-primary/20 shadow-lg rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            {column.icon && <span className="text-primary">{column.icon}</span>}
                            {column.label}
                          </h4>
                          <p className="text-xs text-muted-foreground">{column.tooltip}</p>
                          <div className="text-xs mt-2 pt-2 border-t">
                            <span className="font-medium">Click to sort</span> by this column
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <TableRow 
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border-b border-slate-200 dark:border-slate-800",
                        expandedRows[row.uniqueID] && "bg-slate-50 dark:bg-slate-900/75"
                      )}
                    >
                      <TableCell className="w-14 p-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-8 w-8 p-0 rounded-full",
                            expandedRows[row.uniqueID] && "bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                          onClick={() => toggleRowExpand(row.uniqueID)}
                        >
                          {expandedRows[row.uniqueID] ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </TableCell>
                      {columns.map((column) => (
                        <TableCell 
                          key={`${rowIndex}-${column.key}`} 
                          className="py-3 px-6 whitespace-nowrap"
                        >
                          {renderCellWithTooltip(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Expanded row details - child rows as table */}
                    {expandedRows[row.uniqueID] && row.rawData && row.rawData.length > 0 && (
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                        <TableCell colSpan={columns.length + 1} className="p-0">
                          <div className="mx-8 my-4 border rounded-lg overflow-hidden">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Detailed Class Occurrences
                              </h4>
                              <Badge className="text-xs">{row.rawData.length} Sessions</Badge>
                            </div>
                            <Table>
                              <TableHeader className="bg-primary/5">
                                <TableRow>
                                  <TableHead className="px-4 py-2 text-xs">Class Date</TableHead>
                                  <TableHead className="px-4 py-2 text-xs">Period</TableHead>
                                  <TableHead className="px-4 py-2 text-xs text-right">Checked In</TableHead>
                                  <TableHead className="px-4 py-2 text-xs text-right">Late Cancellations</TableHead>
                                  <TableHead className="px-4 py-2 text-xs text-right">Revenue (₹)</TableHead>
                                  <TableHead className="px-4 py-2 text-xs text-right">Time (h)</TableHead>
                                  <TableHead className="px-4 py-2 text-xs text-right">Non-Paid</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.rawData.map((childRow, childIndex) => (
                                  <TableRow key={`child-${rowIndex}-${childIndex}`} className="border-b border-slate-100">
                                    <TableCell className="px-4 py-2 text-xs font-medium">
                                      {new Date(childRow.classDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs">
                                      {childRow.period}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs text-right font-medium">
                                      {childRow.checkedIn}
                                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                        <div 
                                          className="h-1 rounded-full bg-primary"
                                          style={{ 
                                            width: `${Math.min(100, childRow.checkedIn * 5)}%` 
                                          }}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs text-right">
                                      {childRow.lateCancelled}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs text-right">
                                      {formatCurrency(childRow.totalRevenue)}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs text-right">
                                      {childRow.totalTime.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-xs text-right">
                                      {childRow.totalNonPaid}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">Total Check-ins</div>
                                <div className="font-medium">{row.totalCheckins}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">Average (All)</div>
                                <div className="font-medium">{row.classAverageIncludingEmpty}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">Total Revenue</div>
                                <div className="font-medium">{formatCurrency(row.totalRevenue)}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">Revenue per Class</div>
                                <div className="font-medium">
                                  {formatCurrency(parseFloat(row.totalRevenue) / row.totalOccurrences)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white dark:bg-gray-950">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePreviousPage} 
                    disabled={pageIndex === 0}
                    className="w-8 h-8 p-0"
                  >
                    <PaginationPrevious className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                  let pageNumber = pageIndex;
                  if (pageCount <= 5) {
                    pageNumber = i;
                  } else if (pageIndex < 3) {
                    pageNumber = i;
                  } else if (pageIndex > pageCount - 4) {
                    pageNumber = pageCount - 5 + i;
                  } else {
                    pageNumber = pageIndex - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <Button
                        variant={pageNumber === pageIndex ? "default" : "outline"}
                        size="icon"
                        className="w-8 h-8 p-0"
                        onClick={() => setPageIndex(pageNumber)}
                      >
                        {pageNumber + 1}
                      </Button>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleNextPage} 
                    disabled={pageIndex === pageCount - 1}
                    className="w-8 h-8 p-0"
                  >
                    <PaginationNext className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
