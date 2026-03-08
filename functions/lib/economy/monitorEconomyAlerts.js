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
exports.monitorEconomyAlerts = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.monitorEconomyAlerts = functions
    .region("southamerica-east1")
    .pubsub.schedule("15 4 * * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async () => {
    var _a, _b, _c, _d;
    const db = admin.firestore();
    const snap = await db
        .collection("economy_snapshots")
        .orderBy("generatedAt", "desc")
        .limit(2)
        .get();
    if (snap.size < 2)
        return null;
    const current = snap.docs[0].data();
    const previous = snap.docs[1].data();
    const currentCoins = Number((_a = current.totalCoins) !== null && _a !== void 0 ? _a : 0);
    const previousCoins = Number((_b = previous.totalCoins) !== null && _b !== void 0 ? _b : 0);
    const currentGold = Number((_c = current.totalGoldCoins) !== null && _c !== void 0 ? _c : 0);
    const previousGold = Number((_d = previous.totalGoldCoins) !== null && _d !== void 0 ? _d : 0);
    if (previousCoins <= 0 && previousGold <= 0)
        return null;
    const coinChangePct = previousCoins > 0 ? ((currentCoins - previousCoins) / previousCoins) * 100 : 0;
    const goldChangePct = previousGold > 0 ? ((currentGold - previousGold) / previousGold) * 100 : 0;
    const alerts = [];
    if (coinChangePct >= 20) {
        alerts.push({
            level: coinChangePct >= 35 ? "critical" : "warning",
            title: "Inflacao de Q$ detectada",
            message: `Q$ total subiu ${coinChangePct.toFixed(1)}% (${previous.date} -> ${current.date}).`,
        });
    }
    if (goldChangePct >= 30) {
        alerts.push({
            level: goldChangePct >= 50 ? "critical" : "warning",
            title: "Alta acentuada de Q$ Gold",
            message: `Q$ Gold total subiu ${goldChangePct.toFixed(1)}% (${previous.date} -> ${current.date}).`,
        });
    }
    if (alerts.length === 0)
        return null;
    const batch = db.batch();
    alerts.forEach((a) => {
        const ref = db.collection("economy_alerts").doc();
        batch.set(ref, Object.assign(Object.assign({ id: ref.id }, a), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    });
    await batch.commit();
    return null;
});
//# sourceMappingURL=monitorEconomyAlerts.js.map