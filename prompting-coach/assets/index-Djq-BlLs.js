var Mt=Object.defineProperty;var Lt=(s,e,t)=>e in s?Mt(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var S=(s,e,t)=>Lt(s,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const q="logs";let L=null;function It(s){L=s}function oe(s){return{id:crypto.randomUUID(),timestamp:new Date().toISOString(),type:s.type||"request",provider:s.provider||"",model:s.model||"",promptLength:s.promptLength||0,responseLength:s.responseLength||null,tokens:s.tokens||null,error:s.error||null,durationMs:s.durationMs||0}}async function ce(s){if(!L){console.warn("Logger: Database not initialized");return}if(!L.objectStoreNames.contains(q)){console.warn("Logger: Logs store not found - DB may need upgrade. Clear site data to fix.");return}return new Promise((e,t)=>{try{const n=L.transaction(q,"readwrite");n.objectStore(q).add(s),n.oncomplete=()=>e(),n.onerror=()=>t(n.error)}catch(n){console.error("Logger: Failed to save log",n),e()}})}async function ve(s,e,t){const n=oe({type:"request",provider:s,model:e,promptLength:t});return await ce(n),n}async function be(s,e,t,n,i){const r=oe({type:"response",provider:s,model:e,responseLength:t,tokens:n,durationMs:i});await ce(r)}async function ie(s,e,t,n){const i=oe({type:"error",provider:s,model:e,error:t,durationMs:n});await ce(i)}async function qt(s,e="",t=""){const n=oe({type:"skip",provider:e,model:t,error:null,durationMs:0});n.principleId=s,await ce(n)}async function _t(){return!L||!L.objectStoreNames.contains(q)?[]:new Promise(s=>{try{const n=L.transaction(q,"readonly").objectStore(q).getAll();n.onsuccess=()=>s(n.result||[]),n.onerror=()=>s([])}catch(e){console.error("Logger: Failed to get logs",e),s([])}})}async function Re(){return!L||!L.objectStoreNames.contains(q)?0:new Promise(s=>{try{const n=L.transaction(q,"readonly").objectStore(q).count();n.onsuccess=()=>s(n.result||0),n.onerror=()=>s(0)}catch{s(0)}})}async function Bt(){const s=await _t();return s.sort((e,t)=>new Date(e.timestamp)-new Date(t.timestamp)),s.map(e=>JSON.stringify(e)).join(`
`)}async function Ht(){const s=await Bt(),e=new Blob([s],{type:"application/jsonl"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`promptcoach-logs-${new Date().toISOString().split("T")[0]}.jsonl`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(t)}const xe="promptcoach",Ft=7;let P=null;const Oe=["sessions","logs","history","promptHistory","attachments"];async function T(){if(P){const s=Oe.filter(e=>!P.objectStoreNames.contains(e));if(s.length===0)return P;console.warn("IndexedDB missing stores:",s,"- resetting database"),P.close(),P=null,await $t()}return new Promise((s,e)=>{const t=indexedDB.open(xe,Ft);t.onerror=()=>e(t.error),t.onsuccess=()=>{P=t.result;const n=Oe.filter(i=>!P.objectStoreNames.contains(i));if(n.length>0){console.warn("IndexedDB still missing stores after open:",n,"- deleting and retrying"),P.close(),P=null,indexedDB.deleteDatabase(xe),setTimeout(()=>{T().then(s).catch(e)},100);return}It(P),s(P)},t.onupgradeneeded=n=>{const i=n.target.result;if(i.objectStoreNames.contains("sessions")){const r=n.target.transaction;if(r){const a=r.objectStore("sessions");a.indexNames.contains("archivedAt")||a.createIndex("archivedAt","archivedAt",{unique:!1}),a.indexNames.contains("starred")||a.createIndex("starred","starred",{unique:!1})}}else{const r=i.createObjectStore("sessions",{keyPath:"id"});r.createIndex("createdAt","createdAt",{unique:!1}),r.createIndex("updatedAt","updatedAt",{unique:!1}),r.createIndex("archivedAt","archivedAt",{unique:!1}),r.createIndex("starred","starred",{unique:!1})}if(i.objectStoreNames.contains("logs")){const r=n.target.transaction;if(r){const a=r.objectStore("logs");a.indexNames.contains("sessionId")||a.createIndex("sessionId","sessionId",{unique:!1})}}else{const r=i.createObjectStore("logs",{keyPath:"id"});r.createIndex("timestamp","timestamp",{unique:!1}),r.createIndex("type","type",{unique:!1}),r.createIndex("provider","provider",{unique:!1}),r.createIndex("sessionId","sessionId",{unique:!1})}if(!i.objectStoreNames.contains("history")){const r=i.createObjectStore("history",{keyPath:"id"});r.createIndex("sessionId","sessionId",{unique:!1}),r.createIndex("timestamp","timestamp",{unique:!1}),r.createIndex("type","type",{unique:!1})}if(i.objectStoreNames.contains("promptHistory")||i.createObjectStore("promptHistory",{keyPath:"id"}),!i.objectStoreNames.contains("attachments")){const r=i.createObjectStore("attachments",{keyPath:"id"});r.createIndex("addedAt","addedAt",{unique:!1}),r.createIndex("filename","filename",{unique:!1})}}})}function $t(){return new Promise(s=>{const e=indexedDB.deleteDatabase(xe);e.onsuccess=()=>s(),e.onerror=()=>s(),e.onblocked=()=>{console.warn("IndexedDB delete blocked - close other tabs"),s()}})}async function j(s,e){const t=await T();return new Promise((n,i)=>{const o=t.transaction(s,"readonly").objectStore(s).get(e);o.onerror=()=>i(o.error),o.onsuccess=()=>n(o.result)})}async function A(s,e){const t=await T();return new Promise((n,i)=>{const o=t.transaction(s,"readwrite").objectStore(s).put(e);o.onerror=()=>i(o.error),o.onsuccess=()=>n()})}async function Z(s){const e=await T();return new Promise((t,n)=>{const a=e.transaction(s,"readonly").objectStore(s).getAll();a.onerror=()=>n(a.error),a.onsuccess=()=>t(a.result)})}async function qe(s,e){const t=await T();return new Promise((n,i)=>{const o=t.transaction(s,"readwrite").objectStore(s).delete(e);o.onerror=()=>i(o.error),o.onsuccess=()=>n()})}async function Dt(s){const e=await T();return new Promise((t,n)=>{const a=e.transaction(s,"readwrite").objectStore(s).clear();a.onerror=()=>n(a.error),a.onsuccess=()=>t()})}const pt="promptcoach_appstate",te="promptcoach_settings",ht="promptcoach_current_session",ze={currentTab:"prompt",firstRunCompleted:!1,feedbackPanelPinned:!1,feedbackPanelRatio:.5},X={theme:"system",apiKeys:{openai:null,anthropic:null,google:null,x:null},coachProvider:"openai",coachModel:null,testProvider:"openai",testModel:null,coachingMode:"beginner"};function le(){try{const s=localStorage.getItem(pt);if(s)return{...ze,...JSON.parse(s)}}catch(s){console.error("Failed to load AppState:",s)}return{...ze}}function Rt(s){try{["prompt","history","attachments"].includes(s.currentTab)||(s.currentTab="prompt"),(s.feedbackPanelRatio<.2||s.feedbackPanelRatio>.8)&&(s.feedbackPanelRatio=.5),localStorage.setItem(pt,JSON.stringify(s))}catch(e){console.error("Failed to save AppState:",e)}}function F(s,e){const t=le();return t[s]=e,Rt(t),t}function R(){var s;try{const e=localStorage.getItem(te);if(e){const t=JSON.parse(e);return t.apiKey&&!((s=t.apiKeys)!=null&&s.openai)&&(t.apiKeys=t.apiKeys||{},t.apiKeys.openai=t.apiKey,delete t.apiKey,localStorage.setItem(te,JSON.stringify(t)),console.log("Settings: Migrated legacy apiKey to apiKeys.openai")),t.model&&!t.testModel&&(t.testModel=t.model,t.coachModel=t.model,delete t.model,localStorage.setItem(te,JSON.stringify(t)),console.log("Settings: Migrated legacy model to testModel/coachModel")),{...X,...t,apiKeys:{...X.apiKeys,...t.apiKeys}}}}catch(e){console.error("Failed to load Settings:",e)}return{...X,apiKeys:{...X.apiKeys}}}function mt(s){try{["system","light","dark"].includes(s.theme)||(s.theme="system");const t=["openai","anthropic","google","x"];t.includes(s.coachProvider)||(s.coachProvider="openai"),t.includes(s.testProvider)||(s.testProvider="openai"),localStorage.setItem(te,JSON.stringify(s))}catch(e){console.error("Failed to save Settings:",e)}}function ut(s,e){const t=R();return s==="apiKeys"?t.apiKeys={...t.apiKeys,...e}:t[s]=e,mt(t),t}function we(){const s=R();return Object.values(s.apiKeys).some(e=>e&&e.trim()!=="")}function B(){try{const s=localStorage.getItem(ht);if(s)return JSON.parse(s).sessionId}catch(s){console.error("Failed to load current session ID:",s)}return null}function ft(s){try{localStorage.setItem(ht,JSON.stringify({sessionId:s}))}catch(e){console.error("Failed to save current session ID:",e)}}async function yt(){const s={id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),promptText:"",promptHistory:[],results:[],totalTokens:0,lastScore:null,lastDescription:null,feedbackCount:0};return await A("sessions",s),ft(s.id),s}async function N(){await T();const s=B();if(s){const e=await j("sessions",s);if(e)return e}return yt()}async function _(s){const t={...await N(),...s,updatedAt:new Date().toISOString()};return await A("sessions",t),t}let me=null;function ue(s){me&&clearTimeout(me),me=setTimeout(async()=>{await _({promptText:s})},500)}async function _e(){return(await N()).results||[]}async function gt(){return _({results:[],totalTokens:0})}function Ot(s={}){return{id:crypto.randomUUID(),sessionId:B(),timestamp:new Date().toISOString(),promptSnapshot:s.promptSnapshot||"",scores:s.scores||[],overall:s.overall||0,description:s.description||"",feedback:s.feedback||"",provider:s.provider||"",model:s.model||"",durationMs:s.durationMs||0,targetPrinciple:s.targetPrinciple||null,complete:s.complete||!1}}function zt(s={}){return{id:crypto.randomUUID(),sessionId:B(),timestamp:new Date().toISOString(),type:"feedback",promptSnapshot:s.promptSnapshot||"",scores:s.scores||[],overall:s.overall||0,description:s.description||"",feedback:s.feedback||"",provider:s.provider||"",model:s.model||"",durationMs:s.durationMs||0,targetPrinciple:s.targetPrinciple||null,complete:s.complete||!1}}function jt(s={}){return{id:crypto.randomUUID(),sessionId:B(),timestamp:new Date().toISOString(),type:"result",promptSnapshot:s.promptSnapshot||"",responseText:s.responseText||"",status:s.status||"streaming",error:s.error||null,tokens:s.tokens||{prompt:0,completion:0,total:0},provider:s.provider||"",model:s.model||"",durationMs:s.durationMs||0}}function Zt(s={}){return{id:crypto.randomUUID(),sessionId:B(),timestamp:new Date().toISOString(),type:"prompt-change",newPromptText:s.newPromptText||""}}async function Ce(s){await T();try{await A("history",s)}catch(e){throw console.error("Failed to save history entry:",e),e}if(s.type==="feedback"){const e=await N();await _({lastScore:s.overall,lastDescription:s.description,feedbackCount:(e.feedbackCount||0)+1})}return s}async function Kt(){await T();const s=B();if(!s)return[];try{return(await Z("history")).filter(t=>t.sessionId===s).sort((t,n)=>new Date(t.timestamp)-new Date(n.timestamp))}catch(e){return console.error("Failed to get history:",e),[]}}async function je(s,e){await T();try{const t=await j("history",s);if(!t)throw new Error(`History entry not found: ${s}`);const n={...t,...e};return await A("history",n),n}catch(t){throw console.error("Failed to update history entry:",t),t}}async function Ut(s){const t=(await N()).lastRecordedPrompt||"";return s.trim()!==t.trim()}async function Ze(s){if(await Ut(s)){const t=Zt({newPromptText:s});return await Ce(t),await _({lastRecordedPrompt:s.trim()}),t}return null}async function Gt(s){await T();try{await A("feedback",s)}catch(t){console.warn("Failed to save feedback to IndexedDB - DB may need upgrade. Clear site data to fix.",t)}const e=await N();return await _({lastScore:s.overall,lastDescription:s.description,feedbackCount:(e.feedbackCount||0)+1}),s}async function de(){await T();const s=B();if(!s)return[];try{return(await Z("feedback")).filter(t=>t.sessionId===s).sort((t,n)=>new Date(n.timestamp)-new Date(t.timestamp))}catch(e){return console.warn("Failed to get feedback from IndexedDB - DB may need upgrade.",e),[]}}async function vt(){await T();const s=B();if(!s)return;const t=(await Z("feedback")).filter(n=>n.sessionId===s);for(const n of t)await qe("feedback",n.id);await _({lastScore:null,lastDescription:null,feedbackCount:0})}const Ke="data-theme";function Te(s){const e=document.documentElement;s==="system"?e.removeAttribute(Ke):e.setAttribute(Ke,s);const t=document.querySelector('meta[name="theme-color"]');if(t){const n=s==="dark"||s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches;t.setAttribute("content",n?"#1C1B1F":"#6750A4")}}function Yt(s){ut("theme",s),Te(s)}function Vt(){const s=R();Te(s.theme),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{R().theme==="system"&&Te("system")})}class Wt{constructor(){this.element=null,this.ringEl=null,this.scoreEl=null,this.score=null,this.description=null,this.onClick=null}render(){this.element=document.createElement("div"),this.element.className="score-badge",this.element.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    `,this.element.title="Not evaluated",this.element.addEventListener("click",()=>{this.onClick&&this.onClick()});const e=document.createElement("div");e.style.cssText=`
      position: relative;
      width: 32px;
      height: 32px;
    `;const t=document.createElementNS("http://www.w3.org/2000/svg","svg");t.setAttribute("width","32"),t.setAttribute("height","32"),t.setAttribute("viewBox","0 0 36 36"),t.style.cssText="transform: rotate(-90deg);";const n=document.createElementNS("http://www.w3.org/2000/svg","circle");return n.setAttribute("cx","18"),n.setAttribute("cy","18"),n.setAttribute("r","16"),n.setAttribute("fill","none"),n.setAttribute("stroke","var(--pc-surface-container-high)"),n.setAttribute("stroke-width","4"),t.appendChild(n),this.ringEl=document.createElementNS("http://www.w3.org/2000/svg","circle"),this.ringEl.setAttribute("cx","18"),this.ringEl.setAttribute("cy","18"),this.ringEl.setAttribute("r","16"),this.ringEl.setAttribute("fill","none"),this.ringEl.setAttribute("stroke","var(--pc-primary)"),this.ringEl.setAttribute("stroke-width","4"),this.ringEl.setAttribute("stroke-linecap","round"),this.ringEl.setAttribute("stroke-dasharray","100.53"),this.ringEl.setAttribute("stroke-dashoffset","100.53"),this.ringEl.style.cssText="transition: stroke-dashoffset 500ms ease-out;",t.appendChild(this.ringEl),e.appendChild(t),this.scoreEl=document.createElement("div"),this.scoreEl.style.cssText=`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--pc-on-surface);
    `,this.scoreEl.textContent="—",e.appendChild(this.scoreEl),this.element.appendChild(e),this.element}setScore(e,t){this.score=e,this.description=t,this.scoreEl.textContent=Math.round(e);const i=100.53*(1-e/100);this.ringEl.setAttribute("stroke-dashoffset",i.toString()),e>=80?this.ringEl.setAttribute("stroke","var(--pc-primary)"):e>=60?this.ringEl.setAttribute("stroke","#F59E0B"):this.ringEl.setAttribute("stroke","#EF4444"),this.element.title=t||`Score: ${Math.round(e)}`}clear(){this.score=null,this.description=null,this.scoreEl.textContent="—",this.ringEl.setAttribute("stroke-dashoffset","100.53"),this.ringEl.setAttribute("stroke","var(--pc-primary)"),this.element.title="Not evaluated"}setOnClick(e){this.onClick=e}getScore(){return this.score}}const bt={prompt:"M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",attach:"M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z",activity:"M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z",coach:"M440-120v-80h320v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v244h-40q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H440Zm-80-280q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z",test:"M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z",newSession:"M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z",sessionHistory:"M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z",copyPrompt:"M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z",previewPrompt:"m640-360 120-120-42-43-48 48v-125h-60v125l-48-48-42 43 120 120ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Zm60-120h60v-180h40v120h60v-120h40v180h60v-200q0-17-11.5-28.5T440-600H260q-17 0-28.5 11.5T220-560v200Z",editPrompt:"M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z",settings:"m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z",install:"M320-120v-80H160q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h320v80H160v480h640v-120h80v120q0 33-23.5 56.5T800-200H640v80H320Zm360-280L480-600l56-56 104 103v-287h80v287l104-103 56 56-200 200Z",noActivityYet:"M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z",noAttachmentsYet:"M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z",noSessionsFound:"M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z",upload:"M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H520q-33 0-56.5-23.5T440-240v-206l-64 62-56-56 160-160 160 160-56 56-64-62v206h220q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h100v80H260Zm220-280Z",clearAll:"m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z",deleteSession:"m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z",delete:"m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z",menu:"M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"};function I(s,e=24){const t=bt[s];return t?`<svg width="${e}" height="${e}" viewBox="0 -960 960 960" fill="currentColor"><path d="${t}"/></svg>`:(console.warn(`Icon "${s}" not found`),"")}function Ue(s){return bt[s]||""}class Xt{constructor(e={}){this.onMenuClick=e.onMenuClick||null,this.onScoreClick=e.onScoreClick||null,this.element=null,this.scoreBadge=null}render(){this.element=document.createElement("header"),this.element.className="ribbon",this.element.style.cssText=`
      display: flex;
      align-items: center;
      height: 56px;
      padding: 0 var(--pc-space-2);
      background-color: var(--pc-primary);
      color: var(--pc-on-primary);
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 10;
    `;const e=document.createElement("button");e.setAttribute("aria-label","Open menu"),e.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: none;
      border: none;
      cursor: pointer;
      color: inherit;
      -webkit-tap-highlight-color: transparent;
    `,e.innerHTML=I("menu"),e.addEventListener("click",()=>{this.onMenuClick&&this.onMenuClick()}),this.element.appendChild(e);const t=document.createElement("h1");t.className="text-title-lg",t.style.cssText=`
      flex: 1;
      margin: 0 var(--pc-space-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,t.textContent="Prompt Coach",this.element.appendChild(t),this.scoreBadge=new Wt,this.scoreBadge.setOnClick(()=>{this.onScoreClick&&this.onScoreClick()});const n=document.createElement("div");return n.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      margin-right: var(--pc-space-2);
      background-color: var(--pc-surface);
      border-radius: 50%;
      overflow: visible;
    `,n.appendChild(this.scoreBadge.render()),this.element.appendChild(n),this.loadPersistedScore(),this.element}async loadPersistedScore(){try{const e=await N();e.lastScore!==null&&e.lastScore!==void 0&&this.scoreBadge.setScore(e.lastScore,e.lastDescription||"")}catch(e){console.warn("Ribbon: Failed to load persisted score",e)}}updateScore(e,t){e===null?this.scoreBadge.clear():this.scoreBadge.setScore(e,t)}getScoreBadge(){return this.scoreBadge}}const Jt=[{id:"prompt",label:"Prompt",icon:"prompt"},{id:"attachments",label:"Attach",icon:"attach"},{id:"activity",label:"Activity",icon:"activity"}];class Qt{constructor(e={}){this.currentTab=e.currentTab||"prompt",this.onTabChange=e.onTabChange||null,this.element=null,this.tabButtons={}}render(){return this.element=document.createElement("nav"),this.element.className="tab-bar",this.element.setAttribute("role","tablist"),this.element.style.cssText=`
      display: flex;
      justify-content: center;
      gap: var(--pc-space-6);
      height: 64px;
      background-color: var(--pc-surface);
      border-top: 1px solid var(--pc-outline-variant);
      flex-shrink: 0;
    `,Jt.forEach(e=>{const t=this.createTabButton(e);this.tabButtons[e.id]=t,this.element.appendChild(t)}),this.updateActiveTab(),this.element}createTabButton(e){const t=document.createElement("button");t.className="tab-button",t.setAttribute("role","tab"),t.setAttribute("aria-selected",e.id===this.currentTab),t.setAttribute("aria-controls",`${e.id}-panel`),t.style.cssText=`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: var(--pc-space-2) var(--pc-space-4);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--pc-on-surface-variant);
      transition: color var(--pc-duration-fast) var(--pc-easing);
      min-width: 64px;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    `;const n=document.createElement("span");n.className="tab-icon",n.innerHTML=I(e.icon);const i=document.createElement("span");return i.className="tab-label",i.style.cssText="font-size: 0.75rem; font-weight: 500;",i.textContent=e.label,t.appendChild(n),t.appendChild(i),t.addEventListener("click",()=>this.selectTab(e.id)),t}selectTab(e){this.currentTab!==e&&(this.currentTab=e,this.updateActiveTab(),this.onTabChange&&this.onTabChange(e))}updateActiveTab(){Object.entries(this.tabButtons).forEach(([e,t])=>{const n=e===this.currentTab;t.setAttribute("aria-selected",n),t.style.color=n?"var(--pc-primary)":"var(--pc-on-surface-variant)"})}setActiveTab(e){this.currentTab=e,this.updateActiveTab()}}let H=null;const en=3e3;function tn(){return H||(H=document.createElement("div"),H.className="toast-container",H.setAttribute("role","status"),H.setAttribute("aria-live","polite"),document.body.appendChild(H)),H}function f(s,e=en){const t=tn(),n=document.createElement("div");n.className="toast",n.textContent=s,t.appendChild(n);const i=setTimeout(()=>{Ge(n)},e);return n.addEventListener("click",()=>{clearTimeout(i),Ge(n)}),n}function Ge(s){s.classList.add("toast-exit"),s.addEventListener("animationend",()=>{s.parentNode&&s.parentNode.removeChild(s)})}function nn(){f("Coming soon")}class pe{constructor(e={}){this.title=e.title||"",this.onClose=e.onClose||null,this.element=null,this.overlay=null,this.handleKeyDown=this.handleKeyDown.bind(this),this.previousActiveElement=null}render(){this.overlay=document.createElement("div"),this.overlay.className="overlay",this.overlay.addEventListener("click",n=>{n.target===this.overlay&&this.close()}),this.element=document.createElement("div"),this.element.className="dialog",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","dialog-title");const e=document.createElement("div");e.className="dialog-header";const t=document.createElement("h2");return t.id="dialog-title",t.className="dialog-title",t.textContent=this.title,e.appendChild(t),this.content=document.createElement("div"),this.content.className="dialog-content",this.actions=document.createElement("div"),this.actions.className="dialog-actions",this.element.appendChild(e),this.element.appendChild(this.content),this.element.appendChild(this.actions),this.overlay.appendChild(this.element),this.overlay}setContent(e){typeof e=="string"?this.content.innerHTML=e:(this.content.innerHTML="",this.content.appendChild(e))}addAction(e,t,n="text"){const i=document.createElement("button");return i.className=`btn btn-${n}`,i.textContent=e,i.addEventListener("click",t),this.actions.appendChild(i),i}handleKeyDown(e){if(e.key==="Escape"){this.close();return}e.key==="Tab"&&this.handleTabKey(e)}handleTabKey(e){const t=this.element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t.length===0)return;const n=t[0],i=t[t.length-1];e.shiftKey?document.activeElement===n&&(e.preventDefault(),i.focus()):document.activeElement===i&&(e.preventDefault(),n.focus())}show(){this.overlay||this.render(),this.previousActiveElement=document.activeElement,document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeyDown);const e=this.element.querySelector("button, input, textarea, select");e&&e.focus()}close(){document.removeEventListener("keydown",this.handleKeyDown),this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay),this.previousActiveElement&&this.previousActiveElement.focus&&this.previousActiveElement.focus(),this.onClose&&this.onClose()}}const Y=class Y{static getModels(){return[]}static getDefaultModel(){const e=this.getModels();return e.length>0?e[0].id:""}constructor(e,t){if(new.target===Y)throw new Error("LLMProvider is abstract and cannot be instantiated directly");if(!e)throw new Error("API key is required");if(!t)throw new Error("Model is required");this.apiKey=e,this.model=t}getProviderName(){return this.constructor.displayName}getProviderId(){return this.constructor.id}getModelName(){return this.model}async*streamCompletion(e,t={}){throw new Error("Must implement streamCompletion()")}};S(Y,"id","base"),S(Y,"displayName","Base Provider");let z=Y;const E={INVALID_API_KEY:"invalid_api_key",RATE_LIMITED:"rate_limited",NETWORK_ERROR:"network_error",SERVER_ERROR:"server_error",TIMEOUT:"timeout",STREAM_INTERRUPTED:"stream_interrupted",INVALID_RESPONSE:"invalid_response",UNKNOWN:"unknown",COACH_VALIDATION_FAILED:"coach_validation_failed",COACH_METHODOLOGY_MISSING:"coach_methodology_missing",COACH_EVALUATION_FAILED:"coach_evaluation_failed"},Ye={[E.INVALID_API_KEY]:"Invalid API key. Check Settings.",[E.RATE_LIMITED]:"Rate limit exceeded. Try again later.",[E.NETWORK_ERROR]:"Network error. Check connection.",[E.SERVER_ERROR]:"Server error. Try again later.",[E.TIMEOUT]:"Request timed out. Try again.",[E.STREAM_INTERRUPTED]:"Response interrupted.",[E.INVALID_RESPONSE]:"Invalid response from provider.",[E.UNKNOWN]:"An unexpected error occurred.",[E.COACH_VALIDATION_FAILED]:"Coach couldn't evaluate. Try again.",[E.COACH_METHODOLOGY_MISSING]:"Coaching methodology not configured.",[E.COACH_EVALUATION_FAILED]:"Coach couldn't evaluate. Try again."};class w extends Error{constructor(e,t=E.UNKNOWN,n=!1,i={}){super(e),this.name="LLMError",this.code=t,this.retryable=n,this.details=i,this.userMessage=Ye[t]||Ye[E.UNKNOWN]}static fromHttpStatus(e,t="",n=null){switch(e){case 401:return new w(`Authentication failed: ${t}`,E.INVALID_API_KEY,!1,{status:e,body:n});case 429:return new w(`Rate limit exceeded: ${t}`,E.RATE_LIMITED,!0,{status:e,body:n});case 500:case 502:case 503:case 504:return new w(`Server error: ${e} ${t}`,E.SERVER_ERROR,!0,{status:e,body:n});default:return new w(`HTTP error: ${e} ${t}`,E.UNKNOWN,!1,{status:e,body:n})}}static fromNetworkError(e){return e.name==="AbortError"?new w("Request was aborted",E.TIMEOUT,!0,{originalError:e.message}):new w(`Network error: ${e.message}`,E.NETWORK_ERROR,!0,{originalError:e.message})}static streamInterrupted(e="Unknown"){return new w(`Stream interrupted: ${e}`,E.STREAM_INTERRUPTED,!1,{reason:e})}}const Ve="https://api.openai.com/v1/chat/completions";class Ee extends z{static getModels(){return[{id:"gpt-4o",name:"GPT-4o",description:"Most capable, 128K context"},{id:"gpt-4o-mini",name:"GPT-4o Mini",description:"Fast and affordable"},{id:"gpt-4-turbo",name:"GPT-4 Turbo",description:"128K context"},{id:"gpt-4",name:"GPT-4",description:"8K context"},{id:"gpt-3.5-turbo",name:"GPT-3.5 Turbo",description:"Fast, 16K context"},{id:"o1",name:"o1",description:"Reasoning model"},{id:"o1-mini",name:"o1 Mini",description:"Fast reasoning"}]}constructor(e,t="gpt-4o-mini"){super(e,t)}async*streamCompletion(e,t={}){var d,y;const{maxTokens:n=2048,temperature:i=.7,systemPrompt:r=null}=t,a=[];r&&a.push({role:"system",content:r}),a.push({role:"user",content:e});const o={model:this.model,messages:a,max_tokens:n,temperature:i,stream:!0,stream_options:{include_usage:!0}};console.log("OpenAI: Sending request to",Ve,"with model:",this.model);let l;try{l=await fetch(Ve,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(o)})}catch(u){throw console.error("OpenAI: Network error",u),w.fromNetworkError(u)}if(console.log("OpenAI: Response status",l.status),!l.ok){let u=null;try{u=await l.json(),console.error("OpenAI: Error response",u)}catch{}throw w.fromHttpStatus(l.status,l.statusText,u)}const c=l.body.getReader(),p=new TextDecoder;let m="",h=null;try{for(;;){const{done:u,value:g}=await c.read();if(u){yield{content:"",done:!0,usage:h};break}m+=p.decode(g,{stream:!0});const b=m.split(`
`);m=b.pop()||"";for(const v of b){const x=v.trim();if(!(!x||x==="data: [DONE]")&&x.startsWith("data: "))try{const C=JSON.parse(x.slice(6)),k=(y=(d=C.choices)==null?void 0:d[0])==null?void 0:y.delta;k!=null&&k.content&&(yield{content:k.content,done:!1,usage:null}),C.usage&&(h={prompt:C.usage.prompt_tokens,completion:C.usage.completion_tokens,total:C.usage.total_tokens})}catch(C){console.warn("OpenAI: Failed to parse chunk",C)}}}}catch(u){throw u instanceof w?u:w.streamInterrupted(u.message)}finally{c.releaseLock()}}}S(Ee,"id","openai"),S(Ee,"displayName","OpenAI");const We="https://api.anthropic.com/v1/messages",sn="2023-06-01";class ke extends z{static getModels(){return[{id:"claude-sonnet-4-20250514",name:"Claude Sonnet 4",description:"Latest, most capable"},{id:"claude-3-5-sonnet-20241022",name:"Claude 3.5 Sonnet",description:"Best balance"},{id:"claude-3-5-haiku-20241022",name:"Claude 3.5 Haiku",description:"Fast and affordable"},{id:"claude-3-opus-20240229",name:"Claude 3 Opus",description:"Most capable (legacy)"},{id:"claude-3-sonnet-20240229",name:"Claude 3 Sonnet",description:"Balanced (legacy)"},{id:"claude-3-haiku-20240307",name:"Claude 3 Haiku",description:"Fast (legacy)"}]}constructor(e,t="claude-3-5-sonnet-20241022"){super(e,t)}async*streamCompletion(e,t={}){var h;const{maxTokens:n=2048,temperature:i=.7,systemPrompt:r=null}=t,a={model:this.model,max_tokens:n,stream:!0,messages:[{role:"user",content:e}]};r&&(a.system=r),this.model.includes("thinking")||(a.temperature=i),console.log("Anthropic: Sending request to",We,"with model:",this.model);let o;try{o=await fetch(We,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":this.apiKey,"anthropic-version":sn,"anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(a)})}catch(d){throw console.error("Anthropic: Network error",d),w.fromNetworkError(d)}if(console.log("Anthropic: Response status",o.status),!o.ok){let d=null;try{d=await o.json(),console.error("Anthropic: Error response",d)}catch{}throw w.fromHttpStatus(o.status,o.statusText,d)}const l=o.body.getReader(),c=new TextDecoder;let p="",m=null;try{for(;;){const{done:d,value:y}=await l.read();if(d){yield{content:"",done:!0,usage:m};break}p+=c.decode(y,{stream:!0});const u=p.split(`
`);p=u.pop()||"";for(const g of u){const b=g.trim();if(!(!b||!b.startsWith("data: ")))try{const v=JSON.parse(b.slice(6));if(v.type==="content_block_delta"){const x=v.delta;(x==null?void 0:x.type)==="text_delta"&&x.text&&(yield{content:x.text,done:!1,usage:null})}else v.type==="message_delta"?v.usage&&(m={prompt:v.usage.input_tokens||0,completion:v.usage.output_tokens||0,total:(v.usage.input_tokens||0)+(v.usage.output_tokens||0)}):v.type==="message_start"&&((h=v.message)!=null&&h.usage)&&(m={prompt:v.message.usage.input_tokens||0,completion:0,total:v.message.usage.input_tokens||0})}catch(v){console.warn("Anthropic: Failed to parse chunk",v)}}}}catch(d){throw d instanceof w?d:w.streamInterrupted(d.message)}finally{l.releaseLock()}}}S(ke,"id","anthropic"),S(ke,"displayName","Anthropic");const rn="https://generativelanguage.googleapis.com/v1beta/models";class Se extends z{static getModels(){return[{id:"gemini-2.0-flash",name:"Gemini 2.0 Flash",description:"Latest, fastest"},{id:"gemini-1.5-pro",name:"Gemini 1.5 Pro",description:"Most capable"},{id:"gemini-1.5-flash",name:"Gemini 1.5 Flash",description:"Fast and efficient"},{id:"gemini-pro",name:"Gemini Pro",description:"Balanced (legacy)"}]}constructor(e,t="gemini-1.5-flash"){super(e,t)}async*streamCompletion(e,t={}){var b;const{maxTokens:n=2048,temperature:i=.7,systemPrompt:r=null}=t,a=[],o=r?{parts:[{text:r}]}:void 0;a.push({role:"user",parts:[{text:e}]});const l={contents:a,generationConfig:{maxOutputTokens:n,temperature:i}};o&&(l.systemInstruction=o);const c=`${rn}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;console.log("Google: Sending request with model:",this.model);let p;try{p=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(l)})}catch(v){throw console.error("Google: Network error",v),w.fromNetworkError(v)}if(console.log("Google: Response status",p.status),!p.ok){let v=null;try{v=await p.json(),console.error("Google: Error response",v)}catch{}throw w.fromHttpStatus(p.status,p.statusText,v)}const m=p.body.getReader(),h=new TextDecoder;let d="",y=null,u=0,g=0;try{for(;;){const{done:v,value:x}=await m.read();if(v){y={prompt:u,completion:g,total:u+g},yield{content:"",done:!0,usage:y};break}d+=h.decode(x,{stream:!0});const C=d.split(`
`);d=C.pop()||"";for(const k of C){const K=k.trim();if(!(!K||!K.startsWith("data: ")))try{const M=JSON.parse(K.slice(6)),Pt=M.candidates||[];for(const At of Pt){const Nt=((b=At.content)==null?void 0:b.parts)||[];for(const De of Nt)De.text&&(yield{content:De.text,done:!1,usage:null})}M.usageMetadata&&(u=M.usageMetadata.promptTokenCount||u,g=M.usageMetadata.candidatesTokenCount||g)}catch(M){console.warn("Google: Failed to parse chunk",M)}}}}catch(v){throw v instanceof w?v:w.streamInterrupted(v.message)}finally{m.releaseLock()}}}S(Se,"id","google"),S(Se,"displayName","Google");const Xe="https://api.x.ai/v1/chat/completions";class Pe extends z{static getModels(){return[{id:"grok-3",name:"Grok 3",description:"Latest, most capable"},{id:"grok-3-fast",name:"Grok 3 Fast",description:"Faster responses"},{id:"grok-2",name:"Grok 2",description:"Balanced performance"},{id:"grok-2-mini",name:"Grok 2 Mini",description:"Fast and efficient"}]}constructor(e,t="grok-2"){super(e,t)}async*streamCompletion(e,t={}){var d,y;const{maxTokens:n=2048,temperature:i=.7,systemPrompt:r=null}=t,a=[];r&&a.push({role:"system",content:r}),a.push({role:"user",content:e});const o={model:this.model,messages:a,max_tokens:n,temperature:i,stream:!0};console.log("X/Grok: Sending request to",Xe,"with model:",this.model);let l;try{l=await fetch(Xe,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(o)})}catch(u){throw console.error("X/Grok: Network error",u),w.fromNetworkError(u)}if(console.log("X/Grok: Response status",l.status),!l.ok){let u=null;try{u=await l.json(),console.error("X/Grok: Error response",u)}catch{}throw w.fromHttpStatus(l.status,l.statusText,u)}const c=l.body.getReader(),p=new TextDecoder;let m="",h=null;try{for(;;){const{done:u,value:g}=await c.read();if(u){yield{content:"",done:!0,usage:h};break}m+=p.decode(g,{stream:!0});const b=m.split(`
`);m=b.pop()||"";for(const v of b){const x=v.trim();if(!(!x||x==="data: [DONE]")&&x.startsWith("data: "))try{const C=JSON.parse(x.slice(6)),k=(y=(d=C.choices)==null?void 0:d[0])==null?void 0:y.delta;k!=null&&k.content&&(yield{content:k.content,done:!1,usage:null}),C.usage&&(h={prompt:C.usage.prompt_tokens,completion:C.usage.completion_tokens,total:C.usage.total_tokens})}catch(C){console.warn("X/Grok: Failed to parse chunk",C)}}}}catch(u){throw u instanceof w?u:w.streamInterrupted(u.message)}finally{c.releaseLock()}}}S(Pe,"id","x"),S(Pe,"displayName","X (Grok)");const J={OPENAI:"openai",ANTHROPIC:"anthropic",GOOGLE:"google",X:"x"},Be={[J.OPENAI]:Ee,[J.ANTHROPIC]:ke,[J.GOOGLE]:Se,[J.X]:Pe};function an(){return Object.values(Be).map(s=>({id:s.id,name:s.displayName,models:s.getModels(),defaultModel:s.getDefaultModel()}))}function xt(s,e,t=null){const n=s==null?void 0:s.toLowerCase(),i=Be[n];if(!i)throw new w(`Unknown provider type: ${s}`,E.UNKNOWN,!1);const r=t||i.getDefaultModel();return new i(e,r)}function Je(s){const e=Be[s==null?void 0:s.toLowerCase()];return e?e.getModels():[]}const fe=an();class on extends pe{constructor(){super({title:"Settings"}),this.settings=R(),this.apiKeyInputs={}}createContent(){const e=document.createElement("div");return e.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-6);",e.appendChild(this.createThemeSection()),e.appendChild(this.createCoachingModeSection()),e.appendChild(this.createCoachLLMSection()),e.appendChild(this.createTestLLMSection()),e.appendChild(this.createApiKeysSection()),e.appendChild(this.createExportLogsSection()),e}createThemeSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Theme",e.appendChild(t);const n=document.createElement("div");return n.style.cssText="display: flex; gap: var(--pc-space-3);",["system","light","dark"].forEach(i=>{const r=document.createElement("label");r.style.cssText=`
        display: flex;
        align-items: center;
        gap: var(--pc-space-2);
        cursor: pointer;
        padding: var(--pc-space-2);
      `;const a=document.createElement("input");a.type="radio",a.name="theme",a.value=i,a.checked=this.settings.theme===i,a.addEventListener("change",()=>{this.settings.theme=i,Yt(i)});const o=document.createElement("span");o.className="text-body",o.textContent=i.charAt(0).toUpperCase()+i.slice(1),r.appendChild(a),r.appendChild(o),n.appendChild(r)}),e.appendChild(n),e}createCoachingModeSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Coaching Style",e.appendChild(t);const n=document.createElement("div");return n.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-2);",[{id:"beginner",name:"Beginner",description:"Detailed explanations of concepts, how AI works, and why techniques matter"},{id:"experienced",name:"Experienced",description:"Concise feedback focused on specific improvements"}].forEach(r=>{const a=document.createElement("label");a.style.cssText=`
        display: flex;
        align-items: flex-start;
        gap: var(--pc-space-2);
        cursor: pointer;
        padding: var(--pc-space-2);
        border-radius: var(--pc-radius-sm);
        transition: background 150ms ease;
      `,a.addEventListener("mouseenter",()=>{a.style.background="var(--pc-surface-container)"}),a.addEventListener("mouseleave",()=>{a.style.background="transparent"});const o=document.createElement("input");o.type="radio",o.name="coachingMode",o.value=r.id,o.checked=(this.settings.coachingMode||"beginner")===r.id,o.style.cssText="margin-top: 3px;",o.addEventListener("change",()=>{this.settings.coachingMode=r.id});const l=document.createElement("div"),c=document.createElement("span");c.className="text-body",c.style.cssText="font-weight: 500;",c.textContent=r.name,l.appendChild(c);const p=document.createElement("div");p.className="text-body",p.style.cssText="font-size: 0.8rem; color: var(--pc-on-surface-variant); margin-top: 2px;",p.textContent=r.description,l.appendChild(p),a.appendChild(o),a.appendChild(l),n.appendChild(a)}),e.appendChild(n),e}createCoachLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Coach LLM",e.appendChild(t);const n=document.createElement("p");n.className="text-body",n.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-2); font-size: 0.85rem;",n.textContent="Model used for prompt evaluation and feedback.",e.appendChild(n);const i=document.createElement("div");i.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const r=document.createElement("div");r.style.cssText="flex: 1; min-width: 140px;";const a=document.createElement("label");a.className="text-label",a.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",a.textContent="Provider",r.appendChild(a),this.coachProviderSelect=document.createElement("select"),this.coachProviderSelect.className="input",this.coachProviderSelect.style.cssText="width: 100%;",fe.forEach(c=>{const p=document.createElement("option");p.value=c.id,p.textContent=c.name,this.coachProviderSelect.appendChild(p)}),this.coachProviderSelect.value=this.settings.coachProvider||"openai",this.coachProviderSelect.addEventListener("change",()=>{this.settings.coachProvider=this.coachProviderSelect.value,this.updateCoachModelOptions()}),r.appendChild(this.coachProviderSelect),i.appendChild(r);const o=document.createElement("div");o.style.cssText="flex: 2; min-width: 200px;";const l=document.createElement("label");return l.className="text-label",l.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",l.textContent="Model",o.appendChild(l),this.coachModelSelect=document.createElement("select"),this.coachModelSelect.className="input",this.coachModelSelect.style.cssText="width: 100%;",this.coachModelSelect.addEventListener("change",()=>{this.settings.coachModel=this.coachModelSelect.value}),o.appendChild(this.coachModelSelect),i.appendChild(o),e.appendChild(i),this.updateCoachModelOptions(),e}updateCoachModelOptions(){const e=this.coachProviderSelect.value,t=Je(e);this.coachModelSelect.innerHTML="",t.forEach(i=>{const r=document.createElement("option");r.value=i.id,r.textContent=i.name,i.description&&(r.title=i.description),this.coachModelSelect.appendChild(r)});const n=t.map(i=>i.id);this.settings.coachModel&&n.includes(this.settings.coachModel)?this.coachModelSelect.value=this.settings.coachModel:t.length>0&&(this.coachModelSelect.value=t[0].id,this.settings.coachModel=t[0].id)}createTestLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Test LLM",e.appendChild(t);const n=document.createElement("div");n.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 140px;";const r=document.createElement("label");r.className="text-label",r.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",r.textContent="Provider",i.appendChild(r),this.testProviderSelect=document.createElement("select"),this.testProviderSelect.className="input",this.testProviderSelect.style.cssText="width: 100%;",fe.forEach(l=>{const c=document.createElement("option");c.value=l.id,c.textContent=l.name,this.testProviderSelect.appendChild(c)}),this.testProviderSelect.value=this.settings.testProvider||"openai",this.testProviderSelect.addEventListener("change",()=>{this.settings.testProvider=this.testProviderSelect.value,this.updateModelOptions()}),i.appendChild(this.testProviderSelect),n.appendChild(i);const a=document.createElement("div");a.style.cssText="flex: 2; min-width: 200px;";const o=document.createElement("label");return o.className="text-label",o.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",o.textContent="Model",a.appendChild(o),this.testModelSelect=document.createElement("select"),this.testModelSelect.className="input",this.testModelSelect.style.cssText="width: 100%;",this.testModelSelect.addEventListener("change",()=>{this.settings.testModel=this.testModelSelect.value}),a.appendChild(this.testModelSelect),n.appendChild(a),e.appendChild(n),this.updateModelOptions(),e}updateModelOptions(){const e=this.testProviderSelect.value,t=Je(e);this.testModelSelect.innerHTML="",t.forEach(i=>{const r=document.createElement("option");r.value=i.id,r.textContent=i.name,i.description&&(r.title=i.description),this.testModelSelect.appendChild(r)});const n=t.map(i=>i.id);this.settings.testModel&&n.includes(this.settings.testModel)?this.testModelSelect.value=this.settings.testModel:t.length>0&&(this.testModelSelect.value=t[0].id,this.settings.testModel=t[0].id)}createApiKeysSection(){const e=document.createElement("div"),t=document.createElement("div");t.style.cssText="margin-bottom: var(--pc-space-3);";const n=document.createElement("h3");n.className="text-title",n.textContent="API Keys",t.appendChild(n);const i=document.createElement("p");i.className="text-body",i.style.cssText="color: var(--pc-on-surface-variant); margin-top: var(--pc-space-1);",i.textContent="⚠️ Keys are stored locally on your device.",t.appendChild(i),e.appendChild(t);const r=document.createElement("div");return r.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-3);",fe.forEach(a=>{const o=document.createElement("div"),l=document.createElement("label");l.className="text-label",l.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",l.textContent=a.name,o.appendChild(l);const c=document.createElement("input");c.type="password",c.className="input",c.placeholder=`Enter ${a.name} API key`,c.value=this.settings.apiKeys[a.id]||"",c.autocomplete="off",c.addEventListener("input",p=>{this.settings.apiKeys[a.id]=p.target.value.trim()||null}),this.apiKeyInputs[a.id]=c,o.appendChild(c),r.appendChild(o)}),e.appendChild(r),e}createExportLogsSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Agent Logs",e.appendChild(t);const n=document.createElement("p");n.className="text-body",n.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-3); font-size: 0.85rem;",n.textContent="Export all agent interactions for debugging or analysis.",e.appendChild(n);const i=document.createElement("div");i.style.cssText="display: flex; align-items: center; gap: var(--pc-space-3);";const r=document.createElement("button");return r.className="btn btn-outlined",r.style.cssText="min-height: 40px;",r.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: var(--pc-space-2);">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      Export Logs
    `,r.addEventListener("click",async()=>{const a=await Re();if(a===0){f("No logs to export");return}await Ht(),f(`Exported ${a} log entries`)}),i.appendChild(r),this.logCountEl=document.createElement("span"),this.logCountEl.className="text-body",this.logCountEl.style.cssText="color: var(--pc-on-surface-variant); font-size: 0.85rem;",this.logCountEl.textContent="Loading...",i.appendChild(this.logCountEl),e.appendChild(i),this.updateLogCount(),e}async updateLogCount(){const e=await Re();this.logCountEl&&(e===0?this.logCountEl.textContent="No logs yet":this.logCountEl.textContent=`${e} log${e!==1?"s":""} stored`)}show(){this.render(),this.setContent(this.createContent()),this.addAction("Cancel",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show()}save(){mt(this.settings),f("Settings saved"),this.close()}}let $=null,Ae=[];function cn(){window.addEventListener("beforeinstallprompt",s=>{s.preventDefault(),$=s,Ae.forEach(e=>e(!0))}),window.addEventListener("appinstalled",()=>{$=null,Ae.forEach(s=>s(!1))})}function He(){return $!==null}async function ln(){if(!$)return!1;$.prompt();const{outcome:s}=await $.userChoice;return $=null,s==="accepted"}function dn(s){Ae.push(s),s(He())}const Ne={"text/plain":".txt","text/markdown":".md","application/json":".json",".txt":"text/plain",".md":"text/markdown",".json":"application/json"},pn=[".txt",".md",".json"],wt=102400,hn=5e4,G={UNSUPPORTED_TYPE:"UNSUPPORTED_TYPE",SIZE_EXCEEDED:"SIZE_EXCEEDED",EMPTY_FILE:"EMPTY_FILE",READ_ERROR:"READ_ERROR"};function Fe(s){if(!s)return"";const e=s.lastIndexOf(".");return e===-1?"":s.slice(e).toLowerCase()}function mn(s){if(s.type&&Ne[s.type])return!0;const e=Fe(s.name);return pn.includes(e)}function un(s){if(s.type&&Ne[s.type])return s.type;const e=Fe(s.name);return Ne[e]||e}function fn(s,e=wt){if(!mn(s))return{valid:!1,error:`Unsupported file type: ${Fe(s.name)||s.type||"unknown"}. Supported: .txt, .md, .json`,errorCode:G.UNSUPPORTED_TYPE};if(s.size>e){const t=Math.round(e/1024);return{valid:!1,error:`File too large: ${Math.round(s.size/1024)}KB (limit: ${t}KB)`,errorCode:G.SIZE_EXCEEDED}}return s.size===0?{valid:!1,error:"File is empty",errorCode:G.EMPTY_FILE}:{valid:!0}}function yn(s){return new Promise((e,t)=>{const n=new FileReader;n.onload=()=>e(n.result),n.onerror=()=>t(new Error(`Failed to read file: ${s.name}`)),n.readAsText(s)})}function gn(s){return s<1024?`${s} B`:s<1024*1024?`${(s/1024).toFixed(1)} KB`:`${(s/(1024*1024)).toFixed(1)} MB`}class ne extends Error{constructor(e,t,n){super(e),this.name="AttachmentError",this.code=t,this.filename=n}}async function vn(s,e=wt){const t=fn(s,e);if(!t.valid)throw new ne(t.error,t.errorCode,s.name);let n;try{n=await yn(s)}catch{throw new ne(`Failed to read file: ${s.name}`,G.READ_ERROR,s.name)}if(!n||n.trim()==="")throw new ne("File is empty",G.EMPTY_FILE,s.name);const i={id:crypto.randomUUID(),filename:s.name,content:n,size:s.size,type:un(s),addedAt:new Date().toISOString()};return await T(),await A("attachments",i),i}async function he(){return await T(),(await Z("attachments")).sort((e,t)=>new Date(t.addedAt).getTime()-new Date(e.addedAt).getTime())}async function bn(s){return await T(),await j("attachments",s)?(await qe("attachments",s),!0):!1}async function re(){await T();const e=(await Z("attachments")).length;return await Dt("attachments"),e}async function Qe(s=hn){const e=await he();if(e.length===0)return{context:"",truncated:!1,count:0};const t=[];let n=0,i=!1;for(const r of e){const a=`--- Attached File: ${r.filename} ---`,o=`--- End of ${r.filename} ---`,l=a.length+o.length+4;if(n+l+r.content.length>s){const c=s-n-l-50;if(c>100){const p=r.content.slice(0,c);t.push(`${a}
${p}
[... content truncated ...]
${o}`),i=!0}break}t.push(`${a}
${r.content}
${o}`),n+=l+r.content.length}return{context:t.join(`

`),truncated:i,count:e.length}}let Me=null,Le=null,V=null;function xn(s){Me=s}function wn(s){Le=s}function Cn(s){V=s}function et(){return crypto.randomUUID()}async function $e(){const s=await N(),e=await de(),t=await _e(),n=await he(),i=s.promptText&&s.promptText.trim().length>0,r=e.length>0,a=t.length>0,o=n.length>0;return i||r||a||o}async function Tn(){var o,l;const s=await N();if(!s.restoredFromId)return!0;const e=await Et(s.restoredFromId);if(!e)return!0;const t=await de(),n=await _e(),i=(s.promptText||"")!==(e.prompt||""),r=t.length!==(((o=e.feedbackHistory)==null?void 0:o.length)||0),a=n.length!==(((l=e.results)==null?void 0:l.length)||0);return i||r||a}async function En(){const s=await N(),e=await de(),t=await _e(),n=await he(),i=s.promptText||"",r=i.substring(0,100).trim();let a=null,o=null;return e.length>0&&(a=e[0].overall,o=e[0].description),{id:s.id,createdAt:new Date(s.createdAt).getTime(),archivedAt:Date.now(),prompt:i,previewText:r||"(empty prompt)",feedbackHistory:e,results:t,attachmentIds:n.map(l=>l.id),finalScore:a,finalDescription:o,starred:!1}}async function Ct(){if(!await $e())return null;if(!await Tn())return console.log("Skipping archive: restored session has no modifications"),null;const t=await En();try{await A("sessions",t)}catch(n){throw n.name==="QuotaExceededError"||n.message&&n.message.includes("quota")?new Error("Storage quota exceeded. Please delete some old sessions from History to free up space."):n}return console.log(`Session archived: ${t.id}`),t.id}async function kn(){await vt(),await gt(),await re(),await yt(),Me&&Me()}async function Tt(s={}){const{skipConfirmation:e=!1}=s,t=await $e();return t&&!e&&V&&!await V("Start New Session?","Your current session will be saved to history. You can restore it later from the History menu.")?!1:(t&&await Ct(),await kn(),!0)}async function Sn(s={}){const{starredOnly:e=!1,searchQuery:t="",limit:n=50}=s;await T();let r=(await Z("sessions")).filter(a=>a.archivedAt);if(e&&(r=r.filter(a=>a.starred)),t.trim()){const a=t.toLowerCase();r=r.filter(o=>o.previewText&&o.previewText.toLowerCase().includes(a)||o.prompt&&o.prompt.toLowerCase().includes(a))}return r.sort((a,o)=>o.archivedAt-a.archivedAt),r=r.slice(0,n),r.map(a=>{var o,l;return{id:a.id,archivedAt:a.archivedAt,previewText:a.previewText||"(empty prompt)",finalScore:a.finalScore,starred:a.starred||!1,feedbackCount:((o=a.feedbackHistory)==null?void 0:o.length)||0,resultCount:((l=a.results)==null?void 0:l.length)||0}})}async function Et(s){await T();const e=await j("sessions",s);return e&&e.archivedAt?e:null}async function Pn(s){const e=await Et(s);if(!e)throw new Error(`Session not found: ${s}`);await $e()&&await Ct(),await vt(),await gt(),await re();const n={id:et(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),promptText:e.prompt||"",promptHistory:[],results:[],totalTokens:0,lastScore:e.finalScore,lastDescription:e.finalDescription,feedbackCount:0,restoredFromId:s};if(await A("sessions",n),ft(n.id),e.feedbackHistory&&e.feedbackHistory.length>0){for(const i of e.feedbackHistory){const r={...i,id:et(),sessionId:n.id};await A("feedback",r)}await _({feedbackCount:e.feedbackHistory.length,lastScore:e.finalScore,lastDescription:e.finalDescription})}e.results&&e.results.length>0&&await _({results:e.results}),Le&&Le({prompt:e.prompt,feedbackHistory:e.feedbackHistory,results:e.results,attachmentIds:e.attachmentIds,finalScore:e.finalScore,finalDescription:e.finalDescription})}async function An(s){await T();const e=await j("sessions",s);if(!e)throw new Error(`Session not found: ${s}`);return e.starred=!e.starred,await A("sessions",e),e.starred}async function Nn(s,e={}){const{skipConfirmation:t=!1}=e;return!t&&V&&!await V("Delete Session?","This session will be permanently deleted. This action cannot be undone.")?!1:(await T(),await qe("sessions",s),console.log(`Session deleted: ${s}`),!0)}class Mn extends pe{constructor(e={}){super(e),this.message=e.message||"",this.confirmLabel=e.confirmLabel||"Confirm",this.cancelLabel=e.cancelLabel||"Cancel",this.confirmVariant=e.confirmVariant||"filled",this.destructive=e.destructive||!1,this.resolvePromise=null}render(){super.render();const e=document.createElement("p");e.style.cssText=`
      color: var(--pc-on-surface-variant);
      line-height: 1.5;
      margin: 0 0 var(--pc-space-4) 0;
    `,e.textContent=this.message,this.setContent(e),this.addAction(this.cancelLabel,()=>{this.resolve(!1)},"text");const t=this.addAction(this.confirmLabel,()=>{this.resolve(!0)},this.confirmVariant);return this.destructive&&(t.style.backgroundColor="var(--pc-error, #EF4444)",t.style.color="white"),this.overlay}resolve(e){this.resolvePromise&&(this.resolvePromise(e),this.resolvePromise=null),this.close()}async prompt(){return new Promise(e=>{this.resolvePromise=e,this.show()})}close(){this.resolvePromise&&(this.resolvePromise(!1),this.resolvePromise=null),super.close()}}async function kt(s,e,t={}){return new Mn({title:s,message:e,...t}).prompt()}class Ln{constructor(e={}){this.onClose=e.onClose||null,this.onNewSession=e.onNewSession||null,this.onShowHistory=e.onShowHistory||null,this.onCopyPrompt=e.onCopyPrompt||null,this.onTogglePreview=e.onTogglePreview||null,this.isPreviewMode=!1,this.element=null,this.backdrop=null,this.isOpen=!1,Cn((t,n)=>kt(t,n))}render(){const e=document.createElement("div");e.className="menu-container",e.style.cssText="position: fixed; inset: 0; z-index: var(--pc-z-overlay); pointer-events: none;",this.backdrop=document.createElement("div"),this.backdrop.className="menu-backdrop",this.backdrop.style.cssText=`
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.4);
      opacity: 0;
      transition: opacity var(--pc-duration-normal) var(--pc-easing);
      pointer-events: none;
    `,this.backdrop.addEventListener("click",()=>this.hide()),e.appendChild(this.backdrop),this.element=document.createElement("aside"),this.element.className="menu-panel",this.element.setAttribute("role","navigation"),this.element.setAttribute("aria-label","Main menu"),this.element.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      max-width: 80vw;
      background-color: var(--pc-surface);
      box-shadow: none;
      transform: translateX(-100%);
      transition: transform var(--pc-duration-normal) var(--pc-easing);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    `;const t=document.createElement("div");t.style.cssText=`
      position: relative;
      aspect-ratio: 1 / 1;
      width: 100%;
      background-image: url('./assets/icons/PromptCoach.png');
      background-image: image-set(
        url('./assets/icons/PromptCoach.webp') type('image/webp'),
        url('./assets/icons/PromptCoach.png') type('image/png')
      );
      background-size: cover;
      background-position: center;
      border-bottom: 1px solid var(--pc-outline);
      display: flex;
      align-items: flex-end;
    `;const n=document.createElement("h2");n.textContent="Prompt Coach",n.style.cssText=`
      width: 100%;
      padding: var(--pc-space-3) var(--pc-space-6);
      color: var(--pc-primary);
      font-size: 0.875rem;
      text-align: center;
      margin: 0;
    `,t.appendChild(n),this.element.appendChild(t);const i=document.createElement("ul");return i.style.cssText="list-style: none; padding: var(--pc-space-2) 0; flex: 1;",[{label:"New Session",icon:"newSession",action:()=>this.handleNewSession()},{label:"Session History",icon:"sessionHistory",action:()=>this.handleShowHistory()},{separator:!0},{label:"Copy Prompt",icon:"copyPrompt",action:()=>this.handleCopyPrompt()},{label:this.isPreviewMode?"Edit Prompt":"Preview Prompt",icon:this.isPreviewMode?"editPrompt":"previewPrompt",action:()=>this.handleTogglePreview(),id:"preview-toggle-item"},{separator:!0},{label:"Settings",icon:"settings",action:()=>this.openSettings()},{label:"Install App",icon:"install",action:()=>this.handleInstall(),id:"install-item",hidden:!He()}].forEach(a=>{if(a.separator){const c=document.createElement("li");c.style.cssText=`
          height: 1px;
          background-color: var(--pc-outline-variant);
          margin: var(--pc-space-2) var(--pc-space-6);
        `,i.appendChild(c);return}const o=document.createElement("li");a.id&&(o.id=a.id),a.hidden&&(o.style.display="none");const l=document.createElement("button");l.className="menu-item",l.style.cssText=`
        display: flex;
        align-items: center;
        gap: var(--pc-space-4);
        width: 100%;
        padding: var(--pc-space-3) var(--pc-space-6);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--pc-on-surface);
        font-size: 0.875rem;
        text-align: left;
        min-height: 44px;
        transition: background-color var(--pc-duration-fast) var(--pc-easing);
      `,l.innerHTML=`${I(a.icon)}<span>${a.label}</span>`,l.addEventListener("click",()=>{a.action(),this.hide()}),l.addEventListener("mouseenter",()=>{l.style.backgroundColor="var(--pc-surface-variant)"}),l.addEventListener("mouseleave",()=>{l.style.backgroundColor="transparent"}),o.appendChild(l),i.appendChild(o)}),dn(a=>{const o=document.getElementById("install-item");o&&(o.style.display=a?"block":"none")}),this.element.appendChild(i),e.appendChild(this.element),e}async handleNewSession(){try{await Tt()&&(f("New session started"),this.onNewSession&&this.onNewSession())}catch(e){console.error("Failed to start new session:",e),f(e.message||"Failed to start new session","error")}}handleShowHistory(){this.onShowHistory?this.onShowHistory():nn()}handleCopyPrompt(){this.onCopyPrompt&&this.onCopyPrompt()}handleTogglePreview(){this.isPreviewMode=!this.isPreviewMode,this.updatePreviewToggleItem(),this.onTogglePreview&&this.onTogglePreview(this.isPreviewMode)}updatePreviewToggleItem(){const e=document.getElementById("preview-toggle-item");if(e){const t=e.querySelector("button");if(t){const n=this.isPreviewMode?"Edit Prompt":"Preview Prompt",i=this.isPreviewMode?"editPrompt":"previewPrompt";t.innerHTML=`${I(i)}<span>${n}</span>`}}}setPreviewMode(e){this.isPreviewMode=e,this.updatePreviewToggleItem()}async handleInstall(){await ln()&&f("App installed successfully!")}openSettings(){new on().show()}show(){this.isOpen=!0,this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.element.style.transform="translateX(0)",this.element.style.boxShadow="var(--pc-shadow-lg)"}hide(){this.isOpen&&(this.isOpen=!1,this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",this.element.style.transform="translateX(-100%)",this.element.style.boxShadow="none")}toggle(){this.isOpen?this.hide():this.show()}}const In="modulepreload",qn=function(s,e){return new URL(s,e).href},tt={},Ie=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){const a=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),l=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));i=Promise.allSettled(t.map(c=>{if(c=qn(c,n),c in tt)return;tt[c]=!0;const p=c.endsWith(".css"),m=p?'[rel="stylesheet"]':"";if(!!n)for(let y=a.length-1;y>=0;y--){const u=a[y];if(u.href===c&&(!p||u.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${m}`))return;const d=document.createElement("link");if(d.rel=p?"stylesheet":In,p||(d.as="script"),d.crossOrigin="",d.href=c,l&&d.setAttribute("nonce",l),document.head.appendChild(d),p)return new Promise((y,u)=>{d.addEventListener("load",y),d.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return i.then(a=>{for(const o of a||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})},ye="promptcoach_skipped_principles",ae={get(){try{return JSON.parse(sessionStorage.getItem(ye)||"[]")}catch{return[]}},add(s){const e=this.get();return e.includes(s)||(e.push(s),sessionStorage.setItem(ye,JSON.stringify(e))),e},has(s){return this.get().includes(s)},clear(){sessionStorage.removeItem(ye)},count(){return this.get().length}};function D(s){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return s.replace(/[&<>"']/g,t=>e[t])}function se(s,e,t,n){const i=[];let r=e;for(;r<s.length;){const a=s[r];if(a.trim()==="")break;const o=a.match(/^(\s*)/);if((o?o[1].length:0)<t&&i.length>0)break;const c=a.match(/^(\s*)[\*\-]\s+(.+)$/),p=a.match(/^(\s*)\d+\.\s+(.+)$/);if(c&&c[1].length===t){const h={content:c[2],children:null,childType:null};if(r+1<s.length){const d=s[r+1],y=d.match(/^(\s*)/),u=y?y[1].length:0,g=d.match(/^(\s*)[\*\-]\s+/),b=d.match(/^(\s*)\d+\.\s+/);if((g||b)&&u>t){const v=g?"ul":"ol",x=se(s,r+1,u);h.children=x.items,h.childType=v,r=x.endIdx}else r++}else r++;i.push(h)}else if(p&&p[1].length===t){const h={content:p[2],children:null,childType:null};if(r+1<s.length){const d=s[r+1],y=d.match(/^(\s*)/),u=y?y[1].length:0,g=d.match(/^(\s*)[\*\-]\s+/),b=d.match(/^(\s*)\d+\.\s+/);if((g||b)&&u>t){const v=g?"ul":"ol",x=se(s,r+1,u);h.children=x.items,h.childType=v,r=x.endIdx}else r++}else r++;i.push(h)}else if((c||p)&&(c?c[1].length:p[1].length)>t){const m=c?c[1].length:p[1].length,h=c?"ul":"ol",d=se(s,r,m);i.length>0&&(i[i.length-1].children=d.items,i[i.length-1].childType=h),r=d.endIdx}else break}return{items:i,endIdx:r}}function St(s,e){const t=e,n=s.map(i=>{let r=`<li>${O(D(i.content))}`;return i.children&&i.children.length>0&&(r+=St(i.children,i.childType||e)),r+="</li>",r}).join("");return`<${t}>${n}</${t}>`}function _n(s,e){if(e>=s.length)return null;const t=s[e];if(!t.includes("|"))return null;const n=t.split("|").map(o=>o.trim()).filter(o=>o);if(e+1>=s.length||!s[e+1].match(/^\|?[\s\-:|]+\|?$/))return null;const r=[];let a=e+2;for(;a<s.length;){const o=s[a];if(!o.includes("|")||o.trim()==="")break;const l=o.split("|").map(c=>c.trim()).filter(c=>c!=="");r.push(l),a++}return{table:{headers:n,rows:r},endIdx:a}}function W(s){if(!s||typeof s!="string")return"";const e=s.split(`
`),t=[];let n=[],i=!1,r="",a=0,o=[];for(let c=0;c<e.length;c++){const p=e[c],m=p.trim();if(m.startsWith("```"))if(i)if(m.length>3){a++,n.push(p);continue}else if(a>0){a--,n.push(p);continue}else{t.push({type:"code",lang:r,content:n.join(`
`)}),n=[],i=!1,r="";continue}else{n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]),i=!0,r=m.slice(3).trim(),a=0;continue}if(i){n.push(p);continue}const d=p.match(/^(#{1,6})\s+(.+)$/);if(d){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]),t.push({type:"header",level:d[1].length,content:d[2]});continue}if(p.includes("|")&&c+1<e.length&&e[c+1].match(/^\|?[\s\-:|]+\|?$/)){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]);const b=_n(e,c);if(b){t.push({type:"table",...b.table}),c=b.endIdx-1;continue}}const y=p.match(/^(\s*)[\*\-]\s+(.+)$/),u=p.match(/^(\s*)\d+\.\s+(.+)$/);if(y||u){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]);const b=y?y[1].length:u[1].length,v=y?"ul":"ol",x=se(e,c,b);t.push({type:"list",listType:v,items:x.items}),c=x.endIdx-1;continue}if(p.match(/^---+$/)){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]),t.push({type:"hr"});continue}const g=p.match(/^>\s*(.*)$/);if(g){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),o.push(g[1]);continue}if(o.length>0&&(t.push({type:"blockquote",content:o.join(`
`)}),o=[]),p.trim()===""){n.length>0&&(t.push({type:"paragraph",content:n.join(`
`)}),n=[]),t.push({type:"empty"});continue}n.push(p)}return o.length>0&&t.push({type:"blockquote",content:o.join(`
`)}),n.length>0&&t.push({type:"paragraph",content:n.join(`
`)}),t.map(c=>{switch(c.type){case"header":return`<h${c.level}>${O(D(c.content))}</h${c.level}>`;case"paragraph":const p=O(D(c.content));return p?`<p>${p}</p>`:"";case"empty":return'<p class="empty-line">&nbsp;</p>';case"list":return St(c.items,c.listType);case"table":return Bn(c.headers,c.rows);case"code":return`<pre><code class="language-${c.lang}">${D(c.content)}</code></pre>`;case"blockquote":return`<blockquote>${O(D(c.content))}</blockquote>`;case"hr":return"<hr>";default:return""}}).filter(Boolean).join("")}function Bn(s,e){const t=s.map(i=>`<th>${O(D(i))}</th>`).join(""),n=e.map(i=>`<tr>${i.map(a=>`<td>${O(D(a))}</td>`).join("")}</tr>`).join("");return`<table><thead><tr>${t}</tr></thead><tbody>${n}</tbody></table>`}function O(s){let e=s;return e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/___(.+?)___/g,"<strong><em>$1</em></strong>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/_(.+?)_/g,"<em>$1</em>"),e=e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width: 100%;">'),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'),e}let Q=null;async function Hn(){if(Q)return Q;try{return Q=(await Ie(()=>import("./principles-Nr9ahyFn.js"),[],import.meta.url)).default,Q}catch(s){return console.warn("Could not load principles for tooltips:",s),null}}function Fn(s){return s?s.split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" "):""}class $n{constructor(e={}){this.element=null,this.backdrop=null,this.contentEl=null,this.feedbackEntry=null,this.isVisible=!1,this.isPinned=!1,this.isLoading=!1,this.isStreaming=!1,this.streamedText="",this.rawBuffer="",this.inFeedbackField=!1,this.feedbackFieldComplete=!1,this.ratio=.3,this.onClose=e.onClose||null,this.onPin=e.onPin||null,this.onSkipContinue=e.onSkipContinue||null,this.onNewSession=e.onNewSession||null,this.skipBtn=null,this.gotItBtn=null,this.streamingContainer=null}render(){this.backdrop=document.createElement("div"),this.backdrop.className="feedback-backdrop",this.backdrop.style.cssText=`
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease;
      z-index: 999;
    `,this.backdrop.addEventListener("click",()=>this.hide()),this.element=document.createElement("div"),this.element.className="feedback-panel",this.element.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      max-height: 60vh;
      background: var(--pc-surface);
      border-bottom: 1px solid var(--pc-outline-variant);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-100%);
      transition: transform 300ms ease-out;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;const e=this.createHeader();this.element.appendChild(e),this.contentEl=document.createElement("div"),this.contentEl.className="feedback-content",this.contentEl.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: var(--pc-space-4);
    `,this.element.appendChild(this.contentEl);const t=this.createFooter();return this.element.appendChild(t),this.divider=this.createDivider(),this.element.appendChild(this.divider),this.loadPersistedState(),this.element}createDivider(){const e=document.createElement("div");e.className="feedback-divider",e.style.cssText=`
      display: none;
      position: absolute;
      bottom: -12px;
      left: 0;
      right: 0;
      height: 24px;
      cursor: ns-resize;
      background: transparent;
      z-index: 10;
    `;const t=document.createElement("div");t.style.cssText=`
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 6px;
      background: var(--pc-outline);
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    `,e.appendChild(t);let n=!1,i=0,r=0;const a=c=>{n=!0,i=c.clientY,r=this.ratio,document.body.style.cursor="ns-resize",document.body.style.userSelect="none",c.preventDefault()},o=c=>{if(!n)return;const m=(c.clientY-i)/window.innerHeight;this.setRatio(r+m)},l=()=>{n&&(n=!1,document.body.style.cursor="",document.body.style.userSelect="")};return e.addEventListener("mousedown",a),document.addEventListener("mousemove",o),document.addEventListener("mouseup",l),e.addEventListener("touchstart",c=>{n=!0,i=c.touches[0].clientY,r=this.ratio,c.preventDefault()}),document.addEventListener("touchmove",c=>{if(!n)return;const m=(c.touches[0].clientY-i)/window.innerHeight;this.setRatio(r+m)}),document.addEventListener("touchend",()=>{n=!1}),e}createHeader(){const e=document.createElement("div");e.className="feedback-header",e.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--pc-space-3) var(--pc-space-4);
      border-bottom: 1px solid var(--pc-outline-variant);
      background: var(--pc-surface-container);
    `;const t=document.createElement("h3");t.className="text-title",t.style.cssText="margin: 0; font-size: 1rem;",t.textContent="Coach Feedback",e.appendChild(t);const n=document.createElement("div");n.style.cssText="display: flex; gap: var(--pc-space-2);",this.pinBtn=document.createElement("button"),this.pinBtn.className="icon-btn",this.pinBtn.setAttribute("aria-label","Pin panel"),this.pinBtn.style.cssText=`
      background: none;
      border: none;
      padding: var(--pc-space-2);
      cursor: pointer;
      color: var(--pc-on-surface-variant);
      border-radius: var(--pc-radius-full);
      transition: background 150ms ease;
    `,this.pinBtn.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
      </svg>
    `,this.pinBtn.addEventListener("click",()=>this.togglePin()),n.appendChild(this.pinBtn);const i=document.createElement("button");return i.className="icon-btn",i.setAttribute("aria-label","Close panel"),i.style.cssText=this.pinBtn.style.cssText,i.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `,i.addEventListener("click",()=>this.hide(!0)),n.appendChild(i),e.appendChild(n),e}createFooter(){const e=document.createElement("div");return e.className="feedback-footer",e.style.cssText=`
      padding: var(--pc-space-3) var(--pc-space-4);
      border-top: 1px solid var(--pc-outline-variant);
      display: flex;
      justify-content: flex-end;
      gap: var(--pc-space-2);
    `,this.skipBtn=document.createElement("button"),this.skipBtn.className="btn btn-outlined skip-continue-btn",this.skipBtn.textContent="Skip & Continue",this.skipBtn.style.cssText=`
      padding: var(--pc-space-2) var(--pc-space-4);
      background: transparent;
      color: var(--pc-primary);
      border: 1px solid var(--pc-outline);
      border-radius: var(--pc-radius-md);
      font-weight: 500;
      cursor: pointer;
      transition: background 150ms ease, opacity 150ms ease;
    `,this.skipBtn.addEventListener("click",()=>this.handleSkipContinue()),e.appendChild(this.skipBtn),this.gotItBtn=document.createElement("button"),this.gotItBtn.className="btn btn-filled",this.gotItBtn.textContent="Got It",this.gotItBtn.style.cssText=`
      padding: var(--pc-space-2) var(--pc-space-4);
      background: var(--pc-primary);
      color: var(--pc-on-primary);
      border: none;
      border-radius: var(--pc-radius-md);
      font-weight: 500;
      cursor: pointer;
    `,this.gotItBtn.addEventListener("click",()=>this.handleGotItClick()),e.appendChild(this.gotItBtn),e}handleGotItClick(){var t;((t=this.feedbackEntry)==null?void 0:t.complete)===!0&&(ae.clear(),this.onNewSession&&this.onNewSession(),this.element.dispatchEvent(new CustomEvent("new-session",{bubbles:!0}))),this.hide(!0)}handleSkipContinue(){if(this.isLoading||!this.feedbackEntry)return;const e=this.feedbackEntry.targetPrinciple;if(!e){console.warn("No targetPrinciple to skip");return}this.skipPromptSnapshot=this.feedbackEntry.promptSnapshot,ae.add(e),qt(e),this.setLoading(!0),this.onSkipContinue&&this.onSkipContinue(e),this.element.dispatchEvent(new CustomEvent("skip-continue",{bubbles:!0,detail:{principleId:e}}))}hasPromptChangedDuringSkip(e){return this.isLoading&&this.skipPromptSnapshot&&this.skipPromptSnapshot!==e}cancelSkipIfPromptChanged(e){return this.hasPromptChangedDuringSkip(e)?(this.setLoading(!1),this.skipPromptSnapshot=null,!0):!1}setLoading(e){this.isLoading=e,this.skipBtn&&(this.skipBtn.disabled=e,this.skipBtn.textContent=e?"Loading...":"Skip & Continue",this.skipBtn.style.opacity=e?"0.6":"1"),this.gotItBtn&&(this.gotItBtn.disabled=e,this.gotItBtn.style.opacity=e?"0.6":"1")}showStreaming(e={}){this.isStreaming=!0,this.streamedText="",this.rawBuffer="",this.inFeedbackField=!1,this.feedbackFieldComplete=!1,this.feedbackEntry=e,this.isPinned&&(this.isPinned=!1,this.pinBtn.style.color="var(--pc-on-surface-variant)",F("feedbackPanelPinned",!1),this.divider&&(this.divider.style.display="none"),this.onPin&&this.onPin(!1)),this.renderStreamingContent(),this.updateFooterForStreaming(!0),this.element.style.position="fixed",this.element.style.top="0",this.element.style.left="0",this.element.style.right="0",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.element.style.transform="translateY(0)",this.backdrop.style.display="block",this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.isVisible=!0}appendStreamingChunk(e){if(!this.isStreaming||this.feedbackFieldComplete)return;this.rawBuffer+=e;const t=this._extractFeedbackText();this.streamingContainer&&t&&(this.streamingContainer.textContent=t,this.streamingContainer.scrollTop=this.streamingContainer.scrollHeight)}_extractFeedbackText(){const e=this.rawBuffer;if(!this.inFeedbackField){const t=e.match(/"feedback"\s*:\s*"/);if(t){this.inFeedbackField=!0;const n=t.index+t[0].length;this.feedbackStartIndex=n}}if(this.inFeedbackField){let t=e.slice(this.feedbackStartIndex),n=-1,i=0;for(;i<t.length;){if(t[i]==="\\"&&i+1<t.length){i+=2;continue}if(t[i]==='"'){n=i,this.feedbackFieldComplete=!0;break}i++}n!==-1&&(t=t.slice(0,n));try{t=JSON.parse('"'+t.replace(/"/g,'\\"')+'"')}catch{t=t.replace(/\\n/g,`
`).replace(/\\t/g,"	").replace(/\\"/g,'"').replace(/\\\\/g,"\\")}return this.streamedText=t,t}return""}finalizeStreaming(e){this.isStreaming=!1,this.streamedText="",this.feedbackEntry=e,this.renderContent(e),this.updateFooterForComplete(e.complete,e.isHistorical),this.updateFooterForStreaming(!1)}renderStreamingContent(){this.contentEl.innerHTML="";const e=document.createElement("div");e.className="feedback-summary",e.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      margin-bottom: var(--pc-space-4);
      padding: var(--pc-space-3);
      background: var(--pc-surface-container);
      border-radius: var(--pc-radius-md);
    `;const t=document.createElement("div");t.style.cssText=`
      min-width: 48px;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--pc-outline);
      display: flex;
      align-items: center;
      justify-content: center;
    `,t.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--pc-on-surface-variant)" style="animation: pulse 1s infinite;">
        <circle cx="12" cy="12" r="3" opacity="0.3"/>
      </svg>
    `,e.appendChild(t);const n=document.createElement("div");n.style.cssText="flex: 1;";const i=document.createElement("div");i.className="text-label",i.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: 2px;",i.textContent="Analyzing prompt...",n.appendChild(i);const r=document.createElement("div");if(r.className="text-body",r.style.cssText="color: var(--pc-on-surface-variant);",r.textContent="Evaluating against methodology principles",n.appendChild(r),e.appendChild(n),this.contentEl.appendChild(e),this.streamingContainer=document.createElement("div"),this.streamingContainer.className="feedback-streaming-text",this.streamingContainer.style.cssText=`
      line-height: 1.6;
      color: var(--pc-on-surface);
      white-space: pre-wrap;
      word-break: break-word;
    `,this.contentEl.appendChild(this.streamingContainer),!document.getElementById("feedback-pulse-style")){const a=document.createElement("style");a.id="feedback-pulse-style",a.textContent="@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}",document.head.appendChild(a)}}updateFooterForStreaming(e){this.skipBtn&&(this.skipBtn.disabled=e,this.skipBtn.style.opacity=e?"0.5":"1",this.skipBtn.style.display=e?"none":"block"),this.gotItBtn&&(this.gotItBtn.disabled=e,this.gotItBtn.style.opacity=e?"0.5":"1",this.gotItBtn.textContent=e?"Analyzing...":"Got It")}show(e){this.feedbackEntry=e,this.isStreaming=!1,this.setLoading(!1),this.isPinned&&(this.isPinned=!1,this.pinBtn.style.color="var(--pc-on-surface-variant)",F("feedbackPanelPinned",!1),this.divider&&(this.divider.style.display="none"),this.onPin&&this.onPin(!1)),this.renderContent(e),this.updateFooterForComplete(e.complete,e.isHistorical),this.element.style.position="fixed",this.element.style.top="0",this.element.style.left="0",this.element.style.right="0",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.element.style.transform="translateY(0)",this.backdrop.style.display="block",this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.isVisible=!0}updateFooterForComplete(e,t=!1){this.skipBtn&&(this.skipBtn.style.display=e||t?"none":"block"),this.gotItBtn&&(this.gotItBtn.textContent=e&&!t?"Start New Session":"Got It")}hide(e=!1){this.isVisible&&(this.isPinned&&e&&(this.isPinned=!1,this.pinBtn.style.color="var(--pc-on-surface-variant)",F("feedbackPanelPinned",!1),this.divider&&(this.divider.style.display="none"),this.element.style.position="fixed",this.element.style.top="0",this.element.style.left="0",this.element.style.right="0",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.onPin&&this.onPin(!1)),this.backdrop.style.display="block",this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",(!this.isPinned||e)&&(this.element.style.transform="translateY(-100%)"),this.isVisible=!1,this.isStreaming=!1,this.streamedText="",this.rawBuffer="",this.inFeedbackField=!1,this.feedbackFieldComplete=!1,this.onClose&&this.onClose())}renderContent(e){this.contentEl.innerHTML="";const t=e.complete===!0,n=document.createElement("div");n.className="feedback-summary",n.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      margin-bottom: var(--pc-space-4);
      padding: var(--pc-space-3);
      background: ${t?"var(--pc-primary-container)":"var(--pc-surface-container)"};
      border-radius: var(--pc-radius-md);
      ${t?"border: 1px solid var(--pc-outline-variant);":""}
    `;const i=e.overall,r=i>=80?"var(--pc-primary)":i>=60?"#F59E0B":"#EF4444",a=document.createElement("div");a.style.cssText=`
      min-width: 48px;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      background: ${r};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
    `,a.textContent=i,n.appendChild(a);const o=document.createElement("div");o.style.cssText="flex: 1;";const l=document.createElement("div");l.className="text-label",l.style.cssText=`color: ${t?"var(--pc-primary)":"var(--pc-on-surface-variant)"}; margin-bottom: 2px; font-weight: ${t?"600":"400"};`,l.textContent=t?"Coaching Complete":"Overall Assessment",o.appendChild(l);const c=document.createElement("div");c.className="text-body",c.textContent=e.description,o.appendChild(c),n.appendChild(o),this.contentEl.appendChild(n);const p=document.createElement("div");if(p.className="feedback-text markdown-content",p.style.cssText=`
      line-height: 1.6;
      color: var(--pc-on-surface);
    `,p.innerHTML=W(e.feedback),this._applyMarkdownStyles(p),this.contentEl.appendChild(p),e.scores&&e.scores.length>0){const m=document.createElement("details");m.style.cssText="margin-top: var(--pc-space-4);";const h=document.createElement("summary");h.style.cssText=`
        cursor: pointer;
        color: var(--pc-primary);
        font-weight: 500;
        padding: var(--pc-space-2) 0;
      `,h.textContent="View all principle scores",m.appendChild(h);const d=document.createElement("div");d.style.cssText=`
        display: flex;
        flex-direction: column;
        gap: var(--pc-space-2);
        margin-top: var(--pc-space-2);
      `,Hn().then(y=>{const u=y?Object.fromEntries(y.principles.map(g=>[g.id,g])):{};e.scores.forEach(g=>{const b=u[g.principle],v=document.createElement("div");v.style.cssText=`
            display: flex;
            flex-direction: column;
            padding: var(--pc-space-2);
            background: var(--pc-surface-container);
            border-radius: var(--pc-radius-sm);
            ${g.applicable===!1?"opacity: 0.6;":""}
          `,b&&(v.title=b.description);const x=document.createElement("div");x.style.cssText=`
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;const C=document.createElement("span");C.style.cssText="font-weight: 500;",C.textContent=b?b.name:Fn(g.principle),x.appendChild(C);const k=document.createElement("span"),K=g.score>=80?"var(--pc-primary)":g.score>=60?"#F59E0B":"#EF4444";if(k.style.cssText=`
            font-weight: 600;
            color: ${K};
            min-width: 32px;
            text-align: right;
          `,k.textContent=g.score,g.applicable===!1&&(k.textContent+=" (n/a)"),x.appendChild(k),v.appendChild(x),g.reason){const M=document.createElement("div");M.style.cssText=`
              font-size: 0.8rem;
              color: var(--pc-on-surface-variant);
              margin-top: 4px;
            `,M.textContent=g.reason,v.appendChild(M)}d.appendChild(v)})}),m.appendChild(d),this.contentEl.appendChild(m)}}togglePin(){this.setPinned(!this.isPinned)}setPinned(e){this.isPinned=e,this.pinBtn.style.color=e?"var(--pc-primary)":"var(--pc-on-surface-variant)",e?(this.element.style.position="relative",this.element.style.transform="none",this.element.style.maxHeight=`${this.ratio*100}vh`,this.element.style.borderBottom="3px solid var(--pc-primary)",this.backdrop.style.display="none",this.divider&&(this.divider.style.display="block")):(this.element.style.position="fixed",this.element.style.transform=this.isVisible?"translateY(0)":"translateY(-100%)",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.backdrop.style.display="block",this.divider&&(this.divider.style.display="none")),F("feedbackPanelPinned",e),this.onPin&&this.onPin(e)}setRatio(e){this.ratio=Math.max(.15,Math.min(.7,e)),this.isPinned&&(this.element.style.maxHeight=`${this.ratio*100}vh`),F("feedbackPanelRatio",this.ratio)}loadPersistedState(){const e=le();this.isPinned=e.feedbackPanelPinned||!1,this.ratio=e.feedbackPanelRatio||.3,this.isPinned&&(this.pinBtn.style.color="var(--pc-primary)")}getBackdrop(){return this.backdrop}_applyMarkdownStyles(e){e.querySelectorAll("p").forEach(t=>{t.style.cssText="margin: 0 0 var(--pc-space-2) 0;"}),e.querySelectorAll("ul, ol").forEach(t=>{t.style.cssText="margin: 0 0 var(--pc-space-2) 0; padding-left: 1.5em;"}),e.querySelectorAll("li").forEach(t=>{t.style.cssText="margin-bottom: var(--pc-space-1);"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(t=>{t.style.cssText="margin: var(--pc-space-3) 0 var(--pc-space-2) 0;"}),e.querySelectorAll("code").forEach(t=>{var n;((n=t.parentElement)==null?void 0:n.tagName)!=="PRE"&&(t.style.cssText="background: var(--pc-surface-container); padding: 2px 4px; border-radius: 2px; font-size: 0.875em;")}),e.querySelectorAll("pre").forEach(t=>{t.style.cssText="background: var(--pc-surface-container); padding: var(--pc-space-2); border-radius: var(--pc-radius-sm); overflow-x: auto; margin: var(--pc-space-2) 0;"})}}const nt=["simple_query","complex_task","creative_task","high_stakes_task"];function st(s,e=null){const t=[];if(!s||typeof s!="object")return{valid:!1,errors:["Response must be a JSON object"]};if(s.scores?Array.isArray(s.scores)?s.scores.length===0&&t.push("scores array must not be empty"):t.push("scores must be an array"):t.push("Missing required field: scores"),(s.overall===void 0||s.overall===null)&&t.push("Missing required field: overall"),s.description||t.push("Missing required field: description"),s.feedback||t.push("Missing required field: feedback"),t.length>0)return{valid:!1,errors:t};if(typeof s.overall!="number"&&t.push("overall must be a number"),typeof s.description!="string"&&t.push("description must be a string"),typeof s.feedback!="string"&&t.push("feedback must be a string"),s.scores.forEach((n,i)=>{(!n.principle||typeof n.principle!="string")&&t.push(`scores[${i}].principle must be a non-empty string`),(n.score===void 0||typeof n.score!="number")&&t.push(`scores[${i}].score must be a number`),(!n.reason||typeof n.reason!="string")&&t.push(`scores[${i}].reason must be a non-empty string`)}),typeof s.overall=="number"&&(s.overall<0||s.overall>100)&&t.push("overall must be between 0 and 100"),s.scores.forEach((n,i)=>{typeof n.score=="number"&&(n.score<0||n.score>100)&&t.push(`scores[${i}].score must be between 0 and 100`)}),typeof s.description=="string"&&s.description.length>150&&t.push("description must be 150 characters or less"),typeof s.description=="string"&&s.description.trim()===""&&t.push("description must not be empty"),typeof s.feedback=="string"&&s.feedback.trim()===""&&t.push("feedback must not be empty"),s.complete===void 0&&(s.complete=!1),s.promptType!==void 0&&(typeof s.promptType!="string"?t.push("promptType must be a string"):nt.includes(s.promptType)||console.warn(`promptType "${s.promptType}" not in expected values: ${nt.join(", ")}`)),s.scores.forEach((n,i)=>{n.applicable!==void 0&&typeof n.applicable!="boolean"&&t.push(`scores[${i}].applicable must be a boolean`)}),!s.complete&&!s.targetPrinciple&&console.warn("targetPrinciple missing when not complete - using first low-scoring principle"),s.targetPrinciple!==void 0&&typeof s.targetPrinciple!="string"&&t.push("targetPrinciple must be a string"),s.complete!==void 0&&typeof s.complete!="boolean"&&t.push("complete must be a boolean"),e&&e.principles){const n=e.principles.map(i=>i.id);s.scores.forEach((i,r)=>{i.principle&&!n.includes(i.principle)&&console.warn(`scores[${r}].principle "${i.principle}" not in methodology`)}),s.targetPrinciple&&!n.includes(s.targetPrinciple)&&console.warn(`targetPrinciple "${s.targetPrinciple}" not in methodology`)}return{valid:t.length===0,errors:t}}let U=null,ge=null;class Dn{constructor(e,t,n){this.provider=xt(e,t,n),this.methodology=null,this.systemPrompt=null}async loadMethodology(){if(this.methodology)return this.methodology;if(!U)try{U=(await Ie(()=>import("./principles-Nr9ahyFn.js"),[],import.meta.url)).default}catch(e){throw console.error("Failed to load principles.json:",e),new Error("Coaching methodology not configured")}if(!U||!U.principles)throw new Error("Coaching methodology not configured");return this.methodology=U,this.methodology}async buildSystemPrompt(){if(this.systemPrompt)return this.systemPrompt;const e=await this.loadMethodology();if(!ge)try{ge=(await Ie(()=>import("./system-prompt-BPYbsUrj.js"),[],import.meta.url)).default}catch(n){throw console.error("Failed to load system-prompt.md:",n),new Error("Coaching methodology not configured")}const t=e.principles.map((n,i)=>`${i+1}. **${n.name}** (weight: ${n.weight}): ${n.description}`).join(`
`);return this.systemPrompt=ge.replace("{{PRINCIPLES}}",t),this.systemPrompt}async evaluate(e,t=[],n={}){const{attachmentContext:i="",attachmentsTruncated:r=!1,coachingMode:a="beginner",previousFeedback:o=null}=n,l=await this.buildSystemPrompt(),c=performance.now();let p=e.length;i&&(p+=i.length),await ve(this.provider.getProviderName(),this.provider.getModelName(),p);let m="";try{let h=e;if(i&&(h=`[ATTACHED CONTEXT${r?" (truncated)":""}]
${i}
[END ATTACHED CONTEXT]

${e}`),t.length>0&&(h=`${h}

[SKIPPED_PRINCIPLES: ${t.join(", ")}]`),a==="experienced"?h=`${h}

[COACHING_MODE: experienced - User is familiar with the methodology. Keep explanations brief and focus on specific improvements.]`:h=`${h}

[COACHING_MODE: beginner - User may be new to prompting. Explain concepts thoroughly, connect to how AI works, and provide detailed examples.]`,o){const g=this.buildIterationContext(o,e);h=`${h}

${g}`}for await(const g of this.provider.streamCompletion(h,{maxTokens:1024,temperature:.3,systemPrompt:l}))g.content&&(m+=g.content);const d=Math.round(performance.now()-c),y=this.parseResponse(m),u=st(y,this.methodology);if(!u.valid)throw new Error(`Invalid response: ${u.errors.join(", ")}`);return await be(this.provider.getProviderName(),this.provider.getModelName(),m.length,null,d),y}catch(h){const d=Math.round(performance.now()-c);throw await ie(this.provider.getProviderName(),this.provider.getModelName(),h.message||"Unknown error",d),h}}async*evaluateStreaming(e,t=[],n={}){const{attachmentContext:i="",attachmentsTruncated:r=!1,coachingMode:a="beginner",previousFeedback:o=null}=n,l=await this.buildSystemPrompt(),c=performance.now();let p=e.length;i&&(p+=i.length),await ve(this.provider.getProviderName(),this.provider.getModelName(),p);let m="";try{let h=e;if(i&&(h=`[ATTACHED CONTEXT${r?" (truncated)":""}]
${i}
[END ATTACHED CONTEXT]

${e}`),t.length>0&&(h=`${h}

[SKIPPED_PRINCIPLES: ${t.join(", ")}]`),a==="experienced"?h=`${h}

[COACHING_MODE: experienced - User is familiar with the methodology. Keep explanations brief and focus on specific improvements.]`:h=`${h}

[COACHING_MODE: beginner - User may be new to prompting. Explain concepts thoroughly, connect to how AI works, and provide detailed examples.]`,o){const g=this.buildIterationContext(o,e);h=`${h}

${g}`}for await(const g of this.provider.streamCompletion(h,{maxTokens:1024,temperature:.3,systemPrompt:l}))g.content&&(m+=g.content,yield{type:"chunk",content:g.content});const d=Math.round(performance.now()-c),y=this.parseResponse(m),u=st(y,this.methodology);if(!u.valid)throw new Error(`Invalid response: ${u.errors.join(", ")}`);await be(this.provider.getProviderName(),this.provider.getModelName(),m.length,null,d),yield{type:"complete",response:y,durationMs:d}}catch(h){const d=Math.round(performance.now()-c);throw await ie(this.provider.getProviderName(),this.provider.getModelName(),h.message||"Unknown error",d),h}}async evaluateWithRetry(e,t=[],n={}){try{return await this.evaluate(e,t,n)}catch(i){if(i instanceof w)throw i;console.warn("Coach: First attempt failed, retrying...",i.message);const r=`${e}

IMPORTANT: Please respond with valid JSON only, matching the exact schema specified.`;try{return await this.evaluate(r,t,n)}catch(a){throw console.error("Coach: Retry also failed",a.message),new Error("Coach couldn't evaluate. Try again.")}}}parseResponse(e){let t=e.trim();const n=t.match(/```(?:json)?\s*([\s\S]*?)```/);n&&(t=n[1].trim());const i=t.match(/\{[\s\S]*\}/);i&&(t=i[0]);try{return JSON.parse(t)}catch(r){throw new Error(`Failed to parse JSON response: ${r.message}`)}}getProviderName(){return this.provider.getProviderName()}getModelName(){return this.provider.getModelName()}buildIterationContext(e,t){const n=e,i=n.promptSnapshot!==t;let r=`[ITERATION_CONTEXT]
`;if(r+=`Previous score: ${n.overall}
`,r+=`Previous target principle: ${n.targetPrinciple||"none"}
`,r+=`Prompt changed since last evaluation: ${i?"YES":"NO"}
`,i&&n.promptSnapshot){const a=n.promptSnapshot.length>200?n.promptSnapshot.substring(0,200)+"...":n.promptSnapshot;r+=`Previous prompt preview: "${a}"
`}return r+=`
Previous feedback given:
${n.feedback}
`,r+=`[END ITERATION_CONTEXT]
`,r+=`
IMPORTANT: The user has already received the feedback above. `,r+="Do NOT repeat the same advice. If they addressed your previous suggestion, ",r+="acknowledge it and move to the next priority. If the score should improve ",r+="based on changes made, reflect that in your scoring. ",r+="Focus on a DIFFERENT principle unless the previous one is still critically weak.",r}}const Rn=[{combo:"ctrl+enter",action:"test",enabled:!0},{combo:"ctrl+shift+enter",action:"coach",enabled:!0},{combo:"ctrl+z",action:"undo",enabled:!0},{combo:"ctrl+y",action:"redo",enabled:!0}];class On{constructor(e=Rn){this.shortcuts=new Map,e.forEach(t=>{t.enabled&&this.shortcuts.set(t.combo.toLowerCase(),t.action)}),this.enabled=!0,this.actionDispatcher=null,this.isActiveCheck=null,this.boundHandler=null}init(e,t){this.actionDispatcher=e,this.isActiveCheck=t,this.boundHandler=this.handleKeyDown.bind(this),document.addEventListener("keydown",this.boundHandler)}handleKeyDown(e){if(!this.enabled||!this.isActiveCheck||!this.isActiveCheck())return;const t=this.buildCombo(e),n=this.shortcuts.get(t);n&&(e.preventDefault(),e.stopPropagation(),this.actionDispatcher&&this.actionDispatcher(n))}buildCombo(e){const t=[];(e.ctrlKey||e.metaKey)&&t.push("ctrl"),e.shiftKey&&t.push("shift"),e.altKey&&t.push("alt");let n=e.key.toLowerCase();return n===" "&&(n="space"),n==="escape"&&(n="esc"),t.push(n),t.join("+")}setEnabled(e){this.enabled=e}addShortcut(e,t){this.shortcuts.set(e.toLowerCase(),t)}removeShortcut(e){this.shortcuts.delete(e.toLowerCase())}getShortcuts(){return Array.from(this.shortcuts.entries()).map(([e,t])=>({combo:e,action:t}))}destroy(){this.boundHandler&&(document.removeEventListener("keydown",this.boundHandler),this.boundHandler=null),this.actionDispatcher=null,this.isActiveCheck=null}}const it="promptHistory",rt="prompt_history";class zn{constructor(e=50){this.maxSize=e,this.entries=[],this.position=-1,this.debounceTimer=null,this.loaded=!1}async load(){try{const e=await j(it,rt);e&&(this.entries=e.entries||[],this.position=e.position??-1,this.maxSize=e.maxSize||this.maxSize),this.loaded=!0}catch(e){console.warn("Failed to load prompt history:",e),this.loaded=!0}}push(e){var t;this.position>=0&&((t=this.entries[this.position])==null?void 0:t.text)===e||(this.entries=this.entries.slice(0,this.position+1),this.entries.push({text:e,timestamp:Date.now()}),this.entries.length>this.maxSize&&this.entries.shift(),this.position=this.entries.length-1,this.persist())}pushDebounced(e,t=500){this.debounceTimer&&clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.push(e),this.debounceTimer=null},t)}cancelDebounce(){this.debounceTimer&&(clearTimeout(this.debounceTimer),this.debounceTimer=null)}undo(){return this.canUndo()?(this.position--,this.persist(),this.entries[this.position].text):null}redo(){return this.canRedo()?(this.position++,this.persist(),this.entries[this.position].text):null}canUndo(){return this.position>0}canRedo(){return this.position<this.entries.length-1}getCurrent(){return this.position<0||this.position>=this.entries.length?null:this.entries[this.position].text}get length(){return this.entries.length}async persist(){try{await A(it,{id:rt,entries:this.entries,position:this.position,maxSize:this.maxSize})}catch(e){console.warn("Failed to persist prompt history:",e)}}async clear(){this.entries=[],this.position=-1,this.cancelDebounce(),await this.persist()}}class jn{constructor(){this.element=null,this.textarea=null,this.preview=null,this.isPreviewMode=!1,this.promptText="",this.initialized=!1,this.isTestRunning=!1,this.isCoachRunning=!1,this.feedbackPanel=null,this.onShowFeedback=null,this.historyTab=null,this.onSwitchToHistory=null,this.keyboardHandler=null,this.promptHistory=new zn(50)}render(){if(this.element)return this.element;this.element=document.createElement("div"),this.element.className="prompt-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","prompt-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;
      overflow: hidden;
    `;const e=document.createElement("div");return e.style.cssText="flex: 1; position: relative; min-height: 0;",this.textarea=document.createElement("textarea"),this.textarea.className="input textarea",this.textarea.placeholder="Your prompt here...",this.textarea.style.cssText=`
      width: 100%;
      height: 100%;
      resize: none;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.5;
      border: none;
      border-radius: 0;
      padding: var(--pc-space-3) var(--pc-space-4);
      padding-bottom: 140px;
      outline: none;
    `,this.textarea.addEventListener("input",t=>{this.promptText=t.target.value,ue(this.promptText),this.promptHistory.pushDebounced(this.promptText,1e3)}),e.appendChild(this.textarea),this.preview=document.createElement("div"),this.preview.className="prompt-preview",this.preview.style.cssText=`
      position: absolute;
      inset: 0;
      padding: var(--pc-space-3) var(--pc-space-4);
      padding-bottom: 140px;
      background-color: var(--pc-surface);
      border: none;
      border-radius: 0;
      overflow-y: auto;
      display: none;
      font-size: 1rem;
      line-height: 1.5;
    `,e.appendChild(this.preview),this.element.appendChild(e),this.loadPrompt(),this.element}createToolbar(){const e=document.createElement("div");e.className="prompt-toolbar",e.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      margin-bottom: var(--pc-space-3);
      flex-wrap: wrap;
    `,this.toggleContainer=document.createElement("div"),this.toggleContainer.className="mode-toggle",this.toggleContainer.style.cssText=`
      display: flex;
      border: 1px solid var(--pc-outline);
      border-radius: var(--pc-radius-sm);
      overflow: hidden;
    `,this.editBtn=document.createElement("button"),this.editBtn.innerHTML=`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19zM20.71 5.63l-2.34-2.34c-.2-.2-.45-.29-.71-.29s-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41z"/>
      </svg>
    `,this.editBtn.title="Edit mode",this.editBtn.style.cssText=`
      padding: var(--pc-space-2);
      border: none;
      background: var(--pc-primary);
      color: var(--pc-on-primary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 36px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `,this.editBtn.addEventListener("click",()=>this.setMode(!1)),this.previewBtn=document.createElement("button"),this.previewBtn.innerHTML=`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/>
      </svg>
    `,this.previewBtn.title="Preview mode",this.previewBtn.style.cssText=`
      padding: var(--pc-space-2);
      border: none;
      background: transparent;
      color: var(--pc-on-surface);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 36px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `,this.previewBtn.addEventListener("click",()=>this.setMode(!0)),this.toggleContainer.appendChild(this.editBtn),this.toggleContainer.appendChild(this.previewBtn),e.appendChild(this.toggleContainer);const t=document.createElement("div");t.style.flex="1",e.appendChild(t);const n=document.createElement("button");return n.className="btn btn-text-compact",n.title="Copy prompt",n.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span>Copy</span>
    `,n.addEventListener("click",()=>this.copyPrompt()),e.appendChild(n),this.testBtn=document.createElement("button"),this.testBtn.className="btn btn-text-compact",this.testBtn.title="Test prompt (Ctrl+Enter)",this.testBtn.innerHTML=`
      <span class="btn-text-icon-wrapper" style="position: relative; display: inline-flex;">
        <svg class="btn-text-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.23 20.23L8 22l10-10L8 2 6.23 3.77 14.46 12z"/>
        </svg>
      </span>
      <span>Test</span>
    `,this.testBtn.addEventListener("click",()=>this.runTest()),e.appendChild(this.testBtn),this.coachBtn=document.createElement("button"),this.coachBtn.className="btn btn-text-compact",this.coachBtn.title="Get coaching feedback (Ctrl+Shift+Enter)",this.coachBtn.innerHTML=`
      <span class="btn-text-icon-wrapper" style="position: relative; display: inline-flex;">
        <svg class="btn-text-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>
        </svg>
      </span>
      <span>Review</span>
    `,this.coachBtn.addEventListener("click",()=>this.runCoach()),e.appendChild(this.coachBtn),e}setMode(e){this.isPreviewMode!==e&&(this.isPreviewMode=e,this.isPreviewMode?(this.textarea.style.display="none",this.preview.style.display="block",this.preview.innerHTML=W(this.promptText)||'<p style="color: var(--pc-on-surface-variant);">Nothing to preview</p>',this.applyMarkdownStyles(this.preview)):(this.textarea.style.display="block",this.preview.style.display="none",this.textarea.focus()))}async copyPrompt(){if(!this.promptText.trim())return f("Nothing to copy"),!1;try{return await navigator.clipboard.writeText(this.promptText),f("Prompt copied!"),!0}catch{return f("Failed to copy"),!1}}togglePreview(){this.setMode(!this.isPreviewMode)}async loadPrompt(){try{const e=await N();this.promptText=e.promptText||"",this.textarea&&(this.textarea.value=this.promptText),await this.promptHistory.load(),this.promptText&&this.promptHistory.push(this.promptText),this.initKeyboardHandler()}catch(e){console.error("Failed to load prompt:",e)}}initKeyboardHandler(){this.keyboardHandler||(this.keyboardHandler=new On,this.keyboardHandler.init(e=>this.handleKeyboardAction(e),()=>this.isKeyboardActive()))}isKeyboardActive(){return this.element&&this.element.offsetParent!==null&&!this.isPreviewMode}handleKeyboardAction(e){switch(e){case"test":this.runTest();break;case"coach":this.runCoach();break;case"undo":this.handleUndo();break;case"redo":this.handleRedo();break;default:console.warn("Unknown keyboard action:",e)}}handleUndo(){const e=this.promptHistory.undo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),ue(e),f("Undo"))}handleRedo(){const e=this.promptHistory.redo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),ue(e),f("Redo"))}async runTest(){if(this.isTestRunning){f("Test already in progress");return}const e=this.promptText.trim();if(!e){f("Please enter a prompt first");return}if(!we()){f("Please configure an API key in Settings");return}const t=R(),n=t.testProvider||"openai",i=t.apiKeys[n],r=t.testModel||null;if(!i){f(`No API key configured for ${n}`);return}let a;try{a=xt(n,i,r)}catch(h){f(h.message||"Failed to create provider");return}let o=e,l=null;try{const{context:h,truncated:d,count:y}=await Qe();h&&(o=`${h}

---

${e}`,l={count:y,truncated:d},d&&f("Attachments truncated due to size limit","warning"))}catch(h){console.warn("Failed to get attachment context:",h)}this.isTestRunning=!0,this.testBtn&&(this.testBtn.disabled=!0,this.setButtonLoading(this.testBtn,!0)),await Ze(e);const c=jt({promptSnapshot:e,provider:a.getProviderName(),model:a.getModelName(),status:"streaming"});await Ce(c),this.historyTab&&this.historyTab.addEntry(c),this.onSwitchToHistory&&this.onSwitchToHistory();const p=performance.now();let m="";await ve(a.getProviderName(),a.getModelName(),o.length);try{for await(const h of a.streamCompletion(o))if(h.content&&(m+=h.content,this.historyTab&&this.historyTab.updateExpandedEntry(c.id,{responseText:m})),h.done&&h.usage){const d=Math.round(performance.now()-p);await je(c.id,{responseText:m,tokens:h.usage,durationMs:d,status:"complete"}),this.historyTab&&this.historyTab.updateExpandedEntry(c.id,{responseText:m,tokens:h.usage,durationMs:d,status:"complete"}),await be(a.getProviderName(),a.getModelName(),m.length,h.usage,d)}}catch(h){const d=Math.round(performance.now()-p),y=h instanceof w?h.userMessage:h.message||"Unknown error";await je(c.id,{responseText:m,error:y,durationMs:d,status:"error"}),this.historyTab&&this.historyTab.updateExpandedEntry(c.id,{responseText:m,error:y,durationMs:d,status:"error"}),await ie(a.getProviderName(),a.getModelName(),y,d),f(y)}finally{this.isTestRunning=!1,this.testBtn&&(this.testBtn.disabled=!1,this.setButtonLoading(this.testBtn,!1))}}setOnSwitchToResults(e){this.onSwitchToResults=e}setResultsTab(e){this.resultsTab=e}setOnShowFeedback(e){this.onShowFeedback=e}setHistoryTab(e){this.historyTab=e}setOnSwitchToHistory(e){this.onSwitchToHistory=e}async runCoach(){if(this.isCoachRunning){f("Coach evaluation in progress");return}const e=this.promptText.trim();if(!e){f("Please enter a prompt first");return}if(!we()){f("Please configure an API key in Settings");return}const t=R(),n=t.coachProvider||"openai",i=t.apiKeys[n],r=t.coachModel||null;if(!i){f(`No API key configured for ${n}`);return}let a="",o=!1;try{const{context:c,truncated:p}=await Qe();a=c,o=p,p&&f("Attachments truncated due to size limit","warning")}catch(c){console.warn("Failed to get attachment context:",c)}this.isCoachRunning=!0,this.coachBtn&&(this.coachBtn.disabled=!0,this.setButtonLoading(this.coachBtn,!0));const l=performance.now();try{const c=new Dn(n,i,r),p=ae.get(),m=await de(),h=m.length>0?m[0]:null;this.onShowFeedbackStreaming&&this.onShowFeedbackStreaming({provider:c.getProviderName(),model:c.getModelName()});let d=null,y=0;for await(const b of c.evaluateStreaming(e,p,{attachmentContext:a,attachmentsTruncated:o,coachingMode:t.coachingMode||"beginner",previousFeedback:h}))b.type==="chunk"?this.onFeedbackStreamChunk&&this.onFeedbackStreamChunk(b.content):b.type==="complete"&&(d=b.response,y=b.durationMs);if(!d)throw new Error("No response received from coach");await Ze(e);const u=Ot({promptSnapshot:e,scores:d.scores,overall:d.overall,description:d.description,feedback:d.feedback,provider:c.getProviderName(),model:c.getModelName(),durationMs:y,targetPrinciple:d.targetPrinciple,complete:d.complete});await Gt(u);const g=zt({promptSnapshot:e,scores:d.scores,overall:d.overall,description:d.description,feedback:d.feedback,provider:c.getProviderName(),model:c.getModelName(),durationMs:y,targetPrinciple:d.targetPrinciple,complete:d.complete});await Ce(g),this.historyTab&&this.historyTab.addEntry(g),this.onFinalizeFeedbackStreaming&&this.onFinalizeFeedbackStreaming(u),console.log("Coach: Evaluation complete",u)}catch(c){const p=c.message||"Coach evaluation failed";f(p),console.error("Coach: Error",c),this.onHideFeedbackPanel&&this.onHideFeedbackPanel(),await ie(t.coachProvider||"openai",t.coachModel||"unknown",p,Math.round(performance.now()-l))}finally{this.isCoachRunning=!1,this.coachBtn&&(this.coachBtn.disabled=!1,this.setButtonLoading(this.coachBtn,!1))}}setButtonLoading(e,t){if(!document.getElementById("btn-spinner-styles")){const r=document.createElement("style");r.id="btn-spinner-styles",r.textContent=`
        @keyframes btn-spinner-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .btn-spinner-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid var(--pc-outline-variant);
          border-top-color: var(--pc-primary);
          animation: btn-spinner-rotate 0.8s linear infinite;
          pointer-events: none;
        }
      `,document.head.appendChild(r)}const n=e.querySelector(".btn-text-icon-wrapper");if(!n)return;const i=n.querySelector(".btn-spinner-ring");if(i&&i.remove(),t){const r=document.createElement("div");r.className="btn-spinner-ring",n.appendChild(r);const a=n.querySelector(".btn-text-icon");a&&(a.style.opacity="0.5")}else{const r=n.querySelector(".btn-text-icon");r&&(r.style.opacity="1")}}resetSession(){this.promptText="",this.textarea&&(this.textarea.value=""),this.preview&&(this.preview.innerHTML=""),this.promptHistory.clear(),this.isPreviewMode=!1,this.textarea&&(this.textarea.style.display="block"),this.preview&&(this.preview.style.display="none")}applyMarkdownStyles(e){e.querySelectorAll("p").forEach(o=>{o.style.cssText="margin: 0; line-height: 1.5;"}),e.querySelectorAll("ul, ol").forEach(o=>{o.style.cssText=`
        margin: 0;
        padding-left: 1.25em;
        list-style-position: outside;
      `}),e.querySelectorAll("li").forEach(o=>{o.style.cssText="margin: 0;"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(o=>{o.style.cssText="margin: 0; line-height: 1.5;"}),e.querySelectorAll("pre").forEach(o=>{o.style.cssText="margin: 0;"})}}const Zn={feedback:'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-120v-80h320v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v244h-40q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H440Zm-80-280q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z"/></svg>',result:'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>',"prompt-change":'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>'},ee={feedback:"var(--pc-primary)",result:"var(--pc-secondary, #4caf50)","prompt-change":"var(--pc-tertiary, #ff9800)"};class at{constructor(e,t={}){this.entry=e,this.onClick=t.onClick||null,this.element=null}render(){return this.element=document.createElement("div"),this.element.className="history-item",this.element.dataset.entryId=this.entry.id,this.element.dataset.entryType=this.entry.type,this.element.setAttribute("role","button"),this.element.setAttribute("tabindex","0"),this.element.setAttribute("aria-label",this._getAriaLabel()),this._applyStyles(),this._buildContent(),this._attachEventListeners(),this.element}_applyStyles(){this.element.style.cssText=`
      padding: var(--pc-space-3) var(--pc-space-4);
      margin-bottom: var(--pc-space-2);
      background: var(--pc-surface-elevated);
      border-radius: 0 var(--pc-radius-md) var(--pc-radius-md) 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      min-height: 64px;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
      border-left: 3px solid ${ee[this.entry.type]||"var(--pc-outline)"};
    `}_buildContent(){const e=this._createTypeIcon();this.element.appendChild(e);const t=this._createContentArea();this.element.appendChild(t);const n=this._createTimestamp();this.element.appendChild(n)}_createTypeIcon(){const e=document.createElement("span");return e.className="history-item-icon",e.style.cssText=`
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pc-radius-sm);
      background: ${ee[this.entry.type]}20;
      color: ${ee[this.entry.type]};
      flex-shrink: 0;
    `,e.innerHTML=Zn[this.entry.type]||"",e}_createContentArea(){const e=document.createElement("div");e.className="history-item-content",e.style.cssText="flex:1;min-width:0;";const t=document.createElement("div");t.className="history-item-title",t.style.cssText="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";const n=document.createElement("div");switch(n.className="history-item-subtitle",n.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",this.entry.type){case"feedback":this._renderFeedbackContent(t,n);break;case"result":this._renderResultContent(t,n);break;case"prompt-change":this._renderPromptChangeContent(t,n);break}return e.appendChild(t),e.appendChild(n),e}_renderFeedbackContent(e,t){const n=document.createElement("span");n.className="score-badge",n.style.cssText=`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 8px;
      background: ${this._getScoreColor(this.entry.overall)};
      color: white;
    `,n.textContent=`${this.entry.overall}%`,e.appendChild(n),e.appendChild(document.createTextNode(this.entry.description||"Coach Feedback")),t.textContent=`${this.entry.provider}/${this.entry.model}`}_renderResultContent(e,t){var a;const n=document.createElement("span");n.className="status-indicator",n.style.cssText=`
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      background: ${this._getStatusColor(this.entry.status)};
    `,e.appendChild(n),e.appendChild(document.createTextNode(`${this.entry.provider}/${this.entry.model}`));const i=((a=this.entry.tokens)==null?void 0:a.total)||0,r=this.entry.durationMs?`${(this.entry.durationMs/1e3).toFixed(1)}s`:"";t.textContent=i>0?`${i} tokens${r?` • ${r}`:""}`:this.entry.status}_renderPromptChangeContent(e,t){var i;e.textContent="Prompt Updated";const n=((i=this.entry.newPromptText)==null?void 0:i.substring(0,60))||"";t.textContent=n+(n.length>=60?"...":"")}_createTimestamp(){const e=document.createElement("span");return e.className="history-item-time",e.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);flex-shrink:0;",e.textContent=this._formatTime(this.entry.timestamp),e}_getScoreColor(e){return e>=80?"#4caf50":e>=60?"#ff9800":"#f44336"}_getStatusColor(e){switch(e){case"complete":return"#4caf50";case"streaming":return"#2196f3";case"error":return"#f44336";default:return"#9e9e9e"}}_formatTime(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}_getAriaLabel(){switch(this.entry.type){case"feedback":return`Coach feedback: ${this.entry.description||"Score "+this.entry.overall+"%"}`;case"result":return`Test result: ${this.entry.provider}/${this.entry.model}, ${this.entry.status}`;case"prompt-change":return"Prompt change";default:return"History entry"}}_attachEventListeners(){this.element.addEventListener("click",()=>{this.onClick&&this.onClick(this.entry.id)}),this.element.addEventListener("keydown",e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.onClick&&this.onClick(this.entry.id))}),this.element.addEventListener("mouseenter",()=>{this.element.style.background="var(--pc-surface-hover)",this.element.style.boxShadow="0 2px 4px rgba(0,0,0,0.1)"}),this.element.addEventListener("mouseleave",()=>{this.element.style.background="var(--pc-surface-elevated)",this.element.style.boxShadow="none"}),this.element.addEventListener("focus",()=>{this.element.style.outline=`2px solid ${ee[this.entry.type]}`,this.element.style.outlineOffset="2px"}),this.element.addEventListener("blur",()=>{this.element.style.outline="none"})}update(e){if(Object.assign(this.entry,e),this.element){const t=this.element.parentNode,n=this.render();t&&t.replaceChild(n,this.element)}}}const Kn={feedback:"var(--pc-primary)",result:"var(--pc-secondary, #4caf50)","prompt-change":"var(--pc-tertiary, #ff9800)"},ot={feedback:"Coach Feedback",result:"Test Result","prompt-change":"Prompt Change"};class ct{constructor(e,t={}){this.entry=e,this.onClose=t.onClose||null,this.onNavigate=t.onNavigate||null,this.contentComponent=t.contentComponent||null,this.element=null,this.headerElement=null,this.contentArea=null}render(){return this.element=document.createElement("div"),this.element.className="history-expanded",this.element.style.cssText="display:flex;flex-direction:column;height:100%;",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-label",ot[this.entry.type]||"History Entry"),this.headerElement=this._createHeader(),this.element.appendChild(this.headerElement),this.contentArea=document.createElement("div"),this.contentArea.className="expanded-content",this.contentArea.style.cssText="flex:1;overflow-y:auto;padding:var(--pc-space-4);",this.contentComponent&&this.contentArea.appendChild(this.contentComponent),this.element.appendChild(this.contentArea),this.element}_createHeader(){const e=document.createElement("div");e.className="expanded-header",e.style.cssText=`
      display: flex;
      align-items: center;
      padding: var(--pc-space-3) var(--pc-space-4);
      border-bottom: 1px solid var(--pc-border);
      gap: var(--pc-space-3);
      background: var(--pc-surface);
      border-left: 4px solid ${Kn[this.entry.type]||"var(--pc-outline)"};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    `;const t=document.createElement("button");t.className="close-btn",t.setAttribute("aria-label","Close"),t.style.cssText=`
      background: none;
      border: none;
      padding: var(--pc-space-2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pc-radius-sm);
      color: var(--pc-text-primary);
      transition: background-color 0.15s ease;
    `,t.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',t.addEventListener("click",()=>{var a;return(a=this.onClose)==null?void 0:a.call(this)}),t.addEventListener("mouseenter",()=>{t.style.background="var(--pc-surface-hover)"}),t.addEventListener("mouseleave",()=>{t.style.background="none"}),e.appendChild(t);const n=document.createElement("span");n.className="expanded-title",n.style.cssText="font-weight:500;flex:1;",n.textContent=ot[this.entry.type]||"History Entry",e.appendChild(n);const i=this._createHeaderActions();i&&e.appendChild(i);const r=document.createElement("span");return r.className="expanded-timestamp",r.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",r.textContent=this._formatTimestamp(this.entry.timestamp),e.appendChild(r),e}_createHeaderActions(){var t;const e=document.createElement("div");if(e.className="expanded-actions",e.style.cssText="display:flex;align-items:center;gap:var(--pc-space-2);",this.entry.type==="feedback"){const n=document.createElement("span");if(n.className="score-badge",n.style.cssText=`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        height: 24px;
        padding: 0 8px;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 600;
        background: ${this._getScoreColor(this.entry.overall)};
        color: white;
      `,n.textContent=`${this.entry.overall}%`,e.appendChild(n),this.entry.durationMs){const i=document.createElement("span");i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=`${(this.entry.durationMs/1e3).toFixed(1)}s`,e.appendChild(i)}}else if(this.entry.type==="result"){const n=document.createElement("span");if(n.style.cssText=`
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${this._getStatusColor(this.entry.status)};
      `,e.appendChild(n),(t=this.entry.tokens)!=null&&t.total){const i=document.createElement("span");i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=`${this.entry.tokens.total} tokens`,e.appendChild(i)}if(this.entry.durationMs){const i=document.createElement("span");i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=`${(this.entry.durationMs/1e3).toFixed(1)}s`,e.appendChild(i)}}return e.children.length>0?e:null}_getScoreColor(e){return e>=80?"#4caf50":e>=60?"#ff9800":"#f44336"}_getStatusColor(e){switch(e){case"complete":return"#4caf50";case"streaming":return"#2196f3";case"error":return"#f44336";default:return"#9e9e9e"}}_formatTimestamp(e){return new Date(e).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}setContent(e){this.contentComponent=e,this.contentArea&&(this.contentArea.innerHTML="",e&&this.contentArea.appendChild(e))}updateEntry(e){if(this.entry=e,this.headerElement){const t=this._createHeader();this.headerElement.replaceWith(t),this.headerElement=t}}}class Un{constructor(e){this.entry=e,this.element=null}render(){this.element=document.createElement("div"),this.element.className="feedback-expanded-content",this.element.style.cssText="display:flex;flex-direction:column;gap:var(--pc-space-4);";const e=this._createStatsRibbon();this.element.appendChild(e);const t=this._createFeedbackSection();if(this.element.appendChild(t),this.entry.scores&&this.entry.scores.length>0){const i=this._createScoresSection();this.element.appendChild(i)}const n=this._createPromptSection();return this.element.appendChild(n),this.element}_createStatsRibbon(){const e=document.createElement("div");if(e.className="feedback-stats-ribbon",e.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-size: 0.875rem;
    `,this.entry.provider&&this.entry.model){const n=this._createStatItem("Model",`${this.entry.provider}/${this.entry.model}`);e.appendChild(n)}if(this.entry.durationMs){const n=this._createStatItem("Duration",`${(this.entry.durationMs/1e3).toFixed(1)}s`);e.appendChild(n)}const t=this._createStatItem("Score",`${this.entry.overall}%`);if(t.querySelector(".stat-value").style.color=this._getScoreColor(this.entry.overall),t.querySelector(".stat-value").style.fontWeight="600",e.appendChild(t),this.entry.description){const n=this._createStatItem("Quality",this.entry.description);e.appendChild(n)}if(this.entry.targetPrinciple){const n=this._createStatItem("Focus",this.entry.targetPrinciple);e.appendChild(n)}return e}_createStatItem(e,t){const n=document.createElement("div");n.className="stat-item",n.style.cssText="display:flex;flex-direction:column;";const i=document.createElement("span");i.className="stat-label",i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=e;const r=document.createElement("span");return r.className="stat-value",r.textContent=t,n.appendChild(i),n.appendChild(r),n}_createScoresSection(){const e=document.createElement("div");e.className="feedback-scores-section";const t=document.createElement("button");t.className="scores-collapse-header",t.setAttribute("aria-expanded","false"),t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      width: 100%;
      padding: 0;
      margin: 0 0 var(--pc-space-3) 0;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    `;const n=document.createElement("h3");n.style.cssText="font-size:1rem;font-weight:500;margin:0;color:var(--pc-on-surface);",n.textContent="Principle Scores";const i=document.createElement("span");i.style.cssText="font-size:0.875rem;color:var(--pc-text-secondary);",i.textContent=`(${this.entry.scores.length})`;const r=document.createElement("span");r.className="collapse-chevron",r.innerHTML='<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>',r.style.cssText="display:flex;transition:transform 0.2s ease;transform:rotate(-90deg);margin-left:auto;",t.appendChild(n),t.appendChild(i),t.appendChild(r),e.appendChild(t);const a=document.createElement("div");a.className="scores-collapse-content",a.style.cssText="display:none;margin-top:var(--pc-space-2);";const o=document.createElement("div");return o.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--pc-space-2);",this.entry.scores.forEach(l=>{const c=this._createScoreCard(l);o.appendChild(c)}),a.appendChild(o),e.appendChild(a),t.addEventListener("click",()=>{const l=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",(!l).toString()),a.style.display=l?"none":"block",r.style.transform=l?"rotate(-90deg)":"rotate(0deg)"}),e}_createScoreCard(e){const t=document.createElement("div");t.className="score-card",t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      padding: var(--pc-space-2) var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: 0 var(--pc-radius-sm) var(--pc-radius-sm) 0;
      border-left: 3px solid ${this._getScoreColor(e.score)};
    `;const n=document.createElement("span");n.style.cssText="flex:1;font-size:0.875rem;",n.textContent=e.principle||e.name||"Unknown";const i=document.createElement("span");return i.style.cssText=`font-weight:600;color:${this._getScoreColor(e.score)};`,i.textContent=`${e.score}%`,t.appendChild(n),t.appendChild(i),t}_createFeedbackSection(){const e=document.createElement("div");e.className="feedback-text-section";const t=document.createElement("h3");t.style.cssText="font-size:1rem;font-weight:500;margin:0 0 var(--pc-space-3) 0;",t.textContent="Feedback",e.appendChild(t);const n=document.createElement("div");return n.className="feedback-content markdown-content",n.style.cssText=`
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      line-height: 1.6;
    `,this.entry.feedback?(n.innerHTML=W(this.entry.feedback),this._applyMarkdownStyles(n)):(n.textContent="No feedback text available.",n.style.color="var(--pc-text-secondary)"),e.appendChild(n),e}_createPromptSection(){const e=document.createElement("div");e.className="feedback-prompt-section";const t=document.createElement("button");t.className="prompt-collapse-header",t.setAttribute("aria-expanded","false"),t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      width: 100%;
      padding: 0;
      margin: 0 0 var(--pc-space-3) 0;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    `;const n=document.createElement("h3");n.style.cssText="font-size:1rem;font-weight:500;margin:0;color:var(--pc-on-surface);",n.textContent="Prompt Snapshot";const i=document.createElement("span");i.className="collapse-chevron",i.innerHTML='<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>',i.style.cssText="display:flex;transition:transform 0.2s ease;transform:rotate(-90deg);margin-left:auto;",t.appendChild(n),t.appendChild(i),e.appendChild(t);const r=document.createElement("div");r.className="prompt-collapse-content",r.style.cssText="display:none;";const a=document.createElement("div");return a.className="prompt-snapshot",a.style.cssText=`
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    `,a.textContent=this.entry.promptSnapshot||"No prompt snapshot available.",r.appendChild(a),e.appendChild(r),t.addEventListener("click",()=>{const o=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",(!o).toString()),r.style.display=o?"none":"block",i.style.transform=o?"rotate(-90deg)":"rotate(0deg)"}),e}_getScoreColor(e){return e>=80?"#4caf50":e>=60?"#ff9800":"#f44336"}_applyMarkdownStyles(e){e.querySelectorAll("p").forEach(t=>{t.style.cssText="margin:0 0 var(--pc-space-2) 0;"}),e.querySelectorAll("ul, ol").forEach(t=>{t.style.cssText="margin:0 0 var(--pc-space-2) 0;padding-left:1.5em;"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(t=>{t.style.cssText="margin:var(--pc-space-3) 0 var(--pc-space-2) 0;"}),e.querySelectorAll("code").forEach(t=>{t.style.cssText="background:var(--pc-surface);padding:2px 4px;border-radius:2px;font-size:0.875em;"}),e.querySelectorAll("pre").forEach(t=>{t.style.cssText="background:var(--pc-surface);padding:var(--pc-space-2);border-radius:var(--pc-radius-sm);overflow-x:auto;"})}}class Gn{constructor(e){this.entry=e,this.element=null,this.responseContainer=null}render(){this.element=document.createElement("div"),this.element.className="result-expanded-content",this.element.style.cssText="display:flex;flex-direction:column;gap:var(--pc-space-4);";const e=this._createStatsRibbon();this.element.appendChild(e);const t=this._createActionsBar();this.element.appendChild(t);const n=this._createResponseSection();this.element.appendChild(n);const i=this._createPromptSection();return this.element.appendChild(i),this.element}_createStatsRibbon(){const e=document.createElement("div");e.className="result-stats-ribbon",e.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-size: 0.875rem;
    `;const t=this._createStatItem("Status",this.entry.status),n=t.querySelector(".stat-value");if(n.style.color=this._getStatusColor(this.entry.status),n.style.fontWeight="600",e.appendChild(t),this.entry.provider&&this.entry.model){const i=this._createStatItem("Model",`${this.entry.provider}/${this.entry.model}`);e.appendChild(i)}if(this.entry.tokens){if(this.entry.tokens.prompt){const i=this._createStatItem("Prompt Tokens",this.entry.tokens.prompt.toString());e.appendChild(i)}if(this.entry.tokens.completion){const i=this._createStatItem("Completion Tokens",this.entry.tokens.completion.toString());e.appendChild(i)}if(this.entry.tokens.total){const i=this._createStatItem("Total Tokens",this.entry.tokens.total.toString());i.querySelector(".stat-value").style.fontWeight="600",e.appendChild(i)}}if(this.entry.durationMs){const i=this._createStatItem("Duration",`${(this.entry.durationMs/1e3).toFixed(1)}s`);e.appendChild(i)}if(this.entry.error){const i=this._createStatItem("Error",this.entry.error);i.querySelector(".stat-value").style.color="#f44336",e.appendChild(i)}return e}_createStatItem(e,t){const n=document.createElement("div");n.className="stat-item",n.style.cssText="display:flex;flex-direction:column;";const i=document.createElement("span");i.className="stat-label",i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=e;const r=document.createElement("span");return r.className="stat-value",r.textContent=t,n.appendChild(i),n.appendChild(r),n}_createActionsBar(){const e=document.createElement("div");e.className="result-actions-bar",e.style.cssText="display:flex;gap:var(--pc-space-2);";const t=this._createActionButton("Copy Response","copy",()=>this._copyResponse());e.appendChild(t);const n=this._createActionButton("Download","download",()=>this._downloadResponse());return e.appendChild(n),e}_createActionButton(e,t,n){const i=document.createElement("button");i.className="action-btn",i.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      padding: var(--pc-space-2) var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border: 1px solid var(--pc-border);
      border-radius: var(--pc-radius-sm);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--pc-text-primary);
      transition: background-color 0.15s ease;
    `;const r={copy:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/></svg>',download:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>'};return i.innerHTML=`${r[t]||""}${e}`,i.addEventListener("click",n),i.addEventListener("mouseenter",()=>{i.style.background="var(--pc-surface-hover)"}),i.addEventListener("mouseleave",()=>{i.style.background="var(--pc-surface-elevated)"}),i}_createResponseSection(){const e=document.createElement("div");e.className="result-response-section";const t=document.createElement("h3");return t.style.cssText="font-size:1rem;font-weight:500;margin:0 0 var(--pc-space-3) 0;",t.textContent="Response",e.appendChild(t),this.responseContainer=document.createElement("div"),this.responseContainer.className="response-content markdown-content",this.responseContainer.style.cssText=`
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      line-height: 1.6;
      overflow-y: auto;
    `,this._renderResponse(),e.appendChild(this.responseContainer),e}_renderResponse(){if(this.responseContainer){if(!document.getElementById("streaming-pulse-style")){const e=document.createElement("style");e.id="streaming-pulse-style",e.textContent="@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}",document.head.appendChild(e)}if(this.entry.error)this.responseContainer.innerHTML=`
        <div style="color:#f44336;">
          <strong>Error:</strong> ${this.entry.error}
        </div>
      `;else if(this.entry.responseText){let e=W(this.entry.responseText);this.entry.status==="streaming"&&(e+='<span class="streaming-cursor" style="display:inline-block;width:8px;height:16px;background:#2196f3;animation:pulse 0.5s infinite;vertical-align:text-bottom;margin-left:2px;"></span>'),this.responseContainer.innerHTML=e,this._applyMarkdownStyles(this.responseContainer)}else this.entry.status==="streaming"?this.responseContainer.innerHTML=`
        <div style="display:flex;align-items:center;gap:var(--pc-space-2);color:var(--pc-text-secondary);">
          <span class="streaming-indicator" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2196f3;animation:pulse 1s infinite;"></span>
          <span>Waiting for response...</span>
        </div>
      `:(this.responseContainer.textContent="No response available.",this.responseContainer.style.color="var(--pc-text-secondary)")}}_createPromptSection(){const e=document.createElement("div");e.className="result-prompt-section";const t=document.createElement("button");t.className="prompt-collapse-header",t.setAttribute("aria-expanded","false"),t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      width: 100%;
      padding: 0;
      margin: 0 0 var(--pc-space-3) 0;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    `;const n=document.createElement("h3");n.style.cssText="font-size:1rem;font-weight:500;margin:0;color:var(--pc-on-surface);",n.textContent="Prompt Snapshot";const i=document.createElement("span");i.className="collapse-chevron",i.innerHTML='<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>',i.style.cssText="display:flex;transition:transform 0.2s ease;transform:rotate(-90deg);margin-left:auto;",t.appendChild(n),t.appendChild(i),e.appendChild(t);const r=document.createElement("div");r.className="prompt-collapse-content",r.style.cssText="display:none;";const a=document.createElement("div");return a.className="prompt-snapshot",a.style.cssText=`
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    `,a.textContent=this.entry.promptSnapshot||"No prompt snapshot available.",r.appendChild(a),e.appendChild(r),t.addEventListener("click",()=>{const o=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",(!o).toString()),r.style.display=o?"none":"block",i.style.transform=o?"rotate(-90deg)":"rotate(0deg)"}),e}async _copyResponse(){const e=this.entry.responseText||"";if(!e){f("No response to copy");return}try{await navigator.clipboard.writeText(e),f("Response copied to clipboard")}catch{f("Failed to copy")}}_downloadResponse(){const e=this.entry.responseText||"";if(!e){f("No response to download");return}const t=new Blob([e],{type:"text/plain"}),n=URL.createObjectURL(t),i=document.createElement("a");i.href=n,i.download=`response-${this.entry.id.substring(0,8)}.txt`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n),f("Response downloaded")}_getStatusColor(e){switch(e){case"complete":return"#4caf50";case"streaming":return"#2196f3";case"error":return"#f44336";default:return"#9e9e9e"}}_applyMarkdownStyles(e){e.querySelectorAll("p").forEach(t=>{t.style.cssText="margin:0 0 var(--pc-space-2) 0;"}),e.querySelectorAll("ul, ol").forEach(t=>{t.style.cssText="margin:0 0 var(--pc-space-2) 0;padding-left:1.5em;"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(t=>{t.style.cssText="margin:var(--pc-space-3) 0 var(--pc-space-2) 0;"}),e.querySelectorAll("code").forEach(t=>{t.style.cssText="background:var(--pc-surface);padding:2px 4px;border-radius:2px;font-size:0.875em;"}),e.querySelectorAll("pre").forEach(t=>{t.style.cssText="background:var(--pc-surface);padding:var(--pc-space-2);border-radius:var(--pc-radius-sm);overflow-x:auto;"})}update(e){var t;if(Object.assign(this.entry,e),this._renderResponse(),e.status==="complete"||e.tokens||e.durationMs){const n=(t=this.element)==null?void 0:t.querySelector(".result-stats-ribbon");if(n){const i=this._createStatsRibbon();n.replaceWith(i)}}}appendChunk(e){this.entry.responseText||(this.entry.responseText=""),this.entry.responseText+=e,this.responseContainer&&this.entry.status==="streaming"&&(this.responseContainer.innerHTML=W(this.entry.responseText),this._applyMarkdownStyles(this.responseContainer))}}class Yn{constructor(e){this.entry=e,this.element=null}render(){this.element=document.createElement("div"),this.element.className="prompt-change-expanded-content",this.element.style.cssText="display:flex;flex-direction:column;gap:var(--pc-space-4);";const e=this._createInfoRibbon();this.element.appendChild(e);const t=this._createActionsBar();this.element.appendChild(t);const n=this._createPromptSection();return this.element.appendChild(n),this.element}_createInfoRibbon(){var c,p,m;const e=document.createElement("div");e.className="prompt-change-info-ribbon",e.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-size: 0.875rem;
    `;const t=this._createStatItem("Recorded At",this._formatTimestamp(this.entry.timestamp));e.appendChild(t);const n=((c=this.entry.newPromptText)==null?void 0:c.length)||0,i=this._createStatItem("Characters",n.toLocaleString());e.appendChild(i);const r=((p=this.entry.newPromptText)==null?void 0:p.split(/\s+/).filter(h=>h.length>0).length)||0,a=this._createStatItem("Words",r.toLocaleString());e.appendChild(a);const o=((m=this.entry.newPromptText)==null?void 0:m.split(`
`).length)||0,l=this._createStatItem("Lines",o.toLocaleString());return e.appendChild(l),e}_createStatItem(e,t){const n=document.createElement("div");n.className="stat-item",n.style.cssText="display:flex;flex-direction:column;";const i=document.createElement("span");i.className="stat-label",i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);",i.textContent=e;const r=document.createElement("span");return r.className="stat-value",r.textContent=t,n.appendChild(i),n.appendChild(r),n}_createActionsBar(){const e=document.createElement("div");e.className="prompt-change-actions-bar",e.style.cssText="display:flex;gap:var(--pc-space-2);";const t=this._createActionButton("Copy Prompt","copy",()=>this._copyPrompt());return e.appendChild(t),e}_createActionButton(e,t,n){const i=document.createElement("button");i.className="action-btn",i.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      padding: var(--pc-space-2) var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border: 1px solid var(--pc-border);
      border-radius: var(--pc-radius-sm);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--pc-text-primary);
      transition: background-color 0.15s ease;
    `;const r={copy:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/></svg>'};return i.innerHTML=`${r[t]||""}${e}`,i.addEventListener("click",n),i.addEventListener("mouseenter",()=>{i.style.background="var(--pc-surface-hover)"}),i.addEventListener("mouseleave",()=>{i.style.background="var(--pc-surface-elevated)"}),i}_createPromptSection(){const e=document.createElement("div");e.className="prompt-change-text-section",e.style.cssText="flex:1;display:flex;flex-direction:column;";const t=document.createElement("h3");t.style.cssText="font-size:1rem;font-weight:500;margin:0 0 var(--pc-space-3) 0;",t.textContent="Prompt Text",e.appendChild(t);const n=document.createElement("div");return n.className="prompt-text-content",n.style.cssText=`
      flex: 1;
      padding: var(--pc-space-3);
      background: var(--pc-surface-elevated);
      border-radius: var(--pc-radius-sm);
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      overflow-y: auto;
      min-height: 300px;
    `,this.entry.newPromptText?n.textContent=this.entry.newPromptText:(n.textContent="No prompt text available.",n.style.color="var(--pc-text-secondary)"),e.appendChild(n),e}async _copyPrompt(){const e=this.entry.newPromptText||"";if(!e){f("No prompt to copy");return}try{await navigator.clipboard.writeText(e),f("Prompt copied to clipboard")}catch{f("Failed to copy")}}_formatTimestamp(e){return new Date(e).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}}class Vn{constructor(e={}){this.element=null,this.listContainer=null,this.emptyState=null,this.expandedOverlay=null,this.entries=[],this.expandedEntryId=null,this.onExpandEntry=e.onExpandEntry||null,this.itemComponents=new Map}render(){return this.element?(this.loadHistory(),this.element):(this.element=document.createElement("div"),this.element.className="history-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","history-panel"),this.element.style.cssText="display:flex;flex-direction:column;height:100%;position:relative;overflow:hidden;",this.listContainer=document.createElement("div"),this.listContainer.className="history-list",this.listContainer.style.cssText="flex:1;overflow-y:auto;padding:var(--pc-space-4);",this.element.appendChild(this.listContainer),this.emptyState=this._createEmptyState(),this.element.appendChild(this.emptyState),this.expandedOverlay=document.createElement("div"),this.expandedOverlay.className="history-expanded-overlay",this.expandedOverlay.style.cssText="position:absolute;top:0;left:0;right:0;bottom:0;background:var(--pc-surface);display:none;flex-direction:column;z-index:10;",this.element.appendChild(this.expandedOverlay),this.element.addEventListener("keydown",e=>this._handleKeyDown(e)),this.loadHistory(),this.element)}_createEmptyState(){const e=document.createElement("div");e.className="empty-state",e.style.cssText="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--pc-space-8);text-align:center;color:var(--pc-text-secondary);";const t=document.createElement("div");t.className="empty-state-icon",t.style.cssText="margin-bottom:var(--pc-space-4);opacity:0.5;",t.innerHTML=I("noActivityYet",48);const n=document.createElement("div");n.className="empty-state-title",n.style.cssText="font-size:1.125rem;font-weight:500;margin-bottom:var(--pc-space-2);color:var(--pc-on-surface);",n.textContent="No activity yet";const i=document.createElement("div");return i.className="empty-state-description",i.style.cssText="font-size:0.875rem;",i.textContent="Run Coach to get feedback on your prompt",e.appendChild(t),e.appendChild(n),e.appendChild(i),e}async loadHistory(){this.entries=await Kt(),this.listContainer.innerHTML="",this.itemComponents.clear(),this.entries.length===0?(this.emptyState.style.display="flex",this.listContainer.style.display="none"):(this.emptyState.style.display="none",this.listContainer.style.display="block",this.entries.forEach(e=>{const t=new at(e,{onClick:n=>this.expandItem(n)});this.itemComponents.set(e.id,t),this.listContainer.appendChild(t.render())}))}_createHistoryItem(e){const t=document.createElement("div");t.className="history-item",t.dataset.entryId=e.id,t.style.cssText="padding:var(--pc-space-3) var(--pc-space-4);margin-bottom:var(--pc-space-2);background:var(--pc-surface-elevated);border-radius:var(--pc-radius-md);cursor:pointer;display:flex;align-items:center;gap:var(--pc-space-3);min-height:64px;transition:background-color 0.15s ease;";const n=this._createTypeIcon(e.type);t.appendChild(n);const i=this._createItemContent(e);return t.appendChild(i),t.addEventListener("click",()=>this.expandItem(e.id)),t.addEventListener("mouseenter",()=>{t.style.background="var(--pc-surface-hover)"}),t.addEventListener("mouseleave",()=>{t.style.background="var(--pc-surface-elevated)"}),t}_createTypeIcon(e){const t=document.createElement("span");t.className="history-item-icon",t.style.cssText="width:24px;height:24px;display:flex;align-items:center;justify-content:center;opacity:0.7;";const n={feedback:'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-120v-80h320v-284q0-117-81.5-198.5T480-764q-117 0-198.5 81.5T200-484v244h-40q-33 0-56.5-23.5T80-320v-80q0-21 10.5-39.5T120-469l3-53q8-68 39.5-126t79-101q47.5-43 109-67T480-840q68 0 129 24t109 66.5Q766-707 797-649t40 126l3 52q19 9 29.5 27t10.5 38v92q0 20-10.5 38T840-249v49q0 33-23.5 56.5T760-120H440Zm-80-280q-17 0-28.5-11.5T320-440q0-17 11.5-28.5T360-480q17 0 28.5 11.5T400-440q0 17-11.5 28.5T360-400Zm240 0q-17 0-28.5-11.5T560-440q0-17 11.5-28.5T600-480q17 0 28.5 11.5T640-440q0 17-11.5 28.5T600-400Zm-359-62q-7-106 64-182t177-76q89 0 156.5 56.5T720-519q-91-1-167.5-49T435-698q-16 80-67.5 142.5T241-462Z"/></svg>',result:'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>',"prompt-change":'<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>'};return t.innerHTML=n[e]||"",t}_createItemContent(e){const t=document.createElement("div");t.className="history-item-content",t.style.cssText="flex:1;min-width:0;";const n=document.createElement("div");n.className="history-item-title",n.style.cssText="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";const i=document.createElement("div");return i.className="history-item-subtitle",i.style.cssText="font-size:0.75rem;color:var(--pc-text-secondary);margin-top:2px;",e.type==="feedback"?(n.textContent=e.description||"Coach Feedback",i.textContent=`Score: ${e.overall}% • ${this._formatTime(e.timestamp)}`):e.type==="result"?(n.textContent=`${e.provider}/${e.model}`,i.textContent=`${e.status} • ${this._formatTime(e.timestamp)}`):e.type==="prompt-change"&&(n.textContent="Prompt Updated",i.textContent=this._formatTime(e.timestamp)),t.appendChild(n),t.appendChild(i),t}_formatTime(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}addEntry(e){if(this.entries.push(e),!this.emptyState||!this.listContainer)return;this.emptyState.style.display="none",this.listContainer.style.display="block";const t=new at(e,{onClick:n=>this.expandItem(n)});this.itemComponents.set(e.id,t),this.listContainer.appendChild(t.render())}expandItem(e){const t=this.entries.find(r=>r.id===e);if(!t)return;this.expandedEntryId=e,this.expandedOverlay.style.display="flex",this.expandedOverlay.innerHTML="";const n=this._createExpandedContent(t),i=new ct(t,{onClose:()=>this.collapseItem(),onNavigate:r=>this.navigateExpanded(r),contentComponent:n==null?void 0:n.render()});this.expandedOverlay.appendChild(i.render()),this.expandedOverlay.setAttribute("tabindex","-1"),this.expandedOverlay.focus(),this.onExpandEntry&&this.onExpandEntry(t)}_createExpandedContent(e){switch(e.type){case"feedback":return new Un(e);case"result":return new Gn(e);case"prompt-change":return new Yn(e);default:return null}}_getEntryTitle(e){return{feedback:"Coach Feedback",result:"Test Result","prompt-change":"Prompt Change"}[e.type]||"History Entry"}collapseItem(){this.expandedEntryId=null,this.expandedOverlay.style.display="none",this.expandedOverlay.innerHTML="",this.currentExpandedComponent=null}updateExpandedEntry(e,t){const n=this.entries.find(i=>i.id===e);if(n&&Object.assign(n,t),this.expandedEntryId===e&&n)if(this.currentExpandedComponent&&typeof this.currentExpandedComponent.update=="function")this.currentExpandedComponent.update(t);else{this.expandedOverlay.innerHTML="";const i=this._createExpandedContent(n);this.currentExpandedComponent=i;const r=new ct(n,{onClose:()=>this.collapseItem(),onNavigate:a=>this.navigateExpanded(a),contentComponent:i==null?void 0:i.render()});this.expandedOverlay.appendChild(r.render())}}_handleKeyDown(e){this.expandedEntryId&&(e.key==="Escape"?(e.preventDefault(),this.collapseItem()):e.key==="ArrowDown"?(e.preventDefault(),this.navigateExpanded(1)):e.key==="ArrowUp"&&(e.preventDefault(),this.navigateExpanded(-1)))}navigateExpanded(e){if(!this.expandedEntryId)return;const t=this.entries.findIndex(i=>i.id===this.expandedEntryId);if(t===-1)return;const n=t+e;n<0||n>=this.entries.length||this.expandItem(this.entries[n].id)}clearAll(){this.entries=[],this.expandedEntryId=null,this.itemComponents.clear(),this.listContainer&&(this.listContainer.innerHTML="",this.listContainer.style.display="none"),this.emptyState&&(this.emptyState.style.display="flex"),this.expandedOverlay&&(this.expandedOverlay.style.display="none",this.expandedOverlay.innerHTML="")}scrollToLast(){this.listContainer&&this.listContainer.lastElementChild&&requestAnimationFrame(()=>{this.listContainer.lastElementChild.scrollIntoView({behavior:"smooth",block:"start"})})}expandLastFeedback(){for(let e=this.entries.length-1;e>=0;e--)if(this.entries[e].type==="feedback"){this.expandItem(this.entries[e].id);return}}getExpandedEntryId(){return this.expandedEntryId}}class Wn{constructor(){this.element=null,this.dropZone=null,this.fileInput=null,this.attachmentsList=null,this.emptyState=null,this.clearAllBtn=null,this.attachments=[],this.isDragging=!1}render(){if(this.element)return this.loadAttachments(),this.element;this.element=document.createElement("div"),this.element.className="attachments-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","attachments-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--pc-space-4);
      gap: var(--pc-space-4);
    `;const e=this.createHeader();return this.element.appendChild(e),this.dropZone=this.createDropZone(),this.element.appendChild(this.dropZone),this.fileInput=document.createElement("input"),this.fileInput.type="file",this.fileInput.accept=".txt,.md,.json,text/plain,text/markdown,application/json",this.fileInput.multiple=!0,this.fileInput.style.display="none",this.fileInput.addEventListener("change",t=>this.handleFileSelect(t)),this.element.appendChild(this.fileInput),this.attachmentsList=document.createElement("div"),this.attachmentsList.className="attachments-list",this.attachmentsList.style.cssText=`
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--pc-space-2);
    `,this.element.appendChild(this.attachmentsList),this.emptyState=this.createEmptyState(),this.attachmentsList.appendChild(this.emptyState),this.loadAttachments(),this.element}createHeader(){const e=document.createElement("div");e.className="attachments-header",e.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;const t=document.createElement("h2");return t.textContent="Attachments",t.style.cssText=`
      font-size: 1.125rem;
      font-weight: 500;
      margin: 0;
      color: var(--pc-on-surface);
    `,e.appendChild(t),this.clearAllBtn=document.createElement("button"),this.clearAllBtn.className="btn btn-text",this.clearAllBtn.innerHTML=`${I("clearAll",20)}<span>Clear All</span>`,this.clearAllBtn.style.cssText="display: none; align-items: center; gap: var(--pc-space-2);",this.clearAllBtn.addEventListener("click",()=>this.handleClearAll()),e.appendChild(this.clearAllBtn),e}createDropZone(){const e=document.createElement("div");e.className="drop-zone",e.style.cssText=`
      border: 2px dashed var(--pc-outline);
      border-radius: var(--pc-radius-md);
      padding: var(--pc-space-6);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--pc-surface);
    `;const t=document.createElement("div");return t.className="drop-zone-content",t.innerHTML=`
      <div style="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-2);">
        ${I("upload",32)}
      </div>
      <div style="color: var(--pc-on-surface); font-weight: 500; margin-bottom: var(--pc-space-1);">
        Drop files here
      </div>
      <div style="color: var(--pc-on-surface-variant); font-size: 0.875rem;">
        or tap to browse (.txt, .md, .json)
      </div>
    `,e.appendChild(t),e.addEventListener("click",()=>this.fileInput.click()),e.addEventListener("dragenter",n=>this.handleDragEnter(n)),e.addEventListener("dragover",n=>this.handleDragOver(n)),e.addEventListener("dragleave",n=>this.handleDragLeave(n)),e.addEventListener("drop",n=>this.handleDrop(n)),e}createEmptyState(){const e=document.createElement("div");return e.className="empty-state",e.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--pc-on-surface-variant);
      padding: var(--pc-space-8);
    `,e.innerHTML=`
      <div style="opacity: 0.5; margin-bottom: var(--pc-space-4);">
        ${I("noAttachmentsYet",48)}
      </div>
      <div style="font-weight: 500; margin-bottom: var(--pc-space-1);">No attachments yet</div>
      <div style="font-size: 0.875rem;">Files you attach will appear here</div>
    `,e}handleDragEnter(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!0,this.dropZone.style.borderColor="var(--pc-primary)",this.dropZone.style.backgroundColor="var(--pc-primary-container)"}handleDragOver(e){e.preventDefault(),e.stopPropagation()}handleDragLeave(e){e.preventDefault(),e.stopPropagation(),this.dropZone.contains(e.relatedTarget)||(this.isDragging=!1,this.dropZone.style.borderColor="var(--pc-outline)",this.dropZone.style.backgroundColor="var(--pc-surface)")}async handleDrop(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!1,this.dropZone.style.borderColor="var(--pc-outline)",this.dropZone.style.backgroundColor="var(--pc-surface)";const t=Array.from(e.dataTransfer.files);await this.processFiles(t)}async handleFileSelect(e){const t=Array.from(e.target.files);await this.processFiles(t),e.target.value=""}async processFiles(e){let t=0;for(const n of e)try{await vn(n),t++}catch(i){i instanceof ne?f(i.message,"error"):(f(`Failed to add ${n.name}`,"error"),console.error("Attachment error:",i))}t>0&&(f(`Added ${t} file${t>1?"s":""}`,"success"),await this.loadAttachments())}async loadAttachments(){try{this.attachments=await he(),this.renderAttachmentsList()}catch(e){console.error("Failed to load attachments:",e),f("Failed to load attachments","error")}}renderAttachmentsList(){this.attachmentsList.querySelectorAll(".attachment-item").forEach(n=>n.remove());const t=this.attachments.length>0;this.emptyState.style.display=t?"none":"flex",this.clearAllBtn.style.display=t?"flex":"none";for(const n of this.attachments){const i=this.createAttachmentItem(n);this.attachmentsList.insertBefore(i,this.emptyState)}}createAttachmentItem(e){const t=document.createElement("div");t.className="attachment-item",t.dataset.id=e.id,t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background-color: var(--pc-surface-container);
      border-radius: var(--pc-radius-sm);
      border: 1px solid var(--pc-outline-variant);
    `;const n=document.createElement("div");n.innerHTML=`
      <svg width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" style="color: var(--pc-primary);">
        <path d="M320-440h320v-80H320v80Zm0 120h320v-80H320v80Zm0 120h200v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
      </svg>
    `,t.appendChild(n);const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 0;",i.innerHTML=`
      <div style="font-weight: 500; color: var(--pc-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${this.escapeHtml(e.filename)}
      </div>
      <div style="font-size: 0.75rem; color: var(--pc-on-surface-variant);">
        ${gn(e.size)}
      </div>
    `,t.appendChild(i);const r=document.createElement("button");return r.className="btn btn-icon",r.title="Remove attachment",r.innerHTML='<svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>',r.addEventListener("click",()=>this.handleDelete(e.id)),t.appendChild(r),t}async handleDelete(e){try{await bn(e),await this.loadAttachments(),f("Attachment removed","success")}catch(t){console.error("Failed to delete attachment:",t),f("Failed to remove attachment","error")}}async handleClearAll(){if(!(this.attachments.length===0||!confirm(`Remove all ${this.attachments.length} attachment${this.attachments.length>1?"s":""}?`)))try{const t=await re();await this.loadAttachments(),f(`Removed ${t} attachment${t>1?"s":""}`,"success")}catch(t){console.error("Failed to clear attachments:",t),f("Failed to clear attachments","error")}}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async clearAll(){try{await re(),await this.loadAttachments()}catch(e){console.error("Failed to clear attachments:",e)}}}class lt{constructor(e={}){this.icon=e.icon||"",this.label=e.label||null,this.size=e.size||"default",this.onClick=e.onClick||null,this.ariaLabel=e.ariaLabel||"",this.id=e.id||null,this.element=null,this.disabled=!1,this.loading=!1}getSizeDimensions(){return this.size==="mini"?{diameter:40,iconSize:20,touchTarget:44}:{diameter:56,iconSize:24,touchTarget:56}}_injectStyles(){if(document.getElementById("fab-component-styles"))return;const e=document.createElement("style");e.id="fab-component-styles",e.textContent=`
      @keyframes fab-spinner-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .fab-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      
      .fab-button:hover:not(:disabled) {
        transform: scale(1.05);
      }
      
      .fab-button:active:not(:disabled) {
        transform: scale(0.95);
      }
      
      .fab-button:disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }
      
      .fab-button:focus-visible {
        outline: 2px solid var(--pc-primary);
        outline-offset: 2px;
      }
      
      .fab-spinner {
        position: absolute;
        border-radius: 50%;
        border: 2px solid var(--pc-outline-variant);
        border-top-color: var(--pc-on-primary);
        animation: fab-spinner-rotate 0.8s linear infinite;
        pointer-events: none;
      }
      
      .fab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
      }
      
      .fab-icon.loading {
        opacity: 0.5;
      }
    `,document.head.appendChild(e)}render(){this._injectStyles();const e=this.getSizeDimensions();this.element=document.createElement("button"),this.element.className="fab-button",this.element.setAttribute("role","button"),this.element.setAttribute("aria-label",this.ariaLabel),this.element.setAttribute("tabindex","0"),this.id&&(this.element.id=this.id);const t="var(--pc-primary)",n="var(--pc-on-primary)";this.element.style.cssText=`
      width: ${e.diameter}px;
      height: ${e.diameter}px;
      min-width: ${e.touchTarget}px;
      min-height: ${e.touchTarget}px;
      background-color: ${t};
      color: ${n};
      box-shadow: var(--pc-shadow-md, 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12));
    `;const i=document.createElement("span");return i.className="fab-icon",i.innerHTML=`
      <svg width="${e.iconSize}" height="${e.iconSize}" viewBox="0 -960 960 960" fill="currentColor">
        ${this.icon}
      </svg>
    `,this.element.appendChild(i),this.onClick&&this.element.addEventListener("click",r=>{!this.disabled&&!this.loading&&this.onClick(r)}),this.element.addEventListener("keydown",r=>{(r.key==="Enter"||r.key===" ")&&!this.disabled&&!this.loading&&(r.preventDefault(),this.element.click())}),this.element}setDisabled(e){this.disabled=e,this.element&&(this.element.disabled=e,this.element.setAttribute("aria-disabled",e.toString()))}setLoading(e){if(this.loading=e,!this.element)return;const t=this.element.querySelector(".fab-icon"),n=this.element.querySelector(".fab-spinner");if(e){if(!n){const i=this.getSizeDimensions(),r=document.createElement("div");r.className="fab-spinner",r.style.cssText=`
          width: ${i.diameter-8}px;
          height: ${i.diameter-8}px;
        `,this.element.appendChild(r)}t&&t.classList.add("loading"),this.element.disabled=!0}else n&&n.remove(),t&&t.classList.remove("loading"),this.element.disabled=this.disabled}getElement(){return this.element}setIcon(e){if(this.icon=e,this.element){const t=this.element.querySelector(".fab-icon");if(t){const n=this.getSizeDimensions();t.innerHTML=`
          <svg width="${n.iconSize}" height="${n.iconSize}" viewBox="0 0 24 24" fill="currentColor">
            ${this.icon}
          </svg>
        `}}}}class Xn extends pe{constructor(e={}){super({title:"Session History",...e}),this.onRestoreCallback=e.onRestore||null,this.sessions=[],this.searchQuery="",this.starredOnly=!1,this.searchInput=null,this.listContainer=null,this.emptyState=null,this.filterAllBtn=null,this.filterStarredBtn=null,this.searchTimeout=null}render(){super.render(),this.element.style.maxWidth="90vw",this.element.style.width="400px",this.element.style.maxHeight="85vh";const e=document.createElement("div");e.style.cssText=`
      display: flex;
      flex-direction: column;
      gap: var(--pc-space-3);
      min-height: 300px;
      max-height: 70vh;
    `,this.searchInput=document.createElement("input"),this.searchInput.type="text",this.searchInput.placeholder="Search sessions...",this.searchInput.className="input",this.searchInput.style.cssText="width: 100%;",this.searchInput.addEventListener("input",n=>this.handleSearch(n.target.value)),e.appendChild(this.searchInput);const t=document.createElement("div");return t.style.cssText=`
      display: flex;
      gap: var(--pc-space-2);
    `,this.filterAllBtn=document.createElement("button"),this.filterAllBtn.className="btn btn-filled",this.filterAllBtn.textContent="All",this.filterAllBtn.style.cssText="flex: 1; min-height: 36px;",this.filterAllBtn.addEventListener("click",()=>this.setFilter(!1)),this.filterStarredBtn=document.createElement("button"),this.filterStarredBtn.className="btn btn-outlined",this.filterStarredBtn.textContent="★ Starred",this.filterStarredBtn.style.cssText="flex: 1; min-height: 36px;",this.filterStarredBtn.addEventListener("click",()=>this.setFilter(!0)),t.appendChild(this.filterAllBtn),t.appendChild(this.filterStarredBtn),e.appendChild(t),this.listContainer=document.createElement("div"),this.listContainer.className="history-list",this.listContainer.style.cssText=`
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--pc-space-2);
    `,e.appendChild(this.listContainer),this.emptyState=document.createElement("div"),this.emptyState.className="empty-state",this.emptyState.style.cssText=`
      flex: 1;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--pc-space-6);
      text-align: center;
      color: var(--pc-on-surface-variant);
    `,this.emptyState.innerHTML=`
      <div style="opacity: 0.5; margin-bottom: var(--pc-space-3);">
        ${I("noSessionsFound",48)}
      </div>
      <div style="font-weight: 500; margin-bottom: var(--pc-space-1);">No sessions found</div>
      <div style="font-size: 0.875rem;">Start coaching to create your first session.</div>
    `,e.appendChild(this.emptyState),this.setContent(e),this.addAction("Close",()=>this.close(),"text"),this.overlay}async show(){super.show(),await this.loadSessions(),this.searchInput&&this.searchInput.focus()}async loadSessions(){try{this.sessions=await Sn({starredOnly:this.starredOnly,searchQuery:this.searchQuery}),this.renderSessionList()}catch(e){console.error("Failed to load sessions:",e),f("Failed to load session history","error")}}renderSessionList(){if(this.listContainer.innerHTML="",this.sessions.length===0){this.listContainer.style.display="none",this.emptyState.style.display="flex";const e=this.emptyState.querySelector("div:last-child");this.searchQuery?e.textContent="No sessions match your search.":this.starredOnly?e.textContent="No starred sessions yet.":e.textContent="Start coaching to create your first session.";return}this.listContainer.style.display="flex",this.emptyState.style.display="none",this.sessions.forEach(e=>{const t=this.createSessionItem(e);this.listContainer.appendChild(t)})}createSessionItem(e){const t=document.createElement("div");t.className="history-item",t.style.cssText=`
      display: flex;
      align-items: flex-start;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background: var(--pc-surface-container);
      border-radius: var(--pc-radius-sm);
      cursor: pointer;
      transition: background-color var(--pc-duration-fast) var(--pc-easing);
    `;const n=document.createElement("button");n.className="btn-icon",n.setAttribute("aria-label",e.starred?"Unstar session":"Star session"),n.style.cssText=`
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--pc-space-1);
      color: ${e.starred?"#F59E0B":"var(--pc-on-surface-variant)"};
      flex-shrink: 0;
    `,n.innerHTML=e.starred?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>',n.addEventListener("click",async d=>{d.stopPropagation(),await this.handleToggleStar(e.id,n)}),t.appendChild(n);const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 0;";const r=document.createElement("div");r.style.cssText=`
      font-size: 0.875rem;
      color: var(--pc-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: var(--pc-space-1);
    `,r.textContent=e.previewText,i.appendChild(r);const a=document.createElement("div");a.style.cssText=`
      font-size: 0.75rem;
      color: var(--pc-on-surface-variant);
      display: flex;
      flex-wrap: wrap;
      gap: var(--pc-space-2);
    `;const o=new Date(e.archivedAt),l=o.toLocaleDateString(void 0,{month:"short",day:"numeric",year:o.getFullYear()!==new Date().getFullYear()?"numeric":void 0}),c=[];if(c.push(l),e.feedbackCount>0&&c.push(`${e.feedbackCount} review${e.feedbackCount!==1?"s":""}`),e.resultCount>0&&c.push(`${e.resultCount} test${e.resultCount!==1?"s":""}`),a.textContent=c.join(" • "),i.appendChild(a),t.appendChild(i),e.finalScore!==null&&e.finalScore!==void 0){const d=document.createElement("div"),y=e.finalScore>=80?"var(--pc-primary)":e.finalScore>=60?"#F59E0B":"#EF4444";d.style.cssText=`
        min-width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${y};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.75rem;
        flex-shrink: 0;
      `,d.textContent=e.finalScore,t.appendChild(d)}const p=document.createElement("div");p.style.cssText=`
      display: flex;
      gap: var(--pc-space-1);
      flex-shrink: 0;
    `;const m=document.createElement("button");m.className="btn btn-text",m.textContent="Restore",m.style.cssText="min-height: 32px; padding: 0 var(--pc-space-2); font-size: 0.75rem;",m.addEventListener("click",async d=>{d.stopPropagation(),await this.handleRestore(e.id)}),p.appendChild(m);const h=document.createElement("button");return h.className="btn-icon",h.setAttribute("aria-label","Delete session"),h.style.cssText=`
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--pc-space-1);
      color: var(--pc-on-surface-variant);
      min-width: 32px;
      min-height: 32px;
    `,h.innerHTML=I("deleteSession",18),h.addEventListener("click",async d=>{d.stopPropagation(),await this.handleDelete(e.id)}),p.appendChild(h),t.appendChild(p),t.addEventListener("click",()=>this.handleRestore(e.id)),t.addEventListener("mouseenter",()=>{t.style.backgroundColor="var(--pc-surface-variant)"}),t.addEventListener("mouseleave",()=>{t.style.backgroundColor="var(--pc-surface-container)"}),t}handleSearch(e){this.searchTimeout&&clearTimeout(this.searchTimeout),this.searchTimeout=setTimeout(()=>{this.searchQuery=e,this.loadSessions()},300)}setFilter(e){this.starredOnly=e,e?(this.filterAllBtn.className="btn btn-outlined",this.filterStarredBtn.className="btn btn-filled"):(this.filterAllBtn.className="btn btn-filled",this.filterStarredBtn.className="btn btn-outlined"),this.loadSessions()}async handleToggleStar(e,t){try{const n=await An(e);t.style.color=n?"#F59E0B":"var(--pc-on-surface-variant)",t.innerHTML=n?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>',t.setAttribute("aria-label",n?"Unstar session":"Star session"),this.starredOnly&&!n&&await this.loadSessions()}catch(n){console.error("Failed to toggle star:",n),f("Failed to update session","error")}}async handleRestore(e){try{await Pn(e),f("Session restored"),this.close(),this.onRestoreCallback&&this.onRestoreCallback(e)}catch(t){console.error("Failed to restore session:",t),f("Failed to restore session","error")}}async handleDelete(e){if(await kt("Delete Session?","This session will be permanently deleted. This action cannot be undone.",{confirmLabel:"Delete",destructive:!0}))try{await Nn(e,{skipConfirmation:!0}),f("Session deleted"),await this.loadSessions()}catch(n){console.error("Failed to delete session:",n),f("Failed to delete session","error")}}}class Jn{constructor(){this.element=null,this.contentArea=null,this.currentTab=le().currentTab||"prompt",this.tabs={},this.menuPanel=null,this.feedbackPanel=null,this.ribbon=null,this.fabContainer=null,this.coachFab=null,this.testFab=null}render(){this.element=document.createElement("div"),this.element.className="app-shell",this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
    `,this.ribbon=new Xt({onMenuClick:()=>this.toggleMenu(),onScoreClick:()=>this.handleScoreClick()}),this.element.appendChild(this.ribbon.render()),this.contentArea=document.createElement("main"),this.contentArea.id="main-content",this.contentArea.className="app-content",this.contentArea.setAttribute("tabindex","-1"),this.contentArea.style.cssText=`
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    `,this.element.appendChild(this.contentArea),this.createFabContainer(),this.element.appendChild(this.fabContainer),this.tabBar=new Qt({currentTab:this.currentTab,onTabChange:t=>this.switchTab(t)}),this.element.appendChild(this.tabBar.render()),this.menuPanel=new Ln({onClose:()=>this.closeMenu(),onNewSession:()=>this.handleNewSession(),onShowHistory:()=>this.handleShowHistory(),onCopyPrompt:()=>this.handleCopyPrompt(),onTogglePreview:t=>this.handleTogglePreview(t)}),this.element.appendChild(this.menuPanel.render()),xn(()=>this.handleSessionClear()),wn(t=>this.handleSessionRestore(t)),this.feedbackPanel=new $n({onClose:()=>{},onPin:t=>this.handleFeedbackPinChange(t),onSkipContinue:()=>this.handleSkipContinue(),onNewSession:()=>this.startNewSessionFromCompletion()});const e=this.feedbackPanel.render();return this.element.appendChild(this.feedbackPanel.getBackdrop()),this.element.appendChild(e),this.initTabs(),this.showTab(this.currentTab),this.element}createFabContainer(){this.fabContainer=document.createElement("div"),this.fabContainer.className="fab-container",this.fabContainer.style.cssText=`
      position: fixed;
      bottom: 80px;
      right: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      z-index: var(--pc-z-fab, 100);
      pointer-events: none;
    `,this.testFab=new lt({icon:`<path d="${Ue("test")}"/>`,size:"mini",ariaLabel:"Test prompt",id:"test-fab",onClick:()=>this.handleTestFabClick()});const e=this.testFab.render();e.style.pointerEvents="auto",this.fabContainer.appendChild(e),this.coachFab=new lt({icon:`<path d="${Ue("coach")}"/>`,size:"default",ariaLabel:"Coach prompt",id:"coach-fab",onClick:()=>this.handleCoachFabClick()});const t=this.coachFab.render();t.style.pointerEvents="auto",this.fabContainer.appendChild(t)}handleCoachFabClick(){if(!this.tabs.prompt||!this.tabs.prompt.promptText.trim()){f("Please enter a prompt first");return}this.coachFab.setLoading(!0),this.tabs.prompt.runCoach().finally(()=>{this.coachFab.setLoading(!1)})}handleTestFabClick(){if(!this.tabs.prompt||!this.tabs.prompt.promptText.trim()){f("Please enter a prompt first");return}this.testFab.setLoading(!0),this.tabs.prompt.runTest().finally(()=>{this.testFab.setLoading(!1)})}updateFabVisibility(){this.fabContainer&&(this.fabContainer.style.display=this.currentTab==="prompt"?"flex":"none")}initTabs(){this.tabs={prompt:new jn,activity:new Vn,attachments:new Wn},this.tabs.prompt.setHistoryTab(this.tabs.activity),this.tabs.prompt.setOnSwitchToHistory(()=>this.switchToActivityWithExpand()),this.tabs.prompt.onShowFeedbackStreaming=e=>this.showFeedbackStreaming(e),this.tabs.prompt.onFeedbackStreamChunk=e=>this.appendFeedbackChunk(e),this.tabs.prompt.onFinalizeFeedbackStreaming=e=>this.finalizeFeedbackStreaming(e),this.tabs.prompt.onHideFeedbackPanel=()=>this.hideFeedbackPanel(),this.tabs.prompt.setOnShowFeedback(e=>this.showFeedback(e))}switchToActivityWithExpand(){this.switchTab("activity"),requestAnimationFrame(()=>{if(this.tabs.activity&&this.tabs.activity.entries.length>0){const e=this.tabs.activity.entries[this.tabs.activity.entries.length-1];this.tabs.activity.expandItem(e.id)}})}switchTab(e){this.currentTab=e,F("currentTab",e),this.showTab(e),this.tabBar&&this.tabBar.setActiveTab(e),this.updateFabVisibility()}showTab(e){this.contentArea.innerHTML="";const t=this.tabs[e];t&&this.contentArea.appendChild(t.render())}toggleMenu(){this.menuPanel&&this.menuPanel.toggle()}closeMenu(){this.menuPanel&&this.menuPanel.hide()}showFeedback(e){this.feedbackPanel&&this.feedbackPanel.show(e),this.ribbon&&e.overall!==void 0&&this.ribbon.updateScore(e.overall,e.description)}showFeedbackStreaming(e){this.feedbackPanel&&this.feedbackPanel.showStreaming(e)}appendFeedbackChunk(e){this.feedbackPanel&&this.feedbackPanel.appendStreamingChunk(e)}finalizeFeedbackStreaming(e){this.feedbackPanel&&this.feedbackPanel.finalizeStreaming(e),this.ribbon&&e.overall!==void 0&&this.ribbon.updateScore(e.overall,e.description)}hideFeedbackPanel(){this.feedbackPanel&&this.feedbackPanel.hide(!0)}handleFeedbackPinChange(e){if(e){const t=this.feedbackPanel.element;t&&this.contentArea&&this.element.insertBefore(t,this.contentArea)}else{const t=this.feedbackPanel.element;t&&this.element.appendChild(t)}}handleSkipContinue(){this.tabs.prompt&&this.tabs.prompt.runCoach()}handleScoreClick(){this.switchTab("activity"),this.tabs.activity&&this.tabs.activity.expandLastFeedback()}handleNewSession(){this.switchTab("prompt")}handleCopyPrompt(){this.tabs.prompt&&this.tabs.prompt.copyPrompt()}handleTogglePreview(e){this.tabs.prompt&&this.tabs.prompt.setMode(e)}async startNewSessionFromCompletion(){await Tt({skipConfirmation:!0})&&(f("New session started"),this.switchTab("prompt"))}handleShowHistory(){new Xn({onRestore:()=>{}}).show()}handleSessionClear(){this.tabs.prompt&&this.tabs.prompt.resetSession(),this.tabs.activity&&this.tabs.activity.clearAll(),this.tabs.attachments&&this.tabs.attachments.clearAll(),this.ribbon&&this.ribbon.updateScore(null,null),ae.clear(),this.feedbackPanel&&this.feedbackPanel.hide(),this.switchTab("prompt")}handleSessionRestore(e){this.tabs.prompt&&e.prompt&&(this.tabs.prompt.promptText=e.prompt,this.tabs.prompt.textarea&&(this.tabs.prompt.textarea.value=e.prompt)),this.tabs.activity&&this.tabs.activity.loadHistory(),this.tabs.attachments&&this.tabs.attachments.loadAttachments(),this.ribbon&&e.finalScore!==void 0&&this.ribbon.updateScore(e.finalScore,e.finalDescription),this.switchTab("prompt")}}class Qn{constructor(e={}){this.onDismiss=e.onDismiss||null,this.element=null}render(){this.element=document.createElement("div"),this.element.className="first-run-overlay",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","first-run-title");const e=document.createElement("h1");e.id="first-run-title",e.className="first-run-title",e.textContent="Welcome to Prompt Coach";const t=document.createElement("p");t.className="first-run-description",t.textContent="Improve your prompting skills with AI-powered coaching. Get feedback on your prompts and learn best practices.";const n=document.createElement("button");return n.className="first-run-btn",n.textContent="Get Started",n.addEventListener("click",()=>this.dismiss()),this.element.appendChild(e),this.element.appendChild(t),this.element.appendChild(n),this.element}show(){this.element||this.render(),document.body.appendChild(this.element);const e=this.element.querySelector("button");e&&e.focus()}dismiss(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.onDismiss&&this.onDismiss()}}class es extends pe{constructor(){super({title:"Configure API Key"}),this.inputs={}}createContent(){const e=document.createElement("div"),t=document.createElement("p");t.className="text-body",t.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-4);",t.textContent="API keys are stored locally on your device. You can add more providers later in Settings.",e.appendChild(t);const n=document.createElement("div");n.style.cssText="margin-bottom: var(--pc-space-4);";const i=document.createElement("label");i.className="text-label",i.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",i.textContent="Provider";const r=document.createElement("select");r.className="input",r.innerHTML=`
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
      <option value="google">Google</option>
      <option value="x">X (Grok)</option>
    `,this.providerSelect=r,n.appendChild(i),n.appendChild(r),e.appendChild(n);const a=document.createElement("div");a.style.cssText="margin-bottom: var(--pc-space-4);";const o=document.createElement("label");o.className="text-label",o.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",o.textContent="API Key";const l=document.createElement("input");return l.type="password",l.className="input",l.placeholder="Enter your API key",l.autocomplete="off",this.keyInput=l,a.appendChild(o),a.appendChild(l),e.appendChild(a),e}show(){this.render(),this.setContent(this.createContent()),this.addAction("Skip",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show(),setTimeout(()=>{this.keyInput.focus()},100)}save(){const e=this.providerSelect.value,t=this.keyInput.value.trim();if(!t){f("Please enter an API key");return}ut("apiKeys",{[e]:t}),f("API key saved"),this.close()}}function ts(){const s=document.getElementById("loader");if(!s)return;s.style.pointerEvents="none";const e=2e3,t=2e3,n=performance.now(),i=h=>h===1?1:1-Math.pow(2,-10*h),r=Math.random()*Math.PI*2,a=Math.random()*Math.PI*2,o=.25+Math.random()*.125,l=.1875+Math.random()*.125,c=60,p=48;function m(h){const d=h-n,y=Math.min(d/e,1),u=Math.min(d/t,1),g=d/2e3*Math.PI*2,b=50+Math.sin(g*o+r)*c*(1-u),v=50+Math.cos(g*l+a)*p*(1-u),x=1-u,k=20*(1-i(y));s.style.backdropFilter=`blur(${k}px)`,s.style.webkitBackdropFilter=`blur(${k}px)`,s.style.background=`radial-gradient(
      circle at ${b}% ${v}%,
      transparent 0%,
      rgba(28, 27, 31, ${x*.1}) 15%,
      rgba(28, 27, 31, ${x*.4}) 40%,
      rgba(28, 27, 31, ${x*.7}) 70%,
      rgba(28, 27, 31, ${x}) 100%
    )`,u<1?requestAnimationFrame(m):s.remove()}requestAnimationFrame(m)}async function dt(){try{Vt(),await T(),await N();const s=le(),e=document.getElementById("app"),t=new Jn;e.appendChild(t.render()),ts(),s.firstRunCompleted||new Qn({onDismiss:()=>{F("firstRunCompleted",!0),we()||new es().show()}}).show(),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})}),cn(),window.canInstallPWA=He,ns()}catch(s){console.error("Failed to initialize app:",s),document.getElementById("app").innerHTML=`
      <div class="empty-state" style="height: 100vh;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Something went wrong</div>
        <div class="empty-state-description">Please refresh the page to try again.</div>
      </div>
    `}}function ns(){const s=document.createElement("div");s.id="offline-banner",s.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #EF4444;
    color: white;
    padding: 8px 16px;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 10000;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  `,s.innerHTML=`
    <span style="margin-right: 8px;">⚠️</span>
    You're offline. Some features may not work.
  `,document.body.appendChild(s);function e(){navigator.onLine?s.style.transform="translateY(-100%)":s.style.transform="translateY(0)"}window.addEventListener("online",e),window.addEventListener("offline",e),e()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",dt):dt();
