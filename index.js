"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var mongodb_1 = __importDefault(require("mongodb"));
var app = express_1.default();
var sites;
var ON_ANALYSIS = "onAnalysis";
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.use(express_1.default.json());
var mongoUrl = "mongodb://127.0.0.1:27017";
mongodb_1.default.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, function (err, client) {
    if (err)
        throw err;
    var db = client.db("sites");
    sites = db.collection("sites");
    console.log("MongoDB Connected: " + mongoUrl);
    app.listen(PORT, function () { return console.log("Server started on port " + PORT); });
});
app.get("/", function (req, res) {
    var url = req.query.domain;
    sites.findOne({ url: url }, function (err, result) {
        if (err)
            throw err;
        if (result && "VTData" in result) {
            if ("VTData" in result) {
                return res.json({
                    domain: url,
                    VTData: result.VTData,
                    WhoisData: result.WhoisData,
                });
            }
            return res.json({ domain: url, status: ON_ANALYSIS });
        }
        else {
            sites.updateOne({ domain: url }, { $set: { status: ON_ANALYSIS, ts: Date.now() } });
            res.json({ domain: url, status: ON_ANALYSIS });
        }
    });
});
app.post("/", function (req, res) {
    var url = req.body.domain;
    sites.updateOne({ domain: url }, { $set: { status: ON_ANALYSIS, ts: Date.now() } }, { upsert: true });
    res.json({ domain: url, status: ON_ANALYSIS });
});
var PORT = process.env.PORT || 5000;
//# sourceMappingURL=index.js.map