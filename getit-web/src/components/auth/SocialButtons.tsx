"use client";

function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border-2 border-[#e3e3e3] text-base font-bold text-[#0f1a12] transition hover:bg-black/[0.03]"
    >
      {icon}
      {label}
    </button>
  );
}

export default function SocialButtons({ verb }: { verb: "Register" | "Login" }) {
  // TODO: hook these up to your auth provider (for example Supabase OAuth)
  return (
    <div className="space-y-4">
      <SocialButton
        label={`${verb} with Facebook`}
        onClick={() => {}}
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="4" fill="#3b5998" />
            <path fill="#fff" d="M16.5 24v-9h3l.5-3.5h-3.5V9.3c0-1 .3-1.7 1.8-1.7H20V4.5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.6H10V15h3v9z" />
          </svg>
        }
      />
      <SocialButton
        label={`${verb} with Google`}
        onClick={() => {}}
        icon={
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
        }
      />
    </div>
  );
}