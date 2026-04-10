import React from 'react';
import { useTheme, THEMES } from '@/lib/ThemeProvider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" title="Change theme">
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <p className="text-xs font-semibold text-muted-foreground px-2 pb-2">Theme</p>
        <div className="grid grid-cols-2 gap-1">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                theme === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}