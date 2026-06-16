export function buildRevisionDate(daysFromNow: number): string {
  const next = new Date();
  next.setDate(next.getDate() + daysFromNow);
  return next.toISOString().slice(0, 10);
}

export function chooseRevisionDays(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 3;
  return 2;
}

export function isRevisionDue(dateText?: string): boolean {
  if (!dateText) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateText <= today;
}
