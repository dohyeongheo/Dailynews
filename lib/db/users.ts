import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function createUser(email: string, password: string, name: string) {
  const supabase = createClient();
  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      name,
      role: "user",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = createClient();

  const { data } = await supabase.from("users").select("*").eq("email", email).single();

  return data;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getAllUsers(limit = 50, offset = 0) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, role: "user" | "admin") {
  const supabase = createClient();

  const { error } = await supabase.from("users").update({ role }).eq("id", userId);

  if (error) throw error;
}

export async function updateUserProfile(userId: string, data: { name?: string; password?: string }) {
  const supabase = createClient();

  const updateData: { name?: string; password_hash?: string; updated_at?: string } = {
    updated_at: new Date().toISOString(),
  };

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    updateData.password_hash = passwordHash;
  }

  const { error } = await supabase.from("users").update(updateData).eq("id", userId);

  if (error) throw error;
}
