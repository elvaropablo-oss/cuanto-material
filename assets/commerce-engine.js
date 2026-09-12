(()=>{
  if(window.CommerceEngine)return;
  const clamp=(value,min=0,max=100)=>Math.min(max,Math.max(min,Number(value)||0));
  const finite=value=>value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value));
  const dayMs=86400000;

  function resolveLink(product={}){
    const affiliate=product.affiliate||{};
    const affiliateActive=affiliate.enabled===true&&typeof affiliate.url==='string'&&affiliate.url.trim().length>0;
    const normalUrl=product.normalUrl||product.url||'';
    return {url:affiliateActive?affiliate.url:normalUrl,affiliate:affiliateActive,network:affiliateActive?(affiliate.network||'awin'):null};
  }

  function decorateLink(anchor,product){
    if(!anchor)return null;
    const link=resolveLink(product);
    anchor.href=link.url;
    anchor.target='_blank';
    anchor.rel=link.affiliate?'sponsored noopener noreferrer':'noopener noreferrer';
    if(product.id)anchor.dataset.productId=product.id;
    anchor.dataset.affiliate=link.affiliate?'true':'false';
    return link;
  }

  function freshness(product,maxAgeDays=30,now=new Date()){
    if(!product?.verifiedAt)return {known:false,stale:true,ageDays:null};
    const checked=new Date(product.verifiedAt);
    if(Number.isNaN(checked.getTime()))return {known:false,stale:true,ageDays:null};
    const ageDays=Math.max(0,Math.floor((now-checked)/dayMs));
    return {known:true,stale:ageDays>maxAgeDays,ageDays};
  }

  function pack(required,product,{sizeKey='size',priceKey='price'}={}){
    const need=Number(required),size=Number(product?.[sizeKey]),price=Number(product?.[priceKey]);
    if(!(need>0)||!(size>0)||!finite(product?.[priceKey])||!Number.isFinite(price)||price<0)return null;
    const units=Math.max(1,Math.ceil(need/size));
    const purchased=units*size;
    return {units,purchased,waste:Math.max(0,purchased-need),projectCost:units*price,unitCost:price/size};
  }

  function criterionScore(value,criterion={}){
    if(typeof criterion.score==='function'){
      const score=criterion.score(value);
      return finite(score)?clamp(score):null;
    }
    if(criterion.type==='boolean')return value===true?100:value===false?0:null;
    if(criterion.values&&Object.prototype.hasOwnProperty.call(criterion.values,value))return clamp(criterion.values[value]);
    if(!finite(value)||!finite(criterion.min)||!finite(criterion.max)||Number(criterion.max)===Number(criterion.min))return null;
    const ratio=clamp((Number(value)-Number(criterion.min))/(Number(criterion.max)-Number(criterion.min)),0,1);
    return (criterion.direction||'higher')==='lower'?(1-ratio)*100:ratio*100;
  }

  function technicalScore(product,criteria=[]){
    let usedWeight=0,totalWeight=0,weighted=0;
    for(const criterion of criteria){
      const weight=Math.max(0,Number(criterion.weight)||0);
      totalWeight+=weight;
      const source=criterion.source||'specs';
      const container=source==='root'?product:(product?.[source]||{});
      const value=container?.[criterion.key];
      const score=criterionScore(value,criterion);
      if(score===null||weight===0)continue;
      usedWeight+=weight;
      weighted+=score*weight;
    }
    return {score:usedWeight>0?weighted/usedWeight:null,coverage:totalWeight>0?usedWeight/totalWeight:0,usedWeight,totalWeight};
  }

  function rank(products=[],options={}){
    const {required,calculate=(product)=>pack(required,product),technicalCriteria=[],economyWeight=.55,technicalWeight=.45,minimumTechnicalCoverage=.6}=options;
    let rows=products.map(product=>{
      const purchase=calculate(product);
      const technical=technicalScore(product,technicalCriteria);
      return {...product,purchase,technical};
    }).filter(row=>row.purchase&&Number.isFinite(row.purchase.projectCost));
    if(!rows.length)return [];
    const positiveCosts=rows.map(row=>row.purchase.projectCost).filter(cost=>cost>0);
    const minCost=positiveCosts.length?Math.min(...positiveCosts):0;
    const eWeight=Math.max(0,Number(economyWeight)||0),tWeight=Math.max(0,Number(technicalWeight)||0);
    rows=rows.map(row=>{
      const cost=row.purchase.projectCost;
      const economicScore=cost===0?100:(minCost>0?clamp(minCost/cost*100):null);
      const technicalUsable=row.technical.score!==null&&row.technical.coverage>=minimumTechnicalCoverage;
      const valueScore=technicalUsable&&economicScore!==null&&(eWeight+tWeight)>0?(economicScore*eWeight+row.technical.score*tWeight)/(eWeight+tWeight):null;
      return {...row,economicScore,valueScore,link:resolveLink(row)};
    });
    return rows.sort((a,b)=>{
      if(a.valueScore!==null||b.valueScore!==null){
        if(a.valueScore===null)return 1;
        if(b.valueScore===null)return -1;
        if(b.valueScore!==a.valueScore)return b.valueScore-a.valueScore;
      }
      return a.purchase.projectCost-b.purchase.projectCost;
    });
  }

  function winners(rows=[]){
    const valid=rows.filter(row=>row.purchase);
    if(!valid.length)return {cheapest:null,leastWaste:null,bestTechnical:null,bestValue:null};
    const cheapest=[...valid].sort((a,b)=>a.purchase.projectCost-b.purchase.projectCost)[0]||null;
    const leastWaste=[...valid].sort((a,b)=>a.purchase.waste-b.purchase.waste||a.purchase.projectCost-b.purchase.projectCost)[0]||null;
    const technical=valid.filter(row=>row.technical?.score!==null);
    const values=valid.filter(row=>row.valueScore!==null);
    return {cheapest,leastWaste,bestTechnical:technical.sort((a,b)=>b.technical.score-a.technical.score)[0]||null,bestValue:values.sort((a,b)=>b.valueScore-a.valueScore)[0]||null};
  }

  function track(event,product={},extra={}){
    const link=resolveLink(product);
    const detail={event,product_id:product.id||null,retailer:product.retailer||null,affiliate:link.affiliate,network:link.network,...extra};
    if(typeof window.cmTrack==='function')window.cmTrack(event,detail);
    window.dispatchEvent(new CustomEvent('commerce:track',{detail}));
    return detail;
  }

  window.CommerceEngine=Object.freeze({resolveLink,decorateLink,freshness,pack,criterionScore,technicalScore,rank,winners,track});
})();
