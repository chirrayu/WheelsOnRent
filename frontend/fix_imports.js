
import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Regex to match imports with versions like "package@1.2.3"
    // It looks for 'from "package@version"' or 'from 'package@version''
    // We need to handle scoped packages too like @radix-ui/abc@1.2.3

    const regex = /(from\s+['"])([^'"]+?)(@\d+\.\d+\.\d+)(['"])/g;

    if (regex.test(content)) {
        console.log(`Fixing ${file}`);
        const newContent = content.replace(regex, '$1$2$4');
        fs.writeFileSync(file, newContent, 'utf8');
    }
});
