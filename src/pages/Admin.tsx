import { useState } from 'react';
import { LayoutDashboard, UtensilsCrossed, Users, Settings, TrendingUp, ShoppingBag, Wallet, Star, Plus, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { dishes as initialDishes, categories as initialCategories, fmtUAH } from '@/lib/mockData';
import { ZoneHeader } from '@/components/ZoneHeader';
import { PinSetup } from '@/components/PinSetup';
import { StaffManager } from '@/components/StaffManager';
import { toast } from 'sonner';

const Admin = () => {
  const { tr, lang } = useI18n();
  const [dishes, setDishes] = useState(initialDishes);

  return (
    <div className="min-h-screen bg-background">
      <ZoneHeader zone="ADMIN" title={tr.dashboard} subtitle="HoReCa OS · Control Center" />

      <div className="p-4 md:p-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />{tr.dashboard}</TabsTrigger>
            <TabsTrigger value="menu"><UtensilsCrossed className="h-4 w-4 mr-2" />{tr.menuBuilder}</TabsTrigger>
            <TabsTrigger value="staff"><Users className="h-4 w-4 mr-2" />{tr.staff}</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />{tr.settings}</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Wallet} label={tr.revenue} value={fmtUAH(48720)} delta="+12.4%" />
              <StatCard icon={ShoppingBag} label={tr.ordersCount} value="142" delta="+8 today" />
              <StatCard icon={TrendingUp} label={tr.avgCheck} value={fmtUAH(343)} delta="+3.1%" />
              <StatCard icon={Star} label={lang === 'ua' ? 'Рейтинг' : 'Rating'} value="4.8" delta="★★★★★" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg mb-4">{tr.revenue} · {lang === 'ua' ? '7 днів' : '7 days'}</h3>
                <RevenueChart />
              </div>

              {/* Popular dishes */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg mb-4">{tr.popular}</h3>
                <div className="space-y-3">
                  {dishes.filter(d => d.popular).concat(dishes.slice(0, 2)).slice(0, 5).map((d, i) => (
                    <div key={d.id + i} className="flex items-center gap-3">
                      <span className="font-display font-bold text-2xl text-muted-foreground w-6">{i + 1}</span>
                      <span className="text-2xl">{d.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{d.name[lang]}</div>
                        <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-gradient-warm" style={{ width: `${100 - i * 15}%` }} />
                        </div>
                      </div>
                      <span className="font-bold text-sm">{42 - i * 6}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MENU BUILDER */}
          <TabsContent value="menu" className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {initialCategories.map(c => (
                  <span key={c.id} className="px-3 py-1.5 rounded-full bg-secondary text-sm font-semibold">{c.name[lang]}</span>
                ))}
                <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />{tr.addCategory}</Button>
              </div>
              <Button onClick={() => toast.info(tr.addDish)}><Plus className="h-4 w-4 mr-1" />{tr.addDish}</Button>
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
                  {dishes.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="text-2xl">{d.emoji}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{d.name[lang]}</div>
                        <div className="text-xs text-muted-foreground">{d.description[lang]}</div>
                      </TableCell>
                      <TableCell><span className="text-xs px-2 py-1 rounded-full bg-secondary">{initialCategories.find(c => c.id === d.category)?.name[lang]}</span></TableCell>
                      <TableCell className="text-right font-bold">{fmtUAH(d.price)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Edit3 className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDishes(ds => ds.filter(x => x.id !== d.id))}><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* STAFF */}
          <TabsContent value="staff" className="space-y-4 animate-fade-in">
            <StaffManager />
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="animate-fade-in">
            <div className="max-w-xl space-y-4 bg-card border border-border rounded-2xl p-6">
              <div>
                <Label>{lang === 'ua' ? 'Назва закладу' : 'Venue name'}</Label>
                <Input defaultValue="Restoran Smachno" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{lang === 'ua' ? 'Валюта' : 'Currency'}</Label>
                  <Input defaultValue="UAH (₴)" disabled />
                </div>
                <div>
                  <Label>{lang === 'ua' ? 'Тип' : 'Type'}</Label>
                  <Input defaultValue={lang === 'ua' ? 'Ресторан' : 'Restaurant'} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Label>{lang === 'ua' ? 'Темна тема (placeholder)' : 'Dark mode (placeholder)'}</Label>
                <Switch onCheckedChange={() => toast.info('Dark mode toggle (placeholder)')} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{lang === 'ua' ? 'Мульти-локація' : 'Multi-location'}</Label>
                <Switch />
              </div>
              <Button className="w-full">{tr.save}</Button>
            </div>
            <div className="max-w-xl mt-6 bg-card border border-border rounded-2xl p-6">
              <PinSetup />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, delta }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-elegant transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <span className="text-xs font-semibold text-success">{delta}</span>
    </div>
    <div className="font-display font-bold text-2xl">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
  </div>
);

const RevenueChart = () => {
  const data = [4200, 5100, 3800, 6200, 7400, 8900, 8120];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full bg-secondary rounded-t-lg relative overflow-hidden flex items-end" style={{ height: '100%' }}>
            <div
              className="w-full bg-gradient-warm rounded-t-lg transition-all hover:opacity-80"
              style={{ height: `${(v / max) * 100}%` }}
              title={fmtUAH(v)}
            />
          </div>
          <span className="text-xs text-muted-foreground">{days[i]}</span>
        </div>
      ))}
    </div>
  );
};

export default Admin;
