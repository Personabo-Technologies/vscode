/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWorkbenchContribution } from '../../../common/contributions.js';
import { createDecorator, IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { ILifecycleService, LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWebviewService } from '../../webview/browser/webview.js';
import { WebviewInput } from '../../webviewPanel/browser/webviewEditorInput.js';
import { WebviewIconManager } from '../../webviewPanel/browser/webviewIconManager.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';

export const ISandboxPreviewService = createDecorator<ISandboxPreviewService>('sandboxPreviewService');
export interface ISandboxPreviewService {
	readonly _serviceBrand: undefined;
	openPreview(): Promise<void>;
}


export class SandboxPreviewContribution extends Disposable implements IWorkbenchContribution, ISandboxPreviewService {
	readonly _serviceBrand: undefined;
	static readonly ID = 'workbench.contrib.sandboxPreview';

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super();
		this.initialize();
	}

	private async initialize() {
		// Wait for resolving startup editor until we are restored to reduce startup pressure
		await this.lifecycleService.when(LifecyclePhase.Restored);
		// DO NOT OPEN on startup
		// this.openPreview();
	}

	async openPreview(): Promise<void> {
		const webview = this.webviewService.createWebviewOverlay({
			providedViewType: 'easycode.Sandbox.preview',
			title: 'EasyCode Sandbox Preview',
			options: {
				retainContextWhenHidden: true,
				enableFindWidget: false
			},
			contentOptions: {
				allowScripts: true,
				allowForms: true
			},
			extension: undefined
		});

		webview.setHtml(`
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					html, body {
						margin: 0;
						padding: 0;
						width: 100%;
						height: 100%;
						overflow: hidden;
					}
					body {
						display: flex;
						flex-direction: column;
					}
					iframe {
						flex: 1;
						border: none;
						width: 100%;
						min-height: 0; /* Important: prevent iframe overflow */
					}
				</style>
			</head>
			<body>
				<iframe src="https://g4wyzy-4321.csb.app" frameborder="0"></iframe>
			</body>
		</html>
		`);

		const webviewInput = new WebviewInput(
			{
				viewType: 'codeSandbox.preview',
				name: 'Preview',
				providedId: undefined
			},
			webview,
			this.instantiationService.createInstance(WebviewIconManager)
		);
		await this.editorService.openEditor(webviewInput);
	}
}

registerSingleton(ISandboxPreviewService, SandboxPreviewContribution, InstantiationType.Eager);
