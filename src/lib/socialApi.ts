import { supabase } from "@/integrations/supabase/client";

export const fetchInstagramMedia = async (accountId: string) => {
    try {
        // 1. Get the token from social_accounts
        const { data: account, error: accountError } = await supabase
            .from("social_accounts" as any)
            .select("access_token, platform_account_id")
            .eq("id", accountId)
            .single();

        if (accountError || !account?.access_token) {
            throw new Error("Instagram access token not found.");
        }

        const token = account.access_token;
        const igUserId = account.platform_account_id;

        // 2. Fetch media from Instagram Graph API
        // https://developers.facebook.com/docs/instagram-basic-display-api/reference/user/media
        const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
        const url = `https://graph.instagram.com/${igUserId}/media?fields=${fields}&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Failed to fetch Instagram media.");
        }

        return data.data || [];

    } catch (error: any) {
        console.error("fetchInstagramMedia error:", error);
        throw error;
    }
};

export const fetchInstagramProfile = async (accountId: string) => {
    try {
        const { data: account, error: accountError } = await supabase
            .from("social_accounts" as any)
            .select("access_token, platform_account_id")
            .eq("id", accountId)
            .single();

        if (accountError || !account?.access_token) {
            throw new Error("Instagram access token not found.");
        }

        const fields = "id,username,account_type,media_count";
        const url = `https://graph.instagram.com/me?fields=${fields}&access_token=${account.access_token}`;

        const response = await fetch(url);
        const data = await response.json();

        return data;
    } catch (error) {
        console.error("fetchInstagramProfile error:", error);
        throw error;
    }
};
