
-- ===== MENU CATEGORIES =====
CREATE TABLE public.menu_categories (
  id TEXT PRIMARY KEY,
  name_ua TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view categories"
  ON public.menu_categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Public can view categories"
  ON public.menu_categories FOR SELECT
  TO anon USING (true);

CREATE POLICY "Managers manage categories"
  ON public.menu_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER tg_menu_categories_updated
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== MENU DISHES =====
CREATE TABLE public.menu_dishes (
  id TEXT PRIMARY KEY,
  name_ua TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ua TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category_id TEXT NOT NULL REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_dishes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_menu_dishes_category ON public.menu_dishes(category_id);

CREATE POLICY "Anyone authenticated can view dishes"
  ON public.menu_dishes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Public can view dishes"
  ON public.menu_dishes FOR SELECT
  TO anon USING (true);

CREATE POLICY "Managers manage dishes"
  ON public.menu_dishes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER tg_menu_dishes_updated
  BEFORE UPDATE ON public.menu_dishes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== KITCHEN ORDERS =====
CREATE TYPE public.kitchen_status AS ENUM ('new', 'progress', 'ready');

CREATE TABLE public.kitchen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  table_number INTEGER NOT NULL,
  status public.kitchen_status NOT NULL DEFAULT 'new',
  priority BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_kitchen_orders_status ON public.kitchen_orders(status);

CREATE POLICY "Staff view kitchen orders"
  ON public.kitchen_orders FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'cashier'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Staff manage kitchen orders"
  ON public.kitchen_orders FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER tg_kitchen_orders_updated
  BEFORE UPDATE ON public.kitchen_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== KITCHEN ORDER ITEMS =====
CREATE TABLE public.kitchen_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kitchen_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_kitchen_order_items_order ON public.kitchen_order_items(order_id);

CREATE POLICY "Staff view order items"
  ON public.kitchen_order_items FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'cashier'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Staff manage order items"
  ON public.kitchen_order_items FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'waiter'::app_role) OR has_role(auth.uid(), 'kitchen'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- ===== SEED initial categories =====
INSERT INTO public.menu_categories (id, name_ua, name_en, sort_order) VALUES
  ('starters', 'Закуски', 'Starters', 1),
  ('mains', 'Основні страви', 'Mains', 2),
  ('pizza', 'Піца', 'Pizza', 3),
  ('desserts', 'Десерти', 'Desserts', 4),
  ('drinks', 'Напої', 'Drinks', 5)
ON CONFLICT (id) DO NOTHING;

-- ===== SEED initial dishes =====
INSERT INTO public.menu_dishes (id, name_ua, name_en, description_ua, description_en, price, category_id, emoji, popular) VALUES
  ('d1', 'Борщ український', 'Ukrainian Borshch', 'З салом та пампушками', 'With lard and pampushky', 185, 'starters', '🍲', true),
  ('d2', 'Салат Цезар', 'Caesar Salad', 'З куркою та пармезаном', 'Chicken & parmesan', 240, 'starters', '🥗', false),
  ('d3', 'Вареники з вишнею', 'Cherry Varenyky', 'Зі сметаною', 'With sour cream', 165, 'starters', '🥟', false),
  ('d4', 'Стейк Рібай', 'Ribeye Steak', '300г, прожарка на вибір', '300g, your doneness', 720, 'mains', '🥩', true),
  ('d5', 'Качка з яблуками', 'Duck with Apples', 'Запечена з яблуками', 'Roasted with apples', 540, 'mains', '🦆', false),
  ('d6', 'Паста Карбонара', 'Pasta Carbonara', 'Класична італійська', 'Classic Italian', 290, 'mains', '🍝', false),
  ('d7', 'Маргарита', 'Margherita', 'Томати, моцарела, базилік', 'Tomato, mozzarella, basil', 245, 'pizza', '🍕', true),
  ('d8', 'Пепероні', 'Pepperoni', 'Гостра пепероні', 'Spicy pepperoni', 285, 'pizza', '🍕', false),
  ('d9', 'Тірамісу', 'Tiramisu', 'Класичний десерт', 'Classic dessert', 145, 'desserts', '🍰', false),
  ('d10', 'Чізкейк', 'Cheesecake', 'Нью-Йорк', 'New York style', 155, 'desserts', '🍰', false),
  ('d11', 'Кава Лате', 'Latte', '300мл', '300ml', 75, 'drinks', '☕', true),
  ('d12', 'Свіжий сік', 'Fresh Juice', 'Апельсин/яблуко', 'Orange/apple', 95, 'drinks', '🧃', false),
  ('d13', 'Крафтове пиво', 'Craft Beer', '0.5л', '0.5L', 110, 'drinks', '🍺', false)
ON CONFLICT (id) DO NOTHING;
