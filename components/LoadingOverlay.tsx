"use client";

import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[999] flex items-center justify-center bg-white/70 transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <Loader2Icon className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
