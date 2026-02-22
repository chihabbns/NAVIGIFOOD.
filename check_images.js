const fs = require('fs');
const path = require('path');

const dataJsPath = path.join(__dirname, 'js', 'data.js');
let content = fs.readFileSync(dataJsPath, 'utf8');

// Quick regex to extract images
const regex = /image:\s*"([^"]*)"/g;
let match;
const images = [];
while ((match = regex.exec(content)) !== null) {
  images.push(match[1]);
}

let missing = 0;
let empty = 0;
images.forEach(img => {
  if (!img) {
    empty++;
    return;
  }
  const imgPath = path.join(__dirname, img);
  if (!fs.existsSync(imgPath)) {
    console.log(`MISSING OR TYPO: "${img}"`);
    missing++;
  }
});

console.log(`Total images checked: ${images.length}`);
console.log(`Missing/Typo: ${missing}`);
console.log(`Empty mappings: ${empty}`);
