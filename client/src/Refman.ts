'use strict';

import * as vscode from 'vscode';

const baseUrl = vscode.Uri.parse("https://coq.inria.fr/refman/index.html");

export function getRefmanUrl(version: string): vscode.Uri {
  if (version == "")
    return baseUrl;
  
  return vscode.Uri.parse(`https://coq.inria.fr/distrib/V${version}/refman/`);
}
