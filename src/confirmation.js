// Reusable, offline-only in-game confirmation. No native window.confirm popup.
// All text is assigned as plain text to avoid HTML injection.
export function createConfirmationController({
  modal, title, message, acceptButton, cancelButton, documentRef,
  onVisibilityChange = () => {},
}) {
  let pending = null;
  let restoreFocus = null;
  modal.hidden = true;

  function isOpen() {
    return !modal.hidden;
  }

  function close() {
    if (!isOpen()) return false;
    modal.hidden = true;
    pending = null;
    onVisibilityChange(false);
    restoreFocus?.focus?.();
    restoreFocus = null;
    return true;
  }

  function open({ heading, detail, confirmLabel = 'Confirm', cancelLabel = 'Keep Playing', onConfirm, focusReturn = null }) {
    if (isOpen()) return false;
    if (typeof onConfirm !== 'function') throw new Error('Missing confirmation action');
    title.textContent = String(heading);
    message.textContent = String(detail);
    acceptButton.textContent = String(confirmLabel);
    cancelButton.textContent = String(cancelLabel);
    pending = onConfirm;
    restoreFocus = focusReturn ?? documentRef.activeElement ?? null;
    modal.hidden = false;
    onVisibilityChange(true);
    cancelButton.focus?.();
    return true;
  }

  cancelButton.onclick = () => close();
  acceptButton.onclick = () => {
    if (!isOpen() || typeof pending !== 'function') return;
    const action = pending;
    // Close (and restore gameplay) *before* the action. The action can itself
    // restart a game, navigate or display an error without a stale dialog.
    close();
    action();
  };

  documentRef.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault?.();
      close();
    } else if (event.key === 'Tab') {
      // Only the two action buttons can be tabbed while an alertdialog is open.
      const current = documentRef.activeElement;
      if (event.shiftKey && current === cancelButton) {
        event.preventDefault?.();
        acceptButton.focus?.();
      } else if (!event.shiftKey && current === acceptButton) {
        event.preventDefault?.();
        cancelButton.focus?.();
      } else if (current !== cancelButton && current !== acceptButton) {
        event.preventDefault?.();
        cancelButton.focus?.();
      }
    }
  });

  return { open, close, isOpen };
}
