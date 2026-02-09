"use strict";
/**
 * MongoDB connection for marketplace UI data: job postings, employer profiles,
 * tenant requests, credential analysis config, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoDb = getMongoDb;
exports.closeMongoDb = closeMongoDb;
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
let client = null;
let db = null;
async function getMongoDb() {
    if (db)
        return db;
    client = new mongodb_1.MongoClient(config_1.mongoConfig.uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(config_1.mongoConfig.database);
    return db;
}
async function closeMongoDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
