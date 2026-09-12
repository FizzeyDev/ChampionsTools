"use client";

import { useEffect, useState } from "react";
import { getNotes, saveNotes } from "@/lib/features/notes";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** Always-visible free-text scratchpad, embedded inline (e.g. below the
 * Field panel) rather than a floating toggle — saves to the browser as you
 * type. */
export default function NotesPanel() {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setText(getNotes());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => {
      saveNotes(text);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 900);
    }, 400);
    return () => window.clearTimeout(id);
  }, [text, loaded]);

  return (
    <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="eyebrow" style={{ color: "var(--color-amber)" }}>
          📝 {t("notes.title")}
        </p>
        <span className="text-[10px]" style={{ color: "var(--color-ink-dim)", opacity: savedFlash ? 1 : 0 }}>
          {t("notes.saved")}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("notes.placeholder")}
        rows={6}
        className="field-input w-full resize-y p-2 text-sm"
      />
    </div>
  );
}