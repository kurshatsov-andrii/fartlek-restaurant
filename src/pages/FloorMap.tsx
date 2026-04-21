import { useState, useRef, useEffect, useMemo } from 'react';
import { Users, Receipt, CreditCard, Calendar, CheckCircle2, Clock, MapPin, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { initialTables, dishes, fmtUAH, Table, TableStatus, Zone } from '@/lib/mockData';
import { ZoneHeader } from '@/components/ZoneHeader';
import { toast } from 'sonner';

const statusStyle: Record<TableStatus, { wrap: string; dot: string; label: string }> = {
  free:     { wrap: 'bg-success/10 border-success/60 text-success hover:bg-success/20', dot: 'bg-success', label: 'text-success' },
  occupied: { wrap: 'bg-destructive/15 border-destructive/60 text-destructive-foreground hover:bg-destructive/25', dot: 'bg-destructive', label: 'text-destructive' },
  reserved: { wrap: 'bg-warning/15 border-warning/60 text-warning hover:bg-warning/25', dot: 'bg-warning', label: 'text-warning' },
  payment:  { wrap: 'bg-info/15 border-info/60 text-info hover:bg-info/25', dot: 'bg-info', label: 'text-info' },
};

const statusIcon: Record<TableStatus, React.ElementType> = {
  free: CheckCircle2,
  occupied: Users,
  reserved: Calendar,
  payment: CreditCard,
};

const FloorMap = () => {
  const { tr, lang } = useI18n();
  const [tables, setTables] = useState(initialTables);
  const [zone, setZone] = useState<Zone>('main');
  const [selected, setSelected] = useState<Table | null>(null);
  const [now, setNow] = useState(Date.now());
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);

  // tick for live timers
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const visibleTables = useMemo(() => tables.filter(t => t.zone === zone), [tables, zone]);

  const counts = useMemo(() => ({
    free: visibleTables.filter(t => t.status === 'free').length,
    occupied: visibleTables.filter(t => t.status === 'occupied').length,
    reserved: visibleTables.filter(t => t.status === 'reserved').length,
    payment: visibleTables.filter(t => t.status === 'payment').length,
  }), [visibleTables]);

  const occupancyPct = visibleTables.length
    ? Math.round(((counts.occupied + counts.payment) / visibleTables.length) * 100)
    : 0;

  // ===== Drag & Drop =====
  const onPointerDown = (e: React.PointerEvent, t: Table) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const tableEl = e.currentTarget as HTMLElement;
    const tRect = tableEl.getBoundingClientRect();
    dragState.current = {
      id: t.id,
      offsetX: e.clientX - tRect.left,
      offsetY: e.clientY - tRect.top,
    };
    tableEl.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragState.current.offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragState.current.offsetY) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(92, x));
    const clampedY = Math.max(0, Math.min(88, y));
    setTables(ts => ts.map(t => t.id === dragState.current!.id ? { ...t, x: clampedX, y: clampedY } : t));
  };

  const onPointerUp = (e: React.PointerEvent, didMove: boolean) => {
    const wasDragging = !!dragState.current;
    dragState.current = null;
    if (!wasDragging) return;
    e.stopPropagation();
  };

  // Click vs drag detection
  const handleTableClick = (t: Table, hasMoved: boolean) => {
    if (hasMoved) return;
    setSelected(t);
  };

  const changeStatus = (newStatus: TableStatus) => {
    if (!selected) return;
    setTables(ts => ts.map(t => t.id === selected.id ? { ...t, status: newStatus, ...(newStatus === 'free' ? { guests: undefined, total: undefined, waiter: undefined, orderItems: undefined, orderStartedAt: undefined } : {}) } : t));
    setSelected(s => s ? { ...s, status: newStatus } : s);
    toast.success(`${tr.table} №${selected.id} → ${tr[newStatus]}`);
  };

  const closeBill = () => {
    if (!selected) return;
    toast.success(`✓ ${tr.closeBill} · ${tr.table} №${selected.id} · ${fmtUAH(selected.total || 0)}`);
    changeStatus('free');
    setSelected(null);
  };

  const zones: { id: Zone; label: string }[] = [
    { id: 'main', label: tr.mainHall },
    { id: 'terrace', label: tr.terrace },
    { id: 'vip', label: tr.vip },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ZoneHeader zone="FLOOR MAP" title={tr.floorMap} subtitle={`${visibleTables.length} ${tr.tables} · ${tr.occupancy} ${occupancyPct}%`} />

      {/* Zone tabs + legend */}
      <div className="px-4 md:px-8 py-4 border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => setZone(z.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  zone === z.id
                    ? 'bg-gradient-gold text-primary-foreground shadow-1'
                    : 'text-muted-foreground hover:text-gold'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />{z.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['free', 'occupied', 'reserved', 'payment'] as TableStatus[]).map(s => {
              const Icon = statusIcon[s];
              return (
                <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusStyle[s].wrap}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wider">{tr[s]}</span>
                  <span className="font-display font-bold text-sm">{counts[s]}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 hidden md:flex items-center gap-1.5">
          <GripVertical className="h-3 w-3" />{tr.dragHint}
        </p>
      </div>

      {/* MOBILE: card grid */}
      <div className="md:hidden p-4 grid grid-cols-2 gap-3">
        {visibleTables.map(t => (
          <TableCard key={t.id} t={t} now={now} onClick={() => setSelected(t)} />
        ))}
      </div>

      {/* DESKTOP: drag-and-drop canvas */}
      <div className="hidden md:block p-6 lg:p-8">
        <div
          ref={canvasRef}
          className="relative bg-card border-2 border-dashed border-border rounded-3xl min-h-[640px] overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          <div className="absolute top-4 left-5 text-[10px] text-muted-foreground font-mono uppercase tracking-[0.25em]">
            {zones.find(z => z.id === zone)?.label} · {lang === 'ua' ? 'Поверх 1' : 'Floor 1'}
          </div>

          {visibleTables.map(t => (
            <DraggableTable
              key={t.id}
              t={t}
              now={now}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onClick={() => setSelected(t)}
            />
          ))}
        </div>
      </div>

      {/* DETAILS DIALOG */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-auto p-5 md:p-6 bg-card">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-3 flex-wrap">
                  {tr.table} №{selected.id}
                  <span className={`text-xs px-3 py-1 rounded-full border-2 inline-flex items-center gap-1.5 ${statusStyle[selected.status].wrap}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle[selected.status].dot}`} />
                    {tr[selected.status]}
                  </span>
                </DialogTitle>
              </DialogHeader>

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Stat label={tr.capacity} value={`${selected.guests || 0} / ${selected.seats}`} icon={Users} />
                <Stat label={tr.waiterName} value={selected.waiter || '—'} icon={Users} />
                <Stat label={lang === 'ua' ? 'Час' : 'Time'} value={selected.orderStartedAt ? `${Math.round((now - selected.orderStartedAt) / 60_000)} ${tr.minAgo}` : '—'} icon={Clock} />
              </div>

              {/* Order */}
              <div className="mt-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">{tr.viewOrder}</h3>
                <div className="bg-muted rounded-xl p-3 border border-border">
                  {selected.orderItems && selected.orderItems.length > 0 ? (
                    <div className="space-y-2">
                      {selected.orderItems.map((it, i) => {
                        const d = dishes.find(x => x.id === it.dishId);
                        if (!d) return null;
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-lg">{d.emoji}</span>
                            <span className="flex-1 font-medium truncate">{d.name[lang]}</span>
                            <span className="text-muted-foreground text-xs">×{it.qty}</span>
                            <span className="font-mono font-semibold w-24 text-right">{fmtUAH(d.price * it.qty)}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
                        <span className="text-muted-foreground text-sm">{tr.total}</span>
                        <span className="font-display font-bold text-2xl text-gold">{fmtUAH(selected.total || 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-6">{tr.noOrder}</div>
                  )}
                </div>
              </div>

              {/* Status actions */}
              <div className="mt-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">{tr.changeStatus}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['free', 'occupied', 'reserved', 'payment'] as TableStatus[]).map(s => {
                    const Icon = statusIcon[s];
                    const active = selected.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => changeStatus(s)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                          active ? statusStyle[s].wrap : 'border-border text-muted-foreground hover:text-gold hover:border-gold/40'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />{tr[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(selected.status === 'occupied' || selected.status === 'payment') && (
                <Button
                  className="w-full h-12 mt-5 rounded-xl font-semibold bg-gradient-gold text-primary-foreground hover:opacity-90"
                  onClick={closeBill}
                >
                  <Receipt className="h-5 w-5 mr-2" />{tr.closeBill} · {fmtUAH(selected.total || 0)}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ===== Sub-components =====

const Stat = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) => (
  <div className="bg-muted/50 border border-border rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
      <Icon className="h-3 w-3" />{label}
    </div>
    <div className="font-display font-bold text-sm truncate">{value}</div>
  </div>
);

const TableCard = ({ t, now, onClick }: { t: Table; now: number; onClick: () => void }) => {
  const Icon = statusIcon[t.status];
  const minutes = t.orderStartedAt ? Math.round((now - t.orderStartedAt) / 60_000) : null;
  return (
    <button
      onClick={onClick}
      className={`relative border-2 transition-all active:scale-95 ${statusStyle[t.status].wrap} ${t.shape === 'round' ? 'rounded-full aspect-square' : 'rounded-2xl aspect-[4/3]'} flex flex-col items-center justify-center p-2 min-h-[120px]`}
    >
      <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${statusStyle[t.status].dot} animate-pulse`} />
      <div className="font-display font-bold text-2xl leading-none">№{t.id}</div>
      <div className="flex items-center gap-1 text-[10px] mt-1.5 opacity-80">
        <Users className="h-3 w-3" />{t.guests || t.seats}
      </div>
      {t.total !== undefined && <div className="text-[10px] font-mono font-semibold mt-1">{fmtUAH(t.total)}</div>}
      {minutes !== null && <div className="text-[9px] font-mono mt-0.5 opacity-60">{minutes}m</div>}
      <Icon className="h-3 w-3 absolute bottom-2 left-2 opacity-60" />
    </button>
  );
};

const DraggableTable = ({
  t, now, onPointerDown, onPointerMove, onPointerUp, onClick,
}: {
  t: Table; now: number;
  onPointerDown: (e: React.PointerEvent, t: Table) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent, hasMoved: boolean) => void;
  onClick: () => void;
}) => {
  const Icon = statusIcon[t.status];
  const minutes = t.orderStartedAt ? Math.round((now - t.orderStartedAt) / 60_000) : null;
  const movedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const size = t.seats <= 2 ? 92 : t.seats <= 4 ? 116 : 144;

  return (
    <div
      onPointerDown={(e) => {
        startRef.current = { x: e.clientX, y: e.clientY };
        movedRef.current = false;
        onPointerDown(e, t);
      }}
      onPointerMove={(e) => {
        if (startRef.current) {
          const dx = Math.abs(e.clientX - startRef.current.x);
          const dy = Math.abs(e.clientY - startRef.current.y);
          if (dx > 4 || dy > 4) movedRef.current = true;
        }
        onPointerMove(e);
      }}
      onPointerUp={(e) => {
        onPointerUp(e, movedRef.current);
        if (!movedRef.current) onClick();
        startRef.current = null;
      }}
      className={`absolute select-none cursor-grab active:cursor-grabbing border-2 transition-shadow hover:shadow-hover hover:z-10 ${statusStyle[t.status].wrap} ${t.shape === 'round' ? 'rounded-full' : 'rounded-2xl'} flex flex-col items-center justify-center p-2 touch-none`}
      style={{
        left: `${t.x}%`,
        top: `${t.y}%`,
        width: size,
        height: t.shape === 'round' ? size : size * 0.85,
      }}
    >
      <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${statusStyle[t.status].dot} ${t.status !== 'free' ? 'animate-pulse' : ''}`} />
      <div className="font-display font-bold text-2xl leading-none">№{t.id}</div>
      <div className="flex items-center gap-1 text-[10px] mt-1.5 opacity-80">
        <Users className="h-3 w-3" />{t.guests || t.seats}
      </div>
      {t.total !== undefined && <div className="text-[10px] font-mono font-semibold mt-1">{fmtUAH(t.total)}</div>}
      {minutes !== null && <div className="text-[9px] font-mono mt-0.5 opacity-60 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{minutes}m</div>}
      <Icon className="h-3 w-3 absolute bottom-2 left-2 opacity-60" />
    </div>
  );
};

export default FloorMap;
