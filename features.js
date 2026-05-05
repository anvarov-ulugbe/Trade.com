// ===== TradeVault Features =====
// ADD FORM
function setupAddForm(){
    populateFormOptions();
    document.getElementById('tradeDate').valueAsDate=new Date();
    document.getElementById('addTradeForm').addEventListener('submit',async e=>{
        e.preventDefault();
        const editingId = document.getElementById('editingTradeId').value;
        const t={date:document.getElementById('tradeDate').value,pair:document.getElementById('tradePair').value,direction:document.getElementById('tradeDirection').value,strategy:document.getElementById('tradeStrategy').value,timeframe:document.getElementById('tradeTimeframe').value,confluence:parseInt(document.getElementById('tradeConfluence').value)||3,entry:parseFloat(document.getElementById('tradeEntry').value),exit:parseFloat(document.getElementById('tradeExit').value),sl:parseFloat(document.getElementById('tradeSL').value)||null,tp:parseFloat(document.getElementById('tradeTP').value)||null,lot:parseFloat(document.getElementById('tradeLot').value),pnl:parseFloat(document.getElementById('tradePnl').value),notes:document.getElementById('tradeNotes').value.trim(),account:db.getActiveAccount(),screenshot:document.getElementById('screenshotPreview').src||'',isStarred:false};
        if(!t.pair||!t.date||isNaN(t.entry)){showToast("Заполните поля!",'error');return}
        if(!document.getElementById('screenshotPreview').style.display||document.getElementById('screenshotPreview').style.display==='none')t.screenshot='';
        
        if(editingId) {
            await db.update(parseInt(editingId), t);
            document.getElementById('editingTradeId').value = '';
        } else {
            await db.add(t);
        }
        
        document.getElementById('addTradeForm').reset();
        location.reload(); 
    });

    document.getElementById('addTradeForm').addEventListener('reset', () => {
        document.getElementById('editingTradeId').value = '';
        document.getElementById('screenshotPreview').style.display = 'none';
        document.querySelector('#page-add .page-header h1').textContent = "Записать новую сделку";
    });
}
window.populateFormOptions = function() {
    const s = db.getSettings();
    const pS = document.getElementById('tradePair'), sS = document.getElementById('tradeStrategy');
    if(pS) pS.innerHTML = (s.pairs||[]).map(p=>`<option value="${p}">${p}</option>`).join('');
    if(sS) sS.innerHTML = (s.strategies||[]).map(st=>`<option value="${st}">${st}</option>`).join('');
    if(typeof updateCustomSelect==='function' && pS){updateCustomSelect(pS); if(sS) updateCustomSelect(sS);}
}
window.loadChartPairs = function() {
    const s = db.getSettings();
    const container = document.getElementById('chartPairsQuick');
    if(!container) return;
    container.innerHTML = (s.pairs||[]).map(p => `
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; height: auto;" 
                onclick="window.initTVWidget('${p}')">${p}</button>
    `).join('');
}
// SCREENSHOTS
function setupScreenshots(){setupFileUpload('screenshotInput','screenshotPreview');setupFileUpload('galleryScreenshot','galleryPreview')}
function setupFileUpload(inputId,previewId){const inp=document.getElementById(inputId),prev=document.getElementById(previewId);if(!inp||!prev)return;inp.addEventListener('change',e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{prev.src=ev.target.result;prev.style.display='block'};r.readAsDataURL(f)}})}
// STATS PAGE
function loadStatsPage(){const s=db.getStats(db.getActiveAccount());const g=document.getElementById('statsDetailGrid');const items=[
{v:(s.totalPnl>=0?'+':'-')+'$'+Math.abs(s.totalPnl).toFixed(2),l:'Общий P&L',c:s.totalPnl>=0?'var(--green)':'var(--red)'},
{v:s.totalTrades,l:'Всего сделок',c:'var(--purple-light)'},
{v:s.winRate.toFixed(1)+'%',l:'Win Rate',c:s.winRate>=50?'var(--green)':'var(--red)'},
{v:s.profitFactor>=999?'∞':s.profitFactor.toFixed(2),l:'Profit Factor',c:s.profitFactor>=1.5?'var(--green)':'var(--orange)'},
{v:'+$'+s.avgWin.toFixed(0),l:'Средний Win',c:'var(--green)'},
{v:'-$'+s.avgLoss.toFixed(0),l:'Средний Loss',c:'var(--red)'},
{v:'+$'+s.bestTrade.toFixed(0),l:'Лучшая',c:'var(--green)'},
{v:(s.worstTrade>=0?'+':'-')+'$'+Math.abs(s.worstTrade).toFixed(0),l:'Худшая',c:'var(--red)'},
{v:s.avgRR.toFixed(2)+'R',l:'Средний RR',c:'var(--blue)'},
{v:s.maxConsecWins,l:'Max Win streak',c:'var(--green)'},
{v:s.maxConsecLosses,l:'Max Loss streak',c:'var(--red)'},
{v:s.wins+'/'+s.losses,l:'Win/Loss',c:'var(--purple-light)'}];
g.innerHTML=items.map(i=>`<div class="detail-stat"><div class="detail-stat-val" style="color:${i.c}">${i.v}</div><div class="detail-stat-label">${i.l}</div></div>`).join('');
renderDrawdownChart(s.drawdownCurve);renderConfluenceChart(s.confluenceStats);renderStrategyChart(s.strategyStats);renderTimeframeChart(s.timeframeStats);renderPairChart(s.pairStats);renderDayOfWeekChart(s.dayOfWeekPnl);renderHeatmap(s.monthlyPnl)}
function hBarChart(ctx,chartRef,data,colorFn){if(chartRef)chartRef.destroy();return new Chart(ctx,{type:'bar',data:{labels:data.map(d=>d.name),datasets:[{data:data.map(d=>d.pnl),backgroundColor:data.map(d=>colorFn?colorFn(d):(d.pnl>=0?'rgba(34,197,94,.7)':'rgba(239,68,68,.7)')),borderRadius:6,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12,callbacks:{label:c=>'  P&L: $'+c.parsed.x.toFixed(0)+' ('+data[c.dataIndex].trades+' сделок, WR: '+(data[c.dataIndex].trades?(data[c.dataIndex].wins/data[c.dataIndex].trades*100).toFixed(0):0)+'%)'}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',callback:v=>'$'+v}},y:{grid:{display:false},ticks:{color:'#8892a8',font:{size:11}}}}}})}
function renderStrategyChart(d){strC=hBarChart(document.getElementById('strategyChart'),strC,d)}
function renderPairChart(d){prC=hBarChart(document.getElementById('pairChart'),prC,d)}
function renderTimeframeChart(d){tfC=hBarChart(document.getElementById('timeframeChart'),tfC,d,d2=>d2.pnl>=0?'rgba(99,102,241,.7)':'rgba(239,68,68,.7)')}
function renderDayOfWeekChart(data){const ctx=document.getElementById('dayOfWeekChart');if(dowC)dowC.destroy();dowC=new Chart(ctx,{type:'bar',data:{labels:data.map(d=>d.day),datasets:[{data:data.map(d=>d.pnl),backgroundColor:data.map(d=>d.pnl>=0?'rgba(34,197,94,.7)':'rgba(239,68,68,.7)'),borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12,callbacks:{label:c=>'  $'+c.parsed.y.toFixed(0)+' ('+data[c.dataIndex].count+' сделок)'}}},scales:{x:{grid:{display:false},ticks:{color:'#8892a8'}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',callback:v=>'$'+v}}}}})}
function renderDrawdownChart(curve){const ctx=document.getElementById('drawdownChart');if(ddC)ddC.destroy();const g=ctx.getContext('2d').createLinearGradient(0,0,0,260);g.addColorStop(0,'rgba(239,68,68,.3)');g.addColorStop(1,'rgba(239,68,68,0)');ddC=new Chart(ctx,{type:'line',data:{labels:curve.map(c=>{const d=new Date(c.date);return(d.getMonth()+1)+'/'+d.getDate()}),datasets:[{data:curve.map(c=>-c.drawdown),borderColor:'#ef4444',backgroundColor:g,borderWidth:2,fill:true,tension:.3,pointRadius:2,pointHoverRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12,callbacks:{label:c=>'  Drawdown: '+Math.abs(c.parsed.y).toFixed(2)+'%'}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',maxTicksLimit:8}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',callback:v=>Math.abs(v).toFixed(1)+'%'}}}}})}
function renderConfluenceChart(data){const ctx=document.getElementById('confluenceChart');if(cfC)cfC.destroy();const wr=data.map(d=>d.trades?(d.wins/d.trades*100):0);cfC=new Chart(ctx,{type:'bar',data:{labels:data.map(d=>d.score+' Conf.'),datasets:[{label:'Win Rate %',data:wr,backgroundColor:wr.map(w=>w>=60?'rgba(34,197,94,.7)':w>=40?'rgba(251,191,36,.7)':'rgba(239,68,68,.7)'),borderRadius:6,borderSkipped:false},{label:'Сделки',data:data.map(d=>d.trades),type:'line',borderColor:'#a855f7',borderWidth:2,tension:.3,pointRadius:4,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1a1f35',cornerRadius:10,padding:12}},scales:{x:{grid:{display:false},ticks:{color:'#8892a8'}},y:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#4b5574',callback:v=>v+'%'},max:100},y1:{position:'right',grid:{display:false},ticks:{color:'#a855f7'}}}}})}
// HEATMAP
function renderHeatmap(monthly){const grid=document.getElementById('heatmapGrid');const months=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];const map={};monthly.forEach(m=>map[m.month]=m.pnl);const year=new Date().getFullYear();grid.innerHTML=months.map((m,i)=>{const key=year+'-'+String(i+1).padStart(2,'0');const pnl=map[key]||0;const bg=pnl>200?'rgba(34,197,94,.3)':pnl>0?'rgba(34,197,94,.15)':pnl===0?'rgba(255,255,255,.03)':pnl>-200?'rgba(239,68,68,.15)':'rgba(239,68,68,.3)';const tc=pnl>0?'var(--green)':pnl<0?'var(--red)':'var(--text-muted)';return`<div class="heatmap-cell" style="background:${bg}"><div class="heatmap-month">${m}</div><div class="heatmap-val" style="color:${tc}">${pnl?((pnl>0?'+':'')+'$'+pnl.toFixed(0)):'-'}</div></div>`}).join('')}
// CALENDAR
let calY,calM;
function loadCalendar(){const n=new Date();if(!calY){calY=n.getFullYear();calM=n.getMonth()}renderCalendar();document.getElementById('calPrev').onclick=()=>{calM--;if(calM<0){calM=11;calY--}renderCalendar()};document.getElementById('calNext').onclick=()=>{calM++;if(calM>11){calM=0;calY++}renderCalendar()}}
function renderCalendar(){const ms=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];document.getElementById('calTitle').textContent=`${ms[calM]} ${calY}`;const g=document.getElementById('calendarGrid');const fd=new Date(calY,calM,1).getDay(),dim=new Date(calY,calM+1,0).getDate(),today=new Date();const trades=db.getAll(db.getActiveAccount());const dm={};trades.forEach(t=>{const d=new Date(t.date);if(d.getFullYear()===calY&&d.getMonth()===calM){const day=d.getDate();if(!dm[day])dm[day]={pnl:0,count:0};dm[day].pnl+=t.pnl;dm[day].count++}});const days=['Вск','Пнд','Втр','Срд','Чтв','Птн','Суб'];let h=days.map(d=>`<div class="cal-header">${d}</div>`).join('');for(let i=0;i<fd;i++)h+='<div class="cal-day empty"></div>';for(let d=1;d<=dim;d++){const isT=d===today.getDate()&&calM===today.getMonth()&&calY===today.getFullYear();const info=dm[d];h+=`<div class="cal-day ${isT?'today':''}"><div class="cal-day-num">${d}</div>${info?`<div class="cal-day-pnl ${info.pnl>=0?'positive':'negative'}">${info.pnl>=0?'+':''}$${info.pnl.toFixed(0)}</div><div class="cal-day-count">${info.count} сделок</div>`:''}</div>`}g.innerHTML=h}
// GALLERY
function loadGalleryGrid(){
    const list=db.getStarredTrades().sort((a,b)=>new Date(b.date)-new Date(a.date));
    const g=document.getElementById('galleryGrid');
    g.innerHTML=list.length?list.map(item=>`<div class="gallery-card"><div class="gallery-img" onclick="zoomImage('${item.screenshot}')"><img src="${item.screenshot}" alt="${item.pair} ${item.strategy}"></div><div class="gallery-body"><div class="gallery-title">${item.pair} ${item.direction} — ${item.strategy}</div><div class="gallery-meta"><span class="gallery-tag" style="background:rgba(168,85,247,.13);color:var(--purple-light)">${item.pair}</span><span class="gallery-tag" style="background:rgba(99,102,241,.13);color:var(--indigo)">${item.timeframe||'-'}</span><span class="gallery-tag" style="background:rgba(34,197,94,.13);color:var(--green)">${item.confluence||0}/5 Conf</span></div><div class="gallery-notes">${item.notes||'Нет комментариев'}</div><div class="gallery-footer"><span class="gallery-pnl" style="color:${item.pnl>=0?'var(--green)':'var(--red)'}">${item.pnl>=0?'+':''}$${item.pnl.toFixed(0)}</span><button class="btn-delete-sm" onclick="toggleStar(${item.id})">⭐️ Удалить</button></div></div></div>`).join(''):'<div style="text-align:center;padding:60px;color:var(--text-muted);grid-column:1/-1"><p style="font-size:2rem;margin-bottom:8px">📸</p><p>Пока нет сохраненных сделок со скриншотами.</p></div>';
}
// TARGETS
function setupTargetsPage(){document.getElementById('saveTargetsBtn').addEventListener('click',async ()=>{const t={weeklyPnl:parseFloat(document.getElementById('targetWeeklyPnl').value)||500,monthlyPnl:parseFloat(document.getElementById('targetMonthlyPnl').value)||2000,weeklyTrades:parseInt(document.getElementById('targetWeeklyTrades').value)||10,minWinRate:parseFloat(document.getElementById('targetMinWR').value)||55,maxDailyLoss:parseFloat(document.getElementById('targetMaxLoss').value)||200};await db.saveTargets(t);showToast("Цели сохранены!",'success');loadDashboard()})}
function loadTargetsForm(){const t=db.getTargets();document.getElementById('targetWeeklyPnl').value=t.weeklyPnl;document.getElementById('targetMonthlyPnl').value=t.monthlyPnl;document.getElementById('targetWeeklyTrades').value=t.weeklyTrades;document.getElementById('targetMinWR').value=t.minWinRate;document.getElementById('targetMaxLoss').value=t.maxDailyLoss}
// MODALS
function setupModals(){
    document.getElementById('modalClose').addEventListener('click',()=>document.getElementById('tradeModal').classList.remove('show'));
    document.getElementById('imageModalClose').addEventListener('click',()=>document.getElementById('imageModal').classList.remove('show'));
    document.getElementById('userModalClose').addEventListener('click',()=>document.getElementById('userModal').classList.remove('show'));
    document.querySelectorAll('.modal-overlay').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')})});
}
window.zoomImage = function(src) {
    const m = document.getElementById('imageModal');
    const img = document.getElementById('zoomedImage');
    img.src = src;
    m.classList.add('show');
}
window.editTrade = function(id) {
    const t = db.getById(id);
    if(!t) return;
    
    document.getElementById('tradeModal').classList.remove('show');
    switchPage('add');
    
    document.querySelector('#page-add .page-header h1').textContent = "Изменить сделку";
    document.getElementById('editingTradeId').value = t.id;
    
    document.getElementById('tradeDate').value = t.date;
    document.getElementById('tradePair').value = t.pair;
    document.getElementById('tradeDirection').value = t.direction;
    
    document.getElementById('tradeStrategy').value = t.strategy;
    document.getElementById('tradeTimeframe').value = t.timeframe || '1H';
    document.getElementById('tradeConfluence').value = t.confluence || 3;
    document.getElementById('tradeEntry').value = t.entry;
    document.getElementById('tradeExit').value = t.exit;
    document.getElementById('tradeSL').value = t.sl || '';
    document.getElementById('tradeTP').value = t.tp || '';
    document.getElementById('tradeLot').value = t.lot;
    document.getElementById('tradePnl').value = t.pnl;
    document.getElementById('tradeNotes').value = t.notes || '';
    
    if(t.screenshot) {
        const prev = document.getElementById('screenshotPreview');
        prev.src = t.screenshot;
        prev.style.display = 'block';
    } else {
        document.getElementById('screenshotPreview').style.display = 'none';
    }
    
    // Update custom selects
    populateFormOptions();
    document.querySelectorAll('#page-add select').forEach(s => updateCustomSelect(s));
}
window.openTradeModal=function(id){const t=db.getById(id);if(!t)return;document.getElementById('modalTitle').textContent=`${t.pair} ${t.direction} — ${t.date}`;let h='';if(t.screenshot)h+=`<img class="modal-img" src="${t.screenshot}" alt="Screenshot" onclick="zoomImage('${t.screenshot}')" style="cursor:zoom-in">`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Пара</span><span class="modal-detail-val">${t.pair}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Направление</span><span class="modal-detail-val dir-${t.direction.toLowerCase()}">${t.direction}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Вход / Выход</span><span class="modal-detail-val" style="font-family:'JetBrains Mono'">${t.entry} → ${t.exit}</span></div>`;if(t.sl)h+=`<div class="modal-detail-row"><span class="modal-detail-label">SL / TP</span><span class="modal-detail-val" style="font-family:'JetBrains Mono'">${t.sl} / ${t.tp||'-'}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Лот</span><span class="modal-detail-val">${t.lot}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">P&L</span><span class="modal-detail-val pnl-${t.pnl>=0?'positive':'negative'}">${t.pnl>=0?'+':''}$${t.pnl.toFixed(2)}</span></div>`;
h+=`<div class="modal-detail-row"><span class="modal-detail-label">Стратегия</span><span class="modal-detail-val" style="color:var(--purple-light)">${t.strategy}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Таймфрейм</span><span class="modal-detail-val">${t.timeframe||'-'}</span></div>`;h+=`<div class="modal-detail-row"><span class="modal-detail-label">Confluence</span><span class="modal-detail-val">${confDots(t.confluence||0)}</span></div>`;if(t.notes)h+=`<div style="margin-top:14px;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-sm);font-size:.85rem;color:var(--text-secondary)"><strong style="color:var(--text-primary)">Комментарии:</strong><br>${t.notes}</div>`;h+=`<div style="margin-top:20px; display:flex; gap:12px;"><button class="btn-primary" onclick="editTrade(${t.id})" style="flex:1; justify-content:center;">✏️ Изменить</button></div>`;document.getElementById('modalBody').innerHTML=h;document.getElementById('tradeModal').classList.add('show')};
// ACCOUNTS MANAGEMENT
function setupAccountsPage(){
    document.getElementById('addAccountBtn').addEventListener('click',()=>{
        const nameInp = document.getElementById('newAccountName');
        const balInp = document.getElementById('newAccountBalance');
        const name = nameInp.value.trim();
        const balance = parseMoney(balInp.value);
        
        if(name && balance > 0){
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
            db.addAccount({ id, name, balance, currency: 'USD' });
            nameInp.value = '';
            balInp.value = '';
            loadAccountsList();
            setupAccounts();
            showToast("Счет добавлен", 'success');
        } else {
            showToast("Введите правильное название и баланс", 'error');
        }
    });

    document.getElementById('addPairBtn').addEventListener('click', () => {
        const inp = document.getElementById('newPairInput');
        const val = inp.value.trim().toUpperCase();
        if(val) {
            const s = db.getSettings();
            if(!s.pairs) s.pairs = [];
            if(!s.pairs.includes(val)) {
                s.pairs.push(val);
                db.saveSettings(s);
                inp.value = '';
                loadAccountsList();
                populateFormOptions();
                if(typeof populateFilters==='function') populateFilters();
                showToast("Пара добавлена", 'success');
            } else {
                showToast("Эта пара уже существует", 'error');
            }
        }
    });

    document.getElementById('addStrategyBtn').addEventListener('click', () => {
        const inp = document.getElementById('newStrategyInput');
        const val = inp.value.trim();
        if(val) {
            const s = db.getSettings();
            if(!s.strategies) s.strategies = [];
            if(!s.strategies.includes(val)) {
                s.strategies.push(val);
                db.saveSettings(s);
                inp.value = '';
                loadAccountsList();
                populateFormOptions();
                if(typeof populateFilters==='function') populateFilters();
                showToast("Стратегия добавлена", 'success');
            } else {
                showToast("Эта стратегия уже существует", 'error');
            }
        }
    });
}

function loadAccountsList(){
    const s = db.getSettings();
    const accs = s.accounts || [];
    const active = s.activeAccount;
    const list = document.getElementById('accountsList');
    list.innerHTML = accs.map(a => `
        <div class="rule-item">
            <span class="rule-text" style="font-weight:600">${a.name} <span style="color:var(--text-muted);font-weight:normal;margin-left:8px">$${a.balance.toLocaleString()}</span> ${a.id === active ? '<span class="status-badge status-win" style="margin-left:8px">Активен</span>' : ''}</span>
            <button class="rule-delete" onclick="deleteAccount('${a.id}')" ${accs.length <= 1 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>✕</button>
        </div>
    `).join('');

    const pairsList = document.getElementById('pairsList');
    pairsList.innerHTML = (s.pairs||[]).map(p => `
        <div class="rule-item">
            <span class="rule-text" style="font-weight:600">${p}</span>
            <button class="rule-delete" onclick="deletePair('${p}')">✕</button>
        </div>
    `).join('');

    const strList = document.getElementById('strategiesList');
    strList.innerHTML = (s.strategies||[]).map(st => `
        <div class="rule-item">
            <span class="rule-text" style="font-weight:600">${st}</span>
            <button class="rule-delete" onclick="deleteStrategy('${st}')">✕</button>
        </div>
    `).join('');
}

window.deleteAccount = function(id) {
    if (db.getAccounts().length <= 1) {
        showToast("Должен остаться хотя бы один счет!", "error");
        return;
    }
    showConfirm("Удаление счета", "Вы действительно хотите удалить этот счет и все его сделки?", async () => {
        await db.removeAccount(id);
        loadAccountsList();
        setupAccounts();
        loadDashboard();
        loadTradesList();
        showToast("Счет удален", "info");
    });
};

window.deletePair = function(p) {
    showConfirm("Удаление пары", `"${p}" удалить?`, async () => {
        const s = db.getSettings();
        if(s.pairs) {
            s.pairs = s.pairs.filter(x => x !== p);
            await db.saveSettings(s);
            loadAccountsList();
            populateFormOptions();
            if(typeof populateFilters==='function') populateFilters();
            showToast("Удалено", 'info');
        }
    });
};

window.deleteStrategy = function(st) {
    showConfirm("Удаление стратегии", `"${st}" удалить?`, async () => {
        const s = db.getSettings();
        if(s.strategies) {
            s.strategies = s.strategies.filter(x => x !== st);
            await db.saveSettings(s);
            loadAccountsList();
            populateFormOptions();
            if(typeof populateFilters==='function') populateFilters();
            showToast("Удалено", 'info');
        }
    });
};

// AUTHENTICATION (Mock)
function setupAuth() {
    console.log("setupAuth initialized");
    setupMoneyInputs();
    
    let userStr = localStorage.getItem('tv_current_user');
    const overlay = document.getElementById('authOverlay');
    if (!overlay) { console.error("authOverlay not found!"); return; }
    
    if (userStr) {
        let user = JSON.parse(userStr);
        // Refresh user data from DB to ensure role/id are correct
        const freshUser = db.getUsers().find(u => u.login === user.login);
        if (freshUser) {
            user = freshUser;
            localStorage.setItem('tv_current_user', JSON.stringify(user));
        }
        overlay.style.display = 'none';
        setupUserInfo(user);
    } else {
        overlay.style.display = 'flex';
    }

    const authBox = document.getElementById('authBox');
    const toggleBtn = document.getElementById('toggleAuthMode');
    const toggleText = document.getElementById('toggleText');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isLogin = authBox.dataset.mode === 'login';
            authBox.dataset.mode = isLogin ? 'signup' : 'login';
            
            if (isLogin) {
                subtitle.textContent = "Создайте новый аккаунт";
                submitBtn.textContent = "Зарегистрироваться";
                toggleText.textContent = "Уже есть аккаунт?";
                toggleBtn.textContent = "Войти";
                document.getElementById('authName').required = true;
                document.getElementById('authPassConfirm').required = true;
            } else {
                subtitle.textContent = "Введите данные для входа";
                submitBtn.textContent = "Войти";
                toggleText.textContent = "Нет аккаунта?";
                toggleBtn.textContent = "Зарегистрироваться";
                document.getElementById('authName').required = false;
                document.getElementById('authPassConfirm').required = false;
            }
        });
    }

    const form = document.getElementById('emailAuthForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Auth form submitted", authBox.dataset.mode);
            const mode = authBox.dataset.mode;
            const login = document.getElementById('authLogin').value;
            const pass = document.getElementById('authPass').value;

        if (mode === 'login') {
            const user = db.authenticate(login, pass);
            if (user) {
                localStorage.setItem('tv_current_user', JSON.stringify(user));
                location.reload();
            } else {
                showToast("Неверный логин или пароль!", "error");
            }
        } else {
            const name = document.getElementById('authName').value;
            const passConfirm = document.getElementById('authPassConfirm').value;

            if (pass !== passConfirm) {
                showToast("Пароли не совпадают!", "error");
                return;
            }

            const existing = db.getUsers().find(u => u.login === login);
            if (existing) {
                showToast("Этот логин уже занят!", "error");
                return;
            }

            const newUser = db.addUser({
                login,
                password: pass,
                name,
                role: 'user'
            });

            showToast("Регистрация прошла успешно!", "success");
            localStorage.setItem('tv_current_user', JSON.stringify(newUser));
            setTimeout(() => location.reload(), 1500);
        }
        });
    }

    // Check for onboarding (first account)
    if (userStr) {
        const user = JSON.parse(userStr);
        const accounts = db.getAccounts();
        if (user.role !== 'admin' && (!accounts || accounts.length === 0)) {
            document.getElementById('onboardingModal').classList.add('show');
        }
    }

    // Onboarding Form Listener
    const obForm = document.getElementById('onboardingAccountForm');
    if (obForm) {
        obForm.addEventListener('submit', async e => {
            e.preventDefault();
            const name = document.getElementById('onboardingAccName').value.trim();
            const balance = parseMoney(document.getElementById('onboardingAccBalance').value);
            
            const newAcc = { id: 'acc' + Date.now(), name, balance };
            await db.addAccount(newAcc);
            await db.setActiveAccount(newAcc.id);
            
            showToast("Счет создан! Удачной торговли.", "success");
            setTimeout(() => location.reload(), 1000);
        });
    }
}

// === Money Input Formatting ===
function setupMoneyInputs() {
    const inputs = document.querySelectorAll('.money-input');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value === '') {
                e.target.value = '';
                return;
            }
            e.target.value = new Intl.NumberFormat('de-DE').format(parseInt(value));
        });
    });
}

function parseMoney(val) {
    return parseFloat(val.replace(/\./g, '')) || 0;
}

window.showConfirm = function(title, message, onOk) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const okBtn = document.getElementById('btnConfirmOk');
    const cancelBtn = document.getElementById('btnConfirmCancel');
    
    okBtn.onclick = () => {
        onOk();
        modal.classList.remove('show');
    };
    
    cancelBtn.onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.classList.add('show');
};

function setupUserInfo(user) {
    document.getElementById('sidebarName').textContent = user.name;
    document.getElementById('sidebarAvatar').textContent = user.name[0];
    document.getElementById('sidebarRole').textContent = user.role.toUpperCase();
    
    const adminLink = document.getElementById('nav-admin');
    const tradingNav = document.getElementById('trading-nav');
    const accountSelector = document.getElementById('accountSelector');
    const searchBar = document.getElementById('searchBar');
    const resetBtn = document.getElementById('resetDbBtn');
    const topbarActions = document.getElementById('topbarActions');

    if (user.role === 'admin') {
        adminLink.style.display = 'flex';
        tradingNav.style.display = 'none';
        if (accountSelector) accountSelector.style.display = 'none';
        if (searchBar) searchBar.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (topbarActions) topbarActions.style.display = 'none';
        
        // Only redirect if no page is active or if current page is invalid for admin
        const activePage = document.querySelector('.page.active');
        const savedPage = localStorage.getItem('tv_active_page');
        if (!activePage || (savedPage && savedPage !== 'admin')) {
            switchPage('admin');
        }
    } else {
        adminLink.style.display = 'none';
        tradingNav.style.display = 'block';
        if (accountSelector) accountSelector.style.display = 'block';
        if (searchBar) searchBar.style.display = 'flex';
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        if (topbarActions) topbarActions.style.display = 'flex';
        
        const savedPage = localStorage.getItem('tv_active_page');
        if (savedPage === 'admin') {
            switchPage('dashboard');
        }
    }
}

// ADMIN PANEL
function setupAdminPage() {
    document.getElementById('addUserForm').addEventListener('submit', async e => {
        e.preventDefault();
        const u = {
            name: document.getElementById('adminNewName').value.trim(),
            login: document.getElementById('adminNewLogin').value.trim(),
            password: document.getElementById('adminNewPass').value.trim(),
            role: document.getElementById('adminNewRole').value
        };
        await db.addUser(u);
        e.target.reset();
        location.reload(); 
    });

    document.getElementById('adminSelfUpdateForm').addEventListener('submit', async e => {
        e.preventDefault();
        const login = document.getElementById('adminSelfLogin').value.trim();
        const pass = document.getElementById('adminSelfPass').value.trim();
        const user = JSON.parse(localStorage.getItem('tv_current_user'));
        if (login) user.login = login;
        if (pass) user.password = pass;
        await db.updateUser(user.id, user);
        localStorage.setItem('tv_current_user', JSON.stringify(user));
        e.target.reset();
        location.reload();
    });
}

window.loadUsersList = function() {
    const body = document.getElementById('usersListBody');
    if (!body) return;
    
    // Clear first to force a refresh
    body.innerHTML = '';
    
    const users = db.getUsers();
    let html = '';
    users.forEach(u => {
        html += `
        <tr onclick="openUserModal('${u.id}')" style="cursor:pointer">
            <td>${u.id}</td>
            <td>${u.login}</td>
            <td>${u.name}</td>
            <td><span class="status-badge ${u.role === 'admin' ? 'status-win' : 'status-be'}">${u.role.toUpperCase()}</span></td>
            <td>
                <button class="btn-delete-sm" onclick="event.stopPropagation();adminDeleteUser('${u.id}')" ${u.id === 'admin' ? 'disabled style="opacity:0.5"' : ''}>✕</button>
            </td>
        </tr>`;
    });
    body.innerHTML = html;
}

window.openUserModal = function(userId) {
    const user = db.getUserById(userId);
    if (!user) return;
    
    const stats = db.getStats(null, userId);
    const modal = document.getElementById('userModal');
    const body = document.getElementById('userModalBody');
    
    const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Неизвестно';
    
    document.getElementById('userModalTitle').textContent = `Пользователь: ${user.name}`;
    
    let h = `
    <div style="background:var(--bg-secondary); border-radius:12px; padding:12px 16px; margin-bottom:20px; font-size:0.85rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
        <span>🆔 ID: ${user.id}</span>
        <span>📅 Регистрация: ${regDate}</span>
    </div>
    `;
    
    if (user.role !== 'admin') {
        if (stats.totalTrades === 0) {
            h += `
            <div style="background:rgba(168,85,247,0.05); border:1px dashed rgba(168,85,247,0.3); border-radius:16px; padding:40px; text-align:center; margin-bottom:24px;">
                <div style="font-size:2rem; margin-bottom:12px;">📊</div>
                <h3 style="margin-bottom:8px; color:var(--text-primary)">Нет торговой активности</h3>
                <p style="color:var(--text-muted); font-size:0.9rem">Этот пользователь еще не добавил ни одной сделки.</p>
            </div>
            `;
        } else {
            h += `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
                <div class="stat-card" style="padding:15px">
                    <div class="stat-label">Профит за месяц</div>
                    <div class="stat-value" style="color:${(stats.monthPnl||0)>=0?'var(--green)':'var(--red)'}">${(stats.monthPnl||0)>=0?'+':''}$${(stats.monthPnl||0).toFixed(0)}</div>
                </div>
                <div class="stat-card" style="padding:15px">
                    <div class="stat-label">Общий профит</div>
                    <div class="stat-value" style="color:${stats.totalPnl>=0?'var(--green)':'var(--red)'}">${stats.totalPnl>=0?'+':''}$${stats.totalPnl.toFixed(0)}</div>
                </div>
                <div class="stat-card" style="padding:15px">
                    <div class="stat-label">Всего сделок</div>
                    <div class="stat-value">${stats.totalTrades}</div>
                </div>
                <div class="stat-card" style="padding:15px">
                    <div class="stat-label">Win Rate</div>
                    <div class="stat-value">${stats.winRate.toFixed(1)}%</div>
                </div>
            </div>
            
            <h4 style="margin-bottom:12px; border-top:1px solid var(--border); padding-top:16px; margin-top:16px;">Savdolar tarixi va tahlili:</h4>
            <div style="margin-bottom:24px; max-height:200px; overflow-y:auto; padding-right:8px;">
                ${stats.pairStats.map(p => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px;">
                        <div><span style="font-weight:700">${p.name}</span><span style="color:var(--text-muted); margin-left:8px;">${p.trades} сделок</span></div>
                        <span style="color:${p.pnl>=0?'var(--green)':'var(--red)'}; font-weight:700">${p.pnl>=0?'+':''}$${p.pnl.toFixed(0)}</span>
                    </div>
                `).join('') || '<p style="color:var(--text-muted)">Нет данных</p>'}
            </div>
            <h4 style="margin-bottom:12px">Strategiyalar samaradorligi:</h4>
            <div style="margin-bottom:24px">
                ${stats.strategyStats.map(s => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
                        <span>${s.name} (${s.trades} savdo)</span>
                        <span style="color:var(--text-secondary); font-weight:600">${((s.wins/s.trades)*100).toFixed(0)}% WinRate</span>
                    </div>
                `).join('') || '<p style="color:var(--text-muted)">Нет ma\'lumotlar</p>'}
            </div>
            `;
        }
    }

    h += `
        <h4 style="margin-bottom:12px">Редактировать данные:</h4>
        <form id="adminEditUserForm" class="auth-form" style="padding:0; background:transparent; box-shadow:none;">
            <input type="hidden" id="editUserId" value="${user.id}">
            <div class="form-group"><label>Новый логин</label><input type="text" id="editUserLogin" value="${user.login}"></div>
            <div class="form-group"><label>Новый пароль</label><input type="text" id="editUserPass" value="${user.password}"></div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; margin-top:20px;">Сохранить изменения</button>
        </form>
    `;
    
    body.innerHTML = h;
    modal.classList.add('show');
    
    document.getElementById('adminEditUserForm').addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const login = document.getElementById('editUserLogin').value.trim();
        const pass = document.getElementById('editUserPass').value.trim();
        
        db.updateUser(id, { login, password: pass });
        showToast("Данные пользователя обновлены", "success");
        modal.classList.remove('show');
        loadUsersList();
    });
}

window.adminDeleteUser = function(id) {
    showConfirm("Удаление пользователя", `Удалить пользователя ${id}?`, async () => {
        await db.removeUser(id);
        location.reload();
    });
}

// TOAST
function showToast(msg,type='info'){
    console.log("Toast:", msg, type);
    const c=document.getElementById('toastContainer');
    if (!c) { console.warn("toastContainer missing!"); return; }
    const t=document.createElement('div');t.className=`toast toast-${type}`;const icons={success:'✅',error:'❌',info:'ℹ️'};t.innerHTML=`<span>${icons[type]||''}</span> ${msg}`;c.appendChild(t);setTimeout(()=>{if(t.parentNode)t.remove()},3000)}

// CUSTOM SELECT UI
function initCustomSelects() {
    document.querySelectorAll('select').forEach(select => {
        makeCustomSelect(select);
    });
}

function makeCustomSelect(select) {
    if(select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')) {
        updateCustomSelect(select);
        return;
    }
    
    select.style.display = 'none';
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'custom-options';
    
    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsDiv);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    
    updateCustomSelect(select);
    
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-trigger.open').forEach(t => {
            if(t !== trigger) t.classList.remove('open');
        });
        this.classList.toggle('open');
    });
}

function updateCustomSelect(select) {
    const wrapper = select.nextElementSibling;
    if(!wrapper || !wrapper.classList.contains('custom-select-wrapper')) return;
    
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const optionsDiv = wrapper.querySelector('.custom-options');
    
    const selectedOption = select.options[select.selectedIndex];
    trigger.innerHTML = `<span>${selectedOption ? selectedOption.text : 'Выберите...'}</span><svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
    
    optionsDiv.innerHTML = '';
    
    Array.from(select.options).forEach((opt, index) => {
        const div = document.createElement('div');
        div.className = 'custom-option' + (index === select.selectedIndex ? ' selected' : '');
        div.textContent = opt.text;
        div.addEventListener('click', function(e) {
            e.stopPropagation();
            select.selectedIndex = index;
            trigger.classList.remove('open');
            trigger.innerHTML = `<span>${opt.text}</span><svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
            
            Array.from(optionsDiv.children).forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        optionsDiv.appendChild(div);
    });
}

document.addEventListener('click', function() {
    document.querySelectorAll('.custom-select-trigger.open').forEach(t => t.classList.remove('open'));
});

