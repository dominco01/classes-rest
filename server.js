/*
jak w remindersach
	LOGIN: https://www.opengraph.io/
	THEN TEST: curl https://opengraph.io/api/1.1/site/{URl}?app_id=${KEY}
	ON URL: 
	100 requestow / month
*/

const https = require('https')
const { response } = require('express');
var express = require('express');
var app = express();
var fs = require("fs");
const path = require('path');

const SERVER_PORT = 3000;
const API_KEY= "a37c154f-704b-4d67-9005-9b184b38ccf4"

var my_api_keys = [];

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/home.html'));
});

app.post('/key', function(req, res) {
   let new_api_key = {key:generate_api_key(),limit:10}
   my_api_keys.push(new_api_key)
   console.log(my_api_keys);
   res.json({key:new_api_key.key});
});

app.get('/form',async function (req, res) {

   if(!req.query.url || !req.query.type )
      return res.json({ error: 'Wrong parameters!' });
   if(!validURL(req.query.url))
    return res.json({ error: "Invalid URL!" });

   var key = req.query.api_key;

   let temp = my_api_keys.filter(api_keys=>api_keys.key===key)[0];
   if (temp===undefined || temp===null)
   {
      return res.json({ error: 'Wrong API key!' });
   }
   else if(temp.limit==0)
   {
      my_api_keys = my_api_keys.filter(api_keys=>api_keys.key!==key);

      return res.json({ error: 'Key expired!' });
   }

   my_api_keys = my_api_keys.map((api_key) =>{return {key:api_key.key,limit:(api_key.key===key?api_key.limit-1:api_key.limit)}});
   console.log(my_api_keys)   

  var url = req.query.url;
  var type = req.query.type;

  console.log("Fetching url: "+url)

  if(!url.startsWith("https")) url = "https://"+url;
  url = encode(url);
  
   var publicUrl = `https://opengraph.io/api/1.1/site/${url}?app_id=${API_KEY}`

   https.get(publicUrl,res2 => {
      let data = '';
      res2.on('data', chunk => {
        data += chunk;
      });
      res2.on('end', () => {
         data = JSON.parse(data);

         console.log(data.openGraph);

         if(data.openGraph.error)
         {
            res.send(`
               <div>No OpenGraph Tags Found <div>`)
            return;
         }
         switch (type){
            case "image":
               res.send(`
                  <img src="${data.openGraph.image.url}">`)
               break;
            case "title":
               res.send(`
               <div>
               ${data.openGraph.title}
               <div>`)
               break;
            case "description":
               res.send(`
               <div>
               ${data.openGraph.description}
               <div>`)
               break;
            case "all":
               res.send(`
               <div>
               ${data.openGraph.site_name?(data.openGraph.site_name+" - "):""}
               ${data.openGraph.title}
               <div>
               <div>
               ${data.openGraph.description}
               <div>
               <div>
               <img src="${data.openGraph.image.url}">
               <div>`)
               break;
            default:
               res.send(`
               <div>
               Hello World
               <div>`)
               break;
               
         }
      })
      
    }).on('error', err => {
      console.log(err.message);
      return res.json({ error: 'External api error!' });
     
    })
})

app.listen(SERVER_PORT);
console.log('Server started at http://localhost:' + SERVER_PORT);


//EXTRAS

function generate_api_key() {
   let length = 10;
   let result = '';
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   const charactersLength = characters.length;
   let counter = 0;
   while (counter < length) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
     counter += 1;
   }
   return result;
}

function encode(str)
{
    return encodeURIComponent(str)
    .replace('!', '%21')
    .replace('\'', '%27')
    .replace('(', '%28')
    .replace(')', '%29')
    .replace('*', '%2A')
    .replace('%20', '+');
}

function validURL(str) {
   var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
     '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
     '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
     '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
     '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
   return !!pattern.test(str);
 }