"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render a stable placeholder until mounted to avoid hydration mismatch.
  if (!mounted) return <Button variant="ghost" size="icon-sm" aria-label="Toggle theme"><Sun size={17} /></Button>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Toggle theme">
          {theme === "dark" ? <Moon size={17} /> : theme === "system" ? <Monitor size={17} /> : <Sun size={17} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}><Sun size={15} /> Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}><Moon size={15} /> Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}><Monitor size={15} /> System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
