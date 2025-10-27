// src/components/ContactCard.tsx
import { useMemo } from "react";

type Props = {
  name?: string;
  title?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
  rtl?: boolean; // כיוון כללי של הקומפוננטה (לרוב false כאן)
};

function toE164IL(local: string) {
  const d = local.replace(/\D/g, "");
  if (d.startsWith("+972")) return d;
  if (d.startsWith("972")) return `+${d}`;
  if (d.startsWith("0")) return `+972${d.slice(1)}`;
  return `+${d}`;
}

export default function ContactCard({
  name = "bell ohana",
  title = "DIGITALIFE CREATIVE",
  avatarUrl = "/avatar.jpg",
  email = "digitalifec@gmail.com",
  phone = "054-9411621",
  linkedin = "https://www.linkedin.com/in/bell-ohana-0b1229220",
  github = "https://github.com/BELLGU82",
  website = "http://www.digitalifec.com",
  location = "Tel Aviv",
  rtl = false, // נשתמש ב-LTR כדי שהלייבלים ישבו משמאל והקישורים מימין
}: Props) {
  const e164 = useMemo(() => toE164IL(phone), [phone]);
  const smsHref = `sms:${e164}`;
  const telHref = `tel:${e164}`;
  const mailHref = `mailto:${email}`;

  async function handleShare() {
    const text =
      `${name} — ${title}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      `LinkedIn: ${linkedin}\n` +
      `GitHub: ${github}\n` +
      `Website: ${website}\n` +
      `Location: ${location}`;

    const shareData: ShareData = { title: `Contact · ${name}`, text, url: website };

    try {
      if (navigator.canShare?.(shareData) || navigator.share) {
        await navigator.share(shareData);
        return;
      }
      const subject = encodeURIComponent(`Contact · ${name}`);
      const body = encodeURIComponent(text);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (err) {
      console.debug("Share cancelled/unavailable", err);
    }
  }

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="w-full">
      {/* כרטיס – אותו רקע בכל החלקים + overflow-hidden כדי למנוע שפיצים */}
      <div className="text-white rounded-3xl overflow-hidden bg-[#8e8174] border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,.08)]">
        {/* Header עם אותו רקע של הכרטיס (בלי שקיפות) */}
        <div className="px-6 pt-10 pb-6 bg-[#8e8174]">
          <div className="flex flex-col gap-4 items-center text-center">
            <div className="overflow-hidden w-28 h-28 bg-white rounded-full ring-2 ring-white/70">
              <img
                src={avatarUrl}
                alt={name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            {/* סדר חדש: שם ואז טייטל */}
            <div className="flex flex-col gap-1">
              <div className="text-4xl font-extrabold leading-tight">{name}</div>
              <div className="text-[12px] tracking-[.18em] uppercase opacity-70">{title}</div>
            </div>
          </div>
        </div>

        {/* פרטים – לייבלים בשמאל, ערכים/קישורים בימין */}
        <div className="px-6 pb-6">
          <div className="rounded-3xl bg-[#e0ceb8] border border-black/5 divide-y divide-black/10">
            <Row
              label="Mail"
              value={<a className="underline" href={mailHref}>{email}</a>}
            />
            <Row
              label="Phone"
              value={
                <div className="flex gap-3 justify-end items-center">
                  <a className="underline" href={telHref}>{phone}</a>
                  <span className="opacity-60">•</span>
                  <a className="underline" href={smsHref}>SMS</a>
                </div>
              }
            />
            <Row
              label="LinkedIn"
              value={<a className="underline" href={linkedin} target="_blank" rel="noreferrer">
                {linkedin.replace(/^https?:\/\//, "")}
              </a>}
            />
            <Row
              label="GitHub"
              value={<a className="underline" href={github} target="_blank" rel="noreferrer">
                {github.replace(/^https?:\/\//, "")}
              </a>}
            />
            <Row
              label="Web"
              value={<a className="underline" href={website} target="_blank" rel="noreferrer">
                {website.replace(/^https?:\/\//, "")}
              </a>}
            />
            <Row label="Location" value={location} />
          </div>

          {/* קבוצת כפתורים מחוברת בסגנון iOS */}
          <div className="overflow-hidden mt-4 rounded-3xl border shadow border-black/10 bg-[#e0ceb8]">
            <div className="flex">
              <a
                href={smsHref}
                className="flex-1 h-11 text-[15px] hover:bg-black/10 transition-colors grid place-items-center"
              >
                Send Message
              </a>
              <div className="w-px bg-black/10" />
              <button
                onClick={handleShare}
                className="flex-1 h-11 text-[15px] hover:bg-black/10 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* שורה דו־עמודתית: label משמאל, value מימין */
function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 items-center px-4 py-3 text-[15px]">
      <div className="text-left opacity-70">{label}</div>
      <div className="font-medium text-right break-all">{value}</div>
    </div>
  );
}
