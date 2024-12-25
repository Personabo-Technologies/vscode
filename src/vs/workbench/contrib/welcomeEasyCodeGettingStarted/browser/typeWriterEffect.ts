/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InputBox } from '../../../../base/browser/ui/inputbox/inputBox.js';

export class TypewriterEffect {
	private currentText: string = '';
	private isDeleting: boolean = false;
	private loopIndex: number = 0;
	private inputBox: InputBox;

	private readonly baseText: string;
	private readonly phrases: string[];

	constructor(inputBox: InputBox, baseText: string, phrases: string[]) {
		this.inputBox = inputBox;
		this.baseText = baseText;
		this.phrases = phrases;
		this.currentText = this.baseText;
		this.type();
	}

	private type() {
		const fullPhrase = this.baseText + this.phrases[this.loopIndex];

		let typeSpeed = 50;

		if (this.isDeleting) {
			this.currentText = fullPhrase.substring(0, this.currentText.length - 1);
			typeSpeed = 50;
		} else {
			this.currentText = fullPhrase.substring(0, this.currentText.length + 1);
			typeSpeed = 50;
		}

		this.inputBox.setPlaceHolder(this.currentText);

		if (!this.isDeleting && this.currentText === fullPhrase) {
			typeSpeed = 800;
			this.isDeleting = true;
		} else if (this.isDeleting && this.currentText === this.baseText) {
			this.isDeleting = false;
			this.loopIndex = (this.loopIndex + 1) % this.phrases.length;
			typeSpeed = 800;
		}

		setTimeout(() => this.type(), typeSpeed);
	}
}
