"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { setEmployeePhoto } from "@/lib/actions/admin";

export function EmployeeAvatarCard({
  initials,
  avatarUrl,
}: {
  initials: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl ?? null);

  useEffect(() => {
    setAvatarPreview(avatarUrl ?? null);
  }, [avatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousPreview = avatarPreview;
    try {
      // Refuse rather than fall back to the raw file: a photo the browser
      // can't decode is not one it should upload, and the raw original can
      // be tens of megabytes.
      let compressed: File;
      try {
        compressed = await compressImage(file, 400);
      } catch {
        showToast("Could not read that photo. Try a JPEG, PNG, or WebP image.", "error");
        return;
      }
      setAvatarPreview(URL.createObjectURL(compressed));

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAvatarPreview(previousPreview);
        showToast("You must be signed in to upload a profile photo.", "error");
        return;
      }

      const formData = new FormData();
      formData.append("file", compressed);
      const result = await setEmployeePhoto(user.id, formData);

      if (result.error !== null) {
        setAvatarPreview(previousPreview);
        showToast(result.error || "Could not upload your profile photo.", "error");
        return;
      }

      setAvatarPreview(result.data.imageUrl);
      router.refresh();
      showToast("Profile photo updated.", "success");
    } catch {
      setAvatarPreview(previousPreview);
      showToast("Could not upload your profile photo. Please try again.", "error");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div
      className="group relative flex items-center justify-center shrink-0 size-[120px] md:size-[140px] rounded-full overflow-hidden bg-[#8c1c13] cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {avatarPreview ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarPreview}
          alt="Avatar Preview"
          className="size-full object-cover"
        />
      ) : (
        <span className="font-display text-[#fbf6ec] text-[48px] md:text-[60px] leading-none mt-2 md:mt-3">
          {initials}
        </span>
      )}

      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
    </div>
  );
}