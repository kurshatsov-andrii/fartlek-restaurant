import { useState, useEffect, useMemo } from 'react';
import { Clock, Flame, Check, GripVertical, Loader2 } from 'lucide-react';
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

const Kitchen = () => {
  const { tr } = useI18n();
  const [orders, setOrders] = useState<KOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => tick(t => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  // Fetch orders + items
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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(col => (
              <Column key={col.key} col={col} orders={orders.filter(o => o.status === col.key)} onComplete={completeOrder} onMove={moveOrder} />
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
          <DraggableOrder key={o.id} o={o} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
};

const DraggableOrder = ({ o, onComplete }: { o: KOrder; onComplete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: o.id });
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    touchAction: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard o={o} onComplete={onComplete} />
    </div>
  );
};

const OrderCard = ({
  o, dragging, listeners, onComplete,
}: {
  o: KOrder;
  dragging?: boolean;
  listeners?: any;
  onComplete?: (id: string) => void;
}) => {
  const { tr } = useI18n();
  const mins = Math.floor((Date.now() - o.createdAt) / 60_000);
  const urgent = mins > 10;
  return (
    <div className={`bg-sidebar rounded-xl p-4 border cursor-grab active:cursor-grabbing ${urgent ? 'border-destructive animate-pulse-glow' : 'border-sidebar-border'} ${dragging ? 'shadow-2xl ring-2 ring-gold rotate-2' : 'animate-fade-in'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-sidebar-foreground/40" />
          <span className="font-mono font-bold text-sm">{o.code}</span>
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
      {o.status === 'ready' && onComplete && (
        <Button size="sm" variant="ghost" className="w-full text-success hover:bg-success/10" onClick={() => onComplete(o.id)}>
          <Check className="h-4 w-4 mr-1" />Done
        </Button>
      )}
    </div>
  );
};

export default Kitchen;
