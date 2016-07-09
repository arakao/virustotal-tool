# virustotal-tool

## Install
```
git clone https://github.com/kikou5656/virustotal-tool
cd virustotal-tool
npm install
```

## Useage
1. config/default.hjsonを開き、appconf.api_keyにAPIキーを設定
2. hashlist.txtを開き、レポート取得対象のハッシュ値を記載(1行1ハッシュ値)
3. node src/index.jsを実行するとresult.csvが出力されます
