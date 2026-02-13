import { supabase } from "@/integrations/supabase/client";

const FB_GRAPH_URL = "https://graph.facebook.com/v18.0";

/**
 * Discovers the Instagram Business Account ID associated with the token.
 * This is the first step when a token is provided manually.
 */
export const discoverInstagramAccount = async (accountId: string) => {
    try {
        const { data: account, error: accountError } = await (supabase
            .from("social_accounts" as any)
            .select("access_token")
            .eq("id", accountId)
            .single() as any);

        if (accountError || !account?.access_token) throw new Error("Token not found");

        const token = account.access_token;

        // 1. Get the Facebook Pages managed by this token
        const pagesUrl = `${FB_GRAPH_URL}/me/accounts?access_token=${token}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        if (pagesData.error) throw new Error(`FB Pages Error: ${pagesData.error.message}`);
        if (!pagesData.data || pagesData.data.length === 0) throw new Error("No Facebook Pages found for this token.");

        // 2. For each page, look for a connected Instagram Business Account
        for (const page of pagesData.data) {
            const igUrl = `${FB_GRAPH_URL}/${page.id}?fields=instagram_business_account,name&access_token=${token}`;
            const igResponse = await fetch(igUrl);
            const igData = await igResponse.json();

            if (igData.instagram_business_account) {
                const igId = igData.instagram_business_account.id;

                // Fetch the IG profile details
                const profileUrl = `${FB_GRAPH_URL}/${igId}?fields=username,name,profile_picture_url,followers_count,media_count&access_token=${token}`;
                const profileResponse = await fetch(profileUrl);
                const profileData = await profileResponse.json();

                // 3. Update the social_account in DB with real IDs
                const { error: updateError } = await supabase
                    .from("social_accounts" as any)
                    .update({
                        platform_account_id: igId,
                        account_name: profileData.name || page.name,
                        username: profileData.username,
                        profile_image_url: profileData.profile_picture_url
                    })
                    .eq("id", accountId);

                if (updateError) throw updateError;

                return {
                    id: igId,
                    username: profileData.username,
                    name: profileData.name,
                    followers: profileData.followers_count
                };
            }
        }

        throw new Error("No Instagram Business Account connected to your Facebook Pages.");

    } catch (error) {
        console.error("discoverInstagramAccount error:", error);
        throw error;
    }
};

export const fetchInstagramMedia = async (accountId: string) => {
    try {
        const { data: account, error: accountError } = await supabase
            .from("social_accounts" as any)
            .select("access_token, platform_account_id")
            .eq("id", accountId)
            .single();

        const instagramAccount = account as any;
        const token = instagramAccount.access_token;
        const igUserId = instagramAccount.platform_account_id;

        if (!token || !igUserId || igUserId === 'initial_setup') {
            console.log("Missing token or IG User ID for sync (or initial setup). Checking for discovery...", { token: !!token, igUserId });
            // Try discovery if it's the first time or if igUserId is 'initial_setup'
            if (igUserId === 'initial_setup' && token) {
                await discoverInstagramAccount(accountId);
                return fetchInstagramMedia(accountId); // Retry after discovery
            }
            if (!token || !igUserId) throw new Error("Missing token or IG User ID");
            return [];
        }

        console.log("Fetching Instagram media for account:", igUserId);
        const fields = "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count";
        const url = `${FB_GRAPH_URL}/${igUserId}/media?fields=${fields}&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Instagram API Media Error:", data.error);
            throw new Error(data.error.message);
        }

        console.log(`Found ${data.data?.length || 0} media items. Syncing posts and comments...`);
        return data.data || [];

    } catch (error: any) {
        console.error("fetchInstagramMedia error:", error);
        throw error;
    }
};

export const fetchInstagramComments = async (mediaId: string, accessToken: string) => {
    try {
        const fields = "id,text,timestamp,from{id,username}";
        const url = `${FB_GRAPH_URL}/${mediaId}/comments?fields=${fields}&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error(`Instagram API Comments Error for media ${mediaId}:`, data.error);
            return [];
        }

        console.log(`Found ${data.data?.length || 0} comments for media ${mediaId}`);
        return data.data || [];
    } catch (error) {
        console.error("fetchInstagramComments error:", error);
        return [];
    }
};

/**
 * Fetches Instagram Direct Messages (Conversations)
 */
export const fetchInstagramConversations = async (accountId: string) => {
    try {
        const { data: account } = await supabase
            .from("social_accounts" as any)
            .select("access_token, platform_account_id")
            .eq("id", accountId)
            .single();

        const instagramAccount = account as any;
        const token = instagramAccount.access_token;
        const igUserId = instagramAccount.platform_account_id;

        if (!token || !igUserId || igUserId === 'initial_setup') return [];

        console.log("Fetching Instagram conversations for account:", igUserId);
        // platform=instagram is requested for IG DMs
        const fields = "id,participants,updated_time,messages.limit(1){id,text,created_time,from}";
        const url = `${FB_GRAPH_URL}/${igUserId}/conversations?platform=instagram&fields=${fields}&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Instagram API Conversations Error:", data.error);
            return [];
        }

        console.log(`Found ${data.data?.length || 0} conversations.`);
        return data.data || [];

    } catch (error) {
        console.error("fetchInstagramConversations error:", error);
        return [];
    }
};
