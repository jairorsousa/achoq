import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

// Triggered when a new bet is created in Firestore
export const onBetCreated = functions.firestore
  .document("bets/{betId}")
  .onCreate(async (snap) => {
    const bet = snap.data() as { eventId: string; amount: number; choice: "sim" | "nao" };
    const { eventId, amount, choice } = bet;

    const db = admin.firestore();
    const eventRef = db.doc(`events/${eventId}`);

    const simInc = choice === "sim" ? amount : 0;
    const naoInc = choice === "nao" ? amount : 0;

    const eventSnap = await eventRef.get();
    const eventData = eventSnap.exists ? eventSnap.data() as { sponsored?: boolean; seasonId?: string } : null;

    const updates: Record<string, admin.firestore.FieldValue> = {
      simCount: admin.firestore.FieldValue.increment(simInc),
      naoCount: admin.firestore.FieldValue.increment(naoInc),
      totalBets: admin.firestore.FieldValue.increment(1),
      totalCoins: admin.firestore.FieldValue.increment(amount),
    };

    if (eventData?.sponsored) {
      updates.sponsorParticipations = admin.firestore.FieldValue.increment(1);
    }

    await eventRef.update(updates);

    if (eventData?.seasonId) {
      await db
        .doc(`season_stats/${eventData.seasonId}`)
        .set(
          {
            seasonId: eventData.seasonId,
            totalBets: admin.firestore.FieldValue.increment(1),
            totalCoins: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }

    functions.logger.info(`Bet created: ${snap.id} on event ${eventId}`);
  });
