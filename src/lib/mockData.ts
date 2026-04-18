export type Lang = 'ua' | 'en';

export interface Dish {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  price: number;
  category: string;
  emoji: string;
  popular?: boolean;
}

export const categories = [
  { id: 'starters', name: { ua: 'Закуски', en: 'Starters' } },
  { id: 'mains', name: { ua: 'Основні страви', en: 'Mains' } },
  { id: 'pizza', name: { ua: 'Піца', en: 'Pizza' } },
  { id: 'desserts', name: { ua: 'Десерти', en: 'Desserts' } },
  { id: 'drinks', name: { ua: 'Напої', en: 'Drinks' } },
];

export const dishes: Dish[] = [
  { id: 'd1', name: { ua: 'Борщ український', en: 'Ukrainian Borshch' }, description: { ua: 'З салом та пампушками', en: 'With lard and pampushky' }, price: 185, category: 'starters', emoji: '🍲', popular: true },
  { id: 'd2', name: { ua: 'Салат Цезар', en: 'Caesar Salad' }, description: { ua: 'З куркою та пармезаном', en: 'Chicken & parmesan' }, price: 240, category: 'starters', emoji: '🥗' },
  { id: 'd3', name: { ua: 'Вареники з вишнею', en: 'Cherry Varenyky' }, description: { ua: 'Зі сметаною', en: 'With sour cream' }, price: 165, category: 'starters', emoji: '🥟' },
  { id: 'd4', name: { ua: 'Стейк Рібай', en: 'Ribeye Steak' }, description: { ua: '300г, прожарка на вибір', en: '300g, your doneness' }, price: 720, category: 'mains', emoji: '🥩', popular: true },
  { id: 'd5', name: { ua: 'Качка з яблуками', en: 'Duck with Apples' }, description: { ua: 'Запечена з яблуками', en: 'Roasted with apples' }, price: 540, category: 'mains', emoji: '🦆' },
  { id: 'd6', name: { ua: 'Паста Карбонара', en: 'Pasta Carbonara' }, description: { ua: 'Класична італійська', en: 'Classic Italian' }, price: 290, category: 'mains', emoji: '🍝' },
  { id: 'd7', name: { ua: 'Маргарита', en: 'Margherita' }, description: { ua: 'Томати, моцарела, базилік', en: 'Tomato, mozzarella, basil' }, price: 245, category: 'pizza', emoji: '🍕', popular: true },
  { id: 'd8', name: { ua: 'Пепероні', en: 'Pepperoni' }, description: { ua: 'Гостра пепероні', en: 'Spicy pepperoni' }, price: 285, category: 'pizza', emoji: '🍕' },
  { id: 'd9', name: { ua: 'Тірамісу', en: 'Tiramisu' }, description: { ua: 'Класичний десерт', en: 'Classic dessert' }, price: 145, category: 'desserts', emoji: '🍰' },
  { id: 'd10', name: { ua: 'Чізкейк', en: 'Cheesecake' }, description: { ua: 'Нью-Йорк', en: 'New York style' }, price: 155, category: 'desserts', emoji: '🍰' },
  { id: 'd11', name: { ua: 'Кава Лате', en: 'Latte' }, description: { ua: '300мл', en: '300ml' }, price: 75, category: 'drinks', emoji: '☕', popular: true },
  { id: 'd12', name: { ua: 'Свіжий сік', en: 'Fresh Juice' }, description: { ua: 'Апельсин/яблуко', en: 'Orange/apple' }, price: 95, category: 'drinks', emoji: '🧃' },
  { id: 'd13', name: { ua: 'Крафтове пиво', en: 'Craft Beer' }, description: { ua: '0.5л', en: '0.5L' }, price: 110, category: 'drinks', emoji: '🍺' },
];

export interface Table {
  id: number;
  seats: number;
  status: 'free' | 'occupied' | 'reserved';
  x: number;
  y: number;
  shape: 'round' | 'square';
  guests?: number;
  total?: number;
}

export const initialTables: Table[] = [
  { id: 1, seats: 2, status: 'free', x: 8, y: 10, shape: 'round' },
  { id: 2, seats: 4, status: 'occupied', x: 28, y: 10, shape: 'square', guests: 3, total: 1240 },
  { id: 3, seats: 2, status: 'reserved', x: 50, y: 10, shape: 'round' },
  { id: 4, seats: 6, status: 'free', x: 70, y: 12, shape: 'square' },
  { id: 5, seats: 4, status: 'occupied', x: 8, y: 40, shape: 'square', guests: 4, total: 2150 },
  { id: 6, seats: 2, status: 'free', x: 32, y: 42, shape: 'round' },
  { id: 7, seats: 8, status: 'occupied', x: 55, y: 42, shape: 'square', guests: 6, total: 3890 },
  { id: 8, seats: 2, status: 'reserved', x: 80, y: 42, shape: 'round' },
  { id: 9, seats: 4, status: 'free', x: 10, y: 72, shape: 'square' },
  { id: 10, seats: 4, status: 'free', x: 35, y: 72, shape: 'square' },
  { id: 11, seats: 2, status: 'occupied', x: 60, y: 75, shape: 'round', guests: 2, total: 480 },
  { id: 12, seats: 6, status: 'free', x: 78, y: 72, shape: 'square' },
];

export interface KitchenOrder {
  id: string;
  table: number;
  items: { name: string; qty: number }[];
  status: 'new' | 'progress' | 'ready';
  createdAt: number;
  priority?: boolean;
}

export const initialKitchenOrders: KitchenOrder[] = [
  { id: 'ORD-1042', table: 2, items: [{ name: 'Борщ український', qty: 2 }, { name: 'Вареники з вишнею', qty: 1 }], status: 'new', createdAt: Date.now() - 2 * 60_000, priority: true },
  { id: 'ORD-1043', table: 5, items: [{ name: 'Стейк Рібай', qty: 2 }, { name: 'Салат Цезар', qty: 2 }], status: 'new', createdAt: Date.now() - 5 * 60_000 },
  { id: 'ORD-1041', table: 7, items: [{ name: 'Маргарита', qty: 2 }, { name: 'Пепероні', qty: 1 }, { name: 'Крафтове пиво', qty: 4 }], status: 'progress', createdAt: Date.now() - 12 * 60_000 },
  { id: 'ORD-1040', table: 11, items: [{ name: 'Паста Карбонара', qty: 1 }, { name: 'Кава Лате', qty: 2 }], status: 'progress', createdAt: Date.now() - 8 * 60_000 },
  { id: 'ORD-1039', table: 2, items: [{ name: 'Тірамісу', qty: 2 }], status: 'ready', createdAt: Date.now() - 18 * 60_000 },
];

export const staff = [
  { id: 1, name: 'Олена Коваль', role: 'Manager', email: 'olena@horeca.ua', shift: 'Day' },
  { id: 2, name: 'Андрій Мельник', role: 'Waiter', email: 'andriy@horeca.ua', shift: 'Day' },
  { id: 3, name: 'Марія Шевченко', role: 'Waiter', email: 'maria@horeca.ua', shift: 'Evening' },
  { id: 4, name: 'Ігор Бондар', role: 'Kitchen Staff', email: 'igor@horeca.ua', shift: 'Day' },
  { id: 5, name: 'Софія Ткач', role: 'Cashier', email: 'sofia@horeca.ua', shift: 'Evening' },
  { id: 6, name: 'Володимир Кравець', role: 'Owner', email: 'vk@horeca.ua', shift: '—' },
];

export const t = {
  ua: {
    appName: 'HoReCa OS',
    tagline: 'Операційна система для ресторанів, кафе та барів',
    customer: 'Клієнт', waiter: 'Офіціант', kitchen: 'Кухня', admin: 'Адмін',
    customerDesc: 'QR-меню, замовлення, бронювання',
    waiterDesc: 'План залу, столи, замовлення',
    kitchenDesc: 'KDS — дошка замовлень',
    adminDesc: 'Аналітика, меню, персонал',
    enter: 'Увійти', back: 'Назад',
    menu: 'Меню', cart: 'Кошик', order: 'Замовити', total: 'Разом',
    addToCart: 'Додати', empty: 'Кошик порожній', checkout: 'Оплатити',
    table: 'Стіл', tables: 'Столи', free: 'Вільний', occupied: 'Зайнятий', reserved: 'Заброньовано',
    floorPlan: 'План залу', orders: 'Замовлення', newOrder: 'Нове замовлення',
    splitBill: 'Розділити', closeBill: 'Закрити рахунок', guests: 'Гостей',
    new: 'Нові', inProgress: 'Готується', ready: 'Готово',
    dashboard: 'Дашборд', menuBuilder: 'Меню', staff: 'Персонал', settings: 'Налаштування',
    revenue: 'Виручка', ordersCount: 'Замовлень', avgCheck: 'Середній чек', popular: 'Популярні страви',
    role: 'Роль', name: 'Ім\'я', email: 'Email', shift: 'Зміна', actions: 'Дії',
    reservation: 'Бронювання', date: 'Дата', time: 'Час', book: 'Забронювати',
    yourTable: 'Ваш стіл', orderPlaced: 'Замовлення прийнято!', payNow: 'Сплатити',
    minAgo: 'хв тому', priority: 'Пріоритет',
    addCategory: 'Додати категорію', addDish: 'Додати страву', price: 'Ціна',
    save: 'Зберегти', cancel: 'Скасувати', edit: 'Редагувати', delete: 'Видалити',
  },
  en: {
    appName: 'HoReCa OS',
    tagline: 'Operating system for restaurants, cafés & bars',
    customer: 'Customer', waiter: 'Waiter', kitchen: 'Kitchen', admin: 'Admin',
    customerDesc: 'QR menu, orders, reservations',
    waiterDesc: 'Floor plan, tables, orders',
    kitchenDesc: 'KDS — orders board',
    adminDesc: 'Analytics, menu, staff',
    enter: 'Enter', back: 'Back',
    menu: 'Menu', cart: 'Cart', order: 'Order', total: 'Total',
    addToCart: 'Add', empty: 'Cart is empty', checkout: 'Checkout',
    table: 'Table', tables: 'Tables', free: 'Free', occupied: 'Occupied', reserved: 'Reserved',
    floorPlan: 'Floor plan', orders: 'Orders', newOrder: 'New order',
    splitBill: 'Split bill', closeBill: 'Close bill', guests: 'Guests',
    new: 'New', inProgress: 'In progress', ready: 'Ready',
    dashboard: 'Dashboard', menuBuilder: 'Menu', staff: 'Staff', settings: 'Settings',
    revenue: 'Revenue', ordersCount: 'Orders', avgCheck: 'Avg. check', popular: 'Popular dishes',
    role: 'Role', name: 'Name', email: 'Email', shift: 'Shift', actions: 'Actions',
    reservation: 'Reservation', date: 'Date', time: 'Time', book: 'Book',
    yourTable: 'Your table', orderPlaced: 'Order placed!', payNow: 'Pay now',
    minAgo: 'min ago', priority: 'Priority',
    addCategory: 'Add category', addDish: 'Add dish', price: 'Price',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
  },
};

export const fmtUAH = (n: number) => `${n.toLocaleString('uk-UA')} ₴`;
