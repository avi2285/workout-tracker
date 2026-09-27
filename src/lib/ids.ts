export function createId(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
