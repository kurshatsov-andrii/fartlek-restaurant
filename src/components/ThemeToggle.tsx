import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

interface Props {
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'icon';
  className?: string;
}

export const ThemeToggle = ({ variant = 'ghost', size = 'icon', className }: Props) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={className}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
};
