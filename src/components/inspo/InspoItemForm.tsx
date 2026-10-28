import { useRef, useState, type FormEvent } from "react";
import {
  editorKinds,
  editorRequest,
  type EditorFields,
  type EditorKind,
} from "../../lib/inspoEditor";
import type { InspoItem } from "./types";
import InspoScreenshotField from "./InspoScreenshotField";
import { useUrlPreview } from "./useUrlPreview";
import {
  control,
  errorText,
  field,
  hint,
  submitButton,
  textButton,
} from "./styles";

export default function InspoItemForm({
  onAdded,
}: {
  onAdded: (item: InspoItem) => void;
}) {
  const [kind, setKind] = useState<EditorKind>("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [fileData, setFileData] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const fileVersion = useRef(0);
  const {
    preview,
    loading,
    error: previewError,
    retry,
  } = useUrlPreview(url, kind === "url");
  const hasFile = kind === "image" || kind === "design" || kind === "font";
  const hasUrl = ["url", "tweet", "image", "design", "embed"].includes(kind);
  const hasTitle = kind === "url" || kind === "image" || kind === "design";

  function clearFile() {
    fileVersion.current++;
    setFileData(undefined);
    setFileName("");
    setFilePreview("");
    setFileLoading(false);
  }

  function changeKind(next: EditorKind) {
    clearFile();
    setImageUrl("");
    setKind(next);
    setUrl("");
    setTitle(null);
    setError("");
  }

  async function selectFile(file: File | undefined) {
    const version = ++fileVersion.current;
    setFileLoading(false);
    setFileData(undefined);
    setFileName("");
    setFilePreview("");
    setError("");
    if (!file) return;
    if (
      kind !== "font" &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 3_000_000) {
      setError("Choose a file smaller than 3 MB.");
      return;
    }
    setFileLoading(true);
    try {
      const value = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("This file couldn’t be read."));
        reader.readAsDataURL(file);
      });
      if (version === fileVersion.current) {
        setFileData(value.split(",")[1] ?? "");
        setFileName(file.name);
        setFilePreview(kind === "url" ? value : "");
        if (kind === "url") setImageUrl("");
        if (kind !== "url") setUrl("");
      }
    } catch {
      if (version === fileVersion.current)
        setError("This file couldn’t be read.");
    } finally {
      if (version === fileVersion.current) setFileLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "");
    const fields: EditorFields = (() => {
      switch (kind) {
        case "url":
          return {
            kind,
            url,
            title: title ?? preview?.draft.title ?? "",
            ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
            ...(fileData ? { fileData } : {}),
          };
        case "text":
          return { kind, text: field("text") };
        case "quote":
          return { kind, text: field("text"), author: field("author") };
        case "email":
          return { kind, text: field("text"), from: field("from") };
        case "tweet":
        case "embed":
          return { kind, url };
        case "image":
        case "design":
          return {
            kind,
            title: title ?? "",
            url,
            ...(fileData ? { fileData } : {}),
          };
        case "font":
          return { kind, fileData: fileData ?? "" };
      }
    })();
    setSaving(true);
    setError("");
    try {
      const { item } = await editorRequest<{ item: InspoItem }>("items", {
        method: "POST",
        body: JSON.stringify({
          requestId: requestId.current,
          fields,
          ...(kind === "url" && preview ? { preview } : {}),
        }),
      });
      onAdded(item);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "This item couldn’t be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <fieldset className="grid min-w-0 gap-5" disabled={saving}>
        <label className={field}>
          Format
          <select
            className={control}
            aria-label="Format"
            value={kind}
            onChange={(event) => changeKind(event.target.value as EditorKind)}
          >
            {Object.entries(editorKinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {hasUrl && (
          <label className={field}>
            {kind === "embed"
              ? "Embed URL"
              : kind === "tweet"
                ? "Tweet URL"
                : hasFile
                  ? "File URL"
                  : "URL"}
            <input
              className={control}
              name="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://…"
              maxLength={2048}
              value={url}
              required={kind === "url" || kind === "embed" || kind === "tweet"}
              disabled={!!fileData && hasFile}
              onChange={(event) => {
                setUrl(event.target.value);
                setTitle(null);
              }}
            />
          </label>
        )}
        {hasFile && (
          <label className={field}>
            {kind === "font" ? "Font file" : "Or upload an image"}
            <input
              className={control}
              key={kind}
              type="file"
              accept={
                kind === "font"
                  ? ".woff,.woff2,.ttf,.otf"
                  : ".png,.jpg,.jpeg,.webp"
              }
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
            <small className={hint}>
              {fileName ||
                (kind === "font"
                  ? "WOFF, WOFF2, TTF, or OTF · Up to 3 MB"
                  : "JPEG, PNG, or WebP · Up to 3 MB")}
            </small>
            {fileData && kind !== "font" && (
              <button type="button" className={textButton} onClick={clearFile}>
                Use a URL instead
              </button>
            )}
          </label>
        )}
        {kind === "url" && (
          <div
            className="grid gap-2.5 text-[12px] text-inspo-muted empty:hidden [&>button]:justify-self-start"
            aria-live="polite"
            aria-busy={loading}
          >
            {loading && <p>Fetching title…</p>}
            {previewError && <p className={errorText}>{previewError}</p>}
            {preview && (
              <>
                {preview.draft.image && (
                  <img
                    className="block w-full"
                    src={preview.draft.image.src}
                    alt="Preview of the new item"
                  />
                )}
                {preview.warning && <p>{preview.warning}</p>}
              </>
            )}
            {(preview || previewError) && (
              <button type="button" className={textButton} onClick={retry}>
                Refresh title
              </button>
            )}
          </div>
        )}
        {hasTitle && (
          <label className={field}>
            Title
            <input
              className={control}
              name="title"
              maxLength={180}
              value={title ?? preview?.draft.title ?? ""}
              onChange={(event) => setTitle(event.target.value)}
              required={kind === "image" || kind === "design"}
            />
          </label>
        )}
        {kind === "url" && (
          <InspoScreenshotField
            imageUrl={imageUrl}
            fileName={fileName}
            previewSrc={filePreview}
            loading={fileLoading}
            onImageUrlChange={(value) => {
              if (value && (fileData || fileLoading)) clearFile();
              setImageUrl(value);
            }}
            onSelect={(file) => void selectFile(file)}
            onRemove={clearFile}
          />
        )}
        {(kind === "text" || kind === "quote" || kind === "email") && (
          <label className={field}>
            {kind === "quote"
              ? "Quote"
              : kind === "email"
                ? "Email text"
                : "Text"}
            <textarea
              className={`${control} resize-y`}
              name="text"
              rows={5}
              maxLength={20000}
              required
            />
          </label>
        )}
        {kind === "quote" && (
          <label className={field}>
            Author
            <input className={control} name="author" maxLength={180} required />
          </label>
        )}
        {kind === "email" && (
          <label className={field}>
            From address
            <input
              className={control}
              name="from"
              type="email"
              maxLength={254}
              required
            />
          </label>
        )}
      </fieldset>
      {error && (
        <p className={errorText} role="alert">
          {error}
        </p>
      )}
      <button
        className={submitButton}
        disabled={
          saving ||
          fileLoading ||
          (kind === "url" && (!preview || loading)) ||
          (kind === "font" && !fileData)
        }
      >
        {saving ? "Adding…" : "Add to collection"}
      </button>
    </form>
  );
}
