import { Link } from 'react-router-dom';
import { Languages, ArrowRight, LogIn, LogOut, ShieldCheck, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth, roleToZone } from '@/lib/auth';

const Index = () => {
  const { lang, setLang, tr } = useI18n();
  const { user, roles, signOut } = useAuth();
  const ua = lang === 'ua';

  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-hero">
      {/* Topbar */}
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-40 bg-background/70">
        <div className="container flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-gold flex items-center justify-center font-display font-bold text-lg text-primary-foreground shadow-gold">
              F
            </div>
            <div>
              <div className="font-display font-bold text-base leading-none tracking-tight">FARTLEK</div>
              <div className="text-[10px] text-muted-foreground mt-1 tracking-[0.25em] uppercase">HoReCa OS</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(ua ? 'en' : 'ua')} className="text-muted-foreground hover:text-gold">
              <Languages className="h-4 w-4 mr-2" />{lang.toUpperCase()}
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-gold">
                <LogOut className="h-4 w-4 mr-2" />{ua ? 'Вихід' : 'Sign out'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bordeaux-dark border border-gold/30 mb-8">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gold-light">
              {ua ? 'Преміум · Ресторанна ОС' : 'Premium · Restaurant OS'}
            </span>
          </div>
          <h1 className="font-display font-bold leading-[1.05] tracking-tight text-balance">
            {ua ? (
              <>Вишуканий сервіс.<br /><span className="text-gold">Бездоганна робота.</span></>
            ) : (
              <>Refined service.<br /><span className="text-gold">Flawless operations.</span></>
            )}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {ua
              ? 'Цифрова платформа для закладів преміум-класу: меню, столи, кухня, аналітика — в єдиному просторі.'
              : 'A digital platform for premium venues: menu, tables, kitchen and analytics — unified.'}
          </p>
        </div>

        {/* Two entry points */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Customer */}
          <Link
            to="/customer"
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 md:p-10 hover:border-gold/40 transition-all duration-500 shadow-1 hover:shadow-hover animate-fade-in-up"
          >
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-bordeaux/40 blur-3xl group-hover:bg-bordeaux/60 transition-all duration-700" />
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-xl bg-bordeaux-dark border border-bordeaux-light/40 flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-gold-light" />
                </div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground">
                  {ua ? 'БЕЗ РЕЄСТРАЦІЇ' : 'NO SIGN-UP'}
                </span>
              </div>
              <h3 className="font-display text-3xl font-bold mb-3">{tr.customer}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">{tr.customerDesc}</p>
              <div className="flex items-center gap-2 text-gold text-sm font-semibold group-hover:gap-3 transition-all">
                {ua ? 'Переглянути меню' : 'Browse menu'} <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Staff entry */}
          {user ? (
            <Link
              to={roleToZone(roles)}
              className="group relative overflow-hidden rounded-2xl bg-gradient-bordeaux border border-gold/40 p-8 md:p-10 transition-all duration-500 shadow-2 hover:shadow-hover animate-fade-in-up"
              style={{ animationDelay: '120ms' }}
            >
              <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="h-14 w-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                    <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.2em] text-gold-light">
                    {roles.join(' · ').toUpperCase() || 'STAFF'}
                  </span>
                </div>
                <h3 className="font-display text-3xl font-bold mb-3">
                  {ua ? 'Робоча зона' : 'Your zone'}
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-8">
                  {ua ? 'Ви увійшли як персонал. Перейдіть до робочого простору.' : 'You are signed in as staff. Continue to your workspace.'}
                </p>
                <div className="flex items-center gap-2 text-gold-light text-sm font-semibold group-hover:gap-3 transition-all">
                  {ua ? 'Перейти' : 'Continue'} <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="group relative overflow-hidden rounded-2xl bg-gradient-bordeaux border border-bordeaux-light/40 p-8 md:p-10 hover:border-gold/40 transition-all duration-500 shadow-2 hover:shadow-hover animate-fade-in-up"
              style={{ animationDelay: '120ms' }}
            >
              <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gold/10 blur-3xl group-hover:bg-gold/20 transition-all duration-700" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="h-14 w-14 rounded-xl bg-bordeaux-dark border border-gold/30 flex items-center justify-center">
                    <LogIn className="h-6 w-6 text-gold" />
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.2em] text-gold-light/70">
                    {ua ? 'EMAIL · ПАРОЛЬ · PIN' : 'EMAIL · PASSWORD · PIN'}
                  </span>
                </div>
                <h3 className="font-display text-3xl font-bold mb-3">
                  {ua ? 'Вхід персоналу' : 'Staff sign in'}
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-8">
                  {ua
                    ? 'Офіціант, кухня, касир, менеджер, власник.'
                    : 'Waiter, kitchen, cashier, manager, owner.'}
                </p>
                <div className="flex items-center gap-2 text-gold text-sm font-semibold group-hover:gap-3 transition-all">
                  {ua ? 'Увійти' : 'Sign in'} <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="gold-divider mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { v: '4', l: ua ? 'Зони' : 'Zones' },
              { v: '6', l: ua ? 'Ролі' : 'Roles' },
              { v: '12', l: ua ? 'Столи' : 'Tables' },
              { v: '24/7', l: ua ? 'Підтримка' : 'Support' },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-gold">{s.v}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mt-2">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="gold-divider mt-10" />
        </div>
      </section>

      <footer className="container py-10 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between items-center">
        <span>© 2026 FARTLEK · HoReCa OS</span>
        <span className="tracking-widest uppercase">{ua ? 'Створено для розкоші' : 'Crafted for luxury'}</span>
      </footer>
    </div>
  );
};

export default Index;
