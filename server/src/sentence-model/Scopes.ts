import * as vscode from 'vscode-languageserver';
import * as ast from '../parsing/ast-types';
import * as parser from '../parsing/coq-parser';
import * as textUtil from '@lib/text-util';


export type QualId = string[];

export function resolveQualId(id1: QualId, id2: QualId) : QualId | null { 
  if(id2.length > id1.length)
    return null;
  let idx = 1;
  for(/**/; idx <= id2.length; ++idx) {
    const fPart = id1[id1.length - idx];
    const sPart = id2[id2.length - idx];
    if(fPart !== sPart)
      return null;
  }
  return [...id1.slice(0,id1.length-idx+1), ...id2];
}


export function matchQualId(x: QualId, y: QualId) : {which: 0|1, prefix: QualId, id: QualId}|null {
  let which: 0|1 = 0;
  if(x.length > y.length)
    [which,x,y] = [1,y,x];
  // x is now the shortest
  let idx = 1;
  for(/**/; idx <= x.length; ++idx) {
    const partX = x[x.length - idx];
    const partY = y[y.length - idx];
    if(partX !== partY)
      return null;
  }
  return {
    which: which,
    prefix: y.slice(0, y.length - idx + 1),
    id: x };
  }

export interface SymbolInformation<S> {
  /** where the definition is named */
  symbol: Symbol,
  /** full qualified id  */
  id: QualId;
  /** the sentence that created the definition */
  source: S;
  /** */
  assumedPrefix: QualId;
}

export function qualIdEqual(x: QualId, y: QualId) {
  if(x.length !== y.length)
    return false;
  for(let idx = 0; idx < x.length; ++idx) {
    if(x[idx] !== y[idx])
      return false;
  }
  return true;
}

export enum SymbolKind {
  Definition,
  Class,
  Inductive,
  Constructor,
  Module,
  Let,
  Section,
  Ltac,
  Assumption,
}

export interface Symbol {
  identifier: string,
  range: vscode.Range,
  kind: SymbolKind,
}

export enum ScopeFlags {
  Private = 1 << 0,
  Local = 1 << 1,
  Export = 1 << 2,
  All = Private | Local | Export,
}

export class ScopeDeclaration<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}> {
  /** Symbols that are available within this scope. */
  private privateSymbols : Symbol[] = [];
  /** Symbols that are made available to this scope's subsequent siblings. */
  private localSymbols : Symbol[] = [];
  /** Symbols that are made available outside of this scope's parent. */
  private exportSymbols : Symbol[] = [];

  public constructor(
    /** The sentence which defined this scope */
    private source: S,
    private myId : QualId,
    protected node: {kind: "begin", name: string, exports: boolean}|{kind: "end", name: string}|null,
  ) {

  }

  public static createSection<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(source: S, name: string, range: vscode.Range) {
    const result = new ScopeDeclaration(source, [], {kind: "begin", name: name, exports: true});
    result.privateSymbols.push({identifier: name, range: range, kind: SymbolKind.Section});
    return result;
  }

  public static createModule<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(source: S, name: string, exports: boolean, range: vscode.Range) {
    const result = new ScopeDeclaration(source, [name], {kind: "begin", name: name, exports: exports});
    result.exportSymbols.push({identifier: name, range: range, kind: SymbolKind.Module});
    return result;
  }

  public static createEnd<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(source: S, name: string) {
    const result = new ScopeDeclaration(source, [], {kind: "end", name: name});
    return result;
  }

  public static createDefinition<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(source: S, name: string, range: vscode.Range) {
    const result = new ScopeDeclaration(source, [], null);    
    result.exportSymbols.push({identifier: name, range: range, kind: SymbolKind.Module});
    return result;
  }

  public addPrivateSymbol(s: Symbol) : void {
    this.privateSymbols.push(s);
  }

  public addLocalSymbol(s: Symbol) : void {
    this.localSymbols.push(s);
  }

  public addExportSymbol(s: Symbol) : void {
    this.exportSymbols.push(s);
  }

  private lookupSymbolInList(id: QualId, symbols: Symbol[]) : SymbolInformation<S>|null {
    const matchedId = matchQualId(id.slice(0,id.length-1), this.myId);
    if(!matchedId)
      return null;
    let assumedPrefix : QualId = [];
    if(matchedId.which===1)
      assumedPrefix = matchedId.prefix;

    for(let s of symbols) {
      if(id[id.length-1] === s.identifier)
        return {
          symbol: s,
          assumedPrefix: assumedPrefix,
          id: matchedId.id.concat(s.identifier),
          source: this.source,
        }
    }
    return null;
  }

  private lookupHere(id: QualId, flags: ScopeFlags) : SymbolInformation<S>|null {
    if(flags & ScopeFlags.Private) {
      const result = this.lookupSymbolInList(id, this.privateSymbols);
      if(result)
        return result;
    }
    if(flags & ScopeFlags.Local) {
      const result = this.lookupSymbolInList(id, this.localSymbols);
      if(result)
        return result;
    }
    if(flags & ScopeFlags.Export) {
      const result = this.lookupSymbolInList(id, this.exportSymbols);
      if(result)
        return result;
    }
    return null;
  }

  private getPreviousSentence() : ScopeDeclaration<S>|null {
    if(this.source.prev)
      return this.source.prev.getScope()
    else
      return null;
  }

  public isBegin(name?: string) : this is ScopeDeclaration<S>&{node: {kind:"begin",name:string,exports:boolean}} {
    return (this.node && this.node.kind==="begin" && (!name || name===this.node.name)) ? true : false
  }

  public isEnd(name?: string) : this is ScopeDeclaration<S>&{node: {kind:"end",name:string}} {
    return (this.node && this.node.kind==="end" && (!name || name===this.node.name)) ? true : false
  }

  private getParentScope() : ScopeDeclaration<S>|null{
    let nesting = 0;
    let scope : ScopeDeclaration<S> = this.getPreviousSentence();
    while(scope) {
      if(scope.isEnd())
        ++nesting;
      else if(scope.isBegin() && nesting > 0)
        --nesting;
      else if(scope.isBegin() && nesting === 0)
        return scope;

      scope = scope.getPreviousSentence();
    }
    return null;
  }

  public getPrefixes() : QualId[] {
    let prefixes : QualId[] = [];
    let scope = this.getParentScope();
    while(scope) {
      if(scope.isBegin() && scope.node.exports)
        prefixes = [...prefixes, ...prefixes.map((p) => [...scope.myId, ...p])]
      else
        prefixes = prefixes.map((p) => [...scope.myId, ...p]);
      scope = scope.getParentScope();
    }
    if(prefixes.length === 0)
      return [[]];
    else
      return prefixes;
  }

  private resolveSymbol(s: SymbolInformation<S>|null, idPrefixes: QualId[]) : SymbolInformation<S>|null {
    if(!s)
      return null;
    const myPrefixes = this.getPrefixes();
    const prefix = myPrefixes.find(p1 => idPrefixes.some(p2 => qualIdEqual(p1,p2)));
    if(prefix) {
      s.assumedPrefix = [];
      s.id = [...prefix, ...s.id];
      return s;
    } else
      return null;
  }

  private resolveId(id: QualId, idPrefixes: QualId[], flags: ScopeFlags) : SymbolInformation<S>|null {
    return this.resolveSymbol(this.lookupHere(id, flags), idPrefixes);
  }

  public lookup(id: QualId, flags: ScopeFlags) : SymbolInformation<S>[] {
    let idPrefixes = this.getPrefixes();
    let results : SymbolInformation<S>[] = [];
    let scope : ScopeDeclaration<S> = this;
    const flagStack : ScopeFlags[] = [];
    while(scope) {
      const result = scope.resolveId(id,idPrefixes,flags);
      if(result)
        results.push(result);
      // Only check the internals of the first declaration
      flags &= ~ScopeFlags.Private;

      if(scope.isEnd()) {
        flagStack.push(flags);
        flags &= ~ScopeFlags.Local;
      } else if(scope.isBegin() && flagStack.length > 0)
        flags = flagStack.pop();
      scope = scope.getPreviousSentence();
    }

    return results;
  }

}


namespace parseAstSymbols {
  function identToSymbol(ident: ast.Identifier, kind: SymbolKind, pos: vscode.Position) : Symbol {
    return {
      identifier: ident.text,
      kind: kind,
      range: textUtil.rangeTranslateRelative(pos,parser.locationRangeToRange(ident.loc))
    };  
  }
  
  export function definition<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SDefinition, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Definition, pos));
    return result;
  }
  export function inductive<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SInductive, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    ast.bodies.forEach(body => {
      result.addExportSymbol(identToSymbol(body.ident, SymbolKind.Inductive, pos));
      body.constructors.forEach(c => {
        result.addExportSymbol(identToSymbol(c.ident, SymbolKind.Constructor, pos));        
      });
    });
    return result;
  }
  export function ltacDef<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SLtacDef, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Ltac, pos));
    return result;
  }
  export function assumptions<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SAssumptions, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    ast.idents.forEach(a => {
      result.addLocalSymbol(identToSymbol(a, SymbolKind.Assumption, pos));
    });
    return result;
  }
  export function section<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SSection, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], {kind: "begin", name: ast.ident.text, exports: true});
    return result;
  }
  export function module<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SModule, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [ast.ident.text], {kind: "begin", name: ast.ident.text, exports: ast.intro==="Export"});
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
    return result;
  }
  export function moduleType<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SModuleType, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [ast.ident.text], {kind: "begin", name: ast.ident.text, exports: false});
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
    return result;
  }
  export function moduleBind<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SModuleBind, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
    return result;
  }
  export function moduleTypeBind<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.SModuleTypeBind, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
    const result = new ScopeDeclaration(sent, [], null);
    result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
    return result;
  }
}

export function parseAstForScopeDeclarations<S extends {prev: S, next: S, getScope() : ScopeDeclaration<S>|null}>(ast: ast.Sentence, sent: S, pos: vscode.Position) : ScopeDeclaration<S> {
  try {
    switch(ast.type) {
    case "assumptions": return parseAstSymbols.assumptions(ast,sent,pos);
    case "definition": return parseAstSymbols.definition(ast,sent,pos);
    case "inductive": return parseAstSymbols.inductive(ast,sent,pos);
    case "ltacdef": return parseAstSymbols.ltacDef(ast,sent,pos);
    case "section": return parseAstSymbols.section(ast,sent,pos);
    case "module": return parseAstSymbols.module(ast,sent,pos);
    case "module-bind": return parseAstSymbols.moduleBind(ast,sent,pos);
    case "module-type": return parseAstSymbols.moduleType(ast,sent,pos);
    case "module-type-bind": return parseAstSymbols.moduleTypeBind(ast,sent,pos);
    default:  
      return new ScopeDeclaration(sent,[], null);
    }
  } catch(err) {
    // debugger;
    return new ScopeDeclaration(sent,[], null);
  }
}




