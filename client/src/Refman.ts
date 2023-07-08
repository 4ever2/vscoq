'use strict';

import { SemVer, satisfies } from 'semver';
import * as vscode from 'vscode';

const baseUrl = "https://coq.inria.fr/refman/";

function getRefmanUrl(version: SemVer): string {
  if (!version)
    return baseUrl;

  return `https://coq.inria.fr/distrib/V${version.version}/refman/`;
}

export function openRefman(version: SemVer): void {
  const url = getRefmanUrl(version);
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export function searchRefman(version: SemVer, query: string): void {
  const url = getRefmanUrl(version);
  const searchUrl = `${url}search.html?q=${query}&check_keywords=yes&area=default`;

  if (satisfies(version, ">= 8.8"))
    vscode.env.openExternal(vscode.Uri.parse(searchUrl));
  else
    vscode.window.showInformationMessage("Searching reference manual only works for Coq >= v8.8.0");
}
