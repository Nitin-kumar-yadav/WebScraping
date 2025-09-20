# Adventure Books Web Scraper

A Node.js web scraper using **Playwright** to extract product data from [World of Books](https://www.worldofbooks.com/en-gb/collections/adventure-books) and store it in **MongoDB**.  
This scraper collects product title, price, image, description, and rating, and supports **pagination** to scrape all pages of a collection.

---

## Features

- Scrapes **product title, price, image, description, and rating**.
- Supports **pagination** to scrape all collection pages automatically.
- Saves data to **MongoDB** using `upsert` to avoid duplicates.
- Robust selectors with fallbacks (meta description & rating if not visible on page).
- Error handling and logging for easier debugging.

---

## Tech Stack

- **Node.js**
- **Playwright** for browser automation
- **MongoDB** for data storage
- **Mongoose** for schema management

---

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd adventure-books-scraper
