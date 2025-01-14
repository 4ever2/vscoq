import * as vscode from 'vscode'

import * as proto from '@lib/protocol';
import * as WebSocket from 'ws';
import * as http from 'http';
import { extensionContext } from './extension'
import { AddressInfo } from 'net';

function coqViewToFileUri(uri: vscode.Uri) {
  return `file://${uri.path}?${uri.query}#${uri.fragment}`;
}

class IFrameDocumentProvider implements vscode.TextDocumentContentProvider {
  private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

  public provideTextDocumentContent(uri: vscode.Uri): string {
    return `<!DOCTYPE HTML><body style="margin:0px;padding:0px;width:100%;height:100vh;border:none;position:absolute;top:0px;left:0px;right:0px;bottom:0px">
<iframe src="${coqViewToFileUri(uri)}" seamless style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;border:none;margin:0px;padding:0px;width:100%;height:100%" />
</body>`;
  }

  public get onDidChange(): vscode.Event<vscode.Uri> {
    return this.onDidChangeEmitter.event;
  }
}

let coqViewProvider: IFrameDocumentProvider | null = null;

/**
 * Displays a Markdown-HTML file which contains javascript to connect to this view
 * and update the goals and show other status info
 */
export class HtmlLtacProf {
  private server: WebSocket.Server;
  private httpServer: http.Server;
  private serverReady: Promise<void>;
  private bufferReady: Promise<void>;
  private coqViewUri: vscode.Uri;
  private docRegistration: vscode.Disposable;

  constructor(private results: proto.LtacProfResults) {
    if (coqViewProvider === null) {
      coqViewProvider = new IFrameDocumentProvider();
      this.docRegistration = vscode.workspace.registerTextDocumentContentProvider('coq-ltacprof', coqViewProvider);
    }

    const httpServer = this.httpServer = http.createServer();
    this.serverReady = new Promise<void>((resolve, reject) => {
      httpServer.on('error', (err) => reject(err));
      httpServer.listen(0, 'localhost', undefined, () => {
        resolve();
      });
    });
    this.server = new WebSocket.Server({ server: httpServer });
    this.server.on('connection', (ws: WebSocket) => {
      ws.onmessage = (event) => this.handleClientMessage(event);
      ws.send(JSON.stringify(this.results));
    })

    this.createBuffer();
  }

  private handleClientMessage(event: { data: any; type: string; target: WebSocket }) {
  }

  private createBuffer() {
    this.bufferReady = new Promise<void>(async (resolve, reject) => {
      try {
        await this.serverReady;
        const serverAddress = this.httpServer.address();

        const templateFileName = vscode.Uri.file(extensionContext.asAbsolutePath('html_views/ltacprof/LtacProf.html'));
        this.coqViewUri = vscode.Uri.parse(`coq-view://${templateFileName.path.replace(/%3A/, ':')}?host=${(serverAddress as AddressInfo).address}&port=${(serverAddress as AddressInfo).port}`);
        console.log("LtacProf: " + decodeURIComponent(this.coqViewUri.with({ scheme: 'file' }).toString()));
        resolve();
        // this.show(true);
      } catch (err) {
        vscode.window.showErrorMessage(err.toString());
        reject();
      }
    });
  }

  public async update(results: proto.LtacProfResults) {
    await this.bufferReady;
    this.results = results;
    await Promise.all<void>(
      [...this.server.clients].map((c) => {
        if (c.readyState === c.OPEN)
          return new Promise<void>((resolve, reject) => c.send(JSON.stringify(this.results), (err) => resolve()));
        else
          return Promise.resolve();
      }));
  }

  public async show(preserveFocus: boolean) {
    await this.bufferReady;
    await vscode.commands.executeCommand('vscode.previewHtml', this.coqViewUri, vscode.ViewColumn.Two, "LtacProf");
  }

  dispose() {
    this.docRegistration.dispose();
  }
}
