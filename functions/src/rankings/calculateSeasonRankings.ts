import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const calculateSeasonRankings = functions
  .region("southamerica-east1")
  .pubsub.schedule("30 2 * * 1")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const activeSeasons = await db.collection("seasons").where("active", "==", true).get();
    if (activeSeasons.empty) return null;

    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as Array<{
      uid: string;
      username: string;
      photoURL?: string;
      level?: number;
      xp?: number;
      coins?: number;
    }>;

    const now = new Date();
    const period = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    const sorted = [...users].sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
    const entries = sorted.slice(0, 100).map((u, idx) => ({
      rank: idx + 1,
      userId: u.uid,
      username: u.username,
      photoURL: u.photoURL ?? null,
      level: u.level ?? 1,
      xp: u.xp ?? 0,
      coins: u.coins ?? 0,
      winRate: 0,
      totalBets: 0,
    }));

    const batch = db.batch();
    activeSeasons.forEach((seasonDoc) => {
      const season = seasonDoc.data() as { slug?: string };
      const key = season.slug ?? seasonDoc.id;
      const ref = db.doc(`rankings/${period}_season_${key}`);
      batch.set(ref, {
        period,
        category: `season_${key}`,
        seasonId: seasonDoc.id,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        entries,
      });
    });
    await batch.commit();

    return null;
  });

function getWeekNumber(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return String(weekNo).padStart(2, "0");
}

