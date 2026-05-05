// ===== TradeVault Database v2 — Supabase Edition =====
const DB_KEYS = {
    TRADES: 'tv_trades',
    SETTINGS: 'tv_settings',
    TARGETS: 'tv_targets',
    JOURNAL: 'tv_journal',
    USERS: 'tv_users',
    ACTIVE_ACC: 'tv_active_acc'
};

const SUPABASE_URL = 'https://uukpbearcztqkshwnfui.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gVd_dI6RIFlVEk2ksjMD_g_xdvVdoTC';

// Initial data for fallback
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

class TradeDatabase {
    constructor() {
        try {
            if (typeof supabase !== 'undefined') {
                this.client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                this.isCloudEnabled = true;
            } else {
                console.warn("Supabase SDK not loaded. Running in local mode.");
                this.isCloudEnabled = false;
            }
        } catch (e) {
            console.error("Error initializing Supabase client:", e);
            this.isCloudEnabled = false;
        }
    }

    async init() {
        console.log("DB: Initializing Storage...");
        
        // Ensure defaults exist first
        if (!localStorage.getItem(DB_KEYS.USERS)) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        if (!localStorage.getItem(DB_KEYS.TRADES)) localStorage.setItem(DB_KEYS.TRADES, JSON.stringify([]));
        if (!localStorage.getItem(DB_KEYS.SETTINGS)) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        if (!localStorage.getItem(DB_KEYS.TARGETS)) localStorage.setItem(DB_KEYS.TARGETS, JSON.stringify(DEFAULT_TARGETS));

        if (!this.isCloudEnabled) return;

        try {
            // 1. Fetch Users - Sync cloud IDs to local for existing logins
            const { data: users, error: uErr } = await this.client.from('tv_users').select('*');
            if (!uErr && users) {
                const localUsers = this.getUsers();
                const mergedUsers = [...DEFAULT_USERS];
                
                // Start with cloud users to ensure they have correct IDs
                users.forEach(u => {
                    mergedUsers.push(u);
                });

                // Add local users only if their login is not in cloud
                localUsers.forEach(lu => {
                    if (!mergedUsers.find(mu => mu.login === lu.login)) {
                        mergedUsers.push(lu);
                    }
                });
                
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(mergedUsers));
            }

            // 2. Fetch Trades
            const { data: trades, error: tErr } = await this.client.from('tv_trades').select('*');
            if (!tErr && trades) {
                const formattedTrades = trades.map(t => ({
                    id: t.id,
                    date: t.date,
                    pair: t.pair,
                    direction: t.direction,
                    entry: t.entry,
                    exit: t.exit,
                    sl: t.sl,
                    tp: t.tp,
                    lot: t.lot,
                    pnl: t.pnl,
                    strategy: t.strategy,
                    timeframe: t.timeframe,
                    confluence: t.confluence,
                    account: t.account,
                    userId: t.user_id,
                    notes: t.notes,
                    screenshot: t.screenshot,
                    isStarred: t.is_starred
                }));
                localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(formattedTrades));
            }

            // 3. Fetch Settings for current user
            const currentUser = JSON.parse(localStorage.getItem('tv_current_user') || 'null');
            if (currentUser) {
                const { data: settingsData, error: sErr } = await this.client
                    .from('tv_settings')
                    .select('settings')
                    .eq('user_id', currentUser.id)
                    .single();
                
                if (!sErr && settingsData) {
                    localStorage.setItem(`tv_settings_${currentUser.id}`, JSON.stringify(settingsData.settings));
                }
            }
            console.log("DB: Cloud Sync Complete.");
        } catch (e) {
            console.error("DB: Cloud Sync Failed, using local cache.", e);
        }
    }

    // === Users ===
    getUsers() { 
        try {
            const data = localStorage.getItem(DB_KEYS.USERS);
            if (!data || data === 'undefined' || data === 'null') return DEFAULT_USERS;
            return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing users:", e);
            return DEFAULT_USERS;
        }
    }
    getUserById(id) { return this.getUsers().find(u => u.id === id); }
    async addUser(u) {
        const list = this.getUsers();
        let newUser = { ...u, id: 'u' + Date.now() };

        if (this.isCloudEnabled) {
            const { data, error } = await this.client.from('tv_users').insert([{
                login: u.login,
                password: u.password,
                name: u.name,
                role: u.role || 'user'
            }]).select();

            if (error) {
                console.warn("Supabase error adding user, falling back to local:", error);
                // Don't return null, continue with local newUser
            } else if (data && data.length > 0) {
                newUser = data[0];
            }
        }

        list.push(newUser);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list));

        const initialSettings = { ...DEFAULT_SETTINGS, accounts: [], activeAccount: null };
        localStorage.setItem(`tv_settings_${newUser.id}`, JSON.stringify(initialSettings));
        
        if (this.isCloudEnabled) {
            await this.client.from('tv_settings').insert([{ user_id: newUser.id, settings: initialSettings }]);
        }
        
        return newUser;
    }
    async updateUser(id, data) {
        const list = this.getUsers();
        const idx = list.findIndex(u => u.id === id);
        if (idx >= 0) {
            Object.assign(list[idx], data);
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list));
            if (this.isCloudEnabled) {
                await this.client.from('tv_users').update(data).eq('id', id);
            }
        }
    }
    async removeUser(id) {
        const list = this.getUsers().filter(u => u.id !== id);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(list));
        if (this.isCloudEnabled) {
            await this.client.from('tv_users').delete().eq('id', id);
        }
    }
    authenticate(login, password) {
        return this.getUsers().find(u => u.login === login && u.password === password);
    }

    // === Trades ===
    getAll(account, userId) {
        let trades = [];
        try {
            const data = localStorage.getItem(DB_KEYS.TRADES);
            if (data && data !== 'undefined' && data !== 'null') trades = JSON.parse(data);
        } catch (e) {
            console.error("Error parsing trades:", e);
        }
        const current = userId || JSON.parse(localStorage.getItem('tv_current_user') || 'null')?.id;
        if (current && current !== 'admin') trades = trades.filter(t => t.userId === current);
        if (account) trades = trades.filter(t => t.account === account);
        return trades;
    }
    getById(id) { return (JSON.parse(localStorage.getItem(DB_KEYS.TRADES))||[]).find(t => t.id === id); }
    async add(trade) {
        const currentUser = JSON.parse(localStorage.getItem('tv_current_user'));
        let savedTrade = { ...trade, id: Date.now(), userId: currentUser?.id || 'admin' };
        
        if (this.isCloudEnabled) {
            const { data, error } = await this.client.from('tv_trades').insert([{
                user_id: currentUser?.id,
                account: trade.account,
                date: trade.date,
                pair: trade.pair,
                direction: trade.direction,
                entry: trade.entry,
                exit: trade.exit,
                sl: trade.sl,
                tp: trade.tp,
                lot: trade.lot,
                pnl: trade.pnl,
                strategy: trade.strategy,
                timeframe: trade.timeframe,
                confluence: trade.confluence,
                notes: trade.notes,
                screenshot: trade.screenshot,
                is_starred: trade.isStarred
            }]).select();

            if (!error && data && data.length > 0) {
                savedTrade = { ...trade, id: data[0].id, userId: data[0].user_id };
            }
        }
        
        const list = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        list.push(savedTrade);
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
        return savedTrade;
    }
    async remove(id) {
        const list = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        const filtered = list.filter(t => t.id !== id);
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(filtered));
        if (this.isCloudEnabled) await this.client.from('tv_trades').delete().eq('id', id);
    }
    async update(id, data) {
        const list = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) {
            Object.assign(list[idx], data);
            localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
            
            if (this.isCloudEnabled) {
                const cloudData = {
                    account: data.account,
                    date: data.date,
                    pair: data.pair,
                    direction: data.direction,
                    entry: data.entry,
                    exit: data.exit,
                    sl: data.sl,
                    tp: data.tp,
                    lot: data.lot,
                    pnl: data.pnl,
                    strategy: data.strategy,
                    timeframe: data.timeframe,
                    confluence: data.confluence,
                    notes: data.notes,
                    screenshot: data.screenshot,
                    is_starred: data.isStarred
                };
                await this.client.from('tv_trades').update(cloudData).eq('id', id);
            }
        }
    }
    async toggleStar(id) {
        const list = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        const idx = list.findIndex(t => t.id === id);
        if (idx >= 0) {
            list[idx].isStarred = !list[idx].isStarred;
            localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(list));
            if (this.isCloudEnabled) await this.client.from('tv_trades').update({ is_starred: list[idx].isStarred }).eq('id', id);
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

    // === Settings ===
    _getSettingsKey() {
        const user = JSON.parse(localStorage.getItem('tv_current_user'));
        return user ? `tv_settings_${user.id}` : DB_KEYS.SETTINGS;
    }
    getSettings() { 
        const key = this._getSettingsKey();
        try {
            const data = localStorage.getItem(key);
            if (data && data !== 'undefined' && data !== 'null') return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing settings:", e);
        }
        return DEFAULT_SETTINGS; 
    }
    async saveSettings(s) { 
        const key = this._getSettingsKey();
        localStorage.setItem(key, JSON.stringify(s)); 
        
        const user = JSON.parse(localStorage.getItem('tv_current_user') || 'null');
        if (user && this.isCloudEnabled) {
            await this.client.from('tv_settings').upsert({ user_id: user.id, settings: s });
        }
    }
    getActiveAccount() { return this.getSettings().activeAccount; }
    async setActiveAccount(id) { 
        const s = this.getSettings(); 
        s.activeAccount = id; 
        await this.saveSettings(s); 
    }
    getAccounts() { return this.getSettings().accounts || []; }
    async addAccount(acc) {
        const s = this.getSettings();
        if (!s.accounts) s.accounts = [];
        s.accounts.push(acc);
        await this.saveSettings(s);
    }
    async removeAccount(id) {
        const s = this.getSettings();
        if (!s.accounts) return;
        s.accounts = s.accounts.filter(a => a.id !== id);
        if (s.activeAccount === id && s.accounts.length > 0) {
            s.activeAccount = s.accounts[0].id;
        }
        await this.saveSettings(s);
        
        if (this.isCloudEnabled) {
            await this.client.from('tv_trades').delete().eq('account', id);
        }
        const trades = JSON.parse(localStorage.getItem(DB_KEYS.TRADES)) || [];
        localStorage.setItem(DB_KEYS.TRADES, JSON.stringify(trades.filter(t => t.account !== id)));
    }

    async addWithdrawal(accountId, amount) {
        const s = this.getSettings();
        const acc = s.accounts.find(a => a.id === accountId);
        if (acc) {
            if (!acc.withdrawals) acc.withdrawals = [];
            acc.withdrawals.push({ date: new Date().toISOString(), amount: parseFloat(amount) });
            await this.saveSettings(s);
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
    async removeWithdrawal(accountId, index) {
        const s = this.getSettings();
        const acc = s.accounts.find(a => a.id === accountId);
        if (acc && acc.withdrawals) {
            acc.withdrawals.splice(index, 1);
            await this.saveSettings(s);
            return true;
        }
        return false;
    }

    // === Targets ===
    getTargets() { 
        try {
            const data = localStorage.getItem(DB_KEYS.TARGETS);
            if (data && data !== 'undefined' && data !== 'null') return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing targets:", e);
        }
        return DEFAULT_TARGETS; 
    }
    async saveTargets(t) { 
        localStorage.setItem(DB_KEYS.TARGETS, JSON.stringify(t)); 
        const user = JSON.parse(localStorage.getItem('tv_current_user') || 'null');
        if (user && this.isCloudEnabled) {
            await this.client.from('tv_targets').upsert({ user_id: user.id, targets: t });
        }
    }

    // === Statistics ===
    getStats(account, userId) {
        const trades = this.getAll(account, userId);
        if (!trades.length) return this._empty();
        const wins = trades.filter(t => t.pnl > 0), losses = trades.filter(t => t.pnl < 0), be = trades.filter(t => t.pnl === 0);
        const totalPnl = trades.reduce((s,t) => s + t.pnl, 0);
        const gp = wins.reduce((s,t) => s + t.pnl, 0), gl = Math.abs(losses.reduce((s,t) => s + t.pnl, 0));
        const avgW = wins.length ? gp/wins.length : 0, avgL = losses.length ? gl/losses.length : 0;
        
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
        if (!sorted.length) return [];
        let peak = 0, balance = this.getSettings().accounts.find(a=>a.id===this.getActiveAccount())?.balance||10000;
        return sorted.map(t => {
            balance += t.pnl; peak = Math.max(peak, balance);
            const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
            return { date: t.date, drawdown: dd };
        });
    }
    _weekly(t) { const m={};t.forEach(x=>{const d=new Date(x.date);d.setDate(d.getDate()-d.getDay());const w=d.toISOString().split('T')[0];m[w]=(m[w]||0)+x.pnl});return Object.entries(m).map(([w,p])=>({week:w,pnl:p})).sort((a,b)=>new Date(a.week)-new Date(b.week)); }
    _monthly(t) { const m={};t.forEach(x=>{const k=x.date.substring(0,7);m[k]=(m[k]||0)+x.pnl});return Object.entries(m).map(([month,pnl])=>({month,pnl})).sort((a,b)=>a.month.localeCompare(b.month)); }
    _dow(t) { const days=['Вск','Пнд','Втр','Срд','Чтв','Птн','Суб'],m={};days.forEach(d=>m[d]={day:d,pnl:0,count:0});t.forEach(x=>{const d=days[new Date(x.date).getDay()];m[d].pnl+=x.pnl;m[d].count++});return days.map(d=>m[d]); }
    _top(t) { return this._grp(t,'pair').slice(0,5); }
    _confluenceStats(trades) { const m={};for(let i=0;i<=5;i++)m[i]={score:i,trades:0,wins:0,pnl:0};trades.forEach(t=>{const s=t.confluence||0;m[s].trades++;m[s].pnl+=t.pnl;if(t.pnl>0)m[s].wins++});return Object.values(m); }

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

    async reset() {
        localStorage.clear();
        if (this.isCloudEnabled) {
            await this.client.from('tv_trades').delete().neq('id', 0);
            await this.client.from('tv_settings').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        }
        location.reload();
    }
}

const db = new TradeDatabase();
