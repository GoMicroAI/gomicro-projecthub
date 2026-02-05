 import { useState, useMemo } from "react";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Calendar } from "@/components/ui/calendar";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { Label } from "@/components/ui/label";
 import { cn } from "@/lib/utils";
 import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
 import { CalendarIcon, Download } from "lucide-react";
 
 interface ExportDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onExport: (startDate: Date | null, endDate: Date | null) => void;
 }
 
 export function ExportDialog({ open, onOpenChange, onExport }: ExportDialogProps) {
   const [exportType, setExportType] = useState<string>("all");
   const [selectedMonth, setSelectedMonth] = useState<string>("");
   const [startDate, setStartDate] = useState<Date | undefined>();
   const [endDate, setEndDate] = useState<Date | undefined>();
 
   const monthOptions = useMemo(() => {
     const options = [];
     const now = new Date();
     for (let i = 0; i < 12; i++) {
       const date = subMonths(now, i);
       options.push({
         value: format(date, "yyyy-MM"),
         label: format(date, "MMMM yyyy"),
       });
     }
     return options;
   }, []);
 
   const handleExport = () => {
     let start: Date | null = null;
     let end: Date | null = null;
 
     if (exportType === "month" && selectedMonth) {
       const [year, month] = selectedMonth.split("-").map(Number);
       const monthDate = new Date(year, month - 1);
       start = startOfMonth(monthDate);
       end = endOfMonth(monthDate);
     } else if (exportType === "range" && startDate && endDate) {
       start = startDate;
       end = endDate;
     }
 
     onExport(start, end);
     onOpenChange(false);
   };
 
   const isExportDisabled = 
     (exportType === "month" && !selectedMonth) ||
     (exportType === "range" && (!startDate || !endDate));
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Export R&D Work Log</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Export Range</Label>
             <Select value={exportType} onValueChange={setExportType}>
               <SelectTrigger>
                 <SelectValue placeholder="Select range type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Time</SelectItem>
                 <SelectItem value="month">Specific Month</SelectItem>
                 <SelectItem value="range">Custom Date Range</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {exportType === "month" && (
             <div className="space-y-2">
               <Label>Select Month</Label>
               <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                 <SelectTrigger>
                   <SelectValue placeholder="Choose a month" />
                 </SelectTrigger>
                 <SelectContent>
                   {monthOptions.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                       {option.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           {exportType === "range" && (
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Start Date</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !startDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={startDate}
                       onSelect={setStartDate}
                       initialFocus
                       className={cn("p-3 pointer-events-auto")}
                     />
                   </PopoverContent>
                 </Popover>
               </div>
 
               <div className="space-y-2">
                 <Label>End Date</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !endDate && "text-muted-foreground"
                       )}
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={endDate}
                       onSelect={setEndDate}
                       disabled={(date) => startDate ? date < startDate : false}
                       initialFocus
                       className={cn("p-3 pointer-events-auto")}
                     />
                   </PopoverContent>
                 </Popover>
               </div>
             </div>
           )}
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button onClick={handleExport} disabled={isExportDisabled}>
             <Download className="h-4 w-4 mr-2" />
             Export
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }