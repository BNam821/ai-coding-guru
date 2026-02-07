import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    const dataPath = path.join(process.cwd(), "src/data/wiki-posts.json");

    try {
        console.log("Reading data from original JSON...");
        const fileContent = await fs.readFile(dataPath, "utf-8");
        const posts = JSON.parse(fileContent);

        console.log(`Found ${posts.length} posts. Migrating...`);

        for (const post of posts) {
            const { error } = await supabase
                .from("wiki_posts")
                .upsert({
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    content: post.content || "",
                    author: post.author,
                    category: post.category,
                    date: post.date,
                    read_time: post.readTime,
                }, { onConflict: "slug" });

            if (error) {
                console.error(`Error migrating post "${post.title}":`, error.message);
            } else {
                console.log(`Successfully migrated: ${post.title}`);
            }
        }

        console.log("Migration completed!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
