import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type SubmitEvent,
} from "react";
import {
  editorKinds,
  editorRequest,
  normalizeItemUrl,
  type EditorFields,
  type EditorKind,
  type OwnerSession,
  type UrlPreview,
} from "../../lib/inspo";
import type { InspoItem } from "./types";
import {
  Icon,
  control,
  dialog,
  dialogHeader,
  dialogInner,
  errorText,
  field,
  hint,
  iconButton,
  submitButton,
  textButton,
} from "./ui";

// --- Dialog ---

export default function InspoAddDialog({
  onClose,
  onAdded,
  initialError = "",
}: {
  onClose: () => void;
  onAdded: (item: InspoItem) => void;
  initialError?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    const controller = new AbortController();
    dialog?.showModal();
    editorRequest<OwnerSession>("session", { signal: controller.signal })
      .then(setSession)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Owner access couldn’t be checked.",
          );
      });
    return () => {
      controller.abort();
      dialog?.close();
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const { url } = await editorRequest<{ url: string }>("auth/login", {
        method: "POST",
      });
      window.location.assign(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await editorRequest("session", { method: "DELETE" });
      setSession((value) => value && { ...value, authenticated: false });
    } catch {
      setError("Sign-out failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${dialog} w-[min(540px,calc(100%-32px))]`}
      aria-labelledby="inspo-add-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={dialogInner}>
        <header className={`${dialogHeader} mb-6`}>
          <h2
            id="inspo-add-title"
            className="font-print text-[21px]/[1.2] font-normal tracking-[-0.02em]"
          >
            Add something
          </h2>
          <button
            className={`${iconButton} ml-auto size-[34px]`}
            aria-label="Close editor"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" />
          </button>
        </header>
        {!session && !error && <p role="status">Checking owner access…</p>}
        {session && !session.configured ? (
          <p>Owner sign-in isn’t available yet.</p>
        ) : session?.authenticated ? (
          <>
            {session.storageConfigured ? (
              <InspoItemForm onAdded={onAdded} />
            ) : (
              <p>
                You’re signed in. Adding to the collection will be available
                once publishing is set up.
              </p>
            )}
            <button
              type="button"
              className="mt-6 block text-[12px] text-inspo-muted underline underline-offset-4"
              disabled={busy}
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          session && (
            <div className="grid gap-5">
              <p>Sign in as the owner to add to the collection.</p>
              <button
                type="button"
                className={submitButton}
                disabled={busy}
                onClick={() => void signIn()}
              >
                {busy ? "Opening Authentik…" : "Continue with Authentik"}
              </button>
            </div>
          )
        )}
        {error && (
          <p className={errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}

// --- Item form ---

function InspoItemForm({ onAdded }: { onAdded: (item: InspoItem) => void }) {
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

  async function submit(event: SubmitEvent<HTMLFormElement>) {
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

// --- Screenshot field ---

interface Props {
  imageUrl: string;
  fileName: string;
  previewSrc: string;
  loading: boolean;
  onImageUrlChange(value: string): void;
  onSelect(file: File | undefined): void;
  onRemove(): void;
}

/** A website image can be picked or dropped; the parent owns its file data. */
function InspoScreenshotField({
  imageUrl,
  fileName,
  previewSrc,
  loading,
  onImageUrlChange,
  onSelect,
  onRemove,
}: Props) {
  const [dragging, setDragging] = useState(false);

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    onSelect(event.dataTransfer.files[0]);
  }

  return (
    <div className={field}>
      <span>Screenshot (optional)</span>
      <label
        className="relative grid min-h-[120px] cursor-pointer place-items-center border border-dashed border-inspo-line bg-inspo-bg p-4 text-center focus-within:border-inspo-ink hover:border-inspo-ink data-dragging:border-inspo-ink"
        data-dragging={dragging || undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <input
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Choose website screenshot"
          onChange={(event) => {
            onSelect(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        {previewSrc ? (
          <img
            className="block max-h-[220px] max-w-full object-contain"
            src={previewSrc}
            alt="Selected website screenshot"
          />
        ) : (
          <span>
            {loading ? "Reading image…" : "Drop an image here or choose a file"}
          </span>
        )}
      </label>
      <small className={hint}>Upload a JPEG, PNG, or WebP · Up to 3 MB</small>
      <label className={field}>
        Or image URL
        <input
          className={control}
          name="imageUrl"
          inputMode="url"
          placeholder="https://…/screenshot.png"
          maxLength={2048}
          value={imageUrl}
          onChange={(event) => onImageUrlChange(event.target.value)}
        />
        <small className={hint}>
          Direct JPEG, PNG, or WebP URL · Up to 4 MB
        </small>
      </label>
      {fileName && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate">{fileName}</span>
          <button type="button" className={textButton} onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// --- URL preview ---

/** Debounce edits and discard responses for URLs the owner has moved past. */
function useUrlPreview(url: string, enabled: boolean) {
  const [preview, setPreview] = useState<UrlPreview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPreview(null);
    setError("");
    setLoading(false);
    if (!enabled || !url.trim()) return;
    try {
      normalizeItemUrl(url);
    } catch {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      editorRequest<UrlPreview>("preview", {
        method: "POST",
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })
        .then((result) => {
          if (!controller.signal.aborted) setPreview(result);
        })
        .catch((reason: unknown) => {
          if (!controller.signal.aborted)
            setError(
              reason instanceof Error
                ? reason.message
                : "The preview couldn’t be fetched.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [url, enabled, attempt]);

  // A render can precede the effect that clears the previous URL's response.
  let current = false;
  try {
    current = !!preview && preview.draft.url === normalizeItemUrl(url).href;
  } catch {}
  return {
    preview: current ? preview : null,
    error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  };
}
