/// <reference path="../../typings/colResizable.jquery.d.ts" />
/// <reference path="../../typings/tbltree.jquery.d.ts" />
import * as $ from 'jquery';
import { WebviewApi } from 'vscode-webview';

interface LtacProfTactic {
  name: string,
  statistics: { total: number; local: number; num_calls: number; max_total: number },
  tactics: LtacProfTactic[],
}

interface LtacProfResults {
  total_time: number,
  tactics: LtacProfTactic[],
}

declare const acquireVsCodeApi: any;
export const vscode: WebviewApi<unknown> = acquireVsCodeApi();

function ltacProfLoad() {
  if (parent.parent === parent)
    document.body.style.backgroundColor = 'black';

  window.addEventListener('message', event => {
    const results = <LtacProfResults>JSON.parse(event.data);
    addResults(results);
  })
}

function loadResultsTable(results: LtacProfResults, tbody: JQuery) {
  let currentId = 0;
  const totalTime = results.total_time;

  function buildTime(time: number, total: number, name: string) {
    if (time == 0)
      return $(document.createElement('td')).text("");
    else {
      const seconds = time.toFixed(3);
      const minutes = (time / 60).toFixed(1);
      const hh = Math.floor(time / 3600);
      const mm = Math.floor((time - hh * 3600) / 60);
      const ss = time - mm * 60;
      const hhmmss = `${hh}:${mm}:${ss.toFixed(1)}`;
      const percent = (time / totalTime * 100).toFixed(1) + "%";
      return $(document.createElement('td'))
        .append($(document.createElement('span')).addClass(name).addClass('seconds').text(seconds).hide())
        .append($(document.createElement('span')).addClass(name).addClass('minutes').text(minutes).hide())
        .append($(document.createElement('span')).addClass(name).addClass('hhmmss').text(hhmmss).hide())
        .append($(document.createElement('span')).addClass(name).addClass('percent').text(percent).show());
    }
  }

  function* buildTacticResultRow(parentId: number, tactic: LtacProfTactic): IterableIterator<JQuery> {
    ++currentId;
    yield $(document.createElement('tr'))
      .attr('row-id', currentId)
      .map((idx, elm) => parentId > 0 ? $(elm).attr('parent-id', parentId).get() : elm)
      .attr('tabindex', currentId)
      .append($(document.createElement('td')).text(tactic.name))
      .append(buildTime(tactic.statistics.local, totalTime, 'local'))
      .append(buildTime(tactic.statistics.total, totalTime, 'total'))
      .append($(document.createElement('td')).text(tactic.statistics.num_calls))
      .append($(document.createElement('td')).text(tactic.statistics.max_total.toFixed(3)));
    yield* buildTacticsResults(currentId, tactic.tactics);
  }

  function* buildTacticsResults(parentId: number, tactics: LtacProfTactic[]): IterableIterator<JQuery> {
    for (const tactic of tactics) {
      yield* buildTacticResultRow(parentId, tactic);
    }
  }

  console.time('load');
  for (const entry of buildTacticsResults(0, results.tactics))
    tbody.append(entry);
  console.timeEnd('load');
}

function getDescendants(node: JQuery): JQuery {
  const level = node.attr('level');
  return node.nextUntil(`[level=${level}]`, 'tr');
}

function expandNode(node: JQuery, recursive: boolean): JQuery {
  if (recursive) {
    getDescendants(node)
      .removeClass('tbltree-collapsed')
      .addClass('tbltree-expanded');
  }
  return $('#results').tbltree('expand', node, 1);
}

function collapseNode(node: JQuery, recursive: boolean): JQuery {
  if (recursive) {
    getDescendants(node)
      .addClass('tbltree-collapsed')
      .removeClass('tbltree-expanded');
  }
  return $('#results').tbltree('collapse', node, 1);
}

function isExpanded(node: JQuery): boolean {
  return $('#results').tbltree('isExpanded', node);
}

function getParentNode(node: JQuery): JQuery {
  return $('#results').tbltree('getRow', $('#results').tbltree('getParentID', node));
}

let updateResultsAlternatingBackgroundTimer: number;
function updateResultsAlternatingBackground(delay?: number) {
  if (updateResultsAlternatingBackgroundTimer)
    clearTimeout(updateResultsAlternatingBackgroundTimer);
  if (delay)
    updateResultsAlternatingBackgroundTimer = window.setTimeout(() => updateResultsAlternatingBackground(), delay);
  else {
    $('#results tr:visible:even').removeClass('result-odd');
    $('#results tr:visible:odd').addClass('result-odd');
  }
}

const currentResults: LtacProfResults = { total_time: 0, tactics: [] };

function addResults(results: LtacProfResults) {
  if (results.total_time === 0) {
    // This could be 0 because of a bug in Coq 8.6 :/
    // Recompute the total by hand...
    currentResults.total_time = results.tactics.map(x => x.statistics.total).reduce((s, v) => s + v, 0);
  }
  currentResults.total_time += results.total_time;
  currentResults.tactics = currentResults.tactics.concat(results.tactics);
  updateResults();
}

function onKeyDown(e: JQueryKeyEventObject) {
  const f = $(':focus');
  switch (e.which) {
    case 39: // right
      expandNode(f, e.shiftKey);
      break;
    case 37: // left
      if (isExpanded(f))
        collapseNode(f, e.shiftKey);
      else {
        getParentNode(f).focus();
        collapseNode(getParentNode(f), e.shiftKey);
      }
      break;
    case 38: // up
      f.prevAll('tr:visible').first().focus();
      break;
    case 40: //down
      f.nextAll('tr:visible').first().focus();
      break;
    default:
      return;
  }
  e.preventDefault();
}

function updateResults() {
  let tbody = $('#results tbody');
  if (tbody.length > 0)
    tbody.empty();
  else {// Set up the table
    tbody = $('<tbody>');
    $('#results').append(tbody);
    $('#results').on("keydown", onKeyDown);

    $('#local-unit').on("change", (ev: JQueryEventObject) => {
      const tag = $('#local-unit option:selected').val();
      $('#results span.local').not('.' + tag).hide();
      $('#results span.local').filter('.' + tag).show();
    });
    $('#total-unit').on("change", (ev: JQueryEventObject) => {
      const tag = $('#total-unit option:selected').val();
      $('#results span.total').not('.' + tag).hide();
      $('#results span.total').filter('.' + tag).show();
    });
    $('#local-column').on("click", (ev: JQueryEventObject) => {
      if (ev.target === $('#local-column').get(0))
        ($('#local-unit option:selected').prop('selected', false) as any).cycleNext().prop('selected', true); $('#local-unit').change()
    });
    $('#total-column').on("click", (ev: JQueryEventObject) => {
      if (ev.target === $('#total-column').get(0))
        ($('#total-unit option:selected').prop('selected', false) as any).cycleNext().prop('selected', true); $('#total-unit').change()
    });
  }
  loadResultsTable(currentResults, tbody);

  console.time('tbltree');
  $('#results').tbltree({
    initState: 'collapsed',
    saveState: false,
    change: () => updateResultsAlternatingBackground(50),
  });
  console.timeEnd('tbltree');

  updateResultsAlternatingBackground(0);
}

addEventListener('load', ltacProfLoad);
