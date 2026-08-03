# Mini Program PDF page — implementation spec

This site lists PDFs (產品單頁 / 優惠推廣). A `<web-view>` **cannot open a document
itself** — `wx.openDocument` is a native-only API — so when the user taps a row we hand
the PDF's url to a native Mini Program page, which downloads and opens it.

**This page does not exist yet. The client's Mini Program developer implements it from
this document.** Everything on the H5 side is already shipped.

---

## 1. The contract

When a user taps a PDF row inside the Mini Program, the site calls:

```js
wx.miniProgram.navigateTo({
  url: "/pages/pdf/index?url=<ENCODED_PDF_URL>&name=<ENCODED_DISPLAY_NAME>",
});
```

|                |                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Page route** | `/pages/pdf/index`                                                                                         |
| **`url`**      | Absolute `https://` link to the PDF, on the Alibaba OSS bucket                                             |
| **`name`**     | Human title of the document, e.g. `2026年首季保費折扣優惠`. Used only for the filename shown in the viewer |
| **Encoding**   | Each value is `encodeURIComponent`-encoded **exactly once**. A space is `%20`, never `+`                   |
| **Navigation** | Always `navigateTo` (see §4)                                                                               |

A real example of what arrives:

```
/pages/pdf/index?url=https%3A%2F%2Fexample.oss-cn-hongkong.aliyuncs.com%2Fpromotions%2F2026%20Q1.pdf&name=AIA%20%E9%A6%96%E5%AD%A3%E5%84%AA%E6%83%A0
```

The source of truth on our side is `src/lib/pdf-viewer.ts` (`pdfViewerUrl`).

---

## 2. Console configuration (do this first)

The OSS host must be on the Mini Program's **downloadFile 合法域名** allowlist, or
`wx.downloadFile` fails before it starts:

> 微信公众平台 → 开发管理 → 开发设置 → 服务器域名 → **downloadFile 合法域名**

Add the bucket host, e.g. `https://<bucket>.oss-cn-hongkong.aliyuncs.com`.

- `https` only, no IP addresses and no ports.
- The domain must be ICP 备案-filed.
- The list is capped (currently 20 entries per category) and changes are rate-limited
  per month — plan the entry rather than iterating on it.

While developing you can tick **不校验合法域名** in the WeChat DevTools' local settings,
but it must work with the allowlist before release.

---

## 3. The page

### `pages/pdf/index.js`

```js
Page({
  data: { name: "", failed: false },

  onLoad(options) {
    // TEMPORARY, but read §4 first — log this raw, before decoding, and check it
    // against what the site sent. It settles how many times to decode.
    console.log("[pdf] raw options:", options);

    const url = decodeMaybe(options.url);
    const name = decodeMaybe(options.name) || "document";

    this.setData({ name });
    wx.setNavigationBarTitle({ title: name });

    if (!url) {
      this.fail("連結無效");
      return;
    }
    this.open(url, name);
  },

  open(url, name) {
    this.setData({ failed: false });
    wx.showLoading({ title: "下載中", mask: true });

    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode !== 200) {
          wx.hideLoading();
          this.fail("下載失敗");
          return;
        }
        // Save under the real name so the viewer's title bar and the "..." → forward
        // sheet show a meaningful filename instead of a temp hash. This is the only
        // reason `name` is passed at all.
        const filePath = `${wx.env.USER_DATA_PATH}/${safeFileName(name)}.pdf`;
        wx.getFileSystemManager().saveFile({
          tempFilePath: res.tempFilePath,
          filePath,
          success: (saved) => this.present(saved.savedFilePath),
          // Saving is a nicety — if it fails (e.g. storage full) still open the temp file.
          fail: () => this.present(res.tempFilePath),
        });
      },
      fail: () => {
        wx.hideLoading();
        this.fail("下載失敗");
      },
    });
  },

  present(filePath) {
    wx.openDocument({
      filePath,
      fileType: "pdf",
      showMenu: true, // enables the "..." menu: forward / save to phone
      success: () => wx.hideLoading(),
      fail: () => {
        wx.hideLoading();
        this.fail("無法開啟文件");
      },
    });
  },

  fail(message) {
    this.setData({ failed: true });
    wx.showToast({ title: message, icon: "none" });
  },

  onRetry() {
    // Re-read the url from the launch options rather than caching it in data.
    const { url } = this.options || {};
    if (url) this.open(decodeMaybe(url), this.data.name);
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});

/**
 * Decode only if the value still looks encoded. The framework normally decodes query
 * values for you; decoding an already-decoded url that legitimately contains a `%`
 * would corrupt it. See §4.
 */
function decodeMaybe(value) {
  if (!value) return "";
  if (!/%[0-9a-fA-F]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

/** Strip characters that are illegal in a filename. */
function safeFileName(name) {
  return (
    String(name)
      .replace(/[\\/:*?"<>|]/g, "_")
      .slice(0, 80) || "document"
  );
}
```

### `pages/pdf/index.wxml`

```xml
<view class="wrap">
  <view class="title">{{name}}</view>
  <block wx:if="{{failed}}">
    <button class="btn" bindtap="onRetry">重試</button>
    <button class="btn" bindtap="onBack">返回</button>
  </block>
</view>
```

`wx.openDocument` takes over the screen, so this page is only visible while
downloading and if something fails. Style it however matches the Mini Program.

---

## 4. Pitfalls

### 4.1 How many times to decode

The Mini Program framework decodes query values once when it builds `options`. Some
web-view → Mini Program hand-offs are reported to decode a second time. **Do not guess
— measure once:**

1. Pick a PDF whose url contains `%`, `+` and CJK characters.
2. Log `options.url` raw in `onLoad` and compare it to what the site sent (see §1).

| What you logged                         | What to do                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Fully decoded (`https://…/2026 Q1.pdf`) | Use it as-is. `decodeMaybe` above already handles this                          |
| Still encoded (`https%3A%2F%2F…`)       | One `decodeURIComponent`. `decodeMaybe` handles this too                        |
| Mangled / truncated at a `&`            | **Tell us** — the fix is on our side (encode twice), one line in `pdfViewerUrl` |

The `decodeMaybe` helper covers the first two cases without a code change either way.

### 4.2 Navigation — this one breaks login

Reach this page with **`navigateTo`** and leave it with **`navigateBack`**.

The site authenticates from a **single-use `?code=`** in the web-view URL, traded once
for a token. `navigateTo` pushes on top of the web-view page and keeps it alive, so
going back returns to a still-logged-in session. `redirectTo` or `reLaunch` would
destroy and reload the web-view, the code would already be spent, and **the user would
come back logged out.**

### 4.3 File types and size

`wx.openDocument` handles `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx` only — we
only ever send PDFs. Check the current documented `wx.downloadFile` size limit against
your largest illustration before assuming big files work; add
`onProgressUpdate` if downloads are slow enough to need a progress bar.

### 4.4 Files saved with `saveFile` persist

`wx.env.USER_DATA_PATH` counts against the Mini Program's local storage quota. If a
user opens many documents, periodically clear old ones with
`wx.getFileSystemManager().getSavedFileList()` + `removeSavedFile`.

---

## 5. Not solvable this way: third-party websites

The 保險公司 screen links to insurers' own websites and fulfilment-ratio pages. A native
page **cannot** open those either: a `<web-view>` only loads domains verified on the
Mini Program's 业务域名 allowlist, and the client cannot verify a domain it does not own.

So inside the Mini Program the site copies the link to the clipboard and tells the user
to paste it into a browser (`src/lib/external-link.ts`). No Mini Program work is needed
or possible for that.

---

## 6. Checklist

- [ ] OSS host added to **downloadFile 合法域名**
- [ ] `pages/pdf/index` created and registered in `app.json`
- [ ] Raw `options.url` logged once and compared against §1, then the temporary log removed
- [ ] Verified with a PDF whose filename contains a space
- [ ] Back from the document returns to a still-logged-in web-view
- [ ] Route confirmed to us — if it is **not** `/pages/pdf/index`, we change one constant
      (`PDF_VIEWER_PAGE` in `src/lib/pdf-viewer.ts`)
