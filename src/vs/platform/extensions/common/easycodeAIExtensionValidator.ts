/*---------------------------------------------------------------------------------------------
 *  Copyright (c) EasyCode AI. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Severity from '../../../base/common/severity.js';
import { URI } from '../../../base/common/uri.js';
import * as nls from '../../../nls.js';
import { IExtensionManifest } from './extensions.js';
import { isValidVersion, normalizeVersion, parseVersion } from './extensionValidator.js';

type ProductDate = string | Date | undefined;

export function validateEasyCodeAIExtensionManifest(easycodeAIVersion: string, productDate: ProductDate, extensionLocation: URI, extensionManifest: IExtensionManifest, extensionIsBuiltin: boolean): [Severity, string][] {
	const validations: [Severity, string][] = [];
	const notices: string[] = [];
	const isValid = isValidEasyCodeAIExtensionVersion(easycodeAIVersion, productDate, extensionManifest, extensionIsBuiltin, notices);
	if (!isValid) {
		for (const notice of notices) {
			validations.push([Severity.Error, notice]);
		}
	}
	return validations;
}

export function isValidEasyCodeAIExtensionVersion(easycodeAIVersion: string, productDate: ProductDate, extensionManifest: IExtensionManifest, extensionIsBuiltin: boolean, notices: string[]): boolean {

	if (extensionIsBuiltin || (typeof extensionManifest.main === 'undefined' && typeof extensionManifest.browser === 'undefined')) {
		// No version check for builtin or declarative extensions
		return true;
	}

	if (!(extensionManifest.engines && extensionManifest.engines.easycodeAI)) {
		// No version check for extensions that don't specify a required version
		// of EasyCodeAI. Unlike VS Code, we don't require an extension to be
		// specific about its version requirements; an extension that doesn't
		// specify a version requirement is assumed to be compatible with any
		// version of EasyCodeAI.
		return true;
	}

	const requestedVersion = extensionManifest.engines.easycodeAI;
	if (requestedVersion === '*') {
		// No version check for extensions that specify a wildcard version
		return true;
	}

	return isVersionValid(easycodeAIVersion, productDate, requestedVersion, notices);
}

function isVersionValid(currentVersion: string, date: ProductDate, requestedVersion: string, notices: string[] = []): boolean {

	const desiredVersion = normalizeVersion(parseVersion(requestedVersion));
	if (!desiredVersion) {
		notices.push(nls.localize('versionSyntax', "Could not parse `engines.easycodeAI` value {0}. Please use, for example: ^2022.10.0, ^2024.5.x, etc.", requestedVersion));
		return false;
	}

	if (!isValidVersion(currentVersion, date, desiredVersion)) {
		notices.push(nls.localize('versionMismatch', "Extension is not compatible with EasyCodeAI {0}. Extension requires: {1}.", currentVersion, requestedVersion));
		return false;
	}

	return true;
}
