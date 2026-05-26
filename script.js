
var F=RAW.slice(),cp=1,ps=50,sortCol='',sortDir=1,filterTimer=null,curPanel='table';
var aktifKlas={Rintisan:true,Berkembang:true,Maju:true,Mandiri:true};
var aktifSert={},aktifMitra={};
var mapInit=false,mapObj=null,mLayer=null;

var KAB_IDX={};
RAW.forEach(function(r){
  if(!r.provinsi||!r.kabupaten)return;
  if(!KAB_IDX[r.provinsi])KAB_IDX[r.provinsi]={};
  KAB_IDX[r.provinsi][r.kabupaten]=true;
});
Object.keys(KAB_IDX).forEach(function(p){KAB_IDX[p]=Object.keys(KAB_IDX[p]).sort();});

function gv(id){return document.getElementById(id).value;}
function gc(id){return document.getElementById(id).checked;}
function sf(){clearTimeout(filterTimer);filterTimer=setTimeout(applyFilter,80);}

function onProvChange(){
  var prov=gv('fProv'),sel=document.getElementById('fKab'),cur=sel.value;
  sel.innerHTML='<option value="">— Semua Kabupaten/Kota —</option>';
  var list=prov?(KAB_IDX[prov]||[]):[];
  list.forEach(function(k){
    var o=document.createElement('option');
    o.value=k;o.textContent=k;
    if(k===cur)o.selected=true;
    sel.appendChild(o);
  });
  sf();
}
function toggleKlas(el,val){aktifKlas[val]=!aktifKlas[val];el.classList.toggle('on',aktifKlas[val]);sf();}
function toggleSert(el){var yr=el.dataset.yr;if(aktifSert[yr]){delete aktifSert[yr];el.classList.remove('on');}else{aktifSert[yr]=true;el.classList.add('on');}sf();}
function toggleMitra(el){var m=el.dataset.mitra;if(aktifMitra[m]){delete aktifMitra[m];el.classList.remove('on');}else{aktifMitra[m]=true;el.classList.add('on');}sf();}

function applyFilter(){
  var q=document.getElementById('si').value.toLowerCase().trim();
  var reg=gv('fReg'),prov=gv('fProv'),kab=gv('fKab'),kaw=gv('fKaw'),ug=gv('fUG'),adwiLvl=gv('fAdwiLvl');
  var yrChk={
    '2021':{'50 Besar':gc('a21w'),'100 Besar':gc('a21c'),'300 Besar':gc('a21t')},
    '2022':{'50 Besar':gc('a22w'),'100 Besar':gc('a22c'),'300 Besar':gc('a22t'),'500 Besar':gc('a22f')},
    '2023':{'75 Besar':gc('a23w'),'300 Besar':gc('a23t'),'500 Besar':gc('a23f')},
    '2024':{'50 Besar':gc('a24w'),'100 Besar':gc('a24c'),'300 Besar':gc('a24t'),'500 Besar':gc('a24f')}
  };
  var anyYrChk=false;
  Object.keys(yrChk).forEach(function(y){Object.keys(yrChk[y]).forEach(function(k){if(yrChk[y][k])anyYrChk=true;});});
  var hasSert=Object.keys(aktifSert).length>0;
  var hasMitra=Object.keys(aktifMitra).length>0;

  F=RAW.filter(function(r){
    if(q&&r.nama.toLowerCase().indexOf(q)<0&&(r.kabupaten||'').toLowerCase().indexOf(q)<0)return false;
    if(!aktifKlas[r.klasifikasi])return false;
    if(reg&&r.region!==reg)return false;
    if(prov&&r.provinsi!==prov)return false;
    if(kab&&r.kabupaten!==kab)return false;
    if(kaw&&r.kawasan!==kaw)return false;
    if(adwiLvl){
      var rk=adwiBest(r);
      if(adwiLvl==='win'&&rk>1)return false;
      if(adwiLvl==='100'&&rk>2)return false;
      if(adwiLvl==='300'&&rk>3)return false;
      if(adwiLvl==='500'&&rk>4)return false;
    }
    if(anyYrChk){
      var flds={adwi21:'2021',adwi22:'2022',adwi23:'2023',adwi24:'2024'};
      var ok=true;
      Object.keys(flds).forEach(function(fld){
        var yr=flds[fld],chks=yrChk[yr],hasAny=false;
        Object.keys(chks).forEach(function(k){if(chks[k])hasAny=true;});
        if(hasAny&&(!r[fld]||!chks[r[fld]]))ok=false;
      });
      if(!ok)return false;
    }
    if(gc('faP')&&!r.adwi_pemenang)return false;
    if(gc('fSe')&&!r.sertidewi_tahun)return false;
    if(hasSert){
      var sOk=false;
      Object.keys(aktifSert).forEach(function(yr){
        if(yr==='resert'){if(r.resertifikasi)sOk=true;}
        else{if(String(r.sertidewi_tahun)===yr)sOk=true;}
      });
      if(!sOk)return false;
    }
    if(gc('fUN')&&!r.unwto)return false;
    if(gc('fAS')&&!r.asean_sta)return false;
    if(gc('fWI')&&!r.wia25)return false;
    if(gc('fIS')&&!r.ista)return false;
    if(gc('fKS')&&!r.ksw)return false;
    if(gc('fDW')&&!r.dwn)return false;
    if(hasMitra){
      var rMitras=(r.mitra_nama||'').split(' | ').map(function(m){return m.trim();});
      var mOk=false;
      Object.keys(aktifMitra).forEach(function(m){if(rMitras.indexOf(m)>=0)mOk=true;});
      if(!mOk)return false;
    }
    if(gc('fPK')&&!r.proklim)return false;
    if(gc('fDE')&&!r.destana)return false;
    if(gc('fKE')&&!r.kek)return false;
    if(ug&&r.unggulan!==ug)return false;
    return true;
  });

  cp=1;
  var n=F.length;
  document.getElementById('rc').textContent=n.toLocaleString('id');
  document.getElementById('hf').textContent=n.toLocaleString('id');
  document.getElementById('dlc').textContent=n.toLocaleString('id');
  updateChips();updateKPIs();
  // Only render current panel, defer heavy operations
  if(curPanel==='table')renderTable();
  // Map and chart rendering deferred until user switches to those panels
}

function updateChips(){
  var bar=document.getElementById('afbar'),chips=[];
  var q=document.getElementById('si').value.trim();
  if(q)chips.push({l:'Cari: "'+q+'"',c:function(){document.getElementById('si').value='';sf();}});
  var excl=[];
  ['Rintisan','Berkembang','Maju','Mandiri'].forEach(function(k){if(!aktifKlas[k])excl.push(k);});
  if(excl.length){
    chips.push({l:'Tanpa: '+excl.join(', '),c:function(){
      ['Rintisan','Berkembang','Maju','Mandiri'].forEach(function(v){aktifKlas[v]=true;});
      document.querySelectorAll('.tg').forEach(function(t){t.classList.add('on');});
      applyFilter();
    }});
  }
  [['fReg','Region'],['fProv','Provinsi'],['fKab','Kab/Kota'],['fKaw','Kawasan'],['fAdwiLvl','ADWI Level'],['fUG','Unggulan']].forEach(function(p){
    var val=gv(p[0]);
    if(val)chips.push({l:p[1]+': '+val,c:function(){document.getElementById(p[0]).value='';if(p[0]==='fProv')onProvChange();else sf();}});
  });
  Object.keys(aktifSert).forEach(function(yr){
    var lbl=yr==='resert'?'Re-Sertifikasi 2025':'Sertidewi '+yr;
    chips.push({l:lbl,c:function(){delete aktifSert[yr];document.querySelectorAll('.stag[data-yr="'+yr+'"]').forEach(function(t){t.classList.remove('on');});sf();}});
  });
  Object.keys(aktifMitra).forEach(function(m){
    chips.push({l:'Mitra: '+m,c:function(){delete aktifMitra[m];document.querySelectorAll('.mtag[data-mitra="'+m+'"]').forEach(function(t){t.classList.remove('on');});sf();}});
  });
  var aCl={'a21w':'ADWI 2021 50Bsr','a21c':'ADWI 2021 100Bsr','a21t':'ADWI 2021 300Bsr','a22w':'ADWI 2022 50Bsr','a22c':'ADWI 2022 100Bsr','a22t':'ADWI 2022 300Bsr','a22f':'ADWI 2022 500Bsr','a23w':'ADWI 2023 75Bsr','a23t':'ADWI 2023 300Bsr','a23f':'ADWI 2023 500Bsr','a24w':'ADWI 2024 50Bsr','a24c':'ADWI 2024 100Bsr','a24t':'ADWI 2024 300Bsr','a24f':'ADWI 2024 500Bsr','faP':'Pemenang ADWI','fSe':'Sertidewi','fUN':'UN BTV','fAS':'ASEAN Award','fWI':'WIA 2025','fIS':'ISTA','fKS':'KSW','fDW':'DWN','fPK':'Proklim','fDE':'Destana','fKE':'KEK'};
  Object.keys(aCl).forEach(function(id){if(gc(id))chips.push({l:aCl[id],c:function(){document.getElementById(id).checked=false;sf();}});});
  if(!chips.length){bar.innerHTML='<span class="af-empty">Tidak ada filter aktif &mdash; menampilkan semua data</span>';return;}
  window._chips=chips;
  bar.innerHTML=chips.map(function(c,i){return'<div class="afc">'+c.l+'<span class="x" onclick="clrChip('+i+')">&#215;</span></div>';}).join('');
}
function clrChip(i){window._chips[i].c();}

function updateKPIs(){
  var n=F.length;
  var mm=F.filter(function(r){return r.klasifikasi==='Mandiri'||r.klasifikasi==='Maju';}).length;
  var adwi=F.filter(function(r){return r.adwi21||r.adwi22||r.adwi23||r.adwi24;}).length;
  var adwi = F.filter(function(r){
    return r.adwi21 || r.adwi22 || r.adwi23 || r.adwi24;
}).length;
  var srt=F.filter(function(r){return r.sertidewi_tahun;}).length;
  var intl=F.filter(function(r){return r.unwto||r.asean_sta||r.ista||r.wia25;}).length;
  document.getElementById('k0').textContent=n.toLocaleString('id');
  document.getElementById('k1').textContent=mm.toLocaleString('id');
  document.getElementById('k1s').textContent=n?(mm/n*100).toFixed(1)+'% dari total':'';
  document.getElementById('k2').textContent=adwi.toLocaleString('id');
  document.getElementById('k2s').textContent=adwiW?adwiW+' pemenang (50/75 Besar)':'';
  document.getElementById('k3').textContent=srt.toLocaleString('id');
  document.getElementById('k4').textContent=intl.toLocaleString('id');
}

function sortBy(col){
  if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=1;}
  F.sort(function(a,b){var av=(a[col]||'').toString().toLowerCase(),bv=(b[col]||'').toString().toLowerCase();return av<bv?-sortDir:av>bv?sortDir:0;});
  renderTable();
}

function kb(k){var m={Rintisan:'b-ri',Berkembang:'b-be',Maju:'b-ma',Mandiri:'b-mn'};return'<span class="bx '+(m[k]||'')+'">'+k+'</span>';}
function adwiCell(r){
  var rows=[],cls={'50 Besar':'b-w','75 Besar':'b-w','100 Besar':'b-b','300 Besar':'b-a','500 Besar':'b-5'};
  [['adwi21','2021'],['adwi22','2022'],['adwi23','2023'],['adwi24','2024']].forEach(function(p){
    if(r[p[0]])rows.push('<span class="bx '+(cls[r[p[0]]]||'')+'">'+p[1]+':'+r[p[0]]+'</span>');
  });
  if(!rows.length)return'<span style="color:var(--muted)">&mdash;</span>';
  return'<div style="display:flex;flex-direction:column;gap:2px">'+rows.join('')+(r.adwi_pemenang?'<span class="bx b-aw">'+r.adwi_pemenang+'</span>':'')+'</div>';
}
function awardsCell(r){
  var d=[];
  if(r.unwto)d.push('<span class="dot8" style="background:var(--a4)" title="UN BTV: '+r.unwto+'"></span>');
  if(r.asean_sta)d.push('<span class="dot8" style="background:var(--a4)" title="ASEAN: '+r.asean_sta+'"></span>');
  if(r.ista)d.push('<span class="dot8" style="background:var(--a4)" title="ISTA"></span>');
  if(r.wia25)d.push('<span class="dot8" style="background:var(--a4)" title="WIA 2025: '+r.wia25+'"></span>');
  if(r.ksw)d.push('<span class="dot8" style="background:var(--a3)" title="KSW"></span>');
  if(r.dwn)d.push('<span class="dot8" style="background:var(--a3)" title="DWN"></span>');
  return d.length?'<div class="dots">'+d.join('')+'</div>':'<span style="color:var(--muted)">&mdash;</span>';
}
function sertCell(r){
  if(!r.sertidewi_tahun)return'<span style="color:var(--muted)">&mdash;</span>';
  return'<span class="bx b-st">'+r.sertidewi_tahun+'</span>'+(r.resertifikasi?' <span class="bx b-re">&#8635;'+r.resertifikasi+'</span>':'');
}
function mitraCell(r){
  if(!r.mitra_nama)return'<span style="color:var(--muted)">&mdash;</span>';
  return r.mitra_nama.split(' | ').map(function(m){return'<span class="bx b-mi">'+m.trim()+'</span>';}).join('');
}

function renderTable(){
  var tb=document.getElementById('tb');
  var s=(cp-1)*ps,page=F.slice(s,s+ps),tot=F.length,tp=Math.ceil(tot/ps)||1;
  document.getElementById('pi').textContent='Hal '+cp+'/'+tp+' ('+(s+1)+'&ndash;'+Math.min(s+ps,tot)+' dari '+tot.toLocaleString('id')+')';
  tb.innerHTML=page.map(function(r,i){
    return'<tr onclick="showD('+(s+i)+')" style="cursor:pointer">'
      +'<td><div class="dn">'+r.nama+'</div><div class="dl">'+(r.kecamatan||'')+'</div></td>'
      +'<td>'+kb(r.klasifikasi)+'</td>'
      +'<td><div style="font-size:11px">'+r.provinsi+'</div><div class="dl">'+(r.kabupaten||'')+'</div></td>'
      +'<td><span style="font-size:10px;color:'+(r.kawasan?'var(--a2)':'var(--muted)')+'">'+( r.kawasan||'&mdash;')+'</span></td>'
      +'<td>'+adwiCell(r)+'</td>'
      +'<td>'+awardsCell(r)+'</td>'
      +'<td>'+sertCell(r)+'</td>'
      +'<td>'+mitraCell(r)+'</td>'
      +'<td>'+(r.link?'<a class="lj" href="'+r.link+'" target="_blank" onclick="event.stopPropagation()">Jadesta &#8599;</a>':'&mdash;')+'</td>'
      +'</tr>';
  }).join('');
}
function prevP(){if(cp>1){cp--;renderTable();}}
function nextP(){if(cp<Math.ceil(F.length/ps)){cp++;renderTable();}}

function showD(idx){
  var r=F[idx];
  document.getElementById('mTitle').textContent=r.nama;
  var flds=[['Klasifikasi',r.klasifikasi],['Provinsi',r.provinsi],['Kabupaten/Kota',r.kabupaten],['Kecamatan',r.kecamatan||'&mdash;'],['Region',r.region||'&mdash;'],['Kawasan Prioritas',r.kawasan||'&mdash;'],['ADWI 2021',r.adwi21||'&mdash;'],['ADWI 2022',r.adwi22||'&mdash;'],['ADWI 2023',r.adwi23||'&mdash;'],['ADWI 2024',r.adwi24||'&mdash;'],['Pemenang Kategori ADWI',r.adwi_pemenang||'&mdash;'],['Prestasi ADWI',r.adwi_prestasi||'&mdash;'],['ISTA',r.ista||'&mdash;'],['KSW',r.ksw||'&mdash;'],['Kategori KSW',r.ksw_kat||'&mdash;'],['DWN',r.dwn||'&mdash;'],['UN Best Tourism Village',r.unwto||'&mdash;'],['ASEAN Tourism Award',r.asean_sta||'&mdash;'],['WIA 2025',r.wia25||'&mdash;'],['Sertidewi (Tahun)',r.sertidewi_tahun||'&mdash;'],['Status',r.sertidewi_status||'&mdash;'],['Tahun Re-Sertifikasi',r.resertifikasi||'&mdash;'],['Mitra Strategis',(r.mitra_nama||'&mdash;').split(' | ').join(', ')],['Proklim',r.proklim||'&mdash;'],['Destana',r.destana||'&mdash;'],['Unggulan',r.unggulan||'&mdash;'],['KEK',r.kek||'&mdash;'],['Koordinat',r.lat?r.lat+', '+r.lng:'&mdash;']];
  document.getElementById('mBody').innerHTML=flds.map(function(p){return'<div class="mr"><span class="mk">'+p[0]+'</span><span class="mv">'+p[1]+'</span></div>';}).join('')+(r.link?'<div style="margin-top:10px"><a href="'+r.link+'" target="_blank" class="btn btn-p" style="display:inline-flex">Buka di Jadesta &#8599;</a></div>':'');
  document.getElementById('detMo').classList.add('on');
}
function closeM(){document.getElementById('detMo').classList.remove('on');}

function renderMap(){
  if(!mapInit){
    mapObj=L.map('map').setView([-2.5,117.5],5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:18}).addTo(mapObj);
    mLayer=L.layerGroup().addTo(mapObj);mapInit=true;
  }
  mLayer.clearLayers();
  var col={Rintisan:'#64748b',Berkembang:'#f59e0b',Maju:'#3b82f6',Mandiri:'#16c784'};
  F.filter(function(r){return r.lat;}).forEach(function(r){
    var c=col[r.klasifikasi]||'#888';
    var rad=r.klasifikasi==='Mandiri'?9:r.klasifikasi==='Maju'?7:5;
    var m=L.circleMarker([r.lat,r.lng],{radius:rad,fillColor:c,color:c,weight:1,opacity:.9,fillOpacity:.7});
    var br=adwiBest(r);
    var atxt=br<=1?'Pemenang ADWI':br===2?'100 Besar':br===3?'300 Besar':br===4?'500 Besar':'';
    var pop='<div class="pn">'+r.nama+'</div>'
      +'<div class="pl">'+(r.kecamatan?r.kecamatan+' &middot; ':'')+(r.kabupaten||'')+' &middot; '+r.provinsi+'</div>'
      +'<div class="pb">'
      +'<span class="bx" style="background:'+c+'22;color:'+c+'">'+r.klasifikasi+'</span>'
      +(r.kawasan?'<span class="bx b-b">'+r.kawasan+'</span>':'')
      +(atxt?'<span class="bx b-w">'+atxt+'</span>':'')
      +(r.sertidewi_tahun?'<span class="bx b-st">Sertidewi '+r.sertidewi_tahun+(r.resertifikasi?' &#8635;':'')+'</span>':'')
      +(r.unwto?'<span class="bx b-aw">UN BTV</span>':'')
      +(r.asean_sta?'<span class="bx b-aw">ASEAN</span>':'')
      +(r.wia25?'<span class="bx b-aw">WIA 2025</span>':'')
      +(r.mitra_nama?'<span class="bx b-mi">'+r.mitra_nama.split(' | ')[0]+'</span>':'')
      +'</div>'
      +(r.link?'<div style="margin-top:6px"><a href="'+r.link+'" target="_blank" style="color:#3b82f6;font-size:10px">Jadesta &#8599;</a></div>':'');
    m.bindPopup(pop);
    mLayer.addLayer(m);
  });
}

function renderCharts(){
  var area=document.getElementById('ca');
  var kc={},pc={},kac={},scYr={},mc={},provKlas={},provAward={},kawProv={};
  F.forEach(function(r){
    kc[r.klasifikasi]=(kc[r.klasifikasi]||0)+1;
    if(r.provinsi)pc[r.provinsi]=(pc[r.provinsi]||0)+1;
    if(r.kawasan)kac[r.kawasan]=(kac[r.kawasan]||0)+1;
    if(r.sertidewi_tahun){
      var yr=String(r.sertidewi_tahun);
      if(!scYr[yr])scYr[yr]={sert:0,resert:0};
      if(r.resertifikasi)scYr[yr].resert++;else scYr[yr].sert++;
    }
    if(r.mitra_nama)r.mitra_nama.split(' | ').forEach(function(m){var mk=m.trim();mc[mk]=(mc[mk]||0)+1;});
    if(r.provinsi){
      if(!provKlas[r.provinsi])provKlas[r.provinsi]={Rintisan:0,Berkembang:0,Maju:0,Mandiri:0};
      if(r.klasifikasi)provKlas[r.provinsi][r.klasifikasi]++;
      var aw=0;
      if(r.adwi21==='50 Besar'||r.adwi22==='50 Besar'||r.adwi23==='75 Besar'||r.adwi24==='50 Besar')aw++;
      if(r.wia25)aw++;if(r.unwto)aw++;if(r.asean_sta)aw++;if(r.ksw)aw++;if(r.ista)aw++;
      provAward[r.provinsi]=(provAward[r.provinsi]||0)+aw;
    }
    if(r.kawasan&&r.provinsi&&r.kabupaten){
      if(!kawProv[r.kawasan])kawProv[r.kawasan]={};
      if(!kawProv[r.kawasan][r.provinsi])kawProv[r.kawasan][r.provinsi]={};
      kawProv[r.kawasan][r.provinsi][r.kabupaten]=(kawProv[r.kawasan][r.provinsi][r.kabupaten]||0)+1;
    }
  });
  var tot=F.length||1;
  var cK={Rintisan:'#64748b',Berkembang:'#f59e0b',Maju:'#3b82f6',Mandiri:'#16c784'};
  var kawList=Object.entries(kac).sort(function(a,b){return b[1]-a[1];});
  var maxKaw=kawList.length?kawList[0][1]:1;
  var pTop=Object.entries(pc).sort(function(a,b){return b[1]-a[1];}).slice(0,15);
  var maxP=pTop.length?pTop[0][1]:1;
  var sertList=Object.entries(scYr).sort(function(a,b){return+a[0]-+b[0];});
  var maxSert=1;sertList.forEach(function(e){var t=e[1].sert+e[1].resert;if(t>maxSert)maxSert=t;});
  var pkTop=Object.entries(provKlas).map(function(e){var t=Object.values(e[1]).reduce(function(a,b){return a+b;},0);return[e[0],e[1],t];}).sort(function(a,b){return b[2]-a[2];}).slice(0,20);
  var awTop=Object.entries(provAward).sort(function(a,b){return b[1]-a[1];}).slice(0,15);
  var maxAw=awTop.length?awTop[0][1]:1;
  var mitraList=Object.entries(mc).sort(function(a,b){return b[1]-a[1];});
  var maxM=mitraList.length?mitraList[0][1]:1;

  function barRow(lbl,val,max,color,suffix){
    var pct=max?(val/max*100).toFixed(1):0;
    return'<div class="br"><div class="bl">'+lbl+'</div><div class="bt"><div class="bf" style="width:'+pct+'%;background:'+color+'">'+val+'</div></div><div class="bval">'+(suffix||val)+'</div></div>';
  }
  function stackRow(lbl,d,totP){
    var bars=['Rintisan','Berkembang','Maju','Mandiri'].map(function(k){
      var w=totP?((d[k]||0)/totP*100).toFixed(1):0;
      return'<div style="height:100%;width:'+w+'%;background:'+cK[k]+';display:inline-block" title="'+k+': '+(d[k]||0)+'"></div>';
    }).join('');
    return'<div class="br"><div class="bl" style="font-size:9px">'+lbl+'</div><div class="bt" style="display:flex;overflow:hidden">'+bars+'</div><div class="bval" style="font-size:9px">'+totP+'</div></div>';
  }

  function buildKawDetail(kaw){
    var pd=kawProv[kaw]||{};
    var pl=Object.entries(pd).sort(function(a,b){
      var ta=Object.values(a[1]).reduce(function(s,v){return s+v;},0);
      var tb=Object.values(b[1]).reduce(function(s,v){return s+v;},0);
      return tb-ta;
    });
    if(!pl.length)return'<div style="color:var(--muted);font-size:10px;padding:8px">Tidak ada data</div>';
    var allV=[];pl.forEach(function(pe){Object.values(pe[1]).forEach(function(v){allV.push(v);});});
    var maxK=allV.length?Math.max.apply(null,allV):1;
    return pl.map(function(pe){
      var prov=pe[0],kabs=pe[1],pt=Object.values(kabs).reduce(function(a,b){return a+b;},0);
      var krows=Object.entries(kabs).sort(function(a,b){return b[1]-a[1];}).map(function(ke){
        var lbl=ke[0].replace('Kabupaten ','Kab. '),n=ke[1],pct=(n/maxK*100).toFixed(1);
        return'<div class="kd-row"><div class="kd-lbl">'+lbl+'</div><div class="kd-bt"><div class="kd-bf" style="width:'+pct+'%">'+n+'</div></div><div class="kd-val">'+n+'</div></div>';
      }).join('');
      return'<div class="kd-prov"><div class="kd-prov-title">'+prov+' ('+pt+')</div>'+krows+'</div>';
    }).join('');
  }

  var tabsH='',detsH='';
  kawList.forEach(function(e,i){
    var kaw=e[0],v=e[1],isDPP=kaw.indexOf('DPP')===0;
    var tc=isDPP?'#7c3aed':'#0891b2',badge=isDPP?'DPP':'DR';
    var shortK=kaw.replace('DPP ','').replace('DPR ','');
    tabsH+='<button class="ktab'+(i===0?' on':'')+'" onclick="selKaw(this,\'kd'+i+'\')"><span style="font-size:8px;background:'+tc+'22;color:'+tc+';padding:1px 4px;border-radius:3px;margin-right:3px">'+badge+'</span>'+shortK+' <span style="opacity:.6;font-size:8px">('+v+')</span></button>';
    detsH+='<div class="kaw-detail'+(i===0?' on':'')+'" id="kd'+i+'">'+buildKawDetail(kaw)+'</div>';
  });

  var sertBars=sertList.map(function(e){
    var yr=e[0],d=e[1],total=d.sert+d.resert;
    var w1=maxSert?(d.sert/maxSert*100).toFixed(1):0;
    var w2=maxSert?(d.resert/maxSert*100).toFixed(1):0;
    return'<div class="br"><div class="bl">'+yr+'</div><div class="bt" style="display:flex">'
      +'<div style="height:100%;width:'+w1+'%;background:#16c784;display:flex;align-items:center;padding-left:4px;font-size:9px;font-weight:700;color:rgba(255,255,255,.85)">'+(d.sert>0?d.sert:'')+'</div>'
      +'<div style="height:100%;width:'+w2+'%;background:#3b82f6;display:flex;align-items:center;padding-left:2px;font-size:9px;font-weight:700;color:rgba(255,255,255,.85)">'+(d.resert>0?'&#8635;'+d.resert:'')+'</div>'
      +'</div><div class="bval">'+total+'</div></div>';
  }).join('');

  var pkLeg=['Rintisan','Berkembang','Maju','Mandiri'].map(function(k){
    return'<span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;background:'+cK[k]+';border-radius:2px;display:inline-block"></span><span style="font-size:9px">'+k+'</span></span>';
  }).join('');

  var kawOverH=kawList.map(function(e){
    var kaw=e[0],v=e[1],isDPP=kaw.indexOf('DPP')===0;
    var tc=isDPP?'#7c3aed':'#0891b2',badge=isDPP?'DPP':'DR';
    var shortK=kaw.replace('DPP ','').replace('DPR ','');
    return'<div class="br"><div class="bl" style="font-size:9px"><span style="font-size:8px;background:'+tc+'22;color:'+tc+';padding:1px 4px;border-radius:3px;margin-right:3px">'+badge+'</span>'+shortK+'</div>'
      +'<div class="bt"><div class="bf" style="width:'+(v/maxKaw*100).toFixed(1)+'%;background:'+tc+'">'+v+'</div></div><div class="bval">'+v+'</div></div>';
  }).join('');

  area.innerHTML=
    '<div class="cc"><div class="ct">Sebaran Klasifikasi</div><div class="bc">'
    +Object.entries(kc).map(function(e){return barRow(e[0],e[1],tot,cK[e[0]],(e[1]/tot*100).toFixed(1)+'%');}).join('')
    +'</div></div>'
    +'<div class="cc"><div class="ct">Top 15 Provinsi</div><div class="bc">'
    +pTop.map(function(e){return barRow(e[0],e[1],maxP,'#3b82f6');}).join('')+'</div></div>'
    +'<div class="cc"><div class="ct">Jumlah Desa &mdash; Kawasan Prioritas</div><div class="bc">'+kawOverH+'</div></div>'
    +'<div class="cc"><div class="ct">Sertidewi per Tahun</div><div class="bc">'+sertBars
    +'<div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap">'
    +'<span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;background:#16c784;border-radius:2px;display:inline-block"></span><span style="font-size:9px">Tersertifikasi</span></span>'
    +'<span style="display:flex;align-items:center;gap:3px"><span style="width:10px;height:10px;background:#3b82f6;border-radius:2px;display:inline-block"></span><span style="font-size:9px">Re-Sertifikasi</span></span>'
    +'</div></div></div>'
    +(kawList.length?'<div class="cc full"><div class="ct">Desa Wisata per Kawasan Prioritas (DPP &amp; DPR)</div><div class="kaw-tabs">'+tabsH+'</div><div style="font-size:9px;color:var(--muted);margin-bottom:8px">Breakdown per provinsi &amp; kabupaten/kota sesuai deliniasi kawasan</div><div id="kawDetWrap">'+detsH+'</div></div>':'')
    +'<div class="cc full"><div class="ct">Klasifikasi Desa Wisata per Provinsi (Top 20)</div><div style="display:flex;gap:10px;margin-bottom:8px;flex-wrap:wrap">'+pkLeg+'</div><div class="bc">'+pkTop.map(function(e){return stackRow(e[0],e[1],e[2]);}).join('')+'</div></div>'
    +'<div class="cc"><div class="ct">Provinsi &mdash; Peraih Award Terbanyak</div><div style="font-size:9px;color:var(--muted);margin-bottom:6px">ADWI Pemenang + WIA + UN BTV + ASEAN + KSW + ISTA</div><div class="bc">'+awTop.map(function(e){return barRow(e[0],e[1],maxAw,'#ec4899');}).join('')+'</div></div>'
    +(mitraList.length?'<div class="cc"><div class="ct">Mitra Strategis</div><div class="bc">'+mitraList.map(function(e){return barRow(e[0],e[1],maxM,'#f59e0b');}).join('')+'</div></div>':'');
}
window.selKaw=function(btn,id){
  document.querySelectorAll('.ktab').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  document.querySelectorAll('#kawDetWrap .kaw-detail').forEach(function(d){d.classList.remove('on');});
  var t=document.getElementById(id);if(t)t.classList.add('on');
};

function switchPanel(name){
  curPanel=name;
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('on');});
  document.getElementById('panel-'+name).classList.add('on');
  document.querySelectorAll('.vt').forEach(function(t,i){var tabs=['table','map','chart','download'];t.classList.toggle('on',tabs[i]===name);});
  document.getElementById('kpiRow').style.display=(name==='map'||name==='download')?'none':'';
  if(name==='map'){renderMap();setTimeout(function(){if(mapObj)mapObj.invalidateSize();},150);}
  else if(name==='chart')renderCharts();
}

function getRows(){return F.map(function(r){return{'No':r.id,'Nama Desa Wisata':r.nama,'Provinsi':r.provinsi,'Kabupaten/Kota':r.kabupaten,'Kecamatan':r.kecamatan,'Klasifikasi':r.klasifikasi,'Region':r.region,'Kawasan Prioritas':r.kawasan,'ADWI 2021':r.adwi21,'ADWI 2022':r.adwi22,'ADWI 2023':r.adwi23,'ADWI 2024':r.adwi24,'Pemenang Kategori ADWI':r.adwi_pemenang,'Prestasi Tertinggi ADWI':r.adwi_prestasi,'ISTA':r.ista,'KSW':r.ksw,'Kategori KSW':r.ksw_kat,'DWN':r.dwn,'UN Best Tourism Village':r.unwto,'ASEAN Tourism Award':r.asean_sta,'WIA 2025':r.wia25,'Tahun Sertidewi':r.sertidewi_tahun,'Status Sertidewi':r.sertidewi_status,'Tahun Re-Sertifikasi':r.resertifikasi,'Mitra Strategis':r.mitra_nama,'Keterangan Mitra':r.mitra_label,'Proklim':r.proklim,'Destana':r.destana,'Unggulan':r.unggulan,'KEK':r.kek,'Koordinat':r.lat?r.lat+', '+r.lng:'','Link Jadesta':r.link};});}
function dlExcel(){var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(getRows()),'Desa Wisata');XLSX.writeFile(wb,'desa_wisata_'+new Date().toISOString().slice(0,10)+'.xlsx');}
function dlCSV(){var rows=getRows(),k=Object.keys(rows[0]);var csv=[k.join(',')].concat(rows.map(function(r){return k.map(function(key){return'"'+String(r[key]||'').replace(/"/g,'""')+'"';}).join(',');})).join('\n');var b=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='desa_wisata_'+new Date().toISOString().slice(0,10)+'.csv';a.click();}
function dlJSON(){var b=new Blob([JSON.stringify(F,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='desa_wisata_'+new Date().toISOString().slice(0,10)+'.json';a.click();}
function dlGeo(){var ft=F.filter(function(r){return r.lat;}).map(function(r){return{type:'Feature',geometry:{type:'Point',coordinates:[r.lng,r.lat]},properties:{nama:r.nama,klasifikasi:r.klasifikasi,provinsi:r.provinsi,kabupaten:r.kabupaten,kawasan:r.kawasan,sertidewi:r.sertidewi_tahun,mitra:r.mitra_nama,unwto:r.unwto,wia25:r.wia25}};});var b=new Blob([JSON.stringify({type:'FeatureCollection',features:ft},null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='desa_wisata_geo_'+new Date().toISOString().slice(0,10)+'.geojson';a.click();}
function dlPNG(){var t=curPanel==='chart'?document.getElementById('ca'):document.getElementById('tw');html2canvas(t,{backgroundColor:'#111827',scale:2}).then(function(c){var a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='desa_wisata_'+curPanel+'_'+new Date().toISOString().slice(0,10)+'.png';a.click();});}
function dlSummary(){
  var wb=XLSX.utils.book_new();
  var byP={};
  F.forEach(function(r){
    if(!byP[r.provinsi])byP[r.provinsi]={Provinsi:r.provinsi,Total:0,Rintisan:0,Berkembang:0,Maju:0,Mandiri:0,'Pemenang ADWI':0,'Peserta ADWI':0,Sertidewi:0,'Re-Sertifikasi':0,'UN BTV':0,'ASEAN Award':0,'WIA 2025':0,'Di Kawasan':0};
    var p=byP[r.provinsi];p.Total++;if(r.klasifikasi)p[r.klasifikasi]++;
    if(adwiBest(r)<=1)p['Pemenang ADWI']++;if(r.adwi21||r.adwi22||r.adwi23||r.adwi24)p['Peserta ADWI']++;
    if(r.sertidewi_tahun)p.Sertidewi++;if(r.resertifikasi)p['Re-Sertifikasi']++;
    if(r.unwto)p['UN BTV']++;if(r.asean_sta)p['ASEAN Award']++;if(r.wia25)p['WIA 2025']++;if(r.kawasan)p['Di Kawasan']++;
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(Object.values(byP).sort(function(a,b){return b.Total-a.Total;})),'Per Provinsi');
  var byK={};
  F.forEach(function(r){
    if(!byK[r.klasifikasi])byK[r.klasifikasi]={Klasifikasi:r.klasifikasi,Total:0,'Pemenang ADWI':0,Sertidewi:0,'Award Intl':0,'Di Kawasan':0};
    var k=byK[r.klasifikasi];k.Total++;if(adwiBest(r)<=1)k['Pemenang ADWI']++;if(r.sertidewi_tahun)k.Sertidewi++;if(r.unwto||r.asean_sta||r.ista||r.wia25)k['Award Intl']++;if(r.kawasan)k['Di Kawasan']++;
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(Object.values(byK)),'Per Klasifikasi');
  var byKaw={};
  F.filter(function(r){return r.kawasan;}).forEach(function(r){
    if(!byKaw[r.kawasan])byKaw[r.kawasan]={Kawasan:r.kawasan,Total:0,Maju:0,Mandiri:0,'Pemenang ADWI':0,Sertidewi:0};
    var k=byKaw[r.kawasan];k.Total++;if(r.klasifikasi==='Maju')k.Maju++;if(r.klasifikasi==='Mandiri')k.Mandiri++;if(adwiBest(r)<=1)k['Pemenang ADWI']++;if(r.sertidewi_tahun)k.Sertidewi++;
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(Object.values(byKaw).sort(function(a,b){return b.Total-a.Total;})),'Per Kawasan');
  XLSX.writeFile(wb,'ringkasan_desa_wisata_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
function handleImport(input){
  var file=input.files[0];if(!file)return;
  var log=document.getElementById('impLog');log.textContent='Membaca file...';
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'binary'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws);
      log.innerHTML='&#10003; Terbaca: <strong>'+rows.length+'</strong> baris dari sheet "'+wb.SheetNames[0]+'". Kirim ke admin untuk update permanen.';
    }catch(err){log.textContent='Error: '+err.message;}
  };
  reader.readAsBinaryString(file);
}
function resetAll(){
  document.getElementById('si').value='';
  ['fReg','fProv','fKab','fKaw','fAdwiLvl','fUG'].forEach(function(id){document.getElementById(id).value='';});
  ['a21w','a21c','a21t','a22w','a22c','a22t','a22f','a23w','a23t','a23f','a24w','a24c','a24t','a24f','faP','fSe','fUN','fAS','fWI','fIS','fKS','fDW','fPK','fDE','fKE'].forEach(function(id){document.getElementById(id).checked=false;});
  aktifKlas={Rintisan:true,Berkembang:true,Maju:true,Mandiri:true};
  document.querySelectorAll('.tg').forEach(function(t){t.classList.add('on');});
  aktifSert={};document.querySelectorAll('.stag').forEach(function(t){t.classList.remove('on');});
  aktifMitra={};document.querySelectorAll('.mtag').forEach(function(t){t.classList.remove('on');});
  onProvChange();applyFilter();
}
window.addEventListener('DOMContentLoaded',function(){
  console.log('DOM Ready');
  console.log('RAW data:', RAW.length, 'records');
  console.log('Starting applyFilter...');
  try{
    applyFilter();
    
  document.getElementById('loading').style.display='none';
  console.log('applyFilter completed, F.length=', F.length);
  }catch(err){
    console.error('Error in applyFilter:', err);
    alert('Error loading dashboard: '+err.message);
  }
});
