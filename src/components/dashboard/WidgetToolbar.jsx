import React, { useState } from 'react';
import ExcelUploadModal from './ExcelUploadModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, BarChart3, TrendingUp, PieChart, Type, StickyNote, Hash, Image, FileSpreadsheet } from 'lucide-react';

const WIDGET_OPTIONS = [
  { type: 'chart_bar', label: 'Bar Chart', icon: BarChart3 },
  { type: 'chart_line', label: 'Line Chart', icon: TrendingUp },
  { type: 'chart_pie', label: 'Pie Chart', icon: PieChart },
  { type: 'text', label: 'Text Block', icon: Type },
  { type: 'note', label: 'Sticky Note', icon: StickyNote },
  { type: 'metric', label: 'Metric Card', icon: Hash },
  { type: 'image', label: 'Image', icon: Image },
];

export default function WidgetToolbar({ onAddWidget, disabled }) {
  const [excelOpen, setExcelOpen] = useState(false);

  const handleCreateFromExcel = ({ type, title, config }) => {
    onAddWidget(type, { title, config });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={disabled} className="gap-2 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            Add Widget
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {WIDGET_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <DropdownMenuItem key={opt.type} onClick={() => onAddWidget(opt.type)} className="gap-3 cursor-pointer">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {opt.label}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem onClick={() => setExcelOpen(true)} className="gap-3 cursor-pointer border-t mt-1 pt-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Import from Excel/CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExcelUploadModal
        open={excelOpen}
        onClose={() => setExcelOpen(false)}
        onCreateWidget={handleCreateFromExcel}
      />
    </>
  );
}