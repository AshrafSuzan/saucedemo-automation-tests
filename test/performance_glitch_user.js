const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

(async function runTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    let report = "";  // For HTML report generation
    let productPrice = 0;

    try {
        // 1. Open the SauceDemo website
        await driver.get('https://www.saucedemo.com/');
        log("Opened SauceDemo website");

        // 2. Login with performance_glitch_user
        await driver.findElement(By.id('user-name')).sendKeys('performance_glitch_user');
        await driver.findElement(By.id('password')).sendKeys('secret_sauce');
        await driver.findElement(By.id('login-button')).click();
        log("Logged in with performance_glitch_user");

        // 3. Reset App State from the menu
        await driver.findElement(By.id('react-burger-menu-btn')).click();
        await driver.wait(until.elementLocated(By.id('reset_sidebar_link')), 5000);
        await driver.findElement(By.id('reset_sidebar_link')).click();
        log("App state reset");

        // 4. Sort products by Name (Z to A)
        await driver.findElement(By.className('product_sort_container')).sendKeys('za');
        log("Filtered products by Name (Z to A)");

        // 5. Add the first product to the cart
        const firstProduct = await driver.findElement(By.css('.inventory_item:nth-of-type(1)'));
        const productName = await firstProduct.findElement(By.css('.inventory_item_name')).getText();
        const productPriceText = await firstProduct.findElement(By.css('.inventory_item_price')).getText();
        productPrice = parseFloat(productPriceText.replace('$', ''));
        await firstProduct.findElement(By.css('.btn_inventory')).click();
        log(`Added product "${productName}" to the cart for $${productPrice}`);

        // 6. Go to the cart
        await driver.findElement(By.className('shopping_cart_link')).click();
        log("Opened the cart");

        // 7. Verify product name in the cart
        const cartProductName = await driver.findElement(By.className('inventory_item_name')).getText();
        if (cartProductName === productName) {
            log(`Verified product name: ${cartProductName}`);
        } else {
            throw new Error(`Product name mismatch! Expected: ${productName}, Found: ${cartProductName}`);
        }

        // 8. Proceed to checkout
        await driver.findElement(By.id('checkout')).click();
        log("Navigated to the checkout page");

        // 9. Fill out checkout information
        await driver.findElement(By.id('first-name')).sendKeys('Test');
        await driver.findElement(By.id('last-name')).sendKeys('User');
        await driver.findElement(By.id('postal-code')).sendKeys('12345');
        await driver.findElement(By.id('continue')).click();
        log("Entered checkout information");

        // 10. Verify total price
        const displayedTotal = await driver.findElement(By.className('summary_total_label')).getText();
        const expectedTotal = `Total: $${(productPrice + 2.99).toFixed(2)}`; // Including tax
        if (displayedTotal.includes(expectedTotal)) {
            log(`Verified total price: ${displayedTotal}`);
        } else {
            throw new Error(`Total price mismatch! Expected: ${expectedTotal}, Found: ${displayedTotal}`);
        }

        // 11. Finish the purchase
        await driver.findElement(By.id('finish')).click();
        log("Completed the purchase");

        // 12. Verify success message
        const successMessage = await driver.findElement(By.className('complete-header')).getText();
        if (successMessage === "THANK YOU FOR YOUR ORDER") {
            log("Order placed successfully");
        } else {
            throw new Error(`Unexpected success message: ${successMessage}`);
        }

        // 13. Reset App State again and log out
        await driver.findElement(By.id('react-burger-menu-btn')).click();
        await driver.wait(until.elementLocated(By.id('reset_sidebar_link')), 5000);
        await driver.findElement(By.id('reset_sidebar_link')).click();
        await driver.findElement(By.id('logout_sidebar_link')).click();
        log("App state reset and logged out");

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
