"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEvent = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const RAKE = 0.05; // 5% platform fee
exports.resolveEvent = functions.https.onCall(async (data, context) => {
    var _a;
    // Admin only
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError("permission-denied", "Admin access required.");
    }
    const { eventId, result } = data;
    if (!eventId || !["sim", "nao"].includes(result)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid arguments.");
    }
    const db = admin.firestore();
    const eventRef = db.doc(`events/${eventId}`);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();
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
    functions.logger.info(`Event ${eventId} resolved: ${result}. ${winners.length} winners, net pot: ${netPot}`);
    return {
        resolved: true,
        winnersCount: winners.length,
        losersCount: losers.length,
        totalPot,
        rakeAmount,
        netPot,
    };
});
//# sourceMappingURL=resolveEvent.js.map