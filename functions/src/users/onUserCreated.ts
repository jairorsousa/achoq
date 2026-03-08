import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const now = new Date().toISOString();

  const userDoc = {
    uid: user.uid,
    username: "",
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    email: user.email ?? "",
    phone: user.phoneNumber ?? "",
    coins: 1000,
    goldCoins: 0,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: now.split("T")[0],
    achievements: [],
    createdAt: now,
  };

  await db.doc(`users/${user.uid}`).set(userDoc, { merge: true });

  await db.collection("transactions").add({
    userId: user.uid,
    type: "daily_bonus",
    amount: 1000,
    description: "Bônus de boas-vindas 🎉",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(`New user created: ${user.uid}`);
});
