
import React, { useState, useEffect } from 'react';
import { ProcessedData, FilterOption, SortOption, ViewMode } from '@/types/data';
import DataTable from '@/components/DataTable';
import DataFilters from '@/components/DataFilters';
import MetricsPanel from '@/components/MetricsPanel';
import ChartPanel from '@/components/ChartPanel';
import TopBottomClasses from '@/components/TopBottomClasses';
import GridView from '@/components/views/GridView';
import KanbanView from '@/components/views/KanbanView';
import TimelineView from '@/components/views/TimelineView';
import PivotView from '@/components/views/PivotView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { exportToCSV } from '@/utils/fileProcessing';
import { 
  Upload, 
  BarChart3, 
  Table, 
  Download, 
  RefreshCw, 
  Grid, 
  Kanban, 
  Clock, 
  PieChart,
  Search,
  ArrowDownToLine,
  Filter
} from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Card, CardContent } from '@/components/ui/card';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import CountUp from 'react-countup';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DashboardProps {
  data: ProcessedData[];
  loading: boolean;
  progress: number;
  onReset: () => void;
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  loading, 
  progress, 
  onReset,
  viewMode,
  setViewMode
}) => {
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [activeTab, setActiveTab] = useState('insights');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters and sorting to data
  useEffect(() => {
    if (!data.length) return;

    let result = [...data];
    
    // Apply search query first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply filters
    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          const fieldValue = String(item[filter.field]);
          
          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
            case 'equals':
              return fieldValue.toLowerCase() === filter.value.toLowerCase();
            case 'starts':
              return fieldValue.toLowerCase().startsWith(filter.value.toLowerCase());
            case 'ends':
              return fieldValue.toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greater':
              return Number(fieldValue) > Number(filter.value);
            case 'less':
              return Number(fieldValue) < Number(filter.value);
            default:
              return true;
          }
        });
      });
    }
    
    // Apply sorting
    if (sortOptions.length > 0) {
      result.sort((a, b) => {
        for (const sort of sortOptions) {
          const valueA = a[sort.field];
          const valueB = b[sort.field];
          
          // Determine if the values are numeric
          const isNumeric = !isNaN(Number(valueA)) && !isNaN(Number(valueB));
          
          let comparison = 0;
          if (isNumeric) {
            comparison = Number(valueA) - Number(valueB);
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        
        return 0;
      });
    }
    
    setFilteredData(result);
  }, [data, filters, sortOptions, searchQuery]);

  const handleFilterChange = (newFilters: FilterOption[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortOptions: SortOption[]) => {
    setSortOptions(newSortOptions);
  };

  const handleExport = () => {
    exportToCSV(filteredData);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  }; 

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-12 min-h-[60vh]">
        <h2 className="text-2xl font-semibold">Processing Data</h2>
        <ProgressBar progress={progress} />
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Analyzed 
            <span className="text-primary mx-1">
              <CountUp end={data.length} duration={2} separator="," />
            </span> 
            records so far
          </p>
          <p className="text-sm text-muted-foreground">Please wait while we process your file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Badge className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20">
                {filteredData.length} Classes
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Dataset Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Classes:</span>
                    <span className="font-medium">{filteredData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Types of Classes:</span>
                    <span className="font-medium">
                      {new Set(filteredData.map(d => d.cleanedClass)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Instructors:</span>
                    <span className="font-medium">
                      {new Set(filteredData.map(d => d.teacherName)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Range:</span>
                    <span className="font-medium">
                      {[...new Set(filteredData.map(d => d.period))].sort()[0]} - {
                        [...new Set(filteredData.map(d => d.period))].sort().slice(-1)[0]
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Filters:</span>
                    <span className="font-medium">{filters.length}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Upload New
          </Button>
          <Button variant="default" size="sm" onClick={handleExport}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Comprehensive Filter Section */}
      <DataFilters 
        onFilterChange={handleFilterChange} 
        onSortChange={handleSortChange}
        data={data}
        activeFilters={filters.length}
      />
      
      {/* Metrics Panel with drill-down data */}
      <MetricsPanel data={filteredData} />
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1">
          <TabsTrigger value="insights" className="py-2">
            <BarChart3 className="mr-2 h-4 w-4" />
            Insights & Rankings
          </TabsTrigger>
          <TabsTrigger value="data-view" className="py-2">
            <Table className="mr-2 h-4 w-4" />
            Data Browser
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="py-2">
            <PieChart className="mr-2 h-4 w-4" />
            Visualizations
          </TabsTrigger>
        </TabsList>
        
        {/* Insights Tab Content */}
        <TabsContent value="insights" className="space-y-6 pt-2">
          <TopBottomClasses data={filteredData} />
        </TabsContent>
        
        {/* Data View Tab Content */}
        <TabsContent value="data-view" className="space-y-6 pt-2">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border shadow-sm">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Data Browser</h3>
              </div>
              <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            
            <div className="bg-white dark:bg-gray-950 border rounded-lg shadow-sm">
              {viewMode === 'table' && <DataTable data={filteredData} />}
              {viewMode === 'grid' && <GridView data={filteredData} />}
              {viewMode === 'kanban' && <KanbanView data={filteredData} />}
              {viewMode === 'timeline' && <TimelineView data={filteredData} />}
              {viewMode === 'pivot' && <PivotView data={filteredData} />}
            </div>
          </div>
        </TabsContent>
        
        {/* Visualizations Tab Content */}
        <TabsContent value="visualizations" className="space-y-6 pt-2">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Visual Analytics</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Interactive charts and visualizations to explore the data
              </p>
            </div>
            
            <ChartPanel data={filteredData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
