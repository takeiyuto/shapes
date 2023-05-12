# Shapes NFT

IPFS にコンテンツを保存するジェネレイティブ NFT のサンプルです。ユーザーが発行を要求したときの時刻がトークンに刻まれるようになっています。

## ディレクトリ構成

このレポジトリは、以下に示す 3 つのディレクトリを含んでいます。それぞれのディレクトリが、個別のレポジトリへのサブ モジュールになっています。

* **[backend](https://github.com/takeiyuto/shapes-backend)** ディレクトリ<br>
バックエンドを記述した TypeScript のプロジェクトです。ビルドして起動すると、ブロックチェーン ノードに WebSocket で接続してユーザーからの NFT 発行要求を処理するとともに、IPFS ノードとして機能して NFT コンテンツをホストします。NFT のメタデータを D3.js を用いて SVG で描画するコードを含みます。

* **[blockchain](https://github.com/takeiyuto/shapes-contract)** ディレクトリ<br>
スマート コントラクトを記述した Truffle プロジェクトです。スマート コントラクトは、コンパイルした後、ブロックチェーンにデプロイします。

* **[frontend](https://github.com/takeiyuto/shapes-frontend)** ディレクトリ<br>
TypeScript と Vue 3 でフロントエンドを記述した webpack 5 のプロジェクトです。ビルドすると、購入と販売管理の双方ができる 1 つの Web ページが `dist` ディレクトリに生成されます。

次のコマンドで、全サブ モジュールも含めて、再帰的にクローンします。

```bash
git clone --recursive https://github.com/takeiyuto/shapes.git
```

## 動作方法

以下の順序で、それぞれのプロジェクトの README の手順に従います。

1. `blockchain` ([README](https://github.com/takeiyuto/shapes-contract/blob/main/README.md))
2. `backend` ([README](https://github.com/takeiyuto/shapes-backend/blob/main/README.md))
3. `frontend` ([README](https://github.com/takeiyuto/shapes-frontend/blob/main/README.md))

## ライセンス表示

このサンプル プロジェクトは、[MIT License](LICENSE)で提供しています。

# 参照

[徹底解説 NFTの理論と実践](https://www.ohmsha.co.jp/book/9784274230608/)の第9章を参照してください。[本書の Web サイト](https://takeiyuto.github.io/nft-book)も参考にしてください。
