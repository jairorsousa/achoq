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
exports.onBetCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
// Triggered when a new bet is created in Firestore
exports.onBetCreated = functions.firestore
    .document("bets/{betId}")
    .onCreate(async (snap) => {
    const bet = snap.data();
    const { eventId, amount, choice } = bet;
    const db = admin.firestore();
    const eventRef = db.doc(`events/${eventId}`);
    const simInc = choice === "sim" ? amount : 0;
    const naoInc = choice === "nao" ? amount : 0;
    const eventSnap = await eventRef.get();
    const eventData = eventSnap.exists ? eventSnap.data() : null;
    const updates = {
        simCount: admin.firestore.FieldValue.increment(simInc),
        naoCount: admin.firestore.FieldValue.increment(naoInc),
        totalBets: admin.firestore.FieldValue.increment(1),
        totalCoins: admin.firestore.FieldValue.increment(amount),
    };
    if (eventData === null || eventData === void 0 ? void 0 : eventData.sponsored) {
        updates.sponsorParticipations = admin.firestore.FieldValue.increment(1);
    }
    await eventRef.update(updates);
    if (eventData === null || eventData === void 0 ? void 0 : eventData.seasonId) {
        await db
            .doc(`season_stats/${eventData.seasonId}`)
            .set({
            seasonId: eventData.seasonId,
            totalBets: admin.firestore.FieldValue.increment(1),
            totalCoins: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    functions.logger.info(`Bet created: ${snap.id} on event ${eventId}`);
});
//# sourceMappingURL=onBetCreated.js.map