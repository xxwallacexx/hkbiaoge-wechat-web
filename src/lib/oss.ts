/**
 * Alibaba OSS asset urls.
 *
 * The API stores every brochure / promotion PDF (and every image) as an absolute url on the
 * bucket's own host — `https://<bucket>.oss-cn-hongkong.aliyuncs.com/assets/…`. That host is
 * shared by every Alibaba customer, so it can never be verified as a WeChat 业务域名, and a
 * Mini Program `<web-view>` refuses to navigate to a domain that is not on that allowlist.
 *
 * `oss.hkbiaoge.com` is a custom domain CNAME'd onto the same bucket: the same objects under
 * the same keys, on a host we own and can therefore verify. Swapping the host here — at the
 * point of use — means none of the stored `path` values have to be migrated.
 */

/**
 * Bucket host → the custom domain aliased onto it, matched on the exact host.
 *
 * Deliberately NOT a wildcard over `*.oss-cn-hongkong.aliyuncs.com`: an alias resolves to one
 * specific bucket, so mapping every bucket through it would quietly serve one environment's
 * documents from another's. Add a row when a second bucket gets its own alias.
 */
export const OSS_HOST_ALIASES: Readonly<Record<string, string>> = {
  "chartermax-dev.oss-cn-hongkong.aliyuncs.com": "oss.hkbiaoge.com",
};

/**
 * Rewrite an OSS url onto its custom domain, preserving the path, the query (an OSS signature
 * survives intact) and the fragment. Anything else — another host, a relative path, a
 * malformed string — is returned untouched.
 */
export function rewriteOssUrl(raw: string): string {
  if (!raw) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw; // relative or malformed: no host to rewrite
  }

  const alias = OSS_HOST_ALIASES[url.hostname.toLowerCase()];
  if (!alias) return raw;

  // `host` rather than `hostname`, so an explicit port is dropped with it; and force https —
  // the alias is only served over TLS, which is what WeChat requires anyway.
  url.host = alias;
  url.protocol = "https:";
  return url.toString();
}
