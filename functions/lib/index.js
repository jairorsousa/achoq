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
exports.verifyWhatsappOtp = exports.requestWhatsappOtp = exports.detectSuspiciousAccounts = exports.monitorEconomyAlerts = exports.captureEconomySnapshot = exports.purchaseGoldPackage = exports.joinGroupByCode = exports.calculateSeasonRankings = exports.calculateRankings = exports.claimAdReward = exports.redeemShopItem = exports.recordSponsoredImpression = exports.resolveEvent = exports.onBetCreated = exports.dailyLoginReward = exports.onUserCreated = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin (only once)
admin.initializeApp();
// onUserCreated: creates base user doc + 1,000 Q$ welcome bonus.
// Onboarding page merges profile fields (username, avatar) with merge:true.
var onUserCreated_1 = require("./users/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var dailyLoginReward_1 = require("./users/dailyLoginReward");
Object.defineProperty(exports, "dailyLoginReward", { enumerable: true, get: function () { return dailyLoginReward_1.dailyLoginReward; } });
var onBetCreated_1 = require("./events/onBetCreated");
Object.defineProperty(exports, "onBetCreated", { enumerable: true, get: function () { return onBetCreated_1.onBetCreated; } });
var resolveEvent_1 = require("./events/resolveEvent");
Object.defineProperty(exports, "resolveEvent", { enumerable: true, get: function () { return resolveEvent_1.resolveEvent; } });
var recordSponsoredImpression_1 = require("./events/recordSponsoredImpression");
Object.defineProperty(exports, "recordSponsoredImpression", { enumerable: true, get: function () { return recordSponsoredImpression_1.recordSponsoredImpression; } });
var redeemShopItem_1 = require("./shop/redeemShopItem");
Object.defineProperty(exports, "redeemShopItem", { enumerable: true, get: function () { return redeemShopItem_1.redeemShopItem; } });
var claimAdReward_1 = require("./ads/claimAdReward");
Object.defineProperty(exports, "claimAdReward", { enumerable: true, get: function () { return claimAdReward_1.claimAdReward; } });
var calculateRankings_1 = require("./rankings/calculateRankings");
Object.defineProperty(exports, "calculateRankings", { enumerable: true, get: function () { return calculateRankings_1.calculateRankings; } });
var calculateSeasonRankings_1 = require("./rankings/calculateSeasonRankings");
Object.defineProperty(exports, "calculateSeasonRankings", { enumerable: true, get: function () { return calculateSeasonRankings_1.calculateSeasonRankings; } });
var joinGroupByCode_1 = require("./groups/joinGroupByCode");
Object.defineProperty(exports, "joinGroupByCode", { enumerable: true, get: function () { return joinGroupByCode_1.joinGroupByCode; } });
var purchaseGoldPackage_1 = require("./gold/purchaseGoldPackage");
Object.defineProperty(exports, "purchaseGoldPackage", { enumerable: true, get: function () { return purchaseGoldPackage_1.purchaseGoldPackage; } });
var captureEconomySnapshot_1 = require("./economy/captureEconomySnapshot");
Object.defineProperty(exports, "captureEconomySnapshot", { enumerable: true, get: function () { return captureEconomySnapshot_1.captureEconomySnapshot; } });
var monitorEconomyAlerts_1 = require("./economy/monitorEconomyAlerts");
Object.defineProperty(exports, "monitorEconomyAlerts", { enumerable: true, get: function () { return monitorEconomyAlerts_1.monitorEconomyAlerts; } });
var detectSuspiciousAccounts_1 = require("./security/detectSuspiciousAccounts");
Object.defineProperty(exports, "detectSuspiciousAccounts", { enumerable: true, get: function () { return detectSuspiciousAccounts_1.detectSuspiciousAccounts; } });
var whatsappOtp_1 = require("./auth/whatsappOtp");
Object.defineProperty(exports, "requestWhatsappOtp", { enumerable: true, get: function () { return whatsappOtp_1.requestWhatsappOtp; } });
Object.defineProperty(exports, "verifyWhatsappOtp", { enumerable: true, get: function () { return whatsappOtp_1.verifyWhatsappOtp; } });
//# sourceMappingURL=index.js.map