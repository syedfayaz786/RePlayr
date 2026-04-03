import dns from "dns/promises";
import type { MxRecord } from "dns";

// ─── 1. FORMAT VALIDATION ─────────────────────────────────────────────────────
// RFC 5322-aligned regex — covers 99.9% of real-world email addresses.
// - Local part: letters, numbers, dots, +, -, _, % (no leading/trailing dots)
// - Domain: at least one dot, valid TLD (2+ chars), no double-dots
const EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254); // RFC 5321 max length
}

export function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > 254) return false;
  const [local] = email.split("@");
  if (!local || local.length > 64) return false; // RFC 5321 local-part max
  return EMAIL_REGEX.test(email);
}

// ─── 2. DISPOSABLE EMAIL BLOCKLIST ───────────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  // Mailinator family
  "mailinator.com", "mailinator2.com", "mailinator.net",
  // 10 Minute Mail
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minutemail.co.uk",
  "10minutemail.de", "10minutemail.ru", "10minutemail.be",
  // Guerrilla Mail
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.de", "guerrillamail.biz", "guerrillamail.info",
  "grr.la", "guerrillamailblock.com", "spam4.me",
  // Temp Mail / Throwam
  "tempmail.com", "temp-mail.org", "tempmail.net", "tempmail.io",
  "throwam.com", "throwam.net",
  // YOPmail
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx",
  // Trashmail
  "trashmail.com", "trashmail.at", "trashmail.io", "trashmail.me",
  "trashmail.net", "trashmail.org",
  // Dispostable
  "dispostable.com", "discard.email",
  // Sharklasers / Guerrilla variants
  "sharklasers.com", "spam4.me",
  // Fakeinbox
  "fakeinbox.com", "fakeinbox.net",
  // Mailnull / Spam-free
  "mailnull.com", "spamgourmet.com", "spamgourmet.net",
  // Throwaway
  "throwaway.email",
  // Nada / Inboxalias
  "nada.email", "inboxalias.com",
  // Maildrop
  "maildrop.cc",
  // Burner email
  "burnermail.io", "mohmal.com",
  // Others commonly seen in abuse patterns
  "mailnesia.com", "spam.la", "binkmail.com", "bob.email", "mailin8r.com",
  "mailzilla.org", "meltmail.com", "neomailbox.com",
  "notmailinator.com", "proxymail.eu", "rcpt.at", "s0ny.net",
  "spamavert.com", "spamcorpse.com", "spamex.com",
  "spamfree24.org", "spamgob.com", "spamhereplease.com",
  "spamhole.com", "spamify.com", "spaminator.de",
  "spamkill.info", "spaml.com", "spammotel.com",
  "spamoff.de", "spamobox.com", "spamspot.com",
  "spamthis.co.uk", "spamtroll.net", "temporaryemail.net",
  "temporaryforwarding.com", "tempskmail.com", "tempr.email",
  "thanks.com", "tilien.com", "toomail.biz",
  "trashdevil.com", "trashemail.de", "trashimail.com",
  "trashmailer.com", "trbvm.com", "turual.com", "twinmail.de",
  "tyldd.com", "uggsrock.com", "umail.net",
  "upliftnow.com", "uplipht.com", "veryrealemail.com",
  "vidchart.com", "viditag.com", "viewcastmedia.com",
  "volga.name", "vomoto.com", "walala.org", "webemail.me",
  "wilemail.com", "wmail.cf", "wolfsmail.tk", "writeme.us",
  "wronghead.com", "wuzupmail.net", "xemaps.com", "xents.com",
  "xmail.net", "xmaily.com", "xoxy.net", "xpectmore.com",
  "xzing.net", "yapped.net", "yellowdogtraining.com",
  "yep.it", "yogamaven.com", "yomail.info", "yuurok.com",
  "z1p.biz", "za.com", "zed.mb.ca", "zemail.me",
  "zoemail.org", "zomg.info", "zxcv.com", "zzsmail.com",
  "getairmail.com", "goemailgo.com", "gotmail.com", "gotmail.net",
  "gotmail.org", "h8s.org", "hailmail.net",
  "harakirimail.com", "hat-stuff.com", "hatespam.org", "herp.in",
  "hidemail.de", "hidzz.com", "hmamail.com", "hopemail.biz",
  "ieatspam.eu", "ieatspam.info", "ieh-mail.de", "imail1.net",
  "inboxclean.com", "inboxclean.org", "inoutmail.de", "inoutmail.eu",
  "inoutmail.info", "inoutmail.net", "insorg-mail.info",
  "instant-mail.de", "ipoo.org", "irish2me.com", "iwi.net",
  "jetable.com", "jetable.net", "jetable.org",
  "jnxjn.com", "jourrapide.com", "jsrsolutions.com", "junglefights.net",
  "klassmaster.com", "klzlk.com", "koszmail.pl", "kurzepost.de",
  "lifebyfood.com", "link2mail.net", "litedrop.com", "lkgn.se",
  "lolfreak.net", "lookugly.com", "lortemail.dk",
  "lucky-email.com", "lyricspad.net", "m21.cc", "mail-filter.com",
  "mail-temporaire.fr", "mail1a.de", "mail21.cc", "mail2rss.org", "mail333.com",
  "mailbidon.com", "mailbiz.biz", "mailblocks.com", "mailbucket.org",
  "mailcat.biz", "mailcatch.com", "maileater.com",
  "maileimer.de", "mailexpire.com", "mailfa.tk", "mailforspam.com",
  "mailfreeonline.com", "mailguard.me",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  // Check parent domain (e.g. sub.mailinator.com → mailinator.com)
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS.has(parent)) return true;
  }

  return false;
}

// ─── 3. DNS MX RECORD VALIDATION ─────────────────────────────────────────────
// DNS error codes we treat as definitive proof the domain is invalid.
// These mean the domain simply does not exist in DNS — safe to reject.
const DEFINITIVE_FAIL_CODES = new Set(["ENOTFOUND", "ENODATA", "ESERVFAIL", "EREFUSED"]);

// NETWORK_FAIL_CODES — transient infrastructure issues; we fail open (allow signup).
// ETIMEOUT and our manual timeout both fall into this category.
const TRANSIENT_FAIL_CODES = new Set(["ETIMEOUT", "ECONNREFUSED", "EAI_AGAIN"]);

export type DomainValidationResult =
  | { valid: true;  mxRecords: MxRecord[] }
  | { valid: false; reason: "NO_MX_RECORDS" | "DOMAIN_NOT_FOUND" | "LOOKUP_FAILED"; error?: string };

/**
 * validateEmailDomain(domain)
 *
 * Performs a DNS MX lookup on the given domain with a 2.5-second timeout.
 *
 * Behaviour:
 *  - Domain has MX records          → valid: true
 *  - Domain exists but has no MX    → valid: false, reason: NO_MX_RECORDS   (reject)
 *  - Domain does not exist in DNS   → valid: false, reason: DOMAIN_NOT_FOUND (reject)
 *  - Transient network/timeout err  → valid: true,  reason: LOOKUP_FAILED    (fail open)
 *
 * @param domain  The email domain, e.g. "gmail.com". Must already be lowercase/trimmed.
 */
export async function validateEmailDomain(domain: string): Promise<DomainValidationResult> {
  console.log(`[dns-mx] Checking domain: "${domain}"`);

  if (!domain || !domain.includes(".")) {
    console.warn(`[dns-mx] Domain "${domain}" is malformed — rejecting`);
    return { valid: false, reason: "DOMAIN_NOT_FOUND" };
  }

  // Race the DNS lookup against a 2500ms hard timeout
  const TIMEOUT_MS = 2500;

  let records: MxRecord[];

  try {
    records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(Object.assign(new Error("DNS_TIMEOUT"), { code: "ETIMEOUT" })),
          TIMEOUT_MS
        )
      ),
    ]);
  } catch (err: any) {
    const code: string = err?.code ?? "UNKNOWN";

    if (DEFINITIVE_FAIL_CODES.has(code)) {
      // Domain confirmed non-existent or has no DNS records at all → reject
      console.warn(`[dns-mx] Domain "${domain}" rejected — DNS error code: ${code}`);
      return { valid: false, reason: "DOMAIN_NOT_FOUND", error: code };
    }

    if (TRANSIENT_FAIL_CODES.has(code) || code === "DNS_TIMEOUT") {
      // Transient network hiccup or our manual timeout → fail open
      console.warn(`[dns-mx] DNS lookup for "${domain}" timed out or had a transient error (${code}) — failing open`);
      return { valid: true, mxRecords: [] };
    }

    // Unknown error codes → log and fail open (don't block legitimate users)
    console.warn(`[dns-mx] Unknown DNS error for "${domain}" (code=${code}, message=${err?.message}) — failing open`);
    return { valid: true, mxRecords: [] };
  }

  // Lookup succeeded — check whether any MX records were returned
  if (!Array.isArray(records) || records.length === 0) {
    console.warn(`[dns-mx] Domain "${domain}" has no MX records — rejecting`);
    return { valid: false, reason: "NO_MX_RECORDS" };
  }

  // Log the records for visibility in Vercel logs
  const summary = records
    .sort((a, b) => a.priority - b.priority)
    .map((r) => `${r.exchange} (priority ${r.priority})`)
    .join(", ");
  console.log(`[dns-mx] Domain "${domain}" — ${records.length} MX record(s): ${summary}`);

  return { valid: true, mxRecords: records };
}

// ─── 4. COMBINED VALIDATOR ────────────────────────────────────────────────────
export type EmailValidationResult =
  | { valid: true;  email: string }
  | { valid: false; error: string; code: string };

export async function validateEmailFull(raw: string): Promise<EmailValidationResult> {
  const email = normalizeEmail(raw);

  // Step 1 — Format check (synchronous, cheap)
  if (!isValidEmailFormat(email)) {
    return { valid: false, error: "Enter a valid email address", code: "INVALID_FORMAT" };
  }

  // Step 2 — Disposable domain blocklist (synchronous, cheap)
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: "Temporary email addresses are not allowed. Please use a real email.",
      code: "DISPOSABLE_EMAIL",
    };
  }

  // Step 3 — DNS MX lookup (async, most expensive — done last)
  const domain = email.split("@")[1]; // already normalized via normalizeEmail()
  const domainResult = await validateEmailDomain(domain);

  if (!domainResult.valid) {
    return {
      valid: false,
      error: "Email domain is not valid",
      code: "INVALID_DOMAIN",
    };
  }

  return { valid: true, email };
}
