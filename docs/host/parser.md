# AiScript 構文解析
AiScriptコードの構文解析を行い、[AST](#AST)と呼ばれるオブジェクトに変換します。  
基本的にはstaticメソッドである`Parser.parse(input)`を利用していれば問題ありません。  
後述のプラグイン機能を使用する場合はParserクラスのインスタンスを作成する必要があります。  

### Parser.parse(input)
<table>
	<tr><th>引数名</th><th>型(Typescript)</th></tr>
	<tr><td>input</td><td>string</td></tr>
	<tr><td>返り値</td><td>Ast.Node[]</td></tr>
</table>

```js
import { Parser } from '@syuilo/aiscript';
Parser.parse("<: 'Hello AiScript!'");
```

## AST
構文木と呼ばれるオブジェクトです。  

### type AST


## プラグイン機能
> [!NOTE]
> 未整備の機能であり、ホスト側が利用するには機能が足りていないと考えられています。

構文解析後にAstのバリデーションや変形を行う機能です。  
プラグイン機能を使用する場合は`new Parser()`でParserクラスのインスタンスの作成を行う必要があります。  
### Parser() constructor
コンストラクタ引数はありません。  
```js
import { Parser } from '@syuilo/aiscript';
const parser = new Parser();
```

### Parser.prototype.parse(input)
<table>
	<tr><th>引数名</th><th>型(Typescript)</th></tr>
	<tr><td>input</td><td>string</td></tr>
	<tr><td>返り値</td><td>Ast.Node[]</td></tr>
</table>

```js
import { Parser } from '@syuilo/aiscript';
const parser = new Parser();
parser.parse("<: 'Hello AiScript!'");
```

### Parser.prototype.addPlugin(type, plugin)

