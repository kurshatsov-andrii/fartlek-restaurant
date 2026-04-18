import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';

export const PinSetup = () => {
  const { lang } = useI18n();
  const ua = lang === 'ua';
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{4,8}$/.test(pin)) return toast.error(ua ? 'PIN має бути 4-8 цифр' : 'PIN must be 4-8 digits');
    if (pin !== confirm) return toast.error(ua ? 'PIN не співпадає' : 'PIN mismatch');
    setBusy(true);
    const { error } = await supabase.rpc('set_my_pin', { _pin: pin });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ua ? 'PIN збережено' : 'PIN saved');
    setPin(''); setConfirm('');
  };

  return (
    <form onSubmit={submit} className="space-y-3 max-w-sm">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound className="h-4 w-4 text-accent" />
        {ua ? 'Швидкий PIN-вхід' : 'Quick PIN sign in'}
      </div>
      <p className="text-xs text-muted-foreground">{ua ? 'Встановіть PIN, щоб швидко входити на спільному планшеті.' : 'Set a PIN to sign in quickly on a shared tablet.'}</p>
      <div className="space-y-2">
        <Label htmlFor="np">{ua ? 'Новий PIN' : 'New PIN'}</Label>
        <Input id="np" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cp">{ua ? 'Підтвердження' : 'Confirm'}</Label>
        <Input id="cp" type="password" inputMode="numeric" maxLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} />
      </div>
      <Button type="submit" disabled={busy} size="sm">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (ua ? 'Зберегти PIN' : 'Save PIN')}
      </Button>
    </form>
  );
};
