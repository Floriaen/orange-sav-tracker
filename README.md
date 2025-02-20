# OrangeSavTracking

This Node.js script automates tracking updates from the Orange SAV tracking service using Puppeteer. It logs activities, handles form submissions, retrieves tracking updates, and sends notifications via Pushover. This script has been created through collaboration between us and ChatGPT (version 4)

## Features
- The script requests tracking updates from: [Orange SAV Tracking Service](https://suivi-sav-orange.sbeglobalservice.com/)
- Uses **Puppeteer** to automate tracking retrieval.
- Sends notifications via **Pushover** when a new update (issues or changes) is discovered.
- Supports execution in a **cron job**.

## Requirements
- **Node.js** (v14+ recommended)
- **npm**
- A **Pushover** account (for notifications)

## Setup
### 1. Clone the Repository
```sh
git clone https://github.com/floriaen/orange-sav-tracker.git
cd orange-sav-tracker
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root and add:
```sh
ORDER_ID=your_order_id
POSTAL_CODE=your_postal_code
TOKEN=your_pushover_token
USER=your_pushover_user
```

### 4. Run the Script
```sh
node tracker.js
```

## Running in a Cron Job
Set the environment variable `CRON=true` when running via cron:
```sh
CRON=true node tracker.js
```

` and outputs status messages to the console.

## Dependencies
- **puppeteer**: Automates the browser.
- **pushover-notifications**: Sends notifications via Pushover.

## License
This project is licensed under the MIT License.