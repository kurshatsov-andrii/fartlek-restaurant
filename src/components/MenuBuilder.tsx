import { useState } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';
import {
  dishes as initialDishes,
  categories as initialCategories,
  fmtUAH,
  Dish,
} from '@/lib/mockData';
import { toast } from 'sonner';

type Category = { id: string; name: { ua: string; en: string } };

const dishSchema = z.object({
  nameUa: z.string().trim().min(1, 'Назва UA обов\'язкова').max(80),
  nameEn: z.string().trim().min(1, 'Name EN required').max(80),
  descUa: z.string().trim().max(200).optional().default(''),
  descEn: z.string().trim().max(200).optional().default(''),
  price: z.coerce.number().min(0, '≥ 0').max(100000),
  category: z.string().min(1),
  emoji: z.string().trim().min(1).max(4),
});

const catSchema = z.object({
  nameUa: z.string().trim().min(1).max(40),
  nameEn: z.string().trim().min(1).max(40),
});

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
  `c-${Date.now().toString(36)}`;

export const MenuBuilder = () => {
  const { tr, lang } = useI18n();
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [filter, setFilter] = useState<string>('all');

  const [dishOpen, setDishOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState({
    nameUa: '', nameEn: '', descUa: '', descEn: '',
    price: '0', category: categories[0]?.id ?? '', emoji: '🍽️',
  });

  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ nameUa: '', nameEn: '' });

  const openNewDish = () => {
    setEditing(null);
    setForm({
      nameUa: '', nameEn: '', descUa: '', descEn: '',
      price: '0', category: categories[0]?.id ?? '', emoji: '🍽️',
    });
    setDishOpen(true);
  };

  const openEditDish = (d: Dish) => {
    setEditing(d);
    setForm({
      nameUa: d.name.ua, nameEn: d.name.en,
      descUa: d.description.ua, descEn: d.description.en,
      price: String(d.price), category: d.category, emoji: d.emoji,
    });
    setDishOpen(true);
  };

  const saveDish = () => {
    const parsed = dishSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const v = parsed.data;
    if (editing) {
      setDishes(ds => ds.map(d => d.id === editing.id ? {
        ...d,
        name: { ua: v.nameUa, en: v.nameEn },
        description: { ua: v.descUa, en: v.descEn },
        price: v.price, category: v.category, emoji: v.emoji,
      } : d));
      toast.success(lang === 'ua' ? 'Страву оновлено' : 'Dish updated');
    } else {
      const id = `d-${Date.now().toString(36)}`;
      setDishes(ds => [...ds, {
        id,
        name: { ua: v.nameUa, en: v.nameEn },
        description: { ua: v.descUa, en: v.descEn },
        price: v.price, category: v.category, emoji: v.emoji,
      }]);
      toast.success(lang === 'ua' ? 'Страву додано' : 'Dish added');
    }
    setDishOpen(false);
  };

  const removeDish = (id: string) => {
    setDishes(ds => ds.filter(d => d.id !== id));
    toast.success(lang === 'ua' ? 'Видалено' : 'Removed');
  };

  const saveCategory = () => {
    const parsed = catSchema.safeParse(catForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const v = parsed.data;
    let id = slug(v.nameEn);
    if (categories.some(c => c.id === id)) id = `${id}-${Date.now().toString(36)}`;
    setCategories(cs => [...cs, { id, name: { ua: v.nameUa, en: v.nameEn } }]);
    setCatForm({ nameUa: '', nameEn: '' });
    setCatOpen(false);
    toast.success(lang === 'ua' ? 'Категорію додано' : 'Category added');
  };

  const removeCategory = (id: string) => {
    if (dishes.some(d => d.category === id)) {
      toast.error(lang === 'ua' ? 'Категорія використовується' : 'Category in use');
      return;
    }
    setCategories(cs => cs.filter(c => c.id !== id));
    if (filter === id) setFilter('all');
  };

  const visible = filter === 'all' ? dishes : dishes.filter(d => d.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary hover:bg-accent/20'
            }`}
          >
            {lang === 'ua' ? 'Усі' : 'All'} · {dishes.length}
          </button>
          {categories.map(c => (
            <span key={c.id} className="group inline-flex items-center">
              <button
                onClick={() => setFilter(c.id)}
                className={`pl-3 pr-1.5 py-1.5 rounded-l-full text-sm font-semibold transition-colors ${
                  filter === c.id ? 'bg-accent text-accent-foreground' : 'bg-secondary hover:bg-accent/20'
                }`}
              >
                {c.name[lang]}
              </button>
              <button
                onClick={() => removeCategory(c.id)}
                title={tr.delete}
                className={`px-1.5 py-1.5 rounded-r-full transition-colors ${
                  filter === c.id ? 'bg-accent text-accent-foreground hover:bg-destructive/80' : 'bg-secondary hover:bg-destructive hover:text-destructive-foreground'
                }`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCatOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />{tr.addCategory}
          </Button>
        </div>
        <Button onClick={openNewDish}>
          <Plus className="h-4 w-4 mr-1" />{tr.addDish}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>{tr.name}</TableHead>
              <TableHead>{lang === 'ua' ? 'Категорія' : 'Category'}</TableHead>
              <TableHead className="text-right">{tr.price}</TableHead>
              <TableHead className="text-right">{tr.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(d => (
              <TableRow key={d.id}>
                <TableCell className="text-2xl">{d.emoji}</TableCell>
                <TableCell>
                  <div className="font-semibold">{d.name[lang]}</div>
                  <div className="text-xs text-muted-foreground">{d.description[lang]}</div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {categories.find(c => c.id === d.category)?.name[lang] ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">{fmtUAH(d.price)}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDish(d)}>
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeDish(d.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                  {lang === 'ua' ? 'Немає страв' : 'No dishes'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dish dialog */}
      <Dialog open={dishOpen} onOpenChange={setDishOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? tr.edit : tr.addDish} {editing && `· ${editing.name[lang]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div>
                <Label>Emoji</Label>
                <Input maxLength={4} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="text-center text-xl" />
              </div>
              <div>
                <Label>{lang === 'ua' ? 'Категорія' : 'Category'}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name[lang]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Назва (UA)</Label>
                <Input maxLength={80} value={form.nameUa} onChange={e => setForm({ ...form, nameUa: e.target.value })} />
              </div>
              <div>
                <Label>Name (EN)</Label>
                <Input maxLength={80} value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Опис (UA)</Label>
                <Textarea maxLength={200} rows={2} value={form.descUa} onChange={e => setForm({ ...form, descUa: e.target.value })} />
              </div>
              <div>
                <Label>Description (EN)</Label>
                <Textarea maxLength={200} rows={2} value={form.descEn} onChange={e => setForm({ ...form, descEn: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{tr.price} (₴)</Label>
              <Input type="number" min={0} step="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDishOpen(false)}>{tr.cancel}</Button>
            <Button onClick={saveDish}>{tr.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{tr.addCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Назва (UA)</Label>
              <Input maxLength={40} value={catForm.nameUa} onChange={e => setCatForm({ ...catForm, nameUa: e.target.value })} />
            </div>
            <div>
              <Label>Name (EN)</Label>
              <Input maxLength={40} value={catForm.nameEn} onChange={e => setCatForm({ ...catForm, nameEn: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>{tr.cancel}</Button>
            <Button onClick={saveCategory}>{tr.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
