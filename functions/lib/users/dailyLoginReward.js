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
exports.dailyLoginReward = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const DAILY_REWARD = 50;
const STREAK_BONUS = 500;
const STREAK_MILESTONE = 7;
exports.dailyLoginReward = functions.https.onCall(async (_data, context) => {
    var _a, _b, _c;
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }
    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);
    const today = new Date().toISOString().split("T")[0];
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const userData = userSnap.data();
    const lastActive = (_b = userData.lastActiveDate) !== null && _b !== void 0 ? _b : "";
    if (lastActive === today) {
        return { alreadyClaimed: true };
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const currentStreak = (_c = userData.streak) !== null && _c !== void 0 ? _c : 0;
    const newStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
    const streakBonus = newStreak % STREAK_MILESTONE === 0 ? STREAK_BONUS : 0;
    const totalReward = DAILY_REWARD + streakBonus;
    await db.runTransaction(async (tx) => {
        tx.update(userRef, {
            coins: admin.firestore.FieldValue.increment(totalReward),
            streak: newStreak,
            lastActiveDate: today,
        });
        const txRef = db.collection("transactions").doc();
        tx.set(txRef, {
            id: txRef.id,
            userId: uid,
            type: "daily_bonus",
            amount: totalReward,
            description: streakBonus > 0
                ? `Login diário (+${DAILY_REWARD} Q$) + bônus de streak de ${newStreak} dias (+${streakBonus} Q$) 🔥`
                : `Login diário (+${DAILY_REWARD} Q$) | Streak: ${newStreak} dias 🔥`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return {
        alreadyClaimed: false,
        reward: totalReward,
        streak: newStreak,
        streakBonus,
    };
});
//# sourceMappingURL=dailyLoginReward.js.map