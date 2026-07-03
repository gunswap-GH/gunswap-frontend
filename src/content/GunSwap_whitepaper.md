
# GunSwap Whitepaper

GunSwap is a BNB Chain decentralized exchange built for fast swaps, transparent liquidity, and a simple V2-to-hybrid AMM transition.

## Disclaimer

This whitepaper is for informational purposes only. It does not constitute financial, investment, legal, tax, or trading advice. Final public release requires review by legal, compliance, technical, and security advisors.

All third-party market statistics included in this document are sourced from public data providers or public documentation and are cited in the Sources section. GunSwap publishes protocol-specific performance data through benchmarks, analytics dashboards, and on-chain activity records.

## Executive Summary

GunSwap is a decentralized exchange protocol designed to provide faster, simpler, and more efficient token trading for users, liquidity providers, and Web3 projects. The platform builds on the automated market maker model proven by leading decentralized exchanges, while improving execution speed, user experience, routing quality, liquidity incentives, and ecosystem alignment.

The decentralized exchange market has proven real demand. According to DeFiLlama’s DEX volume API snapshot accessed on 2 June 2026, decentralized exchanges recorded approximately:

| Metric | Global DEX Volume |
| --- | ---: |
| 24-hour volume | $5.06 billion |
| 7-day volume | $41.92 billion |
| 30-day volume | $179.77 billion |
| 1-year volume | $4.25 trillion |
| All-time volume | $12.98 trillion |

Large AMMs and DEX aggregators have proven that decentralized trading can reach institutional scale while remaining accessible to retail users. The opportunity for GunSwap is to combine that proven market demand with a faster interface, stronger routing, transparent incentives, and a cleaner liquidity provider experience.

These figures demonstrate that decentralized trading is no longer experimental. However, users still experience friction: slow confirmations on congested networks, fragmented liquidity, poor routing, high slippage, confusing interfaces, and unpredictable incentive models. GunSwap addresses these issues with a product-first exchange experience.

## 1. Vision

GunSwap’s vision is to become a high-performance decentralized exchange ecosystem where users can trade, provide liquidity, earn rewards, and access DeFi tools through a simple and trusted platform.

The mission is to make decentralized trading:

- Faster for everyday token swaps
- Easier for new users entering DeFi
- More efficient for liquidity providers
- More transparent for communities and token projects
- More sustainable through disciplined fee and incentive design

GunSwap does not compete by simply copying existing AMMs. It competes by delivering a better complete experience: cleaner interface, clearer data, faster swap flow, stronger routing, transparent fees, carefully managed liquidity incentives, and a security-first launch process.

## 2. Market Context

### 2.1 Decentralized Exchanges Are a Core DeFi Category

Decentralized exchanges allow users to trade crypto assets directly through smart contracts without depositing funds into a centralized exchange. Instead of relying on an order book controlled by an intermediary, AMM-based DEXs use liquidity pools supplied by users.

DeFiLlama tracks spot and perpetual trading volume on decentralized exchanges as part of its public DeFi data coverage. Its methodology documentation states that it tracks DEX and perpetual volume, fees, revenue, TVL, yields, stablecoins, bridges, and other protocol metrics.

As of the 2 June 2026 data snapshot used in this document, DeFiLlama’s DEX overview API showed global decentralized exchange volume of approximately $179.77 billion over 30 days and $4.25 trillion over one year. This validates the market size for decentralized spot trading and shows why execution quality, cost, and trust matter.

### 2.2 Competitive Landscape

The decentralized exchange market includes several major categories of competitors:

- AMM exchanges that focus on simple pool-based swaps
- Concentrated liquidity exchanges that optimize capital efficiency
- Stable asset exchanges that specialize in low-slippage stablecoin trading
- DEX aggregators that route orders across multiple liquidity sources
- Chain-native exchanges that build around one ecosystem’s users and assets
- Multi-chain exchanges that compete through broad asset coverage

Protocols such as Uniswap, Curve, PancakeSwap, Raydium, Aerodrome, Orca, Balancer, Trader Joe, and other exchange ecosystems have each shaped a different part of the market. The strongest exchanges do more than list tokens. They combine liquidity depth, trust, execution quality, ecosystem integrations, and user habit.

PancakeSwap is a useful reference point because it proved that a retail-friendly AMM can gain significant volume and community traction. Its 2024 reported trading volume of $310 billion, plus public DeFiLlama data showing approximately $2.004 trillion in cumulative spot volume around 2 June 2026, demonstrates the scale possible for a widely adopted DEX.

GunSwap enters this market as a faster, cleaner, and more efficient exchange experience with modern execution architecture, transparent incentives, and stronger liquidity provider tooling.

### 2.3 Speed and Cost Matter

DEX users care about execution time, transaction cost, slippage, and failed transaction rate. GunSwap deploys on fast EVM-compatible infrastructure so the underlying network supports a more responsive user experience.

BNB Chain documentation states that BNB Smart Chain has a 0.45-second mainnet block time and approximately 1.125-second finality with Fast Finality under normal voting conditions. This does not automatically mean every app transaction is complete in 1.125 seconds, because wallet confirmation, RPC performance, network congestion, routing computation, gas pricing, and user behavior also matter. However, it does provide a strong technical foundation for fast DeFi applications.

GunSwap uses this fast settlement environment as part of its performance foundation and publishes live product benchmarks to show real-world swap performance.

## 3. Problem Statement

The current decentralized exchange market has strong demand but still suffers from several user and protocol-level problems.

### 3.1 User Problems

Many users face:

- Slow or inconsistent swap confirmation experience
- High slippage on lower-liquidity pairs
- Confusing wallet approval and transaction flows
- Unclear fee and price impact information
- Difficulty comparing available pools
- Poor mobile experience
- Fear of scams, fake tokens, or malicious contracts
- Limited understanding of impermanent loss before providing liquidity

### 3.2 Liquidity Provider Problems

Liquidity providers face:

- Impermanent loss
- Volatile liquidity incentives
- Poor visibility into real LP returns
- Reward programs that attract short-term mercenary liquidity
- Difficulty understanding active versus inactive liquidity
- Limited analytics for pool health, fees earned, utilization, and risk

### 3.3 Project Problems

New token projects need:

- Reliable liquidity bootstrapping
- Fair launch infrastructure
- Transparent pool creation
- Community trading access
- Anti-scam verification signals
- Launch analytics
- Sustainable incentive tools

### 3.4 Protocol-Level Problems

DEX protocols must solve:

- Liquidity fragmentation across chains and pool versions
- Smart contract risk
- Router inefficiency
- Unsustainable reward programs
- Admin control risk
- Treasury mismanagement
- MEV, sandwich attacks, and poor execution protection

GunSwap is designed to address these problems through product design, smart routing, incentive discipline, clear analytics, and security-first development.

## 4. GunSwap Solution Overview

GunSwap will be a decentralized exchange ecosystem built around the following core modules:

- Swap interface
- Smart routing engine
- AMM liquidity pools
- Liquidity provider dashboard
- BNB-based liquidity incentives
- No native-token model
- Project launch tools
- Analytics and transparency dashboard
- Security and risk controls

The initial product focuses on doing the core DEX experience extremely well: swaps, liquidity, fees, rewards, and safety. Expansion features such as launchpad, cross-chain support, and advanced trading tools are introduced after the core protocol is stable and audited.

## 5. Product Architecture

### 5.1 Swap

The swap module allows users to exchange supported tokens directly from their wallet. GunSwap prioritizes:

- Clear token selection
- Verified token warnings
- Estimated output
- Minimum received
- Price impact
- Route path
- Liquidity source
- Network fee estimate
- Slippage settings
- Transaction deadline
- Approval status
- Final confirmation summary

The goal is to reduce confusion and failed swaps while making the trade details transparent before the user signs.

### 5.2 Smart Router

The router is one of the most important parts of a DEX. GunSwap’s smart router compares available liquidity sources and chooses the best execution path based on output amount, pool depth, fee tier, gas cost, and route complexity.

Routing features:

- Single-pool routing
- Multi-hop routing
- Split-route execution
- Fee-aware routing
- Gas-aware routing
- Slippage-aware routing
- Stable-pair routing
- Fallback routing when a pool is unavailable

Routing performance will be benchmarked against comparable DEXs and aggregators before any public claim such as “better pricing” or “better execution” is used.

### 5.3 Liquidity Pools

GunSwap begins with a V2-style constant-product AMM model and transitions gradually toward a hybrid liquidity model as the protocol matures.

Pool types:

- V2-style constant-product pools at launch
- Stable asset pools during the hybrid expansion phase
- Concentrated liquidity pools during the hybrid expansion phase
- Project launch pools for selected ecosystem assets

For a simple AMM, the common constant-product formula is:

```text
x * y = k
```

Where:

- `x` is the reserve of token A
- `y` is the reserve of token B
- `k` is the constant product

When a trader buys one token from the pool, the pool balance changes and the price adjusts automatically. This design allows continuous liquidity without needing a traditional order book.

The spot price of token A in terms of token B is derived from the reserve ratio:

```text
PriceA = y / x
```

For a swap, the input amount is adjusted by the pool fee before calculating output:

```text
Δx_effective = Δx * (1 - fee)

Δy = (y * Δx_effective) / (x + Δx_effective)
```

Where:

- `Δx` is the amount of token A supplied by the trader
- `Δx_effective` is the fee-adjusted input amount
- `Δy` is the amount of token B received by the trader
- `fee` is the pool swap fee

Price impact measures how much a trade moves the execution price away from the current pool price:

```text
Price Impact = (Execution Price - Spot Price) / Spot Price
```

This is why deep liquidity matters. Larger reserves reduce price movement for the same trade size, creating better execution for users.

### 5.4 Liquidity Provider Dashboard

Liquidity providers need more than a deposit button. GunSwap provides a clear dashboard showing:

- Pool share
- Deposited value
- Fees earned
- Rewards earned
- Historical APY
- Trading volume
- Current liquidity depth
- Impermanent loss estimate
- Active liquidity status
- Reward end date
- Pool risk level

LP fee earnings are calculated from pool volume, swap fees, and the provider’s share of active pool liquidity:

```text
LP Share = User Liquidity / Total Pool Liquidity

LP Fee Earned = Pool Volume * Swap Fee * LP Share
```

This separates real trading-fee yield from incentive yield, helping liquidity providers understand whether a pool is sustainable without relying only on rewards.

This feature helps turn liquidity provision from a guessing game into an informed decision.

### 5.5 Liquidity Incentives

GunSwap uses BNB-based and partner-supported liquidity incentives instead of issuing a native reward token. This keeps the protocol focused on real trading activity, fee generation, and sustainable liquidity depth rather than inflation-driven growth.

GunSwap’s incentive model is built around:

- Transparent reward schedules
- BNB and partner-asset reward pools
- Pool-by-pool incentive allocation
- Operator and multisig oversight
- Anti-mercenary liquidity design
- Rewards tied to useful liquidity, not only deposited TVL

### 5.6 Launchpad

After the core DEX is stable, GunSwap introduces a launchpad for selected projects. The launchpad helps new projects raise awareness, launch tokens, seed liquidity, and reach the GunSwap community.

Launchpad features include:

- Project review process
- Token sale pages
- Liquidity lock disclosures
- Team and contract verification
- Risk warnings
- Community allocation rounds
- Post-launch liquidity pool creation

The launchpad prioritizes quality over volume. A weak launchpad can damage trust quickly when low-quality projects are allowed through.

## 6. Differentiation Strategy

GunSwap’s market position is “faster, cleaner, and more user-aligned decentralized trading.”

### 6.1 Faster Swap Experience

GunSwap reduces the total time from user intent to completed swap through:

- Fast interface loading
- Fast route calculation
- Low-latency RPC access
- Clear wallet confirmation
- Efficient smart contracts
- Fast finality on the selected chain

GunSwap’s performance positioning is supported through route calculation benchmarks, swap completion timing, gas-cost analysis, output comparison, slippage measurement, and failed-transaction monitoring.

### 6.2 Better Execution

Better execution means users receive more output tokens after accounting for fees, price impact, gas, and slippage. GunSwap improves execution through:

- Optimized routing
- Deep priority pools
- Stable-pair pools
- Partner liquidity programs
- Reduced failed transactions
- Transparent minimum-received calculations

### 6.3 Better User Experience

GunSwap is easier to use than typical DEX interfaces. A strong DEX interface makes users feel confident before signing a transaction.

UX priorities:

- Plain-language transaction summaries
- Scam token warnings
- Verified token lists
- Pool risk labels
- Mobile-first design
- Clear charts and analytics
- Easy add/remove liquidity flow
- Clear display of fees and expected output

### 6.4 Better Liquidity Provider Tools

Many DEXs focus heavily on traders and under-serve LPs. GunSwap can differentiate by giving LPs better data and decision tools.

LP features include:

- Real yield versus reward yield separation
- Pool APR history
- Fee APR history
- Reward APR history
- Impermanent loss estimate
- Token volatility indicator
- Pool age
- Contract verification
- Liquidity lock status for project pools

### 6.5 Better Incentive Discipline

GunSwap avoids inflation-driven growth. The project does not rely on a native token to simulate traction. Instead, incentives are tied to useful outcomes such as:

- Sustainable liquidity depth
- Trading volume
- Verified project launches
- Long-term liquidity retention
- Ecosystem partnerships

## 7. Technical Design

### 7.1 Launch Architecture

The initial GunSwap protocol includes:

| Component | Purpose |
| --- | --- |
| Factory Contract | Creates and tracks liquidity pools |
| Pair or Pool Contract | Holds token reserves and executes swaps |
| Router Contract | Finds and executes swap paths |
| Fee Manager | Manages fee allocation rules |
| Incentive Distributor | Distributes BNB and partner-asset liquidity incentives |
| Treasury Contract | Holds protocol-owned funds |
| Multisig Wallet | Controls admin actions and treasury safeguards |
| Analytics Indexer | Reads on-chain events and powers dashboards |

The contract system is modular enough to upgrade non-critical components while keeping user funds protected.

### 7.2 Network Strategy

GunSwap launches on BNB Chain because it offers fast settlement, EVM compatibility, low transaction costs, and an established DeFi user base.

Expansion paths:

- Multi-chain deployment after the protocol has stable liquidity and audited contracts
- Layer-2 expansion based on user demand, liquidity partnerships, and ecosystem incentives

BNB Smart Chain is the first deployment environment. BNB Chain documentation states that BNB Smart Chain has a 0.45-second mainnet block time and approximately 1.125-second finality with Fast Finality under normal voting conditions. GunSwap uses this infrastructure as the base layer for fast swaps, low-cost transactions, and a responsive DeFi experience.

### 7.3 Data and Analytics

GunSwap operates with a transparent analytics layer from launch.

Key public metrics:

- Total value locked
- 24-hour volume
- 7-day volume
- 30-day volume
- Number of swaps
- Number of active wallets
- Fees generated
- Fees paid to LPs
- Incentive rewards distributed
- Active liquidity by pool
- Reward APR by pool

The project will seek listing on public analytics platforms such as DeFiLlama once the protocol is live and has verifiable on-chain data.

### 7.4 Security Architecture

GunSwap follows a security-first launch process.

Minimum recommended controls:

- Internal review
- Unit tests
- Integration tests
- Fork tests against live network conditions
- Public testnet
- Third-party audit
- Bug bounty
- Multisig admin controls
- Timelocks for sensitive changes
- Emergency pause function with limited scope
- Documented incident response plan

Security is treated as a core product feature. A fast DEX is not useful when users cannot trust the contracts.

## 8. Fee Model

GunSwap uses a simple 0.30% swap fee for V2-style AMM pools. The model is intentionally easy for traders and liquidity providers to understand: swaps pay a single transparent fee, and liquidity providers earn from real trading activity in the pools they support. Public DEX fee structures vary by protocol and pool type. For context, PancakeSwap documentation states that its V2 pools charge a fixed 0.25% swap fee, while its V3 pools support fee tiers ranging from 0.01% to 1% depending on the pool.

### 8.1 Initial Fee Model

For simple AMM pools:

```text
Swap Fee = 0.30%
```

No additional native-token fee components are introduced at launch. The fee model stays focused on straightforward AMM trading and liquidity provider earnings.

### 8.2 Fee Design Principles

GunSwap’s fee model is designed to:

- Be easy for users to understand
- Reward liquidity providers fairly
- Avoid hidden fees
- Avoid excessive extraction from traders
- Remain compatible with the later hybrid AMM transition

## 9. BNB-Based Model

GunSwap does not introduce a native protocol token at launch. The platform uses BNB as the core ecosystem asset for network gas, user activity, liquidity incentives, and BNB Chain alignment.

This no-native-token model keeps the launch structure simpler and avoids token supply, allocation, vesting, staking, and governance complexity. It also keeps the protocol focused on product performance, liquidity depth, swap volume, and user trust.

### 9.1 BNB Utility

BNB is used across the GunSwap ecosystem for:

- Network gas fees on BNB Smart Chain
- BNB trading pairs
- Liquidity incentive programs
- Partner campaigns
- Launchpad participation mechanics
- Ecosystem reward programs

### 9.2 Operational Controls

GunSwap uses operational controls at launch. Protocol administration is managed through multisig controls, security procedures, transparent communications, and documented upgrade processes.

Operational controls cover:

- Fee configuration
- Pool deployment standards
- Verified token-list updates
- Liquidity incentive allocation
- Launchpad review procedures
- Treasury safeguards
- Emergency response procedures

## 10. Roadmap

### Phase 1: Research and Foundation

- Finalize product scope
- Design brand identity
- Build contract architecture
- Build UI prototype
- Define performance benchmark methodology

### Phase 2: Testnet

- Deploy swap contracts to testnet
- Launch testnet UI
- Test token swaps
- Test add/remove liquidity
- Test routing logic
- Test BNB-based liquidity incentive flows
- Collect community feedback
- Run internal security review

### Phase 3: Audit and Launch Preparation

- Complete third-party smart contract audit
- Publish audit report
- Prepare liquidity plan
- Prepare launch communications
- Prepare documentation
- Set up analytics dashboards

### Phase 4: Mainnet Launch

- Deploy mainnet contracts
- Launch initial pools
- Enable swaps
- Launch verified token list
- Enable liquidity provision
- Begin selected BNB-based liquidity incentive programs
- Monitor performance and security

### Phase 5: Ecosystem Expansion

- Add launchpad features
- Expand analytics
- Add additional pool types
- Pursue public analytics listings
- Begin strategic partnerships

### Phase 6: Multi-Chain and Advanced Products

- Evaluate expansion to additional chains
- Add cross-chain liquidity strategy
- Explore concentrated liquidity
- Add advanced LP management tools
- Add API and developer tools
- Expand operational transparency and community reporting

## 11. Performance Benchmarking

GunSwap uses a formal benchmark framework to measure performance against leading AMMs, chain-native DEXs, and DEX aggregators. The benchmark process supports transparent claims around speed, execution quality, gas efficiency, and reliability.

### 11.1 Metrics to Measure

| Metric | Description | Reporting Status |
| --- | --- | --- |
| Route Calculation Time | Time for UI/router to calculate the best route | Core benchmark |
| Wallet-to-Confirmation Time | Time from user signing to confirmed transaction | Core benchmark |
| Finalized Swap Time | Time from signing to finalized on-chain state | Core benchmark |
| Average Gas Cost | Average network fee for a swap | Core benchmark |
| Output Amount Comparison | Token output versus leading AMMs and aggregators | Core benchmark |
| Slippage Rate | Difference between quoted and executed output | Core benchmark |
| Failed Transaction Rate | Percentage of failed swaps | Core benchmark |
| Interface Load Time | Time to load usable swap page | Product benchmark |
| Mobile Completion Rate | Percentage of mobile users completing swaps | Product benchmark |

### 11.2 Benchmark Rules

For credibility, benchmarks:

- Use the same chain
- Use the same token pairs
- Use the same trade sizes
- Use the same time window
- Include gas cost
- Include failed transactions
- Use public transaction hashes where possible
- Be repeated across normal and high-traffic periods
- Be published with methodology

Benchmark data is published with methodology so users can evaluate GunSwap’s performance against the wider DEX market using consistent assumptions.

## 12. Risk Factors

GunSwap users must understand that DeFi involves significant risk.

### 12.1 Smart Contract Risk

Smart contracts can contain bugs, vulnerabilities, or unexpected behavior. Even audited contracts can fail.

### 12.2 Market Risk

Token prices can be volatile. Users can lose value due to market movements.

### 12.3 Impermanent Loss

Liquidity providers can earn fees but still underperform simply holding the two tokens when pool prices move significantly.

For a standard 50/50 constant-product pool, impermanent loss can be estimated as:

```text
Impermanent Loss = (2 * sqrt(r) / (1 + r)) - 1
```

Where `r` is the price ratio change between the two pooled assets. For example, when one asset doubles relative to the other, `r = 2`. The formula helps users understand that LP returns depend on both trading fees and relative asset price movement.

### 12.4 Liquidity Risk

Some pools can have shallow liquidity, causing high price impact or difficulty exiting positions.

### 12.5 Listed Asset Risk

Listed tokens and BNB trading pairs can experience price volatility, liquidity loss, or reduced demand.

### 12.6 Regulatory Risk

DeFi regulations continue to evolve. Legal requirements can affect platform access, rewards, launchpad activity, or public communications.

### 12.7 Operational Control Risk

Operational controls can create centralization risk when admin permissions, multisig processes, or upgrade procedures are not transparent. GunSwap reduces this risk through documented controls, security review, and clear communications.

### 12.8 Oracle and Data Risk

Oracle-integrated features depend on accurate data. Incorrect oracle data can affect pricing, rewards, or liquidations.

### 12.9 Cross-Chain Risk

GunSwap’s cross-chain expansion introduces bridge and cross-chain messaging risks.

## 13. Compliance and Responsible Launch

GunSwap avoids language that promises profit, guaranteed yield, or risk-free returns. Public communications are specific, measurable, and evidence-based.

Compliance steps:

- Clear risk disclosures
- No guaranteed APY language
- No guaranteed price appreciation language
- Clear jurisdiction restrictions where required
- Privacy policy and terms of use
- Sanctions and restricted region review
- Marketing claim review

## 14. Key Performance Indicators

After launch, GunSwap measures success using real protocol activity rather than hype.

Primary KPIs:

- Total value locked
- Daily active wallets
- Monthly active wallets
- Daily swap volume
- Monthly swap volume
- Number of swaps
- Average swap size
- Average slippage
- Failed transaction rate
- Fees generated
- Fees paid to LPs
- Number of verified pools
- Liquidity retention after incentives decrease

## 15. Conclusion

GunSwap is a next-generation decentralized exchange built on the proven AMM model and designed to compete through speed, usability, execution quality, transparency, and sustainable incentives.

The DEX market is large and active, with public DeFiLlama data showing trillions of dollars in annual decentralized exchange volume. Leading AMMs, stable-swap protocols, aggregators, and chain-native exchanges have shown that decentralized trading can support deep liquidity, high-frequency activity, and global retail participation.

GunSwap builds from these lessons while improving the experience for traders, liquidity providers, token projects, and the broader community. The protocol combines strong execution, audited smart contracts, transparent fees, disciplined incentives, and real performance benchmarks.

GunSwap is a faster, clearer, safer, and more data-driven swap ecosystem built for the next phase of DeFi adoption.

## Appendix A: Final Publication Checklist

The GunSwap team will confirm the following before final publication:

- Final contract architecture
- Swap fee model
- V2-to-hybrid AMM transition plan
- BNB-based liquidity incentive structure
- Operational control process

## Sources

1. [DeFiLlama DEX overview API](https://api.llama.fi/overview/dexs?dataType=dailyVolume&excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true), accessed 2 June 2026
2. [DeFiLlama methodology documentation](https://docs.llama.fi/)
3. [DeFiLlama FAQ and update frequency documentation](https://docs.llama.fi/faqs/frequently-asked-questions)
4. [BNB Chain documentation: BNB Smart Chain introduction](https://docs.bnbchain.org/bnb-smart-chain/introduction/)
5. [PancakeSwap documentation: liquidity pools and trading fees](https://docs.pancakeswap.finance/earn/pancakeswap-pools)
6. [Cointelegraph: “PancakeSwap closes record $310B year, up 179% driven by L2, DeFi growth”](https://cointelegraph.com/news/pancakeswap-2024-crypto-trading-volume-growth), 24 December 2024
7. [Binance Research: “Uncovering DeFi Fundamentals: Decentralized Exchanges”](https://research.binance.com/static/pdf/decentralized-exchanges-report.pdf)
8. [Binance Research: “Research x Labs: DeFi on BNB Chain”](https://research.binance.com/static/pdf/DeFi-on-BNB-Chain-Report.pdf)
9. [Uniswap v3 Core whitepaper](https://blog.uniswap.org/whitepaper-v3.pdf)
10. [Mauricio Labadie: “Impermanent loss and slippage in Automated Market Makers (AMMs) with constant-product formula”](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4053924)
