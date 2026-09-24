
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_cep text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins full access categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins full access products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.addons TO anon;
GRANT SELECT ON public.addons TO authenticated;
GRANT ALL ON public.addons TO service_role;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active addons" ON public.addons FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins full access addons" ON public.addons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric(10,2) NOT NULL,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins full access coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  order_type text NOT NULL DEFAULT 'delivery',
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_cep text,
  payment_method text NOT NULL,
  change_for numeric(10,2),
  notes text,
  status text NOT NULL DEFAULT 'recebido',
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text
);
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins read all order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Espetia',
  whatsapp text NOT NULL DEFAULT '5511999999999',
  phone_display text NOT NULL DEFAULT '(11) 99999-9999',
  address text NOT NULL DEFAULT 'Rua das Brasas, 123 - Centro, São Paulo/SP',
  opening_hours text NOT NULL DEFAULT 'Ter a Dom, 18h às 23h30',
  delivery_fee numeric(10,2) NOT NULL DEFAULT 5.00,
  min_order numeric(10,2) NOT NULL DEFAULT 20.00,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.store_settings (id) VALUES (1);

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Espetos', 'espetos', 1),
  ('Combos', 'combos', 2),
  ('Acompanhamentos', 'acompanhamentos', 3),
  ('Bebidas', 'bebidas', 4),
  ('Sobremesas', 'sobremesas', 5);

INSERT INTO public.products (category_id, name, description, price, image_url, featured, sort_order)
SELECT c.id, p.name, p.description, p.price, p.image_url, p.featured, p.sort_order
FROM (VALUES
  ('espetos','Espeto de Carne','Cubos de contrafilé suculentos grelhados na brasa com sal grosso.',14.90,'/images/espeto-carne.jpg',true,1),
  ('espetos','Espeto de Frango','Peito de frango marinado com ervas, pimentão e cebola.',11.90,'/images/espeto-frango.jpg',true,2),
  ('espetos','Espeto de Linguiça Toscana','Linguiça toscana artesanal grelhada lentamente na brasa.',12.90,'/images/espeto-linguica.jpg',true,3),
  ('espetos','Espeto de Queijo Coalho','Queijo coalho dourado com toque de melado ou orégano.',13.90,'/images/espeto-queijo.jpg',true,4),
  ('espetos','Espeto de Coração','Coração de frango temperado no alho e na brasa.',12.90,'/images/espeto-carne.jpg',false,5),
  ('espetos','Espeto Misto Carne e Queijo','Combinação de contrafilé com queijo coalho.',15.90,'/images/espeto-queijo.jpg',false,6),
  ('combos','Combo Família','6 espetos variados + farofa + vinagrete + pão de alho. Serve 3 a 4 pessoas.',89.90,'/images/combo-familia.jpg',true,1),
  ('combos','Combo Casal','3 espetos variados + pão de alho + refrigerante 350ml.',49.90,'/images/combo-familia.jpg',true,2),
  ('combos','Combo do Chef','4 espetos premium + queijo coalho + acompanhamentos da casa.',69.90,'/images/combo-familia.jpg',false,3),
  ('acompanhamentos','Pão de Alho','Pão francês na chapa com creme de alho e queijo.',8.90,'/images/pao-de-alho.jpg',false,1),
  ('acompanhamentos','Farofa da Casa','Farofa crocante com manteiga, bacon e cheiro-verde.',6.90,'/images/combo-familia.jpg',false,2),
  ('acompanhamentos','Vinagrete','Tomate, cebola e pimentão frescos no limão.',5.90,'/images/combo-familia.jpg',false,3),
  ('acompanhamentos','Arroz Carreteiro','Arroz com carne desfiada e temperos da casa.',16.90,'/images/combo-familia.jpg',false,4),
  ('bebidas','Guaraná Antarctica 350ml','Lata gelada.',5.90,'/images/bebida-guarana.jpg',false,1),
  ('bebidas','Coca-Cola 350ml','Lata gelada.',5.90,'/images/bebida-guarana.jpg',false,2),
  ('bebidas','Refrigerante 2L','Guaraná ou Coca-Cola.',12.90,'/images/bebida-guarana.jpg',false,3),
  ('bebidas','Suco Natural 500ml','Laranja, maracujá ou limão.',9.90,'/images/bebida-guarana.jpg',false,4),
  ('bebidas','Água Mineral 500ml','Com ou sem gás.',3.90,'/images/bebida-guarana.jpg',false,5),
  ('sobremesas','Pudim de Leite','Fatia generosa com calda de caramelo.',9.90,'/images/pudim.jpg',false,1),
  ('sobremesas','Queijo Coalho com Melado','Sobremesa quentinha na brasa.',14.90,'/images/espeto-queijo.jpg',false,2)
) AS p(cat_slug, name, description, price, image_url, featured, sort_order)
JOIN public.categories c ON c.slug = p.cat_slug;

INSERT INTO public.addons (product_id, name, price)
SELECT p.id, a.name, a.price
FROM public.products p
JOIN (VALUES
  ('Espeto de Carne','Ponto extra da carne',0.00),
  ('Espeto de Carne','Molho de alho',1.50),
  ('Espeto de Frango','Molho barbecue',1.50),
  ('Espeto de Linguiça Toscana','Molho de pimenta',1.00),
  ('Espeto de Queijo Coalho','Melado de cana',2.00),
  ('Combo Família','Espeto extra de carne',14.90),
  ('Combo Casal','Espeto extra de frango',11.90)
) AS a(product_name, name, price) ON p.name = a.product_name;

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order) VALUES
  ('BEMVINDO10', '10% de desconto no primeiro pedido', 'percent', 10, 30),
  ('BRASA5', 'R$ 5 de desconto acima de R$ 50', 'fixed', 5, 50);
