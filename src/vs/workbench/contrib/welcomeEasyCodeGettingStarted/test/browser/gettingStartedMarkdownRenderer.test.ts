/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { FileAccess } from '../../../../../base/common/network.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { LanguageService } from '../../../../../editor/common/services/languageService.js';
import { TestNotificationService } from '../../../../../platform/notification/test/common/testNotificationService.js';
import { EasyCodeGettingStartedDetailsRenderer } from '../../browser/easycodeGettingStartedDetailsRenderer.js';
import { convertInternalMediaPathToFileURI } from '../../browser/easycodeGettingStartedService.js';
import { TestFileService } from '../../../../test/browser/workbenchTestServices.js';
import { TestExtensionService } from '../../../../test/common/workbenchTestServices.js';


suite('Getting Started Markdown Renderer', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	test('renders theme picker markdown with images', async () => {
		const fileService = new TestFileService();
		const languageService = new LanguageService();
		const renderer = new EasyCodeGettingStartedDetailsRenderer(fileService, new TestNotificationService(), new TestExtensionService(), languageService);
		const mdPath = convertInternalMediaPathToFileURI('theme_picker').with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker' }) });
		const mdBase = FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/');
		const rendered = await renderer.renderMarkdown(mdPath, mdBase);
		const imageSrcs = [...rendered.matchAll(/img src="[^"]*"/g)].map(match => match[0]);
		for (const src of imageSrcs) {
			const targetSrcFormat = /^img src=".*\/vs\/workbench\/contrib\/welcomeGettingStarted\/common\/media\/.*.png"$/;
			assert(targetSrcFormat.test(src), `${src} didnt match regex`);
		}
		languageService.dispose();
	});
});
