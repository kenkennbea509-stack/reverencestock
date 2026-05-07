
CREATE TYPE public.inventory_status AS ENUM ('en_cours', 'complet');

CREATE TABLE public.inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by TEXT,
  counted_by TEXT,
  status public.inventory_status NOT NULL DEFAULT 'en_cours',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventories(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT,
  system_qty NUMERIC NOT NULL DEFAULT 0,
  counted_qty NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_items_inventory_id ON public.inventory_items(inventory_id);

ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_inventories" ON public.inventories FOR SELECT USING (true);
CREATE POLICY "public_insert_inventories" ON public.inventories FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_inventories" ON public.inventories FOR UPDATE USING (true);
CREATE POLICY "public_delete_inventories" ON public.inventories FOR DELETE USING (true);

CREATE POLICY "public_read_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "public_insert_items" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_items" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "public_delete_items" ON public.inventory_items FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventories_updated_at BEFORE UPDATE ON public.inventories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
