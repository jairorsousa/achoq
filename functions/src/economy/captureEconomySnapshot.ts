import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const captureEconomySnapshot = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 4 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const today = new Date().toISOString().split("T")[0];

    const [usersSnap, eventsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("events").where("status", "==", "open").get(),
    ]);

    let totalCoins = 0;
    let totalGoldCoins = 0;
    usersSnap.forEach((doc) => {
      const d = doc.data() as { coins?: number; goldCoins?: number };
      totalCoins += Number(d.coins ?? 0);
      totalGoldCoins += Number(d.goldCoins ?? 0);
    });

    let totalOpenBetsCoins = 0;
    eventsSnap.forEach((doc) => {
      const d = doc.data() as { totalCoins?: number };
      totalOpenBetsCoins += Number(d.totalCoins ?? 0);
    });

    await db.doc(`economy_snapshots/${today}`).set(
      {
        id: today,
        date: today,
        usersCount: usersSnap.size,
        totalCoins,
        totalGoldCoins,
        totalOpenBetsCoins,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return null;
  });

