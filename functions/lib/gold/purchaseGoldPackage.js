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
exports.purchaseGoldPackage = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const PACKAGES = {
    gold_500: { priceBRL: 5, goldAmount: 500 },
    gold_1200: { priceBRL: 10, goldAmount: 1200 },
    gold_3500: { priceBRL: 25, goldAmount: 3500 },
};
exports.purchaseGoldPackage = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }
    const packageId = String((_a = data === null || data === void 0 ? void 0 : data.packageId) !== null && _a !== void 0 ? _a : "").trim();
    const selected = PACKAGES[packageId];
    if (!selected) {
        throw new functions.https.HttpsError("invalid-argument", "Pacote invalido.");
    }
    // Placeholder for gateway validation. In production, validate webhook/payment intent.
    const sandboxToken = String((_b = data === null || data === void 0 ? void 0 : data.sandboxToken) !== null && _b !== void 0 ? _b : "").trim();
    if (sandboxToken !== "sandbox_ok") {
        throw new functions.https.HttpsError("failed-precondition", "Pagamento nao validado. Use sandbox_ok em ambiente de testes.");
    }
    const db = admin.firestore();
    const uid = context.auth.uid;
    const txRef = db.collection("transactions").doc();
    await db.runTransaction(async (tx) => {
        const userRef = db.doc(`users/${uid}`);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Usuario nao encontrado.");
        }
        tx.update(userRef, {
            goldCoins: admin.firestore.FieldValue.increment(selected.goldAmount),
        });
        tx.set(txRef, {
            id: txRef.id,
            userId: uid,
            type: "gold_purchase",
            amount: selected.goldAmount,
            currency: "gold",
            description: `Compra de Q$ Gold (${packageId})`,
            metadata: {
                packageId,
                priceBRL: selected.priceBRL,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return {
        success: true,
        packageId,
        goldAmount: selected.goldAmount,
        priceBRL: selected.priceBRL,
    };
});
//# sourceMappingURL=purchaseGoldPackage.js.map