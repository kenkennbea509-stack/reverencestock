
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

DROP POLICY IF EXISTS inv_select_admin_or_en_cours ON public.inventories;
DROP POLICY IF EXISTS inv_insert_admin ON public.inventories;
DROP POLICY IF EXISTS inv_update_admin_or_operator_en_cours ON public.inventories;
DROP POLICY IF EXISTS inv_delete_admin ON public.inventories;

CREATE POLICY inv_select_auth ON public.inventories FOR SELECT TO authenticated USING (true);
CREATE POLICY inv_insert_auth ON public.inventories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY inv_update_auth ON public.inventories FOR UPDATE TO authenticated USING (true);
CREATE POLICY inv_delete_auth ON public.inventories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS items_select_admin_or_en_cours ON public.inventory_items;
DROP POLICY IF EXISTS items_insert_admin ON public.inventory_items;
DROP POLICY IF EXISTS items_update_admin_or_operator_en_cours ON public.inventory_items;
DROP POLICY IF EXISTS items_delete_admin ON public.inventory_items;

CREATE POLICY items_select_auth ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY items_insert_auth ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY items_update_auth ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY items_delete_auth ON public.inventory_items FOR DELETE TO authenticated USING (true);
