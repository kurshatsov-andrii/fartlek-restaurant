import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Languages, LogOut, LayoutGrid, ChefHat, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, canAccessZone } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  title: string;
  subtitle?: string;
  zone: string;
  variant?: 'light' | 'dark';
}

export const ZoneHeader = ({ title, subtitle, zone, variant = 'light' }: Props) => {
  const { lang, setLang, tr } = useI18n();
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dark = variant === 'dark';

  const zoneLinks = [
    { to: '/waiter', key: 'waiter' as const, label: lang === 'ua' ? 'Зал' : 'Floor', Icon: LayoutGrid },
    { to: '/kitchen', key: 'kitchen' as const, label: lang === 'ua' ? 'Кухня' : 'Kitchen', Icon: ChefHat },
    { to: '/admin', key: 'admin' as const, label: 'Admin', Icon: Shield },
  ].filter(z => canAccessZone(z.key, roles));
  const handleLogout = async () => {
    await signOut();
    toast.success(lang === 'ua' ? 'Вихід виконано' : 'Signed out');
    navigate('/');
  };
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
        <div className="flex items-center gap-2">
          {user && zoneLinks.length > 1 && (
            <div className={`hidden md:flex items-center gap-1 mr-2 p-1 rounded-lg ${dark ? 'bg-sidebar-accent' : 'bg-secondary'}`}>
              {zoneLinks.map(({ to, label, Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : dark
                          ? 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </Link>
                );
              })}
            </div>
          )}
          <ThemeToggle variant="ghost" size="sm" className={dark ? 'text-sidebar-foreground hover:bg-sidebar-accent' : ''} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
            className={dark ? 'text-sidebar-foreground hover:bg-sidebar-accent' : ''}
          >
            <Languages className="h-4 w-4 mr-1" />{lang.toUpperCase()}
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className={dark ? 'text-sidebar-foreground hover:bg-sidebar-accent' : ''}>
              <LogOut className="h-4 w-4 mr-1" />{lang === 'ua' ? 'Вихід' : 'Sign out'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
