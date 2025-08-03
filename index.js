const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const EmailRecord = require("./models/EmailRecord"); // Make sure this file exists

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://manjushree0228:Manju%402025@cluster0.aybteuu.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0")
  .then(function () {
    console.log("✅ Connected to MongoDB");
  })
  .catch(function () {
    console.log("❌ Failed to connect to MongoDB");
  });

// Credential collection (for email & app password)
const credential = mongoose.model("credential", {}, "bulkmail");

// Send Email Route
app.post("/sendemail", function (req, res) {
  const msg = req.body.msg;
  const emailList = req.body.emailList;

  console.log("📨 Email list received:", emailList);

  credential.find().then(function (data) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: data[0].toJSON().user,
        pass: data[0].toJSON().pass,
      },
    });

    new Promise(async function (resolve, reject) {
      try {
        for (let i = 0; i < emailList.length; i++) {
          await transporter.sendMail({
            from: "manjushreekpm08@gmail.com",
            to: emailList[i],
            subject: "A message from BulkMail",
            text: msg,
          }, function (error, info) {
            if (error) {
              console.log("❌ Failed to send to:", emailList[i], error);
            } else {
              console.log("✅ Sent to:", emailList[i]);
            }
          });
        }

        // Save to DB - Success
        await EmailRecord.create({
          subject: "A message from BulkMail",
          body: msg,
          recipients: emailList,
          status: "Success",
        });

        resolve("success");
      } catch (error) {
        console.log("❌ Sending error:", error);

        // Save to DB - Failure
        await EmailRecord.create({
          subject: "A message from BulkMail",
          body: msg,
          recipients: emailList,
          status: "Failed",
        });

        reject("failed");
      }
    })
      .then(function () {
        res.send(true);
      })
      .catch(function () {
        res.send(false);
      });

  }).catch(function (error) {
    console.log("❌ Credential Fetch Error:", error);
    res.send(false);
  });
});

// Email History Route
app.get("/emailhistory", async (req, res) => {
  try {
    const records = await EmailRecord.find().sort({ createdAt: -1 });
    res.send(records);
  } catch (err) {
    res.status(500).send("Error fetching history");
  }
});

// Server Start
app.listen(5000, function () {
  console.log("🚀 Server Started on port 5000");
});
