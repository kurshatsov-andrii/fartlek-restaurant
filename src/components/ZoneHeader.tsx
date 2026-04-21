import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Languages, LogOut, LayoutGrid, ChefHat, Shield, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth, canAccessZone } from '@/lib/auth';
import { toast } from 'sonner';

interface Props {
  title: string;
  subtitle?: string;
  zone: string;
  variant?: 'light' | 'dark';
}

export const ZoneHeader = ({ title, subtitle, zone, variant: _v = 'light' }: Props) => {
  const { lang, setLang, tr } = useI18n();
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const zoneLinks = [
    { to: '/waiter', key: 'waiter' as const, label: lang === 'ua' ? 'Зал' : 'Floor', Icon: LayoutGrid },
    { to: '/floor-map', key: 'waiter' as const, label: lang === 'ua' ? 'Карта' : 'Map', Icon: Map },
    { to: '/kitchen', key: 'kitchen' as const, label: lang === 'ua' ? 'Кухня' : 'Kitchen', Icon: ChefHat },
    { to: '/admin', key: 'admin' as const, label: 'Admin', Icon: Shield },
  ].filter(z => canAccessZone(z.key, roles));

  const handleLogout = async () => {
    await signOut();
    toast.success(lang === 'ua' ? 'Вихід виконано' : 'Signed out');
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-gold">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />{tr.back}</Link>
          </Button>
          <div className="h-8 w-px bg-border" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold">{zone}</span>
            <h1 className="font-display text-lg md:text-xl font-bold truncate leading-tight mt-0.5">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground hidden md:block mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && zoneLinks.length > 1 && (
            <div className="flex items-center gap-1 mr-1 sm:mr-2 p-1 rounded-xl bg-muted border border-border overflow-x-auto max-w-[60vw] sm:max-w-none">
              {zoneLinks.map(({ to, label, Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-gradient-gold text-primary-foreground shadow-1'
                        : 'text-muted-foreground hover:text-gold'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /><span className="hidden xs:inline sm:inline">{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')} className="text-muted-foreground hover:text-gold px-2 sm:px-3">
            <Languages className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{lang.toUpperCase()}</span>
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-gold px-2 sm:px-3">
              <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{lang === 'ua' ? 'Вихід' : 'Sign out'}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
