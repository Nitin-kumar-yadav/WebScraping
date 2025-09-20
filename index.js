import fs from "fs";
import { chromium } from "playwright";
import { connectDB, Product } from "./db.js";

async function scrapeWithPlaywright() {
    await connectDB();

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    //TODO: Provide the target URL
    const url = "https://www.worldofbooks.com/en-gb/collections/adventure-books";
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    try {
        await page.waitForSelector("div[data-product-id]", { timeout: 30000 });
    } catch (e) {
        console.error("No product cards found\n ");
        const html = await page.content();
        fs.writeFileSync("debug_page.html", html);
        await page.screenshot({ path: "debug_page.png", fullPage: true });
        await browser.close();
        process.exit(1);
    }

    //TODO: Extract product links & basic info
    const products = await page.$$eval("div[data-product-id]", (cards) =>
        cards.map((card) => {
            const link = card.querySelector("a[href*='/products/']")?.href || null;
            const title = card.querySelector("a[href*='/products/']")?.textContent?.trim() || null;

            let priceText = card.querySelector("span.price, .price-item")?.textContent?.trim() || null;
            let price = null;
            if (priceText) {
                price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
            }

            const image = card.querySelector("img")?.src || null;
            return { title, price, link, image };
        })
    );

    console.log("\nExtracted products:", products.length);

    // Loop through each product
    for (const product of products) {
        if (!product.link) continue;

        try {
            const detailPage = await browser.newPage();
            await detailPage.goto(product.link, { waitUntil: "domcontentloaded" });
            await detailPage.waitForTimeout(2000);

            //TODO:  Extract description with multiple fallbacks
            const description =
                (await detailPage.$eval(
                    "#tab-description, .product-single__description, .product-description, [data-product-description]",
                    (el) => el.textContent.trim()
                ).catch(async () => {
                    // fallback to meta description
                    return await detailPage.$eval('meta[name="description"]', el => el.content.trim()).catch(() => null);
                })) || null;

            if (!description) {
                console.warn(`\nNo description found for ${product.link}`);
            }

            //TODO: Extract rating with multiple fallbacks

            //FIXME: Rating extraction is null for many products - improve selectors or logic
            let rating = null;
            const ratingText =
                (await detailPage.$eval(
                    ".jdgm-prev-badge__stars, .rating, .star-rating, [data-rating]",
                    (el) => el.textContent.trim()
                ).catch(() => null)) ||
                (await detailPage.$eval('meta[itemprop="ratingValue"]', el => el.content).catch(() => null));

            if (ratingText) {
                rating = parseFloat(ratingText.replace(/[^0-9.]/g, ""));
            }

            if (!rating) {
                console.warn(`No rating found for ${product.link}\n`);
            }

            //TODO: Add data to product object
            product.description = description;
            product.rating = rating;

            //TODO: Save to MongoDB
            await Product.updateOne(
                { link: product.link },
                { $set: product },
                { upsert: true }
            );

            console.log(
                `\n Saved: ${product.title || "No Title"} - ${product.price || "No Price"} ⭐ ${product.rating || "No Rating"}`
            );

            await detailPage.close();
        } catch (err) {
            console.error(`\nError processing ${product.link}: ${err.message}`);
        }
    }

    await browser.close();
}

scrapeWithPlaywright();
