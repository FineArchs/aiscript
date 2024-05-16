# Host implementation
```js
import { Parser, Interpreter, utils } from '@syuilo/aiscript';

const script = '<: "Hello AiScript!"';
const parser = new Parser();
const interpreter = new Interpreter({}, {
  out: (value) => {
    console.log(utils.valToString(value));
  }
});

const nodes = parser.parse(script);
interpreter.exec(nodes);
```

## 環境要件
- Node.js 20.x以上
```bash
npm install @syuilo/aiscript
```

## API

### パーサとインタープリタ
AiScriptの中心部の実装は、大きくパーサとインタープリタの２つに分けられています。  
パーサはAiScriptコードの構文解析を行い、ノードツリー形式に変換します。  
インタープリタはパーサが生成したノードツリーを順次読み取って、プログラムの実行を行います。  

### Parser クラス
```js
export class Parser {
    constructor();
    parse(input: string): Ast.Node[];
    static parse(input: string): Ast.Node[];
    addPlugin(type: PluginType, plugin: ParserPlugin): void;
}
```
#### Parser コンストラクタ
