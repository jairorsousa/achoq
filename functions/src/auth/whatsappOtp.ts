import { createHash, randomInt } from "crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { defineString } from "firebase-functions/params";

const ZAPI_INSTANCE = defineString("ZAPI_INSTANCE");
const ZAPI_TOKEN = defineString("ZAPI_TOKEN");
const ZAPI_CLIENT_TOKEN = defineString("ZAPI_CLIENT_TOKEN");
const ZAPI_BASE_URL = defineString("ZAPI_BASE_URL");
const WHATSAPP_OTP_PEPPER = defineString("WHATSAPP_OTP_PEPPER");

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 6;

type OtpDoc = {
  phoneE164: string;
  codeHash: string;
  expiresAt: admin.firestore.Timestamp;
  attempts: number;
  used: boolean;
  lastSentAt: admin.firestore.Timestamp;
  requestWindowStart: admin.firestore.Timestamp;
  requestCount: number;
};

function readOptionalParam(param: { value: () => string }): string | undefined {
  try {
    const value = param.value()?.trim();
    return value ? value : undefined;
  } catch {
    return undefined;
  }
}

function normalizePhone(raw: string): { e164: string; digits: string } {
  let digits = String(raw ?? "").replace(/\D/g, "");

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

function codeHash(code: string): string {
  const pepper =
    process.env.WHATSAPP_OTP_PEPPER ??
    readOptionalParam(WHATSAPP_OTP_PEPPER) ??
    "change-this-pepper";
  return createHash("sha256").update(`${code}:${pepper}`).digest("hex");
}

async function sendWhatsappOtpMessage(phoneDigits: string, code: string): Promise<void> {
  const instance = process.env.ZAPI_INSTANCE ?? readOptionalParam(ZAPI_INSTANCE);
  const token = process.env.ZAPI_TOKEN ?? readOptionalParam(ZAPI_TOKEN);
  const clientToken =
    process.env.ZAPI_CLIENT_TOKEN ?? readOptionalParam(ZAPI_CLIENT_TOKEN);
  const baseUrl =
    process.env.ZAPI_BASE_URL ??
    readOptionalParam(ZAPI_BASE_URL) ??
    "https://api.z-api.io";

  if (!instance || !token || !clientToken) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Z-API nao configurada no backend."
    );
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
    throw new functions.https.HttpsError(
      "unavailable",
      `Falha Z-API (${response.status}). Verifique instance/token/clientToken.`
    );
  }
}

export const requestWhatsappOtp = functions
  .region("southamerica-east1")
  .https.onCall(async (data: { phone?: string }) => {
    const phone = normalizePhone(String(data?.phone ?? ""));
    const nowMs = Date.now();

    const db = admin.firestore();
    const otpRef = db.doc(`auth_otps/${phone.digits}`);
    const snap = await otpRef.get();
    const current = snap.exists ? (snap.data() as OtpDoc) : null;

    if (current?.lastSentAt) {
      const sinceLastSend = nowMs - current.lastSentAt.toMillis();
      if (sinceLastSend < OTP_COOLDOWN_MS) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Aguarde alguns segundos para solicitar outro codigo."
        );
      }
    }

    let windowStart = nowMs;
    let requestCount = 0;
    if (current?.requestWindowStart) {
      const elapsedWindow = nowMs - current.requestWindowStart.toMillis();
      if (elapsedWindow < 60 * 60 * 1000) {
        windowStart = current.requestWindowStart.toMillis();
        requestCount = current.requestCount ?? 0;
      }
    }
    if (requestCount >= OTP_MAX_PER_HOUR) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Limite de solicitacoes atingido. Tente novamente mais tarde."
      );
    }

    const code = String(randomInt(100000, 1000000));

    await otpRef.set(
      {
        phoneE164: phone.e164,
        codeHash: codeHash(code),
        expiresAt: admin.firestore.Timestamp.fromMillis(nowMs + OTP_TTL_MS),
        attempts: 0,
        used: false,
        lastSentAt: admin.firestore.Timestamp.fromMillis(nowMs),
        requestWindowStart: admin.firestore.Timestamp.fromMillis(windowStart),
        requestCount: requestCount + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await sendWhatsappOtpMessage(phone.digits, code);

    return {
      success: true,
      phone: phone.e164,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    };
  });

export const verifyWhatsappOtp = functions
  .region("southamerica-east1")
  .https.onCall(async (data: { phone?: string; code?: string }) => {
    const phone = normalizePhone(String(data?.phone ?? ""));
    const code = String(data?.code ?? "").replace(/\D/g, "");
    if (code.length !== 6) {
      throw new functions.https.HttpsError("invalid-argument", "Codigo invalido.");
    }

    const db = admin.firestore();
    const otpRef = db.doc(`auth_otps/${phone.digits}`);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Codigo nao encontrado.");
    }
    const otp = otpSnap.data() as OtpDoc;

    if (otp.used) {
      throw new functions.https.HttpsError("failed-precondition", "Codigo ja utilizado.");
    }
    if (Date.now() > otp.expiresAt.toMillis()) {
      throw new functions.https.HttpsError("deadline-exceeded", "Codigo expirado.");
    }
    if ((otp.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Muitas tentativas invalidas. Solicite um novo codigo."
      );
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
      uid = String(indexSnap.data()?.uid ?? "");
    } else {
      try {
        const existing = await admin.auth().getUserByPhoneNumber(phone.e164);
        uid = existing.uid;
      } catch {
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

    await db.doc(`users/${uid}`).set(
      {
        uid,
        phone: phone.e164,
        phoneVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.exists ? userDoc.data() as { username?: string } : null;
    const hasProfile = Boolean(userData?.username && userData.username.trim().length > 0);

    let customToken = "";
    try {
      customToken = await admin.auth().createCustomToken(uid, {
        phoneAuth: true,
      });
    } catch (error) {
      functions.logger.error("Failed to create custom token", { error, uid });
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Servidor sem permissao IAM para emitir token de login."
      );
    }

    return {
      success: true,
      uid,
      customToken,
      hasProfile,
      isNewUser,
    };
  });
