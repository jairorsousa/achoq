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
exports.calculateRankings = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
// Runs every Sunday at 23:00 BRT (02:00 UTC Monday)
exports.calculateRankings = functions
    .region("southamerica-east1")
    .pubsub.schedule("0 2 * * 1")
    .timeZone("America/Sao_Paulo")
    .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const period = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    // Fetch all users
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((d) => (Object.assign({ uid: d.id }, d.data())));
    // Sort by xp descending
    const sorted = [...users].sort((a, b) => { var _a, _b; return ((_a = b.xp) !== null && _a !== void 0 ? _a : 0) - ((_b = a.xp) !== null && _b !== void 0 ? _b : 0); });
    const batch = db.batch();
    const globalEntries = sorted.slice(0, 100).map((u, idx) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            rank: idx + 1,
            userId: u.uid,
            username: u.username,
            photoURL: (_a = u.photoURL) !== null && _a !== void 0 ? _a : null,
            level: (_b = u.level) !== null && _b !== void 0 ? _b : 1,
            xp: (_c = u.xp) !== null && _c !== void 0 ? _c : 0,
            coins: (_d = u.coins) !== null && _d !== void 0 ? _d : 0,
            winRate: u.totalBets && u.totalBets > 0
                ? Math.round((((_e = u.totalWins) !== null && _e !== void 0 ? _e : 0) / u.totalBets) * 100)
                : 0,
            totalBets: (_f = u.totalBets) !== null && _f !== void 0 ? _f : 0,
        });
    });
    const rankRef = db.doc(`rankings/${period}_geral`);
    batch.set(rankRef, {
        period,
        category: "geral",
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        entries: globalEntries,
    });
    await batch.commit();
    functions.logger.info(`Rankings calculated for period ${period}: ${globalEntries.length} entries`);
});
function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return String(weekNo).padStart(2, "0");
}
//# sourceMappingURL=calculateRankings.js.map