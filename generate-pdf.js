const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.join(__dirname, 'user_guide_template.html');
const pdfPath = path.join(__dirname, 'CDN_Fire_Engineering_ERP_User_Guide.pdf');

console.log('Generating PDF from HTML template...');
console.log('HTML file:', htmlPath);
console.log('Target PDF file:', pdfPath);

if (!fs.existsSync(htmlPath)) {
  console.error('Error: user_guide_template.html does not exist.');
  process.exit(1);
}

// Common browser paths on Windows
const possibleBrowsers = [
  'msedge',
  'chrome',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let generated = false;

for (const browser of possibleBrowsers) {
  try {
    console.log(`Trying browser: ${browser}`);
    const cmd = `"${browser}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0) {
      console.log(`\nSUCCESS: PDF successfully generated using ${browser}!`);
      console.log(`File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`);
      generated = true;
      break;
    }
  } catch (err) {
    // Continue to next browser
  }
}

if (!generated) {
  console.error('Could not generate PDF using headless browser. Attempting fallback via jsPDF or custom script...');
  process.exit(1);
}
