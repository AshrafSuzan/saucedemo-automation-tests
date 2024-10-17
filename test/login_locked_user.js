const { Builder, By, Key, until } = require('selenium-webdriver');
const fs = require('fs');

// Variables to store test results
let testStatus = 'PASSED';
let errorMessage = '';

(async function loginTest() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        console.log("Opening Sauce Demo website...");
        await driver.get('https://www.saucedemo.com/');

        console.log("Entering credentials...");
        await driver.findElement(By.id('user-name')).sendKeys('locked_out_user');
        await driver.findElement(By.id('password')).sendKeys('secret_sauce');
        await driver.findElement(By.id('login-button')).click();

        console.log("Waiting for the error message...");
        let errorContainer = await driver.wait(
            until.elementLocated(By.css('.error-message-container')),
            5000,
            "Error message not found."
        );

        await driver.wait(until.elementIsVisible(errorContainer), 5000);
        let message = await errorContainer.getText();

        console.log(`Error Message: "${message}"`);

        if (!message.includes('Sorry, this user has been locked out.')) {
            throw new Error('Error message did not match expected text.');
        }
    } catch (error) {
        testStatus = 'FAILED';
        errorMessage = error.message;
        console.error(`Test Failed: ${error.message}`);
    } finally {
        await driver.quit();
        generateHtmlReport(testStatus, errorMessage);
    }
})();

// Function to generate a simple HTML report
function generateHtmlReport(status, error) {
    const htmlContent = `
    <html>
    <head>
        <title>Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .status { font-weight: bold; color: ${status === 'PASSED' ? 'green' : 'red'}; }
            .error { color: red; }
        </style>
    </head>
    <body>
        <h1>Login Test Report</h1>
        <p><strong>Status:</strong> <span class="status">${status}</span></p>
        ${
            error
                ? `<p class="error"><strong>Error:</strong> ${error}</p>`
                : ''
        }
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    </body>
    </html>`;

    // Write the report to an HTML file
    fs.writeFileSync('test-report.html', htmlContent);
    console.log('Test report generated: test-report.html');
}
