import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode-languageserver';
import * as semver from 'semver';
import { URI } from 'vscode-uri'

import { ChildProcess, spawn } from 'child_process';
import { CoqTopSettings } from '@lib/settings';

import * as coqtop from './CoqTop';
export {
  Interrupted, CoqtopSpawnError, CallFailure,
  InitResult, AddResult, EditAtFocusResult, EditAtResult, ProofView,
  NoProofTag, ProofModeTag, NoProofResult, ProofModeResult, GoalResult
} from './CoqTop';
import { CoqtopSpawnError, InitResult } from './CoqTop';
import { IdeSlave as IdeSlave8, IdeSlaveState } from './IdeSlave8';
import { AddressInfo } from 'net';

export class CoqTop extends IdeSlave8 implements coqtop.CoqTop {
  private mainChannelServer: net.Server;
  private mainChannelServer2: net.Server;
  private controlChannelServer: net.Server;
  private controlChannelServer2: net.Server;
  private coqtopProc: ChildProcess = null;
  private readyToListen: Thenable<void>[];
  private settings: CoqTopSettings;
  private scriptUri: string;
  private projectRoot: string;
  private coqtopVersion: semver.SemVer;
  private sockets: net.Socket[] = [];

  constructor(settings: CoqTopSettings, scriptUri: string, projectRoot: string, console: vscode.RemoteConsole) {
    super(console);
    this.settings = settings;
    this.scriptUri = scriptUri;
    this.projectRoot = projectRoot;
    this.mainChannelServer = net.createServer();
    this.mainChannelServer2 = net.createServer();
    this.controlChannelServer = net.createServer();
    this.controlChannelServer2 = net.createServer();
    this.mainChannelServer.maxConnections = 1;
    this.mainChannelServer2.maxConnections = 1;
    this.controlChannelServer.maxConnections = 1;
    this.controlChannelServer2.maxConnections = 1;

    this.readyToListen = [
      this.startListening(this.mainChannelServer),
      this.startListening(this.mainChannelServer2),
      this.startListening(this.controlChannelServer),
      this.startListening(this.controlChannelServer2)
    ];

  }

  public dispose() {
    if (this.isRunning() && this.callbacks.onClosed) {
      this.callbacks.onClosed(false);
    }

    super.dispose();

    this.sockets.forEach(s => s.destroy());
    this.sockets = [];

    if (this.coqtopProc) {
      try {
        this.coqtopProc.kill();
        if (this.coqtopProc.connected)
          this.coqtopProc.disconnect();
      } catch (e) { }
      this.coqtopProc = null;
    }
    this.coqtopProc = null;
  }

  public isRunning(): boolean {
    return this.coqtopProc != null;
  }

  public async startCoq(): Promise<InitResult> {
    if (this.state !== IdeSlaveState.Disconnected)
      throw new CoqtopSpawnError(this.coqtopBin, "coqtop is already started");

    this.console.log('starting coqtop');

    let coqtopVersion = await coqtop.detectVersion(this.coqtopBin, this.projectRoot, this.console);

    if (coqtopVersion)
      this.console.log(`Detected coqtop version ${coqtopVersion}`)
    else {
      const fallbackVersion = "8.10"; //no changed behaviour in VS Coq since this version
      this.console.warn(`Could not detect coqtop version, defaulting to >= ${fallbackVersion}.`);
      coqtopVersion = fallbackVersion;
    }

    this.coqtopVersion = semver.coerce(coqtopVersion);
    this.console.log(`Coqtop version parsed into semver version ${this.coqtopVersion.format()}`);

    await this.setupCoqTopReadAndWritePorts();

    return await this.coqInit();
  }

  protected async checkState(): Promise<void> {
    if (this.coqtopProc === null)
      this.startCoq();
    super.checkState();
  }

  private startListening(server: net.Server): Promise<void> {
    const port = 0;
    const host = 'localhost';
    return new Promise<void>((resolve, reject) => {
      server.on('error', (err) => reject(err));
      server.listen({ port: port, host: host }, () => {
        const serverAddress = server.address() as AddressInfo;
        this.console.log(`Listening at ${serverAddress.address}:${serverAddress.port}`);
        resolve();
      });
    });
  }

  private acceptConnection(server: net.Server, name: string): Promise<net.Socket> {
    return new Promise<net.Socket>((resolve) => {
      server.once('connection', (socket: net.Socket) => {
        this.sockets.push(socket);
        this.console.log(`Client connected on ${name} (port ${socket.localPort})`);
        resolve(socket);
      });
    });
  }

  public getVersion() {
    return this.coqtopVersion;
  }

  /** Start coqtop.
   * Use two ports: one for reading & one for writing; i.e. HOST:READPORT:WRITEPORT
   */
  private async setupCoqTopReadAndWritePorts(): Promise<void> {
    await Promise.all(this.readyToListen);

    const mainAddr = this.mainChannelServer.address() as AddressInfo;
    const mainPortW = (this.mainChannelServer2.address() as AddressInfo).port;
    const controlAddr = this.controlChannelServer.address() as AddressInfo;
    const controlPortW = (this.controlChannelServer2.address() as AddressInfo).port;
    const mainAddressArg = mainAddr.address + ':' + mainAddr.port + ':' + mainPortW;
    const controlAddressArg = controlAddr.address + ':' + controlAddr.port + ':' + controlPortW;

    try {
      this.startCoqTop(this.spawnCoqTop(mainAddressArg, controlAddressArg));
    } catch (error) {
      this.console.error('Could not spawn coqtop: ' + error);
      throw new CoqtopSpawnError(this.coqtopBin, error);
    }

    const channels = await Promise.all([
      this.acceptConnection(this.mainChannelServer, 'main channel R'), //, 'main channel R', (data) => this.onMainChannelR(data)),
      this.acceptConnection(this.mainChannelServer2, 'main channel W'),
      this.acceptConnection(this.controlChannelServer, 'control channel R'),
      this.acceptConnection(this.controlChannelServer2, 'control channel W'),
    ]);

    this.connect(this.coqtopVersion, channels[0], channels[1], channels[2], channels[3])
  }

  private startCoqTop(process: ChildProcess) {
    this.coqtopProc = process;
    this.console.log(`coqtop started with pid ${this.coqtopProc.pid}`);
    this.coqtopProc.stdout.on('data', (data: string) => this.coqtopOut(data))
    this.coqtopProc.on('exit', (code: number) => {
      this.console.log('coqtop exited with code: ' + code);
      if (this.isRunning() && this.callbacks.onClosed)
        this.callbacks.onClosed(false, 'coqtop closed with code: ' + code);
      this.dispose();
    });
    this.coqtopProc.stderr.on('data', (data: string) => {
      this.console.log('coqtop-stderr: ' + data);
    });
    this.coqtopProc.on('close', (code: number) => {
      this.console.log('coqtop closed with code: ' + code);
      if (this.isRunning() && this.callbacks.onClosed)
        this.callbacks.onClosed(false, 'coqtop closed with code: ' + code);
      this.dispose();
    });
    this.coqtopProc.on('error', (code: number) => {
      this.console.log('coqtop could not be started: ' + code);
      if (this.isRunning() && this.callbacks.onClosed)
        this.callbacks.onClosed(true, 'coqtop closed with code: ' + code);
      this.dispose();
    });
  }

  private coqtopOut(data: string) {
    this.console.log('coqtop-stdout:' + data);
  }

  private get coqtopBin() {
    return path.join(this.settings.binPath.trim(), this.settings.coqtopExe);
  }

  private get coqidetopBin() {
    return path.join(this.settings.binPath.trim(), this.settings.coqidetopExe);
  }

  private get scriptPath() {
    const uri = URI.parse(this.scriptUri);
    if (uri.scheme == "file")
      return uri.fsPath;
    else
      return undefined
  }

  private spawnCoqTop(mainAddr: string, controlAddr: string) {
    let topfile: string[] = [];
    const scriptPath = this.scriptPath;
    if (semver.satisfies(this.coqtopVersion, ">= 8.10") && scriptPath !== undefined) {
      topfile = ['-topfile', scriptPath];
    }
    if (semver.satisfies(this.coqtopVersion, ">= 8.9")) {
      var coqtopModule = this.coqidetopBin;
      var args = [
        '-main-channel', mainAddr,
        '-control-channel', controlAddr,
        '-async-proofs', 'on',
        ...this.settings.args,
        ...topfile
      ];
    } else {
      var coqtopModule = this.coqtopBin;
      var args = [
        '-main-channel', mainAddr,
        '-control-channel', controlAddr,
        '-ideslave',
        '-async-proofs', 'on',
        ...this.settings.args
      ];
    }
    this.console.log('exec: ' + coqtopModule + ' ' + args.join(' '));
    return spawn(coqtopModule, args, { detached: false, cwd: this.projectRoot });
  }

  public async coqInterrupt(): Promise<boolean> {
    if (!this.coqtopProc)
      return false;
    else {
      this.console.log('--------------------------------');
      this.console.log('Sending SIGINT');
      this.coqtopProc.kill("SIGINT");
      return true;
    }
  }
}
