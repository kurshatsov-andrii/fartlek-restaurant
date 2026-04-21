import { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Flame, Check, GripVertical, Loader2, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ZoneHeader } from '@/components/ZoneHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type KStatus = 'new' | 'progress' | 'ready';
interface KOrder {
  id: string;
  code: string;
  table: number;
  status: KStatus;
  priority: boolean;
  createdAt: number;
  items: { name: string; qty: number }[];
}

const MAX_PREP_MS = 5 * 60 * 1000; // 5 хвилин
const NEXT_STATUS: Record<KStatus, KStatus | null> = { new: 'progress', progress: 'ready', ready: null };

const Kitchen = () => {
  const { tr } = useI18n();
  const [orders, setOrders] = useState<KOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => localStorage.getItem('kds-sound') !== 'off');
  const [, tick] = useState(0);
  const alertedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const i = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    localStorage.setItem('kds-sound', soundOn ? 'on' : 'off');
  }, [soundOn]);

  const beep = () => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(880, 0, 0.25);
      playTone(660, 0.3, 0.35);
    } catch {}
  };

  const fetchOrders = async () => {
    const { data: os, error } = await supabase
      .from('kitchen_orders')
      .select('id, code, table_number, status, priority, created_at, kitchen_order_items(name, qty)')
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const mapped: KOrder[] = (os || []).map((o: any) => ({
      id: o.id,
      code: o.code,
      table: o.table_number,
      status: o.status,
      priority: o.priority,
      createdAt: new Date(o.created_at).getTime(),
      items: (o.kitchen_order_items || []).map((it: any) => ({ name: it.name, qty: it.qty })),
    }));
    setOrders(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const ch = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Перевірка перевищення 5 хв → звук
  useEffect(() => {
    const now = Date.now();
    orders.forEach(o => {
      if (o.status !== 'ready' && now - o.createdAt >= MAX_PREP_MS && !alertedRef.current.has(o.id)) {
        alertedRef.current.add(o.id);
        beep();
        toast.warning(`${o.code} · стіл №${o.table} — час приготування перевищено`);
      }
    });
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const moveOrder = async (id: string, status: KStatus) => {
    const prev = orders;
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
    const { error } = await supabase.from('kitchen_orders').update({ status }).eq('id', id);
    if (error) {
      setOrders(prev);
      toast.error(error.message);
    }
  };

  const completeOrder = async (id: string) => {
    const prev = orders;
    setOrders(os => os.filter(o => o.id !== id));
    alertedRef.current.delete(id);
    const { error } = await supabase.from('kitchen_orders').delete().eq('id', id);
    if (error) {
      setOrders(prev);
      toast.error(error.message);
    } else {
      toast.success('✓');
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const target = String(over.id) as KStatus;
    const order = orders.find(o => o.id === active.id);
    if (!order || order.status === target) return;
    moveOrder(order.id, target);
  };

  const columns: { key: KStatus; title: string; tone: string }[] = [
    { key: 'new', title: tr.new, tone: 'border-l-warning' },
    { key: 'progress', title: tr.inProgress, tone: 'border-l-accent' },
    { key: 'ready', title: tr.ready, tone: 'border-l-success' },
  ];

  const activeOrder = useMemo(() => orders.find(o => o.id === activeId), [orders, activeId]);

  return (
    <div className="min-h-screen bg-background">
      <ZoneHeader zone="KITCHEN" title="KDS · Kitchen Display" subtitle={`${orders.length} active`} />

      <div className="flex justify-end px-4 md:px-6 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSoundOn(s => !s)}
          className="gap-2 border-gold/30"
          title={soundOn ? 'Звук увімкнено' : 'Звук вимкнено'}
        >
          {soundOn ? <Volume2 className="h-4 w-4 text-gold" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs uppercase tracking-wider">{soundOn ? 'Sound on' : 'Sound off'}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(col => (
              <Column
                key={col.key}
                col={col}
                orders={orders.filter(o => o.status === col.key)}
                onComplete={completeOrder}
                onMove={moveOrder}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOrder && <OrderCard o={activeOrder} dragging />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

const Column = ({
  col, orders, onComplete, onMove,
}: {
  col: { key: KStatus; title: string; tone: string };
  orders: KOrder[];
  onComplete: (id: string) => void;
  onMove: (id: string, s: KStatus) => void;
}) => {
  const { tr } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <div
      ref={setNodeRef}
      className={`bg-sidebar-accent rounded-2xl border-l-4 ${col.tone} flex flex-col min-h-[70vh] transition-all ${isOver ? 'ring-2 ring-gold/60 bg-sidebar-accent/80' : ''}`}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-sidebar-border">
        <h2 className="font-display font-bold text-lg uppercase tracking-wide">{col.title}</h2>
        <span className="font-display font-bold text-2xl">{orders.length}</span>
      </div>
      <div className="p-3 space-y-3 overflow-auto flex-1">
        {orders.length === 0 && (
          <div className="text-center text-sidebar-foreground/40 py-12 text-sm border-2 border-dashed border-sidebar-border rounded-xl">
            {tr.empty}
          </div>
        )}
        {orders.map(o => (
          <DraggableOrder key={o.id} o={o} onComplete={onComplete} onMove={onMove} />
        ))}
      </div>
    </div>
  );
};

const DraggableOrder = ({
  o, onComplete, onMove,
}: {
  o: KOrder;
  onComplete: (id: string) => void;
  onMove: (id: string, s: KStatus) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: o.id });
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <OrderCard o={o} onComplete={onComplete} onMove={onMove} dragHandle={{ attributes, listeners }} />
    </div>
  );
};

const OrderCard = ({
  o, dragging, onComplete, onMove, dragHandle,
}: {
  o: KOrder;
  dragging?: boolean;
  onComplete?: (id: string) => void;
  onMove?: (id: string, s: KStatus) => void;
  dragHandle?: { attributes: any; listeners: any };
}) => {
  const { tr } = useI18n();
  const elapsed = Date.now() - o.createdAt;
  const mins = Math.floor(elapsed / 60_000);
  const secs = Math.floor((elapsed % 60_000) / 1000);
  const pct = Math.min(100, (elapsed / MAX_PREP_MS) * 100);
  const overdue = elapsed >= MAX_PREP_MS;
  const urgent = elapsed >= MAX_PREP_MS * 0.7;

  const next = NEXT_STATUS[o.status];
  const nextLabel = next === 'progress' ? tr.inProgress : next === 'ready' ? tr.ready : '';

  const barColor = overdue ? 'bg-destructive' : urgent ? 'bg-warning' : 'bg-success';

  return (
    <div className={`bg-sidebar rounded-xl p-4 border ${overdue ? 'border-destructive animate-pulse-glow' : urgent ? 'border-warning/60' : 'border-sidebar-border'} ${dragging ? 'shadow-2xl ring-2 ring-gold rotate-2' : 'animate-fade-in'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded hover:bg-sidebar-accent"
            {...(dragHandle?.attributes || {})}
            {...(dragHandle?.listeners || {})}
            aria-label="Drag"
          >
            <GripVertical className="h-4 w-4 text-sidebar-foreground/60" />
          </button>
          <span className="font-mono font-bold text-sm">{o.code}</span>
          {o.priority && <Flame className="h-4 w-4 text-accent" />}
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono ${overdue ? 'text-destructive font-bold' : urgent ? 'text-warning' : 'text-sidebar-foreground/60'}`}>
          <Clock className="h-3 w-3" />
          {mins}:{secs.toString().padStart(2, '0')}
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

      {/* Прогрес-бар таймера 5 хв */}
      <div className="h-1.5 w-full bg-sidebar-accent rounded-full overflow-hidden mb-3">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-2">
        {next && onMove && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-gold/40 text-gold hover:bg-gold/10"
            onClick={(e) => { e.stopPropagation(); onMove(o.id, next); }}
          >
            <ArrowRight className="h-4 w-4 mr-1" />{nextLabel}
          </Button>
        )}
        {o.status === 'ready' && onComplete && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-success hover:bg-success/10"
            onClick={(e) => { e.stopPropagation(); onComplete(o.id); }}
          >
            <Check className="h-4 w-4 mr-1" />Done
          </Button>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
