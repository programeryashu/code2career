// Unread tracking: a localStorage map of {userId: {threadKey: isoTimestamp}}.
// threadKey is `dm-<id>` for DM threads or `booking-<id>` for booking chats.

const keyFor = (userId: number) => `skillswap_seen_u${userId}`;

type SeenMap = Record<string, string>;

function load(userId: number): SeenMap {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
}

function save(userId: number, map: SeenMap): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(map));
  } catch {
    // private mode — badges simply won't persist
  }
}

/** How many messages arrived after the last time this thread was opened. */
export function unreadCount(
  userId: number,
  threadKey: string,
  messages: { created_at: string; sender_id: number | null }[],
  meId: number,
): number {
  const lastSeen = load(userId)[threadKey];
  return messages.filter(
    (m) =>
      m.sender_id !== null &&
      m.sender_id !== meId &&
      (!lastSeen || m.created_at > lastSeen),
  ).length;
}

/** Mark a thread read up to now. */
export function markSeen(userId: number, threadKey: string): void {
  const map = load(userId);
  map[threadKey] = new Date().toISOString();
  save(userId, map);
}
