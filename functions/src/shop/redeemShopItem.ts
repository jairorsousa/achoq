import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const redeemShopItem = functions
  .region("southamerica-east1")
  .https.onCall(async (data: { itemId?: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }

    const itemId = String(data?.itemId ?? "").trim();
    if (!itemId) {
      throw new functions.https.HttpsError("invalid-argument", "itemId e obrigatorio.");
    }

    const db = admin.firestore();
    const uid = context.auth.uid;

    await db.runTransaction(async (tx) => {
      const itemRef = db.doc(`shop_items/${itemId}`);
      const userRef = db.doc(`users/${uid}`);

      const [itemSnap, userSnap] = await Promise.all([tx.get(itemRef), tx.get(userRef)]);

      if (!itemSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Item nao encontrado.");
      }
      if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Usuario nao encontrado.");
      }

      const item = itemSnap.data() as {
        name: string;
        emoji?: string;
        available: boolean;
        stock?: number;
        price: number;
        goldOnly?: boolean;
        goldPrice?: number;
      };
      const user = userSnap.data() as { coins?: number; goldCoins?: number };

      if (!item.available) {
        throw new functions.https.HttpsError("failed-precondition", "Item indisponivel.");
      }
      if (item.stock !== undefined && item.stock <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "Estoque esgotado.");
      }

      const useGold = item.goldOnly === true;
      const coinPrice = Math.max(0, Number(item.price ?? 0));
      const goldPrice = Math.max(0, Number(item.goldPrice ?? 0));

      if (useGold) {
        const currentGold = Number(user.goldCoins ?? 0);
        if (currentGold < goldPrice || goldPrice <= 0) {
          throw new functions.https.HttpsError("failed-precondition", "Saldo de Gold insuficiente.");
        }
        tx.update(userRef, { goldCoins: currentGold - goldPrice });
      } else {
        const currentCoins = Number(user.coins ?? 0);
        if (currentCoins < coinPrice || coinPrice <= 0) {
          throw new functions.https.HttpsError("failed-precondition", "Saldo insuficiente.");
        }
        tx.update(userRef, { coins: currentCoins - coinPrice });
      }

      if (item.stock !== undefined) {
        tx.update(itemRef, { stock: item.stock - 1 });
      }

      const redemptionRef = db.collection("redemptions").doc();
      tx.set(redemptionRef, {
        id: redemptionRef.id,
        userId: uid,
        itemId,
        itemName: item.name,
        itemEmoji: item.emoji ?? "[gift]",
        price: useGold ? goldPrice : coinPrice,
        currency: useGold ? "gold" : "coin",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(db.collection("transactions").doc(redemptionRef.id), {
        id: redemptionRef.id,
        userId: uid,
        type: "shop_purchase",
        amount: useGold ? -goldPrice : -coinPrice,
        currency: useGold ? "gold" : "coin",
        description: `Resgate: ${item.name}`,
        relatedId: itemId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  });
