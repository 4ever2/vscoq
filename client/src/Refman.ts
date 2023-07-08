'use strict';

import { SemVer, satisfies } from 'semver';
import * as vscode from 'vscode';

const baseUrl = "https://coq.inria.fr/refman/";

function getRefmanUrl(version: SemVer): string {
  if (!version)
    return baseUrl;

  return `https://coq.inria.fr/distrib/V${version.version}/refman/`;
}

function openUrl(url: string): void {
  const browser = vscode.workspace.getConfiguration("coq.refman").get<string>("browser");
  if (browser === "external")
    vscode.env.openExternal(vscode.Uri.parse(url));
  if (browser === "embedded")
    vscode.commands.executeCommand(
      "simpleBrowser.api.open",
      vscode.Uri.parse(url),
      { preserveFocus: false, viewColumn: vscode.ViewColumn.Beside });
}

export function openRefman(version: SemVer): void {
  openUrl(getRefmanUrl(version))
}

export function searchRefman(version: SemVer, query: string): void {
  if (!satisfies(version, ">= 8.8")) {
    vscode.window.showInformationMessage("Searching reference manual only works for Coq >= v8.8.0");
    return
  }
  
  const url = getRefmanUrl(version);
  openUrl(`${url}search.html?q=${query}&check_keywords=yes&area=default`);
}
