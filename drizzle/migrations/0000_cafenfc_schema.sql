CREATE TYPE public.order_status AS ENUM ('pendiente','preparando','listo','entregado');

CREATE TABLE public.mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL UNIQUE,
  nfc_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mesas TO anon, authenticated;
GRANT ALL ON public.mesas TO service_role;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mesas publicas" ON public.mesas FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio INT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Cafés',
  imagen TEXT NOT NULL DEFAULT 'cappuccino',
  opciones TEXT[] NOT NULL DEFAULT '{}',
  disponible BOOLEAN NOT NULL DEFAULT true,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu lectura publica" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "menu gestion" ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  estado public.order_status NOT NULL DEFAULT 'pendiente',
  total INT NOT NULL DEFAULT 0,
  nota TEXT NOT NULL DEFAULT '',
  cuenta_solicitada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedidos publicos" ON public.pedidos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario INT NOT NULL,
  personalizacion TEXT NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_items TO anon, authenticated;
GRANT ALL ON public.pedido_items TO service_role;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedido items publicos" ON public.pedido_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX idx_pedido_items_pedido ON public.pedido_items(pedido_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_items;

INSERT INTO public.mesas (numero, nfc_code) VALUES
 (1,'NFC001'),(2,'NFC002'),(3,'NFC003'),(4,'NFC004'),(5,'NFC005'),(6,'NFC006');

INSERT INTO public.menu_items (nombre, descripcion, precio, categoria, imagen, opciones, orden) VALUES
 ('Cappuccino','Espresso, leche vaporizada',12000,'Cafés','cappuccino','{"Extra shot","Leve","Sin azúcar"}',1),
 ('Sándwich Veggie','Verduras frescas, pan artesanal',23000,'Bocados','sandwich','{"Sin tomate","Con queso"}',2),
 ('Cold Brew','Extracción en frío 18h',15000,'Cafés','coldbrew','{"Con hielo extra","Sin azúcar"}',3),
 ('Croissant Mantequilla','Horneado del día',8000,'Bocados','croissant','{"Tibio"}',4);
