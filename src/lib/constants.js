export const CURSOR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6'
];

export const WIDGET_TYPES = [
  { type: 'chart_bar', label: 'Bar Chart', icon: 'BarChart3' },
  { type: 'chart_line', label: 'Line Chart', icon: 'TrendingUp' },
  { type: 'chart_pie', label: 'Pie Chart', icon: 'PieChart' },
  { type: 'text', label: 'Text Block', icon: 'Type' },
  { type: 'note', label: 'Sticky Note', icon: 'StickyNote' },
  { type: 'metric', label: 'Metric Card', icon: 'Hash' },
  { type: 'image', label: 'Image', icon: 'Image' },
];

export const DEFAULT_WIDGET_CONFIGS = {
  chart_bar: {
    data: [
      { name: 'Jan', value: 400 },
      { name: 'Feb', value: 300 },
      { name: 'Mar', value: 600 },
      { name: 'Apr', value: 800 },
      { name: 'May', value: 500 },
      { name: 'Jun', value: 900 },
    ]
  },
  chart_line: {
    data: [
      { name: 'Mon', value: 20 },
      { name: 'Tue', value: 45 },
      { name: 'Wed', value: 35 },
      { name: 'Thu', value: 80 },
      { name: 'Fri', value: 65 },
      { name: 'Sat', value: 90 },
      { name: 'Sun', value: 70 },
    ]
  },
  chart_pie: {
    data: [
      { name: 'Desktop', value: 400 },
      { name: 'Mobile', value: 300 },
      { name: 'Tablet', value: 200 },
    ]
  },
  text: { content: 'Double-click to edit this text block.' },
  note: { content: 'A quick note...', color: '#fef3c7' },
  metric: { value: '1,234', label: 'Total Users', trend: '+12.5%', trendUp: true },
  image: { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', alt: 'Dashboard image' },
};

export const GRID_COLS = 12;      // Desktop default (overridden per device in canvas)
export const GRID_ROW_HEIGHT = 80;
export const GRID_GAP = 10;