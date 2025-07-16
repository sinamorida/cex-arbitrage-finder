# 🚀 CEX Arbitrage Finder

یک ابزار پیشرفته و کامل برای شناسایی فرصت‌های آربیتراژ در صرافی‌های متمرکز (CEX) با استفاده از React و TypeScript.

![CEX Arbitrage Finder](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple)

## 📋 فهرست مطالب

- [ویژگی‌ها](#ویژگیها)
- [استراتژی‌های آربیتراژ](#استراتژیهای-آربیتراژ)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [نحوه استفاده](#نحوه-استفاده)
- [ساختار پروژه](#ساختار-پروژه)
- [تنظیمات](#تنظیمات)
- [API و سرویس‌ها](#api-و-سرویسها)
- [کامپوننت‌ها](#کامپوننتها)
- [الگوریتم‌های آربیتراژ](#الگوریتمهای-آربیتراژ)
- [بهینه‌سازی عملکرد](#بهینهسازی-عملکرد)
- [مشارکت](#مشارکت)
- [مجوز](#مجوز)

## ✨ ویژگی‌ها

### 🎯 ویژگی‌های اصلی
- **شناسایی خودکار فرصت‌های آربیتراژ** در 5 صرافی معتبر
- **5 استراتژی مختلف آربیتراژ** با الگوریتم‌های پیشرفته
- **رابط کاربری مدرن و واکنش‌گرا** با Tailwind CSS
- **به‌روزرسانی زنده** هر 15 ثانیه
- **فیلتر و دسته‌بندی** فرصت‌ها بر اساس نوع استراتژی
- **آمار و تحلیل کامل** عملکرد استراتژی‌ها
- **طراحی موبایل‌محور** برای دسترسی در همه جا

### 🔧 ویژگی‌های فنی
- **بدون وابستگی به API خارجی** - کار با داده‌های شبیه‌سازی شده
- **TypeScript کامل** برای ایمنی نوع داده‌ها
- **معماری مدولار** و قابل توسعه
- **مدیریت حالت پیشرفته** با React Hooks
- **بهینه‌سازی عملکرد** با lazy loading و memoization

## 🎲 استراتژی‌های آربیتراژ

### 1. 🔄 Spatial Arbitrage (آربیتراژ فضایی)
**تعریف**: خرید و فروش همزمان یک دارایی در دو صرافی مختلف با قیمت‌های متفاوت.

**نحوه کار**:
- مقایسه قیمت‌های bid/ask یک جفت ارز در صرافی‌های مختلف
- شناسایی فرصت‌هایی که قیمت فروش در صرافی A بیشتر از قیمت خرید در صرافی B باشد
- محاسبه سود خالص پس از کسر کارمزدها

**مثال**:
```
BTC/USDT در Binance: $43,250 (خرید)
BTC/USDT در Kraken: $43,400 (فروش)
سود: 0.35% = $150 در هر BTC
```

### 2. 🔺 Triangular Arbitrage (آربیتراژ مثلثی)
**تعریف**: استفاده از اختلاف نرخ ارز بین سه جفت ارز در یک صرافی.

**نحوه کار**:
- چرخه سه مرحله‌ای: A → B → C → A
- شناسایی عدم تعادل در نرخ‌های متقابل ارزها
- اجرای معاملات متوالی برای کسب سود

**مثال**:
```
مسیر: USDT → BTC → ETH → USDT
1. خرید BTC با USDT
2. خرید ETH با BTC
3. فروش ETH برای USDT
سود نهایی: 0.25%
```

### 3. 🌐 Cross-Exchange Triangular (آربیتراژ مثلثی چندصرافی)
**تعریف**: ترکیب آربیتراژ مثلثی با استفاده از چندین صرافی برای بهینه‌سازی سود.

**نحوه کار**:
- هر مرحله از چرخه مثلثی در بهترین صرافی انجام می‌شود
- پیدا کردن بهترین قیمت خرید/فروش در صرافی‌های مختلف
- ترکیب مزایای آربیتراژ فضایی و مثلثی

**مثال**:
```
مرحله 1: خرید BTC در Binance (بهترین قیمت)
مرحله 2: خرید ETH در KuCoin (بهترین قیمت)
مرحله 3: فروش ETH در Kraken (بهترین قیمت)
```

### 4. 📊 Statistical Arbitrage (آربیتراژ آماری)
**تعریف**: استفاده از تحلیل آماری و بازگشت به میانگین برای شناسایی فرصت‌ها.

**نحوه کار**:
- محاسبه Z-Score برای انحراف قیمت از میانگین تاریخی
- شناسایی قیمت‌هایی که بیش از 2 انحراف معیار از میانگین فاصله دارند
- پیش‌بینی بازگشت قیمت به میانگین

**شاخص‌ها**:
- **Z-Score**: میزان انحراف از میانگین
- **Confidence**: درصد اطمینان به پیش‌بینی
- **Expected Return**: بازده مورد انتظار

### 5. ⚡ Flash Arbitrage (آربیتراژ برقی)
**تعریف**: فرصت‌های کوتاه‌مدت با سود بالا که نیاز به اجرای سریع دارند.

**ویژگی‌ها**:
- **پنجره زمانی محدود**: 30 ثانیه تا 5 دقیقه
- **سود بالا**: معمولاً بیش از 0.5%
- **اولویت‌بندی**: LOW, MEDIUM, HIGH
- **هشدار فوری**: برای اجرای سریع

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 18 یا بالاتر)
- npm یا yarn
- مرورگر مدرن با پشتیبانی از ES6+

### مراحل نصب

1. **کلون کردن پروژه**:
```bash
git clone https://github.com/your-username/cex-arbitrage-finder.git
cd cex-arbitrage-finder
```

2. **نصب وابستگی‌ها**:
```bash
npm install
# یا
yarn install
```

3. **اجرای پروژه در حالت توسعه**:
```bash
npm run dev
# یا
yarn dev
```

4. **دسترسی به برنامه**:
```
http://localhost:5173
```

### ساخت برای تولید

```bash
npm run build
# یا
yarn build
```

فایل‌های ساخته شده در پوشه `dist` قرار می‌گیرند.

## 📖 نحوه استفاده

### 1. مشاهده فرصت‌ها
- پس از بارگذاری، برنامه به طور خودکار شروع به اسکن می‌کند
- فرصت‌ها بر اساس سودآوری مرتب می‌شوند
- هر کارت شامل اطلاعات کامل استراتژی است

### 2. فیلتر کردن استراتژی‌ها
- از تب‌های بالای صفحه برای فیلتر استفاده کنید
- مشاهده آمار هر استراتژی
- مقایسه عملکرد استراتژی‌های مختلف

### 3. تحلیل آمار
- **کل فرصت‌ها**: تعداد کل فرصت‌های شناسایی شده
- **میانگین سود**: میانگین سودآوری همه فرصت‌ها
- **بهترین فرصت**: بالاترین سود قابل دستیابی
- **استراتژی‌های فعال**: تعداد استراتژی‌هایی که فرصت دارند

### 4. درک کارت‌های فرصت
هر کارت شامل:
- **نوع استراتژی** و رنگ‌بندی مخصوص
- **درصد سود** قابل دستیابی
- **جزئیات اجرا** (صرافی‌ها، قیمت‌ها، مراحل)
- **زمان شناسایی** فرصت

## 🏗️ ساختار پروژه

```
cex-arbitrage-finder/
├── public/                     # فایل‌های استاتیک
├── src/
│   ├── components/            # کامپوننت‌های React
│   │   ├── ArbitrageCard.tsx           # کارت آربیتراژ فضایی
│   │   ├── TriangularArbitrageCard.tsx # کارت آربیتراژ مثلثی
│   │   ├── CrossTriangularArbitrageCard.tsx # کارت آربیتراژ چندصرافی
│   │   ├── StatisticalArbitrageCard.tsx     # کارت آربیتراژ آماری
│   │   ├── FlashArbitrageCard.tsx      # کارت آربیتراژ برقی
│   │   ├── OpportunityList.tsx         # لیست فرصت‌ها
│   │   ├── StrategyStats.tsx           # آمار استراتژی‌ها
│   │   ├── Header.tsx                  # هدر برنامه
│   │   └── StatusIndicator.tsx         # نشانگر وضعیت
│   ├── services/              # سرویس‌ها و API
│   │   └── blockchainDataService.ts    # سرویس داده‌های بلاک‌چین
│   ├── types.ts              # تعریف انواع TypeScript
│   ├── constants.ts          # ثوابت و تنظیمات
│   ├── App.tsx              # کامپوننت اصلی
│   └── index.tsx            # نقطه ورود برنامه
├── package.json             # وابستگی‌ها و اسکریپت‌ها
├── tsconfig.json           # تنظیمات TypeScript
├── vite.config.ts          # تنظیمات Vite
└── README.md              # مستندات پروژه
```

## ⚙️ تنظیمات

### فایل `constants.ts`

```typescript
// صرافی‌های پشتیبانی شده
export const SUPPORTED_CEXS: CexInfo[] = [
  { id: 'binance', name: 'Binance', logoUrl: '...' },
  { id: 'kraken', name: 'Kraken', logoUrl: '...' },
  { id: 'coinbase', name: 'Coinbase', logoUrl: '...' },
  { id: 'kucoin', name: 'KuCoin', logoUrl: '...' },
  { id: 'bybit', name: 'Bybit', logoUrl: '...' },
];

// جفت ارزهای مورد بررسی
export const PAIRS_TO_SCAN: string[] = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
  'XRP/USDT', 'DOGE/USDT', 'ADA/USDT',
  // ...
];

// پارامترهای اسکن
export const REFRESH_INTERVAL_MS = 15000; // 15 ثانیه
export const MIN_PROFIT_PERCENTAGE_THRESHOLD = 0.1; // 0.1%
```

### تنظیمات قابل تغییر

1. **فاصله به‌روزرسانی**: `REFRESH_INTERVAL_MS`
2. **حداقل سود**: `MIN_PROFIT_PERCENTAGE_THRESHOLD`
3. **صرافی‌های فعال**: `SUPPORTED_CEXS`
4. **جفت ارزها**: `PAIRS_TO_SCAN`

## 🔌 API و سرویس‌ها

### `blockchainDataService.ts`

این سرویس شامل تمام منطق شناسایی فرصت‌های آربیتراژ است:

#### توابع اصلی:

1. **`generateMockData()`**: تولید داده‌های شبیه‌سازی شده
2. **`findSpatialOpportunities()`**: شناسایی آربیتراژ فضایی
3. **`findTriangularOpportunities()`**: شناسایی آربیتراژ مثلثی
4. **`findCrossExchangeTriangularOpportunities()`**: آربیتراژ چندصرافی
5. **`findStatisticalOpportunities()`**: آربیتراژ آماری
6. **`findFlashOpportunities()`**: آربیتراژ برقی
7. **`fetchAllOpportunities()`**: تابع اصلی جمع‌آوری

#### نمونه استفاده:

```typescript
import { fetchAllOpportunities } from './services/blockchainDataService';

const opportunities = await fetchAllOpportunities();
console.log(`Found ${opportunities.length} opportunities`);
```

## 🧩 کامپوننت‌ها

### کامپوننت‌های اصلی

#### 1. `App.tsx`
- مدیریت حالت کلی برنامه
- چرخه به‌روزرسانی داده‌ها
- مدیریت خطاها

#### 2. `OpportunityList.tsx`
- نمایش لیست فرصت‌ها
- فیلتر بر اساس نوع استراتژی
- تب‌های دسته‌بندی

#### 3. `StrategyStats.tsx`
- نمایش آمار کلی
- تحلیل عملکرد استراتژی‌ها
- کارت‌های آماری

#### 4. کارت‌های استراتژی
هر استراتژی دارای کامپوننت مخصوص خود:
- `ArbitrageCard.tsx`: آربیتراژ فضایی
- `TriangularArbitrageCard.tsx`: آربیتراژ مثلثی
- `CrossTriangularArbitrageCard.tsx`: آربیتراژ چندصرافی
- `StatisticalArbitrageCard.tsx`: آربیتراژ آماری
- `FlashArbitrageCard.tsx`: آربیتراژ برقی

### ویژگی‌های UI/UX

- **طراحی واکنش‌گرا**: سازگار با موبایل و دسکتاپ
- **رنگ‌بندی هوشمند**: هر استراتژی رنگ مخصوص خود
- **انیمیشن‌های نرم**: برای تجربه کاربری بهتر
- **آیکون‌های بصری**: برای شناسایی سریع

## 🧮 الگوریتم‌های آربیتراژ

### الگوریتم آربیتراژ فضایی

```typescript
function findSpatialOpportunities(exchanges: ExchangeData[]): Opportunity[] {
  const opportunities = [];
  
  for (const pair of PAIRS_TO_SCAN) {
    const prices = exchanges
      .map(ex => ({ exchange: ex.cex, bid: ex.tickers[pair]?.bid, ask: ex.tickers[pair]?.ask }))
      .filter(p => p.bid && p.ask);
    
    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue;
        
        const buyPrice = prices[i].ask;
        const sellPrice = prices[j].bid;
        
        if (sellPrice > buyPrice) {
          const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
          if (profit >= MIN_PROFIT_THRESHOLD) {
            opportunities.push({
              type: 'spatial',
              pair,
              buyAt: { exchange: prices[i].exchange, price: buyPrice },
              sellAt: { exchange: prices[j].exchange, price: sellPrice },
              profitPercentage: profit
            });
          }
        }
      }
    }
  }
  
  return opportunities;
}
```

### الگوریتم آربیتراژ مثلثی

```typescript
function findTriangularOpportunities(exchange: ExchangeData): Opportunity[] {
  const opportunities = [];
  const currencies = extractCurrencies(exchange.tickers);
  
  for (const [A, B, C] of generateTriangularPaths(currencies)) {
    const path1 = `${B}/${A}`;
    const path2 = `${C}/${B}`;
    const path3 = `${C}/${A}`;
    
    const rate1 = exchange.tickers[path1]?.ask;
    const rate2 = exchange.tickers[path2]?.ask;
    const rate3 = exchange.tickers[path3]?.bid;
    
    if (rate1 && rate2 && rate3) {
      let amount = 1.0;
      amount = amount / rate1;  // A → B
      amount = amount / rate2;  // B → C
      amount = amount * rate3;  // C → A
      
      const profit = (amount - 1.0) * 100;
      if (profit >= MIN_PROFIT_THRESHOLD) {
        opportunities.push({
          type: 'triangular',
          exchange: exchange.cex,
          path: [A, B, C],
          profitPercentage: profit
        });
      }
    }
  }
  
  return opportunities;
}
```

## ⚡ بهینه‌سازی عملکرد

### تکنیک‌های بهینه‌سازی

1. **React.memo**: برای جلوگیری از رندر غیرضروری
2. **useMemo**: برای محاسبات سنگین
3. **useCallback**: برای توابع callback
4. **Lazy Loading**: برای کامپوننت‌های سنگین

### مدیریت حافظه

```typescript
// استفاده از cleanup در useEffect
useEffect(() => {
  const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
  return () => clearInterval(interval);
}, []);

// محدود کردن تعداد فرصت‌های نمایش داده شده
const displayedOpportunities = opportunities.slice(0, MAX_DISPLAY_COUNT);
```

### بهینه‌سازی شبکه

- **Debouncing**: برای درخواست‌های متوالی
- **Caching**: ذخیره موقت نتایج
- **Error Handling**: مدیریت خطاهای شبکه

## 🔒 امنیت و بهترین شیوه‌ها

### امنیت داده‌ها
- **عدم ذخیره اطلاعات حساس**: هیچ کلید API یا اطلاعات شخصی ذخیره نمی‌شود
- **HTTPS**: استفاده از اتصالات امن
- **Input Validation**: اعتبارسنجی ورودی‌ها

### بهترین شیوه‌های کد
- **TypeScript**: برای ایمنی نوع داده‌ها
- **ESLint**: برای کیفیت کد
- **Error Boundaries**: مدیریت خطاهای React
- **Proper State Management**: مدیریت صحیح state

## 📊 مثال‌های عملی

### مثال 1: آربیتراژ فضایی BTC/USDT

```
صرافی A (Binance): 
  - قیمت خرید: $43,250
  - قیمت فروش: $43,280

صرافی B (Kraken):
  - قیمت خرید: $43,380
  - قیمت فروش: $43,420

فرصت آربیتراژ:
  - خرید از Binance: $43,280
  - فروش در Kraken: $43,380
  - سود: $100 (0.23%)
```

### مثال 2: آربیتراژ مثلثی

```
صرافی: Binance
مسیر: USDT → BTC → ETH → USDT

مرحله 1: 1000 USDT → BTC
  - نرخ: 43,250 USDT/BTC
  - مقدار BTC: 0.02312 BTC

مرحله 2: 0.02312 BTC → ETH
  - نرخ: 0.06 BTC/ETH
  - مقدار ETH: 0.3853 ETH

مرحله 3: 0.3853 ETH → USDT
  - نرخ: 2,600 USDT/ETH
  - مقدار نهایی: 1,001.78 USDT

سود: 1.78 USDT (0.178%)
```

## 🚨 هشدارها و محدودیت‌ها

### هشدارهای مهم
⚠️ **این ابزار صرفاً برای اهداف آموزشی است**
⚠️ **محاسبات سود شامل کارمزدها و هزینه‌های انتقال نیست**
⚠️ **قیمت‌ها ممکن است در زمان اجرا تغییر کرده باشند**
⚠️ **ریسک‌های معاملاتی را در نظر بگیرید**

### محدودیت‌های فنی
- داده‌ها شبیه‌سازی شده هستند (بدون API واقعی)
- عدم در نظر گیری slippage و market depth
- فرض ثابت بودن قیمت‌ها در طول اجرا

## 🤝 مشارکت

### نحوه مشارکت

1. **Fork کردن پروژه**
2. **ایجاد branch جدید**:
   ```bash
   git checkout -b feature/new-strategy
   ```
3. **اعمال تغییرات و commit**:
   ```bash
   git commit -m "Add new arbitrage strategy"
   ```
4. **Push کردن تغییرات**:
   ```bash
   git push origin feature/new-strategy
   ```
5. **ایجاد Pull Request**

### راهنمای توسعه

#### اضافه کردن استراتژی جدید

1. **تعریف نوع در `types.ts`**:
```typescript
export interface NewStrategyOpportunity {
  type: 'new-strategy';
  id: string;
  // سایر فیلدها
}
```

2. **پیاده‌سازی الگوریتم در `blockchainDataService.ts`**:
```typescript
const findNewStrategyOpportunities = (data: ExchangeData[]): NewStrategyOpportunity[] => {
  // منطق استراتژی
};
```

3. **ایجاد کامپوننت UI**:
```typescript
const NewStrategyCard: React.FC<{opportunity: NewStrategyOpportunity}> = ({opportunity}) => {
  // UI کامپوننت
};
```

4. **اضافه کردن به `OpportunityList.tsx`**

### استانداردهای کد
- استفاده از TypeScript برای همه فایل‌ها
- پیروی از ESLint rules
- نوشتن کامنت‌های مفید
- تست کردن تغییرات

## 📈 نقشه راه آینده

### ویژگی‌های در دست توسعه

- [ ] **اتصال به API واقعی** صرافی‌ها
- [ ] **سیستم هشدار** برای فرصت‌های پرسود
- [ ] **تحلیل تاریخی** عملکرد استراتژی‌ها
- [ ] **محاسبه دقیق کارمزد** و هزینه‌ها
- [ ] **پشتیبانی از DEX** (صرافی‌های غیرمتمرکز)
- [ ] **ربات معاملاتی** خودکار
- [ ] **API عمومی** برای توسعه‌دهندگان
- [ ] **اپلیکیشن موبایل** native

### بهبودهای فنی

- [ ] **WebSocket** برای داده‌های real-time
- [ ] **Service Worker** برای کار آفلاین
- [ ] **PWA** قابلیت‌ها
- [ ] **تست‌های خودکار** جامع
- [ ] **CI/CD Pipeline** کامل

## 📞 پشتیبانی و تماس

### راه‌های ارتباطی
- **GitHub Issues**: برای گزارش باگ و درخواست ویژگی
- **Email**: [your-email@example.com]
- **Discord**: [لینک سرور Discord]

### سوالات متداول (FAQ)

**Q: آیا این ابزار برای معاملات واقعی قابل استفاده است؟**
A: خیر، این ابزار صرفاً برای اهداف آموزشی طراحی شده است.

**Q: چرا داده‌ها شبیه‌سازی شده هستند؟**
A: برای جلوگیری از محدودیت‌های API و ارائه تجربه پایدار.

**Q: چگونه می‌توانم استراتژی جدید اضافه کنم؟**
A: راهنمای کامل در بخش "مشارکت" موجود است.

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است. برای جزئیات بیشتر فایل `LICENSE` را مطالعه کنید.

```
MIT License

Copyright (c) 2025 CEX Arbitrage Finder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 تشکر و قدردانی

از تمام کسانی که در توسعه این پروژه مشارکت داشته‌اند تشکر می‌کنیم:

- **React Team** برای فریمورک عالی
- **Tailwind CSS** برای سیستم طراحی
- **TypeScript Team** برای ایمنی نوع داده‌ها
- **Vite** برای ابزار build سریع
- **جامعه متن‌باز** برای الهام و پشتیبانی

---

**ساخته شده با ❤️ برای جامعه کریپتو**

*آخرین بروزرسانی: ژانویه 2025*