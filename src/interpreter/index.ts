/**
 * AiScript interpreter
 */

import { autobind } from '../utils/mini-autobind.js';
import { AiScriptError, NonAiScriptError, AiScriptIndexOutOfRangeError, AiScriptRuntimeError } from '../error.js';
import { Scope } from './scope.js';
import { AiScriptProcess } from './process.js';
import { std } from './lib/std.js';
import { Variable } from './variable.js';
import type { Value, VFn } from './value.js';
import type * as Ast from '../node.js';

export class Interpreter {
	public stepCount = 0;
	private stop = false;
	public scope: Scope;
	private abortHandlers: (() => void)[] = [];
	private vars: Record<string, Variable> = {};
	private processes = new Map<string, AiScriptProcess>();

	constructor(
		consts: Record<string, Value>,
		private opts: {
			in?(q: string): Promise<string>;
			out?(value: Value): void;
			err?(e: AiScriptError): void;
			log?(type: string, params: Record<string, any>): void;
			maxStep?: number;
			irq_rate: number;
			irq_at: number;
		} = {},
	) {
		this.opts.irq_rate ??= 300;
		this.opts.irq_at ??= irq_rate - 1;
		const io = {
			print: FN_NATIVE(([v]) => {
				expectAny(v);
				if (this.opts.out) this.opts.out(v);
			}),
			readline: FN_NATIVE(async args => {
				const q = args[0];
				assertString(q);
				if (this.opts.in == null) return NULL;
				const a = await this.opts.in!(q.value);
				return STR(a);
			}),
		};

		this.vars = Object.fromEntries(Object.entries({
			...std,
			...io,
			...consts,
		}).map(([k, v]) => [k, Variable.const(v)]));

		this.scope = new Scope([new Map(Object.entries(this.vars))]);
		this.scope.opts.log = (type, params): void => {
			switch (type) {
				case 'add': this.log('var:add', params); break;
				case 'read': this.log('var:read', params); break;
				case 'write': this.log('var:write', params); break;
				default: break;
			}
		};
	}

	@autobind
	public async exec(script?: Ast.Node[]): ExecProcess {
		return new ExecProcess(this, this.scope, script);
	}

	/**
	 * Executes AiScript Function.
	 * When it fails,
	 * (i)If error callback is registered via constructor, this.abort is called and the callback executed, then returns ERROR('func_failed').
	 * (ii)Otherwise, just throws a error.
	 *
	 * @remarks This is the same function as that passed to AiScript NATIVE functions as opts.topCall.
	 *
	 * @param fn - the function
	 * @param args - arguments for the function
	 * @returns Return value of the function, or ERROR('func_failed') when the (i) condition above is fulfilled.
	 */
	@autobind
	public async execFn(fn: VFn, args: Value[]): Promise<Value> {
		return await this._fn(fn, args)
			.catch(e => {
				this.handleError(e);
				return ERROR('func_failed');
			});
	}
	/**
	 * Executes AiScript Function.
	 * Almost same as execFn but when error occurs this always throws and never calls callback.
	 *
	 * @remarks This is the same function as that passed to AiScript NATIVE functions as opts.call.
	 *
	 * @param fn - the function
	 * @param args - arguments for the function
	 * @returns Return value of the function.
	 */
	@autobind
	public execFnSimple(fn: VFn, args: Value[]): Promise<Value> {
		return this._fn(fn, args);
	}

	@autobind
	public static collectMetadata(script?: Ast.Node[]): Map<any, any> | undefined {
		if (script == null || script.length === 0) return;

		function nodeToJs(node: Ast.Node): any {
			switch (node.type) {
				case 'arr': return node.value.map(item => nodeToJs(item));
				case 'bool': return node.value;
				case 'null': return null;
				case 'num': return node.value;
				case 'obj': {
					const obj: { [keys: string]: object | string | number | boolean | null | undefined } = {};
					for (const [k, v] of node.value.entries()) {
						// TODO: keyが__proto__とかじゃないかチェック
						obj[k] = nodeToJs(v);
					}
					return obj;
				}
				case 'str': return node.value;
				default: return undefined;
			}
		}

		const meta = new Map();

		for (const node of script) {
			switch (node.type) {
				case 'meta': {
					meta.set(node.name, nodeToJs(node.value));
					break;
				}

				default: {
					// nop
				}
			}
		}

		return meta;
	}

	@autobind
	private handleError(e: unknown): void {
		if (this.opts.err) {
			if (!this.stop) {
				this.abort();
				if (e instanceof AiScriptError) {
					this.opts.err(e);
				} else {
					this.opts.err(new NonAiScriptError(e));
				}
			}
		} else {
			throw e;
		}
	}

	@autobind
	private log(type: string, params: Record<string, unknown>): void {
		if (this.opts.log) this.opts.log(type, params);
	}

	@autobind
	private async collectNs(script: Ast.Node[]): Promise<void> {
		for (const node of script) {
			switch (node.type) {
				case 'ns': {
					await this.collectNsMember(node);
					break;
				}

				default: {
					// nop
				}
			}
		}
	}

	@autobind
	private async collectNsMember(ns: Ast.Namespace): Promise<void> {
		const scope = this.scope.createChildScope();

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					if (node.mut) {
						throw new Error('Namespaces cannot include mutable variable: ' + node.name);
					}

					const variable: Variable = {
						isMutable: node.mut,
						value: await this._eval(node.expr, scope),
					};
					scope.add(node.name, variable);

					this.scope.add(ns.name + ':' + node.name, variable);
					break;
				}

				case 'ns': {
					break; // TODO
				}

				default: {
					throw new Error('invalid ns member type: ' + (node as Ast.Node).type);
				}
			}
		}
	}

	@autobind
	private async _fn(fn: VFn, args: Value[]): Promise<Value> {
		if (fn.native) {
			const result = fn.native(args, {
				call: this.execFnSimple,
				topCall: this.execFn,
				registerAbortHandler: this.registerAbortHandler,
				unregisterAbortHandler: this.unregisterAbortHandler,
			});
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			return result ?? NULL;
		} else {
			const _args = new Map<string, Variable>();
			for (let i = 0; i < (fn.args ?? []).length; i++) {
				_args.set(fn.args![i]!, {
					isMutable: true,
					value: args[i]!,
				});
			}
			const fnScope = fn.scope!.createChildScope(_args);
			return unWrapRet(await this._run(fn.statements!, fnScope));
		}
	}

	@autobind
	private async _run(program: Ast.Node[], scope: Scope): Promise<Value> {
		this.log('block:enter', { scope: scope.name });

		let v: Value = NULL;

		for (let i = 0; i < program.length; i++) {
			const node = program[i]!;

			v = await this._eval(node, scope);
			if (v.type === 'return') {
				this.log('block:return', { scope: scope.name, val: v.value });
				return v;
			} else if (v.type === 'break') {
				this.log('block:break', { scope: scope.name });
				return v;
			} else if (v.type === 'continue') {
				this.log('block:continue', { scope: scope.name });
				return v;
			}
		}

		this.log('block:leave', { scope: scope.name, val: v });
		return v;
	}

	@autobind
	public registerAbortHandler(handler: () => void): void {
		this.abortHandlers.push(handler);
	}

	@autobind
	public unregisterAbortHandler(handler: () => void): void {
		this.abortHandlers = this.abortHandlers.filter(h => h !== handler);
	}

	@autobind
	public abort(): void {
		this.stop = true;
		for (const handler of this.abortHandlers) {
			handler();
		}
		this.abortHandlers = [];
	}

	@autobind
	private async assign(scope: Scope, dest: Ast.Expression, value: Value): Promise<void> {
		if (dest.type === 'identifier') {
			scope.assign(dest.name, value);
		} else if (dest.type === 'index') {
			const assignee = await this._eval(dest.target, scope);
			const i = await this._eval(dest.index, scope);
			if (isArray(assignee)) {
				assertNumber(i);
				if (assignee.value[i.value] === undefined) {
					throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${i.value} max: ${assignee.value.length - 1}`);
				}
				assignee.value[i.value] = value;
			} else if (isObject(assignee)) {
				assertString(i);
				assignee.value.set(i.value, value);
			} else {
				throw new AiScriptRuntimeError(`Cannot read prop (${reprValue(i)}) of ${assignee.type}.`);
			}
		} else if (dest.type === 'prop') {
			const assignee = await this._eval(dest.target, scope);
			assertObject(assignee);

			assignee.value.set(dest.name, value);
		} else {
			throw new AiScriptRuntimeError('The left-hand side of an assignment expression must be a variable or a property/index access.');
		}
	}
}
