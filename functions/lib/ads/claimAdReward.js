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
exports.claimAdReward = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const AD_REWARD = 50;
const DAILY_AD_LIMIT = 3;
exports.claimAdReward = functions
    .region("southamerica-east1")
    .https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
    }
    const db = admin.firestore();
    const uid = context.auth.uid;
    const today = new Date().toISOString().split("T")[0];
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const userRef = db.doc(`users/${uid}`);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Usuário não encontrado.");
        }
        const user = userSnap.data();
        const adsToday = user.adViewDate === today ? ((_a = user.adViewCount) !== null && _a !== void 0 ? _a : 0) : 0;
        if (adsToday >= DAILY_AD_LIMIT) {
            throw new functions.https.HttpsError("failed-precondition", `Limite diário de ${DAILY_AD_LIMIT} vídeos atingido. Volte amanhã!`);
        }
        const txRef = db.collection("transactions").doc();
        tx.update(userRef, {
            coins: ((_b = user.coins) !== null && _b !== void 0 ? _b : 0) + AD_REWARD,
            adViewDate: today,
            adViewCount: adsToday + 1,
        });
        tx.set(txRef, {
            id: txRef.id,
            userId: uid,
            type: "ad_reward",
            amount: AD_REWARD,
            description: "Vídeo assistido 📺 +50 Q$",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { success: true, reward: AD_REWARD };
});
//# sourceMappingURL=claimAdReward.js.map