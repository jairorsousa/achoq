import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const detectSuspiciousAccounts = functions
  .region("southamerica-east1")
  .pubsub.schedule("45 4 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    const phoneToUids = new Map<string, string[]>();
    usersSnap.forEach((doc) => {
      const d = doc.data() as { phone?: string };
      const phone = String(d.phone ?? "").trim();
      if (!phone) return;
      const arr = phoneToUids.get(phone) ?? [];
      arr.push(doc.id);
      phoneToUids.set(phone, arr);
    });

    const suspicious = [...phoneToUids.entries()].filter(([, uids]) => uids.length >= 3);
    if (suspicious.length === 0) return null;

    const batch = db.batch();
    suspicious.forEach(([phone, uids]) => {
      const ref = db.collection("security_alerts").doc();
      batch.set(ref, {
        id: ref.id,
        type: "duplicate_phone",
        level: "warning",
        title: "Possivel farm de contas",
        message: `Telefone ${phone} associado a ${uids.length} contas.`,
        phone,
        uids,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    return null;
  });

