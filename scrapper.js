const cron = require('node-cron');
const puppeter = require('puppeteer');
require('dotenv').config();
const mongoose = require("mongoose");

const baseUrl = 'https://www.linkedin.com/';
const links = ['rajiaabdelaziz', 'darian-bhathena', 'danilolucari', 'ngellner', 'sixped', 'davidezequielgranados', 'andrejvajagic', 'sahilbhatiya', 'stenrs', 'alexghattas'];

const { Schema } = mongoose;
const Person = mongoose.model("Person", new Schema({
    name:  String,
    imgUrl: String
  }));

mongoose.connect(process.env.MONGODB_URI);

cron.schedule('*/4 * * * *', async () => {
    try {
        console.log('start');
        const browser = await puppeter.launch({ headless: false });
        const loginPage = await browser.newPage();

        //Login
        await loginPage.goto(baseUrl+'login/');
        await loginPage.type('#username', process.env.LINKEDIN_LOGIN);
        await loginPage.type('#password', process.env.LINKEDIN_PASSWORD);
        await loginPage.click('.login__form button')
        await loginPage.waitForNavigation();

        // await delay(10000);

        // Get cookies
        const cookies = await loginPage.cookies();

        //Collect data
        const persons = [];
        // for(const link of links) {

        // }

        await Promise.all(links.map(async (link) => {
            const personPage = await browser.newPage();
            await personPage.setCookie(...cookies)
            await personPage.goto(baseUrl+'in/'+ link);           

            const fullNameObj = await personPage.$('.text-heading-xlarge');
            const fullName = await (await fullNameObj.getProperty('textContent')).jsonValue();

            const imgObj = await personPage.$('.pv-top-card-profile-picture .pv-top-card-profile-picture__image.pv-top-card-profile-picture__image--show');
            const imgSrc = await (await imgObj.getProperty('src')).jsonValue();
   
            persons.push({name: fullName, imgUrl: imgSrc});

            //Connect
            if (await personPage.$(`#main > section.artdeco-card.ember-view.pv-top-card > div.ph5.pb5 > div.pv-top-card-v2-ctas.display-flex.pt2 > div > div.pvs-profile-actions__action > button`) === null){
                return;
            }
            await personPage.click(`#main > section.artdeco-card.ember-view.pv-top-card > div.ph5.pb5 > div.pv-top-card-v2-ctas.display-flex.pt2 > div > div.pvs-profile-actions__action > button`);
            if (await personPage.$('#artdeco-modal-outlet > div > div > div.artdeco-modal__actionbar.ember-view.text-align-right > button.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view.ml1') == null){
                return;
            }
            await personPage.click('#artdeco-modal-outlet > div > div > div.artdeco-modal__actionbar.ember-view.text-align-right > button.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view.ml1');
          }));

          await browser.close()

        //Store to Mongo
        Person.insertMany(persons, async (err)=>{
            if(err){
                console.log(err);
            }
        });

        console.log('end');
    } catch(err){
        console.log(err);
    }
});

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }