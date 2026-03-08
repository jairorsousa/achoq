import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const joinGroupByCode = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }

    const rawCode = String((data as { code?: string })?.code ?? "").trim().toUpperCase();
    if (rawCode.length < 4 || rawCode.length > 8) {
      throw new functions.https.HttpsError("invalid-argument", "Codigo de convite invalido.");
    }

    const db = admin.firestore();
    const uid = context.auth.uid;

    const groupSnap = await db
      .collection("groups")
      .where("inviteCode", "==", rawCode)
      .limit(1)
      .get();

    if (groupSnap.empty) {
      throw new functions.https.HttpsError("not-found", "Grupo nao encontrado.");
    }

    const groupRef = groupSnap.docs[0].ref;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(groupRef);
      if (!snap.exists) {
        throw new functions.https.HttpsError("not-found", "Grupo nao encontrado.");
      }

      const members = (snap.data()?.members as string[] | undefined) ?? [];
      if (!members.includes(uid)) {
        tx.update(groupRef, {
          members: admin.firestore.FieldValue.arrayUnion(uid),
        });
      }
    });

    return { success: true, groupId: groupRef.id };
  });
