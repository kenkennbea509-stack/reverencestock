
-- Allow public (anon + authenticated) access to inventories and items.
-- Application-level access control is handled via the 2016 code.

DROP POLICY IF EXISTS inv_select_auth ON public.inventories;
DROP POLICY IF EXISTS inv_insert_auth ON public.inventories;
DROP POLICY IF EXISTS inv_update_auth ON public.inventories;
DROP POLICY IF EXISTS inv_delete_auth ON public.inventories;

CREATE POLICY inv_select_public ON public.inventories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY inv_insert_public ON public.inventories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY inv_update_public ON public.inventories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY inv_delete_public ON public.inventories FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS items_select_auth ON public.inventory_items;
DROP POLICY IF EXISTS items_insert_auth ON public.inventory_items;
DROP POLICY IF EXISTS items_update_auth ON public.inventory_items;
DROP POLICY IF EXISTS items_delete_auth ON public.inventory_items;

CREATE POLICY items_select_public ON public.inventory_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY items_insert_public ON public.inventory_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY items_update_public ON public.inventory_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY items_delete_public ON public.inventory_items FOR DELETE TO anon, authenticated USING (true);
