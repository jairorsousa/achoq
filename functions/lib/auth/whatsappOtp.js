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
exports.verifyWhatsappOtp = exports.requestWhatsappOtp = void 0;
const crypto_1 = require("crypto");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const params_1 = require("firebase-functions/params");
const ZAPI_INSTANCE = (0, params_1.defineString)("ZAPI_INSTANCE");
const ZAPI_TOKEN = (0, params_1.defineString)("ZAPI_TOKEN");
const ZAPI_CLIENT_TOKEN = (0, params_1.defineString)("ZAPI_CLIENT_TOKEN");
const ZAPI_BASE_URL = (0, params_1.defineString)("ZAPI_BASE_URL");
const WHATSAPP_OTP_PEPPER = (0, params_1.defineString)("WHATSAPP_OTP_PEPPER");
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 6;
function readOptionalParam(param) {
    var _a;
    try {
        const value = (_a = param.value()) === null || _a === void 0 ? void 0 : _a.trim();
        return value ? value : undefined;
    }
    catch (_b) {
        return undefined;
    }
}
function normalizePhone(raw) {
    let digits = String(raw !== null && raw !== void 0 ? raw : "").replace(/\D/g, "");
    // Accept local BR format and normalize to country code.
    if (digits.length === 10 || digits.length === 11) {
        digits = `55${digits}`;
    }
    if (!digits.startsWith("55")) {
        throw new functions.https.HttpsError("invalid-argument", "Numero invalido.");
    }
    if (digits.length < 12 || digits.length > 13) {
        throw new functions.https.HttpsError("invalid-argument", "Numero invalido.");
    }
    return { e164: `+${digits}`, digits };
}
function codeHash(code) {
    var _a, _b;
    const pepper = (_b = (_a = process.env.WHATSAPP_OTP_PEPPER) !== null && _a !== void 0 ? _a : readOptionalParam(WHATSAPP_OTP_PEPPER)) !== null && _b !== void 0 ? _b : "change-this-pepper";
    return (0, crypto_1.createHash)("sha256").update(`${code}:${pepper}`).digest("hex");
}
async function sendWhatsappOtpMessage(phoneDigits, code) {
    var _a, _b, _c, _d, _e;
    const instance = (_a = process.env.ZAPI_INSTANCE) !== null && _a !== void 0 ? _a : readOptionalParam(ZAPI_INSTANCE);
    const token = (_b = process.env.ZAPI_TOKEN) !== null && _b !== void 0 ? _b : readOptionalParam(ZAPI_TOKEN);
    const clientToken = (_c = process.env.ZAPI_CLIENT_TOKEN) !== null && _c !== void 0 ? _c : readOptionalParam(ZAPI_CLIENT_TOKEN);
    const baseUrl = (_e = (_d = process.env.ZAPI_BASE_URL) !== null && _d !== void 0 ? _d : readOptionalParam(ZAPI_BASE_URL)) !== null && _e !== void 0 ? _e : "https://api.z-api.io";
    if (!instance || !token || !clientToken) {
        throw new functions.https.HttpsError("failed-precondition", "Z-API nao configurada no backend.");
    }
    const endpoint = `${baseUrl}/instances/${instance}/token/${token}/send-text`;
    const message = `Seu codigo de verificacao do achoQ: ${code}. Valido por 5 minutos.`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Client-Token": clientToken,
        },
        body: JSON.stringify({
            phone: phoneDigits,
            message,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        functions.logger.error("Z-API send-text failed", {
            status: response.status,
            body: text,
        });
        throw new functions.https.HttpsError("unavailable", `Falha Z-API (${response.status}). Verifique instance/token/clientToken.`);
    }
}
exports.requestWhatsappOtp = functions
    .region("southamerica-east1")
    .https.onCall(async (data) => {
    var _a, _b;
    const phone = normalizePhone(String((_a = data === null || data === void 0 ? void 0 : data.phone) !== null && _a !== void 0 ? _a : ""));
    const nowMs = Date.now();
    const db = admin.firestore();
    const otpRef = db.doc(`auth_otps/${phone.digits}`);
    const snap = await otpRef.get();
    const current = snap.exists ? snap.data() : null;
    if (current === null || current === void 0 ? void 0 : current.lastSentAt) {
        const sinceLastSend = nowMs - current.lastSentAt.toMillis();
        if (sinceLastSend < OTP_COOLDOWN_MS) {
            throw new functions.https.HttpsError("resource-exhausted", "Aguarde alguns segundos para solicitar outro codigo.");
        }
    }
    let windowStart = nowMs;
    let requestCount = 0;
    if (current === null || current === void 0 ? void 0 : current.requestWindowStart) {
        const elapsedWindow = nowMs - current.requestWindowStart.toMillis();
        if (elapsedWindow < 60 * 60 * 1000) {
            windowStart = current.requestWindowStart.toMillis();
            requestCount = (_b = current.requestCount) !== null && _b !== void 0 ? _b : 0;
        }
    }
    if (requestCount >= OTP_MAX_PER_HOUR) {
        throw new functions.https.HttpsError("resource-exhausted", "Limite de solicitacoes atingido. Tente novamente mais tarde.");
    }
    const code = String((0, crypto_1.randomInt)(100000, 1000000));
    await otpRef.set({
        phoneE164: phone.e164,
        codeHash: codeHash(code),
        expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + OTP_TTL_MS),
        attempts: 0,
        used: false,
        lastSentAt: admin.firestore.Timestamp.fromMillis(nowMs),
        requestWindowStart: admin.firestore.Timestamp.fromMillis(windowStart),
        requestCount: requestCount + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await sendWhatsappOtpMessage(phone.digits, code);
    return {
        success: true,
        phone: phone.e164,
        expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    };
});
exports.verifyWhatsappOtp = functions
    .region("southamerica-east1")
    .https.onCall(async (data) => {
    var _a, _b, _c, _d, _e;
    const phone = normalizePhone(String((_a = data === null || data === void 0 ? void 0 : data.phone) !== null && _a !== void 0 ? _a : ""));
    const code = String((_b = data === null || data === void 0 ? void 0 : data.code) !== null && _b !== void 0 ? _b : "").replace(/\D/g, "");
    if (code.length !== 6) {
        throw new functions.https.HttpsError("invalid-argument", "Codigo invalido.");
    }
    const db = admin.firestore();
    const otpRef = db.doc(`auth_otps/${phone.digits}`);
    const otpSnap = await otpRef.get();
    if (!otpSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Codigo nao encontrado.");
    }
    const otp = otpSnap.data();
    if (otp.used) {
        throw new functions.https.HttpsError("failed-precondition", "Codigo ja utilizado.");
    }
    if (Date.now() > otp.expiresAt.toMillis()) {
        throw new functions.https.HttpsError("deadline-exceeded", "Codigo expirado.");
    }
    if (((_c = otp.attempts) !== null && _c !== void 0 ? _c : 0) >= OTP_MAX_ATTEMPTS) {
        throw new functions.https.HttpsError("resource-exhausted", "Muitas tentativas invalidas. Solicite um novo codigo.");
    }
    if (otp.codeHash !== codeHash(code)) {
        await otpRef.update({
            attempts: admin.firestore.FieldValue.increment(1),
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError("permission-denied", "Codigo invalido.");
    }
    await otpRef.update({
        used: true,
        attempts: admin.firestore.FieldValue.increment(1),
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const phoneIndexRef = db.doc(`auth_phone_index/${phone.digits}`);
    const indexSnap = await phoneIndexRef.get();
    let uid = "";
    let isNewUser = false;
    if (indexSnap.exists) {
        uid = String((_e = (_d = indexSnap.data()) === null || _d === void 0 ? void 0 : _d.uid) !== null && _e !== void 0 ? _e : "");
    }
    else {
        try {
            const existing = await admin.auth().getUserByPhoneNumber(phone.e164);
            uid = existing.uid;
        }
        catch (_f) {
            const created = await admin.auth().createUser({
                phoneNumber: phone.e164,
            });
            uid = created.uid;
            isNewUser = true;
        }
        await phoneIndexRef.set({
            uid,
            phoneE164: phone.e164,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    await db.doc(`users/${uid}`).set({
        uid,
        phone: phone.e164,
        phoneVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const hasProfile = Boolean((userData === null || userData === void 0 ? void 0 : userData.username) && userData.username.trim().length > 0);
    let customToken = "";
    try {
        customToken = await admin.auth().createCustomToken(uid, {
            phoneAuth: true,
        });
    }
    catch (error) {
        functions.logger.error("Failed to create custom token", { error, uid });
        throw new functions.https.HttpsError("failed-precondition", "Servidor sem permissao IAM para emitir token de login.");
    }
    return {
        success: true,
        uid,
        customToken,
        hasProfile,
        isNewUser,
    };
});
//# sourceMappingURL=whatsappOtp.js.map