import { TokenKind } from '../token.js';
import { AiScriptSyntaxError } from '../../error.js';
import { NODE } from '../utils.js';
import { parseStatement } from './statements.js';
import { parseExpr } from './expressions.js';

import type { ITokenStream } from '../streams/token-stream.js';
import type * as Ast from '../../node.js';

/**
 * ```abnf
 * Params = "(" [IDENT [":" Type] *(SEP IDENT [":" Type])] ")"
 * ```
*/
export function parseParams(s: ITokenStream): { name: string, argType?: Ast.Node }[] {
	const items: { name: string, argType?: Ast.Node }[] = [];

	s.nextWith(TokenKind.OpenParen);

	if (s.kind === TokenKind.NewLine) {
		s.next();
	}

	while (s.kind !== TokenKind.CloseParen) {
		s.expect(TokenKind.Identifier);
		const name = s.token.value!;
		s.next();

		let type;
		if ((s.kind as TokenKind) === TokenKind.Colon) {
			s.next();
			type = parseExpr(s, false);
		}

		items.push({ name, argType: type });

		// separator
		switch (s.kind as TokenKind) {
			case TokenKind.NewLine: {
				s.next();
				break;
			}
			case TokenKind.Comma: {
				s.next();
				if (s.kind === TokenKind.NewLine) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseParen: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('separator expected', s.token.loc);
			}
		}
	}

	s.nextWith(TokenKind.CloseParen);

	return items;
}

/**
 * ```abnf
 * Block = "{" *Statement "}"
 * ```
*/
export function parseBlock(s: ITokenStream): Ast.Node[] {
	s.nextWith(TokenKind.OpenBrace);

	while (s.kind === TokenKind.NewLine) {
		s.next();
	}

	const steps: Ast.Node[] = [];
	while (s.kind !== TokenKind.CloseBrace) {
		steps.push(parseStatement(s));

		// terminator
		switch (s.kind as TokenKind) {
			case TokenKind.NewLine:
			case TokenKind.SemiColon: {
				while ([TokenKind.NewLine, TokenKind.SemiColon].includes(s.kind)) {
					s.next();
				}
				break;
			}
			case TokenKind.CloseBrace: {
				break;
			}
			default: {
				throw new AiScriptSyntaxError('Multiple statements cannot be placed on a single line.', s.token.loc);
			}
		}
	}

	s.nextWith(TokenKind.CloseBrace);

	return steps;
}
