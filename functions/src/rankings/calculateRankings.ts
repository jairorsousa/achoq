import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

// Runs every Sunday at 23:00 BRT (02:00 UTC Monday)
export const calculateRankings = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 2 * * 1")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const period = `${now.getFullYear()}-W${getWeekNumber(now)}`;

    // Fetch all users
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as Array<{
      uid: string;
      username: string;
      photoURL?: string;
      level: number;
      xp: number;
      coins: number;
      totalBets?: number;
      totalWins?: number;
    }>;

    // Sort by xp descending
    const sorted = [...users].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));

    const batch = db.batch();

    const globalEntries = sorted.slice(0, 100).map((u, idx) => ({
      rank: idx + 1,
      userId: u.uid,
      username: u.username,
      photoURL: u.photoURL ?? null,
      level: u.level ?? 1,
      xp: u.xp ?? 0,
      coins: u.coins ?? 0,
      winRate:
        u.totalBets && u.totalBets > 0
          ? Math.round(((u.totalWins ?? 0) / u.totalBets) * 100)
          : 0,
      totalBets: u.totalBets ?? 0,
    }));

    const rankRef = db.doc(`rankings/${period}_geral`);
    batch.set(rankRef, {
      period,
      category: "geral",
      calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
      entries: globalEntries,
    });

    await batch.commit();

    functions.logger.info(`Rankings calculated for period ${period}: ${globalEntries.length} entries`);
  });

function getWeekNumber(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return String(weekNo).padStart(2, "0");
}
