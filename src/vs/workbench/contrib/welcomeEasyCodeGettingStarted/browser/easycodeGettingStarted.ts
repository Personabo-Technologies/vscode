/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, addDisposableListener, Dimension, reset } from '../../../../base/browser/dom.js';
import { DomScrollableElement } from '../../../../base/browser/ui/scrollbar/scrollableElement.js';
import { Toggle } from '../../../../base/browser/ui/toggle/toggle.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { assertIsDefined } from '../../../../base/common/types.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import './media/easycodeGettingStarted.css';
import { localize } from '../../../../nls.js';
import { IAccessibilityService } from '../../../../platform/accessibility/common/accessibility.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ContextKeyExpression, IContextKeyService, RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IStorageService, StorageScope, StorageTarget, WillSaveStateReason } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { defaultToggleStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { IWorkspaceContextService, UNKNOWN_EMPTY_WINDOW_WORKSPACE } from '../../../../platform/workspace/common/workspace.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext, IEditorSerializer } from '../../../common/editor.js';
import './easycodeGettingStartedColors.js';
import { EasyCodeGettingStartedInput } from './easycodeGettingStartedInput.js';
import { RestoreWalkthroughsConfigurationValue, restoreWalkthroughsConfigurationKey } from './easycodeStartupPage.js';
import { templateEntries } from '../common/gettingStartedContent.js';
import { IEditorGroup, IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { IWorkbenchThemeService } from '../../../services/themes/common/workbenchThemeService.js';
import { EasyCodeGettingStartedIndexList } from './easycodeGettingStartedList.js';
import { ISandboxPreviewService } from '../../sandbox/browser/sandboxPage.js';

const configurationKey = 'workbench.easycodeStartupEditor';

export const inEasyCodeWelcomeContext = new RawContextKey<boolean>('inEasyCodeWelcome', false);

export interface IWelcomePageStartEntry {
	id: string;
	title: string;
	description: string;
	command: string;
	order: number;
	icon: { type: 'icon'; icon: ThemeIcon };
	when: ContextKeyExpression;
}

export interface IWelcomePageTemplateEntry {
	id: string;
	title: string;
	description: string;
	tags: string[];
	editorUrl: string;
}

const parsedTemplateEntries: IWelcomePageTemplateEntry[] = templateEntries.map((e, i) => ({
	id: e.id,
	title: e.title,
	description: e.description,
	tags: e.tags,
	editorUrl: e.editorUrl
}));

const REDUCED_MOTION_KEY = 'workbench.easycodeWelcomePage.preferReducedMotion';
export class EasyCodeGettingStartedPage extends EditorPane {

	public static readonly ID = 'easycodeGettingStartedPage';

	private editorInput!: EasyCodeGettingStartedInput;

	private readonly dispatchListeners: DisposableStore = new DisposableStore();
	private readonly stepDisposables: DisposableStore = new DisposableStore();

	private categoriesPageScrollbar: DomScrollableElement | undefined;
	private detailsPageScrollbar: DomScrollableElement | undefined;

	private detailsScrollbar: DomScrollableElement | undefined;

	private container: HTMLElement;

	private contextService: IContextKeyService;

	private templateList?: EasyCodeGettingStartedIndexList<IWelcomePageTemplateEntry>;

	private stepsSlide!: HTMLElement;
	private categoriesSlide!: HTMLElement;
	private stepsContent!: HTMLElement;
	private stepMediaComponent!: HTMLElement;

	private layoutMarkdown: (() => void) | undefined;
	private readonly categoriesSlideDisposables: DisposableStore;

	constructor(
		group: IEditorGroup,
		@ICommandService private readonly commandService: ICommandService,
		@IProductService private readonly productService: IProductService,
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkbenchThemeService protected override readonly themeService: IWorkbenchThemeService,
		@IStorageService private storageService: IStorageService,
		@IEditorGroupsService private readonly groupsService: IEditorGroupsService,
		@IContextKeyService contextService: IContextKeyService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@ISandboxPreviewService private readonly sandboxPreviewService: ISandboxPreviewService,
		@IAccessibilityService private readonly accessibilityService: IAccessibilityService
	) {

		super(EasyCodeGettingStartedPage.ID, group, telemetryService, themeService, storageService);

		this.container = $('.easycodeGettingStartedContainer',
			{
				role: 'document',
				tabindex: 0,
				'aria-label': localize('welcomeAriaLabel', "Overview of how to get up to speed with your editor.")
			});
		this.stepMediaComponent = $('.getting-started-media');
		this.stepMediaComponent.id = generateUuid();
		this.categoriesSlideDisposables = this._register(new DisposableStore());

		this.contextService = this._register(contextService.createScoped(this.container));
		inEasyCodeWelcomeContext.bindTo(this.contextService).set(true);

		this._register(this.dispatchListeners);

		this._register(this.storageService.onWillSaveState((e) => {
			if (e.reason !== WillSaveStateReason.SHUTDOWN) {
				return;
			}

			if (this.workspaceContextService.getWorkspace().folders.length !== 0) {
				return;
			}

			if (!this.editorInput) {
				return;
			}

			const editorPane = this.groupsService.activeGroup.activeEditorPane;
			if (!(editorPane instanceof EasyCodeGettingStartedPage)) {
				return;
			}

			// Save the state of the walkthrough so we can restore it on reload
			const restoreData: RestoreWalkthroughsConfigurationValue = { folder: UNKNOWN_EMPTY_WINDOW_WORKSPACE.id };
			this.storageService.store(
				restoreWalkthroughsConfigurationKey,
				JSON.stringify(restoreData),
				StorageScope.PROFILE, StorageTarget.MACHINE);
		}));
	}

	// remove when 'workbench.welcomePage.preferReducedMotion' deprecated
	private shouldAnimate() {
		if (this.configurationService.getValue(REDUCED_MOTION_KEY)) {
			return false;
		}
		if (this.accessibilityService.isMotionReduced()) {
			return false;
		}
		return true;
	}

	override async setInput(newInput: EasyCodeGettingStartedInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken) {
		this.container.classList.remove('animatable');
		this.editorInput = newInput;
		await super.setInput(newInput, options, context, token);
		await this.buildCategoriesSlide();
		if (this.shouldAnimate()) {
			setTimeout(() => this.container.classList.add('animatable'), 0);
		}
	}

	protected createEditor(parent: HTMLElement) {
		if (this.detailsPageScrollbar) { this.detailsPageScrollbar.dispose(); }
		if (this.categoriesPageScrollbar) { this.categoriesPageScrollbar.dispose(); }

		this.categoriesSlide = $('.gettingStartedSlideCategories.gettingStartedSlide');

		const prevButton = $('button.prev-button.button-link', { 'x-dispatch': 'scrollPrev' }, $('span.scroll-button.codicon.codicon-chevron-left'), $('span.moreText', {}, localize('goBack', "Go Back")));
		this.stepsSlide = $('.gettingStartedSlideDetails.gettingStartedSlide', {}, prevButton);

		this.stepsContent = $('.gettingStartedDetailsContent', {});

		this.detailsPageScrollbar = this._register(new DomScrollableElement(this.stepsContent, { className: 'full-height-scrollable' }));
		this.categoriesPageScrollbar = this._register(new DomScrollableElement(this.categoriesSlide, { className: 'full-height-scrollable categoriesScrollbar' }));

		this.stepsSlide.appendChild(this.detailsPageScrollbar.getDomNode());

		const gettingStartedPage = $('.gettingStarted', {}, this.categoriesPageScrollbar.getDomNode(), this.stepsSlide);
		this.container.appendChild(gettingStartedPage);

		this.categoriesPageScrollbar.scanDomNode();
		this.detailsPageScrollbar.scanDomNode();

		parent.appendChild(this.container);
	}

	private async buildCategoriesSlide() {

		this.categoriesSlideDisposables.clear();
		const showOnStartupCheckbox = new Toggle({
			icon: Codicon.check,
			actionClassName: 'getting-started-checkbox',
			isChecked: this.configurationService.getValue(configurationKey) === 'easycodeWelcomePage',
			title: localize('checkboxTitle', "When checked, this page will be shown on startup."),
			...defaultToggleStyles
		});
		showOnStartupCheckbox.domNode.id = 'showOnStartup';
		const showOnStartupLabel = $('label.caption', { for: 'showOnStartup' }, localize('easycodeWelcomePage.showOnStartup', "Show EasyCode welcome page on startup"));
		const onShowOnStartupChanged = () => {
			if (showOnStartupCheckbox.checked) {
				this.configurationService.updateValue(configurationKey, 'easycodeWelcomePage');
			} else {
				this.configurationService.updateValue(configurationKey, 'none');
			}
		};
		this.categoriesSlideDisposables.add(showOnStartupCheckbox);
		this.categoriesSlideDisposables.add(showOnStartupCheckbox.onChange(() => {
			onShowOnStartupChanged();
		}));
		this.categoriesSlideDisposables.add(addDisposableListener(showOnStartupLabel, 'click', () => {
			showOnStartupCheckbox.checked = !showOnStartupCheckbox.checked;
			onShowOnStartupChanged();
		}));

		const header = $('.header', {},
			$('h1.product-name.caption', {}, this.productService.nameLong),
			$('p.subtitle.description', {}, localize({ key: 'gettingStarted.withEasyCodeAI', comment: ['Shown as subtitle on the Welcome page.'] }, "Getting Started with EasyCode AI"))
		);

		const templateList = this.buildTemplateList();

		const template = $('.template', {},);
		reset(template, templateList.getDomElement());

		const footer = $('.footer', {},
			$('p.showOnStartup', {},
				showOnStartupCheckbox.domNode,
				showOnStartupLabel,
			));


		reset(this.categoriesSlide, $('.gettingStartedCategoriesContainer', {}, header, template, footer,));
		this.categoriesPageScrollbar?.scanDomNode();

		this.setSlide('categories');
	}

	private buildTemplateList(): EasyCodeGettingStartedIndexList<IWelcomePageTemplateEntry> {
		const renderTemplateEntry = (entry: IWelcomePageTemplateEntry): HTMLElement =>
			$('div',
				{ class: 'element' },
				$('div', { class: 'title' }, entry.title),
				$('div', { class: 'description' }, entry.description),
				$('div',
					{ class: 'tags' },
					...entry.tags.map(tag =>
						$('span', { class: 'tag' }, tag)
					)
				)
			);

		if (this.templateList) { this.templateList.dispose(); }

		const templateList = this.templateList = new EasyCodeGettingStartedIndexList(
			{
				title: 'Template',
				klass: 'template-container',
				limit: 10,
				renderElement: renderTemplateEntry,
				contextService: this.contextService,
				clickElement: (entry) => {
					this.sandboxPreviewService.initialize(entry);
				}
			});

		templateList.setEntries(parsedTemplateEntries);
		templateList.onDidChange(() => console.log('open template'));
		return templateList;
	}

	layout(size: Dimension) {
		this.detailsScrollbar?.scanDomNode();

		this.categoriesPageScrollbar?.scanDomNode();
		this.detailsPageScrollbar?.scanDomNode();

		this.templateList?.layout(size);

		this.layoutMarkdown?.();

		this.container.classList.toggle('height-constrained', size.height <= 600);
		this.container.classList.toggle('width-constrained', size.width <= 400);
		this.container.classList.toggle('width-semi-constrained', size.width <= 800);

		this.categoriesPageScrollbar?.scanDomNode();
		this.detailsPageScrollbar?.scanDomNode();
		this.detailsScrollbar?.scanDomNode();
	}

	override clearInput() {
		this.stepDisposables.clear();
		super.clearInput();
	}

	private runSkip() {
		this.commandService.executeCommand('workbench.action.closeActiveEditor');
	}

	escape() {
		this.runSkip();
	}

	private setSlide(toEnable: 'details' | 'categories', firstLaunch: boolean = false) {
		const slideManager = assertIsDefined(this.container.querySelector('.gettingStarted'));
		if (toEnable === 'categories') {
			slideManager.classList.remove('showDetails');
			slideManager.classList.add('showCategories');
			this.container.querySelector<HTMLButtonElement>('.prev-button.button-link')!.style.display = 'none';
			this.container.querySelector('.gettingStartedSlideDetails')!.querySelectorAll('button').forEach(button => button.disabled = true);
			this.container.querySelector('.gettingStartedSlideCategories')!.querySelectorAll('button').forEach(button => button.disabled = false);
			this.container.querySelector('.gettingStartedSlideCategories')!.querySelectorAll('input').forEach(button => button.disabled = false);
		} else {
			slideManager.classList.add('showDetails');
			slideManager.classList.remove('showCategories');
			const prevButton = this.container.querySelector<HTMLButtonElement>('.prev-button.button-link');

			const moreTextElement = prevButton!.querySelector('.moreText');
			moreTextElement!.textContent = firstLaunch ? localize('welcome', "Welcome") : localize('goBack', "Go Back");

			this.container.querySelector('.gettingStartedSlideDetails')!.querySelectorAll('button').forEach(button => button.disabled = false);
			this.container.querySelector('.gettingStartedSlideCategories')!.querySelectorAll('button').forEach(button => button.disabled = true);
			this.container.querySelector('.gettingStartedSlideCategories')!.querySelectorAll('input').forEach(button => button.disabled = true);
		}
	}

	override focus() {
		super.focus();

		const active = this.container.ownerDocument.activeElement;

		let parent = this.container.parentElement;
		while (parent && parent !== active) {
			parent = parent.parentElement;
		}

		if (parent) {
			// Only set focus if there is no other focued element outside this chain.
			// This prevents us from stealing back focus from other focused elements such as quick pick due to delayed load.
			this.container.focus();
		}
	}
}

export class EasyCodeGettingStartedInputSerializer implements IEditorSerializer {
	public canSerialize(editorInput: EasyCodeGettingStartedInput): boolean {
		return true;
	}

	public serialize(editorInput: EasyCodeGettingStartedInput): string {
		return JSON.stringify({ showTelemetryNotice: editorInput.showTelemetryNotice, showWelcome: editorInput.showWelcome });
	}

	public deserialize(instantiationService: IInstantiationService, serializedEditorInput: string): EasyCodeGettingStartedInput {

		return instantiationService.invokeFunction(accessor => {
			try {
				const { showTelemetryNotice, showWelcome } = JSON.parse(serializedEditorInput);
				return new EasyCodeGettingStartedInput({ showTelemetryNotice, showWelcome });
			} catch { }
			return new EasyCodeGettingStartedInput({});

		});
	}
}
