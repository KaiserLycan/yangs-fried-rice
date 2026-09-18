import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen bg-[#fbf6ec]">
      {/* Left side: Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 lg:p-24 text-center lg:text-left lg:items-start">
        <h1 className="font-display text-[60px] md:text-[80px] leading-none text-[#1a1210] mb-4">
          404
        </h1>
        <h2 className="font-sans text-[24px] md:text-[32px] font-bold text-[#1a1210] mb-6">
          Page Not Found
        </h2>
        <p className="max-w-md text-[16px] md:text-[18px] text-[#7a6a60] mb-10">
          The wok is hot, but we can't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/"
            className="flex h-[48px] items-center justify-center rounded-[10px] bg-[#e8541f] px-8 font-bold text-white transition-opacity hover:opacity-90"
          >
            Back to Menu
          </Link>
          <Link
            href="/manage/dashboard"
            className="flex h-[48px] items-center justify-center rounded-[10px] border border-[#ddcdb8] bg-white px-8 font-bold text-[#1a1210] transition-colors hover:bg-[#f6e9d9]"
          >
            Manage Dashboard
          </Link>
        </div>
      </div>

      {/* Right side: Image (reusing login hero) */}
      <div className="hidden lg:block lg:flex-1 relative">
        <Image
          src="/images/login-hero.jpg"
          alt="Yang's Fried Rice"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
