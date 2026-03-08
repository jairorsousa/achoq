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
exports.onUserCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    var _a, _b, _c, _d;
    const db = admin.firestore();
    const now = new Date().toISOString();
    const userDoc = {
        uid: user.uid,
        username: "",
        displayName: (_a = user.displayName) !== null && _a !== void 0 ? _a : "",
        photoURL: (_b = user.photoURL) !== null && _b !== void 0 ? _b : "",
        email: (_c = user.email) !== null && _c !== void 0 ? _c : "",
        phone: (_d = user.phoneNumber) !== null && _d !== void 0 ? _d : "",
        coins: 1000,
        goldCoins: 0,
        xp: 0,
        level: 1,
        streak: 0,
        lastActiveDate: now.split("T")[0],
        achievements: [],
        createdAt: now,
    };
    await db.doc(`users/${user.uid}`).set(userDoc, { merge: true });
    await db.collection("transactions").add({
        userId: user.uid,
        type: "daily_bonus",
        amount: 1000,
        description: "Bônus de boas-vindas 🎉",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info(`New user created: ${user.uid}`);
});
//# sourceMappingURL=onUserCreated.js.map