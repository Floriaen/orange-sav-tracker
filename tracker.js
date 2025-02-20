import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Pushover from 'pushover-notifications';
dotenv.config();

const TRACKING_URL = 'https://suivi-sav-orange.sbeglobalservice.com/';

const isCron = process.env.CRON === 'true' || !process.stdout.isTTY;
const logger = {
    info: (msg) => console.log(new Date().toISOString() + ' [INFO]: ' + msg),
    warn: (msg) => console.log(new Date().toISOString() + ' [WARN]: ' + msg),
    error: (msg) => console.log(new Date().toISOString() + ' [ERROR]: ' + msg)
};

const pushover = new Pushover({
    token: process.env.PUSHOVER_TOKEN,
    user: process.env.PUSHOVER_USER
});

const sendNotification = (msgText) => {
    const msg = {
        message: msgText,
        title: "Tracking Update",
        sound: "magic",
        priority: 1
    };

    pushover.send(msg, (err, result) => {
        if (err) {
            logger.error(`Error sending notification: ${err}`);
        } else {
            logger.info(`Notification sent: ${result}`);
        }
    });
};

const filePath = path.join(process.cwd(), 'last_tracking_info.txt');
let lastTrackingInfo = '';
if (fs.existsSync(filePath)) {
    lastTrackingInfo = fs.readFileSync(filePath, 'utf-8').trim();
}

(async () => {
    logger.info("Script execution started");

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        await page.goto(TRACKING_URL, { waitUntil: 'networkidle2' });
        logger.info("Page loaded successfully");
    } catch (error) {
        logger.error(`Failed to load page: ${error}`);
        await browser.close();
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    logger.info('Form submission...');
    const inputFields = await page.$$('input.textBox');
    if (inputFields.length >= 2) {
        await inputFields[0].type(process.env.ORDER_ID, { delay: 100 });
        await inputFields[1].type(process.env.POSTAL_CODE, { delay: 100 });
        logger.info("Form fields filled");
    } else {
        logger.warn("No form fields found");
        await browser.close();
        return;
    }

    const submitButton = await page.$('button');
    if (submitButton) {
        await page.evaluate(button => {
            button.scrollIntoView();
            button.click();
        }, submitButton);
        logger.info("Form submitted");

        try {
            await page.waitForSelector('.result-container, .gwt-Label', { timeout: 15000 });
            logger.info("Tracking result updated");
        } catch (error) {
            logger.warn("Page reload triggered due to timeout");
            await page.reload({ waitUntil: 'networkidle2' });
        }
    } else {
        logger.error("Form submission button not found");
        await browser.close();
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    logger.info('Retrieving data...');
    let rawContent = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div, p, span'))
            .map(el => el.innerText.trim())
            .filter(text => text.length > 0);
    });

    const currentTrackingInfo = rawContent.length > 0 ? rawContent[0] : '';

    if (currentTrackingInfo === lastTrackingInfo) {
        logger.info("No new tracking updates");
    } else {
        if (currentTrackingInfo) {
            logger.info(`New tracking info: ${currentTrackingInfo}`);
            fs.writeFileSync(filePath, currentTrackingInfo, 'utf-8');
            sendNotification(`New tracking update: ${currentTrackingInfo}`);
        } else {
            logger.warn("No valid tracking info retrieved.");
        }
    }

    await browser.close();
    logger.info("Script execution finished");
})();