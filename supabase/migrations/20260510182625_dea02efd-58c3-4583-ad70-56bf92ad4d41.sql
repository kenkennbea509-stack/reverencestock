
-- 1. Clean existing inventory data (per user request)
DELETE FROM public.inventory_items;
DELETE FROM public.inventories;

-- 2. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operateur');

-- 3. profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Trigger: auto-create profile + default operateur role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _display TEXT;
BEGIN
  _username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  _display := COALESCE(NEW.raw_user_meta_data->>'display_name', _username);

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, _username, _display)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operateur')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add columns to inventories
ALTER TABLE public.inventories
  ADD COLUMN owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN counted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. RLS — profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. RLS — user_roles (admin only)
CREATE POLICY "roles_select_self_or_admin"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_insert_admin"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_update_admin"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "roles_delete_admin"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Replace inventories RLS
DROP POLICY IF EXISTS public_read_inventories ON public.inventories;
DROP POLICY IF EXISTS public_insert_inventories ON public.inventories;
DROP POLICY IF EXISTS public_update_inventories ON public.inventories;
DROP POLICY IF EXISTS public_delete_inventories ON public.inventories;

CREATE POLICY "inv_select_admin_or_en_cours"
  ON public.inventories FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR status = 'en_cours'
  );

CREATE POLICY "inv_insert_admin"
  ON public.inventories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "inv_update_admin_or_operator_en_cours"
  ON public.inventories FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'operateur') AND status = 'en_cours')
  );

CREATE POLICY "inv_delete_admin"
  ON public.inventories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. Replace inventory_items RLS
DROP POLICY IF EXISTS public_read_items ON public.inventory_items;
DROP POLICY IF EXISTS public_insert_items ON public.inventory_items;
DROP POLICY IF EXISTS public_update_items ON public.inventory_items;
DROP POLICY IF EXISTS public_delete_items ON public.inventory_items;

CREATE POLICY "items_select_admin_or_en_cours"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.inventories i
      WHERE i.id = inventory_items.inventory_id AND i.status = 'en_cours'
    )
  );

CREATE POLICY "items_insert_admin"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "items_update_admin_or_operator_en_cours"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.inventories i
      WHERE i.id = inventory_items.inventory_id AND i.status = 'en_cours'
    )
  );

CREATE POLICY "items_delete_admin"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
