//import dotenv from 'dotenv';
//dotenv.config();
//require('dotenv').config();

//import 'dotenv/config';
const {config} = require('dotenv').config();

//console.log("ENV: " + JSON.stringify(process.env));

const { MongoClient, ServerApiVersion } = require('mongodb');

//const uri = process.env['MONGODB_URI']; // SEE: https://dev.to/kvetoslavnovak/connect-to-mongodb-atlas-from-sveltekit-25hg
//const uri = "mongodb+srv://mtyson:sukisue123@cluster0.smfbz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

//console.log("VITE: " + import.meta.env.VITE_MESSAGE);
//

process.env.MONGODB_URI
const uri = process.env["MONGODB_URI"];
console.warn("MONGODB_URI: " + uri);

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}

let client
let clientPromise

if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local')
}

/*
if (process.env['NODE_ENV'] === 'development') {
    // In development mode, use a global variable 
    // so that the value is preserved across module reloads 
    // caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
	console.log("***** uri: " + uri);
        client = new MongoClient(uri, options)
        //global._mongoClientPromise = client.connect()
    }
    //clientPromise = global._mongoClientPromise
} else {
    // In production mode, it's best to 
    // not use a global variable.
    client = new MongoClient(uri, options)
    //clientPromise = client.connect()
    
}
*/

//client = new MongoClient(uri, options)
// Export a module-scoped MongoClient promise. 
// By doing this in a separate module, 
// the client can be shared across functions.
exports.client = new MongoClient(uri, options)
