'use strict';
(() => {
const $=id=>document.getElementById(id), key='purtidy-sg-profit-v1';
const fields=[
 ['name','商品 / SKU','text','可填写具体颜色与包装'],['price','商品标价 / SGD','number','每单1件'],['discount','卖家优惠 / SGD','number','商家承担的单件折扣'],
 ['fx','汇率：1 SGD = CNY','number','默认5.50为情景假设'],['purchase','采购 / CNY','number','刷子预设5.40假设含国内运费'],['domestic','国内运输 / CNY','number','已含在采购中则填0'],['packing','包装贴标 / CNY','number','滚刷0.60已获客服报价'],['otherCny','其他成本 / CNY','number','取件、仓储、操作等分摊'],
 ['weight','完整包裹毛重 / g','number','不是产品净重；未知可留空'],['length','包裹长 / cm','number','含最终快递外包装'],['width','包裹宽 / cm','number','不使用滚刷1×1×1占位值'],['height','包裹高 / cm','number','未知可留空'],
 ['mode','物流计算方式','select','优先输入本店后台报价'],['shipping','卖家承担物流 / SGD','number','默认采用先前后台预估'],['divisor','体积重除数 / cm³每kg','number','仅按已确认渠道规则填写；留空不计体积重'],['step','计费进位步长 / g','number','重量规则模式使用'],['rate','每步费用 / SGD','number','默认0.15仅为截图拟合'],['offset','固定调整 / SGD','number','默认−0.05仅为截图拟合'],
 ['fee','综合扣费率 / %','number','平台、达人、计划等按商品收入合并；默认10%是假设'],['fixed','其他单笔扣费 / SGD','number','无法按商品收入计提的费用'],['reserve','售后广告等预留 / SGD','number','默认0.30是假设；请按实际修改'],['income','已确认额外收入 / SGD','number','实际结算运费/补贴；未知填0'],['target','目标每单利润 / SGD','number','用于计算目标标价']
];
const base={name:'三合一杯盖刷 · 单支',price:4.78,discount:0,fx:5.5,purchase:5.4,domestic:0,packing:0,otherCny:0,weight:18,length:19.8,width:9,height:2,mode:'manual',shipping:.98,divisor:'',step:10,rate:.15,offset:-.05,fee:10,fixed:0,reserve:.3,income:0,target:1,costConfirmed:false,shipConfirmed:false,feeConfirmed:false,note:'18g / 19.8×9×2cm为供应商OPP包装数据，尚未确认最终快递包装。¥5.40适用六款及贴标收费待确认。物流S$0.98为原后台20g条件下的历史预估。'};
const roller={...base,name:'集毛滚刷 · 单个',price:6.7,purchase:6.9,domestic:2,packing:.6,weight:300,length:'',width:'',height:'',shipping:4.88,note:'300g为供应商页面未核实值，真实外包装尺寸未知。¥2.00国内运费是假设；¥0.60贴标、10个起贴标自提已获客服答复，取件及包装是否另收费待确认。S$4.88为历史后台预估。'};
let model={...base};try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const k of Object.keys(base))if(Object.hasOwn(saved,k)&&(fields.some(f=>f[0]===k&&f[2]==='number')?(saved[k]===''||typeof saved[k]==='number'):typeof saved[k]===typeof base[k]))model[k]=saved[k];}catch{}
function compute(m){
 const n=k=>m[k]===''?0:Number(m[k]);
 if(['price','fx','purchase','fee'].some(k=>m[k]==='')||(m.mode==='manual'&&m.shipping===''))return {error:'请填写标价、汇率、采购价、综合扣费率和所用物流报价；已确认无费用时请明确填0。'};
 const numeric=fields.filter(x=>x[2]==='number').map(x=>x[0]);
 if(numeric.some(k=>!Number.isFinite(n(k))||(k!=='offset'&&n(k)<0))||n('fx')<=0||n('fee')>=100||n('discount')>n('price'))return {error:'请检查输入：汇率须大于0，扣费率须小于100%，优惠不能超过标价，除固定调整外金额不能为负。'};
 let ship=n('shipping'),vol=0,bill=0;
 if(m.mode==='weight'){
  if(n('weight')<=0||n('step')<=0)return {error:'重量规则模式需要大于0的完整包裹毛重和计费步长。'};
  if(n('divisor')>0){if(['length','width','height'].some(k=>n(k)<=0))return {error:'使用体积重时，请填完整的包裹长宽高。'};vol=n('length')*n('width')*n('height')/n('divisor')*1000;}
  const ratio=Math.max(n('weight'),vol)/n('step');bill=Math.ceil(ratio-Number.EPSILON*Math.max(1,Math.abs(ratio))*2)*n('step');ship=Math.max(0,bill/n('step')*n('rate')+n('offset'));
 }
 const goods=(n('purchase')+n('domestic')+n('packing')+n('otherCny'))/n('fx'),revenue=n('price')-n('discount'),fees=revenue*n('fee')/100+n('fixed'),cost=goods+ship+n('reserve')+n('fixed'),profit=revenue*(1-n('fee')/100)+n('income')-cost;
 const priceFor=target=>Math.max(0,(cost+target-n('income'))/(1-n('fee')/100)+n('discount'));
 return {ship,vol,bill,goods,revenue,fees,cost,profit,breakEven:priceFor(0),targetPrice:priceFor(n('target')),margin:revenue?profit/revenue*100:null};
}
const money=x=>'S$'+x.toFixed(2), ceiling=x=>'S$'+(Math.ceil((x-1e-10)*100)/100).toFixed(2);
function save(){try{localStorage.setItem(key,JSON.stringify(model));$('profitSave').textContent='当前利润情景已保存到本机';}catch{$('profitSave').textContent='未能保存，请导出备份';}}
function update(){const r=compute(model);$('presetNote').textContent=model.note;
 if(r.error){$('profitStatus').textContent=r.error;for(const id of ['profitValue','breakEven','targetPrice'])$(id).textContent='—';$('marginValue').textContent='';$('profitBreakdown').replaceChildren();$('weightExplanation').textContent='';return;}
 const confirmed=model.costConfirmed&&model.shipConfirmed&&model.feeConfirmed;
 $('profitStatus').textContent=(confirmed?'按你标记为已确认的输入计算：':'情景试算 · 关键费用尚未全部确认：')+(r.profit>=0?'账面预计盈利，仍需核对实际结算。':'账面预计亏损，应先调整价格或成本。');
 $('profitValue').textContent=money(r.profit);$('profitValue').className=r.profit<0?'loss':'gain';$('marginValue').textContent=r.margin===null?'商品收入为0':`占折后商品收入 ${r.margin.toFixed(1)}%`;
 $('breakEven').textContent=ceiling(r.breakEven);$('targetPrice').textContent=ceiling(r.targetPrice);
 $('profitBreakdown').replaceChildren();for(const [label,value] of [['折后商品收入',r.revenue],['已确认额外收入',Number(model.income)],['采购＋国内运输＋包装等（换算SGD）',r.goods],['卖家承担跨境物流',r.ship],['综合扣费＋其他单笔扣费',r.fees],['售后广告等预留',Number(model.reserve)]]){const tr=document.createElement('tr');for(const t of [label,money(value)]){const td=document.createElement('td');td.textContent=t;tr.append(td);}$('profitBreakdown').append(tr);}
 $('weightExplanation').textContent=model.mode==='manual'?'使用手动物流报价；尺寸重量不参与本次费用计算。后台预估也需要核对最终结算。':`体积重 ${r.vol.toFixed(1)}g；进位后计费重 ${r.bill.toFixed(1)}g。所填每步费率、体积重除数和附加费须与你店铺渠道核对；默认截图拟合规则不含已知之外的起步价、税或附加费。`;
}
function render(){ $('profitFields').replaceChildren();for(const [k,label,type,hint] of fields){const wrap=document.createElement('label');wrap.className='field';const title=document.createElement('span');title.textContent=label;let input=document.createElement(type==='select'?'select':'input');input.id='profit-'+k;if(type==='select'){for(const [v,t] of [['manual','直接填后台 / 渠道物流报价'],['weight','按重量与自定义规则试算']]){const o=document.createElement('option');o.value=v;o.textContent=t;input.append(o);}}else{input.type=type;if(type==='number'){input.step='any';if(k!=='offset')input.min='0';}}input.value=model[k];input.oninput=()=>{model[k]=type==='number'?(input.value===''?'':Number(input.value)):input.value;for(const flag of ['costConfirmed','shipConfirmed','feeConfirmed']){model[flag]=false;$(flag).checked=false;}update();save();};const small=document.createElement('small');small.textContent=hint;wrap.append(title,input,small);$('profitFields').append(wrap);}for(const k of ['costConfirmed','shipConfirmed','feeConfirmed']){$(k).checked=model[k];$(k).onchange=()=>{model[k]=$(k).checked;update();save();};}update();}
for(const [id,preset] of [['brushPreset',base],['rollerPreset',roller]])$(id).onclick=()=>{model={...preset};render();save();};
function selectTab(profit){for(const [id,active] of [['profitTab',profit],['logisticsTab',!profit]]){$(id).setAttribute('aria-selected',String(active));$(id).tabIndex=active?0:-1;}$('profitPanel').hidden=!profit;$('logisticsPanel').hidden=profit;}
for(const id of ['profitTab','logisticsTab']){$(id).onclick=()=>selectTab(id==='profitTab');$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const profit=e.key==='End'||(e.key!=='Home'&&id==='logisticsTab');selectTab(profit);$(profit?'profitTab':'logisticsTab').focus();}};}
$('exportProfit').onclick=()=>{const content=JSON.stringify({savedAt:new Date().toISOString(),inputs:model,result:compute(model)},null,2),url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Purtidy-SG利润试算.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
for(const [label,m] of [['刷子 · 原后台轻包裹报价',base],['刷子 · 151g压力情景（非实测）',{...base,shipping:2.78}],['滚刷 · 原后台报价',roller]]){const r=compute(m),tr=document.createElement('tr');for(const t of [label,money(m.price),money(r.ship),money(r.profit),ceiling(r.breakEven)]){const td=document.createElement('td');td.textContent=t;tr.append(td);}$('scenarioRows').append(tr);}
render();
})();
