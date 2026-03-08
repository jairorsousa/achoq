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
exports.detectSuspiciousAccounts = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.detectSuspiciousAccounts = functions
    .region("southamerica-east1")
    .pubsub.schedule("45 4 * * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();
    const phoneToUids = new Map();
    usersSnap.forEach((doc) => {
        var _a, _b;
        const d = doc.data();
        const phone = String((_a = d.phone) !== null && _a !== void 0 ? _a : "").trim();
        if (!phone)
            return;
        const arr = (_b = phoneToUids.get(phone)) !== null && _b !== void 0 ? _b : [];
        arr.push(doc.id);
        phoneToUids.set(phone, arr);
    });
    const suspicious = [...phoneToUids.entries()].filter(([, uids]) => uids.length >= 3);
    if (suspicious.length === 0)
        return null;
    const batch = db.batch();
    suspicious.forEach(([phone, uids]) => {
        const ref = db.collection("security_alerts").doc();
        batch.set(ref, {
            id: ref.id,
            type: "duplicate_phone",
            level: "warning",
            title: "Possivel farm de contas",
            message: `Telefone ${phone} associado a ${uids.length} contas.`,
            phone,
            uids,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
    return null;
});
//# sourceMappingURL=detectSuspiciousAccounts.js.map