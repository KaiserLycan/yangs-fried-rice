"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { compressImage } from "@/lib/image/compress";
import { ALLOWED_IMAGE_TYPES, imageUploadProblem } from "@/lib/storage/stored-image";
import { uploadProfileImage } from "@/lib/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The avatar, everywhere it renders on the profile screen, as the control for
 * changing the photo.
 */
export function AvatarButton({
  initials,
  imageUrl,
  className,
  wrapperClassName,
}: {
  initials: string;
  imageUrl?: string | null;
  className?: string;
  wrapperClassName?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Checked on the original, before compressing (P31): compression shrinks
    // a 4K photo under the limit, so the server alone would never refuse it.
    const problem = imageUploadProblem(file);
    if (problem) {
      showToast(problem, "error");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const compressedFile = await compressImage(file, 400);

      const formData = new FormData();
      formData.append("file", compressedFile);

      const result = await uploadProfileImage(formData);

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast("Photo updated.", "success");
        router.refresh();
      }
    } catch (error) {
      showToast("Could not process that photo. Try a JPEG, PNG, or WebP image.", "error");
      console.error(error);
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("relative group", wrapperClassName)}>
      <input
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={isUploading}
        aria-label="Change your photo"
        onClick={() => fileInputRef.current?.click()}
        className="block relative rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 overflow-hidden w-full h-full"
      >
        <Avatar
          initials={initials}
          imageUrl={imageUrl}
          className={cn("flex size-full", className)}
        />

        {/* Hover overlay with camera icon */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-pill",
            isUploading && "opacity-100"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          )}
        </div>
      </button>
    </div>
  );
}
