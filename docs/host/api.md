# APIガイド
[Read translated version (en)](/translations/en/docs/host/api.md)

このページではAiScript実装用のJavascript/Typescript APIの概要を説明します。

> [!IMPORTANT]
> ESM形式のみ発行しています。CJS形式の取り扱いはありません。

## 基本的な要素
`import { <name> } from '@syuilo/aiscript'`でimportすることができます。

### Parser
コードの構文解析を行い、ASTと呼ばれるオブジェクトに変換します。  
このASTをInterpreterに渡すことでAiScriptの実行を行うことができます。  
詳しくは→[host/parser.md](./parser.md)  

### Ast
Parserによって生成される構文木です。  
詳しくは→[host/parser.md#AST](./parser.md#AST)  

### ParserPlugin, PluginType
> [!NOTE]
> 未整備の要素であり、ホスト側が利用するには機能が足りていないと考えられています。

※Typescript用  
パース後にAstのバリデーションや変形を行う「プラグイン機能」のための型です。  
詳しくは→[host/parser.md#プラグイン](./parser.md#プラグイン) 

### Interpreter
ASTを順次読み取り、実行します。  
詳しくは→[host/interpreter.md](./interpreter.md)  

### Scope
> [!NOTE]
> 未整備の要素であり、ホスト側が利用するには機能が足りていないと考えられています。

AiScript内の変数を保持・管理するネスト可能なオブジェクトです。  
詳しくは→[host/interpreter.md#スコープ](./interpreter.md#スコープ)  

### values
AiScript内のnullや数値といった値をJavascript側から生成するための関数と、それらをTypescriptで表現するための型が含まれています。  
AiScript用ライブラリを作成するのに必要になります。  
詳しくは→[host/interpreter.md#values](./interpreter.md#values)  

### utils
様々なユーティリティ関数が含まれます。  
例えば、AiScript内の値を文字列に変換する関数や、アサーション用の関数などです。  
詳しくは→[host/interpreter.md#utils](./interpreter.md#utils)  

### errors
ParserおよびInterpreterの実行中に発生するエラーのクラスが含まれます。  
詳しくは→[host/errors.md#](./errors.md)  

### AISCRIPT_VERSION
```js
import { AISCRIPT_VERSION } from '@syuilo/aiscript';
console.log(AISCRIPT_VERSION);
```
AiScriptのバージョンを表す文字列です。  

### その他の要素
> [!WARNING]
> 厳密なサポートがされない機能です。予告なしの変更が発生する可能性があります。

ここに無い要素が必要になった場合、`import { <name> } from '@syuilo/aiscript/path/to/source.js`で対応するソースファイルへのパスを指定してimportすることができます。  
