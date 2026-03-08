import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

const DAILY_REWARD = 50;
const STREAK_BONUS = 500;
const STREAK_MILESTONE = 7;

export const dailyLoginReward = functions.https.onCall(async (_data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);
  const today = new Date().toISOString().split("T")[0];

  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }

  const userData = userSnap.data()!;
  const lastActive: string = userData.lastActiveDate ?? "";

  if (lastActive === today) {
    return { alreadyClaimed: true };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const currentStreak: number = userData.streak ?? 0;
  const newStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
  const streakBonus = newStreak % STREAK_MILESTONE === 0 ? STREAK_BONUS : 0;
  const totalReward = DAILY_REWARD + streakBonus;

  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      coins: admin.firestore.FieldValue.increment(totalReward),
      streak: newStreak,
      lastActiveDate: today,
    });

    const txRef = db.collection("transactions").doc();
    tx.set(txRef, {
      id: txRef.id,
      userId: uid,
      type: "daily_bonus",
      amount: totalReward,
      description:
        streakBonus > 0
          ? `Login diário (+${DAILY_REWARD} Q$) + bônus de streak de ${newStreak} dias (+${streakBonus} Q$) 🔥`
          : `Login diário (+${DAILY_REWARD} Q$) | Streak: ${newStreak} dias 🔥`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    alreadyClaimed: false,
    reward: totalReward,
    streak: newStreak,
    streakBonus,
  };
});
