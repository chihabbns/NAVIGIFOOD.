const fs = require('fs');
const path = require('path');

const dataJsPath = path.join(__dirname, 'js', 'data.js');
let content = fs.readFileSync(dataJsPath, 'utf8');

const replacements = [
  { id: 11, newImage: 'assets/images/marriott-constantine-breakfast.jpg' },
  { id: 15, newImage: 'assets/images/Gourmet-Mediterranean-Box.jpg' },
  { id: 16, newImage: 'assets/images/International-Cuisin-Box.jpg' },
  { id: 18, newImage: 'assets/images/Royal-Tlemcen-Dinner.jpg' },
  { id: 19, newImage: 'assets/images/Coastal-Luxury-Brunch.jpg' },
  { id: 21, newImage: 'assets/images/traditional-azerbaijan-pastries-shakarbura-bakhlava-plate.jpg' },
  { id: 22, newImage: 'assets/images/Matlouh-Kesra.jpg' },
  { id: 23, newImage: 'assets/images/Millefeuille-Tart-Box.jpg' },
  { id: 44, newImage: 'assets/images/Moukabilat.jpg' },
];

replacements.forEach(({id, newImage}) => {
  // We look for a line with `id: ${id},` and then we find the first `image: "..."` or `image: ""` after it.
  const regex = new RegExp(`(id:\\s*${id},\\s*[\\s\\S]*?image:\\s*)"([^"]*)"`);
  content = content.replace(regex, `$1"${newImage}"`);
});

fs.writeFileSync(dataJsPath, content, 'utf8');
console.log("Updated data.js with correct image links!");
