
// Demo-grade spam check: no ML, no external service.
const BLOCKLIST: string[] = ["viagra", "casino", "crypto giveaway"];
const BLOCKLIST_RE = new RegExp(`\\b(${BLOCKLIST.join("|")})\\b`, "i");
const URL_RE = /https?:\/\/|www\./gi;
const MAX_URLS = 2;

export type Verdict =
     | { spam: false }
     | { spam: true, reason: string };

const moderationService = {

     check: function(title: string, body: string): Verdict {
          const text = `${title}\n${body}`.trim();

          if ((text.match(URL_RE) ?? []).length > MAX_URLS)
               return { spam: true, reason: "too many links" };

          if (BLOCKLIST_RE.test(text))
               return { spam: true, reason: "blocklisted word" };

          return { spam: false };
     }

}

export default moderationService;
