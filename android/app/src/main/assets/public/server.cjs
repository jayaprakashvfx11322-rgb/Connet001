var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var DATABASE_FILE = import_path.default.join(process.cwd(), "server_db.json");
app.use(import_express.default.json());
function getInitialDatabase() {
  return {
    config: {
      revenueSharePercent: 80,
      // % to Creator, 20% to Platform
      platformCpm: 2.5,
      // Base CPM per 1000 impressions in USD
      minimumWithdrawalAmount: 5
      // Configurable limit in USD
    },
    wallets: {
      "user_kavin": {
        id: "user_kavin",
        username: "kavin_23",
        displayName: "Kavin",
        balance: 3125.46,
        pendingEarnings: 154.2,
        totalPaid: 1200,
        adImpressions: 542e3
      },
      "user_priya": {
        id: "user_priya",
        username: "priya_vibe",
        displayName: "Priya",
        balance: 4520.12,
        pendingEarnings: 235.5,
        totalPaid: 2100,
        adImpressions: 894e3
      },
      "user_anu": {
        id: "user_anu",
        username: "anu_creative",
        displayName: "Anu",
        balance: 1450.8,
        pendingEarnings: 82.4,
        totalPaid: 850,
        adImpressions: 43e4
      },
      "DemoUser": {
        id: "DemoUser",
        username: "cx_pilot",
        displayName: "Demo Creator",
        balance: 845.2,
        pendingEarnings: 34.1,
        totalPaid: 120,
        adImpressions: 124e3
      }
    },
    withdrawals: [
      {
        id: "w_init_1",
        creatorId: "user_kavin",
        username: "kavin_23",
        amount: 350,
        method: "PayPal",
        address: "kavin@gmail.com",
        status: "approved",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
        payoutDetails: { batch_status: "SUCCESS", payout_batch_id: "PA_XM1289BB9" }
      },
      {
        id: "w_init_2",
        creatorId: "user_priya",
        username: "priya_vibe",
        amount: 150,
        method: "UPI",
        address: "priya@okhdfc",
        status: "pending",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1e3).toISOString()
      }
    ],
    logs: [
      {
        id: "l_init_1",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1050).toISOString(),
        type: "config_change",
        message: "System initialization set CPM to $2.50 USD and Revenue share to 80%."
      },
      {
        id: "l_init_2",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
        type: "payout_approved",
        creatorId: "user_kavin",
        amount: 350,
        message: "Withdrawal w_init_1 for $350.00 approved & released via PayPal."
      },
      {
        id: "l_init_3",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1e3).toISOString(),
        type: "withdrawal_request",
        creatorId: "user_priya",
        amount: 150,
        message: "Priya requested $150.00 payout clearance via UPI (priya@okhdfc)."
      }
    ]
  };
}
function readDB() {
  if (!import_fs.default.existsSync(DATABASE_FILE)) {
    const fresh = getInitialDatabase();
    writeDB(fresh);
    return fresh;
  }
  try {
    const content = import_fs.default.readFileSync(DATABASE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to read database file, reloading safe copy", e);
    return getInitialDatabase();
  }
}
function writeDB(data) {
  try {
    import_fs.default.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write database file", e);
  }
}
function getOrCreateWallet(db, creatorId, username = "creator_node", displayName = "Creator Node") {
  if (!db.wallets[creatorId]) {
    db.wallets[creatorId] = {
      id: creatorId,
      username,
      displayName,
      balance: 10,
      pendingEarnings: 0,
      totalPaid: 0,
      adImpressions: 0
    };
  }
  return db.wallets[creatorId];
}
app.post("/api/monetization/impressions", (req, res) => {
  const { creatorId, username, displayName, views } = req.body;
  if (!creatorId) {
    return res.status(400).json({ error: "creatorId is required" });
  }
  const batchViews = Number(views) || 0;
  if (batchViews <= 0) {
    return res.status(400).json({ error: "Views must be greater than zero" });
  }
  const db = readDB();
  const wallet = getOrCreateWallet(db, creatorId, username, displayName);
  wallet.adImpressions += batchViews;
  const config = db.config;
  const CPM = config.platformCpm;
  const revShare = config.revenueSharePercent / 100;
  const grossAdRevenue = batchViews / 1e3 * CPM;
  const creatorEarningsShare = grossAdRevenue * revShare;
  wallet.pendingEarnings = parseFloat((wallet.pendingEarnings + creatorEarningsShare).toFixed(4));
  const logId = "log_" + Date.now() + Math.floor(Math.random() * 1e3);
  const newLog = {
    id: logId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "impression",
    creatorId,
    amount: parseFloat(creatorEarningsShare.toFixed(4)),
    message: `Tracked ${batchViews} ad impressions for @${wallet.username}. Gross: $${grossAdRevenue.toFixed(4)}, Net: $${creatorEarningsShare.toFixed(4)}`
  };
  db.logs.unshift(newLog);
  writeDB(db);
  res.json({ success: true, wallet, loggedRevenue: creatorEarningsShare });
});
app.get("/api/monetization/wallet/:userId", (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const username = req.query.username || "user";
  const displayName = req.query.displayName || "User";
  const wallet = getOrCreateWallet(db, userId, username, displayName);
  const creatorWithdrawals = db.withdrawals.filter((w) => w.creatorId === userId);
  res.json({
    wallet,
    withdrawals: creatorWithdrawals,
    config: db.config
  });
});
app.post("/api/monetization/withdraw", (req, res) => {
  const { creatorId, username, displayName, amount, method, address, paymentDetails } = req.body;
  if (!creatorId || !amount || !method || !address) {
    return res.status(400).json({ error: "Missing required parameters. Amount, Method, and Destination are required." });
  }
  const amountNum = parseFloat(amount);
  const db = readDB();
  if (amountNum < db.config.minimumWithdrawalAmount) {
    return res.status(400).json({
      error: `Payout request denied. The cashout amount $${amountNum.toFixed(2)} is less than the configurable administrative minimum threshold of $${db.config.minimumWithdrawalAmount.toFixed(2)}.`
    });
  }
  const wallet = getOrCreateWallet(db, creatorId, username, displayName);
  if (wallet.balance < amountNum) {
    return res.status(400).json({ error: "Insufficient balance available to proceed with this cashout transfer request." });
  }
  const hasPending = db.withdrawals.some((w) => w.creatorId === creatorId && w.status === "pending");
  if (hasPending) {
    return res.status(400).json({ error: "A security block is active. You already have a withdrawal request pending approval. Please wait for the current request to clear." });
  }
  wallet.balance = parseFloat((wallet.balance - amountNum).toFixed(2));
  wallet.pendingEarnings = parseFloat((wallet.pendingEarnings + amountNum).toFixed(4));
  const wId = "w_" + Date.now() + Math.floor(Math.random() * 100);
  const newWithdrawal = {
    id: wId,
    creatorId,
    username: wallet.username,
    amount: amountNum,
    method,
    // UPI, PayPal, Bank
    address,
    // UPI ID, PayPal Email, Bank Account Number
    paymentDetails: paymentDetails || {},
    status: "pending",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.withdrawals.unshift(newWithdrawal);
  const logId = "log_" + Date.now();
  const newLog = {
    id: logId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "withdrawal_request",
    creatorId,
    amount: amountNum,
    message: `@${wallet.username} submitted withdrawal request ${wId} for $${amountNum.toFixed(2)} via ${method} (${address}). Funds stored in escrow.`
  };
  db.logs.unshift(newLog);
  writeDB(db);
  res.json({
    success: true,
    withdrawal: newWithdrawal,
    wallet,
    message: "Withdrawal request transmitted successfully to platform governance controllers."
  });
});
app.get("/api/monetization/admin/creators", (req, res) => {
  const db = readDB();
  res.json(Object.values(db.wallets));
});
app.get("/api/monetization/admin/withdrawals", (req, res) => {
  const db = readDB();
  res.json(db.withdrawals);
});
app.get("/api/monetization/admin/logs", (req, res) => {
  const db = readDB();
  res.json(db.logs);
});
app.post("/api/monetization/admin/config", (req, res) => {
  const { revenueSharePercent, platformCpm, minimumWithdrawalAmount } = req.body;
  const db = readDB();
  db.config.revenueSharePercent = Number(revenueSharePercent) || 80;
  db.config.platformCpm = Number(platformCpm) || 2.5;
  db.config.minimumWithdrawalAmount = Number(minimumWithdrawalAmount) || 5;
  const logId = "log_" + Date.now();
  const newLog = {
    id: logId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "config_change",
    message: `Admin adjusted revenue settings: Share=${db.config.revenueSharePercent}%, CPM=$${db.config.platformCpm.toFixed(2)}, Min=$${db.config.minimumWithdrawalAmount.toFixed(2)}`
  };
  db.logs.unshift(newLog);
  writeDB(db);
  res.json({ success: true, config: db.config });
});
async function triggerRealPayPalPayout(payoutRequest) {
  const { amount, address, id } = payoutRequest;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal Client credentials configured check: Fail. Setup client credentials in settings to allow live clearances.");
  }
  const authUrl = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com/v1/oauth2/token" : "https://api-m.sandbox.paypal.com/v1/oauth2/token";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const authResponse = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!authResponse.ok) {
    const errText = await authResponse.text();
    throw new Error(`PayPal OAuth Access Token Request Failed: ${errText}`);
  }
  const authData = await authResponse.json();
  const accessToken = authData.access_token;
  const payoutsUrl = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com/v1/payments/payouts" : "https://api-m.sandbox.paypal.com/v1/payments/payouts";
  const payoutPayload = {
    sender_batch_header: {
      sender_batch_id: `batch_${id}_${Date.now()}`,
      email_subject: "ConnectX Creator Revenue Release",
      email_message: `Your accrued creator vault earnings of $${amount.toFixed(2)} have been released!`,
      recipient_type: "EMAIL"
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency: "USD"
        },
        note: `Revenue release clearance code: ${id}`,
        receiver: address,
        sender_item_id: `item_${id}`
      }
    ]
  };
  const payoutResponse = await fetch(payoutsUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payoutPayload)
  });
  if (!payoutResponse.ok) {
    const errText = await payoutResponse.text();
    throw new Error(`PayPal Payout Dispatch API call failed: ${errText}`);
  }
  return await payoutResponse.json();
}
async function triggerRealRazorpayPayout(payoutRequest) {
  const { amount, method, address, paymentDetails } = payoutRequest;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const xAccountNumber = process.env.RAZORPAY_X_ACCOUNT_NUMBER;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay API details missing. Please establish credentials first inside administrative settings.");
  }
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const contactPayload = {
    name: payoutRequest.username,
    email: `${payoutRequest.username}@connectx-creator.com`,
    contact: paymentDetails?.phone || "9999999999",
    type: "employee",
    reference_id: payoutRequest.creatorId,
    notes: { reason: "Creator vault payout node link" }
  };
  const contactResponse = await fetch("https://api.razorpay.com/v1/contacts", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(contactPayload)
  });
  if (!contactResponse.ok) {
    const errText = await contactResponse.text();
    throw new Error(`Razorpay X Contact node creation failed: ${errText}`);
  }
  const contactData = await contactResponse.json();
  const contactId = contactData.id;
  let fundAccountPayload = {
    contact_id: contactId,
    account_type: method === "UPI" ? "vpa" : "bank_account"
  };
  if (method === "UPI") {
    fundAccountPayload.vpa = { address };
  } else {
    fundAccountPayload.bank_account = {
      name: paymentDetails?.holderName || payoutRequest.username,
      ifsc: paymentDetails?.ifsc || "HDFC0000012",
      account_number: address
    };
  }
  const fundResponse = await fetch("https://api.razorpay.com/v1/fund_accounts", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(fundAccountPayload)
  });
  if (!fundResponse.ok) {
    const errText = await fundResponse.text();
    throw new Error(`Razorpay X Fund account map error: ${errText}`);
  }
  const fundData = await fundResponse.json();
  const fundAccountId = fundData.id;
  const amountInPaise = Math.round(amount * 100 * 83);
  const payoutPayload = {
    account_number: xAccountNumber || "78787878787878",
    // fallback sandbox number representing active testing bounds
    fund_account_id: fundAccountId,
    amount: amountInPaise,
    currency: "INR",
    mode: method === "UPI" ? "UPI" : "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: payoutRequest.id,
    notes: { releaseCode: payoutRequest.id }
  };
  const payoutResponse = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payoutPayload)
  });
  if (!payoutResponse.ok) {
    const errText = await payoutResponse.text();
    throw new Error(`Razorpay X clearance payout execution endpoint returned an error: ${errText}`);
  }
  return await payoutResponse.json();
}
app.post("/api/monetization/admin/payout/approve", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Withdrawal Request ID is required" });
  }
  const db = readDB();
  const withdrawalRequest = db.withdrawals.find((w) => w.id === id);
  if (!withdrawalRequest) {
    return res.status(404).json({ error: "Clearance target payout request not located inside archive logs." });
  }
  if (withdrawalRequest.status !== "pending") {
    return res.status(400).json({ error: "This withdrawal target has already been approved or rejected previously." });
  }
  const creatorId = withdrawalRequest.creatorId;
  const wallet = db.wallets[creatorId];
  if (!wallet) {
    return res.status(404).json({ error: "Owner creator account wallet not configured inside database files." });
  }
  let realPayoutLoggedSuccess = false;
  let responseMetadata = null;
  let exceptionErrorStr = null;
  try {
    if (withdrawalRequest.method === "PayPal") {
      if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        responseMetadata = await triggerRealPayPalPayout(withdrawalRequest);
        realPayoutLoggedSuccess = true;
      } else {
        console.warn("Sandbox mode active: Local PayPal Developer credentials absent. Simulating seamless payout clearing.");
      }
    } else if (withdrawalRequest.method === "UPI" || withdrawalRequest.method === "Bank") {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        responseMetadata = await triggerRealRazorpayPayout(withdrawalRequest);
        realPayoutLoggedSuccess = true;
      } else {
        console.warn("Sandbox mode active: Razorpay account credentials absent. Executing simulated Indian UPI clearance node.");
      }
    }
  } catch (err) {
    exceptionErrorStr = err.message || "Unknown Payment Network Error";
    console.error("Real payout transfer error occurred:", err);
    withdrawalRequest.error = exceptionErrorStr;
    return res.status(502).json({
      error: `Payout clearance failed. Gateway reported an error: ${exceptionErrorStr}. Securely aborted. Check keys in developer settings.`
    });
  }
  const cashAmount = withdrawalRequest.amount;
  wallet.pendingEarnings = parseFloat(Math.max(0, wallet.pendingEarnings - cashAmount).toFixed(4));
  wallet.totalPaid = parseFloat((wallet.totalPaid + cashAmount).toFixed(2));
  withdrawalRequest.status = "approved";
  withdrawalRequest.payoutDetails = responseMetadata || {
    mock_cleared: true,
    cleared_at_time: (/* @__PURE__ */ new Date()).toISOString(),
    auth_network: "ConnectX Secure Sandbox Escrow"
  };
  const logId = "log_" + Date.now();
  const transactionMessage = realPayoutLoggedSuccess ? `SUCCESS: Cleared real transaction ${withdrawalRequest.id} for $${cashAmount.toFixed(2)} using production gateway channel. Status: ACTIVE.` : `SECURE SIMULATOR: Cleared sandbox test payout for @${wallet.username} ($${cashAmount.toFixed(2)}) using active verified clearance mechanisms.`;
  const newLog = {
    id: logId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "payout_approved",
    creatorId,
    amount: cashAmount,
    message: transactionMessage
  };
  db.logs.unshift(newLog);
  writeDB(db);
  res.json({
    success: true,
    withdrawal: withdrawalRequest,
    wallet,
    message: realPayoutLoggedSuccess ? `Clearance transaction executed! Real-time money routed to chosen account.` : "Simulation authorization approved! Simulated transaction logs validated successfully."
  });
});
app.post("/api/monetization/admin/payout/reject", (req, res) => {
  const { id, reason } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Withdrawal Request ID is required" });
  }
  const db = readDB();
  const withdrawalRequest = db.withdrawals.find((w) => w.id === id);
  if (!withdrawalRequest) {
    return res.status(404).json({ error: "Payout request not located inside archive index." });
  }
  if (withdrawalRequest.status !== "pending") {
    return res.status(400).json({ error: "This withdrawal target has already been approved or rejected previously." });
  }
  const creatorId = withdrawalRequest.creatorId;
  const wallet = db.wallets[creatorId];
  if (wallet) {
    const cashAmount = withdrawalRequest.amount;
    wallet.pendingEarnings = parseFloat(Math.max(0, wallet.pendingEarnings - cashAmount).toFixed(4));
    wallet.balance = parseFloat((wallet.balance + cashAmount).toFixed(2));
  }
  withdrawalRequest.status = "rejected";
  withdrawalRequest.payoutDetails = {
    rejected_at: (/* @__PURE__ */ new Date()).toISOString(),
    reason: reason || "Details verification failed"
  };
  const logId = "log_" + Date.now();
  const newLog = {
    id: logId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: "payout_rejected",
    creatorId,
    amount: withdrawalRequest.amount,
    message: `REJECTED: Withdrawal w_id=${id} for $${withdrawalRequest.amount.toFixed(2)} rejected. Reason: "${reason || "Details verification failed"}". Funds returned to active creator balance.`
  };
  db.logs.unshift(newLog);
  writeDB(db);
  res.json({
    success: true,
    withdrawal: withdrawalRequest,
    wallet,
    message: "Withdrawal requested has been securely rejected. Funds restored to creator balance."
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ConnectX Server] Listening on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
