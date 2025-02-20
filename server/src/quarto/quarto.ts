/* --------------------------------------------------------------------------------------------
 * Copyright (c) RStudio, PBC. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URL } from "url";
import * as child_process from "child_process";

import { TextDocument } from "vscode-languageserver-textdocument";
import { Position, Range, CompletionItem } from "vscode-languageserver-types";
import { isQuartoDoc, isQuartoRevealDoc, isQuartoYaml } from "../core/doc";
import { initializeAttrCompletionProvider, AttrToken } from "./quarto-attr";
import { initializeQuartoYamlModule, QuartoYamlModule } from "./quarto-yaml";

export interface EditorContext {
  path: string;
  filetype: string;
  embedded: boolean;
  line: string;
  code: string;
  position: {
    row: number;
    column: number;
  };
  explicit: boolean;
  trigger?: string;
  formats: string[];
  project_formats: string[];
  engine: string;
  client: string;
}

export function editorContext(
  doc: TextDocument,
  pos: Position,
  explicit: boolean,
  trigger?: string
) {
  const path = new URL(doc.uri).pathname;
  const filetype = isQuartoDoc(doc)
    ? "markdown"
    : isQuartoYaml(doc)
    ? "yaml"
    : "markdown"; // should never get here
  const embedded = false;
  const code = doc.getText();
  const line = doc
    .getText(Range.create(pos.line, 0, pos.line, code.length))
    .replace(/[\r\n]+$/, "");
  const position = { row: pos.line, column: pos.character };

  // detect reveal document
  const formats: string[] = [];
  if (isQuartoRevealDoc(doc)) {
    formats.push("revealjs");
  }

  return {
    path,
    filetype,
    embedded,
    line,
    code,
    position,
    explicit,
    trigger,
    formats,
    project_formats: [],
    engine: "jupyter",
    client: "lsp",
  };
}

export const kStartRow = "start.row";
export const kStartColumn = "start.column";
export const kEndRow = "end.row";
export const kEndColumn = "end.column";

export interface LintItem {
  [kStartRow]: number;
  [kStartColumn]: number;
  [kEndRow]: number;
  [kEndColumn]: number;
  text: string;
  type: string;
}

export interface CompletionResult {
  token: string;
  completions: Completion[];
  cacheable: boolean;
}

export interface HoverResult {
  content: string;
  range: { start: Position; end: Position };
}

export interface Completion {
  type: string;
  value: string;
  display?: string;
  description?: string;
  suggest_on_accept?: boolean;
  replace_to_end?: boolean;
}

export interface Quarto {
  getYamlCompletions(context: EditorContext): Promise<CompletionResult>;
  getAttrCompletions(
    token: AttrToken,
    context: EditorContext
  ): Promise<CompletionItem[]>;
  getYamlDiagnostics(context: EditorContext): Promise<LintItem[]>;
  getHover(context: EditorContext): Promise<HoverResult | null>;
}

export let quarto: Quarto | undefined;

export function initializeQuarto() {
  let paths = child_process.execSync("quarto --paths", { encoding: "utf-8" });
  const resources = (paths as unknown as string).split(/\r?\n/)[1];
  initializeQuartoYamlModule(resources)
    .then((mod) => {
      const quartoModule = mod as QuartoYamlModule;
      quarto = {
        getYamlCompletions: quartoModule.getCompletions,
        getAttrCompletions: initializeAttrCompletionProvider(resources),
        getYamlDiagnostics: quartoModule.getLint,
        getHover: quartoModule.getHover,
      };
    })
    .catch((error) => {
      console.log(error);
    });
}
