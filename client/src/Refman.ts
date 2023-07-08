'use strict';

import { SemVer } from 'semver';
import * as vscode from 'vscode';

const baseUrl = "https://coq.inria.fr/refman/index.html";

function getRefmanUrl(version: SemVer): string {
  if (!version)
    return baseUrl;

  return `https://coq.inria.fr/distrib/V${version.version}/refman/`;
}

export function openRefmanUrl(version: SemVer): void {
  const url = getRefmanUrl(version);
  vscode.env.openExternal(vscode.Uri.parse(url));
}
