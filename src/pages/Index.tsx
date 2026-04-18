import { Link } from 'react-router-dom';
import { Smartphone, Tablet, ChefHat, LayoutDashboard, Languages, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const Index = () => {
  const { lang, setLang, tr } = useI18n();

  const zones = [
    { to: '/customer', icon: Smartphone, title: tr.customer, desc: tr.customerDesc, role: 'CUSTOMER', accent: 'from-orange-400 to-rose-500' },
    { to: '/waiter', icon: Tablet, title: tr.waiter, desc: tr.waiterDesc, role: 'WAITER', accent: 'from-amber-400 to-orange-500' },
    { to: '/kitchen', icon: ChefHat, title: tr.kitchen, desc: tr.kitchenDesc, role: 'KITCHEN', accent: 'from-red-400 to-orange-600' },
    { to: '/admin', icon: LayoutDashboard, title: tr.admin, desc: tr.adminDesc, role: 'ADMIN', accent: 'from-yellow-400 to-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-warm flex items-center justify-center font-display font-bold text-lg text-accent-foreground shadow-glow">
              H
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-none">HoReCa OS</div>
              <div className="text-xs text-muted-foreground mt-0.5">v1.0 · MVP</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}>
            <Languages className="h-4 w-4 mr-2" />{lang.toUpperCase()}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-xs font-semibold tracking-wide text-accent">LIVE PROTOTYPE · UAH</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            {lang === 'ua' ? (
              <>Усе для ресторану.<br /><span className="text-accent">В одному місці.</span></>
            ) : (
              <>Everything for your venue.<br /><span className="text-accent">In one place.</span></>
            )}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            {tr.tagline}. {lang === 'ua' ? 'Оберіть зону для входу.' : 'Choose a zone to enter.'}
          </p>
        </div>

        {/* Zone selector */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {zones.map((z, i) => (
            <Link
              key={z.to}
              to={z.to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-accent/40 hover:shadow-elegant transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${z.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <z.icon className="h-6 w-6 text-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground">{z.role}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{z.title}</h3>
                  <p className="text-sm text-muted-foreground">{z.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-border">
          {[
            { v: '4', l: lang === 'ua' ? 'Зони' : 'Zones' },
            { v: '6', l: lang === 'ua' ? 'Ролі' : 'Roles' },
            { v: '12', l: lang === 'ua' ? 'Столи' : 'Tables' },
            { v: 'UAH', l: lang === 'ua' ? 'Валюта' : 'Currency' },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl md:text-4xl font-bold text-accent">{s.v}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="container py-8 text-xs text-muted-foreground flex justify-between">
        <span>© 2026 HoReCa OS</span>
        <span>{lang === 'ua' ? 'Прототип · мок-дані' : 'Prototype · mock data'}</span>
      </footer>
    </div>
  );
};

export default Index;
