# GunSwap 前端

提芙尼蓝主题的 swap 界面(React + Vite + ethers v6)。

## 运行

```bash
cd frontend
npm install      # 第一次
npm run dev      # 启动本地开发服务器(默认 http://localhost:5173)
```

打开浏览器,用 MetaMask 连接即可。

## 上线前必做:填合约地址

合约部署到 BSC 后,把地址填进 `src/config.ts`:

```ts
bscMainnet: {
  factory: '0x...',   // 部署的 UniswapV2Factory 地址
  router:  '0x...',   // 部署的 UniswapV2Router02 地址
  ...
}
```

没填地址时,界面能打开、能连钱包,但兑换按钮会提示"合约地址未配置"。

- 默认网络:BSC 主网(`src/config.ts` 里的 `ACTIVE`,可改成 `bscTestnet`)。
- 代币列表也在 `src/config.ts` 的 `tokens` 里;用户也能在选币弹窗里粘贴地址临时导入。

## 功能

- 连接钱包 / 自动检测并切换到 BSC
- 兑换:实时报价、滑点设置、最少到账、ERC20 授权、BNB↔代币、交易状态提示
- 流动性:添加(按池子比例自动算另一边)/ 按百分比移除

## 构建

```bash
npm run build    # 产物在 dist/
```
