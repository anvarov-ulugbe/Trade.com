// ===== TradeVault Database v2 =====
const DB_KEYS = {
    TRADES: 'tv_trades',
    SETTINGS: 'tv_settings',
    TARGETS: 'tv_targets',
    JOURNAL: 'tv_journal',
    USERS: 'tv_users'
};

const DEFAULT_USERS = [
    { id: 'admin', login: 'admin', password: 'admin', name: 'System Admin', role: 'admin' },
    { id: 'user1', login: 'trader', password: 'password', name: 'SMC Trader', role: 'user' }
];

const DEFAULT_SETTINGS = {
    theme: 'dark',
    activeAccount: 'real',
    accounts: [
        { id: 'real', name: 'Real Account', balance: 10000, currency: 'USD', withdrawals: [] },
        { id: 'demo', name: 'Demo Account', balance: 50000, currency: 'USD', withdrawals: [] },
        { id: 'prop', name: 'Prop Firm', balance: 100000, currency: 'USD', withdrawals: [] }
    ],
    notifications: { dailyReminder: true, weeklyReport: true, streakAlert: true },
    pairs: ["XAUUSD", "GER40", "BRENT", "AUDUSD", "EURUSD", "GBPUSD"],
    strategies: ['ICT Silver Bullet', 'Judas Swing', 'Turtle Soup', 'MSS', 'FVG Reversal', 'ICT OB', 'ICT FVG', 'ICT BOS', 'SMC', 'Другое']
};

const DEFAULT_TARGETS = {
    weeklyPnl: 500,
    monthlyPnl: 2000,
    weeklyTrades: 10,
    minWinRate: 55,
    maxDailyLoss: 200
};

const DEFAULT_TRADES = [
    { id:1,date:"2026-03-03",pair:"EURUSD",direction:"BUY",entry:1.08250,exit:1.08720,sl:1.08050,tp:1.08800,lot:0.50,pnl:235,strategy:"ICT FVG",timeframe:"1H",confluence:4,account:"real",userId:"user1",notes:"Вход внутри 1H FVG, Лондонская сессия",screenshot:"",isStarred:false },
    { id:2,date:"2026-03-05",pair:"XAUUSD",direction:"SELL",entry:2045.50,exit:2038.20,sl:2050.00,tp:2035.00,lot:0.20,pnl:146,strategy:"ICT Liquidity",timeframe:"4H",confluence:3,account:"real",userId:"user1",notes:"Свип ликвидности, движение вниз",screenshot:"",isStarred:false },
    { id:3,date:"2026-03-07",pair:"GBPUSD",direction:"BUY",entry:1.26800,exit:1.26550,sl:1.26600,tp:1.27200,lot:0.30,pnl:-75,strategy:"ICT OB",timeframe:"15min",confluence:2,account:"real",userId:"user1",notes:"Выбило SL, неверный выбор OB",screenshot:"",isStarred:false },
    { id:4,date:"2026-03-10",pair:"EURUSD",direction:"SELL",entry:1.09100,exit:1.08650,sl:1.09350,tp:1.08500,lot:0.40,pnl:180,strategy:"ICT BOS",timeframe:"3min",confluence:3,account:"real",userId:"user1",notes:"Сигнал 3min BOS, хороший вход",screenshot:"",isStarred:false },
    { id:5,date:"2026-03-12",pair:"USDJPY",direction:"BUY",entry:149.200,exit:149.850,sl:148.900,tp:150.000,lot:0.30,pnl:195,strategy:"ICT Breaker",timeframe:"1H",confluence:4,account:"real",userId:"user1",notes:"Отскок от Breaker block",screenshot:"",isStarred:false },
    { id:6,date:"2026-03-14",pair:"XAUUSD",direction:"BUY",entry:2028.00,exit:2042.50,sl:2023.00,tp:2045.00,lot:0.15,pnl:217.50,strategy:"ICT FVG",timeframe:"4H",confluence:5,account:"real",userId:"user1",notes:"4H FVG заполнен",screenshot:"",isStarred:false },
    { id:7,date:"2026-03-17",pair:"GBPJPY",direction:"SELL",entry:190.500,exit:190.650,sl:190.700,tp:189.800,lot:0.20,pnl:-30,strategy:"SMC",timeframe:"15min",confluence:2,account:"demo",userId:"user1",notes:"Ложный пробой, выбило SL",screenshot:"",isStarred:false },
    { id:8,date:"2026-03-19",pair:"EURUSD",direction:"BUY",entry:1.08900,exit:1.09400,sl:1.08650,tp:1.09500,lot:0.50,pnl:250,strategy:"ICT OB",timeframe:"1H",confluence:4,account:"real",userId:"user1",notes:"Конфлюэнс 1H OB + FVG",screenshot:"",isStarred:false },
    { id:9,date:"2026-03-21",pair:"BTCUSD",direction:"BUY",entry:67500,exit:68900,sl:66800,tp:69000,lot:0.05,pnl:70,strategy:"ICT Liquidity",timeframe:"4H",confluence:3,account:"demo",userId:"user1",notes:"Daily low swept, reversal",screenshot:"",isStarred:false },
    { id:10,date:"2026-03-24",pair:"XAUUSD",direction:"SELL",entry:2055.00,exit:2060.50,sl:2062.00,tp:2045.00,lot:0.20,pnl:-110,strategy:"ICT BOS",timeframe:"1H",confluence:2,account:"real",userId:"user1",notes:"Тренд продолжился, убыток",screenshot:"",isStarred:false },
    { id:11,date:"2026-03-26",pair:"EURUSD",direction:"SELL",entry:1.07950,exit:1.07500,sl:1.08200,tp:1.07400,lot:0.60,pnl:270,strategy:"ICT FVG",timeframe:"1H",confluence:5,account:"real",userId:"user1",notes:"NY сессия, сильное движение",screenshot:"",isStarred:false },
    { id:12,date:"2026-03-28",pair:"USDJPY",direction:"SELL",entry:151.300,exit:150.800,sl:151.600,tp:150.500,lot:0.25,pnl:125,strategy:"Supply/Demand",timeframe:"4H",confluence:3,account:"real",userId:"user1",notes:"Сильная зона предложения (supply)",screenshot:"",isStarred:false },
    { id:13,date:"2026-03-31",pair:"GBPUSD",direction:"BUY",entry:1.26350,exit:1.26350,sl:1.26100,tp:1.26700,lot:0.30,pnl:0,strategy:"ICT OB",timeframe:"15min",confluence:3,account:"real",userId:"user1",notes:"Выход в безубыток",screenshot:"",isStarred:false },
    { id:14,date:"2026-04-02",pair:"XAUUSD",direction:"BUY",entry:2035.00,exit:2052.00,sl:2030.00,tp:2055.00,lot:0.25,pnl:425,strategy:"ICT Liquidity",timeframe:"1H",confluence:5,account:"real",userId:"user1",notes:"Asia low swept, London push",screenshot:"media__1777892880060.png",isStarred:true },
    { id:15,date:"2026-04-04",pair:"EURUSD",direction:"BUY",entry:1.08100,exit:1.08550,sl:1.07850,tp:1.08600,lot:0.40,pnl:180,strategy:"ICT BOS",timeframe:"3min",confluence:4,account:"real",userId:"user1",notes:"1H BOS подтвержден",screenshot:"",isStarred:false },
    { id:16,date:"2026-04-07",pair:"BTCUSD",direction:"SELL",entry:71200,exit:70100,sl:71800,tp:69500,lot:0.03,pnl:33,strategy:"ICT Breaker",timeframe:"4H",confluence:3,account:"demo",userId:"user1",notes:"Breaker block rejection",screenshot:"",isStarred:false },
    { id:17,date:"2026-04-09",pair:"GBPJPY",direction:"BUY",entry:191.200,exit:192.100,sl:190.700,tp:192.300,lot:0.15,pnl:135,strategy:"ICT FVG",timeframe:"15min",confluence:4,account:"real",userId:"user1",notes:"15min FVG filled, strong push",screenshot:"",isStarred:false },
    { id:18,date:"2026-04-11",pair:"XAUUSD",direction:"SELL",entry:2068.00,exit:2074.50,sl:2075.00,tp:2055.00,lot:0.20,pnl:-130,strategy:"SMC",timeframe:"1H",confluence:2,account:"real",userId:"user1",notes:"Пробой, выбило SL",screenshot:"",isStarred:false },
    { id:19,date:"2026-04-14",pair:"EURUSD",direction:"SELL",entry:1.09200,exit:1.08700,sl:1.09450,tp:1.08600,lot:0.50,pnl:250,strategy:"ICT OB",timeframe:"4H",confluence:5,account:"real",userId:"user1",notes:"Идеальный вход от 4H OB. FVG + OB + BOS hammasi bir joyda.",screenshot:"media__1777892880060.png",isStarred:true },
    { id:20,date:"2026-04-16",pair:"USDJPY",direction:"BUY",entry:153.500,exit:154.200,sl:153.100,tp:154.500,lot:0.20,pnl:140,strategy:"ICT Liquidity",timeframe:"1H",confluence:3,account:"real",userId:"user1",notes:"Equal lows swept",screenshot:"",isStarred:false },
    { id:21,date:"2026-04-18",pair:"GBPUSD",direction:"SELL",entry:1.27100,exit:1.27300,sl:1.27350,tp:1.26600,lot:0.25,pnl:-50,strategy:"ICT BOS",timeframe:"3min",confluence:2,account:"real",userId:"user1",notes:"Неверный сигнал BOS",screenshot:"",isStarred:false },
    { id:22,date:"2026-04-21",pair:"XAUUSD",direction:"BUY",entry:2080.00,exit:2098.00,sl:2074.00,tp:2100.00,lot:0.30,pnl:540,strategy:"ICT FVG",timeframe:"1H",confluence:5,account:"real",userId:"user1",notes:"Weekly FVG заполнен, сильный импульс. Лучший сетап!",screenshot:"media__1777892880060.png",isStarred:true },
    { id:23,date:"2026-04-23",pair:"EURUSD",direction:"BUY",entry:1.08400,exit:1.08650,sl:1.08200,tp:1.08700,lot:0.40,pnl:100,strategy:"Scalping",timeframe:"5min",confluence:2,account:"prop",userId:"user1",notes:"Quick scalp, London open",screenshot:"",isStarred:false },
    { id:24,date:"2026-04-25",pair:"BTCUSD",direction:"BUY",entry:69800,exit:71500,sl:69000,tp:72000,lot:0.04,pnl:68,strategy:"Breakout",timeframe:"4H",confluence:3,account:"demo",userId:"user1",notes:"Range breakout",screenshot:"",isStarred:false },
    { id:25,date:"2026-04-28",pair:"GBPJPY",direction:"SELL",entry:193.800,exit:192.500,sl:194.300,tp:192.000,lot:0.20,pnl:260,strategy:"ICT OB",timeframe:"1H",confluence:4,account:"real",userId:"user1",notes:"Daily OB rejection",screenshot:"",isStarred:false },
    { id:26,date:"2026-04-30",pair:"XAUUSD",direction:"BUY",entry:2090.00,exit:2086.00,sl:2085.00,tp:2102.00,lot:0.20,pnl:-80,strategy:"ICT Liquidity",timeframe:"15min",confluence:2,account:"real",userId:"user1",notes:"Выбило SL, ложный свип",screenshot:"",isStarred:false },
    { id:27,date:"2026-05-02",pair:"EURUSD",direction:"SELL",entry:1.09050,exit:1.08550,sl:1.09300,tp:1.08400,lot:0.50,pnl:250,strategy:"ICT BOS",timeframe:"3min",confluence:4,account:"real",userId:"user1",notes:"Сильный 1H BOS, четкий сигнал",screenshot:"",isStarred:false },
    { id:28,date:"2026-05-04",pair:"USDJPY",direction:"BUY",entry:155.100,exit:155.600,sl:154.800,tp:155.800,lot:0.25,pnl:125,strategy:"ICT Breaker",timeframe:"1H",confluence:4,account:"prop",userId:"user1",notes:"Breaker + OB overlap",screenshot:"",isStarred:false }
];

class TradeDatabase {
    constructor() { this.init(); }

    init() {
        if (!localStorage.getItem(DB_KEYS.TRADES)) localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(DEFAULT_TRADES));
        if (!localStorage.getItem(DB_KEYS.SETTINGS)) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        if (!localStorage.getItem(DB_KEYS.TARGETS)) localStorage.setItem(DB_KEYS.TARGETS, JSON.stringify(DEFAULT_TARGETS));
        if (!localStorage.getItem(DB_KEYS.USERS)) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }

    // === Users ===
    getUsers() { 
        return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || JSON.stringify(DEFAULT_USERS));
    }
    getUserById(id) { return this.getUsers().find(u => u.id === id); }
    addUser(u) {
        const list = this.getUsers();
        u.id = 'u' + Date.now();
        u.createdAt = new Date().toISOString();
        list.push(u); 
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list));
        
        // Initialize user-specific settings with empty accounts to trigger onboarding
        const initialSettings = { 
            ...DEFAULT_SETTINGS, 
            accounts: [], 
            activeAccount: null 
        };
        localStorage.setItem(`tv_settings_${u.id}`, JSON.stringify(initialSettings));
        
        return u;
    }
    updateUser(id, data) {
        const list = this.getUsers();
        const idx = list.findIndex(u => u.id === id);
        if (idx >= 0) { Object.assign(list[idx], data); localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list)); }
    }
    removeUser(id) {
        const list = this.getUsers().filter(u => u.id !== id);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list));
    }
    authenticate(login, password) {
        return this.getUsers().find(u => u.login === login && u.password === password);
    }

    // === Trades ===
    getAll(account, userId) {
        let trades = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        const current = userId || JSON.parse(localStorage.getItem('tv_current_user'))?.id;
        if (current && current !== 'admin') trades = trades.filter(t => t.userId === current);
        if (account) trades = trades.filter(t => t.account === account);
        return trades;
    }
    getById(id) { return (JSON.parse(localStorage.getItem(DB_KEYS.TRADES))||[]).find(t => t.id === id); }
    add(trade) {
        const list = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        trade.id = list.length > 0 ? Math.max(...list.map(t => t.id)) + 1 : 1;
        trade.userId = JSON.parse(localStorage.getItem('tv_current_user'))?.id;
        list.push(trade); localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
        return trade;
    }
    remove(id) {
        const list = this.getAll().filter(t => t.id !== id);
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
    }
    update(id, data) {
        const list = this.getAll();
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) { Object.assign(list[idx], data); localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list)); }
    }
    toggleStar(id) {
        const list = this.getAll();
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) {
            list[idx].isStarred = !list[idx].isStarred;
            localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
        }
    }
    getStarredTrades() {
        return this.getAll().filter(t => t.isStarred && t.screenshot);
    }
    search(q) {
        const s = q.toLowerCase();
        return this.getAll().filter(t => t.pair.toLowerCase().includes(s) || t.strategy.toLowerCase().includes(s) || (t.notes||'').toLowerCase().includes(s));
    }
    filter(opts) {
        let list = this.getAll(opts.account);
        if (opts.pair) list = list.filter(t => t.pair === opts.pair);
        if (opts.result === 'win') list = list.filter(t => t.pnl > 0);
        else if (opts.result === 'loss') list = list.filter(t => t.pnl < 0);
        else if (opts.result === 'breakeven') list = list.filter(t => t.pnl === 0);
        if (opts.strategy) list = list.filter(t => t.strategy === opts.strategy);
        if (opts.timeframe) list = list.filter(t => t.timeframe === opts.timeframe);
        return list;
    }

    // === Settings (User-specific) ===
    _getSettingsKey() {
        const user = JSON.parse(localStorage.getItem('tv_current_user'));
        return user ? `tv_settings_${user.id}` : DB_KEYS.SETTINGS;
    }
    getSettings() { 
        const key = this._getSettingsKey();
        return JSON.parse(localStorage.getItem(key)) || DEFAULT_SETTINGS; 
    }
    saveSettings(s) { 
        const key = this._getSettingsKey();
        localStorage.setItem(key, JSON.stringify(s)); 
    }
    getActiveAccount() { return this.getSettings().activeAccount; }
    setActiveAccount(id) { const s = this.getSettings(); s.activeAccount = id; this.saveSettings(s); }
    getAccounts() { return this.getSettings().accounts; }
    addAccount(acc) {
        const s = this.getSettings();
        if (!s.accounts) s.accounts = [];
        s.accounts.push(acc);
        this.saveSettings(s);
    }
    removeAccount(id) {
        const s = this.getSettings();
        if (!s.accounts) return;
        s.accounts = s.accounts.filter(a => a.id !== id);
        if (s.activeAccount === id && s.accounts.length > 0) {
            s.activeAccount = s.accounts[0].id;
        }
        this.saveSettings(s);
        // O'chirilgan hisobning savdolarini ham o'chiramiz
        let trades = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        trades = trades.filter(t => t.account !== id);
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(trades));
    }
    addWithdrawal(accountId, amount) {
        const s = this.getSettings();
        const acc = s.accounts.find(a => a.id === accountId);
        if (acc) {
            if (!acc.withdrawals) acc.withdrawals = [];
            acc.withdrawals.push({ date: new Date().toISOString(), amount: parseFloat(amount) });
            this.saveSettings(s);
            return true;
        }
        return false;
    }
    getWithdrawals(accountId) {
        const acc = this.getSettings().accounts.find(a => a.id === accountId);
        return acc ? (acc.withdrawals || []) : [];
    }
    getTotalWithdrawals(accountId) {
        return this.getWithdrawals(accountId).reduce((s, w) => s + w.amount, 0);
    }
    removeWithdrawal(accountId, index) {
        const s = this.getSettings();
        const acc = s.accounts.find(a => a.id === accountId);
        if (acc && acc.withdrawals) {
            acc.withdrawals.splice(index, 1);
            this.saveSettings(s);
            return true;
        }
        return false;
    }

    // === Targets ===
    getTargets() { return JSON.parse(localStorage.getItem(DB_KEYS.TARGETS)) || DEFAULT_TARGETS; }
    saveTargets(t) { localStorage.setItem(DB_KEYS.TARGETS, JSON.stringify(t)); }

    // === Statistics ===
    getStats(account, userId) {
        const trades = this.getAll(account, userId);
        if (!trades.length) return this._empty();
        const wins = trades.filter(t => t.pnl > 0), losses = trades.filter(t => t.pnl < 0), be = trades.filter(t => t.pnl === 0);
        const totalPnl = trades.reduce((s,t) => s + t.pnl, 0);
        const gp = wins.reduce((s,t) => s + t.pnl, 0), gl = Math.abs(losses.reduce((s,t) => s + t.pnl, 0));
        const avgW = wins.length ? gp/wins.length : 0, avgL = losses.length ? gl/losses.length : 0;
        
        // Per-user specific stats for admin
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthPnl = trades.filter(t => new Date(t.date) >= firstDayMonth).reduce((s,t) => s + t.pnl, 0);

        return {
            totalTrades: trades.length, totalPnl, monthPnl, wins: wins.length, losses: losses.length, breakeven: be.length,
            winRate: (wins.length/trades.length)*100,
            profitFactor: gl > 0 ? gp/gl : gp > 0 ? 999 : 0,
            avgWin: avgW, avgLoss: avgL,
            bestTrade: Math.max(...trades.map(t => t.pnl)), worstTrade: Math.min(...trades.map(t => t.pnl)),
            avgRR: avgL > 0 ? avgW/avgL : 0,
            maxConsecWins: this._maxC(trades,true), maxConsecLosses: this._maxC(trades,false),
            currentStreak: this._curStreak(trades),
            pairStats: this._grp(trades,'pair'), strategyStats: this._grp(trades,'strategy'),
            timeframeStats: this._grp(trades,'timeframe'),
            equityCurve: this._eq(trades), drawdownCurve: this._dd(trades),
            weeklyPnl: this._weekly(trades), monthlyPnl: this._monthly(trades),
            dayOfWeekPnl: this._dow(trades), topPairs: this._top(trades),
            confluenceStats: this._confluenceStats(trades)
        };
    }
    _empty() { return {totalTrades:0,totalPnl:0,monthPnl:0,wins:0,losses:0,breakeven:0,winRate:0,profitFactor:0,avgWin:0,avgLoss:0,bestTrade:0,worstTrade:0,avgRR:0,maxConsecWins:0,maxConsecLosses:0,currentStreak:{type:'none',count:0},pairStats:[],strategyStats:[],timeframeStats:[],equityCurve:[],drawdownCurve:[],weeklyPnl:[],monthlyPnl:[],dayOfWeekPnl:[],topPairs:[],confluenceStats:[]}; }
    _maxC(t,w) { let m=0,c=0; [...t].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(x=>{if((w&&x.pnl>0)||(!w&&x.pnl<0)){c++;m=Math.max(m,c)}else c=0});return m; }
    _curStreak(trades) {
        const sorted = [...trades].sort((a,b) => new Date(b.date) - new Date(a.date));
        if (!sorted.length) return { type: 'none', count: 0 };
        const first = sorted[0].pnl > 0 ? 'win' : sorted[0].pnl < 0 ? 'loss' : 'be';
        let count = 0;
        for (const t of sorted) {
            const r = t.pnl > 0 ? 'win' : t.pnl < 0 ? 'loss' : 'be';
            if (r === first) count++; else break;
        }
        return { type: first, count };
    }
    _grp(t,k) { const m={};t.forEach(x=>{if(!m[x[k]])m[x[k]]={name:x[k],trades:0,pnl:0,wins:0};m[x[k]].trades++;m[x[k]].pnl+=x.pnl;if(x.pnl>0)m[x[k]].wins++});return Object.values(m).sort((a,b)=>b.pnl-a.pnl); }
    _eq(t) { const s=[...t].sort((a,b)=>new Date(a.date)-new Date(b.date));let b=this.getSettings().accounts.find(a=>a.id===this.getActiveAccount())?.balance||10000;return s.map(x=>{b+=x.pnl;return{date:x.date,balance:b}}); }
    _dd(trades) {
        const sorted = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
        let bal = this.getSettings().accounts.find(a=>a.id===this.getActiveAccount())?.balance||10000;
        let peak = bal;
        return sorted.map(t => {
            bal += t.pnl; if (bal > peak) peak = bal;
            const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
            return { date: t.date, drawdown: dd, balance: bal, peak };
        });
    }
    _weekly(t) { const w={};t.forEach(x=>{const d=new Date(x.date);const ws=new Date(d);ws.setDate(d.getDate()-d.getDay());const k=ws.toISOString().split('T')[0];if(!w[k])w[k]=0;w[k]+=x.pnl});return Object.entries(w).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8).map(([w,p])=>({week:w,pnl:p})); }
    _monthly(trades) {
        const m = {};
        trades.forEach(t => {
            const d = new Date(t.date);
            const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
            if (!m[key]) m[key] = 0;
            m[key] += t.pnl;
        });
        return Object.entries(m).sort((a,b) => a[0].localeCompare(b[0])).map(([month, pnl]) => ({ month, pnl }));
    }
    _dow(t) { const d=['Вск','Пнд','Втр','Срд','Чтв','Птн','Суб'];const m=d.map(x=>({day:x,pnl:0,count:0}));t.forEach(x=>{const i=new Date(x.date).getDay();m[i].pnl+=x.pnl;m[i].count++});return m; }
    _top(t) { const m={};t.forEach(x=>{if(!m[x.pair])m[x.pair]={pair:x.pair,count:0,pnl:0};m[x.pair].count++;m[x.pair].pnl+=x.pnl});return Object.values(m).sort((a,b)=>b.count-a.count).slice(0,5); }
    _confluenceStats(trades) {
        const m = {};
        trades.forEach(t => {
            const c = t.confluence || 0;
            if (!m[c]) m[c] = { score: c, trades: 0, pnl: 0, wins: 0 };
            m[c].trades++; m[c].pnl += t.pnl; if (t.pnl > 0) m[c].wins++;
        });
        return Object.values(m).sort((a,b) => a.score - b.score);
    }

    // === Progress ===
    getWeekProgress() {
        const targets = this.getTargets();
        const now = new Date();
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
        const trades = this.getAll(this.getActiveAccount()).filter(t => new Date(t.date) >= weekStart);
        const pnl = trades.reduce((s,t) => s + t.pnl, 0);
        const dailyLoss = {};
        trades.forEach(t => { if (!dailyLoss[t.date]) dailyLoss[t.date] = 0; dailyLoss[t.date] += t.pnl; });
        const worstDay = Math.min(0, ...Object.values(dailyLoss));
        return {
            pnl: { current: pnl, target: targets.weeklyPnl, pct: Math.min(100, (pnl / targets.weeklyPnl) * 100) },
            trades: { current: trades.length, target: targets.weeklyTrades, pct: Math.min(100, (trades.length / targets.weeklyTrades) * 100) },
            winRate: { current: trades.length ? (trades.filter(t=>t.pnl>0).length/trades.length*100) : 0, target: targets.minWinRate },
            dailyLoss: { current: Math.abs(worstDay), max: targets.maxDailyLoss }
        };
    }

    reset() {
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(DEFAULT_TRADES));
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(DB_KEYS.TARGETS, JSON.stringify(DEFAULT_TARGETS));
    }
}

const db = new TradeDatabase();
