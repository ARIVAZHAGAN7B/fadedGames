import { Copy, DoorOpen, Home, RotateCcw } from "lucide-react";
import { buildRoomLink } from "../../utils/roomLink.js";

export function GamePage({
  children,
  className = "",
  contentClassName = "",
  overflowHidden = false
}) {
  return (
    <main
      className={`min-h-screen bg-paper px-4 py-4 sm:px-6 ${
        overflowHidden ? "overflow-hidden" : ""
      } ${className}`.trim()}
    >
      <div className={`mx-auto flex w-full max-w-7xl flex-col gap-3 ${contentClassName}`.trim()}>
        {children}
      </div>
    </main>
  );
}

export function StatusMessage({ status, className = "" }) {
  if (!status) {
    return null;
  }

  return <p className={`text-xs font-bold text-coral ${className}`.trim()}>{status}</p>;
}

export function IconBadge({ label }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-extrabold text-white">
      {label}
    </div>
  );
}

export function CopyRoomButton({ room, onStatus, showCode = true, className = "" }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoomLink(room.roomCode, room.gameType));
      onStatus?.("Link copied");
    } catch {
      onStatus?.("Copy failed");
    }
  };

  return (
    <button
      type="button"
      className={`compact-button border border-ink/15 bg-paper font-extrabold ${className}`.trim()}
      onClick={handleCopy}
      title="Copy room link"
      aria-label="Copy room link"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
      {showCode ? room.roomCode : null}
    </button>
  );
}

export function LeaveRoomButton({ onLeaveRoom, label = "Leave", className = "" }) {
  return (
    <button
      type="button"
      className={`compact-button border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral ${className}`.trim()}
      onClick={onLeaveRoom}
      title="Leave room"
      aria-label="Leave room"
    >
      <DoorOpen className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function RestartButton({
  onRestart,
  disabled = false,
  label = "Restart",
  className = ""
}) {
  return (
    <button
      type="button"
      className={`compact-button bg-coral text-white hover:bg-coral/90 disabled:bg-ink/20 ${className}`.trim()}
      onClick={onRestart}
      disabled={disabled}
      title={label}
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function RoomHeader({
  room,
  eyebrow,
  title = room?.roomName,
  codeLabel,
  actions,
  onLeaveRoom,
  onStatus,
  showCopy = true,
  showLeave = true,
  className = ""
}) {
  return (
    <header className={`surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <div className="flex min-w-0 items-center gap-3">
        {codeLabel ? <IconBadge label={codeLabel} /> : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-extrabold uppercase text-mint">{eyebrow}</p> : null}
          <h1 className="truncate text-2xl font-extrabold text-ink">{title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {showCopy ? <CopyRoomButton room={room} onStatus={onStatus} /> : null}
        {showLeave ? <LeaveRoomButton onLeaveRoom={onLeaveRoom} /> : null}
      </div>
    </header>
  );
}

export function ResultActions({
  onLeaveRoom,
  onRestart,
  restartDisabled = false,
  restartLabel = "Restart",
  homeLabel = "Home",
  layoutClassName = "mt-4 flex flex-col gap-2 sm:flex-row"
}) {
  return (
    <div className={layoutClassName}>
      <button
        type="button"
        className="compact-button flex-1 border border-ink/15 bg-white text-ink hover:border-coral hover:text-coral"
        onClick={onLeaveRoom}
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        {homeLabel}
      </button>
      <RestartButton
        onRestart={onRestart}
        disabled={restartDisabled}
        label={restartLabel}
        className="flex-1"
      />
    </div>
  );
}
