/*
 * The smallest units of interpretation.
 * Separated from process.ts due to the amount of text.
 */

import type * as Ast from '../node.js';
import { AiScriptError, NonAiScriptError, AiScriptIndexOutOfRangeError, AiScriptRuntimeError } from '../error.js';
import { AiScriptProcess } from './process.js';
import { Scope } from './scope.js';
import { Variable } from 'variable.ts';
import { getPrimProp } from './primitive-props.js';
import { NULL, RETURN, unWrapRet, FN_NATIVE, BOOL, NUM, STR, ARR, OBJ, FN, BREAK, CONTINUE, ERROR } from './value.js';
import { assertNumber, assertString, assertFunction, assertBoolean, assertObject, assertArray, eq, isObject, isArray, expectAny, reprValue } from './util.js';

export async function evalNode(proc: AiScriptProcess, node: Ast.Node, scope: Scope): Promise<Value> {
	if (proc.aborted) throw "aborted";

	const interpreter = proc.interpreter;
	const opts = interpreter.opts;
	if (interpreter.stepCount % opts.irq_rate === opts.irq_at) await new Promise(resolve => setTimeout(resolve, 5));
	interpreter.stepCount++;
	if (opts.maxStep && interpreter.stepCount > opts.maxStep) {
		throw new AiScriptRuntimeError('max step exceeded');
	}

	async function evalNodeHere(newNode: Ast.Node) {
		return evalNode(proc, newNode, scope);
	}
	async function evalNodeInChildScope(newNode: Ast.Node, newVariables?: [string, Variable][], scopeName?: Scope['name']) {
		return evalNode(proc, newNode, scope.createChildScope(newVariables, scopeName));
	}

	switch (node.type) {
		case 'call': {
			const callee = await evalNodeHere(node.target);
			assertFunction(callee);
			const args = await Promise.all(node.args.map(expr => evalNodeHere(expr, scope)));
			return proc._fn(callee, args);
		}

		case 'if': {
			const cond = await evalNodeHere(node.cond);
			assertBoolean(cond);
			if (cond.value) {
				return evalNodeHere(node.then);
			}
			if (node.elseif) {
				for (const elseif of node.elseif) {
					const cond = await evalNodeHere(elseif.cond);
					assertBoolean(cond);
					if (cond.value) {
						return evalNodeHere(elseif.then);
					}
				}
			}
			if (node.else) {
				return evalNodeHere(node.else);
			}
			return NULL;
		}

		case 'match': {
			const about = evalNodeHere(node.about);
			for (const qa of node.qs) {
				const q = await evalNodeHere(qa.q);
				if (eq(about, q)) {
					return evalNodeHere(qa.a);
				}
			}
			if (node.default) {
				return evalNodeHere(node.default);
			}
			return NULL;
		}

		case 'loop': {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const v = await proc._run(node.statements, scope.createChildScope());
				if (v.type === 'break') {
					break;
				} else if (v.type === 'return') {
					return v;
				}
			}
			return NULL;
		}

		case 'for': {
			if (node.times) {
				const times = await evalNodeHere(node.times);
				assertNumber(times);
				for (let i = 0; i < times.value; i++) {
					const v = await evalNodeHere(node.for);
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
			} else {
				const from = await evalNodeHere(node.from!);
				const to = await evalNodeHere(node.to!);
				assertNumber(from);
				assertNumber(to);
				for (let i = from.value; i < from.value + to.value; i++) {
					const v = await evalNodeInChildScope(node.for, [
						[node.var!, Variable.const(NUM(i))],
					]);
					if (v.type === 'break') {
						break;
					} else if (v.type === 'return') {
						return v;
					}
				}
			}
			return NULL;
		}

		case 'each': {
			const items = await evalNodeHere(node.items);
			assertArray(items);
			for (const item of items.value) {
				const v = await evalNodeInChildScope(node.for, [
					[node.var, Variable.const(item)],
				]);
				if (v.type === 'break') {
					break;
				} else if (v.type === 'return') {
					return v;
				}
			}
			return NULL;
		}

		case 'def': {
			const value = await evalNodeHere(node.expr);
			if (node.attr.length > 0) {
				const attrs: Value['attr'] = [];
				for (const nAttr of node.attr) {
					attrs.push({
						name: nAttr.name,
						value: await evalNodeHere(nAttr.value),
					});
				}
				value.attr = attrs;
			}
			scope.add(node.name, {
				isMutable: node.mut,
				value: value,
			});
			return NULL;
		}

		case 'identifier': {
			return scope.get(node.name);
		}

		case 'assign': {
			const v = await evalNodeHere(node.expr);

			await proc.assign(scope, node.dest, v);

			return NULL;
		}

		case 'addAssign': {
			const target = await evalNodeHere(node.dest);
			assertNumber(target);
			const v = await evalNodeHere(node.expr);
			assertNumber(v);

			await proc.assign(scope, node.dest, NUM(target.value + v.value));
			return NULL;
		}

		case 'subAssign': {
			const target = await evalNodeHere(node.dest);
			assertNumber(target);
			const v = await evalNodeHere(node.expr);
			assertNumber(v);

			await proc.assign(scope, node.dest, NUM(target.value - v.value));
			return NULL;
		}

		case 'null': return NULL;

		case 'bool': return BOOL(node.value);

		case 'num': return NUM(node.value);

		case 'str': return STR(node.value);

		case 'arr': return ARR(await Promise.all(node.value.map(item => evalNodeHere(item))));

		case 'obj': {
			const obj = new Map() as Map<string, Value>;
			for (const k of node.value.keys()) {
				obj.set(k, await evalNodeHere(node.value.get(k)!));
			}
			return OBJ(obj);
		}

		case 'prop': {
			const target = await evalNodeHere(node.target);
			if (isObject(target)) {
				if (target.value.has(node.name)) {
					return target.value.get(node.name)!;
				} else {
					return NULL;
				}
			} else {
				return getPrimProp(target, node.name);
			}
		}

		case 'index': {
			const target = await evalNodeHere(node.target);
			const i = await evalNodeHere(node.index);
			if (isArray(target)) {
				assertNumber(i);
				const item = target.value[i.value];
				if (item === undefined) {
					throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${target.value.length - 1}`);
				}
				return item;
			} else if (isObject(target)) {
				assertString(i);
				if (target.value.has(i.value)) {
					return target.value.get(i.value)!;
				} else {
					return NULL;
				}
			} else {
				throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${target.type}.`);
			}
		}

		case 'not': {
			const v = await evalNodeHere(node.expr);
			assertBoolean(v);
			return BOOL(!v.value);
		}

		case 'fn': {
			return FN(node.args.map(arg => arg.name), node.children, scope);
		}

		case 'block': {
			return proc._run(node.statements, scope.createChildScope());
		}

		case 'exists': {
			return BOOL(scope.exists(node.identifier.name));
		}

		case 'tmpl': {
			let str = '';
			for (const x of node.tmpl) {
				if (typeof x === 'string') {
					str += x;
				} else {
					const v = await evalNodeHere(x);
					str += reprValue(v);
				}
			}
			return STR(str);
		}

		case 'return': {
			const val = await evalNodeHere(node.expr);
			proc.log('block:return', { scope: scope.name, val: val });
			return RETURN(val);
		}

		case 'break': {
			proc.log('block:break', { scope: scope.name });
			return BREAK();
		}

		case 'continue': {
			proc.log('block:continue', { scope: scope.name });
			return CONTINUE();
		}

		case 'ns': {
			return NULL; // nop
		}

		case 'meta': {
			return NULL; // nop
		}

		case 'and': {
			const leftValue = await evalNodeHere(node.left);
			assertBoolean(leftValue);

			if (!leftValue.value) {
				return leftValue;
			} else {
				const rightValue = await evalNodeHere(node.right);
				assertBoolean(rightValue);
				return rightValue;
			}
		}

		case 'or': {
			const leftValue = await evalNodeHere(node.left);
			assertBoolean(leftValue);

			if (leftValue.value) {
				return leftValue;
			} else {
				const rightValue = await evalNodeHere(node.right);
				assertBoolean(rightValue);
				return rightValue;
			}
		}

		default: {
			throw new Error('invalid node type');
		}
	}
}
