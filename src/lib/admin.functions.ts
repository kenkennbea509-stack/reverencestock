import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const SYNTHETIC_DOMAIN = "reverence.local";
const usernameToEmail = (u: string) =>
  `${u.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@${SYNTHETIC_DOMAIN}`;

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(supabase: ReturnType<typeof getAdminClient>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès refusé : administrateur requis.");
}

function validateUsername(u: string) {
  const clean = u.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(clean)) {
    throw new Error("Nom d'utilisateur invalide (3-32 caractères, lettres/chiffres/._-).");
  }
  return clean;
}

function validatePin(p: string) {
  if (!/^\d{6}$/.test(p)) throw new Error("Le PIN doit contenir exactement 6 chiffres.");
  return p;
}

// --- Bootstrap : crée le premier admin si aucun n'existe encore ---
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; displayName: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const { count, error: countErr } = await admin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) throw new Error("Un administrateur existe déjà.");

    const username = validateUsername(data.username);
    const pin = validatePin(data.pin);
    const email = usernameToEmail(username);

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { username, display_name: data.displayName || username },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Création échouée.");

    // promote to admin
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);
    // remove default operateur role if any
    await admin.from("user_roles").delete().eq("user_id", created.user.id).eq("role", "operateur");

    return { ok: true };
  });

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getAdminClient();
  const { count } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

// --- Liste des opérateurs (admin only) ---
export const listOperators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = getAdminClient();
    await assertAdmin(admin, context.userId);
    const { data: roles } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "operateur");
    const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    if (ids.length === 0) return { operators: [] };
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,username,display_name,created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    return { operators: profiles ?? [] };
  });

// --- Création d'un opérateur ---
export const createOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; displayName: string; pin: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = getAdminClient();
    await assertAdmin(admin, context.userId);

    const username = validateUsername(data.username);
    const pin = validatePin(data.pin);
    const email = usernameToEmail(username);

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { username, display_name: data.displayName || username },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Création échouée.");
    return { ok: true, id: created.user.id };
  });

// --- Réinitialiser le PIN d'un opérateur ---
export const resetOperatorPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; pin: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = getAdminClient();
    await assertAdmin(admin, context.userId);
    const pin = validatePin(data.pin);
    const { error } = await admin.auth.admin.updateUserById(data.userId, { password: pin });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Supprimer un opérateur ---
export const deleteOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    const admin = getAdminClient();
    await assertAdmin(admin, context.userId);
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
