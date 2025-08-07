const fs = require('fs-extra');

const pathsToRemove = [
    './aida-launcher/build',
    './aida-launcher/dist',
    './aida-launcher/node_modules',
    './aida/node_modules',
    './aida/pb_data',
    './aida-launcher/package-lock.json',
    './aida/package-lock.json'
];

pathsToRemove.forEach(p => {
    try {
        fs.removeSync(p);
        console.log(`Successfully removed ${p}`);
    } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore 'file not found' errors
            console.error(`Error removing ${p}: ${err}`);
        }
    }
});
