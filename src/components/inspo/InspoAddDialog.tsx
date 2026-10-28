import { useEffect, useRef, useState } from "react";
import { editorRequest, type OwnerSession } from "../../lib/inspoEditor";
import Icon from "./Icon";
import InspoItemForm from "./InspoItemForm";
import type { InspoItem } from "./types";
import {
  dialog,
  dialogHeader,
  dialogInner,
  errorText,
  iconButton,
  submitButton,
} from "./styles";

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
