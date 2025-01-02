import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let vscodeProductJson: any;
async function getVSCodeProductJson() {
    if (!vscodeProductJson) {
        const productJsonStr = await fs.promises.readFile(path.join(vscode.env.appRoot, 'product.json'), 'utf8');
        vscodeProductJson = JSON.parse(productJsonStr);
    }

    return vscodeProductJson;
}

export interface IServerConfig {
    version: string;
    commit: string;
    quality: string;
    release?: string; // vscodium-like specific
    serverApplicationName: string;
    serverDataFolderName: string;
    serverDownloadUrlTemplate?: string; // vscodium-like specific
}

export async function getVSCodeServerConfig(): Promise<IServerConfig> {
    const productJson = await getVSCodeProductJson();
    const customServerBinaryName = vscode.workspace.getConfiguration('remoteSSH.experimental').get<string>('serverBinaryName', '');

    return {
        /// --- Start EasyCode AI ---
        version: productJson.easycodeAIVersion || vscode.version.replace('-insider', ''),
        /// --- End EasyCode AI ---
        commit: productJson.commit,
        quality: productJson.quality,
        release: productJson.release,
        serverApplicationName: customServerBinaryName || productJson.serverApplicationName,
        serverDataFolderName: productJson.serverDataFolderName,
        serverDownloadUrlTemplate: productJson.serverDownloadUrlTemplate
    };
}
