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
exports.joinGroupByCode = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.joinGroupByCode = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login necessario.");
    }
    const rawCode = String((_a = data === null || data === void 0 ? void 0 : data.code) !== null && _a !== void 0 ? _a : "").trim().toUpperCase();
    if (rawCode.length < 4 || rawCode.length > 8) {
        throw new functions.https.HttpsError("invalid-argument", "Codigo de convite invalido.");
    }
    const db = admin.firestore();
    const uid = context.auth.uid;
    const groupSnap = await db
        .collection("groups")
        .where("inviteCode", "==", rawCode)
        .limit(1)
        .get();
    if (groupSnap.empty) {
        throw new functions.https.HttpsError("not-found", "Grupo nao encontrado.");
    }
    const groupRef = groupSnap.docs[0].ref;
    await db.runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(groupRef);
        if (!snap.exists) {
            throw new functions.https.HttpsError("not-found", "Grupo nao encontrado.");
        }
        const members = (_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.members) !== null && _b !== void 0 ? _b : [];
        if (!members.includes(uid)) {
            tx.update(groupRef, {
                members: admin.firestore.FieldValue.arrayUnion(uid),
            });
        }
    });
    return { success: true, groupId: groupRef.id };
});
//# sourceMappingURL=joinGroupByCode.js.map