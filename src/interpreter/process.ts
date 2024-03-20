/*
 * A unit of interpretation that exists mainly for error handling.
 * Designed so that when one stops due to an exception, others are not involved (unless Interpreter is so configured).
 */

import { autobind } from '../utils/mini-autobind.js';
import { Interpreter } from './index.js';
import { Scope } from './scope.js';

export abstract class AiScriptProcess extends Promise {
	protected readonly resolve;
	protected readonly reject;
	private _aborted = false;

	get aborted() { return this._aborted; }

	constructor(
		readonly interpreter: Interpreter,
		readonly scope: Scope,
	) {
		super((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}

export class ExecProcess extends AiScriptProcess {
	constructor(
		readonly interpreter: Interpreter,
		readonly scope: Scope,
		readonly script?: Ast.Node[],
	) {
		if (script == null || script.length === 0) return;
		try {
			await this.collectNs(script);
			const result = await this._run(script, this.scope);
			this.log('end', { val: result });
		} catch (e) {
			this.handleError(e);
		}
	}
}

	@autobind
	private async execFn(fn: VFn, args: Value[]): Promise<Value> {
		return await this._fn(fn, args)
			.catch(e => {
				this.handleError(e);
				return ERROR('func_failed');
			});
	}
	@autobind
	private execFnSimple(fn: VFn, args: Value[]): Promise<Value> {
		return this._fn(fn, args);
	}
}
