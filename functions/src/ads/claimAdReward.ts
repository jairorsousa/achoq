import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

const AD_REWARD = 50;
const DAILY_AD_LIMIT = 3;

export const claimAdReward = functions
  .region("southamerica-east1")
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
    }

    const db = admin.firestore();
    const uid = context.auth.uid;
    const today = new Date().toISOString().split("T")[0];

    await db.runTransaction(async (tx) => {
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await tx.get(userRef);

      if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Usuário não encontrado.");
      }

      const user = userSnap.data()!;
      const adsToday: number = user.adViewDate === today ? (user.adViewCount ?? 0) : 0;

      if (adsToday >= DAILY_AD_LIMIT) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `Limite diário de ${DAILY_AD_LIMIT} vídeos atingido. Volte amanhã!`
        );
      }

      const txRef = db.collection("transactions").doc();

      tx.update(userRef, {
        coins: (user.coins ?? 0) + AD_REWARD,
        adViewDate: today,
        adViewCount: adsToday + 1,
      });

      tx.set(txRef, {
        id: txRef.id,
        userId: uid,
        type: "ad_reward",
        amount: AD_REWARD,
        description: "Vídeo assistido 📺 +50 Q$",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, reward: AD_REWARD };
  });
