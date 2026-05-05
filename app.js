// ===== TradeVault App v2 — Core =====
document.addEventListener('DOMContentLoaded',async ()=>{await initApp()});
async function initApp(){
    await db.init();
    setupNav();setupMobile();setDate();setupTheme();setupAccounts();
    loadDashboard();loadTradesList();loadStatsPage();loadCalendar();
    setupAddForm();setupFilters();setupReset();setupSearch();
    setupTargetsPage();setupModals();setupScreenshots();setupAccountsPage();setupAuth();initCustomSelects();
    setupAdminPage();setupWithdrawals();
    
    // Restore saved page
    const savedPage = localStorage.getItem('tv_active_page');
    if (savedPage) {
        switchPage(savedPage);
    } else {
        const user = JSON.parse(localStorage.getItem('tv_current_user') || '{}');
        if (user.role === 'admin') switchPage('admin');
        else switchPage('dashboard');
    }
}
// NAV
function setupNav(){
    document.querySelectorAll('.nav-item').forEach(i=>{i.addEventListener('click',e=>{e.preventDefault();switchPage(i.dataset.page)})});
    
    const logoutModal = document.getElementById('logoutModal');
    const confirmBtn = document.getElementById('btnLogoutConfirm');
    const cancelBtn = document.getElementById('btnLogoutCancel');

    // Event delegation for dynamically added logout button
    document.addEventListener('click', e => {
        const btn = e.target.closest('#btnLogout');
        if (btn) {
            logoutModal.classList.add('show');
        }
    });

    if (confirmBtn && logoutModal) {
        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('tv_current_user');
            location.reload();
        });

        cancelBtn.addEventListener('click', () => {
            logoutModal.classList.remove('show');
        });
    }
}
function switchPage(p){
    const userStr = localStorage.getItem('tv_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Role protection
    if (p === 'admin' && (!user || user.role !== 'admin')) {
        p = 'dashboard';
    }
    
    // If admin is logged in, they should probably stay on admin page unless we allow otherwise
    // But for now let's respect the requested page if it's not forbidden
    
    localStorage.setItem('tv_active_page', p);
    
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active'));
    
    const nav=document.querySelector(`[data-page="${p}"]`),page=document.getElementById(`page-${p}`);
    if(nav)nav.classList.add('active');
    if(page)page.classList.add('active');
    
    document.getElementById('sidebar').classList.remove('open');
    
    if(p==='dashboard')loadDashboard();
    if(p==='trades')loadTradesList();
    if(p==='stats')loadStatsPage();
    if(p==='calendar')loadCalendar();
    if(p==='gallery')loadGalleryGrid();
    if(p==='targets')loadTargetsForm();
    if(p==='accounts')loadAccountsList();
    if(p==='chart') loadChartPairs();
    if(p==='admin') loadUsersList();
}
function setupMobile(){document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));document.getElementById('mainContent').addEventListener('click',e=>{const sb=document.getElementById('sidebar');if(sb.classList.contains('open')&&!sb.contains(e.target))sb.classList.remove('open')})}
function setupSearch(){const inp=document.getElementById('searchInput');let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{switchPage('trades');loadTradesList(inp.value.trim())},300)})}
function setDate(){const n=new Date(),m=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];document.getElementById('currentDate').textContent=`${n.getDate()} ${m[n.getMonth()]}, ${n.getFullYear()}`}
function setupReset(){document.getElementById('resetDbBtn').addEventListener('click',()=>{showConfirm("Сброс базы", "Вы действительно хотите сбросить базу данных?", ()=>{db.reset();showToast("Восстановлено!","info");loadDashboard();loadTradesList();loadStatsPage();loadCalendar();loadGalleryGrid()})})}
// THEME
function setupTheme(){const s=db.getSettings();if(s.theme==='light')document.body.classList.add('light');document.getElementById('themeToggle').textContent=s.theme==='light'?'☀️':'🌙';document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('light');const set=db.getSettings();set.theme=document.body.classList.contains('light')?'light':'dark';db.saveSettings(set);document.getElementById('themeToggle').textContent=set.theme==='light'?'☀️':'🌙'})}
// ACCOUNTS
function setupAccounts(){const sel=document.getElementById('accountSelect');const accs=db.getAccounts();const active=db.getActiveAccount();sel.innerHTML=accs.map(a=>`<option value="${a.id}" ${a.id===active?'selected':''}>${a.name} ($${a.balance.toLocaleString()})</option>`).join('');if(typeof updateCustomSelect==='function')updateCustomSelect(sel);sel.addEventListener('change',async ()=>{await db.setActiveAccount(sel.value);loadDashboard();loadTradesList();loadStatsPage();loadCalendar()})}
// DASHBOARD
function loadDashboard(){const acc=db.getActiveAccount();const s=db.getStats(acc);const prog=db.getWeekProgress();
document.getElementById('badgeTrades').textContent=s.totalTrades;
document.getElementById('totalPnl').textContent=(s.totalPnl>=0?'+':'-')+'$'+Math.abs(s.totalPnl).toFixed(0);
document.getElementById('totalTrades').textContent=s.totalTrades;
document.getElementById('winRate').textContent=s.winRate.toFixed(1)+'%';
document.getElementById('profitFactor').textContent=s.profitFactor>=999?'∞':s.profitFactor.toFixed(2);
const pt=document.getElementById('pnlTrend');pt.className='stat-trend '+(s.totalPnl>=0?'up':'down');pt.querySelector('span').textContent=(s.totalPnl>=0?'+':'')+'$'+Math.abs(s.totalPnl).toFixed(0);
const wt=document.getElementById('wrTrend');wt.className='stat-trend '+(s.winRate>=50?'up':'down');wt.querySelector('span').textContent=s.wins+'W/'+s.losses+'L';
// Streak
const str=s.currentStreak;const sc=document.getElementById('streakCount'),sl=document.getElementById('streakLabel');
sc.textContent=str.count;sc.style.color=str.type==='win'?'var(--green)':str.type==='loss'?'var(--red)':'var(--text-muted)';
sl.textContent=str.type==='win'?'Серия WIN 🔥':str.type==='loss'?'Серия LOSS ⚠️':'Текущий страйк';

// Live Balance
const activeId = db.getActiveAccount();
const account = db.getSettings().accounts.find(a => a.id === activeId);
const initialBalance = account ? account.balance : 0;
const totalWithdrawn = db.getTotalWithdrawals(activeId);
const currentBalance = initialBalance + s.totalPnl - totalWithdrawn;

document.getElementById('liveBalance').textContent = '$' + currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
document.getElementById('totalWithdrawals').textContent = '$' + totalWithdrawn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
// Targets
const tg=document.getElementById('targetsProgress');
tg.innerHTML=`
<div class="target-card"><div class="target-header"><span class="target-title">Недельный P&L</span><span class="target-val ${prog.pnl.current>=0?'pnl-positive':'pnl-negative'}">${prog.pnl.current>=0?'+':''}$${prog.pnl.current.toFixed(0)} / $${prog.pnl.target}</span></div><div class="progress-bar"><div class="progress-fill ${prog.pnl.pct>=100?'green':'purple'}" style="width:${Math.max(0,prog.pnl.pct)}%"></div></div></div>
<div class="target-card"><div class="target-header"><span class="target-title">Сделки за неделю</span><span class="target-val">${prog.trades.current} / ${prog.trades.target}</span></div><div class="progress-bar"><div class="progress-fill purple" style="width:${prog.trades.pct}%"></div></div></div>
<div class="target-card"><div class="target-header"><span class="target-title">Win Rate</span><span class="target-val" style="color:${prog.winRate.current>=prog.winRate.target?'var(--green)':'var(--orange)'}">${prog.winRate.current.toFixed(0)}% / ${prog.winRate.target}%</span></div><div class="progress-bar"><div class="progress-fill ${prog.winRate.current>=prog.winRate.target?'green':'orange'}" style="width:${Math.min(100,(prog.winRate.current/prog.winRate.target)*100)}%"></div></div></div>
<div class="target-card"><div class="target-header"><span class="target-title">Макс. дневной убыток</span><span class="target-val" style="color:${prog.dailyLoss.current>prog.dailyLoss.max?'var(--red)':'var(--green)'}">$${prog.dailyLoss.current.toFixed(0)} / $${prog.dailyLoss.max}</span></div><div class="progress-bar"><div class="progress-fill ${prog.dailyLoss.current>prog.dailyLoss.max?'red':'green'}" style="width:${Math.min(100,(prog.dailyLoss.current/prog.dailyLoss.max)*100)}%"></div></div></div>`;
renderEquityChart(s.equityCurve);renderWinLossChart(s.wins,s.losses,s.breakeven);renderWeeklyChart(s.weeklyPnl);renderTopPairs(s.topPairs);renderRecentTable(acc)}
// WITHDRAWALS
function setupWithdrawals() {
    const modal = document.getElementById('withdrawModal');
    const openBtn = document.getElementById('btnOpenWithdraw');
    const closeBtn = document.getElementById('withdrawModalClose');
    const saveBtn = document.getElementById('btnSaveWithdraw');
    const amountInp = document.getElementById('withdrawAmount');

    if (!modal || !openBtn) return;

    const renderWithdrawalHistory = () => {
        const activeId = db.getActiveAccount();
        const history = db.getWithdrawals(activeId);
        const body = document.getElementById('withdrawHistoryBody');
        if (!body) return;

        body.innerHTML = history.length > 0 ? history.map((w, i) => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 8px 0; color: var(--text-muted);">${new Date(w.date).toLocaleDateString()}</td>
                <td style="padding: 8px 0; font-weight: 600; color: var(--orange);">$${w.amount.toLocaleString()}</td>
                <td style="padding: 8px 0; text-align: right;">
                    <button class="btn-delete-withdraw" data-index="${i}" style="background:none; border:none; color:var(--red); cursor:pointer; font-size:1rem;">✕</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-muted);">История пуста</td></tr>';

        body.querySelectorAll('.btn-delete-withdraw').forEach(btn => {
            btn.addEventListener('click', async () => {
                const index = parseInt(btn.dataset.index);
                if (await db.removeWithdrawal(activeId, index)) {
                    renderWithdrawalHistory();
                    loadDashboard();
                    showToast("Запись удалена", "info");
                }
            });
        });
    };

    openBtn.addEventListener('click', () => {
        renderWithdrawalHistory();
        modal.classList.add('show');
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

    saveBtn.addEventListener('click', async () => {
        const val = amountInp.value.replace(/[^0-9.]/g, '');
        const amount = parseFloat(val);
        if (isNaN(amount) || amount <= 0) {
            showToast("Введите корректную сумму", "error");
            return;
        }

        const activeId = db.getActiveAccount();
        if (await db.addWithdrawal(activeId, amount)) {
            showToast("Вывод зафиксирован!", "success");
            amountInp.value = '';
            renderWithdrawalHistory();
            loadDashboard();
        }
    });
}
// CHARTS
let eqC,wlC,wkC,strC,prC,dowC,ddC,cfC,tfC;
function renderEquityChart(curve){const ctx=document.getElementById('equityChart');if(eqC)eqC.destroy();const g=ctx.getContext('2d').createLinearGradient(0,0,0,260);g.addColorStop(0,'rgba(34,197,94,0.25)');g.addColorStop(1,'rgba(34,197,94,0)');eqC=new Chart(ctx,{type:'line',data:{labels:curve.map(c=>{const d=new Date(c.date);return(d.getMonth()+1)+'/'+d.getDate()}),datasets:[{data:curve.map(c=>c.balance),borderColor:'#22c55e',backgroundColor:g,borderWidth:2.5,fill:true,tension:.3,pointRadius:3,pointHoverRadius:6,pointBackgroundColor:'#22c55e',pointBorderColor:'#0b0e17',pointBorderWidth:2}]},options:chartOpts('$',true)})}
function renderWinLossChart(w,l,b){const ctx=document.getElementById('winLossChart');if(wlC)wlC.destroy();wlC=new Chart(ctx,{type:'doughnut',data:{labels:['Win','Loss','BE'],datasets:[{data:[w,l,b],backgroundColor:['#22c55e','#ef4444','#fbbf24'],borderColor:'#1a1f35',borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'#8892a8',font:{size:11},padding:10,usePointStyle:true}},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12}}}})}
function renderWeeklyChart(weekly){const ctx=document.getElementById('weeklyChart');if(wkC)wkC.destroy();wkC=new Chart(ctx,{type:'bar',data:{labels:weekly.map(w=>{const d=new Date(w.week);return(d.getMonth()+1)+'/'+d.getDate()}),datasets:[{data:weekly.map(w=>w.pnl),backgroundColor:weekly.map(w=>w.pnl>=0?'rgba(34,197,94,.7)':'rgba(239,68,68,.7)'),borderRadius:6,borderSkipped:false}]},options:chartOpts('$')})}
function chartOpts(prefix,isLine){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12,callbacks:{label:c=>'  '+(prefix||'')+c.parsed[isLine?'y':'y']}}},scales:{x:{grid:{display:!isLine,color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',font:{size:11},callback:v=>prefix+v}}}}}
function renderTopPairs(pairs){document.getElementById('topPairsList').innerHTML=pairs.map((p,i)=>`<div class="top-item"><div class="top-rank ${i<3?'r'+(i+1):''}">${i+1}</div><div class="top-item-info"><div class="top-item-title">${p.pair}</div><div class="top-item-sub">${p.count} сделок</div></div><div class="top-item-val ${p.pnl>=0?'positive':'negative'}">${p.pnl>=0?'+':''}$${p.pnl.toFixed(0)}</div></div>`).join('')}
function confDots(n){let h='<div class="confluence-dots">';for(let i=1;i<=5;i++)h+=`<div class="confluence-dot ${i<=n?'active':''}"></div>`;return h+'</div>'}
function renderRecentTable(acc){const trades=db.getAll(acc).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);document.getElementById('recentBody').innerHTML=trades.map(t=>{const r=t.pnl>0?'win':t.pnl<0?'loss':'breakeven';const sBtn=`<button onclick="event.stopPropagation();toggleStar(${t.id})" style="color:${t.isStarred?'#fbbf24':'#4b5574'};background:transparent;border:none;cursor:pointer;font-size:1.1rem;padding:0 4px">${t.isStarred?'★':'☆'}</button>`;return`<tr onclick="openTradeModal(${t.id})" style="cursor:pointer"><td>${t.date}</td><td style="font-weight:600;color:var(--text-primary)">${t.pair}</td><td><span class="dir-${t.direction.toLowerCase()}">${t.direction}</span></td><td style="font-family:'JetBrains Mono';font-size:.82rem">${t.entry}</td><td style="font-family:'JetBrains Mono';font-size:.82rem">${t.exit}</td><td>${t.lot}</td><td><span class="pnl-${t.pnl>=0?'positive':'negative'}">${t.pnl>=0?'+':''}$${t.pnl.toFixed(2)}</span></td><td>${confDots(t.confluence||0)}</td><td style="font-size:.78rem;color:var(--purple-light)">${t.strategy}</td><td><span class="status-badge status-${r}">${r==='win'?'WIN':r==='loss'?'LOSS':'BE'}</span></td><td>${sBtn}</td></tr>`}).join('')}
// TRADES LIST
function loadTradesList(query){const acc=db.getActiveAccount();const trades=query?db.search(query):db.getAll(acc);const sorted=[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date));document.getElementById('tradesBody').innerHTML=sorted.length?sorted.map(t=>fullTradeRow(t)).join(''):'<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted)">Сделка не найдена</td></tr>';populateFilters()}
function fullTradeRow(t){const r=t.pnl>0?'win':t.pnl<0?'loss':'breakeven';const sBtn=`<button onclick="event.stopPropagation();toggleStar(${t.id})" style="color:${t.isStarred?'#fbbf24':'#4b5574'};background:transparent;border:none;cursor:pointer;font-size:1.1rem;padding:0 4px">${t.isStarred?'★':'☆'}</button>`;return`<tr onclick="openTradeModal(${t.id})" style="cursor:pointer"><td>${t.date}</td><td style="font-weight:600;color:var(--text-primary)">${t.pair}</td><td><span class="dir-${t.direction.toLowerCase()}">${t.direction}</span></td><td style="font-family:'JetBrains Mono';font-size:.82rem">${t.entry}</td><td style="font-family:'JetBrains Mono';font-size:.82rem">${t.exit}</td><td>${t.lot}</td><td><span class="pnl-${t.pnl>=0?'positive':'negative'}">${t.pnl>=0?'+':''}$${t.pnl.toFixed(2)}</span></td><td style="font-size:.78rem">${t.timeframe||'-'}</td><td>${confDots(t.confluence||0)}</td><td style="font-size:.78rem;color:var(--purple-light)">${t.strategy}</td><td><span class="status-badge status-${r}">${r==='win'?'WIN':r==='loss'?'LOSS':'BE'}</span></td><td>${sBtn}</td><td><button class="btn-delete-sm" onclick="event.stopPropagation();deleteTrade(${t.id})">✕</button></td></tr>`}
function populateFilters(){const trades=db.getAll();const ps=[...new Set(trades.map(t=>t.pair))].sort(),ss=[...new Set(trades.map(t=>t.strategy))].sort();const pS=document.getElementById('filterPair'),sS=document.getElementById('filterStrategy');const cp=pS.value,cs=sS.value;pS.innerHTML='<option value="">Все пары</option>'+ps.map(p=>`<option value="${p}" ${p===cp?'selected':''}>${p}</option>`).join('');sS.innerHTML='<option value="">Все стратегии</option>'+ss.map(s=>`<option value="${s}" ${s===cs?'selected':''}>${s}</option>`).join('');if(typeof updateCustomSelect==='function'){updateCustomSelect(pS);updateCustomSelect(sS);}}
function setupFilters(){document.getElementById('filterBtn').addEventListener('click',()=>{const f=db.filter({account:db.getActiveAccount(),pair:document.getElementById('filterPair').value,result:document.getElementById('filterResult').value,strategy:document.getElementById('filterStrategy').value,timeframe:document.getElementById('filterTimeframe').value});const sorted=[...f].sort((a,b)=>new Date(b.date)-new Date(a.date));document.getElementById('tradesBody').innerHTML=sorted.length?sorted.map(t=>fullTradeRow(t)).join(''):'<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted)">Не найдено</td></tr>'})}
window.deleteTrade=function(id){const t=db.getById(id);if(t)showConfirm("Удаление сделки", `"${t.pair} ${t.direction}" удалить?`, async ()=>{await db.remove(id);location.reload()})}
window.toggleStar=function(id){
    const t=db.getById(id);
    if(t){
        db.toggleStar(id).then(() => {
            if(!t.screenshot && !t.isStarred) {
                showToast("Без скриншота не будет отображаться в галерее!", "warning");
            } else {
                showToast(t.isStarred ? "Звезда удалена" : "Добавлено в галерею! ⭐️", "success");
            }
            loadTradesList();loadDashboard();if(document.getElementById('page-gallery').classList.contains('active'))loadGalleryGrid();
        });
    }
}
