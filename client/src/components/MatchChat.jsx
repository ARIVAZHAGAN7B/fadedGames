import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const CHAT_MAX_LENGTH = 280;

function formatChatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function MatchChat({
  connected,
  messages,
  open,
  room,
  session,
  unreadCount,
  onOpenChange,
  onSendMessage
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const trimmedDraft = draft.trim();
  const roomLabel = useMemo(() => room?.roomName || room?.roomCode || "Match", [room]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages.length, open]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!trimmedDraft || sending || !connected) {
      return;
    }

    setSending(true);
    setError("");

    const response = await onSendMessage(trimmedDraft);

    if (response?.ok) {
      setDraft("");
    } else {
      setError(response?.error || "Message failed.");
    }

    setSending(false);
  }

  if (!room || !session?.playerId) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-[calc(100vw-1.5rem)] max-w-sm sm:bottom-5 sm:right-5 sm:w-96">
      {open ? (
        <section className="surface flex h-[min(72vh,32rem)] flex-col overflow-hidden border-ink/15 shadow-[0_18px_48px_rgba(23,33,43,0.18)]">
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase text-ink/45">Match chat</p>
              <h2 className="truncate text-base font-extrabold text-ink">{roomLabel}</h2>
            </div>
            <button
              type="button"
              className="compact-button shrink-0 border border-ink/10 bg-paper px-2 text-ink hover:border-coral hover:text-coral"
              aria-label="Close chat"
              title="Close chat"
              onClick={() => onOpenChange(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-paper/70 px-3 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm font-bold text-ink/45">
                No messages yet
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => {
                  const mine = message.playerId === session.playerId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-md px-3 py-2 text-sm shadow-soft ${
                          mine
                            ? "bg-ink text-white"
                            : "border border-ink/10 bg-white text-ink"
                        }`}
                      >
                        <div className="mb-0.5 flex items-center gap-2">
                          <span
                            className={`min-w-0 truncate text-[11px] font-extrabold ${
                              mine ? "text-white/70" : "text-ink/45"
                            }`}
                          >
                            {mine ? "You" : message.playerName || "Player"}
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-bold ${
                              mine ? "text-white/50" : "text-ink/35"
                            }`}
                          >
                            {formatChatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="break-words font-bold leading-snug">{message.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form className="border-t border-ink/10 bg-white p-3" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <input
                className="compact-input min-w-0 flex-1 bg-paper"
                value={draft}
                maxLength={CHAT_MAX_LENGTH}
                placeholder={connected ? "Type a message" : "Reconnecting..."}
                disabled={!connected || sending}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                type="submit"
                className="compact-button shrink-0 bg-mint px-3 text-white hover:bg-ink disabled:bg-ink/15 disabled:text-ink/35"
                disabled={!trimmedDraft || !connected || sending}
                aria-label="Send message"
                title="Send message"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
            {error ? <p className="mt-2 text-xs font-bold text-coral">{error}</p> : null}
          </form>
        </section>
      ) : (
        <button
          type="button"
          className="relative ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-[0_14px_34px_rgba(23,33,43,0.24)] transition hover:-translate-y-0.5 hover:bg-mint"
          aria-label="Open match chat"
          title="Open match chat"
          onClick={() => onOpenChange(true)}
        >
          <MessageCircle size={22} aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-extrabold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
