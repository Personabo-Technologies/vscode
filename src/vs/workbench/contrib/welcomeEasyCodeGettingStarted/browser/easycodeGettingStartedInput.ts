/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/easycodeGettingStarted.css';
import { localize } from '../../../../nls.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { URI } from '../../../../base/common/uri.js';
import { Schemas } from '../../../../base/common/network.js';
import { IUntypedEditorInput } from '../../../common/editor.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';

export const easycodeGettingStartedInputTypeId = 'workbench.editors.easycodeGettingStartedInput';

export interface EasyCodeGettingStartedEditorOptions extends IEditorOptions {
	showTelemetryNotice?: boolean;
	showWelcome?: boolean;
}

export class EasyCodeGettingStartedInput extends EditorInput {

	static readonly ID = easycodeGettingStartedInputTypeId;
	static readonly RESOURCE = URI.from({ scheme: Schemas.easycodeWalkThrough, authority: 'vscode_easycode_getting_started_page' });
	private _showTelemetryNotice: boolean;
	private _showWelcome: boolean;

	override get typeId(): string {
		return EasyCodeGettingStartedInput.ID;
	}

	override get editorId(): string | undefined {
		return this.typeId;
	}

	override toUntyped(): IUntypedEditorInput {
		return {
			resource: EasyCodeGettingStartedInput.RESOURCE,
			options: {
				override: EasyCodeGettingStartedInput.ID,
				pinned: false
			}
		};
	}

	get resource(): URI | undefined {
		return EasyCodeGettingStartedInput.RESOURCE;
	}

	override matches(other: EditorInput | IUntypedEditorInput): boolean {
		if (super.matches(other)) {
			return true;
		}
		return false;
	}

	constructor(
		options: EasyCodeGettingStartedEditorOptions) {
		super();
		this._showTelemetryNotice = !!options.showTelemetryNotice;
		this._showWelcome = options.showWelcome ?? true;
	}

	override getName() {
		return localize('easyCodeGetStarted', "EasyCode Welcome");
	}

	get showTelemetryNotice(): boolean {
		return this._showTelemetryNotice;
	}

	set showTelemetryNotice(value: boolean) {
		this._showTelemetryNotice = value;
	}

	get showWelcome(): boolean {
		return this._showWelcome;
	}

	set showWelcome(value: boolean) {
		this._showWelcome = value;
	}
}
