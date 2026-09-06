# Baloons

A typing game that runs in a browser or as a standalone desktop application.

## Run the desktop app

Install the dependencies once:

```powershell
npm install
```

Then build the web files and open them in the desktop app:

```powershell
npm run desktop
```

Press `F11` to enter or leave full-screen mode.

## Create Windows applications

```powershell
npm run package:win
```

The `release` directory will contain:

- `Baloons-Setup-1.0.0.exe` — an installer that creates Desktop and Start Menu shortcuts.
- `Baloons-Portable-1.0.0.exe` — a standalone app that can be copied to and run directly from the Desktop.

The packages are currently unsigned, so Windows SmartScreen may show a warning on another computer. Code signing is required to remove that distribution warning.

## Browser development

```powershell
npm run dev
```
