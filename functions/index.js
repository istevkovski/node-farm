const functions = require('firebase-functions');
const express = require('express');
const url = require('url');
const admin = require('firebase-admin');
const fs = require('fs');

// 3rd party modules
const slugify = require('slugify');

// Own modules
// const replaceTemplate = require('../modules/replaceTemplate');
replaceTemplate = (temp, product) => {
    let output = temp.replace(/{%PRODUCTNAME%}/g, product.productName);
    output = output.replace(/{%IMAGE%}/g, product.image);
    output = output.replace(/{%PRICE%}/g, product.price);
    output = output.replace(/{%FROM%}/g, product.from);
    output = output.replace(/{%NUTRIENTS%}/g, product.nutrients);
    output = output.replace(/{%QUANTITY%}/g, product.quantity);
    output = output.replace(/{%DESCRIPTION%}/g, product.description);
    output = output.replace(/{%ID%}/g, product.id);
    output = output.replace(/{%PRODUCT_SLUG%}/g, slugify(product.productName, {lower: true}));
    
    if(!product.organic)
        output = output.replace(/{%NOT_ORGANIC%}/g, 'not-organic');
    return output;
}

// Loading templates - Top level code (synchronous - blocking)
const templateOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf-8');
const templateCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf-8');
const templateProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf-8');

// Variable for storing recipes data (Firestore Collection)
let recipes = [];
// Loading data from Firebase Firestore
let serviceAccount = require('./nodejsfarm-firebase-adminsdk-cutf8-c029c43dd9.json');

// Authenticating the server with Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Pulling data from collection and pushing it into variable
// ready for processing later.
db.collection('recipes').orderBy("id", "asc").get()
    .then((promise) => {
        promise.forEach(recipe => {
            recipes.push(recipe.data());
        });
    }).catch((err) => {
        console.log(err);
    });


const app = express();
// Root Page
app.get('/', async (req, res) => {
    res.set('Cache-Control', 'must-revalidate, max-age=0, s-maxage=300');
    const cardsHtml = recipes.map(el => replaceTemplate(templateCard, el)).join('');
    const output = templateOverview.replace('{%PRODUCT_CARD%}', cardsHtml);
    res.send(output);
});

// Overview Page
app.get('/overview', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    const cardsHtml = recipes.map(el => replaceTemplate(templateCard, el)).join('');
    const output = templateOverview.replace('{%PRODUCT_CARD%}', cardsHtml);
    res.send(output);
});

// Product Page
app.get('/product', (req, res) => {
    const {query} = url.parse(req.url, true);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    const product = recipes.find((el) => slugify(el.productName, {lower: true}) === slugify(query.id, {lower: true}));
    const output = replaceTemplate(templateProduct, product);
    res.send(output);
});


exports.app = functions.https.onRequest(app);