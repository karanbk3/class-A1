
/* =================================
   READ-X SUPABASE CONNECTION
================================= */

// Your Supabase project details
const SUPABASE_URL = "https://bkdnzdkdqymexkbivsax.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_I9GCDi47gNvirm6eh0wFKg_Ff1G7omu";

// Create the Supabase connection
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Make the connection available to other READ-X files
window.readxSupabase = supabaseClient;


/* =================================
   GET PUBLISHED PUBLICATIONS
================================= */

async function getPublishedPublications() {

    const { data, error } = await window.readxSupabase
        .from("publications")
        .select(`
            id,
            title,
            author_name,
            topic,
            description,
            content,
            created_at
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load publications:", error);
        return {
            data: [],
            error: error
        };
    }

    return {
        data: data,
        error: null
    };
}


/* =================================
   CHECK CONNECTION
================================= */

async function checkSupabaseConnection() {

    const { error } = await window.readxSupabase
        .from("publications")
        .select("id")
        .limit(1);

    if (error) {
        console.error("READ-X Supabase connection failed:", error.message);
        return false;
    }

    console.log("READ-X Supabase connected successfully!");
    return true;
}
