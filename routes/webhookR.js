const express = require("express");
const crypto = require("crypto");
const order = require("../model/order");

const router = express.Router();

router.post("/flutterwave/webhook", express.raw({ type: "*/*" }), async (req, res) => {
    try {
        // 1️⃣ VERIFY WEBHOOK SIGNATURE
        const secretHash = process.env.FLW_WEBHOOK_SECRET; // You set this in Flutterwave Dashboard
        const signature = req.headers["verif-hash"];

        if (!signature || signature !== secretHash) {
            console.log("❌ Invalid Webhook Signature");
            return res.status(401).send("Invalid signature");
        }

        // 2️⃣ PARSE RAW BODY
        const payload = JSON.parse(req.body.toString());
        console.log("🔥 Webhook Received:", payload);

        const event = payload.event;
        const txRef = payload.data?.tx_ref;
        const status = payload.data?.status;

        if (!txRef) {
            return res.status(400).send("Missing tx_ref");
        }

        // 3️⃣ FIND ORDER IN DB
        const existingOrder = await order.findOne({ txRef });

        if (!existingOrder) {
            console.log("⚠️ Order not found for txRef:", txRef);
            return res.status(404).send("Order not found");
        }

        // 4️⃣ HANDLE EVENT TYPE CORRECTLY
        if (event === "charge.completed") {
            if (status === "successful") {
                if (existingOrder.status !== "successful") {
                    existingOrder.status = "successful";
                    await existingOrder.save();
                }
                console.log("✅ Order updated to successful");
            } else {
                existingOrder.status = "failed";
                await existingOrder.save();
                console.log("❌ Payment failed");
            }
        }

        return res.status(200).send("Webhook received");

    } catch (err) {
        console.log("Webhook Error:", err);
        return res.status(500).send("Server error");
    }
});

module.exports = router;
