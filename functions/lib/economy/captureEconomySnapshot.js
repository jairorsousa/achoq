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
exports.captureEconomySnapshot = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.captureEconomySnapshot = functions
    .region("southamerica-east1")
    .pubsub.schedule("0 4 * * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async () => {
    const db = admin.firestore();
    const today = new Date().toISOString().split("T")[0];
    const [usersSnap, eventsSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("events").where("status", "==", "open").get(),
    ]);
    let totalCoins = 0;
    let totalGoldCoins = 0;
    usersSnap.forEach((doc) => {
        var _a, _b;
        const d = doc.data();
        totalCoins += Number((_a = d.coins) !== null && _a !== void 0 ? _a : 0);
        totalGoldCoins += Number((_b = d.goldCoins) !== null && _b !== void 0 ? _b : 0);
    });
    let totalOpenBetsCoins = 0;
    eventsSnap.forEach((doc) => {
        var _a;
        const d = doc.data();
        totalOpenBetsCoins += Number((_a = d.totalCoins) !== null && _a !== void 0 ? _a : 0);
    });
    await db.doc(`economy_snapshots/${today}`).set({
        id: today,
        date: today,
        usersCount: usersSnap.size,
        totalCoins,
        totalGoldCoins,
        totalOpenBetsCoins,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return null;
});
//# sourceMappingURL=captureEconomySnapshot.js.map