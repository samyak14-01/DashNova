import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, BarChart2, LineChart, PieChart, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const CHART_TYPES = [
  { value: 'chart_bar', label: 'Bar Chart', icon: BarChart2 },
  { value: 'chart_line', label: 'Line Chart', icon: LineChart },
  { value: 'chart_pie', label: 'Pie Chart', icon: PieChart },
];

const MAX_ROWS = 1000;
const MAX_FILE_MB = 10;

function detectBestChart(rows, xCol, yCol) {
  const uniqueX = new Set(rows.map(r => r[xCol])).size;
  const isNumericY = rows.every(r => !isNaN(Number(r[yCol])));
  if (!isNumericY) return 'chart_bar';
  if (uniqueX <= 8) return 'chart_pie';
  if (uniqueX > 20) return 'chart_line';
  return 'chart_bar';
}

function isNumericCol(rows, col) {
  return rows.slice(0, 20).every(r => r[col] !== undefined && r[col] !== '' && !isNaN(Number(r[col])));
}

export default function ExcelUploadModal({ open, onClose, onCreateWidget }) {
  const [step, setStep] = useState('upload'); // upload | preview | configure
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [chartType, setChartType] = useState('chart_bar');
  const [title, setTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('upload');
    setError(null);
    setFileName('');
    setRows([]);
    setColumns([]);
    setXCol('');
    setYCol('');
    setChartType('chart_bar');
    setTitle('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = useCallback((file) => {
    setError(null);

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File too large. Max size is ${MAX_FILE_MB}MB.`);
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Unsupported file. Please upload .xlsx, .xls, or .csv');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!parsed.length) {
          setError('File is empty or has no readable data.');
          return;
        }

        const limited = parsed.slice(0, MAX_ROWS);
        const cols = Object.keys(limited[0]);

        if (cols.length < 2) {
          setError('File must have at least 2 columns.');
          return;
        }

        setRows(limited);
        setColumns(cols);

        // Auto-select: first non-numeric col as X, first numeric col as Y
        const firstNonNum = cols.find(c => !isNumericCol(limited, c)) || cols[0];
        const firstNum = cols.find(c => isNumericCol(limited, c)) || cols[1];
        setXCol(firstNonNum);
        setYCol(firstNum);
        setChartType(detectBestChart(limited, firstNonNum, firstNum));
        setTitle(file.name.replace(/\.[^.]+$/, ''));
        setStep('preview');
      } catch {
        setError('Failed to parse file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
  };

  const handleCreate = () => {
    if (!xCol || !yCol) { setError('Please select X and Y axis columns.'); return; }

    const chartData = rows.map(r => ({
      name: String(r[xCol] ?? ''),
      value: Number(r[yCol]) || 0,
    }));

    onCreateWidget({
      type: chartType,
      title: title || 'Imported Chart',
      config: {
        data: chartData,
        xAxisKey: xCol,
        yAxisKey: yCol,
        fromImport: true,
      },
    });
    handleClose();
  };

  const previewRows = rows.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold text-sm mb-1">Drop your file here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv — max {MAX_FILE_MB}MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* STEP 2: Preview + Configure */}
        {step === 'preview' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span><strong>{fileName}</strong> — {rows.length} rows, {columns.length} columns loaded</span>
            </div>

            {/* Data preview table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Data Preview (first 6 rows)</p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.map(col => (
                          <td key={col} className="px-3 py-1.5 text-foreground whitespace-nowrap">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Axis + Chart config */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">X-Axis (Category)</label>
                <Select value={xCol} onValueChange={(v) => { setXCol(v); setChartType(detectBestChart(rows, v, yCol)); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Y-Axis (Value)</label>
                <Select value={yCol} onValueChange={(v) => { setYCol(v); setChartType(detectBestChart(rows, xCol, v)); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chart type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Chart Type (auto-detected)</label>
              <div className="flex gap-2 flex-wrap">
                {CHART_TYPES.map(ct => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => setChartType(ct.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        chartType === ct.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Widget Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chart title" className="h-9" />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={reset}>← Upload Different File</Button>
              <Button onClick={handleCreate}>Add to Dashboard</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}