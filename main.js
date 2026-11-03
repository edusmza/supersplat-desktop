// SuperSplat Desktop - envoltorio Electron del editor SuperSplat (MIT, PlayCanvas)
const { app, BrowserWindow, protocol, net, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SCHEME = 'app';
const HOST = 'supersplat';
const EDITOR_DIR = path.join(__dirname, 'editor');
const SPLAT_EXT = ['.ply', '.splat', '.sog', '.spz', '.ksplat', '.lcc', '.ssproj', '.json', '.zip'];

// archivos abiertos desde el sistema (doble clic / "Abrir con") -> token temporal
const openedFiles = new Map();
let openCounter = 0;

protocol.registerSchemesAsPrivileged([
    {
        scheme: SCHEME,
        privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
    }
]);

function mimeFor(p) {
    const ext = path.extname(p).toLowerCase();
    return {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.wasm': 'application/wasm',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2'
    }[ext] || 'application/octet-stream';
}

function registerProtocol() {
    protocol.handle(SCHEME, async (request) => {
        const url = new URL(request.url);

        // archivo local pasado por línea de comandos: app://open/<id>/<nombre>
        if (url.host === 'open') {
            const id = url.pathname.split('/')[1];
            const filePath = openedFiles.get(id);
            if (!filePath) return new Response('Not found', { status: 404 });
            const res = await net.fetch(pathToFileURL(filePath).toString());
            return new Response(res.body, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Access-Control-Allow-Origin': `${SCHEME}://${HOST}`
                }
            });
        }

        let rel = decodeURIComponent(url.pathname);
        if (rel === '/' || rel === '') rel = '/index.html';
        const filePath = path.normalize(path.join(EDITOR_DIR, rel));
        if (!filePath.startsWith(EDITOR_DIR)) return new Response('Forbidden', { status: 403 });

        try {
            const data = await fs.promises.readFile(filePath);
            return new Response(data, { headers: { 'Content-Type': mimeFor(filePath) } });
        } catch {
            return new Response('Not found', { status: 404 });
        }
    });
}

function filesFromArgv(argv) {
    return argv
        .slice(app.isPackaged ? 1 : 2)
        .filter((a) => !a.startsWith('-'))
        .map((a) => path.resolve(a))
        .filter((p) => SPLAT_EXT.includes(path.extname(p).toLowerCase()) && fs.existsSync(p));
}

function buildStartUrl(files) {
    const url = new URL(`${SCHEME}://${HOST}/index.html`);
    for (const f of files) {
        const id = String(++openCounter);
        openedFiles.set(id, f);
        url.searchParams.append('load', `${SCHEME}://open/${id}/${encodeURIComponent(path.basename(f))}`);
        url.searchParams.append('filename', path.basename(f));
    }
    return url.toString();
}

function createWindow(files = []) {
    const win = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#000000',
        title: 'SuperSplat',
        icon: path.join(__dirname, 'build', 'icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // los links externos (documentación, superspl.at, etc.) se abren en el navegador
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(`${SCHEME}://`)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
    win.webContents.on('will-navigate', (e, url) => {
        if (!url.startsWith(`${SCHEME}://`)) {
            e.preventDefault();
            shell.openExternal(url);
        }
    });

    // F11 pantalla completa, F12 herramientas de desarrollo, Ctrl+R recargar
    win.webContents.on('before-input-event', (e, input) => {
        if (input.type !== 'keyDown') return;
        if (input.key === 'F11') {
            win.setFullScreen(!win.isFullScreen());
            e.preventDefault();
        } else if (input.key === 'F12') {
            win.webContents.toggleDevTools();
            e.preventDefault();
        }
    });

    win.loadURL(buildStartUrl(files));
    return win;
}

// una sola instancia: abrir un archivo con la app ya abierta crea otra ventana
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', (_e, argv) => {
        const files = filesFromArgv(argv);
        if (files.length) {
            createWindow(files);
        } else {
            const [win] = BrowserWindow.getAllWindows();
            if (win) {
                if (win.isMinimized()) win.restore();
                win.focus();
            }
        }
    });

    app.whenReady().then(() => {
        Menu.setApplicationMenu(null);
        registerProtocol();
        createWindow(filesFromArgv(process.argv));
    });

    app.on('window-all-closed', () => app.quit());
}
