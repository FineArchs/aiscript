# ホスト向けAiScript実装ガイド
[Read translated version (en)](/translations/en/docs/host/get-started.md)

このページでは、自作のnode.jsパッケージ内でAiScriptを動作させたい人向けのガイドを行います。

## 環境要件
<table>
	<tr><th>名称</th><th>バージョン（動作確認済みのもの）</th></tr>
	<tr><td>Node.js</td><td>20.x</td></tr>
</table>

## 手順
### インストール
```sh
# NPMの例
npm install --save @syuilo/aiscript
```
### 使用
- AiScriptのコードの実行を行うには、少なくとも`Parser`と`Interpreter`をimportする必要があります。
- 詳細は[host/api.md](./api.md)を参照してください。
```js
// esmの場合の例
import { Parser, Interpreter } from '@syuilo/aiscript';

const script = '<: "Hello, AiScript!"';
const ast = Parser.parse(script);
const interpreter = new Interpreter({}, { out: console.log });
await interpreter.exec(ast);
```
