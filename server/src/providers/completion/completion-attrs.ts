import {
  CompletionItem,
  CompletionItemKind,
  Range,
  TextEdit,
} from "vscode-languageserver/node";
import { EditorContext, quarto } from "../../quarto/quarto";
import { AttrToken } from "../../quarto/quarto-attr";

export async function attrCompletions(context: EditorContext) {
  // bail if no quarto connection
  if (!quarto) {
    return null;
  }

  // validate trigger
  if (context.trigger && !["-", "="].includes(context.trigger)) {
    return null;
  }

  // check for simple div
  let token = simpleDivToken(context);

  // bypass if the current line doesn't contain a {
  // (performance optimization so we don't execute the regexs
  // below if we don't need to)
  if (!token && context.line.indexOf("{") === -1) {
    return null;
  }

  // see what kind of token we might have
  token =
    token || blockCompletionToken(context) || figureCompletionToken(context);
  if (token) {
    return quarto.getAttrCompletions(token, context);
  } else {
    return null;
  }
}

function resolveCompletions(
  token: AttrToken,
  context: EditorContext
): CompletionItem[] {
  const kDivCompletions = [
    ".callout",
    ".callout-note",
    ".callout-tip",
    ".callout-important",
    ".callout-caution",
    ".callout-warning",
  ];
  if (token.context === "div") {
    return kDivCompletions
      .filter(
        (completion) =>
          completion.startsWith(token.token) && completion !== token.token
      )
      .map((completion) => {
        const edit = TextEdit.replace(
          Range.create(
            context.position.row,
            context.position.column - token.token.length,
            context.position.row,
            context.position.column
          ),
          completion
        );
        const item: CompletionItem = {
          label: completion,
          textEdit: edit,
          kind: CompletionItemKind.Field,
        };

        return item;
      });
  } else {
    return [];
  }
}

const kBlockAttrRegex = /^([\t >]*(`{3,}|\#+|\:{3,}).*?\{)(.*?)\}[ \t]*$/;
function blockCompletionToken(context: EditorContext): AttrToken | undefined {
  return matchCompletionToken(context, kBlockAttrRegex, (type) => {
    return type.indexOf(":") !== -1
      ? "div"
      : type.indexOf("#") !== -1
      ? "heading"
      : "codeblock";
  });
}

const kSimpleDivRegex = /(^[\t >]*(?:\:{3,})\s+)([\w-]+)\s*$/;
function simpleDivToken(context: EditorContext): AttrToken | undefined {
  const match = context.line.match(kSimpleDivRegex);
  // if we are at the end then return a token
  if (context.line.slice(context.position.column).trim() === "") {
    if (match) {
      return {
        formats: [],
        context: "div-simple",
        attr: match[2],
        token: match[2],
      };
    }
  }
}

const kFigureAttrRegex =
  /^([\t >]*(\!\[[^\]]*\]\([^\]]+\))\{)([^\}]*)\}[ \t]*$/;
function figureCompletionToken(context: EditorContext): AttrToken | undefined {
  return matchCompletionToken(context, kFigureAttrRegex, (type) => "figure");
}

function matchCompletionToken(
  context: EditorContext,
  pattern: RegExp,
  type: (type: string) => string
): AttrToken | undefined {
  const match = context.line.match(pattern);
  if (match) {
    // is the cursor in the attr region? (group 3)
    const beginAttr = match[1].length;
    const endAttr = match[1].length + match[3].length;
    const col = context.position.column;

    if (col >= beginAttr && col <= endAttr) {
      // is the next character a space or '}' ?
      if (context.line[col] === " " || context.line[col] === "}") {
        // token is the current location back to the next space or {
        const attrToCursor = context.line.slice(beginAttr, col);
        const spacePos = attrToCursor.lastIndexOf(" ");
        const token =
          spacePos !== -1
            ? match[3].slice(spacePos + 1, col - beginAttr)
            : match[3].slice(0, col - beginAttr);

        // return scope & token
        return {
          context: type(match[2]),
          attr: match[3],
          token,
        } as AttrToken;
      }
    }
  }
}
