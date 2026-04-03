// lib/resetUsage.ts
// Shared reset logic — used in both /api/usage and /api/transform

export type PlanKey =
  | "free"
  | "daypass"
  | "standard_monthly"
  | "standard_yearly"
  | "pro_monthly"
  | "pro_yearly"
  | "premium_monthly"
  | "premium_yearly"
  | "admin_premium";

export const LIMITS: Record<string, number> = {
  free:               2000,
  daypass:           20000,
  standard_monthly:   8000,
  standard_yearly:    8000,
  pro_monthly:       20000,
  pro_yearly:        20000,
  premium_monthly:   80000,
  premium_yearly:    80000,
  admin_premium:     Infinity,
};

/**
 * Returns { used, shouldSave }
 * shouldSave = true means used was reset and caller should persist it
 */
export function applyReset(
  plan: string,
  used: number,
  lastUsed: number | null
): { used: number; shouldSave: boolean } {
  if (!lastUsed) return { used, shouldSave: false };

  const now = new Date();
  const last = new Date(lastUsed);

  // 24H — daypass
  if (plan === "daypass") {
    const diffMs = now.getTime() - last.getTime();
    if (diffMs > 24 * 60 * 60 * 1000) {
      return { used: 0, shouldSave: true };
    }
  }

  // Monthly — Standard / Pro / Premium _monthly
  if (plan.endsWith("_monthly")) {
    const sameMonth =
      now.getMonth() === last.getMonth() &&
      now.getFullYear() === last.getFullYear();
    if (!sameMonth) {
      return { used: 0, shouldSave: true };
    }
  }

  // Yearly — Standard / Pro / Premium _yearly
  if (plan.endsWith("_yearly")) {
    if (now.getFullYear() !== last.getFullYear()) {
      return { used: 0, shouldSave: true };
    }
  }

  return { used, shouldSave: false };
}

/**
 * Human-readable info about when usage resets
 */
export function getResetInfo(plan: string, lastUsed: number | null): string {
  if (!lastUsed) return "";
  const last = new Date(lastUsed);

  if (plan === "daypass") {
    const resetsAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
    return `Reset: ${resetsAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (plan.endsWith("_monthly")) {
    const resetsAt = new Date(last.getFullYear(), last.getMonth() + 1, 1);
    return `Reset: ${resetsAt.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}`;
  }

  if (plan.endsWith("_yearly")) {
    const resetsAt = new Date(last.getFullYear() + 1, 0, 1);
    return `Reset: 1 stycznia ${resetsAt.getFullYear()}`;
  }

  return "";
}
