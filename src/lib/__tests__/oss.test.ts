import { describe, expect, it } from "vitest";

import { rewriteOssUrl } from "@/lib/oss";

const BUCKET = "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com";
const ALIAS = "https://oss.hkbiaoge.com";

describe("rewriteOssUrl", () => {
  it("swaps the bucket host for the custom domain, keeping the object key", () => {
    expect(rewriteOssUrl(`${BUCKET}/assets/202404305.jpeg`)).toBe(
      `${ALIAS}/assets/202404305.jpeg`,
    );
  });

  // An OSS url can be signed; dropping the query would turn every private object into a 403.
  it("preserves the query string and the fragment", () => {
    expect(
      rewriteOssUrl(`${BUCKET}/assets/a.pdf?Expires=1&Signature=x%2By#page=2`),
    ).toBe(`${ALIAS}/assets/a.pdf?Expires=1&Signature=x%2By#page=2`);
  });

  it("upgrades http to https — the alias is TLS-only, as WeChat requires", () => {
    expect(
      rewriteOssUrl("http://chartermax-dev.oss-cn-hongkong.aliyuncs.com/a.pdf"),
    ).toBe(`${ALIAS}/a.pdf`);
  });

  it("matches the host case-insensitively", () => {
    expect(
      rewriteOssUrl(
        "https://Chartermax-Dev.OSS-CN-Hongkong.aliyuncs.com/a.pdf",
      ),
    ).toBe(`${ALIAS}/a.pdf`);
  });

  // The alias points at one bucket. Rewriting a host it was never aliased to would serve
  // another environment's documents.
  it("leaves another bucket on the same OSS region untouched", () => {
    const other = "https://chartermax-prod.oss-cn-hongkong.aliyuncs.com/a.pdf";
    expect(rewriteOssUrl(other)).toBe(other);
  });

  it("leaves unrelated hosts untouched", () => {
    const other = "https://cdn.example.com/a.pdf";
    expect(rewriteOssUrl(other)).toBe(other);
  });

  it.each(["", "assets/a.pdf", "not a url"])(
    "returns %j unchanged — nothing to rewrite against",
    (raw) => {
      expect(rewriteOssUrl(raw)).toBe(raw);
    },
  );

  // A rewritten url must not be able to smuggle in a different host.
  it("does not match a lookalike host that only contains the bucket host", () => {
    const spoof =
      "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com.evil.test/a.pdf";
    expect(rewriteOssUrl(spoof)).toBe(spoof);
  });
});
