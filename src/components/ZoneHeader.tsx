import { Link } from 'react-router-dom';
import { ArrowLeft, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface Props {
  title: string;
  subtitle?: string;
  zone: string;
  variant?: 'light' | 'dark';
}

export const ZoneHeader = ({ title, subtitle, zone, variant = 'light' }: Props) => {
  const { lang, setLang, tr } = useI18n();
  const dark = variant === 'dark';
  return (
    <header className={`border-b ${dark ? 'bg-sidebar text-sidebar-foreground border-sidebar-border' : 'bg-card border-border'}`}>
      <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className={dark ? 'text-sidebar-foreground hover:bg-sidebar-accent' : ''}>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />{tr.back}</Link>
          </Button>
          <div className="h-6 w-px bg-border/50" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-accent font-semibold">{zone}</span>
            </div>
            <h1 className="font-display text-lg md:text-xl font-bold truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground hidden md:block">{subtitle}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
          className={dark ? 'text-sidebar-foreground hover:bg-sidebar-accent' : ''}
        >
          <Languages className="h-4 w-4 mr-1" />{lang.toUpperCase()}
        </Button>
      </div>
    </header>
  );
};
