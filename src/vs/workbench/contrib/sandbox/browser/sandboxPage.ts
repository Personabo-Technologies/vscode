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
import { IExtensionService } from '../../../services/extensions/common/extensions.js';
import { IWelcomePageTemplateEntry } from '../../welcomeGettingStarted/browser/gettingStarted.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IProgressService } from '../../../../platform/progress/common/progress.js';

export const ISandboxPreviewService = createDecorator<ISandboxPreviewService>('sandboxPreviewService');
export interface ISandboxPreviewService {
	readonly _serviceBrand: undefined;
	initialize(template: IWelcomePageTemplateEntry): Promise<void>;
	openPreview(sandboxUrl: string): Promise<void>;
}


export class SandboxPreviewContribution extends Disposable implements IWorkbenchContribution, ISandboxPreviewService {
	readonly _serviceBrand: undefined;
	static readonly ID = 'workbench.contrib.sandboxPreview';

	constructor(
		@ICommandService private readonly commandService: ICommandService,
		@IEditorService private readonly editorService: IEditorService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@INotificationService private readonly notificationService: INotificationService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IProgressService private readonly progressService: IProgressService,
	) {
		super();
	}

	withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
		const timeout = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(new Error(errorMessage));
			}, ms);
		});

		return Promise.race([promise, timeout]);
	}

	async initialize(template: IWelcomePageTemplateEntry) {
		await this.lifecycleService.when(LifecyclePhase.Restored);

		const extensionId = 'EasyCodeAI.chatgpt-gpt4-gpt3-vscode';
		const extensionName = 'ChatGPT - EasyCode';
		const extension = await this.extensionService.getExtension(extensionId);
		if (extension) {
			const openTask = async () => {
				try {
					const result = await this.commandService.executeCommand('easycode.openPreview', {
						template: template.id,
						title: template.title,
						description: template.description
					});
					const sandbox = result.sandbox;

					switch (result.status) {
						case 'success':
							if (!sandbox.sandbox_id || !sandbox.sandbox_url) {
								this.notificationService.error(`Open template ${template.title} failed, cause: ${result.message || ''}`);
							} else {
								await this.openPreview(result.sandbox.sandbox_url);
							}
							break;
						case 'unauthorized':
							this.notificationService.info('Please login to EasyCode to use this feature.');
							break;
						case 'error':
							this.notificationService.error(`Open template error: ${result.message}`);
							break;
					}
				} catch (error) {
					this.notificationService.error(`Failed to open template: ${error}`);
				}
			};

			await this.progressService.withProgress(
				{
					location: 15,
					title: `Opening template ${template.title}`,
					cancellable: false
				},
				async () => this.withTimeout(
					openTask(),
					10000,
					'Operation timed out after 10 seconds'
				)
			);
		} else {
			this.commandService.executeCommand(
				'workbench.extensions.search',
				extensionName
			);
			this.notificationService.info(
				`Please install ${extensionName} extension to use this feature.`
			);
		}
	}

	async openPreview(sandboxUrl: string): Promise<void> {
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
				<iframe src="${sandboxUrl}" frameborder="0"></iframe>
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
