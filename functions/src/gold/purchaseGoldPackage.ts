import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

const PACKAGES: Record<string, { priceBRL: number; goldAmount: number }> = {
  gold_500: { priceBRL: 5, goldAmount: 500 },
  gold_1200: { priceBRL: 10, goldAmount: 1200 },
  gold_3500: { priceBRL: 25, goldAmount: 3500 },
};

export const purchaseGoldPackage = functions
  .region("southamerica-east1")
  .https.onCall(async (data: { packageId?: string; sandboxToken?: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }

    const packageId = String(data?.packageId ?? "").trim();
    const selected = PACKAGES[packageId];
    if (!selected) {
      throw new functions.https.HttpsError("invalid-argument", "Pacote invalido.");
    }

    // Placeholder for gateway validation. In production, validate webhook/payment intent.
    const sandboxToken = String(data?.sandboxToken ?? "").trim();
    if (sandboxToken !== "sandbox_ok") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Pagamento nao validado. Use sandbox_ok em ambiente de testes."
      );
    }

    const db = admin.firestore();
    const uid = context.auth.uid;
    const txRef = db.collection("transactions").doc();

    await db.runTransaction(async (tx) => {
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Usuario nao encontrado.");
      }

      tx.update(userRef, {
        goldCoins: admin.firestore.FieldValue.increment(selected.goldAmount),
      });

      tx.set(txRef, {
        id: txRef.id,
        userId: uid,
        type: "gold_purchase",
        amount: selected.goldAmount,
        currency: "gold",
        description: `Compra de Q$ Gold (${packageId})`,
        metadata: {
          packageId,
          priceBRL: selected.priceBRL,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      packageId,
      goldAmount: selected.goldAmount,
      priceBRL: selected.priceBRL,
    };
  });

