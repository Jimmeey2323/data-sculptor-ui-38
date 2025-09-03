
import React, { useMemo, useState } from 'react';
import { ProcessedData, TopBottomClassData } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart2, Users, Star, Filter, Search, Calendar, Clock, DollarSign, MapPin, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CountUp from 'react-countup';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import SearchBar from './SearchBar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { 
  Table,
  TableBody, 
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface TopBottomClassesProps {
  data: ProcessedData[];
}

const TopBottomClasses: React.FC<TopBottomClassesProps> = ({ data }) => {
  const [listSize, setListSize] = useState('10');
  const [includeTrainers, setIncludeTrainers] = useState(false);
  const [minOccurrences, setMinOccurrences] = useState('2');
  const [showTable, setShowTable] = useState(false);
  const [activeTab, setActiveTab] = useState('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { topClasses, bottomClasses, maxAttendance } = useMemo(() => {
    // Filter data based on search query
    const searchFilteredData = searchQuery.trim() 
      ? data.filter(item => {
          const query = searchQuery.toLowerCase();
          return item.cleanedClass.toLowerCase().includes(query) || 
                 item.teacherName.toLowerCase().includes(query) ||
                 item.dayOfWeek.toLowerCase().includes(query) ||
                 item.location.toLowerCase().includes(query);
        })
      : data;
    
    // Filter data based on specified criteria
    const filteredData = searchFilteredData.filter(item => {
      const name = item.cleanedClass.toLowerCase();
      
      // Exclude classes with "Recovery" or "Cycle" in name
      const isValidClass = !name.includes('recovery') && !name.includes('cycle') && !name.includes('hosted');
      
      // Filter by minimum occurrences
      const hasMinimumOccurrences = item.totalOccurrences >= parseInt(minOccurrences);
      
      return isValidClass && hasMinimumOccurrences;
    });
    
    // Create a unique identifier based on whether to include trainers
    const createUniqueKey = (item: ProcessedData): string => {
      return includeTrainers 
        ? `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.teacherName}`
        : `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}`;
    };
    
    // Group data based on the unique key
    const groupedData: Map<string, ProcessedData[]> = new Map();
    
    filteredData.forEach(item => {
      const key = createUniqueKey(item);
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      
      groupedData.get(key)?.push(item);
    });
    
    // Process each group to create summary data
    const processedClasses: TopBottomClassData[] = Array.from(groupedData.entries()).map(([key, items]) => {
      const firstItem = items[0];
      const totalCheckins = items.reduce((sum, item) => sum + item.totalCheckins, 0);
      const totalOccurrences = items.reduce((sum, item) => sum + item.totalOccurrences, 0);
      const totalRevenue = items.reduce((sum, item) => sum + parseFloat(item.totalRevenue), 0);
      const totalNonEmpty = items.reduce((sum, item) => sum + item.totalNonEmpty, 0);
      
      // Calculate average attendance
      const averageAttendance = totalCheckins / totalOccurrences;
      
      return {
        id: key,
        cleanedClass: firstItem.cleanedClass,
        dayOfWeek: firstItem.dayOfWeek,
        classTime: firstItem.classTime,
        teacherName: firstItem.teacherName,
        location: firstItem.location,
        averageAttendance: averageAttendance,
        totalOccurrences: totalOccurrences,
        totalCheckins: totalCheckins,
        totalRevenue: totalRevenue,
        isTopPerformer: false, // will be set later
        detailedData: items
      };
    });
    
    // Sort by average attendance (descending)
    const sortedClasses = [...processedClasses].sort((a, b) => 
      b.averageAttendance - a.averageAttendance
    );
    
    // Find the maximum attendance for progress bars
    const maxAttendance = Math.max(...sortedClasses.map(item => item.averageAttendance));
    
    // Get the top and bottom classes based on list size
    const listSizeNumber = parseInt(listSize);
    const top = sortedClasses.slice(0, listSizeNumber).map(item => ({
      ...item,
      isTopPerformer: true
    }));
    
    // For bottom classes, we need to take the last 'listSizeNumber' items
    // We also need to ensure we have enough items
    const bottomCount = Math.min(listSizeNumber, Math.max(0, sortedClasses.length - listSizeNumber));
    const bottom = sortedClasses.slice(-bottomCount).map(item => ({
      ...item,
      isTopPerformer: false
    })).reverse(); // Reverse to show worst first
    
    return { 
      topClasses: top, 
      bottomClasses: bottom,
      maxAttendance
    };
  }, [data, includeTrainers, listSize, minOccurrences, searchQuery]);

  const toggleExpandItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const renderClassItem = (classData: TopBottomClassData, index: number) => (
    <div key={classData.id} className="space-y-2">
      <div 
        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={() => toggleExpandItem(classData.id)}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          classData.isTopPerformer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 overflow-hidden space-y-1">
          <p className="font-medium truncate">{classData.cleanedClass}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{classData.dayOfWeek}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              <span>{classData.classTime}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{classData.location}</span>
            </span>
            {includeTrainers && (
              <span className="flex items-center gap-1">
                <User size={12} />
                <span>{classData.teacherName}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">
            <CountUp 
              end={classData.averageAttendance} 
              decimals={1}
              duration={1.5}
              delay={index * 0.1}
            />
          </div>
          <div className={`flex items-center text-xs justify-end ${
            classData.isTopPerformer ? 'text-green-600' : 'text-red-600'
          }`}>
            {classData.isTopPerformer ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            Avg. Attendance
          </div>
          <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${classData.isTopPerformer ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (classData.averageAttendance / maxAttendance) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {expandedItem === classData.id && (
        <div className="rounded-lg border overflow-hidden ml-8 mb-3 bg-white dark:bg-slate-800">
          <div className="p-3 bg-slate-100 dark:bg-slate-700 flex justify-between items-center">
            <h4 className="font-medium text-sm">Detailed Class Occurrences</h4>
            <Badge variant={classData.isTopPerformer ? "success" : "destructive"} className="text-xs">
              {classData.detailedData.length} Sessions
            </Badge>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Checked In</TableHead>
                  <TableHead className="text-right">Revenue (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.detailedData.map((instance, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{instance.rawData?.[0]?.classDate || 'N/A'}</TableCell>
                    <TableCell>{instance.period}</TableCell>
                    <TableCell className="text-right">{instance.totalCheckins}</TableCell>
                    <TableCell className="text-right">₹{parseFloat(instance.totalRevenue).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Total Check-ins</div>
              <div className="font-medium">{classData.totalCheckins}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Average</div>
              <div className="font-medium">{classData.averageAttendance.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Revenue</div>
              <div className="font-medium">₹{classData.totalRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Revenue/Class</div>
              <div className="font-medium">₹{(classData.totalRevenue / classData.totalOccurrences).toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderTable = (classes: TopBottomClassData[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Day & Time</TableHead>
            <TableHead>Location</TableHead>
            {includeTrainers && <TableHead>Instructor</TableHead>}
            <TableHead className="text-right">Occurrences</TableHead>
            <TableHead className="text-right">Total Check-ins</TableHead>
            <TableHead className="text-right">Average</TableHead>
            <TableHead className="text-right">Revenue (₹)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classData, index) => (
            <React.Fragment key={classData.id}>
              <TableRow 
                className={`cursor-pointer ${expandedItem === classData.id ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                onClick={() => toggleExpandItem(classData.id)}
              >
                <TableCell>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    classData.isTopPerformer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{classData.cleanedClass}</TableCell>
                <TableCell>
                  {classData.dayOfWeek}, {classData.classTime}
                </TableCell>
                <TableCell>{classData.location}</TableCell>
                {includeTrainers && <TableCell>{classData.teacherName}</TableCell>}
                <TableCell className="text-right">{classData.totalOccurrences}</TableCell>
                <TableCell className="text-right">{classData.totalCheckins}</TableCell>
                <TableCell className="text-right font-medium">
                  <div className="flex items-center justify-end gap-1">
                    {classData.isTopPerformer ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    {classData.averageAttendance.toFixed(1)}
                  </div>
                </TableCell>
                <TableCell className="text-right">₹{classData.totalRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</TableCell>
              </TableRow>
              
              {expandedItem === classData.id && (
                <TableRow>
                  <TableCell colSpan={includeTrainers ? 9 : 8} className="p-0 border-b">
                    <div className="mx-8 my-4 border rounded-lg overflow-hidden">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 flex justify-between items-center">
                        <h4 className="font-medium text-sm">Detailed Class Occurrences</h4>
                        <Badge variant={classData.isTopPerformer ? "success" : "destructive"} className="text-xs">
                          {classData.detailedData.length} Sessions
                        </Badge>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Date</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead className="text-right">Checked In</TableHead>
                              <TableHead className="text-right">Revenue (₹)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classData.detailedData.map((instance, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{instance.rawData?.[0]?.classDate || 'N/A'}</TableCell>
                                <TableCell>{instance.period}</TableCell>
                                <TableCell className="text-right">{instance.totalCheckins}</TableCell>
                                <TableCell className="text-right">₹{parseFloat(instance.totalRevenue).toLocaleString('en-IN')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Check-ins</div>
                          <div className="font-medium">{classData.totalCheckins}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Average</div>
                          <div className="font-medium">{classData.averageAttendance.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue</div>
                          <div className="font-medium">₹{classData.totalRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue/Class</div>
                          <div className="font-medium">₹{(classData.totalRevenue / classData.totalOccurrences).toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Class Performance Ranking
          </h3>
          <p className="text-sm text-muted-foreground">
            Classes with multiple occurrences (excluding Recovery and Cycle classes)
          </p>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Card View' : 'Table View'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="list-size">Show top/bottom</Label>
                  <Select value={listSize} onValueChange={setListSize}>
                    <SelectTrigger id="list-size">
                      <SelectValue placeholder="Count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min-occurrences">Minimum occurrences</Label>
                  <Select value={minOccurrences} onValueChange={setMinOccurrences}>
                    <SelectTrigger id="min-occurrences">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-trainers" 
                    checked={includeTrainers} 
                    onCheckedChange={(checked) => setIncludeTrainers(checked === true)}
                  />
                  <Label htmlFor="include-trainers">Include trainers in grouping</Label>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes by name, instructor, or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="top" value={activeTab} onValueChange={setActiveTab} className="bg-white dark:bg-gray-950 rounded-lg">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="top" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Top {listSize} Classes</span>
                </TabsTrigger>
                <TabsTrigger value="bottom" className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span>Bottom {listSize} Classes</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="top" className="mt-0">
                {topClasses.length > 0 ? (
                  showTable ? (
                    renderTable(topClasses)
                  ) : (
                    <div className="grid gap-2">
                      {topClasses.map((classData, index) => renderClassItem(classData, index))}
                    </div>
                  )
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No qualifying class data available
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="bottom" className="mt-0">
                {bottomClasses.length > 0 ? (
                  showTable ? (
                    renderTable(bottomClasses)
                  ) : (
                    <div className="grid gap-2">
                      {bottomClasses.map((classData, index) => renderClassItem(classData, index))}
                    </div>
                  )
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No qualifying class data available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TopBottomClasses;
