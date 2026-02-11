import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Share2,
    Settings,
    MessageSquare,
    ArrowLeft
} from "lucide-react";

export default function SocialLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", href: "/social", icon: LayoutDashboard },
        { name: "Leads", href: "/social/leads", icon: Users },
        { name: "Accounts", href: "/social/accounts", icon: Share2 },
        { name: "Conversations", href: "/social/conversations", icon: MessageSquare },
    ];

    const isActive = (href: string) => {
        if (href === "/social") return location.pathname === "/social";
        return location.pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/user-dashboard")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Social Media Module</h1>
                        <p className="text-sm text-muted-foreground">Manage your business socials and capture leads</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {menuItems.map((item) => (
                        <Button
                            key={item.href}
                            variant={isActive(item.href) ? "default" : "ghost"}
                            className={cn(
                                "gap-2",
                                isActive(item.href) && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => navigate(item.href)}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
}
