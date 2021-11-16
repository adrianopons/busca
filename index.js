const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const config = require('./config.json');
const puppeteerUtils = require('./utils/puppeteerUtils');

const TelegramBot = require('node-telegram-bot-api');
const TOKEN = '2132898383:AAGrzfRyEfgFnUX80_k4Kwi3TRixszmSVGM';
const bot = new TelegramBot(TOKEN, { polling: true });

async function iniciarBusca(produtoBusca) {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        args: [`--window-size=1920,1080`],
        defaultViewport: {
            width:1920,
            height:1080
        }
    });
    const page = await browser.newPage();
    const arrScreenshots = [];
    for (let idxSite = 0; idxSite < config.sites.length; idxSite++) {
        const site = config.sites[idxSite];

        console.log(`Acessando o site ${site.nome}`);
        await page.goto(site.url);
        await page.waitForSelector(site.seletores.idCampoBusca);

        console.log(`Escrevendo no campo de busca '${produtoBusca}'`);
        await page.type(site.seletores.idCampoBusca, produtoBusca);
        await page.waitForTimeout(3000);
        await page.keyboard.press('Enter');
        
        await puppeteerUtils.aguardarPorClass(page, site.seletores.classGridItensBuscados);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: `${site.nome}.png` });
        arrScreenshots.push(`${site.nome}.png`);
    }

    await browser.close();
    return arrScreenshots;
}

(async () => {
    
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        console.log(msg.text.toUpperCase());
        if (msg.text.toUpperCase().indexOf("PRODUTO=") > -1) {
            let produto = msg.text.split('=');
            produto = produto[1];
            bot.sendMessage(chatId, `Aguarde um momento.... consultando ${produto}`);
            const arrScreenshots = await iniciarBusca(produto);
            for (let idxScreenshot = 0; idxScreenshot < arrScreenshots.length; idxScreenshot++) {
                const screenshot = arrScreenshots[idxScreenshot];
                bot.sendPhoto(chatId, screenshot);
            }
            console.log('Busca efetuada');
        } else {
            // send a message to the chat acknowledging receipt of their message
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Digite PRODUTO=PRODUTO_DA_BUSCA',
                                    // we shall check for this value when we listen
                                    // for "callback_query"
                                callback_data: 'edit'
                            }
                        ]
                    ]
                }
            };

            bot.sendMessage(chatId, 'Seja bem vindo ao bot para busca de preço.', opts);
        
        }
    });


    //Handle callback queries
    // bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    //   const action = callbackQuery.data;
    //   const msg = callbackQuery.message;
    //   const opts = {
    //     chat_id: msg.chat.id,
    //     message_id: msg.message_id,
    //   };
    //   let text;
    
    //   if (action === 'edit') {
    //     text = `Produto: ${msg}`;
    //   }
    
    //   bot.editMessageText(text, opts);
    // });


    // bot.onText(/PRODUTO=/, (msg, match) => {
    //     // 'msg' is the received Message from Telegram
    //     // 'match' is the result of executing the regexp above on the text content
    //     // of the message
      
    //     const chatId = msg.chat.id;
    //     // const resp = match[1]; // the captured "whatever"
      
    //     // send back the matched "whatever" to the chat
    //     bot.sendMessage(chatId, 'vai buscar');
    // });

})();

