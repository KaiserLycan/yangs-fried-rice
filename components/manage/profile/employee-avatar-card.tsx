"use client";

/**
 * Employee Avatar Card
 * 
 * What's Added/Changed:
 * - Implemented a hover overlay that dims the avatar and shows a camera icon.
 * - Added a hidden file input to allow selecting an image from the local device.
 * - Uses URL.createObjectURL to instantly preview the selected image.
 * 
 * TODO (Backend Integration & Improvements):
 * - [ ] Connect the file input to upload the image to Supabase Storage.
 * - [ ] Fetch and display the user's actual avatar URL instead of initials.
 * - [ ] Add error handling for upload failures and file size/type restrictions.
 */

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

export function EmployeeAvatarCard({ initials }: { initials: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      // TODO: upload file to backend
    }
  };

  return (
    <div
      className="group relative flex items-center justify-center shrink-0 size-[140px] rounded-full overflow-hidden bg-[#8c1c13] cursor-pointer"
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
        <img
          src={avatarPreview}
          alt="Avatar Preview"
          className="size-full object-cover"
        />
      ) : (
        <span className="font-display text-[#fbf6ec] text-[60px] leading-none mt-2">
          {initials}
        </span>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-10 h-10 text-white" />
      </div>
    </div>
  );
}
