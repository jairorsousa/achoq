import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

export const recordSponsoredImpression = functions
  .region("southamerica-east1")
  .https.onCall(async (data: { eventId?: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }

    const eventId = String(data?.eventId ?? "").trim();
    if (!eventId) {
      throw new functions.https.HttpsError("invalid-argument", "eventId obrigatorio.");
    }

    const db = admin.firestore();
    const eventRef = db.doc(`events/${eventId}`);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Evento nao encontrado.");
    }

    const eventData = eventSnap.data() as { sponsored?: boolean };
    if (!eventData.sponsored) {
      return { success: true, skipped: true };
    }

    await eventRef.update({
      sponsorImpressions: admin.firestore.FieldValue.increment(1),
    });

    return { success: true };
  });

