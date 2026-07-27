"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;
export const DropdownMenuGroup = M.Group;
export const DropdownMenuSub = M.Sub;
export const DropdownMenuSubTrigger = M.SubTrigger;

const contentCls =
  "z-50 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg data-[state=open]:animate-[content-in_120ms_ease-out]";

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof M.Content>, React.ComponentPropsWithoutRef<typeof M.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <M.Portal><M.Content ref={ref} sideOffset={sideOffset} className={cn(contentCls, className)} {...props} /></M.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const itemCls =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof M.Item>,
  React.ComponentPropsWithoutRef<typeof M.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <M.Item ref={ref} className={cn(itemCls, destructive && "text-destructive focus:bg-destructive/10", className)} {...props} />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof M.CheckboxItem>, React.ComponentPropsWithoutRef<typeof M.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <M.CheckboxItem ref={ref} className={cn(itemCls, "pl-8", className)} {...props}>
    <span className="absolute left-2.5 grid place-items-center">
      <M.ItemIndicator><Check size={14} /></M.ItemIndicator>
    </span>
    {children}
  </M.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof M.Label>) {
  return <M.Label className={cn("px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof M.Separator>) {
  return <M.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}
export function DropdownMenuSubContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof M.SubContent>) {
  return <M.Portal><M.SubContent className={cn(contentCls, className)} {...props} /></M.Portal>;
}
export { ChevronRight as DropdownSubIcon };
