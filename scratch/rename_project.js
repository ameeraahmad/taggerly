const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const excludeDirs = ['.git', 'node_modules', '.agent', '.vercel'];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (!excludeDirs.includes(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

const replacements = [
    { from: /Taggerly/g, to: 'Tagger' },
    { from: /taggerly/g, to: 'tagger' },
    { from: /تاجرلي/g, to: 'تاجر' }
];

walkDir(rootDir, (filePath) => {
    const ext = path.extname(filePath);
    if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.sqlite', '.pdf', '.zip'].includes(ext)) return;
    if (filePath.includes('rename_project.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    replacements.forEach(r => {
        newContent = newContent.replace(r.from, r.to);
    });

    if (newContent !== content) {
        console.log(`✅ Updated: ${filePath}`);
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
});

console.log('Arabic and English rebranding complete!');
