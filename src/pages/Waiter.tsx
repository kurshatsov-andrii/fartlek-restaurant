import { useMemo, useState } from 'react';
import { Plus, Users, Receipt, Split, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { initialTables, dishes, fmtUAH, Table, Zone } from '@/lib/mockData';
import { ZoneHeader } from '@/components/ZoneHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<Table['status'], string> = {
  free: 'bg-success/15 border-success/50 text-success',
  occupied: 'bg-gradient-bordeaux border-gold/50 text-gold-light',
  reserved: 'bg-warning/15 border-warning/50 text-warning',
  payment: 'bg-info/15 border-info/50 text-info',
};

const zones: { id: Zone; labelUa: string; labelEn: string }[] = [
  { id: 'main', labelUa: 'Основна зала', labelEn: 'Main hall' },
  { id: 'terrace', labelUa: 'Тераса', labelEn: 'Terrace' },
  { id: 'vip', labelUa: 'VIP', labelEn: 'VIP' },
];

const Waiter = () => {
  const { tr, lang } = useI18n();
  const [tables, setTables] = useState(initialTables);
  const [selected, setSelected] = useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});
  const [zone, setZone] = useState<Zone>('main');

  const visibleTables = useMemo(() => tables.filter((t) => t.zone === zone), [tables, zone]);

  const openTable = (t: Table) => {
    setSelected(t);
    setOrderItems({});
  };

  const addItem = (id: string) => setOrderItems(o => ({ ...o, [id]: (o[id] || 0) + 1 }));
  const removeItem = (id: string) => setOrderItems(o => { const n = { ...o }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  const orderTotal = Object.entries(orderItems).reduce((s, [id, q]) => {
    const d = dishes.find(x => x.id === id); return s + (d ? d.price * q : 0);
  }, 0);

  const sendToKitchen = () => {
    if (!selected || Object.keys(orderItems).length === 0) return;
    setTables(ts => ts.map(t => t.id === selected.id ? { ...t, status: 'occupied', guests: t.guests || 2, total: (t.total || 0) + orderTotal } : t));
    toast.success(`${tr.newOrder} · ${tr.table} №${selected.id}`);
    setSelected(null);
  };

  const closeBill = () => {
    if (!selected) return;
    setTables(ts => ts.map(t => t.id === selected.id ? { ...t, status: 'free', guests: undefined, total: undefined } : t));
    toast.success(`✓ ${tr.closeBill} · ${tr.table} №${selected.id}`);
    setSelected(null);
  };

  const counts = {
    free: visibleTables.filter(t => t.status === 'free').length,
    occupied: visibleTables.filter(t => t.status === 'occupied').length,
    reserved: visibleTables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <ZoneHeader zone="FLOOR" title={tr.floorPlan} subtitle={`${visibleTables.length} ${tr.tables}`} />

      <div className="px-4 md:px-8 py-4 border-b border-border bg-card/50">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border overflow-x-auto">
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setZone(z.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  zone === z.id
                    ? 'bg-gradient-gold text-primary-foreground shadow-1'
                    : 'text-muted-foreground hover:text-gold'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {lang === 'ua' ? z.labelUa : z.labelEn}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {(['free', 'occupied', 'reserved'] as const).map(s => (
              <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${statusColors[s]}`}>
                <span className="h-2 w-2 rounded-full bg-current" />
                <span className="font-semibold text-sm">{tr[s]}</span>
                <span className="font-display font-bold">{counts[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visibleTables.map(t => (
            <button
              key={t.id}
              onClick={() => openTable(t)}
              className={`border-2 transition-all active:scale-95 ${statusColors[t.status]} ${t.shape === 'round' ? 'rounded-full aspect-square' : 'rounded-xl aspect-[4/3]'} flex flex-col items-center justify-center font-bold p-2 min-h-[110px]`}
            >
              <div className="font-display text-2xl leading-none">№{t.id}</div>
              <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
                <Users className="h-3 w-3" />{t.guests || t.seats}
              </div>
              {t.total && <div className="text-[10px] font-mono mt-0.5">{fmtUAH(t.total)}</div>}
            </button>
          ))}
        </div>

        <div className="hidden md:block relative bg-card border-2 border-dashed border-border rounded-3xl p-6 min-h-[600px] overflow-hidden" style={{ backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div className="absolute top-4 left-4 text-xs text-muted-foreground font-mono uppercase tracking-widest">
            {(lang === 'ua' ? zones.find((z) => z.id === zone)?.labelUa : zones.find((z) => z.id === zone)?.labelEn)} · {lang === 'ua' ? 'Поверх 1' : 'Floor 1'}
          </div>
          {visibleTables.map(t => (
            <button
              key={t.id}
              onClick={() => openTable(t)}
              className={`absolute border-2 transition-all hover:scale-105 hover:z-10 ${statusColors[t.status]} ${t.shape === 'round' ? 'rounded-full' : 'rounded-xl'} flex flex-col items-center justify-center font-bold p-2`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: t.seats <= 2 ? '88px' : t.seats <= 4 ? '110px' : '140px',
                height: t.seats <= 2 ? '88px' : t.seats <= 4 ? '110px' : '120px',
              }}
            >
              <div className="font-display text-2xl leading-none">№{t.id}</div>
              <div className="flex items-center gap-1 text-xs mt-1 opacity-80">
                <Users className="h-3 w-3" />{t.guests || t.seats}
              </div>
              {t.total && <div className="text-[10px] font-mono mt-0.5">{fmtUAH(t.total)}</div>}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-auto p-4 md:p-6">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl md:text-2xl flex items-center gap-3 flex-wrap">
                  {tr.table} №{selected.id}
                  <span className={`text-xs px-2 py-1 rounded-full border-2 ${statusColors[selected.status]}`}>{tr[selected.status]}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-display font-bold mb-2">{tr.menu}</h3>
                  <div className="space-y-1.5 max-h-96 overflow-auto pr-2">
                    {dishes.map(d => (
                      <button
                        key={d.id}
                        onClick={() => addItem(d.id)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span className="text-xl">{d.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{d.name[lang]}</div>
                          <div className="text-xs opacity-70">{fmtUAH(d.price)}</div>
                        </div>
                        <Plus className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold mb-2">{tr.newOrder}</h3>
                  <div className="bg-secondary rounded-2xl p-4 min-h-[200px]">
                    {Object.keys(orderItems).length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">{tr.empty}</div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(orderItems).map(([id, qty]) => {
                          const d = dishes.find(x => x.id === id)!;
                          return (
                            <div key={id} className="flex items-center gap-2 bg-card rounded-lg p-2">
                              <span>{d.emoji}</span>
                              <span className="flex-1 text-sm font-medium truncate">{d.name[lang]}</span>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(id)}><X className="h-3 w-3" /></Button>
                                <span className="font-bold w-5 text-center">{qty}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addItem(id)}><Plus className="h-3 w-3" /></Button>
                              </div>
                              <span className="font-bold text-sm w-20 text-right">{fmtUAH(d.price * qty)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <span className="text-muted-foreground">{tr.total}</span>
                    <span className="font-display font-bold text-2xl text-accent">{fmtUAH(orderTotal)}</span>
                  </div>
                  <Button className="w-full h-12 mt-3 rounded-xl font-semibold text-base" onClick={sendToKitchen} disabled={orderTotal === 0}>
                    <Receipt className="h-5 w-5 mr-2" />{tr.newOrder}
                  </Button>
                </div>
              </div>

              {selected.status === 'occupied' && (
                <div className="flex gap-2 pt-4 border-t border-border mt-4">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => toast.info(tr.splitBill)}>
                    <Split className="h-4 w-4 mr-2" />{tr.splitBill}
                  </Button>
                  <Button variant="destructive" className="flex-1 h-11" onClick={closeBill}>
                    <Receipt className="h-4 w-4 mr-2" />{tr.closeBill}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Waiter;

