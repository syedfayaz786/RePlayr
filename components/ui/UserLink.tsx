import Image from "next/image";
import Link from "next/link";

interface UserLinkProps {
  id: string;
  name: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizes = {
  sm: { avatar: 28, text: "text-xs", initials: "text-xs" },
  md: { avatar: 36, text: "text-sm", initials: "text-sm" },
  lg: { avatar: 48, text: "text-base", initials: "text-base" },
};

export function UserLink({ id, name, image, size = "md", showName = true, className = "" }: UserLinkProps) {
  const s = sizes[size];
  const initials = name?.[0]?.toUpperCase() ?? "?";

  return (
    <Link href={`/users/${id}`}
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity group ${className}`}>
      {image ? (
        {image.startsWith("data:") ? (
          <img src={image} alt={name ?? ""} width={s.avatar} height={s.avatar}
            className="rounded-full flex-shrink-0 object-cover" />
        ) : (
          <Image src={image} alt={name ?? ""} width={s.avatar} height={s.avatar}
          className="rounded-full flex-shrink-0 group-hover:ring-2 group-hover:ring-brand-500 transition-all"
          style={{ width: s.avatar, height: s.avatar }} />
        )}
      ) : (
        <div style={{ width: s.avatar, height: s.avatar }}
          className={`rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 font-bold flex-shrink-0 ${s.initials} group-hover:ring-2 group-hover:ring-brand-500 transition-all`}>
          {initials}
        </div>
      )}
      {showName && (
        <span className={`font-medium text-white group-hover:text-brand-400 transition-colors truncate ${s.text}`}>
          {name ?? "Anonymous"}
        </span>
      )}
    </Link>
  );
}
