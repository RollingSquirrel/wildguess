export class PresenceStore {
  // Map of `roomId:userId` to last seen timestamp in ms
  private static store = new Map<string, number>();

  static markSeen(roomId: string, userId: string) {
    this.store.set(`${roomId}:${userId}`, Date.now());
  }

  static getLastSeen(roomId: string, userId: string): number | undefined {
    return this.store.get(`${roomId}:${userId}`);
  }

  static remove(roomId: string, userId: string) {
    this.store.delete(`${roomId}:${userId}`);
  }

  static getInactiveUsers(
    timeoutMs: number,
    now = Date.now(),
  ): Array<{ roomId: string; userId: string }> {
    const threshold = now - timeoutMs;
    const inactive: Array<{ roomId: string; userId: string }> = [];

    for (const [key, lastSeen] of this.store.entries()) {
      if (lastSeen < threshold) {
        const [roomId, userId] = key.split(':');
        inactive.push({ roomId, userId });
      }
    }

    return inactive;
  }
}
