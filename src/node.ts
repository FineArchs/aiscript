/**
 * ASTノード
*/

export type Pos = {
	line: number;
	column: number;
};

export type Loc = {
	start: Pos;
	end: Pos;
};

export type Node = Namespace | Meta | Statement | Expression | TypeSource | Attribute;

type NodeBase = {
	loc: Loc; // コード位置
};

export type Namespace = NodeBase & {
	type: 'ns'; // 名前空間
	name: string; // 空間名
	members: (Definition | Namespace)[]; // メンバー
};

export type Meta = NodeBase & {
	type: 'meta'; // メタデータ定義
	name: string | null; // 名
	value: Expression; // 値
};

// statement

export type Statement =
	Definition |
	Return |
	Each |
	For |
	Loop |
	Break |
	Continue |
	Assign |
	AddAssign |
	SubAssign;

const statementTypes = [
	'def', 'return', 'each', 'for', 'loop', 'break', 'continue', 'assign', 'addAssign', 'subAssign',
];
export function isStatement(x: Node): x is Statement {
	return statementTypes.includes(x.type);
}

export type Definition = NodeBase & {
	type: 'def'; // 変数宣言文
	dest: Expression; // 宣言式
	varType?: TypeSource; // 変数の型
	expr: Expression; // 式
	mut: boolean; // ミュータブルか否か
	attr: Attribute[]; // 付加された属性
};

export type Attribute = NodeBase & {
	type: 'attr'; // 属性
	name: string; // 属性名
	value: Expression; // 値
};

export type Return = NodeBase & {
	type: 'return'; // return文
	expr: Expression; // 式
};

export type Each = NodeBase & {
	type: 'each'; // each文
	label?: string; // ラベル
	var: Expression; // イテレータ宣言
	items: Expression; // 配列
	for: Statement | Expression; // 本体処理
};

export type For = NodeBase & {
	type: 'for'; // for文
	label?: string; // ラベル
	var?: string; // イテレータ変数名
	from?: Expression; // 開始値
	to?: Expression; // 終値
	times?: Expression; // 回数
	for: Statement | Expression; // 本体処理
};

export type Loop = NodeBase & {
	type: 'loop'; // loop文
	label?: string; // ラベル
	statements: (Statement | Expression)[]; // 処理
};

export type Break = NodeBase & {
	type: 'break'; // break文
	label?: string; // ラベル
	expr?: Expression; // 式
};

export type Continue = NodeBase & {
	type: 'continue'; // continue文
	label?: string; // ラベル
};

export type AddAssign = NodeBase & {
	type: 'addAssign'; // 加算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type SubAssign = NodeBase & {
	type: 'subAssign'; // 減算代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

export type Assign = NodeBase & {
	type: 'assign'; // 代入文
	dest: Expression; // 代入先
	expr: Expression; // 式
};

// expressions

export type Expression =
	If |
	Fn |
	Match |
	Block |
	Exists |
	Tmpl |
	Str |
	Num |
	Bool |
	Null |
	Obj |
	Arr |
	Plus |
	Minus |
	Not |
	Pow |
	Mul |
	Div |
	Rem |
	Add |
	Sub |
	Lt |
	Lteq |
	Gt |
	Gteq |
	Eq |
	Neq |
	And |
	Or |
	Identifier |
	Call |
	Index |
	Prop;

const expressionTypes = [
	'if', 'fn', 'match', 'block', 'exists', 'tmpl', 'str', 'num', 'bool', 'null', 'obj', 'arr',
	'not', 'pow', 'mul', 'div', 'rem', 'add', 'sub', 'lt', 'lteq', 'gt', 'gteq', 'eq', 'neq', 'and', 'or',
	'identifier', 'call', 'index', 'prop',
];
export function isExpression(x: Node): x is Expression {
	return expressionTypes.includes(x.type);
}

export type Plus = NodeBase & {
	type: 'plus'; // 正号
	expr: Expression; // 式
};

export type Minus = NodeBase & {
	type: 'minus'; // 負号
	expr: Expression; // 式
};

export type Not = NodeBase & {
	type: 'not'; // 否定
	expr: Expression; // 式
};

export type Pow = NodeBase & {
	type: 'pow';
	left: Expression;
	right: Expression;
}

export type Mul = NodeBase & {
	type: 'mul';
	left: Expression;
	right: Expression;
}

export type Div = NodeBase & {
	type: 'div';
	left: Expression;
	right: Expression;
}

export type Rem = NodeBase & {
	type: 'rem';
	left: Expression;
	right: Expression;
}

export type Add = NodeBase & {
	type: 'add';
	left: Expression;
	right: Expression;
}

export type Sub = NodeBase & {
	type: 'sub';
	left: Expression;
	right: Expression;
}

export type Lt = NodeBase & {
	type: 'lt';
	left: Expression;
	right: Expression;
}

export type Lteq = NodeBase & {
	type: 'lteq';
	left: Expression;
	right: Expression;
}

export type Gt = NodeBase & {
	type: 'gt';
	left: Expression;
	right: Expression;
}

export type Gteq = NodeBase & {
	type: 'gteq';
	left: Expression;
	right: Expression;
}

export type Eq = NodeBase & {
	type: 'eq';
	left: Expression;
	right: Expression;
}

export type Neq = NodeBase & {
	type: 'neq';
	left: Expression;
	right: Expression;
}

export type And = NodeBase & {
	type: 'and';
	left: Expression;
	right: Expression;
}

export type Or = NodeBase & {
	type: 'or';
	left: Expression;
	right: Expression;
}

export type If = NodeBase & {
	type: 'if'; // if式
	label?: string; // ラベル
	cond: Expression; // 条件式
	then: Statement | Expression; // then節
	elseif: {
		cond: Expression; // elifの条件式
		then: Statement | Expression;// elif節
	}[];
	else?: Statement | Expression; // else節
};

export type Fn = NodeBase & {
	type: 'fn'; // 関数
	typeParams: TypeParam[]; // 型パラメータ
	params: {
		dest: Expression; // 引数名
		optional: boolean;
		default?: Expression; // 引数の初期値
		argType?: TypeSource; // 引数の型
	}[];
	retType?: TypeSource; // 戻り値の型
	children: (Statement | Expression)[]; // 本体処理
};

export type Match = NodeBase & {
	type: 'match'; // パターンマッチ
	label?: string; // ラベル
	about: Expression; // 対象
	qs: {
		q: Expression; // 条件
		a: Statement | Expression; // 結果
	}[];
	default?: Statement | Expression; // デフォルト値
};

export type Block = NodeBase & {
	type: 'block'; // ブロックまたはeval式
	label?: string; // ラベル
	statements: (Statement | Expression)[]; // 処理
};

export type Exists = NodeBase & {
	type: 'exists'; // 変数の存在判定
	identifier: Identifier; // 変数名
};

export type Tmpl = NodeBase & {
	type: 'tmpl'; // テンプレート
	tmpl: Expression[]; // 処理
};

export type Str = NodeBase & {
	type: 'str'; // 文字列リテラル
	value: string; // 文字列
};

export type Num = NodeBase & {
	type: 'num'; // 数値リテラル
	value: number; // 数値
};

export type Bool = NodeBase & {
	type: 'bool'; // 真理値リテラル
	value: boolean; // 真理値
};

export type Null = NodeBase & {
	type: 'null'; // nullリテラル
};

export type Obj = NodeBase & {
	type: 'obj'; // オブジェクト
	value: Map<string, Expression>; // プロパティ
};

export type Arr = NodeBase & {
	type: 'arr'; // 配列
	value: Expression[]; // アイテム
};

export type Identifier = NodeBase & {
	type: 'identifier'; // 変数などの識別子
	name: string; // 変数名
};

export type Call = NodeBase & {
	type: 'call'; // 関数呼び出し
	target: Expression; // 対象
	args: Expression[]; // 引数
};

export type Index = NodeBase & {
	type: 'index'; // 配列要素アクセス
	target: Expression; // 対象
	index: Expression; // インデックス
};

export type Prop = NodeBase & {
	type: 'prop'; // プロパティアクセス
	target: Expression; // 対象
	name: string; // プロパティ名
};

// Type source

export type TypeSource = NamedTypeSource | FnTypeSource | UnionTypeSource;

export type NamedTypeSource = NodeBase & {
	type: 'namedTypeSource'; // 名前付き型
	name: string; // 型名
	inner?: TypeSource; // 内側の型
};

export type FnTypeSource = NodeBase & {
	type: 'fnTypeSource'; // 関数の型
	typeParams: TypeParam[]; // 型パラメータ
	params: TypeSource[]; // 引数の型
	result: TypeSource; // 戻り値の型
};

export type UnionTypeSource = NodeBase & {
	type: 'unionTypeSource'; // ユニオン型
	inners: TypeSource[]; // 含まれる型
};

/**
 * 型パラメータ
 */
export type TypeParam = {
	name: string; // パラメータ名
}
