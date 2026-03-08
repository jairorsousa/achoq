import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const monitorEconomyAlerts = functions
  .region("southamerica-east1")
  .pubsub.schedule("15 4 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db
      .collection("economy_snapshots")
      .orderBy("generatedAt", "desc")
      .limit(2)
      .get();

    if (snap.size < 2) return null;

    const current = snap.docs[0].data() as { totalCoins?: number; totalGoldCoins?: number; date?: string };
    const previous = snap.docs[1].data() as { totalCoins?: number; totalGoldCoins?: number; date?: string };

    const currentCoins = Number(current.totalCoins ?? 0);
    const previousCoins = Number(previous.totalCoins ?? 0);
    const currentGold = Number(current.totalGoldCoins ?? 0);
    const previousGold = Number(previous.totalGoldCoins ?? 0);

    if (previousCoins <= 0 && previousGold <= 0) return null;

    const coinChangePct = previousCoins > 0 ? ((currentCoins - previousCoins) / previousCoins) * 100 : 0;
    const goldChangePct = previousGold > 0 ? ((currentGold - previousGold) / previousGold) * 100 : 0;

    const alerts: Array<{ level: "warning" | "critical"; title: string; message: string }> = [];

    if (coinChangePct >= 20) {
      alerts.push({
        level: coinChangePct >= 35 ? "critical" : "warning",
        title: "Inflacao de Q$ detectada",
        message: `Q$ total subiu ${coinChangePct.toFixed(1)}% (${previous.date} -> ${current.date}).`,
      });
    }
    if (goldChangePct >= 30) {
      alerts.push({
        level: goldChangePct >= 50 ? "critical" : "warning",
        title: "Alta acentuada de Q$ Gold",
        message: `Q$ Gold total subiu ${goldChangePct.toFixed(1)}% (${previous.date} -> ${current.date}).`,
      });
    }

    if (alerts.length === 0) return null;

    const batch = db.batch();
    alerts.forEach((a) => {
      const ref = db.collection("economy_alerts").doc();
      batch.set(ref, {
        id: ref.id,
        ...a,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return null;
  });

