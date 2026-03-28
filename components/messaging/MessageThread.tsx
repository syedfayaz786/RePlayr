"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Send, Package, Check, CheckCheck, X, ChevronUp, ChevronDown, Smile, ImageIcon, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { MutualRatingCard } from "@/components/messaging/MutualRatingCard";
import { SoldToBuyerButton } from "@/components/messaging/SoldToBuyerButton";
import { PendingToBuyerButton } from "@/components/messaging/PendingToBuyerButton";
import { ChatSafetyMenu } from "@/components/safety/ChatSafetyMenu";

// Highlight matching text within a string
function HighlightText({ text, query }: { text: string; query?: string | null }) {
  if (!query?.trim()) return <>{text}</>;
  const q = query.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-400 text-dark-900 rounded px-0.5 not-italic font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  read?: boolean;
  listing?: { id: string; title: string; price?: number } | null;
}

interface PinnedListing {
  id: string;
  title: string;
  price: number;
  platform: string;
  condition: string;
  images: string[];
}

interface MessageThreadProps {
  thread: Message[];
  currentUserId: string;
  partnerId: string;
  listingId?: string | null;
  partnerName: string;
  partnerImage?: string | null;
  pinnedListing?: PinnedListing | null;
  deleteButton?: ReactNode;
  // Mutual rating
  saleConfirmed?: boolean;
  isSeller?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerImage?: string | null;
  currentUserName?: string;
  listingTitle?: string;
  myExistingReview?: { rating: number; comment: string | null; strengths: string[] } | null;
  // SoldToBuyerButton props (rendered internally so we can wire onSaleConfirmed)
  soldToListingId?: string;
  soldToBuyerId?: string;
  soldToBuyerName?: string;
  alreadySold?: boolean;
  listingStatus?: string;
  sellerDisplayName?: string;
  buyerDisplayName?: string;
  searchQuery?: string | null;
}

export function MessageThread({
  thread: initialThread,
  currentUserId,
  partnerId,
  listingId,
  partnerName,
  partnerImage,
  pinnedListing,
  deleteButton,
  saleConfirmed,
  isSeller,
  sellerId,
  sellerName,
  sellerImage,
  currentUserName,
  listingTitle,
  myExistingReview,
  soldToListingId,
  soldToBuyerId,
  soldToBuyerName,
  alreadySold,
  listingStatus,
  sellerDisplayName,
  buyerDisplayName,
  searchQuery,
}: MessageThreadProps) {
  const [messages, setMessages]         = useState(initialThread);

  // Sync messages when the thread prop changes (new conversation selected)
  // The `key` prop on this component handles most cases, but this is a safety net
  useEffect(() => {
    setMessages(initialThread);
  }, [initialThread]);
  const [input, setInput]               = useState("");
  const [showEmoji, setShowEmoji]       = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending]           = useState(false);
  const [lastSeen, setLastSeen]         = useState(false);
  const [localSaleConfirmed, setLocalSaleConfirmed] = useState(saleConfirmed ?? false);
  const [localListingStatus, setLocalListingStatus] = useState(
    listingStatus === "active" ? "available" : (listingStatus ?? "available")
  );
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedBy, setBlockedBy] = useState(false);

  // Check block status on mount
  useEffect(() => {
    fetch(`/api/blocks?userId=${partnerId}`)
      .then(r => r.json())
      .then(d => { setIsBlocked(d.blocked ?? false); setBlockedBy(d.blockedBy ?? false); })
      .catch(() => {});
  }, [partnerId]);

  const handleUnblock = async () => {
    try {
      await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: partnerId }),
      });
      setIsBlocked(false);
    } catch {
      // silently fail — user can try again
    }
  };

  // Called by MutualRatingCard after submission — adds the rating message to local thread
  // Rating message was sent to recipient via API — sender sees submitted state in rating card,
  // not a chat bubble. So we don't append to local messages here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRatingMessage = (_msgContent: string) => { /* no-op for sender */ };

  // Called when seller clicks "Mark as sold" — instantly shows system message + rating card
  const handleSaleConfirmed = () => {
    const sName = sellerDisplayName ?? "You";
    const bName = buyerDisplayName ?? partnerName;
    const sysMsg: Message = {
      id: "sale-confirmed-" + Date.now(),
      content: `🎉 SALE_CONFIRMED|seller:${sName}|buyer:${bName}`,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, sysMsg]);
    setLocalSaleConfirmed(true);
  };
  const bottomRef          = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyTopRef       = useRef<HTMLDivElement>(null); // wraps header+listing+search banners

  const [currentMatch, setCurrentMatch] = useState(0);
  const shouldScrollToFirst = useRef(false); // flag: scroll to match 0 once its ref is set

  // Scroll to bottom on new messages (only when not searching)
  useEffect(() => {
    if (!searchQuery?.trim()) {
      // Small timeout ensures images/content have started rendering before scroll
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
    }
  }, [messages, searchQuery]);

  // When query changes: reset index and flag to scroll to first match
  useEffect(() => {
    setCurrentMatch(0);
    shouldScrollToFirst.current = !!searchQuery?.trim();
  }, [searchQuery]);

  // Called when match 0 mounts — triggers initial scroll to first match
  const onFirstMatchMount = (el: HTMLDivElement | null) => {
    if (el && shouldScrollToFirst.current) {
      shouldScrollToFirst.current = false;
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const targetTop = el.offsetTop - (container.clientHeight / 2) + (el.offsetHeight / 2);
        container.scrollTop = Math.max(0, targetTop);
      });
    }
  };

  // Query the scroll container for a match element by its data-match-pos attribute
  const getMatchEl = (pos: number): HTMLDivElement | null => {
    return scrollContainerRef.current?.querySelector<HTMLDivElement>(`[data-match-pos="${pos}"]`) ?? null;
  };

  // Scroll to a specific match index
  const scrollToMatch = (idx: number) => {
    setCurrentMatch(idx);
    // Double rAF: first waits for React commit, second waits for browser paint
    // This ensures all effects have run before we set scrollTop
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = getMatchEl(idx);
      const container = scrollContainerRef.current;
      if (!el || !container) return;
      const targetTop = el.offsetTop - (container.clientHeight / 2) + (el.offsetHeight / 2);
      container.scrollTop = Math.max(0, targetTop);
    }));
  };

  // Mark partner's messages as read when we open/focus the thread
  useEffect(() => {
    fetch("/api/messages/read-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, listingId }),
    }).catch(() => {});
  }, [partnerId, listingId]);

  // Poll for "Seen" status on my last message every 5s
  useEffect(() => {
    const poll = () => {
      const params = new URLSearchParams({ partnerId });
      if (listingId) params.set("listingId", listingId);
      fetch(`/api/messages/read-status?${params}`)
        .then(r => r.json())
        .then(d => setLastSeen(d.seen ?? false))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [partnerId, listingId, messages]);

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
    { label: "😀 Smileys", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾"] },
    { label: "👋 People", emojis: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","🫦","👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷","👮","🕵️","💂","🧑‍⚕️","👨‍⚕️","👩‍⚕️","🧑‍🍳","👨‍🍳","👩‍🍳","🧑‍🎓","👨‍🎓","👩‍🎓","🧑‍🎤","👨‍🎤","👩‍🎤","🧑‍💻","👨‍💻","👩‍💻","🧑‍🚀","👨‍🚀","👩‍🚀","🦸","🦹","🧙","🧚","🧜","🧝","🧞","🧟","🧌","💆","💇","🚶","🧍","🧎","🏃","💃","🕺","🧖","🧗","🏇","🏋️","🤸","🤼","🤺","🤾","⛹️","🏊","🏄","🚴","🏌️","👫","👬","👭","💑","💏","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦","👪"] },
    { label: "❤️ Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","✡️","🔯","🕎","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","⛔","📛","🚫","💯","🔞","📵","🚳","🚭","🚯","🚱","🚷","🔕","🔇","🔕","🌈","✨","⭐","🌟","💫","⚡","🔥","🌊","💧","🌺","🌸","🌹","🌷","🌻","🌼","🍀","🌿","🌱","🪴","🌾","🍃"] },
    { label: "🐶 Animals", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪲","🦟","🦗","🪳","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"] },
    { label: "🌍 Nature", emojis: ["🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪻","🎋","🍃","🍂","🍁","🪺","🪹","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌟","⭐","💫","✨","⚡","🔥","🌪️","🌈","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","💧","💦","🫧","🌊","🌀","🌫️","🌈","⛱️","☂️","☔","⛄","🌊","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙️","🌃","🌌","🌉","🌁"] },
    { label: "🎮 Gaming", emojis: ["🎮","🕹️","👾","🎲","🎯","🏆","🥇","🥈","🥉","🎖️","🏅","🎪","🎭","🎨","🖼️","🎬","📽️","🎞️","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🪕","🎻","🪗","🪈","🎙️","📻","🎰","🎳","🎱","🏓","🏸","🥊","🥋","⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎿","🛷","🥌","🏒","🏑","🏏","🪃","🏹","🎣","🤿","🎽","🎿","🛹","🛼","🪁","🎯","🎱","🪀","🪃","🏋️","🤸","🏊","🏄","🚴","🧗","🤺","⛹️","🏇","🤾","🏌️","🏇","🤼","🥇","🎖️"] },
    { label: "🍕 Food", emojis: ["🍕","🍔","🌮","🌯","🥪","🍟","🍿","🥓","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥖","🫓","🥨","🧀","🥗","🥙","🧆","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍎","🍏","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🫛","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🧄","🧅","🥔","🍠","☕","🫖","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🍶","🥛","🍼","🧂","🫙"] },
    { label: "🚗 Travel", emojis: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚧","🚦","🚥","🚁","🛸","✈️","🛩️","🛫","🛬","🚀","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","🪝","⛽","🚧","🛤️","🌍","🌎","🌏","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🌌","🎠","🎡","🎢","💈"] },
    { label: "💡 Objects", emojis: ["💡","🔦","🕯️","🪔","🧯","🛢️","💰","💳","💵","💴","💶","💷","🪙","💎","🔑","🗝️","🔐","🔒","🔓","🔏","🪝","🧲","⚙️","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","🪛","🔫","🪃","🏹","🛡️","🪖","⚔️","🗡️","🪓","🔪","📦","📫","📪","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","📋","📁","📂","🗂️","📅","📆","🗒️","🗓️","📇","📌","📍","📎","🖇️","📏","📐","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔑","🗝️","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","🔫","🏹","🛡️","🪚","🔧","🪛","🔩","⚙️","🗜️","🔗","⛓️","🪝","🧰","🪤","🧲","🔮","🪄","🧿","🪬","💈","⚗️","🔭","🔬","🩺","🩻","💊","🩹","🩼","🩺","🧬","🦠","🧫","🧪","🌡️","🛒","🚪","🛗","🪞","🪟","🛏️","🛋️","🪑","🚽","🪠","🚿","🛁","🪤","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🧯","🛒","🚪","🪣","🪟"] },
    { label: "💬 Symbols", emojis: ["✅","❌","❓","❗","‼️","⁉️","💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","🔲","🔳","▪️","▫️","◾","◽","◼️","◻️","⬛","⬜","♠️","♥️","♦️","♣️","🃏","🀄","🎴","🔇","🔈","🔉","🔊","📣","📢","🔔","🔕","🎵","🎶","♾️","💲","💱","♻️","⚜️","🔱","📛","🔰","⭕","✅","☑️","✔️","❎","🔟","🔠","🔡","🔢","🔣","🔤","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⛔","📵","🚫","💤","🔃","🔄","⏫","⏬","⏩","⏪","⏭️","⏮️","⏯️","🔀","🔁","🔂","▶️","⏸️","⏹️","⏺️","🎦","🔅","🔆","📶","🛜","📳","📴","📵","📞","☎️","📟","📠","🔋","🪫","🔌","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","🧮","🎥","📷","📸","📹","📼","🔍","🔎","🕯️","💡","🔦","🏮","🪔","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🏷️","💰","🪙","💴","💵","💶","💷","💸","💳","🧾","📊","📈","📉","📋"] },
  ];

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif","image/heic","image/heif"];
  const MAX_IMAGE_MB = 20;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError("");

    // Client-side validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && file.type !== "") {
      setUploadError("Only images are allowed (JPG, PNG, GIF, WEBP, HEIC)");
      setTimeout(() => setUploadError(""), 4000);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setUploadError(`File too large — max ${MAX_IMAGE_MB} MB`);
      setTimeout(() => setUploadError(""), 4000);
      return;
    }

    setImageUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64, filename: file.name, folder: "replayr/messages" }),
      });
      const uploadResult = await res.json();
      if (!res.ok) {
        setUploadError(uploadResult.error ?? "Upload failed");
        setTimeout(() => setUploadError(""), 4000);
        setImageUploading(false);
        return;
      }
      const { url } = uploadResult;
      const content = `📷IMAGE:${url}`;
      setSending(true);
      const tempMsg: Message = {
        id: "temp-" + Date.now(),
        content,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, tempMsg]);
      const msgRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content, listingId: listingId ?? undefined }),
      });
      if (!msgRes.ok) throw new Error();
      const saved = await msgRes.json();
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...saved, createdAt: saved.createdAt } : m));
    } catch {
      setUploadError("Failed to send image — please try again");
      setTimeout(() => setUploadError(""), 4000);
    } finally {
      setImageUploading(false);
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || isBlocked || blockedBy) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setLastSeen(false); // reset seen when new message sent

    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content, listingId: listingId ?? undefined }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...saved, createdAt: saved.createdAt } : m));
    } catch {
      toast.error("Failed to send");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  // Find the last message I sent — to show Seen below it
  const myMessages = messages.filter(m => m.senderId === currentUserId);
  const lastMyMsgId = myMessages[myMessages.length - 1]?.id ?? null;

  return (
    <>
      {/* ── Sticky top wrapper (header + listing banner + search banner) — measured for scroll offset ── */}
      <div ref={stickyTopRef} className="flex-shrink-0 flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-600 bg-dark-800/60">
        <Link href={`/users/${partnerId}`} className="flex-shrink-0 hover:ring-2 hover:ring-brand-500 rounded-full transition-all">
          {partnerImage ? (
            <Image src={partnerImage} alt={partnerName} width={36} height={36} className="rounded-full" />
          ) : (
            <div className="w-9 h-9 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
              {partnerName[0].toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/users/${partnerId}`} className="font-semibold text-white text-sm truncate hover:text-brand-400 transition-colors block">{partnerName}</Link>

        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChatSafetyMenu
            partnerId={partnerId}
            partnerName={partnerName}
            onBlocked={() => setIsBlocked(true)}
            deleteButton={deleteButton}
          />
        </div>
      </div>

      {/* ── Pinned listing banner ── */}
      {pinnedListing && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-500/8 border-b border-brand-500/20 flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 border border-dark-500">
            {pinnedListing.images[0] ? (
              pinnedListing.images[0].startsWith("data:") ? (
                <img src={pinnedListing.images[0]} alt={pinnedListing.title} className="w-full h-full object-cover" />
              ) : (
                <Image src={pinnedListing.images[0]} alt={pinnedListing.title} width={48} height={48} className="object-cover w-full h-full" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-500" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-0.5">About this listing</p>
            <p className="text-sm font-medium text-white truncate">{pinnedListing.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-brand-400 font-bold text-sm">${Number(pinnedListing.price).toFixed(2)}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">{pinnedListing.platform}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-400">{pinnedListing.condition}</span>
              {/* Status pill */}
              {localListingStatus === "available" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/25 leading-tight">Available</span>
              )}
              {localListingStatus === "pending" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 leading-tight">Pending</span>
              )}
              {localListingStatus === "sold" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-500/15 text-gray-400 border border-gray-500/25 leading-tight">Sold</span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {localSaleConfirmed && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/25">
                <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-xs font-semibold text-green-400">Sold</span>
              </div>
            )}
            {isSeller && soldToBuyerId && soldToListingId && !localSaleConfirmed && (
              <PendingToBuyerButton
                listingId={soldToListingId}
                buyerName={soldToBuyerName ?? partnerName}
                currentStatus={localListingStatus}
                onStatusChange={setLocalListingStatus}
              />
            )}
            {isSeller && soldToBuyerId && soldToListingId && (
              <SoldToBuyerButton
                listingId={soldToListingId}
                buyerId={soldToBuyerId}
                buyerName={soldToBuyerName ?? partnerName}
                alreadySold={alreadySold ?? false}
                sellerName={sellerDisplayName ?? "You"}
                onSaleConfirmed={handleSaleConfirmed}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Search navigation banner — always rendered, hidden when no query, so height is always reserved ── */}
      {(() => {
        const q = searchQuery?.trim() ?? "";
        const totalMatches = q
          ? messages.filter(m => m.content.toLowerCase().includes(q.toLowerCase())).length
          : 0;
        return (
          <div
            style={{
              height: 36,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 8,
              borderBottom: q ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
              background: q ? "rgba(245,158,11,0.08)" : "transparent",
              visibility: q ? "visible" : "hidden",
              overflow: "hidden",
            }}
          >
            {/* Left: fixed label */}
            <span style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0, color: "#fbbf24" }}>
              🔍 <strong>"{searchQuery}"</strong>
              {totalMatches === 0
                ? <span style={{ color: "#6b7280" }}> — no matches</span>
                : <span style={{ color: "rgba(251,191,36,0.6)" }}> — {totalMatches} match{totalMatches !== 1 ? "es" : ""}</span>}
            </span>

            {/* Right: nav controls — always in DOM with fixed widths */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => scrollToMatch((currentMatch - 1 + totalMatches) % totalMatches)}
                disabled={totalMatches <= 1}
                style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.2)", border: "none", cursor: totalMatches > 1 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", opacity: totalMatches <= 1 ? 0 : 1 }}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <span style={{ width: 36, textAlign: "center", fontSize: 11, fontFamily: "monospace", color: "#fbbf24", flexShrink: 0, opacity: totalMatches <= 1 ? 0 : 1 }}>
                {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : ""}
              </span>
              <button
                onClick={() => scrollToMatch((currentMatch + 1) % totalMatches)}
                disabled={totalMatches <= 1}
                style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,0.2)", border: "none", cursor: totalMatches > 1 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", opacity: totalMatches <= 1 ? 0 : 1 }}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <a
                href={`/messages?with=${partnerId}${listingId ? `&listing=${listingId}` : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "rgba(251,191,36,0.6)", textDecoration: "none", marginLeft: 4, flexShrink: 0 }}
              >
                <X className="w-3 h-3" /> Clear
              </a>
            </div>
          </div>
        );
      })()}

      </div>{/* end stickyTopRef */}

      {/* ── Scrollable message list ── */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 relative">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">Start the conversation!</div>
        )}

        {(() => {
          // Pre-compute which message indices are matches, in order
          const matchIndices = searchQuery?.trim()
            ? messages.reduce<number[]>((acc, m, i) => {
                if (m.content.toLowerCase().includes(searchQuery!.toLowerCase())) acc.push(i);
                return acc;
              }, [])
            : [];
          return messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const isImage = msg.content.startsWith("📷IMAGE:");
          const isRating = msg.content.startsWith("⭐ Rating received");
          const isOldRating = !isRating && msg.content.includes("rated you as a");
          const isSystem = msg.content.startsWith("🎉");
          const matchPos = matchIndices.indexOf(idx); // -1 if not a match, else its position in matches
          // Parse encoded sale message: "🎉 SALE_CONFIRMED|seller:Name|buyer:Name"
          const salePayload = isSystem && msg.content.includes("SALE_CONFIRMED")
            ? Object.fromEntries(
                msg.content.replace("🎉 SALE_CONFIRMED|", "").split("|")
                  .map(p => p.split(":") as [string, string])
              )
            : null;
          const systemText = salePayload
            ? (isMe
                ? `🎉 You marked this listing as sold to ${salePayload.buyer}! You can now rate each other.`
                : `🎉 ${salePayload.seller} marked this listing as sold to you! You can now rate each other.`)
            : msg.content; // fallback for old messages
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showLabel = !prevMsg || prevMsg.senderId !== msg.senderId;
          const isLastMine = msg.id === lastMyMsgId;

          // Hide old-format rating messages entirely (legacy format before golden card)
          if (isOldRating) return null;

          // System: sale notification — also render the rating card immediately after it
          if (isSystem) {
            return (
              <div key={msg.id}>
                <div className="flex justify-center py-2">
                  <div className="bg-dark-700/80 border border-brand-500/20 rounded-xl px-4 py-2 text-xs text-gray-300 text-center max-w-xs">
                    {systemText}
                    <div className="text-gray-500 mt-0.5">{formatRelativeTime(msg.createdAt)}</div>
                  </div>
                </div>
                {localSaleConfirmed && listingId && sellerId && (
                  <MutualRatingCard
                    listingId={listingId}
                    listingTitle={listingTitle ?? "this listing"}
                    currentUserId={currentUserId}
                    isSeller={isSeller ?? false}
                    partnerId={partnerId}
                    partnerName={partnerName}
                    partnerImage={partnerImage}
                    currentUserName={currentUserName ?? "You"}
                    sellerId={sellerId}
                    sellerName={sellerName ?? partnerName}
                    sellerImage={sellerImage}
                    myExistingReview={myExistingReview ?? null}
                    onRatingMessage={handleRatingMessage}
                  />
                )}
              </div>
            );
          }

          // Rating message — only shown to the RECIPIENT (sender already sees it in rating card)
          if (isRating) {
            if (isMe) return null; // sender doesn't see their own rating as a chat bubble
            const lines = msg.content.split("\n");
            // lines[1] = "★★★★☆ Great — rated you as a seller"
            const starLine = lines[1] ?? "";
            const starMatch = starLine.match(/^(★+)(☆*) (.+?) — rated you as a (\w+)/);
            const filledStars = starMatch ? starMatch[1].length : 0;
            const ratingLabel = starMatch ? starMatch[3] : "";
            const recipientRole = starMatch ? starMatch[4] : "";
            // Sender's role is opposite of recipient's role
            const roleLabel = recipientRole === "buyer" ? "seller" : recipientRole === "seller" ? "buyer" : recipientRole;
            const strengthLine = lines.find(l => l.startsWith("✨")) ?? "";
            const commentLine  = lines.find(l => l.startsWith('"')) ?? "";
            const strengths = strengthLine.replace("✨ ", "").split(" · ").filter(Boolean);

            return (
              <div key={msg.id} className="flex justify-center py-2">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08))" }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/25"
                    style={{ background: "rgba(245,158,11,0.12)" }}>
                    <span className="text-base">⭐</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-300 truncate">
                        Rating received from {roleLabel} {partnerName}
                      </p>
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className={`w-5 h-5 ${s <= filledStars ? "text-amber-400" : "text-gray-600"}`}
                          fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-amber-300">{ratingLabel}</span>
                  </div>
                  {/* Strengths */}
                  {strengths.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1">
                      {strengths.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{s}</span>
                      ))}
                    </div>
                  )}
                  {/* Comment */}
                  {commentLine && (
                    <p className="px-4 pb-2 text-xs text-gray-300 italic">{commentLine}</p>
                  )}
                  <div className="px-4 pb-3 text-xs text-gray-500">{formatRelativeTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          }

          const msgMatches = matchPos >= 0;
          const isCurrentMatch = msgMatches && matchPos === currentMatch;

          return (
            <div key={msg.id}
              ref={matchPos === 0 ? onFirstMatchMount : undefined}
              data-match-pos={msgMatches ? matchPos : undefined}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${showLabel ? "mt-3" : "mt-0.5"}`}>
              {/* Sender label — only when sender changes */}
              {showLabel && (
                <span className="text-xs text-gray-500 mb-1 px-1">
                  {isMe ? "You" : partnerName}
                </span>
              )}

              {/* Bubble */}
              {isImage ? (
                <div className="relative overflow-hidden rounded-2xl max-w-[240px] cursor-pointer"
                  onClick={() => window.open(msg.content.replace("📷IMAGE:", ""), "_blank")}>
                  <img
                    src={msg.content.replace("📷IMAGE:", "")}
                    alt="shared image"
                    className="max-w-[240px] max-h-[300px] object-cover block hover:opacity-90 transition-opacity"
                    onLoad={() => {
                      if (!searchQuery?.trim()) {
                        const container = scrollContainerRef.current;
                        if (container) container.scrollTop = container.scrollHeight;
                      }
                    }}
                  />
                  <div className="absolute bottom-1.5 right-2 text-xs text-white/80 flex items-center gap-1 drop-shadow-md">
                    {formatRelativeTime(msg.createdAt)}
                    {isMe && (isLastMine && lastSeen ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3 opacity-60" />)}
                  </div>
                </div>
              ) : (
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm transition-all ${
                  isMe ? "bg-brand-500 text-white rounded-br-sm" : "bg-dark-700 text-gray-100 rounded-bl-sm"
                } ${isCurrentMatch ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-dark-900" : msgMatches ? "ring-1 ring-amber-400/40" : ""}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    <HighlightText text={msg.content} query={searchQuery} />
                  </p>
                  <div className="text-xs mt-1 opacity-60 flex items-center gap-1 justify-end">
                    {formatRelativeTime(msg.createdAt)}
                    {isMe && (
                      isLastMine && lastSeen
                        ? <CheckCheck className="w-3 h-3 text-brand-200" />
                        : <Check className="w-3 h-3 opacity-60" />
                    )}
                  </div>
                </div>
              )}

              {/* Seen label under my last message */}
              {isMe && isLastMine && lastSeen && (
                <span className="text-xs text-brand-300 mt-0.5 px-1 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Seen
                </span>
              )}
            </div>
          );
          });
        })()}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-dark-600 flex-shrink-0 relative">
        {(isBlocked || blockedBy) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-b-2xl"
            style={{background: "rgba(8,9,16,0.92)", backdropFilter: "blur(4px)"}}>
            <p className="text-sm" style={{color: "var(--text-muted)"}}>
              {isBlocked ? "You blocked this user" : "You cannot message this user"}
            </p>
            {isBlocked && (
              <button
                onClick={handleUnblock}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  background: "rgba(0,240,255,0.1)",
                  border: "1px solid rgba(0,240,255,0.2)",
                  color: "var(--accent)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.1)"; }}
              >
                Unblock
              </button>
            )}
          </div>
        )}
        {/* Inline upload error */}
        {uploadError && (
          <div className="absolute bottom-full left-0 right-0 mx-3 mb-1 flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-xl px-3 py-2">
            <span className="text-sm">⚠️</span>
            {uploadError}
          </div>
        )}
      {/* Emoji picker */}
        {showEmoji && (
          <div className="absolute bottom-full left-0 mb-2 bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl z-20 w-80 overflow-hidden flex flex-col" style={{maxHeight: "340px"}}>
            {/* Category tabs */}
            <div className="flex overflow-x-auto border-b border-dark-600 px-2 pt-2 gap-1 flex-shrink-0" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(6,182,212,0.3) transparent"}}>
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => {
                  const el = document.getElementById(`emoji-cat-${i}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }} className="flex-shrink-0 text-base px-2 pb-1.5 hover:bg-dark-700 rounded-t-lg transition-colors" title={cat.label}>
                  {cat.emojis[0]}
                </button>
              ))}
            </div>
            {/* Scrollable emoji grid */}
            <div className="p-2 flex-1 overflow-y-auto" style={{scrollbarWidth:"thin",scrollbarColor:"rgba(6,182,212,0.3) transparent"}}>
              {EMOJI_CATEGORIES.map((cat, i) => (
                <div key={i} id={`emoji-cat-${i}`} className="mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1.5 px-1">{cat.label}</p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {cat.emojis.map(emoji => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)}
                        className="text-xl hover:bg-dark-700 rounded-lg p-1 transition-colors leading-none">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Emoji button */}
          <button
            onClick={() => setShowEmoji(v => !v)}
            className={`flex-shrink-0 p-2 rounded-xl transition-colors ${showEmoji ? "bg-brand-500/20 text-brand-400" : "text-brand-400 hover:text-brand-300 hover:bg-dark-700"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          {/* Image button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={imageUploading}
            className="flex-shrink-0 p-2 rounded-xl text-brand-400 hover:text-brand-300 hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            {imageUploading ? <Loader2 className="w-5 h-5 animate-spin text-brand-400" /> : <ImageIcon className="w-5 h-5" />}
          </button>
          <input ref={imageInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif" className="hidden" onChange={handleImageUpload} />
          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="input-base flex-1"
            onClick={() => setShowEmoji(false)}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !sending) || sending}
            className="btn-primary px-4 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
