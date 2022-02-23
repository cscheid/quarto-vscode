/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

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

connection.onCompletion(async (textDocumentPosition, token) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);

  if (!document) {
    return null;
  }

  return null;
});

connection.onHover(async (textDocumentPosition, position) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);

  if (!document) {
    return null;
  }

  return null;
});

connection.onSignatureHelp(async (textDocumentPosition, position) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);

  if (!document) {
    return null;
  }

  return null;
});

documents.listen(connection);
connection.listen();
