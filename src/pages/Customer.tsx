import { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Minus, X, Check, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { categories, dishes, fmtUAH } from '@/lib/mockData';
import { ZoneHeader } from '@/components/ZoneHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Customer = () => {
  const { lang, tr } = useI18n();
  const [activeCat, setActiveCat] = useState('starters');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState(false);
  const tableNo = 7;

  const filtered = useMemo(() => dishes.filter(d => d.category === activeCat), [activeCat]);
  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => ({ dish: dishes.find(d => d.id === id)!, qty })).filter(i => i.dish), [cart]);
  const total = cartItems.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const add = (id: string) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id: string) => setCart(c => { const n = { ...c }; if (!n[id]) return n; n[id]--; if (n[id] <= 0) delete n[id]; return n; });

  const place = () => {
    setCart({});
    setPlaced(true);
    toast.success(tr.orderPlaced);
    setTimeout(() => setPlaced(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <ZoneHeader zone="GUEST" title={`${tr.yourTable} · №${tableNo}`} subtitle="QR Menu" />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-5 bg-muted">
            <TabsTrigger value="menu">{tr.menu}</TabsTrigger>
            <TabsTrigger value="reservation"><CalendarDays className="h-4 w-4 mr-1" />{tr.reservation}</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-5">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                    activeCat === c.id
                      ? 'bg-gradient-gold text-primary-foreground border-transparent shadow-1'
                      : 'bg-card text-muted-foreground border-border hover:border-gold/40 hover:text-gold'
                  }`}
                >
                  {c.name[lang]}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-5 flex gap-4 animate-fade-in hover:border-gold/30 transition-colors shadow-1">
                  <div className="h-20 w-20 rounded-xl bg-gradient-bordeaux border border-bordeaux-light/40 flex items-center justify-center text-4xl flex-shrink-0">
                    {d.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-base leading-tight">{d.name[lang]}</h3>
                      {d.popular && <span className="text-[10px] bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-semibold tracking-wider">★ TOP</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{d.description[lang]}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-display font-bold text-gold text-lg">{fmtUAH(d.price)}</span>
                      {cart[d.id] ? (
                        <div className="flex items-center gap-1 bg-muted rounded-full border border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:text-gold" onClick={() => sub(d.id)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-sm font-semibold w-5 text-center">{cart[d.id]}</span>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:text-gold" onClick={() => add(d.id)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => add(d.id)} className="rounded-full h-9 px-4">
                          <Plus className="h-3 w-3 mr-1" />{tr.addToCart}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservation">
            <ReservationForm />
          </TabsContent>
        </Tabs>
      </div>

      {cartCount > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <Button className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full h-14 px-5 sm:px-6 shadow-hover bg-gradient-gold text-primary-foreground hover:opacity-90 z-50 max-w-[calc(100vw-2rem)]">
              <ShoppingBag className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">{tr.cart} · {cartCount}</span>
              <span className="ml-3 pl-3 border-l border-primary-foreground/30 font-bold whitespace-nowrap">{fmtUAH(total)}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-auto bg-card border-border">
            <SheetHeader>
              <SheetTitle className="font-display">{tr.cart} · {tr.table} №{tableNo}</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-4">
              {cartItems.map(i => (
                <div key={i.dish.id} className="flex items-center gap-3 py-2 border-b border-border">
                  <span className="text-2xl">{i.dish.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{i.dish.name[lang]}</div>
                    <div className="text-xs text-muted-foreground">{fmtUAH(i.dish.price)} × {i.qty}</div>
                  </div>
                  <span className="font-bold text-gold">{fmtUAH(i.dish.price * i.qty)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCart(c => { const n = { ...c }; delete n[i.dish.id]; return n; })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3">
                <span className="text-muted-foreground uppercase text-xs tracking-widest">{tr.total}</span>
                <span className="font-display font-bold text-3xl text-gold">{fmtUAH(total)}</span>
              </div>
              <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={place}>
                <Check className="h-5 w-5 mr-2" />{tr.checkout}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {placed && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-gold/40 rounded-3xl p-10 max-w-sm mx-4 text-center shadow-hover">
            <div className="h-16 w-16 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-5 shadow-gold">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold">{tr.orderPlaced}</h2>
            <p className="text-muted-foreground text-sm mt-2">{tr.table} №{tableNo}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ReservationForm = () => {
  const { tr } = useI18n();
  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); toast.success('✓ ' + tr.reservation); };
  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-1">
      <div>
        <Label>{tr.name}</Label>
        <Input required placeholder="Олена" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{tr.date}</Label><Input type="date" required /></div>
        <div><Label>{tr.time}</Label><Input type="time" required /></div>
      </div>
      <div><Label>{tr.guests}</Label><Input type="number" min={1} defaultValue={2} required /></div>
      <Button type="submit" className="w-full h-11 rounded-xl font-semibold">{tr.book}</Button>
    </form>
  );
};

export default Customer;
