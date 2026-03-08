import * as admin from "firebase-admin";

// Initialize Firebase Admin (only once)
admin.initializeApp();

// onUserCreated: creates base user doc + 1,000 Q$ welcome bonus.
// Onboarding page merges profile fields (username, avatar) with merge:true.
export { onUserCreated } from "./users/onUserCreated";

export { dailyLoginReward } from "./users/dailyLoginReward";
export { onBetCreated } from "./events/onBetCreated";
export { resolveEvent } from "./events/resolveEvent";
export { recordSponsoredImpression } from "./events/recordSponsoredImpression";
export { redeemShopItem } from "./shop/redeemShopItem";
export { claimAdReward } from "./ads/claimAdReward";
export { calculateRankings } from "./rankings/calculateRankings";
export { calculateSeasonRankings } from "./rankings/calculateSeasonRankings";
export { joinGroupByCode } from "./groups/joinGroupByCode";
export { purchaseGoldPackage } from "./gold/purchaseGoldPackage";
export { captureEconomySnapshot } from "./economy/captureEconomySnapshot";
export { monitorEconomyAlerts } from "./economy/monitorEconomyAlerts";
export { detectSuspiciousAccounts } from "./security/detectSuspiciousAccounts";
export { requestWhatsappOtp, verifyWhatsappOtp } from "./auth/whatsappOtp";
