// Core modules
const fs = require('fs');
const http = require('http');
const url = require('url');
const admin = require('firebase-admin');

// 3rd party modules
const slugify = require('slugify');

// Own modules
const replaceTemplate = require('./modules/replaceTemplate');


// Loading templates - Top level code (synchronous - blocking)
const templateOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf-8');
const templateCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf-8');
const templateProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf-8');

/*
    Reading directly from file
*/
// Loading api data - Top level code (synchronous - blocking)
// const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
// const dataObj = JSON.parse(data);

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
    .then(promise => {
        promise.forEach(doc => {
            recipes.push(doc.data());
        });
    })
    .catch(err => {
        console.log('Error getting documents', err);
    });
    
/*
    Code for writing to database
*/
// let docRef = db.collection('recipes').doc('Fresh Avocados');
// let setAvocado = docRef.set({
//     id: 1,
//     productName: 'Goat and Sheep Cheese',
//     image: "🥑",
//     from: "Spain",
//     nutrients: "Vitamin B, Vitamin K",
//     quantity: "4 🥑",
//     price: "6.50",
//     organic: true,
//     description: "A ripe avocado yields to gentle pressure when held in the palm of the hand and squeezed. The fruit is not sweet, but distinctly and subtly flavored, with smooth texture. The avocado is popular in vegetarian cuisine as a substitute for meats in sandwiches and salads because of its high fat content. Generally, avocado is served raw, though some cultivars, including the common 'Hass', can be cooked for a short time without becoming bitter. It is used as the base for the Mexican dip known as guacamole, as well as a spread on corn tortillas or toast, served with spices."
// });

// db.collection('recipes').get()
//     .then(snapshot => {
//         snapshot.forEach((doc) => {
//             console.log(doc.id, '=>', doc.data());
//         });
//     })
//     .catch(err => {
//         console.log('Error getting documents', err);
//     });

// User requests - asynchrounous - non-blocking
const server = http.createServer((req, res) => {
    const {query, pathname} = url.parse(req.url, true);

    // Overview Page
    if (pathname === '/' || pathname === '/overview') {
        res.writeHead(200, {'content-type': 'text/html'});
        const cardsHtml = recipes.map(el => replaceTemplate(templateCard, el)).join('');
        const output = templateOverview.replace('{%PRODUCT_CARD%}', cardsHtml);
        res.end(output);
        
        //Product Page
    } else if (pathname === '/product') {
        res.writeHead(200, {'content-type': 'text/html'});
        const product = recipes.find((el) => slugify(el.productName, {lower: true}) === slugify(query.id, {lower: true}));
        const output = replaceTemplate(templateProduct, product);
        res.end(output);

        // API
    } else if (pathname === '/api') {
        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(data);

        // Not Found
    } else {
        res.writeHead(404, {
            'Content-type': 'text/html',
            'my-own-header': 'hello-world'
        });
        res.end('<h1>Error 404: Page not found.</h1>');
    }
});

server.listen(3000, 'localhost');
// server.listen(process.env.PORT);