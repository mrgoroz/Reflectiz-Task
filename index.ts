import express from "express";
import MongoClient from "mongodb";
import { siteData } from "./siteData";

const app = express();
let sites: MongoClient.Collection<siteData>;

const ON_ANALYSIS = "onAnalysis";

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

const mongoUrl = "mongodb://127.0.0.1:27017";

MongoClient.connect(
  mongoUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) throw err;

    const db = client.db("sites");
    sites = db.collection("sites");

    console.log(`MongoDB Connected: ${mongoUrl}`);
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  }
);

app.get("/", (req: { query: { domain: string } }, res) => {
  const url = req.query.domain;
  sites.findOne({ url: url }, (err, result) => {
    if (err) throw err;
    if (result && "VTData" in result) {
      if ("VTData" in result) {
        return res.json({
          domain: url,
          VTData: result.VTData,
          WhoisData: result.WhoisData,
        });
      }
      return res.json({ domain: url, status: ON_ANALYSIS });
    } else {
      sites.updateOne(
        { domain: url },
        { $set: { status: ON_ANALYSIS, ts: Date.now() } }
      );
      res.json({ domain: url, status: ON_ANALYSIS });
    }
  });
});

app.post("/", (req: { body: { domain: string } }, res) => {
  const url = req.body.domain;
  sites.updateOne(
    { domain: url },
    { $set: { status: ON_ANALYSIS, ts: Date.now() } },
    { upsert: true }
  );
  res.json({ domain: url, status: ON_ANALYSIS });
});

const PORT = process.env.PORT || 5000;
