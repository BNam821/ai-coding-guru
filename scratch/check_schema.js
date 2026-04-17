
import { supabaseAdmin } from "./src/lib/supabase-admin.js";

async function checkSchema() {
    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching user:", error);
    } else if (user) {
        console.log("User fields:", Object.keys(user));
    } else {
        console.log("No users found to check fields.");
    }
}

checkSchema();
