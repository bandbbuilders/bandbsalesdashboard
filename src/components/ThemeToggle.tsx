import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9" />;
    }

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);

        // Manual override for both class and data-theme
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9 flex items-center justify-center transition-all bg-muted hover:bg-muted/80 border"
            title="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 fill-amber-500" />
            ) : (
                <Moon className="h-4 w-4 text-slate-700 fill-slate-700" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}

