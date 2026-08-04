# Mini Program PDF hand-off — implementation spec

This site lists PDFs (產品單頁 / 優惠推廣). Tapping a row opens the document.

Both the site and the documents now live on domains we control, so the `<web-view>` opens
the PDF **itself** — there is no native viewer page to build. The Mini Program's only job is
to whitelist one more domain and, optionally, listen for the message the site posts.

> **Superseded:** an earlier revision of this spec asked for a native `/pages/pdf/index`
> page driven by `wx.navigateTo`. That page is no longer needed. If it was never built,
> skip it; if it was, §5 keeps it useful as a fallback.

---

## 1. The flow

```
user taps a PDF row
        │
        ├─ url is rewritten onto the custom OSS domain      (src/lib/oss.ts)
        │     https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/assets/x.pdf
        │  →  https://oss.hkbiaoge.com/assets/x.pdf
        │
        ├─ inside a Mini Program: wx.miniProgram.postMessage({ data: {...} })
        │
        └─ the web-view navigates to that url
```

Both halves live in `src/lib/pdf-viewer.ts` (`openPdf`).

### Why the domain changes

`chartermax-dev.oss-cn-hongkong.aliyuncs.com` is a host shared with every other Alibaba
customer, so it can never be verified as a **业务域名** and a `<web-view>` will refuse to
navigate to it. `oss.hkbiaoge.com` is a CNAME onto the same bucket — same objects, same
keys — on a host we own and can verify.

Nothing is migrated: the API keeps returning bucket urls, and the site swaps the host at
the point of use. A url on any other host is passed through untouched.

### The message

```js
wx.miniProgram.postMessage({
  data: {
    type: "openPdf",
    url: "https://oss.hkbiaoge.com/assets/x.pdf",
    name: "2026年首季保費折扣優惠",
  },
});
```

| Field  |                                                                          |
| ------ | ------------------------------------------------------------------------ |
| `type` | Always `"openPdf"`. A discriminator — see §3, messages arrive in a batch |
| `url`  | Absolute `https://` url of the PDF, already on `oss.hkbiaoge.com`        |
| `name` | Human title of the document, e.g. `2026年首季保費折扣優惠`               |

Source of truth on our side: `pdfMessage()` in `src/lib/pdf-viewer.ts`.

---

## 2. Console configuration (do this first)

> 微信公众平台 → 开发管理 → 开发设置 → 业务域名

Add **`oss.hkbiaoge.com`** alongside the site's own domain. Without it the web-view refuses
the navigation and the user sees a blank page — this is the one step that must happen.

WeChat will hand you a verification file (`XXXXXXXX.txt`). Upload it to the **root of the
OSS bucket** as a public-read object so `https://oss.hkbiaoge.com/XXXXXXXX.txt` returns it
as `text/plain`; then press verify.

Two constraints that bite late:

- **ICP 备案.** 业务域名 requires the domain to be filed. `hkbiaoge.com` needs its own
  filing, exactly like the site domain does.
- **20 entries, rate-limited per month.** Plan the entry rather than iterating on it.

While developing you can tick **不校验合法域名、web-view（业务域名）…** in the WeChat
DevTools' local settings, but it must work against the real allowlist before release.

Only add the OSS host to **downloadFile 合法域名** if you implement the §5 fallback.

---

## 3. Receiving the message (optional)

The site posts the url + name of every document the user opens. You do not need to act on
it for the PDF to display — take it if you want the Mini Program to know what was viewed
(analytics, a "recently opened" list, or the §5 fallback).

```xml
<web-view src="{{webviewUrl}}" bindmessage="onWebViewMessage" />
```

```js
onWebViewMessage(e) {
  // e.detail.data is an ARRAY of every message posted since the last delivery.
  const messages = (e.detail && e.detail.data) || [];
  const opened = messages.filter((m) => m && m.type === "openPdf");
  if (!opened.length) return;

  const last = opened[opened.length - 1];
  console.log("[pdf] opened:", last.name, last.url);
}
```

**Delivery is not real time.** WeChat buffers `postMessage` and delivers the whole batch
only when the web-view component is destroyed, when the user goes back, or on share. Do not
build anything that has to react at the moment of the tap.

---

## 4. Pitfalls

### 4.1 The web-view navigates away from the site

Opening the PDF replaces the page inside the same web-view. Coming back is the web-view's
own history (a swipe back on iOS, the hardware/nav back on Android), which returns to the
list.

The session survives that round trip: the token is kept in a first-party cookie with a
7-day lifetime (`src/lib/auth.ts`), so returning to the site does **not** need a fresh
`?code=`. If WeChat clears the web-view's cookies between sessions, the user re-opens the
web-view from the Mini Program and gets a new code as usual.

Keep reaching the web-view page itself with `navigateTo`, never `redirectTo`/`reLaunch`
(that would destroy the web-view and spend the single-use code).

### 4.2 How WeChat renders the PDF

iOS WeChat displays a PDF in the web-view. Android WeChat (X5) generally shows its own
document viewer, and on some builds offers "open with another app" instead of rendering
inline. Both are acceptable outcomes — but **test both** before release, this is the one
behaviour we cannot control from the H5 side. If Android turns out unusable for your
users, §5 is the escape hatch.

### 4.3 Content-Disposition on the bucket

If an object is stored with `Content-Disposition: attachment`, the web-view downloads
instead of displaying. PDFs should be served as `Content-Type: application/pdf` with no
attachment disposition.

---

## 5. Fallback: a native viewer page

Only needed if §4.2 turns out badly on Android. Keep the `<web-view>` on the list and, in
`onWebViewMessage`, open the document natively instead:

```js
wx.downloadFile({
  url, // from the message
  success: (res) =>
    wx.openDocument({
      filePath: res.tempFilePath,
      fileType: "pdf",
      showMenu: true,
    }),
});
```

This needs `https://oss.hkbiaoge.com` on **downloadFile 合法域名**. Note the timing rule in
§3 — the message arrives on back/destroy, so a native viewer driven this way opens _after_
the user leaves the web-view. If it comes to this, tell us: we would switch the H5 side
back to `wx.miniProgram.navigateTo` into a page you own, which is immediate.

---

## 6. Not solvable this way: third-party websites

The 保險公司 screen links to insurers' own websites and fulfilment-ratio pages. A web-view
only loads domains on the 业务域名 allowlist, and the client cannot verify a domain it does
not own. So inside the Mini Program the site copies the link to the clipboard and tells the
user to paste it into a browser (`src/lib/external-link.ts`). No Mini Program work is
needed or possible for that.

---

## 7. Checklist

- [ ] `oss.hkbiaoge.com` ICP 备案 filed
- [ ] WeChat verification `.txt` uploaded to the bucket root, public-read, served as `text/plain`
- [ ] `oss.hkbiaoge.com` added to **业务域名** and verified
- [ ] Tapping a brochure and a promotion opens the document on **iOS** WeChat
- [ ] …and on a low-end **Android** (X5) WeChat — see §4.2
- [ ] Back from the document returns to the list, still signed in
- [ ] Verified with a PDF whose filename contains a space and CJK characters
- [ ] (Optional) `bindmessage` handler wired and logging `{ type: "openPdf" }`
