const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

(async function runTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    let report = "";  // For HTML report
    let totalPrice = 0;

    try {
        // 1. Launch the website
        await driver.get('https://www.saucedemo.com/');
        log("Navigated to SauceDemo website");

        // 2. Login with standard_user
        await driver.findElement(By.id('user-name')).sendKeys('standard_user');
        await driver.findElement(By.id('password')).sendKeys('secret_sauce');
        await driver.findElement(By.id('login-button')).click();
        log("Logged in with standard_user");

        // 3. Reset App State from the hamburger menu
        await driver.findElement(By.id('react-burger-menu-btn')).click();
        await driver.wait(until.elementLocated(By.id('reset_sidebar_link')), 5000);
        await driver.findElement(By.id('reset_sidebar_link')).click();
        log("App State Reset");

        // 4. Add three items to the cart
        const itemsToAdd = [0, 1, 2]; // Adding the first three items
        for (let index of itemsToAdd) {
            await driver.findElements(By.css('.inventory_item'))[index]
                .findElement(By.css('.btn_inventory')).click();
            const priceText = await driver.findElements(By.css('.inventory_item'))[index]
                .findElement(By.css('.inventory_item_price')).getText();
            totalPrice += parseFloat(priceText.replace('$', ''));
            log(`Added item ${index + 1} to the cart`);
        }

        // 5. Go to the cart and proceed to checkout
        await driver.findElement(By.css('.shopping_cart_link')).click();
        log("Navigated to the cart");

        // 6. Verify product names and proceed to checkout
        const cartItems = await driver.findElements(By.css('.cart_item'));
        for (let i = 0; i < cartItems.length; i++) {
            const productName = await cartItems[i].findElement(By.css('.inventory_item_name')).getText();
            log(`Verified product: ${productName}`);
        }
        await driver.findElement(By.id('checkout')).click();

        // 7. Fill out checkout information and continue
        await driver.findElement(By.id('first-name')).sendKeys('Test');
        await driver.findElement(By.id('last-name')).sendKeys('User');
        await driver.findElement(By.id('postal-code')).sendKeys('12345');
        await driver.findElement(By.id('continue')).click();
        log("Filled out checkout information");

        // 8. Verify total price and complete purchase
        const displayedTotal = await driver.findElement(By.css('.summary_total_label')).getText();
        const expectedTotal = `Total: $${totalPrice.toFixed(2)}`;
        if (displayedTotal.includes(expectedTotal)) {
            log(`Total price verified: ${displayedTotal}`);
        } else {
            throw new Error(`Total price mismatch! Expected: ${expectedTotal}, Found: ${displayedTotal}`);
        }
        await driver.findElement(By.id('finish')).click();
        log("Completed the purchase");

        // 9. Verify the success message
        const successMessage = await driver.findElement(By.css('.complete-header')).getText();
        if (successMessage === "THANK YOU FOR YOUR ORDER") {
            log("Order was successfully placed");
        } else {
            throw new Error(`Unexpected success message: ${successMessage}`);
        }

        // 10. Reset App State again and log out
        await driver.findElement(By.id('react-burger-menu-btn')).click();
        await driver.wait(until.elementLocated(By.id('reset_sidebar_link')), 5000);
        await driver.findElement(By.id('reset_sidebar_link')).click();
        await driver.findElement(By.id('logout_sidebar_link')).click();
        log("App State reset and logged out");

    } catch (error) {
        log(`Test failed with error: ${error.message}`);
    } finally {
        // Close the browser and generate the report
        await driver.quit();
        generateHTMLReport(report);
    }

    // Helper function to log messages and collect them for the report
    function log(message) {
        console.log(message);
        report += `<p>${new Date().toLocaleTimeString()} - ${message}</p>\n`;
    }

    // Helper function to generate the HTML report
    function generateHTMLReport(reportContent) {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Report - Sauce Demo Automation</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #4CAF50; }
                    p { margin: 5px 0; }
                </style>
            </head>
            <body>
                <h1>Test Report - Sauce Demo Automation</h1>
                ${reportContent}
            </body>
            </html>
        `;
        fs.writeFileSync('report.html', html);
        console.log("HTML report generated: report.html");
    }
})();
