import { useState, type DragEvent } from "react";
import { control, field, hint, textButton } from "./styles";

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
export default function InspoScreenshotField({
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
