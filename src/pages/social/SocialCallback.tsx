import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SocialCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Processing authorization...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            if (!code) {
                toast.error("No authorization code received.");
                navigate("/social/accounts");
                return;
            }

            try {
                // 1. Get app credentials from DB
                const { data: settings, error: settingsError } = await supabase
                    .from("social_settings" as any)
                    .select("*")
                    .eq("platform", "instagram")
                    .single();

                if (settingsError || !settings) {
                    throw new Error("Social settings not found. Please contact administrator.");
                }

                const instagramSettings = settings as any;
                setStatus("Exchanging code for token...");

                // 2. Exchange code for access token
                const formData = new FormData();
                formData.append("client_id", instagramSettings.app_id);
                formData.append("client_secret", instagramSettings.app_secret);
                formData.append("grant_type", "authorization_code");
                formData.append("redirect_uri", instagramSettings.redirect_uri);
                formData.append("code", code);

                const response = await fetch("https://api.instagram.com/oauth/access_token", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (data.error_message || !data.access_token) {
                    throw new Error(data.error_message || "Failed to get access token.");
                }

                setStatus("Saving account details...");

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated.");

                // 3. Save to social_accounts
                const { error: saveError } = await supabase
                    .from("social_accounts" as any)
                    .upsert({
                        user_id: user.id,
                        platform: "instagram",
                        access_token: data.access_token,
                        platform_account_id: data.user_id.toString(),
                        is_active: true,
                        last_synced_at: new Date().toISOString(),
                    }, { onConflict: "user_id,platform,platform_account_id" });

                if (saveError) throw saveError;

                toast.success("Instagram account connected successfully!");
                navigate("/social/accounts");

            } catch (error: any) {
                console.error("Auth callback error:", error);
                toast.error("Connection failed: " + error.message);
                navigate("/social/accounts");
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">{status}</p>
        </div>
    );
}
