import { useState, useEffect } from 'react';
import { Clock, Flame, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { initialKitchenOrders, KitchenOrder } from '@/lib/mockData';
import { ZoneHeader } from '@/components/ZoneHeader';
import { toast } from 'sonner';

const Kitchen = () => {
  const { tr } = useI18n();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialKitchenOrders);
  const [, tick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => tick(t => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const move = (id: string, dir: 1 | -1) => {
    const flow: KitchenOrder['status'][] = ['new', 'progress', 'ready'];
    setOrders(os => os.map(o => {
      if (o.id !== id) return o;
      const idx = flow.indexOf(o.status);
      const nextIdx = Math.min(flow.length - 1, Math.max(0, idx + dir));
      return { ...o, status: flow[nextIdx] };
    }));
    toast.success(`${id} → ${dir > 0 ? '▶' : '◀'}`);
  };

  const columns: { key: KitchenOrder['status']; title: string; tone: string }[] = [
    { key: 'new', title: tr.new, tone: 'border-l-warning' },
    { key: 'progress', title: tr.inProgress, tone: 'border-l-accent' },
    { key: 'ready', title: tr.ready, tone: 'border-l-success' },
  ];

  const minsAgo = (ts: number) => Math.floor((Date.now() - ts) / 60_000);

  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <ZoneHeader zone="KITCHEN" title="KDS · Kitchen Display" subtitle={`${orders.length} active`} variant="dark" />

      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.key);
          return (
            <div key={col.key} className={`bg-sidebar-accent rounded-2xl border-l-4 ${col.tone} flex flex-col min-h-[70vh]`}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-sidebar-border">
                <h2 className="font-display font-bold text-lg uppercase tracking-wide">{col.title}</h2>
                <span className="font-display font-bold text-2xl">{colOrders.length}</span>
              </div>
              <div className="p-3 space-y-3 overflow-auto flex-1">
                {colOrders.length === 0 && (
                  <div className="text-center text-sidebar-foreground/40 py-12 text-sm">—</div>
                )}
                {colOrders.map(o => {
                  const mins = minsAgo(o.createdAt);
                  const urgent = mins > 10;
                  return (
                    <div key={o.id} className={`bg-sidebar rounded-xl p-4 border ${urgent ? 'border-destructive animate-pulse-glow' : 'border-sidebar-border'} animate-fade-in`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{o.id}</span>
                          {o.priority && <Flame className="h-4 w-4 text-accent" />}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-mono ${urgent ? 'text-destructive font-bold' : 'text-sidebar-foreground/60'}`}>
                          <Clock className="h-3 w-3" />{mins} {tr.minAgo}
                        </div>
                      </div>
                      <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">
                        {tr.table} №{o.table}
                      </div>
                      <ul className="space-y-1 mb-3">
                        {o.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="truncate">{it.name}</span>
                            <span className="font-bold text-accent ml-2">×{it.qty}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 pt-3 border-t border-sidebar-border">
                        {col.key !== 'new' && (
                          <Button size="sm" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent flex-1" onClick={() => move(o.id, -1)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        {col.key !== 'ready' ? (
                          <Button size="sm" className="flex-[2] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => move(o.id, 1)}>
                            {col.key === 'new' ? tr.inProgress : tr.ready}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="flex-[2] text-success hover:bg-success/10" onClick={() => setOrders(os => os.filter(x => x.id !== o.id))}>
                            <Check className="h-4 w-4 mr-1" />Done
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kitchen;
