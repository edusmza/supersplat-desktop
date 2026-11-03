# SuperSplat Desktop

Aplicación de escritorio para Windows del editor de Gaussian Splats
[SuperSplat](https://github.com/playcanvas/supersplat) (PlayCanvas, licencia MIT),
empaquetada con Electron. Funciona sin conexión.

## Qué incluye

- El editor completo de SuperSplat, servido localmente (no depende de superspl.at).
- Ventana propia, sin barra de menú del navegador.
- Asociación de archivos: `.ply`, `.splat`, `.sog`, `.spz`, `.ksplat`, `.ssproj`
  (doble clic o "Abrir con" abre el archivo en SuperSplat).
- Una sola instancia: abrir otro archivo con la app abierta lo abre en otra ventana.
- Atajos: **F11** pantalla completa, **F12** herramientas de desarrollo.
- Los links externos (ayuda, publicar en superspl.at) se abren en tu navegador.

> SuperSplat necesita **WebGPU**. Electron lo trae activado en Windows
> (Direct3D 12), así que hace falta una placa de video y drivers razonablemente
> actuales.

## Compilar en Windows

Requisitos: [Node.js](https://nodejs.org/) 20.19 o superior y
[Git](https://git-scm.com/download/win).

```powershell
cd supersplat-desktop
npm install
npm run build:editor   # clona y compila SuperSplat en vendor\, lo copia a editor\
npm start              # probar la app sin empaquetar
npm run dist           # genera el instalador y el portable en release\
```

Resultados en `release\`:

- `SuperSplat-Setup-<versión>.exe` – instalador (accesos directos, desinstalador,
  asociación de archivos).
- `SuperSplat-Portable-<versión>.exe` – un solo .exe, no requiere instalación.
- `npm run dist:zip` genera además un .zip con la carpeta de la app.

## Actualizar a una versión nueva de SuperSplat

```powershell
npm run build:editor          # hace git pull de la última versión y recompila
npm run dist
```

Para fijar una versión concreta, borrá `vendor\supersplat` y usá
`$env:SUPERSPLAT_REF="v3.7.0"; npm run build:editor`.
Acordate de actualizar `"version"` en `package.json` si querés que el instalador
lleve el número nuevo.

## Releases automáticos

El workflow `.github/workflows/release.yml` compila la app en Windows (GitHub
Actions) y publica un Release con el instalador y el portable cada vez que se
sube una etiqueta `v*`. La etiqueta elige también la versión de SuperSplat:

```powershell
# actualizá "version" en package.json, commiteá y luego:
git tag v3.7.0
git push origin v3.7.0
```

## Estructura

```
main.js                  proceso principal de Electron
scripts/build-editor.js  clona/compila SuperSplat y lo copia a editor/
build/icon.ico|png       íconos de la app
editor/                  build de SuperSplat (generado)
vendor/supersplat/       código fuente de SuperSplat (generado)
release/                 ejecutables (generado)
```

## Notas

- Los ejecutables no están firmados, así que Windows SmartScreen puede mostrar
  "Windows protegió su PC": hacé clic en **Más información → Ejecutar de todas formas**.
- SuperSplat es © PlayCanvas Ltd., licencia MIT. Este envoltorio también es MIT.
