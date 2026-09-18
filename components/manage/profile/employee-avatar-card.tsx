"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

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

    try {
      let uploadFile: File | Blob = file;
      try {
        const compressed = await compressImage(file, 400);
        setAvatarPreview(URL.createObjectURL(compressed));
        uploadFile = compressed;
      } catch {
        setAvatarPreview(URL.createObjectURL(file));
      }

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast("You must be signed in to upload a profile photo.");
        return;
      }

      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `employee-${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("emp-pfp")
        .upload(filePath, uploadFile, { upsert: true, contentType: uploadFile.type });

      if (uploadError) {
        showToast(uploadError.message || "Could not upload your profile photo.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("emp-pfp").getPublicUrl(filePath);

      const { error: profileError } = await supabase
        .from("employee")
        .update({ profileImage_URL: publicUrl })
        .eq("employee_id", user.id);

      if (profileError) {
        showToast(profileError.message || "Could not save your profile photo.");
        return;
      }

      setAvatarPreview(publicUrl);
      router.refresh();
      showToast("Profile photo updated.");
    } catch {
      showToast("Could not upload your profile photo. Please try again.");
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