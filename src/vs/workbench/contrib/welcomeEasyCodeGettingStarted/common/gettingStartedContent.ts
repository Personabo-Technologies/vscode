/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import themePickerContent from './media/theme_picker.js';
import notebookProfileContent from './media/notebookProfile.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { URI } from '../../../../base/common/uri.js';

interface IGettingStartedContentProvider {
	(): string;
}

class GettingStartedContentProviderRegistry {

	private readonly providers = new Map<string, IGettingStartedContentProvider>();

	registerProvider(moduleId: string, provider: IGettingStartedContentProvider): void {
		this.providers.set(moduleId, provider);
	}

	getProvider(moduleId: string): IGettingStartedContentProvider | undefined {
		return this.providers.get(moduleId);
	}
}
export const gettingStartedContentRegistry = new GettingStartedContentProviderRegistry();

export async function moduleToContent(resource: URI): Promise<string> {
	if (!resource.query) {
		throw new Error('Getting Started: invalid resource');
	}

	const query = JSON.parse(resource.query);
	if (!query.moduleId) {
		throw new Error('Getting Started: invalid resource');
	}

	const provider = gettingStartedContentRegistry.getProvider(query.moduleId);
	if (!provider) {
		throw new Error(`Getting Started: no provider registered for ${query.moduleId}`);
	}

	return provider();
}

gettingStartedContentRegistry.registerProvider('vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker', themePickerContent);
gettingStartedContentRegistry.registerProvider('vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile', notebookProfileContent);
// Register empty media for accessibility walkthrough
gettingStartedContentRegistry.registerProvider('vs/workbench/contrib/welcomeGettingStarted/common/media/empty', () => '');

export type BuiltinGettingStartedStep = {
	id: string;
	title: string;
	description: string;
	completionEvents?: string[];
	when?: string;
	media:
	| { type: 'image'; path: string | { hc: string; hcLight?: string; light: string; dark: string }; altText: string }
	| { type: 'svg'; path: string; altText: string }
	| { type: 'markdown'; path: string };
};

export type BuiltinGettingStartedCategory = {
	id: string;
	title: string;
	description: string;
	isFeatured: boolean;
	next?: string;
	icon: ThemeIcon;
	when?: string;
	content:
	| { type: 'steps'; steps: BuiltinGettingStartedStep[] };
	walkthroughPageTitle: string;
};

export type BuiltinGettingStartedStartEntry = {
	id: string;
	title: string;
	description: string;
	icon: ThemeIcon;
	when?: string;
	content:
	| { type: 'startEntry'; command: string };
};

export type BuiltinGettingStartedTemplateEntry = {
	id: string;
	title: string;
	description: string;
	tags: string[];
	editorUrl: string;
};

type GettingStartedTemplateEntryContent = BuiltinGettingStartedTemplateEntry[];

export const templateEntries: GettingStartedTemplateEntryContent = [
	{
		'id': '9qputt',
		'title': 'React (TS)',
		'description': 'Quickest way to get started with a React application',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/react-vite-ts',
		'tags': [
			'javascript',
			'frontend',
			'vite',
			'featured',
			'react',
			'typescript'
		]
	},
	{
		'id': 'in2qez',
		'title': 'Python',
		'description': 'The starter template of Python for CodeSandbox',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/python',
		'tags': [
			'pip',
			'playground',
			'python',
			'featured'
		]
	},
	{
		'id': 'fxis37',
		'title': 'Next.js',
		'description': 'The official Next.js template by the CodeSandbox team',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/nextjs',
		'tags': [
			'typescript',
			'javascript',
			'frontend',
			'nextjs',
			'react'
		]
	},
	{
		'id': 'angular',
		'title': 'Angular',
		'description': 'The quickest way to get started with Angular!',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/angular',
		'tags': [
			'featured',
			'frontend',
			'javascript',
			'typescript',
			'angular'
		]
	},
	{
		'id': 'pb6sit',
		'title': 'Vue',
		'description': 'Vue 3 set up using Vite',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/vue-vite',
		'tags': [
			'featured',
			'vue',
			'vue3',
			'frontend',
			'vite',
			'javascript'
		]
	},
	{
		'id': 'k8dsq1',
		'title': 'Node.js',
		'description': 'The official Node.js template by the CodeSandbox team',
		'editorUrl': 'https://codesandbox.io/s/github/codesandbox/sandbox-templates/tree/main/node',
		'tags': [
			'node',
			'javascript',
			'playground'
		]
	}
];
