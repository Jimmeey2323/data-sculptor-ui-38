
import React, { useState, useMemo } from 'react';
import { ProcessedData, PivotData } from '@/types/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Dumbbell, ArrowDown, ArrowUp, PieChart, Grid, DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';

interface PivotViewProps {
  data: ProcessedData[];
}

type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max';

interface PivotCellData {
  value: number;
  count: number;
  raw: ProcessedData[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#f43f5e', '#0ea5e9', '#10b981'];

const PivotView: React.FC<PivotViewProps> = ({ data }) => {
  const [rowField, setRowField] = useState<keyof ProcessedData>('dayOfWeek');
  const [columnField, setColumnField] = useState<keyof ProcessedData>('cleanedClass');
  const [valueField, setValueField] = useState<keyof ProcessedData>('totalCheckins');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [selectedCell, setSelectedCell] = useState<{row: string, column: string} | null>(null);
  const [viewType, setViewType] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedLegendItem, setSelectedLegendItem] = useState<number | null>(null);

  const fields = [
    { key: 'cleanedClass', label: 'Class Type' },
    { key: 'dayOfWeek', label: 'Day of Week' },
    { key: 'classTime', label: 'Class Time' },
    { key: 'location', label: 'Location' },
    { key: 'teacherName', label: 'Instructor' },
    { key: 'period', label: 'Period' }
  ];
  
  const valueFields = [
    { key: 'totalCheckins', label: 'Total Check-ins' },
    { key: 'totalOccurrences', label: 'Total Occurrences' },
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'classAverageIncludingEmpty', label: 'Average Attendance (All)' },
    { key: 'classAverageExcludingEmpty', label: 'Average Attendance (Non-Empty)' }
  ];

  const pivotData = useMemo(() => {
    // Get unique values for rows and columns
    const rowValues = [...new Set(data.map(item => String(item[rowField])))].sort();
    const columnValues = [...new Set(data.map(item => String(item[columnField])))].sort();
    
    // Initialize pivot data structure
    const pivotMap: Record<string, Record<string, PivotCellData>> = {};
    
    // Initialize row totals
    const rowTotals: Record<string, PivotCellData> = {};
    rowValues.forEach(row => {
      rowTotals[row] = { value: 0, count: 0, raw: [] };
    });
    
    // Initialize column totals
    const columnTotals: Record<string, PivotCellData> = {};
    columnValues.forEach(col => {
      columnTotals[col] = { value: 0, count: 0, raw: [] };
    });
    
    // Initialize grand total
    let grandTotal: PivotCellData = { value: 0, count: 0, raw: [] };
    
    // Populate pivot data structure
    rowValues.forEach(row => {
      pivotMap[row] = {};
      columnValues.forEach(col => {
        pivotMap[row][col] = { value: 0, count: 0, raw: [] };
      });
    });
    
    // Calculate values
    data.forEach(item => {
      const row = String(item[rowField]);
      const col = String(item[columnField]);
      
      if (rowValues.includes(row) && columnValues.includes(col)) {
        let value = 0;
        
        // Handle numeric conversions
        if (typeof item[valueField] === 'string') {
          value = parseFloat(item[valueField] as string) || 0;
        } else {
          value = Number(item[valueField]) || 0;
        }
        
        // Skip NaN values
        if (isNaN(value)) return;
        
        // Update cell data
        pivotMap[row][col].value += value;
        pivotMap[row][col].count += 1;
        pivotMap[row][col].raw.push(item);
        
        // Update row total
        rowTotals[row].value += value;
        rowTotals[row].count += 1;
        rowTotals[row].raw.push(item);
        
        // Update column total
        columnTotals[col].value += value;
        columnTotals[col].count += 1;
        columnTotals[col].raw.push(item);
        
        // Update grand total
        grandTotal.value += value;
        grandTotal.count += 1;
        grandTotal.raw.push(item);
      }
    });
    
    return {
      rowValues,
      columnValues,
      pivotMap,
      rowTotals,
      columnTotals,
      grandTotal
    };
  }, [data, rowField, columnField, valueField]);

  const calculateAggregatedValue = (cellData: PivotCellData): number => {
    if (cellData.count === 0) return 0;
    
    switch (aggregation) {
      case 'sum':
        return cellData.value;
      case 'average':
        return cellData.value / cellData.count;
      case 'count':
        return cellData.count;
      case 'min':
        if (cellData.raw.length === 0) return 0;
        return Math.min(...cellData.raw.map(item => {
          const val = item[valueField];
          return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
        }));
      case 'max':
        if (cellData.raw.length === 0) return 0;
        return Math.max(...cellData.raw.map(item => {
          const val = item[valueField];
          return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
        }));
      default:
        return cellData.value;
    }
  };

  const formatValue = (value: number): string => {
    if (valueField === 'totalRevenue') {
      return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    
    if (aggregation === 'average') {
      return value.toFixed(1);
    }
    
    return value.toLocaleString('en-IN');
  };

  const chartData = useMemo(() => {
    return pivotData.rowValues.map(row => {
      const rowData: Record<string, any> = { name: row };
      
      pivotData.columnValues.forEach(col => {
        rowData[col] = calculateAggregatedValue(pivotData.pivotMap[row][col]);
      });
      
      return rowData;
    });
  }, [pivotData, aggregation]);

  const pieData = useMemo(() => {
    if (selectedLegendItem !== null) {
      const columnName = pivotData.columnValues[selectedLegendItem];
      return pivotData.rowValues.map(row => ({
        name: row,
        value: calculateAggregatedValue(pivotData.pivotMap[row][columnName])
      }));
    }
    
    return pivotData.columnValues.map(col => ({
      name: col,
      value: calculateAggregatedValue(pivotData.columnTotals[col])
    }));
  }, [pivotData, aggregation, selectedLegendItem]);

  const maxCellValue = useMemo(() => {
    let max = 0;
    
    pivotData.rowValues.forEach(row => {
      pivotData.columnValues.forEach(col => {
        const value = calculateAggregatedValue(pivotData.pivotMap[row][col]);
        if (value > max) max = value;
      });
    });
    
    return max;
  }, [pivotData, aggregation]);

  const handleCellClick = (row: string, column: string) => {
    setSelectedCell({ row, column });
  };

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border p-2 shadow-md">
          <CardContent className="p-3">
            <p className="font-medium">{label}</p>
            <div className="space-y-1 mt-2">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}: {formatValue(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Custom active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{payload.name}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`${formatValue(value)} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Label htmlFor="row-field">Row Field</Label>
          <Select value={rowField as string} onValueChange={(value) => setRowField(value as keyof ProcessedData)}>
            <SelectTrigger id="row-field">
              <SelectValue placeholder="Select row field" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:col-span-2">
          <Label htmlFor="column-field">Column Field</Label>
          <Select value={columnField as string} onValueChange={(value) => setColumnField(value as keyof ProcessedData)}>
            <SelectTrigger id="column-field">
              <SelectValue placeholder="Select column field" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:col-span-1">
          <Label htmlFor="value-field">Value Field</Label>
          <Select value={valueField as string} onValueChange={(value) => setValueField(value as keyof ProcessedData)}>
            <SelectTrigger id="value-field">
              <SelectValue placeholder="Select value field" />
            </SelectTrigger>
            <SelectContent>
              {valueFields.map((field) => (
                <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:col-span-2">
          <Label htmlFor="aggregation">Aggregation</Label>
          <Select value={aggregation} onValueChange={(value) => setAggregation(value as AggregationType)}>
            <SelectTrigger id="aggregation">
              <SelectValue placeholder="Select aggregation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="count">Count</SelectItem>
              <SelectItem value="min">Minimum</SelectItem>
              <SelectItem value="max">Maximum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:col-span-3 flex items-end gap-2">
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'table' | 'chart')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                {chartType === 'bar' ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <PieChart className="h-4 w-4" />
                )}
                Chart View
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {viewType === 'chart' && (
            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChartType(chartType === 'bar' ? 'pie' : 'bar')}
                className="h-10"
              >
                {chartType === 'bar' ? (
                  <PieChart className="h-4 w-4 mr-1" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-1" />
                )}
                {chartType === 'bar' ? 'Pie' : 'Bar'}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {viewType === 'table' ? (
        <div className="overflow-auto border rounded-lg bg-white dark:bg-gray-950 shadow">
          <Table>
            <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0">
              <TableRow>
                <TableHead className="min-w-[120px] whitespace-nowrap font-bold">{fields.find(f => f.key === rowField)?.label || 'Row'}</TableHead>
                {pivotData.columnValues.map((col) => (
                  <TableHead key={col} className="text-center whitespace-nowrap min-w-[100px]">{col}</TableHead>
                ))}
                <TableHead className="text-center font-bold bg-slate-200 dark:bg-slate-700">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pivotData.rowValues.map((row) => (
                <TableRow key={row}>
                  <TableCell className="font-medium whitespace-nowrap">{row}</TableCell>
                  {pivotData.columnValues.map((col) => {
                    const cellData = pivotData.pivotMap[row][col];
                    const value = calculateAggregatedValue(cellData);
                    const percentage = maxCellValue > 0 ? (value / maxCellValue) * 100 : 0;
                    
                    return (
                      <TableCell 
                        key={col} 
                        className={`text-center relative cursor-pointer transition-colors ${
                          selectedCell?.row === row && selectedCell?.column === col ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleCellClick(row, col)}
                      >
                        <div className="relative">
                          <div className="z-10 relative">
                            {formatValue(value)}
                            {cellData.count > 0 && (
                              <Badge variant="outline" className="ml-1.5 text-xs">
                                {cellData.count}
                              </Badge>
                            )}
                          </div>
                          <div 
                            className="absolute inset-0 bg-primary/10 rounded"
                            style={{ width: `${percentage}%`, height: '100%' }}
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold bg-slate-100 dark:bg-slate-800">
                    {formatValue(calculateAggregatedValue(pivotData.rowTotals[row]))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-200 dark:bg-slate-700 font-bold">
                <TableCell>Total</TableCell>
                {pivotData.columnValues.map((col) => (
                  <TableCell key={col} className="text-center">
                    {formatValue(calculateAggregatedValue(pivotData.columnTotals[col]))}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  {formatValue(calculateAggregatedValue(pivotData.grandTotal))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : chartType === 'bar' ? (
        <div className="bg-white dark:bg-gray-950 border rounded-lg p-4 shadow-sm" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                onClick={(e) => {
                  if (selectedLegendItem === e.dataKey) {
                    setSelectedLegendItem(null);
                  } else {
                    setSelectedLegendItem(pivotData.columnValues.findIndex(col => col === e.dataKey));
                  }
                }}
              />
              {pivotData.columnValues.map((column, index) => (
                <Bar 
                  key={column} 
                  dataKey={column} 
                  fill={COLORS[index % COLORS.length]} 
                  name={column}
                  opacity={selectedLegendItem === null || selectedLegendItem === index ? 1 : 0.3}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 border rounded-lg p-4 shadow-sm" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                activeIndex={selectedLegendItem}
                activeShape={renderActiveShape}
                outerRadius={150}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(_, index) => setSelectedLegendItem(index)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatValue(Number(value))} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                onClick={(e, index) => {
                  if (selectedLegendItem === index) {
                    setSelectedLegendItem(null);
                  } else {
                    setSelectedLegendItem(index);
                  }
                }}
              />
            </RechartPieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {selectedCell && (
        <Card className="mt-4 bg-slate-50 dark:bg-slate-900 border shadow-sm">
          <CardHeader className="bg-primary/5 p-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                <span className="font-normal text-muted-foreground">Cell Details:</span> {selectedCell.row} × {selectedCell.column}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)}>
                <ArrowUp className="h-4 w-4 mr-1" />
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-950 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-2xl font-bold mt-1">
                  {formatValue(pivotData.pivotMap[selectedCell.row][selectedCell.column].value)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Count</div>
                <div className="text-2xl font-bold mt-1">
                  {pivotData.pivotMap[selectedCell.row][selectedCell.column].count}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Average Value</div>
                <div className="text-2xl font-bold mt-1">
                  {pivotData.pivotMap[selectedCell.row][selectedCell.column].count > 0
                    ? formatValue(pivotData.pivotMap[selectedCell.row][selectedCell.column].value / 
                        pivotData.pivotMap[selectedCell.row][selectedCell.column].count)
                    : 0
                  }
                </div>
              </div>
            </div>
            
            {pivotData.pivotMap[selectedCell.row][selectedCell.column].raw.length > 0 && (
              <div className="overflow-auto max-h-80 border rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Day & Time</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Check-ins</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pivotData.pivotMap[selectedCell.row][selectedCell.column].raw.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.cleanedClass}</TableCell>
                        <TableCell>{item.dayOfWeek}, {item.classTime}</TableCell>
                        <TableCell>{item.teacherName}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-right">{item.totalCheckins}</TableCell>
                        <TableCell className="text-right">{formatValue(parseFloat(item.totalRevenue))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PivotView;
