*English translation has been left out of date for a long time. 
[Please contribute!](../translations/en/docs/std.md)*

## 標準定数・標準関数について
Aiscriptで最初から定義されていてどこでも使える定数・関数を指します。  
standardを省略してstd定数/関数とも呼ばれています。

# 一覧

## IO
入出力関数です。これらには名前空間が与えられていません。

### print(_message_)
_message_: str  
返り値: void  
画面に文字列を表示します。  

### readline(_message_)
_message_: str  
返り値: str  
文字列の入力を受け付けます。入力が中断されると空文字列`""`が返されます。  

## :: Core
AiScriptの中心的な機能を担う定数・関数は`Core:`の名前空間を与えられています。

### Core:v
型: str  
AiScriptのバージョンです。  

### Core:type(_v_)
_v_: any  
返り値: str  
値の型名を取得します。  

### Core:to_str(_v_)
_v_: any  
返り値: str  
値を表す文字列を取得します。  

### Core:sleep(_time_)
_time_: any  
返り値: void  
指定時間（ミリ秒）待機します。  

## :: Util

### Util:uuid()
返り値: str  
新しいUUIDを生成します。  

## :: Json
JSONを扱う関数には`Json:`の名前空間が割り当てられています。  

### Json:stringify(_v_)
_v_: any  
返り値: str  
JSONを生成します。  

### Json:parse(_json_)
_json_: str  
返り値: any  
JSONをパースします。 引数がJSONとしてパース可能でない場合、エラー型の値（`name`=`'not_json'`）を返します。 

### Json:parsable(_str_)
_str_: str  
返り値: bool  
文字列がJSONとしてパース可能であるかの判定を行います。  
パフォーマンス上の理由から非推奨であり、後々廃止される可能性があります。  

## :: Date
時刻の取得・変換に関する関数群です。  

### Date:now()
返り値: num  
現在時刻を特殊な数値の形で取得します。  
この数値は主に下記の変換関数に渡して使用されます。  
技術的には、この数値はJavaScriptの[Date.now()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/now)で得られるものと同一です。  

### 変換関数(_date_?)
`Date:year`、`Date:month`、`Date:day`、`Date:hour`、`Date:minute`、`Date:second`の６つがあります。引数・返り値の型はすべて  
_date_?: num  
返り値: num  
です。  
_date_ が与えられた場合、その数値が表す時刻のそれぞれ年・月・日・時・分・秒を返します。与えられなかった場合は現在のそれを返します。  

### Date:parse(_date_)
_date_: str  
返り値: num  

## :: Math
数が多いため専用のページになっています。→[std-math.md](std-math.md)

## :: Num
### @Num:to_hex(_x_: num): str
数値から16進数の文字列を生成します。  

### @Num:from_hex(_hex_: str): num
16進数の文字列から数値を生成します。  

## :: Str
### #Str:lf
型: `str`  
改行コード(LF)です。  

### #Str:lt(a: str, b: str): num
a < b ならば -1、a == b ならば 0、a > b ならば 1 を返します。  
arr.sortの比較関数として使用できます。

### #Str:gt(a: str, b: str): num
a > b ならば -1、a == b ならば 0、a < b ならば 1 を返します。  
arr.sortの比較関数として使用できます。

### #Str:from_codepoint(codepoint: num): str
unicodeのコードポイントから文字を生成します。

_codepoint_ は 0 以上、10FFFF<sub>16</sub> 以下である必要があります。

## :: Obj
### @Obj:keys(_v_: obj): arr
### @Obj:vals(_v_: obj): arr
### @Obj:kvs(_v_: obj): arr
オブジェクトのキー、値、キーと値の組を配列にして返します。

### @Obj:get(_v_: obj, _key_: str): value

### @Obj:set(_v_: obj, _key_: str, _val_: value): null

### @Obj:has(_v_: obj, _key_: str): bool

### @Obj:copy(_v_: obj): obj
オブジェクトのコピーを生成します。  

## :: Async
### @Async:interval(_interval_: num, _callback_: fn, _immediate_?: bool): fn
指定した周期でコールバック関数を呼び出します。  
戻り値として停止関数を返します。  

### @Async:timeout(_delay_: num, _callback_: fn):
指定した時間経過後にコールバック関数を呼び出します。  
戻り値として停止関数を返します。  
