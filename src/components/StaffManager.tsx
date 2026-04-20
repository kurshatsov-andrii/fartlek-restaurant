import { useEffect, useState } from 'react';
import { Edit3, KeyRound, Loader2, Save, X, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuth, AppRole } from '@/lib/auth';

interface StaffRow {
  id: string;
  email: string;
  full_name: string | null;
  has_pin: boolean;
  roles: AppRole[];
}

const ROLE_OPTIONS: AppRole[] = ['waiter', 'kitchen', 'cashier', 'manager'];

export const StaffManager = () => {
  const { lang } = useI18n();
  const ua = lang === 'ua';
  const { roles: myRoles } = useAuth();
  const isOwner = myRoles.includes('owner') || myRoles.includes('super_admin');

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [editName, setEditName] = useState('');
  const [pinTarget, setPinTarget] = useState<StaffRow | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: pe }, { data: roleRows, error: re }] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, pin_hash'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    if (pe || re) {
      toast.error(pe?.message || re?.message || 'Failed to load staff');
      setLoading(false);
      return;
    }
    const rolesByUser = new Map<string, AppRole[]>();
    (roleRows ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      rolesByUser.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        has_pin: !!p.pin_hash,
        roles: rolesByUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveName = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim() || null })
      .eq('id', editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ua ? "Ім'я оновлено" : 'Name updated');
    setEditing(null);
    load();
  };

  const savePin = async () => {
    if (!pinTarget) return;
    if (!/^[0-9]{4,8}$/.test(newPin)) return toast.error(ua ? 'PIN 4-8 цифр' : 'PIN must be 4-8 digits');
    if (newPin !== confirmPin) return toast.error(ua ? 'PIN не співпадає' : 'PIN mismatch');
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_user_pin' as any, { _user_id: pinTarget.id, _pin: newPin });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ua ? 'PIN встановлено' : 'PIN set');
    setPinTarget(null);
    setNewPin('');
    setConfirmPin('');
    load();
  };

  const clearPin = async (row: StaffRow) => {
    if (!confirm(ua ? `Видалити PIN для ${row.email}?` : `Clear PIN for ${row.email}?`)) return;
    const { error } = await supabase.rpc('admin_clear_user_pin' as any, { _user_id: row.id });
    if (error) return toast.error(error.message);
    toast.success(ua ? 'PIN видалено' : 'PIN cleared');
    load();
  };

  const setRole = async (row: StaffRow, role: AppRole) => {
    if (!isOwner) return toast.error(ua ? 'Лише власник може змінювати ролі' : 'Owner only');
    // Replace all non-special roles with the new single role
    const { error: delErr } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', row.id)
      .in('role', ROLE_OPTIONS);
    if (delErr) return toast.error(delErr.message);
    const { error: insErr } = await supabase.from('user_roles').insert({ user_id: row.id, role });
    if (insErr) return toast.error(insErr.message);
    toast.success(ua ? 'Роль оновлено' : 'Role updated');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xl">{ua ? 'Персонал' : 'Staff'} · {rows.length}</h3>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {ua ? 'Оновити' : 'Refresh'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>{ua ? "Ім'я" : 'Name'}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{ua ? 'Роль' : 'Role'}</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead className="text-right">{ua ? 'Дії' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                  {ua ? 'Поки немає зареєстрованих співробітників.' : 'No registered staff yet.'}
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.map((s) => {
              const primary = s.roles.find(r => ROLE_OPTIONS.includes(r)) ?? s.roles[0];
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-warm flex items-center justify-center text-accent-foreground font-bold text-sm">
                        {(s.full_name || s.email).split(/[ @.]/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold">{s.full_name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.email}</TableCell>
                  <TableCell>
                    {isOwner && primary && ROLE_OPTIONS.includes(primary) ? (
                      <Select value={primary} onValueChange={(v) => setRole(s, v as AppRole)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent font-semibold">
                        {s.roles.join(', ') || '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.has_pin ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success font-semibold">●●●●</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{ua ? 'Не встановлено' : 'Not set'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8" title={ua ? "Змінити ім'я" : 'Edit name'}
                      onClick={() => { setEditing(s); setEditName(s.full_name ?? ''); }}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title={ua ? 'Встановити PIN' : 'Set PIN'}
                      onClick={() => { setPinTarget(s); setNewPin(''); setConfirmPin(''); }}>
                      <KeyRound className="h-3 w-3" />
                    </Button>
                    {s.has_pin && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title={ua ? 'Видалити PIN' : 'Clear PIN'}
                        onClick={() => clearPin(s)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit name dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ua ? "Редагувати ім'я" : 'Edit name'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{editing?.email}</div>
            <div className="space-y-2">
              <Label htmlFor="en">{ua ? "Повне ім'я" : 'Full name'}</Label>
              <Input id="en" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" />{ua ? 'Скасувати' : 'Cancel'}</Button>
            <Button onClick={saveName} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-1" />{ua ? 'Зберегти' : 'Save'}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set PIN dialog */}
      <Dialog open={!!pinTarget} onOpenChange={(o) => !o && setPinTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ua ? 'Встановити PIN' : 'Set PIN'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">{pinTarget?.email}</div>
            <div className="space-y-2">
              <Label htmlFor="np2">{ua ? 'Новий PIN (4-8 цифр)' : 'New PIN (4-8 digits)'}</Label>
              <Input id="np2" type="password" inputMode="numeric" maxLength={8}
                value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp2">{ua ? 'Підтвердження' : 'Confirm'}</Label>
              <Input id="cp2" type="password" inputMode="numeric" maxLength={8}
                value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPinTarget(null)}><X className="h-4 w-4 mr-1" />{ua ? 'Скасувати' : 'Cancel'}</Button>
            <Button onClick={savePin} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><KeyRound className="h-4 w-4 mr-1" />{ua ? 'Зберегти PIN' : 'Save PIN'}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
