# TokenStreams
各種パース関数はITokenStreamインターフェースを実装したクラスインスタンスを引数にとる。

実装クラス
- Scanner
- TokenStream

## TokenStream
読み取り済みのトークン列を入力にとるストリーム。
テンプレート構文の式部分ではトークン列の読み取りだけを先に行い、式の内容の解析はパース時に遅延して行われる。
この時の読み取り済みのトークン列はTokenStremとしてパース関数に渡される。
