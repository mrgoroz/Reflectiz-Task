import MongoClient from "mongodb";
import fetch from "node-fetch";
import { siteData } from "./siteData";

const mongoUrl = "mongodb://127.0.0.1:27017";

const ON_ANALYSIS = "onAnalysis";
const ANALYZED = "analyzed";

const VIRUS_TOTAL_API = "https://www.virustotal.com/vtapi/v2/url/scan";
const VT_KEY = "";

let sites: MongoClient.Collection<siteData>;

MongoClient.connect(
  mongoUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) {
      return console.log(err);
    }

    const db = client.db("sites");
    sites = db.collection("sites");

    console.log(`MongoDB Connected: ${mongoUrl}`);
    get_urls_on_analysis_status(sites);
    get_urls_on_month_old(sites);
  }
);

const get_urls_on_analysis_status = (
  sites: MongoClient.Collection<siteData>
) => {
  setInterval(async () => {
    await sites.find({ status: ON_ANALYSIS }).toArray((err, result) => {
      if (err) {
        throw err;
      }
      result.forEach(async (s) => await analyze_url(s.domain));
    });
  }, 1000);
};

const get_urls_on_month_old = (sites: MongoClient.Collection<siteData>) => {
  setInterval(async () => {
    await sites
      .find({ ts: { $lte: Date.now() - 60 * 60 * 24 * 30 } })
      .toArray((err, result) => {
        if (err) {
          throw err;
        }
        result.forEach(async (s) => {
          await analyze_url(s.domain);
        });
      });
  }, 1000);
};

const analyze_url = async (domain: string) => {
  console.log(`analyzing ${domain}`);
  const body = { apikey: VT_KEY, url: domain };
  await fetch(VIRUS_TOTAL_API, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    body: JSON.stringify(body), // body data type must match "Content-Type" header
  })
    // .then((data) => data.json())
    .then(async (data) => {
      await sites.updateOne(
        { domain: domain },
        {
          $set: { status: ANALYZED, ts: Date.now(), VTData: data },
        },
        { upsert: true }
      );
    })
    .catch((err) => {
      console.log(err);
    });
};
