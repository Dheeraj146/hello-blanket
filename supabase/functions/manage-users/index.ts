import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await userClient.auth.getUser();
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = caller.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, display_name, role } = payload;
      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "email, password, and role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || email },
      });

      if (createError) throw createError;

      await adminClient.from("user_roles").upsert({ user_id: newUser.user.id, role }, { onConflict: "user_id,role" });

      return new Response(JSON.stringify({ message: "User created", userId: newUser.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_role") {
      const { user_id, role } = payload;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("user_roles").insert({ user_id, role });

      return new Response(JSON.stringify({ message: "Role updated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_user") {
      const { user_id, display_name, password } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const updateData: any = {};
      if (password) updateData.password = password;
      if (display_name !== undefined) updateData.user_metadata = { display_name };

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, updateData);
        if (updateError) throw updateError;
      }

      // Also update profile display_name
      if (display_name !== undefined) {
        await adminClient.from("profiles").update({ display_name }).eq("user_id", user_id);
      }

      return new Response(JSON.stringify({ message: "User updated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Protect main admin
      const { data: userData } = await adminClient.auth.admin.getUserById(user_id);
      if (userData?.user?.email === "admin@nazar.security") {
        return new Response(JSON.stringify({ error: "Cannot delete the primary admin account" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ message: "User deleted" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { data: users } = await adminClient.auth.admin.listUsers();
      return new Response(JSON.stringify({ users: users?.users || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
