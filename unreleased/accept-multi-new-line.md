- 複数の改行が1つの改行と同等に扱われるようになりました。次に示す部分で複数の改行を挿入できます。
  - 空のmatch式の波括弧内および、match式の各case節やdefault節の前後
  - 引数のない関数呼び出しの丸括弧内および、関数呼び出しの各引数の前後
  - 引数のない関数定義の丸括弧内および、関数定義の各引数の前後
  - if式において、then節やelif節、else節の間
  - 単項演算や二項演算において、バックスラッシュの後
  - 変数定義において、等号と式の間
  - 属性と文の間