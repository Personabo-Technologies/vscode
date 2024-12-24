/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorExtensions, IEditorFactoryRegistry } from '../../../common/editor.js';
import { MenuId, registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { ContextKeyExpr, IContextKeyService, RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { IEditorService, SIDE_GROUP } from '../../../services/editor/common/editorService.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { KeyCode } from '../../../../base/common/keyCodes.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { EasyCodeGettingStartedInput } from './easycodeGettingStartedInput.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { EasyCodeStartupPageEditorResolverContribution, EasyCodeStartupPageRunnerContribution } from './easycodeStartupPage.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { EasyCodeGettingStartedInputSerializer, EasyCodeGettingStartedPage, inEasyCodeWelcomeContext } from './easycodeGettingStarted.js';
import { ConfigurationScope, Extensions as ConfigurationExtensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { workbenchConfigurationNodeBase } from '../../../common/configuration.js';
import { IExtensionManagementServerService } from '../../../services/extensionManagement/common/extensionManagement.js';
import { IRemoteAgentService } from '../../../services/remote/common/remoteAgentService.js';
import { isLinux, isMacintosh, isWindows, OperatingSystem as OS } from '../../../../base/common/platform.js';

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openEasyCodeWelcomeView',
			title: localize2('miEasyCodeWelcome', 'EasyCode Welcome'),
			category: Categories.Help,
			f1: true,
			menu: {
				id: MenuId.MenubarHelpMenu,
				group: '1_welcome',
				order: 1,
			},
			metadata: {
				description: localize2('minEasyCodeWelcomeDescription', 'Opens EasyCode Welcome to help you get started with EasyCode AI.')
			}
		});
	}

	public run(
		accessor: ServicesAccessor,
		walkthroughID: string | { category: string; step: string } | undefined,
		toSide: boolean | undefined
	) {
		const editorService = accessor.get(IEditorService);

		if (walkthroughID) {
			// We're trying to open the welcome page from the Help menu
			editorService.openEditor({
				resource: EasyCodeGettingStartedInput.RESOURCE,
				options: { preserveFocus: toSide ?? false }
			}, toSide ? SIDE_GROUP : undefined);
		}
	}
});

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(EasyCodeGettingStartedInput.ID, EasyCodeGettingStartedInputSerializer);
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		EasyCodeGettingStartedPage,
		EasyCodeGettingStartedPage.ID,
		localize('easycodeWelcome', "EasyCode Welcome")
	),
	[
		new SyncDescriptor(EasyCodeGettingStartedInput)
	]
);

const category = localize2('easycodeWelcome', "EasyCode Welcome");

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'easycodeWelcome.goBack',
			title: localize2('easycodeWelcome.goBack', 'Go Back'),
			category,
			keybinding: {
				weight: KeybindingWeight.EditorContrib,
				primary: KeyCode.Escape,
				when: inEasyCodeWelcomeContext
			},
			precondition: ContextKeyExpr.equals('activeEditor', 'easycodeGettingStartedPage'),
			f1: true
		});
	}

	run(accessor: ServicesAccessor) {
		const editorService = accessor.get(IEditorService);
		const editorPane = editorService.activeEditorPane;
		if (editorPane instanceof EasyCodeGettingStartedPage) {
			editorPane.escape();
		}
	}
});


export const WorkspacePlatform = new RawContextKey<'mac' | 'linux' | 'windows' | 'webworker' | undefined>('workspacePlatform', undefined, localize('workspacePlatform', "The platform of the current workspace, which in remote or serverless contexts may be different from the platform of the UI"));
class WorkspacePlatformContribution {

	static readonly ID = 'workbench.contrib.EasyCodeWorkspacePlatform';

	constructor(
		@IExtensionManagementServerService private readonly extensionManagementServerService: IExtensionManagementServerService,
		@IRemoteAgentService private readonly remoteAgentService: IRemoteAgentService,
		@IContextKeyService private readonly contextService: IContextKeyService,
	) {
		this.remoteAgentService.getEnvironment().then(env => {
			const remoteOS = env?.os;

			const remotePlatform = remoteOS === OS.Macintosh ? 'mac'
				: remoteOS === OS.Windows ? 'windows'
					: remoteOS === OS.Linux ? 'linux'
						: undefined;

			if (remotePlatform) {
				WorkspacePlatform.bindTo(this.contextService).set(remotePlatform);
			} else if (this.extensionManagementServerService.localExtensionManagementServer) {
				if (isMacintosh) {
					WorkspacePlatform.bindTo(this.contextService).set('mac');
				} else if (isLinux) {
					WorkspacePlatform.bindTo(this.contextService).set('linux');
				} else if (isWindows) {
					WorkspacePlatform.bindTo(this.contextService).set('windows');
				}
			} else if (this.extensionManagementServerService.webExtensionManagementServer) {
				WorkspacePlatform.bindTo(this.contextService).set('webworker');
			} else {
				console.error('Error: Unable to detect workspace platform');
			}
		});
	}
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
configurationRegistry.registerConfiguration({
	...workbenchConfigurationNodeBase,
	properties: {
		'workbench.easycodeWelcomePage.walkthroughs.openOnInstall': {
			scope: ConfigurationScope.MACHINE,
			type: 'boolean',
			default: true,
			description: localize('workbench.easycodeWelcomePage.walkthroughs.openOnInstall', "When enabled, an extension's walkthrough will open upon install of the extension.")
		},
		'workbench.easycodeStartupEditor': {
			'scope': ConfigurationScope.RESOURCE,
			'type': 'string',
			'enum': ['none', 'easycodeWelcomePage', 'welcomePageInEmptyWorkbench'],
			'enumDescriptions': [
				localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.none' }, "Start without an editor."),
				localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePage' }, "Open the Welcome page, with content to aid in getting started with VS Code and extensions."),
				localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePageInEmptyWorkbench' }, "Open the Welcome page when opening an empty workbench."),
			],
			'default': 'easycodeWelcomePage',
			'description': localize('workbench.easycodeStartupEditor', "Controls which editor is shown at startup, if none are restored from the previous session.")
		},
		'workbench.easycodeWelcomePage.preferReducedMotion': {
			scope: ConfigurationScope.APPLICATION,
			type: 'boolean',
			default: false,
			deprecationMessage: localize('deprecationMessage', "Deprecated, use the global `workbench.reduceMotion`."),
			description: localize('workbench.easycodeWelcomePage.preferReducedMotion', "When enabled, reduce motion in welcome page.")
		}
	}
});

registerWorkbenchContribution2(WorkspacePlatformContribution.ID, WorkspacePlatformContribution, WorkbenchPhase.AfterRestored);
registerWorkbenchContribution2(EasyCodeStartupPageEditorResolverContribution.ID, EasyCodeStartupPageEditorResolverContribution, WorkbenchPhase.BlockRestore);
registerWorkbenchContribution2(EasyCodeStartupPageRunnerContribution.ID, EasyCodeStartupPageRunnerContribution, WorkbenchPhase.AfterRestored);
