import Dialog from "./Dialog";
import Button from "./Button";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Ya, lanjutkan", cancelLabel = "Batal", tone = "danger", busy = false, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} dismissible={!busy} title={title} width={440}>
      <p className="muted">{message}</p>
      <div className="dialog__actions">
        <Button onClick={onCancel} disabled={busy} data-autofocus>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
