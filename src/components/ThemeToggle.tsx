import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-all active:scale-95 relative overflow-hidden group"
      title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      <Sun className={`h-4 w-4 transition-all duration-500 absolute ${
        theme === 'light'
          ? 'rotate-0 scale-100 opacity-100'
          : 'rotate-90 scale-0 opacity-0'
      }`} />
      <Moon className={`h-4 w-4 transition-all duration-500 absolute ${
        theme === 'dark'
          ? 'rotate-0 scale-100 opacity-100'
          : '-rotate-90 scale-0 opacity-0'
      }`} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
