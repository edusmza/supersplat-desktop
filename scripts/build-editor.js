// Clona (o actualiza) SuperSplat, lo compila y copia el resultado a ./editor
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'vendor', 'supersplat');
const out = path.join(root, 'editor');
const repo = 'https://github.com/playcanvas/supersplat.git';
const ref = process.env.SUPERSPLAT_REF; // opcional: tag o rama, ej. v3.7.0

const run = (cmd, cwd = root) => {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit' });
};

if (!fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(src), { recursive: true });
    run(`git clone --depth 1 ${ref ? `--branch ${ref} ` : ''}${repo} "${src}"`);
} else if (!process.argv.includes('--no-pull')) {
    run('git pull --ff-only', src);
}

run('npm ci', src);
run('npm run build', src);

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(src, 'dist'), out, {
    recursive: true,
    filter: (p) => !p.endsWith('.map')
});
// quitar el script de limpieza de service workers de la web (no aplica en escritorio)
const indexPath = path.join(out, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8')
    .replace(/<!--[^]*?-->\s*<script>\s*navigator\.serviceWorker[^]*?<\/script>/, '');
fs.writeFileSync(indexPath, html);

console.log(`Editor copiado a ${out}`);
