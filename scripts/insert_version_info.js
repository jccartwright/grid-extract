const replace = require('replace-in-file');

try {
    replace.sync({
        files: 'dist/index.html',
        from: '@@BUILD_DATE@@',
        to: new Date()
    });
    replace.sync({
        files: 'dist/index.html',
        from: '@@VERSION@@',
        to: process.env.npm_package_version
    });
    console.log('inserted variables into index.html');
} catch (error) {
    console.error(error);
}
