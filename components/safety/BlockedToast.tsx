"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function BlockedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("blocked") === "1") {
      toast.success("User blocked — their listings are now hidden");
      // Clean the URL param without re-render
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
