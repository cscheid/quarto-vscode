/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  HandlerResult,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompletionItem, CompletionItemKind, CompletionList } from "vscode";

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: false,
        // register a superset of all trigger characters for embedded languages
        // (languages are responsible for declaring which one they support if any)
        triggerCharacters: [".", "$", "@", ":", "\\"],
      },
      hoverProvider: true,
      signatureHelpProvider: {
        // assume for now that these cover all languages (we can introduce
        // a refinement system like we do for completion triggers if necessary)
        triggerCharacters: ["(", ","],
        retriggerCharacters: [")"],
      },
    },
  };
});

const kQuartoLanguageId = "quarto";
const kYamlLanguageId = "yaml";

function isQuartoDoc(doc: TextDocument) {
  return doc.languageId === kQuartoLanguageId;
}

function isQuartoYaml(doc: TextDocument) {
  return doc.languageId === "yaml" && doc.uri.match(/_quarto\.ya?ml$/);
}

connection.onCompletion(async (textDocumentPosition, token) => {
  const doc = documents.get(textDocumentPosition.textDocument.uri);
  if (!doc) {
    return null;
  }
  if (isQuartoDoc(doc)) {
    // quarto
  } else if (isQuartoYaml(doc)) {
    // yaml
  }

  return null;
});

connection.onHover(async (textDocumentPosition, position) => {
  const doc = documents.get(textDocumentPosition.textDocument.uri);
  if (!doc) {
    return null;
  }
  if (isQuartoDoc(doc)) {
    // quarto
  } else if (isQuartoYaml(doc)) {
    // yaml
  }

  return null;
});

connection.onSignatureHelp(async (textDocumentPosition, position) => {
  const doc = documents.get(textDocumentPosition.textDocument.uri);
  if (!doc) {
    return null;
  }
  if (isQuartoDoc(doc)) {
    // quarto
  } else if (isQuartoYaml(doc)) {
    // yaml
  }

  return null;
});

documents.listen(connection);
connection.listen();
