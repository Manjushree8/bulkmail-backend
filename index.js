const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const EmailRecord = require("./models/EmailRecord");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BulkMail backend is running ");
});

// MongoDB Connection
mongoose.connect("mongodb+srv://manjushree0228:Manju%402025@cluster0.aybteuu.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log(" Connected to MongoDB"))
  .catch(() => console.log(" Failed to connect to MongoDB"));

// Credential collection
const credential = mongoose.model("credential", {}, "bulkmail");

// Send Email
app.post("/sendemail", function (req, res) {
  const subject = req.body.subject || "A message from BulkMail";
  const msg = req.body.msg;
  const emailList = req.body.emailList;

  console.log(" Email list received:", emailList);

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
            subject: subject,
            text: msg,
          }, function (error, info) {
            if (error) {
              console.log(" Failed to send to:", emailList[i], error);
            } else {
              console.log(" Sent to:", emailList[i]);
            }
          });
        }

        await EmailRecord.create({
          subject: subject,
          body: msg,
          recipients: emailList,
          status: "Success",
        });

        resolve("success");
      } catch (error) {
        console.log(" Sending error:", error);

        await EmailRecord.create({
          subject: subject,
          body: msg,
          recipients: emailList,
          status: "Failed",
        });

        reject("failed");
      }
    })
      .then(() => res.send(true))
      .catch(() => res.send(false));

  }).catch((error) => {
    console.log(" Credential Fetch Error:", error);
    res.send(false);
  });
});

// Get Email History
app.get("/emailhistory", async (req, res) => {
  try {
    const records = await EmailRecord.find().sort({ createdAt: -1 });
    res.send(records);
  } catch (err) {
    res.status(500).send("Error fetching history");
  }
});

// Delete Email History by ID

app.delete("/emailhistory/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid ID format" });
    }

    const deleted = await EmailRecord.findByIdAndDelete(id);

    if (deleted) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, message: "Record not found" });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: "Error deleting record" });
  }
});


// Server
app.listen(5000, function () {
  console.log(" Server Started on port 5000");
});
