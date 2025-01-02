# How to build the package

## Client
### Windows
#### x64
- `npm run gulp vscode-win32-x64`

#### arm64
- `npm run gulp vscode-win32-arm64`

### Linux
#### x64
- `npm run gulp vscode-linux-x64`
- `npm run gulp vscode-linux-x64-build-deb` (Debian / Ubuntu)
- `npm run gulp vscode-linux-x64-build-rpm` (Red Hat / Fedora)

#### arm64
- `npm run gulp vscode-linux-arm64`
- `npm run gulp vscode-linux-arm64-build-deb` (Debian / Ubuntu)
- `npm run gulp vscode-linux-arm64-build-rpm` (Red Hat / Fedora)

### macOS
#### Intel
- `npm run gulp vscode-darwin-x64`
#### Apple Silicon
- `npm run gulp vscode-darwin-arm64`

## Remote Server
#### Linux Server
- `npm run gulp vscode-reh-linux-x64`
- `npm run gulp vscode-reh-linux-arm64`
