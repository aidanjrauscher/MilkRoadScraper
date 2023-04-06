import puppeteer from "puppeteer";
import fs from "fs"

const url = "https://milkroad.com/news"

// //*[@id="news"]/div/div[1]/div[1]/a/div[2]/p
const getNewsletters = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });
    
    await page.goto(url);

    await page.evaluate(async () => {
    await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
        }
        }, 100);
    });
    });
    const linkElements = await page.$x(`//*[@id="news"]/div/div[1]/div[*]/a`);
    const dateElements = await page.$x(`//*[@id="news"]/div/div[1]/div[*]/a/div[2]/p`);
    const links = await Promise.all(
        linkElements.map(async element => await (await element.getProperty('href')).jsonValue())
    );
    const dates = await Promise.all(dateElements.map(async element => {
        const date = await page.evaluate(element => element.textContent.trim().split(' - ')[0], element);
        return date;
    }));

    await browser.close();

    const combinedElements = await combineElements(links, dates)
    return combinedElements
}

const combineElements = async (links, dates)=>{
    let combinedElements = []
    for(let i=0; i<links.length;i++){
        const newElement = dates[i] + " : " + links[i]
        combinedElements.push(newElement)
    }
    return combinedElements
}

const saveNewsletters = async()=>{
    const elements = await getNewsletters()

    fs.writeFile(
        'MilkRoadLinks.txt', 
        elements.join('\n'), 
        error => 
        console.error(error)
    )
}

saveNewsletters()
