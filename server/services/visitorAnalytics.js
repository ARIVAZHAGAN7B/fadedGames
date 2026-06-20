import "../config/env.js";
import crypto from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORAGE_PATH = path.resolve(__dirname, "../data/visitor-analytics.json");
const STORAGE_PATH = process.env.ANALYTICS_STORAGE_PATH || DEFAULT_STORAGE_PATH;
const SESSION_TIMEOUT_MS = Number(process.env.ANALYTICS_SESSION_TIMEOUT_MS || 30 * 60 * 1000);
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "viewCount";
const ANALYTICS_COLLECTION_NAME = process.env.ANALYTICS_COLLECTION_NAME || "fadedGame";
const MONGODB_SERVER_SELECTION_TIMEOUT_MS = Number(
  process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000
);
const MAX_VISITOR_ID_LENGTH = 128;
const MAX_PATH_LENGTH = 200;
const TOP_PATH_LIMIT = 10;
const TOTALS_DOCUMENT_ID = "analytics:totals";

let analyticsCache = null;
let mongoClientPromise = null;
let mongoIndexPromise = null;
let mongoFailureLogged = false;

function createEmptyDay() {
  return {
    pageViews: 0,
    visits: 0,
    uniqueVisitors: 0
  };
}

function createEmptyStore() {
  return {
    totals: createEmptyDay(),
    days: {},
    paths: {},
    visitors: {},
    updatedAt: null
  };
}

function createInputError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeCounter(value) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

function normalizeStore(store) {
  const normalized = createEmptyStore();
  const source = store && typeof store === "object" ? store : {};

  normalized.totals = {
    pageViews: normalizeCounter(source.totals?.pageViews),
    visits: normalizeCounter(source.totals?.visits),
    uniqueVisitors: normalizeCounter(source.totals?.uniqueVisitors)
  };
  normalized.days = source.days && typeof source.days === "object" ? source.days : {};
  normalized.paths = source.paths && typeof source.paths === "object" ? source.paths : {};
  normalized.visitors =
    source.visitors && typeof source.visitors === "object" ? source.visitors : {};
  normalized.updatedAt = typeof source.updatedAt === "string" ? source.updatedAt : null;

  return normalized;
}

function readStore() {
  if (analyticsCache) {
    return analyticsCache;
  }

  if (!existsSync(STORAGE_PATH)) {
    analyticsCache = createEmptyStore();
    return analyticsCache;
  }

  try {
    analyticsCache = normalizeStore(JSON.parse(readFileSync(STORAGE_PATH, "utf8")));
  } catch {
    analyticsCache = createEmptyStore();
  }

  return analyticsCache;
}

function writeStore(store) {
  mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
  const temporaryPath = `${STORAGE_PATH}.tmp`;

  writeFileSync(temporaryPath, `${JSON.stringify(store, null, 2)}\n`);
  renameSync(temporaryPath, STORAGE_PATH);
}

function cleanVisitorId(visitorId) {
  const clean = String(visitorId || "").trim();

  if (clean.length < 8 || clean.length > MAX_VISITOR_ID_LENGTH) {
    return null;
  }

  return clean;
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cleanPathname(pathname) {
  const clean = String(pathname || "/").trim() || "/";
  return clean.slice(0, MAX_PATH_LENGTH);
}

function getDateKey(now) {
  return now.toISOString().slice(0, 10);
}

function getDay(store, dateKey) {
  if (!store.days[dateKey]) {
    store.days[dateKey] = createEmptyDay();
  }

  return store.days[dateKey];
}

function hasSessionExpired(lastVisitAt, now) {
  if (!lastVisitAt) {
    return true;
  }

  const previousTime = Date.parse(lastVisitAt);

  if (!Number.isFinite(previousTime)) {
    return true;
  }

  return now.getTime() - previousTime >= SESSION_TIMEOUT_MS;
}

function trackPath(store, pathname) {
  const cleanPath = cleanPathname(pathname);
  const entry = store.paths[cleanPath] || { pageViews: 0 };

  entry.pageViews = normalizeCounter(entry.pageViews) + 1;
  store.paths[cleanPath] = entry;
}

function summarizeTopPaths(paths) {
  return Object.entries(paths || {})
    .map(([pathname, entry]) => ({
      path: pathname,
      pageViews: normalizeCounter(entry?.pageViews)
    }))
    .sort((first, second) => second.pageViews - first.pageViews)
    .slice(0, TOP_PATH_LIMIT);
}

function hasMongoConfig() {
  return Boolean(MONGODB_URI);
}

function getMongoClient() {
  if (!mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS
    });

    mongoClientPromise = client.connect().then(() => client).catch((error) => {
      mongoClientPromise = null;
      throw error;
    });
  }

  return mongoClientPromise;
}

async function getAnalyticsCollection() {
  const client = await getMongoClient();
  const collection = client.db(MONGODB_DB_NAME).collection(ANALYTICS_COLLECTION_NAME);

  if (!mongoIndexPromise) {
    mongoIndexPromise = Promise.all([
      collection.createIndex({ type: 1, pageViews: -1 }),
      collection.createIndex({ type: 1, date: -1 })
    ])
      .then(() => undefined)
      .catch((error) => {
        mongoIndexPromise = null;
        throw error;
      });
  }

  await mongoIndexPromise;
  return collection;
}

function logMongoFailure(action, error) {
  if (mongoFailureLogged) {
    return;
  }

  mongoFailureLogged = true;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MongoDB analytics ${action} failed: ${message}`);
}

function buildCounterIncrement({
  pageViews = 0,
  visits = 0,
  uniqueVisitors = 0
} = {}) {
  const increment = {};

  if (pageViews) {
    increment.pageViews = pageViews;
  }

  if (visits) {
    increment.visits = visits;
  }

  if (uniqueVisitors) {
    increment.uniqueVisitors = uniqueVisitors;
  }

  return increment;
}

function summarizeCounterDocument(document, base = {}) {
  return {
    ...base,
    ...createEmptyDay(),
    pageViews: normalizeCounter(document?.pageViews),
    visits: normalizeCounter(document?.visits),
    uniqueVisitors: normalizeCounter(document?.uniqueVisitors)
  };
}

function recordVisitToFile({ visitorId, pathname = "/", now = new Date() } = {}) {
  const cleanId = cleanVisitorId(visitorId);

  if (!cleanId) {
    throw createInputError("A valid visitor id is required.");
  }

  const store = readStore();
  const dateKey = getDateKey(now);
  const timestamp = now.toISOString();
  const day = getDay(store, dateKey);
  const visitorHash = hashValue(cleanId);
  const existingVisitor = store.visitors[visitorHash] || null;
  const isNewVisitor = !existingVisitor;
  const visitor = existingVisitor || {
    firstSeenAt: timestamp,
    lastSeenAt: timestamp,
    lastVisitAt: null,
    visitCount: 0,
    days: {}
  };
  const isNewVisit = hasSessionExpired(visitor.lastVisitAt, now);
  const isNewDailyVisitor = !visitor.days?.[dateKey];

  store.totals.pageViews += 1;
  day.pageViews += 1;
  trackPath(store, pathname);

  if (isNewVisitor) {
    store.totals.uniqueVisitors += 1;
  }

  if (isNewDailyVisitor) {
    day.uniqueVisitors += 1;
  }

  if (isNewVisit) {
    store.totals.visits += 1;
    day.visits += 1;
    visitor.visitCount = normalizeCounter(visitor.visitCount) + 1;
    visitor.lastVisitAt = timestamp;
  }

  visitor.days = visitor.days && typeof visitor.days === "object" ? visitor.days : {};
  visitor.days[dateKey] = true;
  visitor.lastSeenAt = timestamp;
  store.visitors[visitorHash] = visitor;
  store.updatedAt = timestamp;

  writeStore(store);

  return {
    pageViewRecorded: true,
    newVisit: isNewVisit,
    newVisitor: isNewVisitor
  };
}

function getFileAnalyticsSummary(now = new Date()) {
  const store = readStore();
  const dateKey = getDateKey(now);

  return {
    updatedAt: store.updatedAt,
    today: {
      date: dateKey,
      ...createEmptyDay(),
      ...(store.days[dateKey] || {})
    },
    totals: {
      ...createEmptyDay(),
      ...store.totals
    },
    topPaths: summarizeTopPaths(store.paths)
  };
}

async function recordVisitToMongo({ visitorId, pathname = "/", now = new Date() } = {}) {
  const cleanId = cleanVisitorId(visitorId);

  if (!cleanId) {
    throw createInputError("A valid visitor id is required.");
  }

  const collection = await getAnalyticsCollection();
  const client = await getMongoClient();
  const session = client.startSession();
  const dateKey = getDateKey(now);
  const timestamp = now.toISOString();
  const cleanPath = cleanPathname(pathname);
  const visitorHash = hashValue(cleanId);
  const visitorDocumentId = `visitor:${visitorHash}`;
  const pathDocumentId = `path:${hashValue(cleanPath)}`;
  let result = null;

  try {
    await session.withTransaction(
      async () => {
        const existingVisitor = await collection.findOne(
          { _id: visitorDocumentId },
          { session }
        );
        const isNewVisitor = !existingVisitor;
        const isNewVisit = hasSessionExpired(existingVisitor?.lastVisitAt, now);
        const isNewDailyVisitor = !existingVisitor?.days?.[dateKey];
        const totalIncrement = buildCounterIncrement({
          pageViews: 1,
          visits: isNewVisit ? 1 : 0,
          uniqueVisitors: isNewVisitor ? 1 : 0
        });
        const dailyIncrement = buildCounterIncrement({
          pageViews: 1,
          visits: isNewVisit ? 1 : 0,
          uniqueVisitors: isNewDailyVisitor ? 1 : 0
        });
        const visitorUpdate = {
          $setOnInsert: {
            firstSeenAt: timestamp
          },
          $set: {
            type: "visitor",
            visitorHash,
            lastSeenAt: timestamp,
            updatedAt: timestamp,
            [`days.${dateKey}`]: true
          }
        };

        if (isNewVisit) {
          visitorUpdate.$set.lastVisitAt = timestamp;
          visitorUpdate.$inc = { visitCount: 1 };
        }

        await collection.updateOne(
          { _id: visitorDocumentId },
          visitorUpdate,
          { upsert: true, session }
        );
        await collection.updateOne(
          { _id: TOTALS_DOCUMENT_ID },
          {
            $setOnInsert: { type: "totals" },
            $inc: totalIncrement,
            $set: { updatedAt: timestamp }
          },
          { upsert: true, session }
        );
        await collection.updateOne(
          { _id: `day:${dateKey}` },
          {
            $setOnInsert: { type: "day", date: dateKey },
            $inc: dailyIncrement,
            $set: { updatedAt: timestamp }
          },
          { upsert: true, session }
        );
        await collection.updateOne(
          { _id: pathDocumentId },
          {
            $setOnInsert: { type: "path", path: cleanPath },
            $inc: { pageViews: 1 },
            $set: { updatedAt: timestamp }
          },
          { upsert: true, session }
        );

        result = {
          pageViewRecorded: true,
          newVisit: isNewVisit,
          newVisitor: isNewVisitor
        };
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" }
      }
    );
  } finally {
    await session.endSession();
  }

  return result;
}

async function getMongoAnalyticsSummary(now = new Date()) {
  const collection = await getAnalyticsCollection();
  const dateKey = getDateKey(now);
  const [totalsDocument, todayDocument, topPathDocuments] = await Promise.all([
    collection.findOne({ _id: TOTALS_DOCUMENT_ID }),
    collection.findOne({ _id: `day:${dateKey}` }),
    collection
      .find({ type: "path" }, { projection: { path: 1, pageViews: 1 } })
      .sort({ pageViews: -1 })
      .limit(TOP_PATH_LIMIT)
      .toArray()
  ]);

  return {
    updatedAt: totalsDocument?.updatedAt || null,
    today: summarizeCounterDocument(todayDocument, { date: dateKey }),
    totals: summarizeCounterDocument(totalsDocument),
    topPaths: topPathDocuments.map((document) => ({
      path: document.path || "/",
      pageViews: normalizeCounter(document.pageViews)
    }))
  };
}

export async function recordVisit({ visitorId, pathname = "/", now = new Date() } = {}) {
  if (!hasMongoConfig()) {
    return recordVisitToFile({ visitorId, pathname, now });
  }

  try {
    return await recordVisitToMongo({ visitorId, pathname, now });
  } catch (error) {
    if (!error?.statusCode) {
      logMongoFailure("record visit", error);
    }

    throw error;
  }
}

export async function getAnalyticsSummary(now = new Date()) {
  if (!hasMongoConfig()) {
    return getFileAnalyticsSummary(now);
  }

  try {
    return await getMongoAnalyticsSummary(now);
  } catch (error) {
    logMongoFailure("summary read", error);
    throw error;
  }
}

export async function closeAnalyticsStore() {
  analyticsCache = null;
  mongoIndexPromise = null;

  if (!mongoClientPromise) {
    return;
  }

  const clientPromise = mongoClientPromise;
  mongoClientPromise = null;
  const client = await clientPromise.catch(() => null);

  if (client) {
    await client.close();
  }
}
