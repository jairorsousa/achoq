import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

const RAKE = 0.05; // 5% platform fee

export const resolveEvent = functions.https.onCall(async (data, context) => {
  // Admin only
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required."
    );
  }

  const { eventId, result } = data as {
    eventId: string;
    result: "sim" | "nao";
  };

  if (!eventId || !["sim", "nao"].includes(result)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid arguments.");
  }

  const db = admin.firestore();
  const eventRef = db.doc(`events/${eventId}`);
  const eventSnap = await eventRef.get();

  if (!eventSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Event not found.");
  }

  const eventData = eventSnap.data()!;
  if (eventData.status !== "open") {
    throw new functions.https.HttpsError("failed-precondition", "Event is not open.");
  }

  // Fetch all pending bets for this event
  const betsSnap = await db
    .collection("bets")
    .where("eventId", "==", eventId)
    .where("status", "==", "pending")
    .get();

  if (betsSnap.empty) {
    // No bets — just close the event
    await eventRef.update({
      status: "resolved",
      result,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { resolved: true, winnersCount: 0, totalPot: 0, rakeAmount: 0 };
  }

  // Separate winners and losers
  const winners = betsSnap.docs.filter((d) => d.data().choice === result);
  const losers = betsSnap.docs.filter((d) => d.data().choice !== result);

  const totalPot = betsSnap.docs.reduce((sum, d) => sum + d.data().amount, 0);
  const rakeAmount = Math.floor(totalPot * RAKE);
  const netPot = totalPot - rakeAmount;

  const winnersTotalBet = winners.reduce((sum, d) => sum + d.data().amount, 0);

  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // Process winners
  for (const winBet of winners) {
    const betData = winBet.data();
    const proportion = betData.amount / winnersTotalBet;
    const payout = Math.floor(netPot * proportion);

    // Update bet
    batch.update(winBet.ref, {
      status: "won",
      payout,
      resolvedAt: now,
    });

    // Credit user
    batch.update(db.doc(`users/${betData.userId}`), {
      coins: admin.firestore.FieldValue.increment(payout),
      xp: admin.firestore.FieldValue.increment(25),
    });

    // Transaction record
    const txRef = db.collection("transactions").doc();
    batch.set(txRef, {
      id: txRef.id,
      userId: betData.userId,
      type: "bet_won",
      amount: payout,
      description: `Acertou! Ganhou ${payout} Q$ no evento "${eventData.title}"`,
      relatedId: eventId,
      createdAt: now,
    });
  }

  // Process losers — mark as lost, give 10 XP for participation
  for (const loseBet of losers) {
    const betData = loseBet.data();
    batch.update(loseBet.ref, { status: "lost", payout: 0, resolvedAt: now });
    batch.update(db.doc(`users/${betData.userId}`), {
      xp: admin.firestore.FieldValue.increment(10),
    });
  }

  // Update event
  batch.update(eventRef, {
    status: "resolved",
    result,
    resolvedAt: now,
  });

  await batch.commit();

  functions.logger.info(
    `Event ${eventId} resolved: ${result}. ${winners.length} winners, net pot: ${netPot}`
  );

  return {
    resolved: true,
    winnersCount: winners.length,
    losersCount: losers.length,
    totalPot,
    rakeAmount,
    netPot,
  };
});
