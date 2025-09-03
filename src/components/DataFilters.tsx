import React, { useState, useEffect } from 'react';
import { ProcessedData, FilterOption, SortOption } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Filter, SortAsc, SortDesc, X, Plus, Save, RotateCcw, FileDown, FileUp, Settings, Star, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DataFiltersProps {
  onFilterChange: (filters: FilterOption[]) => void;
  onSortChange: (sortOptions: SortOption[]) => void;
  data: ProcessedData[];
  activeFilters: number;
}

const DataFilters: React.FC<DataFiltersProps> = ({
  onFilterChange,
  onSortChange,
  data,
  activeFilters
}) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [newFilterField, setNewFilterField] = useState<keyof ProcessedData>('cleanedClass');
  const [newFilterOperator, setNewFilterOperator] = useState('contains');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [newSortField, setNewSortField] = useState<keyof ProcessedData>('cleanedClass');
  const [newSortDirection, setNewSortDirection] = useState<'asc' | 'desc'>('asc');
  const [savedFilters, setSavedFilters] = useState<{
    name: string;
    filters: FilterOption[];
  }[]>([]);
  const [newFilterSetName, setNewFilterSetName] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['filters', 'date']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  
  // Date range filters
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  // Revenue range
  const [revenueRange, setRevenueRange] = useState<{
    min: string;
    max: string;
  }>({
    min: '',
    max: ''
  });

  // Attendance range
  const [attendanceRange, setAttendanceRange] = useState<{
    min: string;
    max: string;
  }>({
    min: '',
    max: ''
  });

  const fields: Array<{
    key: keyof ProcessedData;
    label: string;
  }> = [{
    key: 'cleanedClass',
    label: 'Class Type'
  }, {
    key: 'dayOfWeek',
    label: 'Day of Week'
  }, {
    key: 'classTime',
    label: 'Class Time'
  }, {
    key: 'location',
    label: 'Location'
  }, {
    key: 'teacherName',
    label: 'Instructor'
  }, {
    key: 'period',
    label: 'Period'
  }, {
    key: 'totalOccurrences',
    label: 'Total Occurrences'
  }, {
    key: 'totalCheckins',
    label: 'Total Check-ins'
  }, {
    key: 'totalRevenue',
    label: 'Total Revenue'
  }, {
    key: 'classAverageIncludingEmpty',
    label: 'Average Attendance (All)'
  }, {
    key: 'classAverageExcludingEmpty',
    label: 'Average Attendance (Non-Empty)'
  }];
  
  const operators = [{
    value: 'contains',
    label: 'Contains'
  }, {
    value: 'equals',
    label: 'Equals'
  }, {
    value: 'starts',
    label: 'Starts With'
  }, {
    value: 'ends',
    label: 'Ends With'
  }, {
    value: 'greater',
    label: 'Greater Than'
  }, {
    value: 'less',
    label: 'Less Than'
  }];

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    const savedFiltersData = localStorage.getItem('savedFilters');
    if (savedFiltersData) {
      try {
        setSavedFilters(JSON.parse(savedFiltersData));
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
  }, []);

  const addFilter = () => {
    if (!newFilterField || !newFilterOperator) return;
    
    if (newFilterField === 'period' && selectedPeriods.length > 0) {
      const periodFilters = selectedPeriods.map(period => ({
        field: 'period' as keyof ProcessedData,
        operator: 'equals',
        value: period
      }));
      
      const updatedFilters = [...filters.filter(f => f.field !== 'period'), ...periodFilters];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    } else if (newFilterValue) {
      const newFilter: FilterOption = {
        field: newFilterField,
        operator: newFilterOperator,
        value: newFilterValue
      };
      
      const updatedFilters = [...filters, newFilter];
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
      setNewFilterValue('');
    }
    
    if (!expanded.includes('filters')) {
      setExpanded([...expanded, 'filters']);
    }
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const addSortOption = () => {
    const newSort: SortOption = {
      field: newSortField,
      direction: newSortDirection
    };
    
    const updatedSortOptions = [...sortOptions, newSort];
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
    
    if (!expanded.includes('sort')) {
      setExpanded([...expanded, 'sort']);
    }
  };

  const removeSortOption = (index: number) => {
    const updatedSortOptions = sortOptions.filter((_, i) => i !== index);
    setSortOptions(updatedSortOptions);
    onSortChange(updatedSortOptions);
  };

  const resetFiltersAndSort = () => {
    setFilters([]);
    setSortOptions([]);
    setSelectedPeriods([]);
    setDateRange({ from: undefined, to: undefined });
    setRevenueRange({ min: '', max: '' });
    setAttendanceRange({ min: '', max: '' });
    onFilterChange([]);
    onSortChange([]);
  };

  const saveCurrentFilters = () => {
    if (!newFilterSetName || filters.length === 0) return;
    
    const newSavedFilters = [...savedFilters, {
      name: newFilterSetName,
      filters: [...filters]
    }];
    
    setSavedFilters(newSavedFilters);
    setNewFilterSetName('');
    localStorage.setItem('savedFilters', JSON.stringify(newSavedFilters));
  };

  const loadSavedFilter = (savedFilter: {
    name: string;
    filters: FilterOption[];
  }) => {
    setFilters(savedFilter.filters);
    onFilterChange(savedFilter.filters);
  };

  const getUniqueValues = (field: keyof ProcessedData): string[] => {
    const values = data.map(item => String(item[field]));
    return [...new Set(values)].sort();
  };

  const handlePeriodChange = (period: string, checked: boolean) => {
    if (checked) {
      setSelectedPeriods(prev => [...prev, period]);
    } else {
      setSelectedPeriods(prev => prev.filter(p => p !== period));
    }
  };

  const applyDateRangeFilter = () => {
    if (!dateRange.from) return;

    let dateFilters: FilterOption[] = [];
    
    // Remove any existing date filters
    const nonDateFilters = filters.filter(f => f.field !== 'period');
    
    if (dateRange.from) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      dateFilters.push({
        field: 'period' as keyof ProcessedData, 
        operator: 'greater',
        value: fromDate
      });
    }
    
    if (dateRange.to) {
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      dateFilters.push({
        field: 'period' as keyof ProcessedData,
        operator: 'less',
        value: toDate
      });
    }
    
    const updatedFilters = [...nonDateFilters, ...dateFilters];
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const applyNumericRangeFilter = (
    field: keyof ProcessedData, 
    min: string, 
    max: string
  ) => {
    if (!min && !max) return;
    
    // Remove any existing filters for this field
    const otherFilters = filters.filter(f => f.field !== field);
    let rangeFilters: FilterOption[] = [];
    
    if (min) {
      rangeFilters.push({
        field,
        operator: 'greater',
        value: min
      });
    }
    
    if (max) {
      rangeFilters.push({
        field,
        operator: 'less',
        value: max
      });
    }
    
    const updatedFilters = [...otherFilters, ...rangeFilters];
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Card className="bg-white dark:bg-gray-950 shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              {activeFilters > 0 && (
                <Badge variant="primary" className="ml-2 bg-primary text-white">
                  {activeFilters} active
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFiltersAndSort}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset All
            </Button>
          </div>

          <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="space-y-2">
            {/* Date Range Filter */}
            <AccordionItem value="date" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-accent/20 data-[state=open]:bg-accent/10">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span>Date Range</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 border-t">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="date-from">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-from"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="date-to">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-to"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="self-end pt-6">
                    <Button onClick={applyDateRangeFilter}>Apply Date Filter</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Numeric Range Filters */}
            <AccordionItem value="numeric" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-accent/20 data-[state=open]:bg-accent/10">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Numeric Ranges</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 border-t">
                <div className="space-y-4">
                  {/* Revenue Range */}
                  <div className="grid gap-2">
                    <Label>Revenue Range (₹)</Label>
                    <div className="flex items-center gap-4">
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="revenue-min" className="text-xs">Min</Label>
                        <Input
                          id="revenue-min"
                          type="number"
                          placeholder="Min revenue"
                          value={revenueRange.min}
                          onChange={(e) => setRevenueRange(prev => ({ ...prev, min: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="revenue-max" className="text-xs">Max</Label>
                        <Input
                          id="revenue-max"
                          type="number"
                          placeholder="Max revenue"
                          value={revenueRange.max}
                          onChange={(e) => setRevenueRange(prev => ({ ...prev, max: e.target.value }))}
                        />
                      </div>
                      <Button 
                        onClick={() => applyNumericRangeFilter('totalRevenue', revenueRange.min, revenueRange.max)}
                        size="sm"
                        className="self-end"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  
                  {/* Attendance Range */}
                  <div className="grid gap-2">
                    <Label>Attendance Range</Label>
                    <div className="flex items-center gap-4">
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="attendance-min" className="text-xs">Min</Label>
                        <Input
                          id="attendance-min"
                          type="number"
                          placeholder="Min attendance"
                          value={attendanceRange.min}
                          onChange={(e) => setAttendanceRange(prev => ({ ...prev, min: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="attendance-max" className="text-xs">Max</Label>
                        <Input
                          id="attendance-max"
                          type="number"
                          placeholder="Max attendance"
                          value={attendanceRange.max}
                          onChange={(e) => setAttendanceRange(prev => ({ ...prev, max: e.target.value }))}
                        />
                      </div>
                      <Button 
                        onClick={() => applyNumericRangeFilter('classAverageIncludingEmpty', attendanceRange.min, attendanceRange.max)}
                        size="sm"
                        className="self-end"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Custom Filters */}
            <AccordionItem value="filters" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-accent/20 data-[state=open]:bg-accent/10">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>Custom Filters</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 border-t">
                <div className="space-y-4">
                  {/* Filter Builder */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 flex-1">
                      <Select value={newFilterField} onValueChange={(value) => setNewFilterField(value as keyof ProcessedData)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.key as string} value={field.key as string}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={newFilterOperator} onValueChange={setNewFilterOperator}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {newFilterField === 'period' ? (
                        <Select value="" onValueChange={(period) => handlePeriodChange(period, true)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUniqueValues('period').map((period) => (
                              <SelectItem key={period} value={period}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={
                            ['totalOccurrences', 'totalCheckins', 'totalRevenue', 'classAverageIncludingEmpty', 'classAverageExcludingEmpty'].includes(newFilterField)
                              ? 'number'
                              : 'text'
                          }
                          placeholder="Value"
                          value={newFilterValue}
                          onChange={(e) => setNewFilterValue(e.target.value)}
                        />
                      )}
                    </div>
                    <Button onClick={addFilter} className="whitespace-nowrap">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Filter
                    </Button>
                  </div>

                  {/* Selected Periods */}
                  {selectedPeriods.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPeriods.map((period) => (
                        <Badge key={period} variant="outline" className="flex items-center gap-1 pl-2">
                          <span>{period}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 rounded-full"
                            onClick={() => handlePeriodChange(period, false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Active Filters */}
                  {filters.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Active Filters:</h4>
                      <div className="flex flex-wrap gap-2">
                        {filters.map((filter, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 pl-2">
                            <span>
                              {fields.find(f => f.key === filter.field)?.label || filter.field}: {filter.operator}{' '}
                              {filter.value}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 rounded-full"
                              onClick={() => removeFilter(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Filter Set */}
                  {filters.length > 0 && (
                    <div className="flex gap-2 mt-4 items-end">
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="filter-set-name">Save Filter Set</Label>
                        <Input
                          id="filter-set-name"
                          placeholder="Filter set name"
                          value={newFilterSetName}
                          onChange={(e) => setNewFilterSetName(e.target.value)}
                        />
                      </div>
                      <Button onClick={saveCurrentFilters} disabled={!newFilterSetName}>
                        <Save className="mr-1 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  )}

                  {/* Saved Filters */}
                  {savedFilters.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Saved Filters:</h4>
                      <div className="flex flex-wrap gap-2">
                        {savedFilters.map((savedFilter, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => loadSavedFilter(savedFilter)}
                            className="flex items-center gap-1"
                          >
                            <Star className="h-3 w-3 text-amber-500" />
                            {savedFilter.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sorting Options */}
            <AccordionItem value="sort" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-accent/20 data-[state=open]:bg-accent/10">
                <div className="flex items-center gap-2">
                  {newSortDirection === 'asc' ? (
                    <SortAsc className="h-4 w-4 text-primary" />
                  ) : (
                    <SortDesc className="h-4 w-4 text-primary" />
                  )}
                  <span>Sorting</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 border-t">
                <div className="space-y-4">
                  {/* Sort Builder */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 flex-1">
                      <Select value={newSortField as string} onValueChange={(value) => setNewSortField(value as keyof ProcessedData)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((field) => (
                            <SelectItem key={field.key as string} value={field.key as string}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={newSortDirection} onValueChange={(value) => setNewSortDirection(value as 'asc' | 'desc')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">
                            <div className="flex items-center">
                              <SortAsc className="mr-2 h-4 w-4" />
                              Ascending
                            </div>
                          </SelectItem>
                          <SelectItem value="desc">
                            <div className="flex items-center">
                              <SortDesc className="mr-2 h-4 w-4" />
                              Descending
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addSortOption} className="whitespace-nowrap">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Sort
                    </Button>
                  </div>

                  {/* Active Sort Options */}
                  {sortOptions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium">Active Sort Options:</h4>
                      <div className="space-y-2">
                        {sortOptions.map((sortOption, index) => (
                          <div key={index} className="flex items-center justify-between bg-accent/10 rounded-md p-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-normal">
                                {index + 1}
                              </Badge>
                              <span>
                                {fields.find(f => f.key === sortOption.field)?.label || sortOption.field}
                              </span>
                              {sortOption.direction === 'asc' ? (
                                <SortAsc className="h-4 w-4 text-green-600" />
                              ) : (
                                <SortDesc className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full"
                              onClick={() => removeSortOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataFilters;
