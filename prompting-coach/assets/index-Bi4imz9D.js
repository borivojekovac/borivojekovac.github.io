var Ze=Object.defineProperty;var Qe=(n,e,t)=>e in n?Ze(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var S=(n,e,t)=>Qe(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const J="logs";let K=null;function et(n){K=n}function U(n){return{id:crypto.randomUUID(),timestamp:new Date().toISOString(),type:n.type||"request",provider:n.provider||"",model:n.model||"",promptLength:n.promptLength||0,responseLength:n.responseLength||null,tokens:n.tokens||null,error:n.error||null,durationMs:n.durationMs||0}}async function G(n){if(!K){console.warn("Logger: Database not initialized");return}if(!K.objectStoreNames.contains(J)){console.warn("Logger: Logs store not found - DB may need upgrade. Clear site data to fix.");return}return new Promise((e,t)=>{try{const s=K.transaction(J,"readwrite");s.objectStore(J).add(n),s.oncomplete=()=>e(),s.onerror=()=>t(s.error)}catch(s){console.error("Logger: Failed to save log",s),e()}})}async function ze(n,e,t){const s=U({type:"request",provider:n,model:e,promptLength:t});return await G(s),s}async function $e(n,e,t,s,i){const o=U({type:"response",provider:n,model:e,responseLength:t,tokens:s,durationMs:i});await G(o)}async function se(n,e,t,s){const i=U({type:"error",provider:n,model:e,error:t,durationMs:s});await G(i)}async function tt(n,e="",t=""){const s=U({type:"skip",provider:e,model:t,error:null,durationMs:0});s.principleId=n,await G(s)}const ne="promptcoach",st=5;let M=null;const be=["sessions","logs","feedback","promptHistory","attachments"];async function k(){if(M){const n=be.filter(e=>!M.objectStoreNames.contains(e));if(n.length===0)return M;console.warn("IndexedDB missing stores:",n,"- resetting database"),M.close(),M=null,await nt()}return new Promise((n,e)=>{const t=indexedDB.open(ne,st);t.onerror=()=>e(t.error),t.onsuccess=()=>{M=t.result;const s=be.filter(i=>!M.objectStoreNames.contains(i));if(s.length>0){console.warn("IndexedDB still missing stores after open:",s,"- deleting and retrying"),M.close(),M=null,indexedDB.deleteDatabase(ne),setTimeout(()=>{k().then(n).catch(e)},100);return}et(M),n(M)},t.onupgradeneeded=s=>{const i=s.target.result;if(!i.objectStoreNames.contains("sessions")){const o=i.createObjectStore("sessions",{keyPath:"id"});o.createIndex("createdAt","createdAt",{unique:!1}),o.createIndex("updatedAt","updatedAt",{unique:!1})}if(!i.objectStoreNames.contains("logs")){const o=i.createObjectStore("logs",{keyPath:"id"});o.createIndex("timestamp","timestamp",{unique:!1}),o.createIndex("type","type",{unique:!1}),o.createIndex("provider","provider",{unique:!1})}if(!i.objectStoreNames.contains("feedback")){const o=i.createObjectStore("feedback",{keyPath:"id"});o.createIndex("sessionId","sessionId",{unique:!1}),o.createIndex("timestamp","timestamp",{unique:!1})}if(i.objectStoreNames.contains("promptHistory")||i.createObjectStore("promptHistory",{keyPath:"id"}),!i.objectStoreNames.contains("attachments")){const o=i.createObjectStore("attachments",{keyPath:"id"});o.createIndex("addedAt","addedAt",{unique:!1}),o.createIndex("filename","filename",{unique:!1})}}})}function nt(){return new Promise(n=>{const e=indexedDB.deleteDatabase(ne);e.onsuccess=()=>n(),e.onerror=()=>n(),e.onblocked=()=>{console.warn("IndexedDB delete blocked - close other tabs"),n()}})}async function ue(n,e){const t=await k();return new Promise((s,i)=>{const a=t.transaction(n,"readonly").objectStore(n).get(e);a.onerror=()=>i(a.error),a.onsuccess=()=>s(a.result)})}async function O(n,e){const t=await k();return new Promise((s,i)=>{const a=t.transaction(n,"readwrite").objectStore(n).put(e);a.onerror=()=>i(a.error),a.onsuccess=()=>s()})}async function me(n){const e=await k();return new Promise((t,s)=>{const r=e.transaction(n,"readonly").objectStore(n).getAll();r.onerror=()=>s(r.error),r.onsuccess=()=>t(r.result)})}async function it(n,e){const t=await k();return new Promise((s,i)=>{const a=t.transaction(n,"readwrite").objectStore(n).delete(e);a.onerror=()=>i(a.error),a.onsuccess=()=>s()})}async function ot(n){const e=await k();return new Promise((t,s)=>{const r=e.transaction(n,"readwrite").objectStore(n).clear();r.onerror=()=>s(r.error),r.onsuccess=()=>t()})}const Fe="promptcoach_appstate",j="promptcoach_settings",Ke="promptcoach_current_session",xe={currentTab:"prompt",firstRunCompleted:!1,feedbackPanelPinned:!1,feedbackPanelRatio:.5},z={theme:"system",apiKeys:{openai:null,anthropic:null,google:null,x:null},coachProvider:"openai",coachModel:null,testProvider:"openai",testModel:null};function Y(){try{const n=localStorage.getItem(Fe);if(n)return{...xe,...JSON.parse(n)}}catch(n){console.error("Failed to load AppState:",n)}return{...xe}}function rt(n){try{["prompt","feedback","attachments","results"].includes(n.currentTab)||(n.currentTab="prompt"),(n.feedbackPanelRatio<.2||n.feedbackPanelRatio>.8)&&(n.feedbackPanelRatio=.5),localStorage.setItem(Fe,JSON.stringify(n))}catch(e){console.error("Failed to save AppState:",e)}}function V(n,e){const t=Y();return t[n]=e,rt(t),t}function A(){var n;try{const e=localStorage.getItem(j);if(e){const t=JSON.parse(e);return t.apiKey&&!((n=t.apiKeys)!=null&&n.openai)&&(t.apiKeys=t.apiKeys||{},t.apiKeys.openai=t.apiKey,delete t.apiKey,localStorage.setItem(j,JSON.stringify(t)),console.log("Settings: Migrated legacy apiKey to apiKeys.openai")),t.model&&!t.testModel&&(t.testModel=t.model,t.coachModel=t.model,delete t.model,localStorage.setItem(j,JSON.stringify(t)),console.log("Settings: Migrated legacy model to testModel/coachModel")),{...z,...t,apiKeys:{...z.apiKeys,...t.apiKeys}}}}catch(e){console.error("Failed to load Settings:",e)}return{...z,apiKeys:{...z.apiKeys}}}function je(n){try{["system","light","dark"].includes(n.theme)||(n.theme="system");const t=["openai","anthropic","google","x"];t.includes(n.coachProvider)||(n.coachProvider="openai"),t.includes(n.testProvider)||(n.testProvider="openai"),localStorage.setItem(j,JSON.stringify(n))}catch(e){console.error("Failed to save Settings:",e)}}function qe(n,e){const t=A();return n==="apiKeys"?t.apiKeys={...t.apiKeys,...e}:t[n]=e,je(t),t}function ie(){const n=A();return Object.values(n.apiKeys).some(e=>e&&e.trim()!=="")}function fe(){try{const n=localStorage.getItem(Ke);if(n)return JSON.parse(n).sessionId}catch(n){console.error("Failed to load current session ID:",n)}return null}function at(n){try{localStorage.setItem(Ke,JSON.stringify({sessionId:n}))}catch(e){console.error("Failed to save current session ID:",e)}}async function lt(){const n={id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),promptText:"",promptHistory:[],results:[],totalTokens:0,lastScore:null,lastDescription:null,feedbackCount:0};return await O("sessions",n),at(n.id),n}async function P(){await k();const n=fe();if(n){const e=await ue("sessions",n);if(e)return e}return lt()}async function _(n){const t={...await P(),...n,updatedAt:new Date().toISOString()};return await O("sessions",t),t}let W=null;function Z(n){W&&clearTimeout(W),W=setTimeout(async()=>{await _({promptText:n})},500)}async function ct(n){var t;const e=await P();return e.results||(e.results=[]),e.results.push(n),(t=n.tokens)!=null&&t.total&&(e.totalTokens=(e.totalTokens||0)+n.tokens.total),_({results:e.results,totalTokens:e.totalTokens})}async function we(){return(await P()).results||[]}async function dt(){return _({results:[],totalTokens:0})}async function Ee(n,e){const t=await P();if(!t.results)return t;const s=t.results.findIndex(i=>i.id===n);return s!==-1?(t.results[s]={...t.results[s],...e},e.tokens&&(t.totalTokens=t.results.reduce((i,o)=>{var r;return i+(((r=o.tokens)==null?void 0:r.total)||0)},0)),_({results:t.results,totalTokens:t.totalTokens})):t}function pt(n={}){return{id:crypto.randomUUID(),timestamp:new Date().toISOString(),promptSnapshot:n.promptSnapshot||"",provider:n.provider||"",model:n.model||"",responseText:n.responseText||"",tokens:n.tokens||{prompt:0,completion:0,total:0},durationMs:n.durationMs||0,error:n.error||null,status:n.status||"streaming"}}function ht(n={}){return{id:crypto.randomUUID(),sessionId:fe(),timestamp:new Date().toISOString(),promptSnapshot:n.promptSnapshot||"",scores:n.scores||[],overall:n.overall||0,description:n.description||"",feedback:n.feedback||"",provider:n.provider||"",model:n.model||"",durationMs:n.durationMs||0,targetPrinciple:n.targetPrinciple||null,complete:n.complete||!1}}async function ut(n){await k();try{await O("feedback",n)}catch(t){console.warn("Failed to save feedback to IndexedDB - DB may need upgrade. Clear site data to fix.",t)}const e=await P();return await _({lastScore:n.overall,lastDescription:n.description,feedbackCount:(e.feedbackCount||0)+1}),n}async function mt(){await k();const n=fe();if(!n)return[];try{return(await me("feedback")).filter(t=>t.sessionId===n).sort((t,s)=>new Date(s.timestamp)-new Date(t.timestamp))}catch(e){return console.warn("Failed to get feedback from IndexedDB - DB may need upgrade.",e),[]}}const Ce="data-theme";function oe(n){const e=document.documentElement;n==="system"?e.removeAttribute(Ce):e.setAttribute(Ce,n);const t=document.querySelector('meta[name="theme-color"]');if(t){const s=n==="dark"||n==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches;t.setAttribute("content",s?"#1C1B1F":"#6750A4")}}function ft(n){qe("theme",n),oe(n)}function gt(){const n=A();oe(n.theme),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{A().theme==="system"&&oe("system")})}class vt{constructor(){this.element=null,this.ringEl=null,this.scoreEl=null,this.score=null,this.description=null,this.onClick=null}render(){this.element=document.createElement("div"),this.element.className="score-badge",this.element.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `,this.element.title="Not evaluated",this.element.addEventListener("click",()=>{this.onClick&&this.onClick()});const e=document.createElement("div");e.style.cssText=`
      position: relative;
      width: 32px;
      height: 32px;
    `;const t=document.createElementNS("http://www.w3.org/2000/svg","svg");t.setAttribute("width","32"),t.setAttribute("height","32"),t.setAttribute("viewBox","0 0 36 36"),t.style.cssText="transform: rotate(-90deg);";const s=document.createElementNS("http://www.w3.org/2000/svg","circle");return s.setAttribute("cx","18"),s.setAttribute("cy","18"),s.setAttribute("r","16"),s.setAttribute("fill","none"),s.setAttribute("stroke","var(--pc-surface-container-high)"),s.setAttribute("stroke-width","4"),t.appendChild(s),this.ringEl=document.createElementNS("http://www.w3.org/2000/svg","circle"),this.ringEl.setAttribute("cx","18"),this.ringEl.setAttribute("cy","18"),this.ringEl.setAttribute("r","16"),this.ringEl.setAttribute("fill","none"),this.ringEl.setAttribute("stroke","var(--pc-primary)"),this.ringEl.setAttribute("stroke-width","4"),this.ringEl.setAttribute("stroke-linecap","round"),this.ringEl.setAttribute("stroke-dasharray","100.53"),this.ringEl.setAttribute("stroke-dashoffset","100.53"),this.ringEl.style.cssText="transition: stroke-dashoffset 500ms ease-out;",t.appendChild(this.ringEl),e.appendChild(t),this.scoreEl=document.createElement("div"),this.scoreEl.style.cssText=`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--pc-on-surface);
    `,this.scoreEl.textContent="—",e.appendChild(this.scoreEl),this.element.appendChild(e),this.element}setScore(e,t){this.score=e,this.description=t,this.scoreEl.textContent=Math.round(e);const i=100.53*(1-e/100);this.ringEl.setAttribute("stroke-dashoffset",i.toString()),e>=80?this.ringEl.setAttribute("stroke","var(--pc-primary)"):e>=60?this.ringEl.setAttribute("stroke","#F59E0B"):this.ringEl.setAttribute("stroke","#EF4444"),this.element.title=t||`Score: ${Math.round(e)}`}clear(){this.score=null,this.description=null,this.scoreEl.textContent="—",this.ringEl.setAttribute("stroke-dashoffset","100.53"),this.ringEl.setAttribute("stroke","var(--pc-primary)"),this.element.title="Not evaluated"}setOnClick(e){this.onClick=e}getScore(){return this.score}}class yt{constructor(e={}){this.onMenuClick=e.onMenuClick||null,this.onScoreClick=e.onScoreClick||null,this.element=null,this.scoreBadge=null}render(){this.element=document.createElement("header"),this.element.className="ribbon",this.element.style.cssText=`
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
    `,e.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    `,e.addEventListener("click",()=>{this.onMenuClick&&this.onMenuClick()}),this.element.appendChild(e);const t=document.createElement("h1");t.className="text-title-lg",t.style.cssText=`
      flex: 1;
      margin: 0 var(--pc-space-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,t.textContent="Prompt Coach",this.element.appendChild(t),this.scoreBadge=new vt,this.scoreBadge.setOnClick(()=>{this.onScoreClick&&this.onScoreClick()});const s=document.createElement("div");return s.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      margin-right: var(--pc-space-2);
      background-color: var(--pc-surface);
      border-radius: 50%;
      overflow: visible;
    `,s.appendChild(this.scoreBadge.render()),this.element.appendChild(s),this.loadPersistedScore(),this.element}async loadPersistedScore(){try{const e=await P();e.lastScore!==null&&e.lastScore!==void 0&&this.scoreBadge.setScore(e.lastScore,e.lastDescription||"")}catch(e){console.warn("Ribbon: Failed to load persisted score",e)}}updateScore(e,t){e===null?this.scoreBadge.clear():this.scoreBadge.setScore(e,t)}getScoreBadge(){return this.scoreBadge}}const bt=[{id:"prompt",label:"Prompt",icon:"edit"},{id:"feedback",label:"Feedback",icon:"chat"},{id:"attachments",label:"Attachments",icon:"clip"},{id:"results",label:"Results",icon:"chart"}];class xt{constructor(e={}){this.currentTab=e.currentTab||"prompt",this.onTabChange=e.onTabChange||null,this.element=null,this.tabButtons={}}getIcon(e){return`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${{edit:'<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',chat:'<path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H6l-2 2V4h16v12z"/>',clip:'<path d="M16.5 6v11.5a4 4 0 01-8 0V5a2.5 2.5 0 015 0v10.5a1 1 0 01-2 0V6H10v9.5a2.5 2.5 0 005 0V5a4 4 0 00-8 0v12.5a5.5 5.5 0 0011 0V6h-1.5z"/>',chart:'<path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>'}[e]||""}</svg>`}render(){return this.element=document.createElement("nav"),this.element.className="tab-bar",this.element.setAttribute("role","tablist"),this.element.style.cssText=`
      display: flex;
      height: 64px;
      background-color: var(--pc-surface);
      border-top: 1px solid var(--pc-outline-variant);
      flex-shrink: 0;
    `,bt.forEach(e=>{const t=this.createTabButton(e);this.tabButtons[e.id]=t,this.element.appendChild(t)}),this.updateActiveTab(),this.element}createTabButton(e){const t=document.createElement("button");t.className="tab-button",t.setAttribute("role","tab"),t.setAttribute("aria-selected",e.id===this.currentTab),t.setAttribute("aria-controls",`${e.id}-panel`),t.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: var(--pc-space-2);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--pc-on-surface-variant);
      transition: color var(--pc-duration-fast) var(--pc-easing);
      min-width: 44px;
      min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    `;const s=document.createElement("span");s.className="tab-icon",s.innerHTML=this.getIcon(e.icon);const i=document.createElement("span");return i.className="tab-label",i.style.cssText="font-size: 0.75rem; font-weight: 500;",i.textContent=e.label,t.appendChild(s),t.appendChild(i),t.addEventListener("click",()=>this.selectTab(e.id)),t}selectTab(e){this.currentTab!==e&&(this.currentTab=e,this.updateActiveTab(),this.onTabChange&&this.onTabChange(e))}updateActiveTab(){Object.entries(this.tabButtons).forEach(([e,t])=>{const s=e===this.currentTab;t.setAttribute("aria-selected",s),t.style.color=s?"var(--pc-primary)":"var(--pc-on-surface-variant)"})}setActiveTab(e){this.currentTab=e,this.updateActiveTab()}}let L=null;const wt=3e3;function Et(){return L||(L=document.createElement("div"),L.className="toast-container",L.setAttribute("role","status"),L.setAttribute("aria-live","polite"),document.body.appendChild(L)),L}function g(n,e=wt){const t=Et(),s=document.createElement("div");s.className="toast",s.textContent=n,t.appendChild(s);const i=setTimeout(()=>{Te(s)},e);return s.addEventListener("click",()=>{clearTimeout(i),Te(s)}),s}function Te(n){n.classList.add("toast-exit"),n.addEventListener("animationend",()=>{n.parentNode&&n.parentNode.removeChild(n)})}function ke(){g("Coming soon")}class Ve{constructor(e={}){this.title=e.title||"",this.onClose=e.onClose||null,this.element=null,this.overlay=null,this.handleKeyDown=this.handleKeyDown.bind(this)}render(){this.overlay=document.createElement("div"),this.overlay.className="overlay",this.overlay.addEventListener("click",s=>{s.target===this.overlay&&this.close()}),this.element=document.createElement("div"),this.element.className="dialog",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","dialog-title");const e=document.createElement("div");e.className="dialog-header";const t=document.createElement("h2");return t.id="dialog-title",t.className="dialog-title",t.textContent=this.title,e.appendChild(t),this.content=document.createElement("div"),this.content.className="dialog-content",this.actions=document.createElement("div"),this.actions.className="dialog-actions",this.element.appendChild(e),this.element.appendChild(this.content),this.element.appendChild(this.actions),this.overlay.appendChild(this.element),this.overlay}setContent(e){typeof e=="string"?this.content.innerHTML=e:(this.content.innerHTML="",this.content.appendChild(e))}addAction(e,t,s="text"){const i=document.createElement("button");return i.className=`btn btn-${s}`,i.textContent=e,i.addEventListener("click",t),this.actions.appendChild(i),i}handleKeyDown(e){e.key==="Escape"&&this.close()}show(){this.overlay||this.render(),document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeyDown);const e=this.element.querySelector("button, input, textarea, select");e&&e.focus()}close(){document.removeEventListener("keydown",this.handleKeyDown),this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay),this.onClose&&this.onClose()}}const H=class H{static getModels(){return[]}static getDefaultModel(){const e=this.getModels();return e.length>0?e[0].id:""}constructor(e,t){if(new.target===H)throw new Error("LLMProvider is abstract and cannot be instantiated directly");if(!e)throw new Error("API key is required");if(!t)throw new Error("Model is required");this.apiKey=e,this.model=t}getProviderName(){return this.constructor.displayName}getProviderId(){return this.constructor.id}getModelName(){return this.model}async*streamCompletion(e,t={}){throw new Error("Must implement streamCompletion()")}};S(H,"id","base"),S(H,"displayName","Base Provider");let B=H;const E={INVALID_API_KEY:"invalid_api_key",RATE_LIMITED:"rate_limited",NETWORK_ERROR:"network_error",SERVER_ERROR:"server_error",TIMEOUT:"timeout",STREAM_INTERRUPTED:"stream_interrupted",INVALID_RESPONSE:"invalid_response",UNKNOWN:"unknown",COACH_VALIDATION_FAILED:"coach_validation_failed",COACH_METHODOLOGY_MISSING:"coach_methodology_missing",COACH_EVALUATION_FAILED:"coach_evaluation_failed"},Se={[E.INVALID_API_KEY]:"Invalid API key. Check Settings.",[E.RATE_LIMITED]:"Rate limit exceeded. Try again later.",[E.NETWORK_ERROR]:"Network error. Check connection.",[E.SERVER_ERROR]:"Server error. Try again later.",[E.TIMEOUT]:"Request timed out. Try again.",[E.STREAM_INTERRUPTED]:"Response interrupted.",[E.INVALID_RESPONSE]:"Invalid response from provider.",[E.UNKNOWN]:"An unexpected error occurred.",[E.COACH_VALIDATION_FAILED]:"Coach couldn't evaluate. Try again.",[E.COACH_METHODOLOGY_MISSING]:"Coaching methodology not configured.",[E.COACH_EVALUATION_FAILED]:"Coach couldn't evaluate. Try again."};class b extends Error{constructor(e,t=E.UNKNOWN,s=!1,i={}){super(e),this.name="LLMError",this.code=t,this.retryable=s,this.details=i,this.userMessage=Se[t]||Se[E.UNKNOWN]}static fromHttpStatus(e,t="",s=null){switch(e){case 401:return new b(`Authentication failed: ${t}`,E.INVALID_API_KEY,!1,{status:e,body:s});case 429:return new b(`Rate limit exceeded: ${t}`,E.RATE_LIMITED,!0,{status:e,body:s});case 500:case 502:case 503:case 504:return new b(`Server error: ${e} ${t}`,E.SERVER_ERROR,!0,{status:e,body:s});default:return new b(`HTTP error: ${e} ${t}`,E.UNKNOWN,!1,{status:e,body:s})}}static fromNetworkError(e){return e.name==="AbortError"?new b("Request was aborted",E.TIMEOUT,!0,{originalError:e.message}):new b(`Network error: ${e.message}`,E.NETWORK_ERROR,!0,{originalError:e.message})}static streamInterrupted(e="Unknown"){return new b(`Stream interrupted: ${e}`,E.STREAM_INTERRUPTED,!1,{reason:e})}}const Me="https://api.openai.com/v1/chat/completions";class re extends B{static getModels(){return[{id:"gpt-4o",name:"GPT-4o",description:"Most capable, 128K context"},{id:"gpt-4o-mini",name:"GPT-4o Mini",description:"Fast and affordable"},{id:"gpt-4-turbo",name:"GPT-4 Turbo",description:"128K context"},{id:"gpt-4",name:"GPT-4",description:"8K context"},{id:"gpt-3.5-turbo",name:"GPT-3.5 Turbo",description:"Fast, 16K context"},{id:"o1",name:"o1",description:"Reasoning model"},{id:"o1-mini",name:"o1 Mini",description:"Fast reasoning"}]}constructor(e,t="gpt-4o-mini"){super(e,t)}async*streamCompletion(e,t={}){var h,f;const{maxTokens:s=2048,temperature:i=.7,systemPrompt:o=null}=t,r=[];o&&r.push({role:"system",content:o}),r.push({role:"user",content:e});const a={model:this.model,messages:r,max_tokens:s,temperature:i,stream:!0,stream_options:{include_usage:!0}};console.log("OpenAI: Sending request to",Me,"with model:",this.model);let d;try{d=await fetch(Me,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(a)})}catch(p){throw console.error("OpenAI: Network error",p),b.fromNetworkError(p)}if(console.log("OpenAI: Response status",d.status),!d.ok){let p=null;try{p=await d.json(),console.error("OpenAI: Error response",p)}catch{}throw b.fromHttpStatus(d.status,d.statusText,p)}const c=d.body.getReader(),l=new TextDecoder;let u="",m=null;try{for(;;){const{done:p,value:y}=await c.read();if(p){yield{content:"",done:!0,usage:m};break}u+=l.decode(y,{stream:!0});const w=u.split(`
`);u=w.pop()||"";for(const v of w){const x=v.trim();if(!(!x||x==="data: [DONE]")&&x.startsWith("data: "))try{const C=JSON.parse(x.slice(6)),T=(f=(h=C.choices)==null?void 0:h[0])==null?void 0:f.delta;T!=null&&T.content&&(yield{content:T.content,done:!1,usage:null}),C.usage&&(m={prompt:C.usage.prompt_tokens,completion:C.usage.completion_tokens,total:C.usage.total_tokens})}catch(C){console.warn("OpenAI: Failed to parse chunk",C)}}}}catch(p){throw p instanceof b?p:b.streamInterrupted(p.message)}finally{c.releaseLock()}}}S(re,"id","openai"),S(re,"displayName","OpenAI");const Pe="https://api.anthropic.com/v1/messages",Ct="2023-06-01";class ae extends B{static getModels(){return[{id:"claude-sonnet-4-20250514",name:"Claude Sonnet 4",description:"Latest, most capable"},{id:"claude-3-5-sonnet-20241022",name:"Claude 3.5 Sonnet",description:"Best balance"},{id:"claude-3-5-haiku-20241022",name:"Claude 3.5 Haiku",description:"Fast and affordable"},{id:"claude-3-opus-20240229",name:"Claude 3 Opus",description:"Most capable (legacy)"},{id:"claude-3-sonnet-20240229",name:"Claude 3 Sonnet",description:"Balanced (legacy)"},{id:"claude-3-haiku-20240307",name:"Claude 3 Haiku",description:"Fast (legacy)"}]}constructor(e,t="claude-3-5-sonnet-20241022"){super(e,t)}async*streamCompletion(e,t={}){var m;const{maxTokens:s=2048,temperature:i=.7,systemPrompt:o=null}=t,r={model:this.model,max_tokens:s,stream:!0,messages:[{role:"user",content:e}]};o&&(r.system=o),this.model.includes("thinking")||(r.temperature=i),console.log("Anthropic: Sending request to",Pe,"with model:",this.model);let a;try{a=await fetch(Pe,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":this.apiKey,"anthropic-version":Ct,"anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(r)})}catch(h){throw console.error("Anthropic: Network error",h),b.fromNetworkError(h)}if(console.log("Anthropic: Response status",a.status),!a.ok){let h=null;try{h=await a.json(),console.error("Anthropic: Error response",h)}catch{}throw b.fromHttpStatus(a.status,a.statusText,h)}const d=a.body.getReader(),c=new TextDecoder;let l="",u=null;try{for(;;){const{done:h,value:f}=await d.read();if(h){yield{content:"",done:!0,usage:u};break}l+=c.decode(f,{stream:!0});const p=l.split(`
`);l=p.pop()||"";for(const y of p){const w=y.trim();if(!(!w||!w.startsWith("data: ")))try{const v=JSON.parse(w.slice(6));if(v.type==="content_block_delta"){const x=v.delta;(x==null?void 0:x.type)==="text_delta"&&x.text&&(yield{content:x.text,done:!1,usage:null})}else v.type==="message_delta"?v.usage&&(u={prompt:v.usage.input_tokens||0,completion:v.usage.output_tokens||0,total:(v.usage.input_tokens||0)+(v.usage.output_tokens||0)}):v.type==="message_start"&&((m=v.message)!=null&&m.usage)&&(u={prompt:v.message.usage.input_tokens||0,completion:0,total:v.message.usage.input_tokens||0})}catch(v){console.warn("Anthropic: Failed to parse chunk",v)}}}}catch(h){throw h instanceof b?h:b.streamInterrupted(h.message)}finally{d.releaseLock()}}}S(ae,"id","anthropic"),S(ae,"displayName","Anthropic");const Tt="https://generativelanguage.googleapis.com/v1beta/models";class le extends B{static getModels(){return[{id:"gemini-2.0-flash",name:"Gemini 2.0 Flash",description:"Latest, fastest"},{id:"gemini-1.5-pro",name:"Gemini 1.5 Pro",description:"Most capable"},{id:"gemini-1.5-flash",name:"Gemini 1.5 Flash",description:"Fast and efficient"},{id:"gemini-pro",name:"Gemini Pro",description:"Balanced (legacy)"}]}constructor(e,t="gemini-1.5-flash"){super(e,t)}async*streamCompletion(e,t={}){var w;const{maxTokens:s=2048,temperature:i=.7,systemPrompt:o=null}=t,r=[],a=o?{parts:[{text:o}]}:void 0;r.push({role:"user",parts:[{text:e}]});const d={contents:r,generationConfig:{maxOutputTokens:s,temperature:i}};a&&(d.systemInstruction=a);const c=`${Tt}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;console.log("Google: Sending request with model:",this.model);let l;try{l=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})}catch(v){throw console.error("Google: Network error",v),b.fromNetworkError(v)}if(console.log("Google: Response status",l.status),!l.ok){let v=null;try{v=await l.json(),console.error("Google: Error response",v)}catch{}throw b.fromHttpStatus(l.status,l.statusText,v)}const u=l.body.getReader(),m=new TextDecoder;let h="",f=null,p=0,y=0;try{for(;;){const{done:v,value:x}=await u.read();if(v){f={prompt:p,completion:y,total:p+y},yield{content:"",done:!0,usage:f};break}h+=m.decode(x,{stream:!0});const C=h.split(`
`);h=C.pop()||"";for(const T of C){const X=T.trim();if(!(!X||!X.startsWith("data: ")))try{const N=JSON.parse(X.slice(6)),Xe=N.candidates||[];for(const Je of Xe){const We=((w=Je.content)==null?void 0:w.parts)||[];for(const ye of We)ye.text&&(yield{content:ye.text,done:!1,usage:null})}N.usageMetadata&&(p=N.usageMetadata.promptTokenCount||p,y=N.usageMetadata.candidatesTokenCount||y)}catch(N){console.warn("Google: Failed to parse chunk",N)}}}}catch(v){throw v instanceof b?v:b.streamInterrupted(v.message)}finally{u.releaseLock()}}}S(le,"id","google"),S(le,"displayName","Google");const Le="https://api.x.ai/v1/chat/completions";class ce extends B{static getModels(){return[{id:"grok-3",name:"Grok 3",description:"Latest, most capable"},{id:"grok-3-fast",name:"Grok 3 Fast",description:"Faster responses"},{id:"grok-2",name:"Grok 2",description:"Balanced performance"},{id:"grok-2-mini",name:"Grok 2 Mini",description:"Fast and efficient"}]}constructor(e,t="grok-2"){super(e,t)}async*streamCompletion(e,t={}){var h,f;const{maxTokens:s=2048,temperature:i=.7,systemPrompt:o=null}=t,r=[];o&&r.push({role:"system",content:o}),r.push({role:"user",content:e});const a={model:this.model,messages:r,max_tokens:s,temperature:i,stream:!0};console.log("X/Grok: Sending request to",Le,"with model:",this.model);let d;try{d=await fetch(Le,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(a)})}catch(p){throw console.error("X/Grok: Network error",p),b.fromNetworkError(p)}if(console.log("X/Grok: Response status",d.status),!d.ok){let p=null;try{p=await d.json(),console.error("X/Grok: Error response",p)}catch{}throw b.fromHttpStatus(d.status,d.statusText,p)}const c=d.body.getReader(),l=new TextDecoder;let u="",m=null;try{for(;;){const{done:p,value:y}=await c.read();if(p){yield{content:"",done:!0,usage:m};break}u+=l.decode(y,{stream:!0});const w=u.split(`
`);u=w.pop()||"";for(const v of w){const x=v.trim();if(!(!x||x==="data: [DONE]")&&x.startsWith("data: "))try{const C=JSON.parse(x.slice(6)),T=(f=(h=C.choices)==null?void 0:h[0])==null?void 0:f.delta;T!=null&&T.content&&(yield{content:T.content,done:!1,usage:null}),C.usage&&(m={prompt:C.usage.prompt_tokens,completion:C.usage.completion_tokens,total:C.usage.total_tokens})}catch(C){console.warn("X/Grok: Failed to parse chunk",C)}}}}catch(p){throw p instanceof b?p:b.streamInterrupted(p.message)}finally{c.releaseLock()}}}S(ce,"id","x"),S(ce,"displayName","X (Grok)");const $={OPENAI:"openai",ANTHROPIC:"anthropic",GOOGLE:"google",X:"x"},ge={[$.OPENAI]:re,[$.ANTHROPIC]:ae,[$.GOOGLE]:le,[$.X]:ce};function kt(){return Object.values(ge).map(n=>({id:n.id,name:n.displayName,models:n.getModels(),defaultModel:n.getDefaultModel()}))}function Ue(n,e,t=null){const s=n==null?void 0:n.toLowerCase(),i=ge[s];if(!i)throw new b(`Unknown provider type: ${n}`,E.UNKNOWN,!1);const o=t||i.getDefaultModel();return new i(e,o)}function Ae(n){const e=ge[n==null?void 0:n.toLowerCase()];return e?e.getModels():[]}const Q=kt();class St extends Ve{constructor(){super({title:"Settings"}),this.settings=A(),this.apiKeyInputs={}}createContent(){const e=document.createElement("div");return e.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-6);",e.appendChild(this.createThemeSection()),e.appendChild(this.createCoachLLMSection()),e.appendChild(this.createTestLLMSection()),e.appendChild(this.createApiKeysSection()),e}createThemeSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Theme",e.appendChild(t);const s=document.createElement("div");return s.style.cssText="display: flex; gap: var(--pc-space-3);",["system","light","dark"].forEach(i=>{const o=document.createElement("label");o.style.cssText=`
        display: flex;
        align-items: center;
        gap: var(--pc-space-2);
        cursor: pointer;
        padding: var(--pc-space-2);
      `;const r=document.createElement("input");r.type="radio",r.name="theme",r.value=i,r.checked=this.settings.theme===i,r.addEventListener("change",()=>{this.settings.theme=i,ft(i)});const a=document.createElement("span");a.className="text-body",a.textContent=i.charAt(0).toUpperCase()+i.slice(1),o.appendChild(r),o.appendChild(a),s.appendChild(o)}),e.appendChild(s),e}createCoachLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Coach LLM",e.appendChild(t);const s=document.createElement("p");s.className="text-body",s.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-2); font-size: 0.85rem;",s.textContent="Model used for prompt evaluation and feedback.",e.appendChild(s);const i=document.createElement("div");i.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const o=document.createElement("div");o.style.cssText="flex: 1; min-width: 140px;";const r=document.createElement("label");r.className="text-label",r.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",r.textContent="Provider",o.appendChild(r),this.coachProviderSelect=document.createElement("select"),this.coachProviderSelect.className="input",this.coachProviderSelect.style.cssText="width: 100%;",Q.forEach(c=>{const l=document.createElement("option");l.value=c.id,l.textContent=c.name,this.coachProviderSelect.appendChild(l)}),this.coachProviderSelect.value=this.settings.coachProvider||"openai",this.coachProviderSelect.addEventListener("change",()=>{this.settings.coachProvider=this.coachProviderSelect.value,this.updateCoachModelOptions()}),o.appendChild(this.coachProviderSelect),i.appendChild(o);const a=document.createElement("div");a.style.cssText="flex: 2; min-width: 200px;";const d=document.createElement("label");return d.className="text-label",d.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",d.textContent="Model",a.appendChild(d),this.coachModelSelect=document.createElement("select"),this.coachModelSelect.className="input",this.coachModelSelect.style.cssText="width: 100%;",this.coachModelSelect.addEventListener("change",()=>{this.settings.coachModel=this.coachModelSelect.value}),a.appendChild(this.coachModelSelect),i.appendChild(a),e.appendChild(i),this.updateCoachModelOptions(),e}updateCoachModelOptions(){const e=this.coachProviderSelect.value,t=Ae(e);this.coachModelSelect.innerHTML="",t.forEach(i=>{const o=document.createElement("option");o.value=i.id,o.textContent=i.name,i.description&&(o.title=i.description),this.coachModelSelect.appendChild(o)});const s=t.map(i=>i.id);this.settings.coachModel&&s.includes(this.settings.coachModel)?this.coachModelSelect.value=this.settings.coachModel:t.length>0&&(this.coachModelSelect.value=t[0].id,this.settings.coachModel=t[0].id)}createTestLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Test LLM",e.appendChild(t);const s=document.createElement("div");s.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 140px;";const o=document.createElement("label");o.className="text-label",o.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",o.textContent="Provider",i.appendChild(o),this.testProviderSelect=document.createElement("select"),this.testProviderSelect.className="input",this.testProviderSelect.style.cssText="width: 100%;",Q.forEach(d=>{const c=document.createElement("option");c.value=d.id,c.textContent=d.name,this.testProviderSelect.appendChild(c)}),this.testProviderSelect.value=this.settings.testProvider||"openai",this.testProviderSelect.addEventListener("change",()=>{this.settings.testProvider=this.testProviderSelect.value,this.updateModelOptions()}),i.appendChild(this.testProviderSelect),s.appendChild(i);const r=document.createElement("div");r.style.cssText="flex: 2; min-width: 200px;";const a=document.createElement("label");return a.className="text-label",a.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",a.textContent="Model",r.appendChild(a),this.testModelSelect=document.createElement("select"),this.testModelSelect.className="input",this.testModelSelect.style.cssText="width: 100%;",this.testModelSelect.addEventListener("change",()=>{this.settings.testModel=this.testModelSelect.value}),r.appendChild(this.testModelSelect),s.appendChild(r),e.appendChild(s),this.updateModelOptions(),e}updateModelOptions(){const e=this.testProviderSelect.value,t=Ae(e);this.testModelSelect.innerHTML="",t.forEach(i=>{const o=document.createElement("option");o.value=i.id,o.textContent=i.name,i.description&&(o.title=i.description),this.testModelSelect.appendChild(o)});const s=t.map(i=>i.id);this.settings.testModel&&s.includes(this.settings.testModel)?this.testModelSelect.value=this.settings.testModel:t.length>0&&(this.testModelSelect.value=t[0].id,this.settings.testModel=t[0].id)}createApiKeysSection(){const e=document.createElement("div"),t=document.createElement("div");t.style.cssText="margin-bottom: var(--pc-space-3);";const s=document.createElement("h3");s.className="text-title",s.textContent="API Keys",t.appendChild(s);const i=document.createElement("p");i.className="text-body",i.style.cssText="color: var(--pc-on-surface-variant); margin-top: var(--pc-space-1);",i.textContent="⚠️ Keys are stored locally on your device.",t.appendChild(i),e.appendChild(t);const o=document.createElement("div");return o.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-3);",Q.forEach(r=>{const a=document.createElement("div"),d=document.createElement("label");d.className="text-label",d.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",d.textContent=r.name,a.appendChild(d);const c=document.createElement("input");c.type="password",c.className="input",c.placeholder=`Enter ${r.name} API key`,c.value=this.settings.apiKeys[r.id]||"",c.autocomplete="off",c.addEventListener("input",l=>{this.settings.apiKeys[r.id]=l.target.value.trim()||null}),this.apiKeyInputs[r.id]=c,a.appendChild(c),o.appendChild(a)}),e.appendChild(o),e}show(){this.render(),this.setContent(this.createContent()),this.addAction("Cancel",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show()}save(){je(this.settings),g("Settings saved"),this.close()}}class Mt{constructor(e={}){this.onClose=e.onClose||null,this.element=null,this.backdrop=null,this.isOpen=!1}render(){const e=document.createElement("div");e.className="menu-container",e.style.cssText="position: fixed; inset: 0; z-index: var(--pc-z-overlay); pointer-events: none;",this.backdrop=document.createElement("div"),this.backdrop.className="menu-backdrop",this.backdrop.style.cssText=`
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
      box-shadow: var(--pc-shadow-lg);
      transform: translateX(-100%);
      transition: transform var(--pc-duration-normal) var(--pc-easing);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    `;const t=document.createElement("div");t.style.cssText=`
      padding: var(--pc-space-6);
      border-bottom: 1px solid var(--pc-outline-variant);
    `;const s=document.createElement("h2");s.className="text-title-lg",s.textContent="Prompt Coach",t.appendChild(s),this.element.appendChild(t);const i=document.createElement("ul");return i.style.cssText="list-style: none; padding: var(--pc-space-2) 0; flex: 1;",[{label:"New Session",icon:"add",action:()=>ke()},{label:"History",icon:"history",action:()=>ke()},{label:"Settings",icon:"settings",action:()=>this.openSettings()}].forEach(r=>{const a=document.createElement("li"),d=document.createElement("button");d.className="menu-item",d.style.cssText=`
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
      `,d.innerHTML=`${this.getIcon(r.icon)}<span>${r.label}</span>`,d.addEventListener("click",()=>{r.action(),this.hide()}),d.addEventListener("mouseenter",()=>{d.style.backgroundColor="var(--pc-surface-variant)"}),d.addEventListener("mouseleave",()=>{d.style.backgroundColor="transparent"}),a.appendChild(d),i.appendChild(a)}),this.element.appendChild(i),e.appendChild(this.element),e}getIcon(e){return`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${{add:'<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',history:'<path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7 6.97 6.97 0 01-4.95-2.05l-1.41 1.41A8.97 8.97 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',settings:'<path d="M19.14 12.94a7.4 7.4 0 000-1.88l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.04 7.04 0 00-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54a7.04 7.04 0 00-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58a7.4 7.4 0 000 1.88l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.23 0 .43-.17.48-.41l.36-2.54a7.04 7.04 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>'}[e]||""}</svg>`}openSettings(){new St().show()}show(){this.isOpen=!0,this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.element.style.transform="translateX(0)"}hide(){this.isOpen&&(this.isOpen=!1,this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",this.element.style.transform="translateX(-100%)")}toggle(){this.isOpen?this.hide():this.show()}}const ee="promptcoach_skipped_principles",de={get(){try{return JSON.parse(sessionStorage.getItem(ee)||"[]")}catch{return[]}},add(n){const e=this.get();return e.includes(n)||(e.push(n),sessionStorage.setItem(ee,JSON.stringify(e))),e},has(n){return this.get().includes(n)},clear(){sessionStorage.removeItem(ee)},count(){return this.get().length}};class Pt{constructor(e={}){this.element=null,this.backdrop=null,this.contentEl=null,this.feedbackEntry=null,this.isVisible=!1,this.isPinned=!1,this.isLoading=!1,this.ratio=.3,this.onClose=e.onClose||null,this.onPin=e.onPin||null,this.onSkipContinue=e.onSkipContinue||null,this.onNewSession=e.onNewSession||null,this.skipBtn=null,this.gotItBtn=null}render(){this.backdrop=document.createElement("div"),this.backdrop.className="feedback-backdrop",this.backdrop.style.cssText=`
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
      bottom: -6px;
      left: 0;
      right: 0;
      height: 12px;
      cursor: ns-resize;
      background: transparent;
      z-index: 10;
    `;const t=document.createElement("div");t.style.cssText=`
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 4px;
      background: var(--pc-outline);
      border-radius: 2px;
    `,e.appendChild(t);let s=!1,i=0,o=0;const r=c=>{s=!0,i=c.clientY,o=this.ratio,document.body.style.cursor="ns-resize",document.body.style.userSelect="none",c.preventDefault()},a=c=>{if(!s)return;const u=(c.clientY-i)/window.innerHeight;this.setRatio(o+u)},d=()=>{s&&(s=!1,document.body.style.cursor="",document.body.style.userSelect="")};return e.addEventListener("mousedown",r),document.addEventListener("mousemove",a),document.addEventListener("mouseup",d),e.addEventListener("touchstart",c=>{s=!0,i=c.touches[0].clientY,o=this.ratio,c.preventDefault()}),document.addEventListener("touchmove",c=>{if(!s)return;const u=(c.touches[0].clientY-i)/window.innerHeight;this.setRatio(o+u)}),document.addEventListener("touchend",()=>{s=!1}),e}createHeader(){const e=document.createElement("div");e.className="feedback-header",e.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--pc-space-3) var(--pc-space-4);
      border-bottom: 1px solid var(--pc-outline-variant);
      background: var(--pc-surface-container);
    `;const t=document.createElement("h3");t.className="text-title",t.style.cssText="margin: 0; font-size: 1rem;",t.textContent="Coach Feedback",e.appendChild(t);const s=document.createElement("div");s.style.cssText="display: flex; gap: var(--pc-space-2);",this.pinBtn=document.createElement("button"),this.pinBtn.className="icon-btn",this.pinBtn.setAttribute("aria-label","Pin panel"),this.pinBtn.style.cssText=`
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
    `,this.pinBtn.addEventListener("click",()=>this.togglePin()),s.appendChild(this.pinBtn);const i=document.createElement("button");return i.className="icon-btn",i.setAttribute("aria-label","Close panel"),i.style.cssText=this.pinBtn.style.cssText,i.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `,i.addEventListener("click",()=>this.hide()),s.appendChild(i),e.appendChild(s),e}createFooter(){const e=document.createElement("div");return e.className="feedback-footer",e.style.cssText=`
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
    `,this.gotItBtn.addEventListener("click",()=>this.handleGotItClick()),e.appendChild(this.gotItBtn),e}handleGotItClick(){var t;((t=this.feedbackEntry)==null?void 0:t.complete)===!0&&(de.clear(),this.onNewSession&&this.onNewSession(),this.element.dispatchEvent(new CustomEvent("new-session",{bubbles:!0}))),this.hide(!0)}handleSkipContinue(){if(this.isLoading||!this.feedbackEntry)return;const e=this.feedbackEntry.targetPrinciple;if(!e){console.warn("No targetPrinciple to skip");return}this.skipPromptSnapshot=this.feedbackEntry.promptSnapshot,de.add(e),tt(e),this.setLoading(!0),this.onSkipContinue&&this.onSkipContinue(e),this.element.dispatchEvent(new CustomEvent("skip-continue",{bubbles:!0,detail:{principleId:e}}))}hasPromptChangedDuringSkip(e){return this.isLoading&&this.skipPromptSnapshot&&this.skipPromptSnapshot!==e}cancelSkipIfPromptChanged(e){return this.hasPromptChangedDuringSkip(e)?(this.setLoading(!1),this.skipPromptSnapshot=null,!0):!1}setLoading(e){this.isLoading=e,this.skipBtn&&(this.skipBtn.disabled=e,this.skipBtn.textContent=e?"Loading...":"Skip & Continue",this.skipBtn.style.opacity=e?"0.6":"1"),this.gotItBtn&&(this.gotItBtn.disabled=e,this.gotItBtn.style.opacity=e?"0.6":"1")}show(e){this.feedbackEntry=e,this.setLoading(!1),this.renderContent(e),this.updateFooterForComplete(e.complete),this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.element.style.transform="translateY(0)",this.isVisible=!0}updateFooterForComplete(e){this.skipBtn&&(this.skipBtn.style.display=e?"none":"block"),this.gotItBtn&&(this.gotItBtn.textContent=e?"Start New Session":"Got It")}hide(e=!1){this.isVisible&&(this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",(!this.isPinned||e)&&(this.element.style.transform="translateY(-100%)",this.isPinned&&e&&(this.isPinned=!1,this.updatePinState())),this.isVisible=!1,this.onClose&&this.onClose())}renderContent(e){this.contentEl.innerHTML="";const t=e.complete===!0,s=document.createElement("div");s.className="feedback-summary",s.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      margin-bottom: var(--pc-space-4);
      padding: var(--pc-space-3);
      background: ${t?"var(--pc-primary-container, #d0e8d0)":"var(--pc-surface-container)"};
      border-radius: var(--pc-radius-md);
      ${t?"border: 2px solid var(--pc-primary);":""}
    `;const i=document.createElement("div");i.style.cssText=`
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: conic-gradient(
        var(--pc-primary) ${e.overall*3.6}deg,
        var(--pc-surface-container-high) 0deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--pc-on-surface);
      position: relative;
    `;const o=document.createElement("div");o.style.cssText=`
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--pc-surface);
      display: flex;
      align-items: center;
      justify-content: center;
    `,o.textContent=e.overall,i.appendChild(o),s.appendChild(i);const r=document.createElement("div");r.style.cssText="flex: 1;";const a=document.createElement("div");a.className="text-label",a.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: 2px;",a.textContent=t?"🎉 Coaching Complete!":"Overall Assessment",r.appendChild(a);const d=document.createElement("div");if(d.className="text-body",d.textContent=e.description,r.appendChild(d),s.appendChild(r),this.contentEl.appendChild(s),e.targetPrinciple&&!t){const l=document.createElement("div");l.className="target-principle-badge",l.style.cssText=`
        display: inline-flex;
        align-items: center;
        gap: var(--pc-space-1);
        padding: var(--pc-space-1) var(--pc-space-2);
        background: var(--pc-secondary-container, #e8def8);
        color: var(--pc-on-secondary-container, #1d192b);
        border-radius: var(--pc-radius-full);
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
        margin-bottom: var(--pc-space-3);
      `,l.innerHTML=`
        <span style="font-size: 0.875rem;">🎯</span>
        <span>Focusing on: ${e.targetPrinciple}</span>
      `,this.contentEl.appendChild(l)}const c=document.createElement("div");if(c.className="feedback-text",c.style.cssText=`
      line-height: 1.6;
      color: var(--pc-on-surface);
    `,c.textContent=e.feedback,this.contentEl.appendChild(c),e.scores&&e.scores.length>0){const l=document.createElement("details");l.style.cssText="margin-top: var(--pc-space-4);";const u=document.createElement("summary");u.style.cssText=`
        cursor: pointer;
        color: var(--pc-primary);
        font-weight: 500;
        padding: var(--pc-space-2) 0;
      `,u.textContent="View all principle scores",l.appendChild(u);const m=document.createElement("div");m.style.cssText=`
        display: flex;
        flex-direction: column;
        gap: var(--pc-space-2);
        margin-top: var(--pc-space-2);
      `,e.scores.forEach(h=>{const f=document.createElement("div");f.style.cssText=`
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--pc-space-2);
          background: var(--pc-surface-container);
          border-radius: var(--pc-radius-sm);
        `;const p=document.createElement("span");p.style.cssText="font-weight: 500; text-transform: capitalize;",p.textContent=h.principle,f.appendChild(p);const y=document.createElement("span");y.style.cssText=`
          font-weight: 600;
          color: ${h.score>=70?"var(--pc-primary)":"var(--pc-on-surface-variant)"};
        `,y.textContent=h.score,f.appendChild(y),m.appendChild(f)}),l.appendChild(m),this.contentEl.appendChild(l)}}togglePin(){this.setPinned(!this.isPinned)}setPinned(e){this.isPinned=e,this.pinBtn.style.color=e?"var(--pc-primary)":"var(--pc-on-surface-variant)",e?(this.element.style.position="relative",this.element.style.transform="none",this.element.style.maxHeight=`${this.ratio*100}vh`,this.element.style.borderBottom="3px solid var(--pc-primary)",this.backdrop.style.display="none",this.divider&&(this.divider.style.display="block")):(this.element.style.position="fixed",this.element.style.transform=this.isVisible?"translateY(0)":"translateY(-100%)",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.backdrop.style.display="block",this.divider&&(this.divider.style.display="none")),V("feedbackPanelPinned",e),this.onPin&&this.onPin(e)}setRatio(e){this.ratio=Math.max(.15,Math.min(.7,e)),this.isPinned&&(this.element.style.maxHeight=`${this.ratio*100}vh`),V("feedbackPanelRatio",this.ratio)}loadPersistedState(){const e=Y();this.isPinned=e.feedbackPanelPinned||!1,this.ratio=e.feedbackPanelRatio||.3,this.isPinned&&(this.pinBtn.style.color="var(--pc-primary)")}getBackdrop(){return this.backdrop}}function I(n){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return n.replace(/[&<>"']/g,t=>e[t])}function pe(n){if(!n||typeof n!="string")return"";const e=n.split(`
`),t=[];let s=[],i=!1,o="",r=!1,a=[];for(let c=0;c<e.length;c++){const l=e[c];if(l.startsWith("```")){i?(t.push({type:"code",lang:o,content:s.join(`
`)}),s=[],i=!1,o=""):(s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),i=!0,o=l.slice(3).trim());continue}if(i){s.push(l);continue}const u=l.match(/^(#{1,6})\s+(.+)$/);if(u){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"header",level:u[1].length,content:u[2]});continue}const m=l.match(/^[\*\-]\s+(.+)$/);if(m){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r=!0,a.push(m[1]);continue}const h=l.match(/^\d+\.\s+(.+)$/);if(h){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r=!0,a.push(h[1]);continue}if(l.match(/^---+$/)){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"hr"});continue}const f=l.match(/^>\s+(.+)$/);if(f){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"blockquote",content:f[1]});continue}if(l.trim()===""){r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]);continue}r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),s.push(l)}return r&&a.length>0&&t.push({type:"list",items:a}),s.length>0&&t.push({type:"paragraph",content:s.join(`
`)}),t.map(c=>{switch(c.type){case"header":return`<h${c.level}>${F(I(c.content))}</h${c.level}>`;case"paragraph":const l=F(I(c.content));return l?`<p>${l}</p>`:"";case"list":return`<ul>${c.items.map(u=>`<li>${F(I(u))}</li>`).join("")}</ul>`;case"code":return`<pre><code class="language-${c.lang}">${I(c.content)}</code></pre>`;case"blockquote":return`<blockquote>${F(I(c.content))}</blockquote>`;case"hr":return"<hr>";default:return""}}).filter(Boolean).join("")}function F(n){let e=n;return e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/___(.+?)___/g,"<strong><em>$1</em></strong>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/_(.+?)_/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'),e}const Lt="modulepreload",At=function(n,e){return new URL(n,e).href},Ne={},Be=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){const r=document.getElementsByTagName("link"),a=document.querySelector("meta[property=csp-nonce]"),d=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));i=Promise.allSettled(t.map(c=>{if(c=At(c,s),c in Ne)return;Ne[c]=!0;const l=c.endsWith(".css"),u=l?'[rel="stylesheet"]':"";if(!!s)for(let f=r.length-1;f>=0;f--){const p=r[f];if(p.href===c&&(!l||p.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${u}`))return;const h=document.createElement("link");if(h.rel=l?"stylesheet":Lt,l||(h.as="script"),h.crossOrigin="",h.href=c,d&&h.setAttribute("nonce",d),document.head.appendChild(h),l)return new Promise((f,p)=>{h.addEventListener("load",f),h.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${c}`)))})}))}function o(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return i.then(r=>{for(const a of r||[])a.status==="rejected"&&o(a.reason);return e().catch(o)})};function Nt(n,e=null){const t=[];if(!n||typeof n!="object")return{valid:!1,errors:["Response must be a JSON object"]};if(n.scores?Array.isArray(n.scores)?n.scores.length===0&&t.push("scores array must not be empty"):t.push("scores must be an array"):t.push("Missing required field: scores"),(n.overall===void 0||n.overall===null)&&t.push("Missing required field: overall"),n.description||t.push("Missing required field: description"),n.feedback||t.push("Missing required field: feedback"),t.length>0)return{valid:!1,errors:t};if(typeof n.overall!="number"&&t.push("overall must be a number"),typeof n.description!="string"&&t.push("description must be a string"),typeof n.feedback!="string"&&t.push("feedback must be a string"),n.scores.forEach((s,i)=>{(!s.principle||typeof s.principle!="string")&&t.push(`scores[${i}].principle must be a non-empty string`),(s.score===void 0||typeof s.score!="number")&&t.push(`scores[${i}].score must be a number`),(!s.reason||typeof s.reason!="string")&&t.push(`scores[${i}].reason must be a non-empty string`)}),typeof n.overall=="number"&&(n.overall<0||n.overall>100)&&t.push("overall must be between 0 and 100"),n.scores.forEach((s,i)=>{typeof s.score=="number"&&(s.score<0||s.score>100)&&t.push(`scores[${i}].score must be between 0 and 100`)}),typeof n.description=="string"&&n.description.length>100&&t.push("description must be 100 characters or less"),typeof n.description=="string"&&n.description.trim()===""&&t.push("description must not be empty"),typeof n.feedback=="string"&&n.feedback.trim()===""&&t.push("feedback must not be empty"),n.complete===void 0&&(n.complete=!1),!n.complete&&!n.targetPrinciple&&console.warn("targetPrinciple missing when not complete - using first low-scoring principle"),n.targetPrinciple!==void 0&&typeof n.targetPrinciple!="string"&&t.push("targetPrinciple must be a string"),n.complete!==void 0&&typeof n.complete!="boolean"&&t.push("complete must be a boolean"),e&&e.principles){const s=e.principles.map(i=>i.id);n.scores.forEach((i,o)=>{i.principle&&!s.includes(i.principle)&&console.warn(`scores[${o}].principle "${i.principle}" not in methodology`)}),n.targetPrinciple&&!s.includes(n.targetPrinciple)&&console.warn(`targetPrinciple "${n.targetPrinciple}" not in methodology`)}return{valid:t.length===0,errors:t}}let R=null,te=null;class Bt{constructor(e,t,s){this.provider=Ue(e,t,s),this.methodology=null,this.systemPrompt=null}async loadMethodology(){if(this.methodology)return this.methodology;if(!R)try{R=(await Be(()=>import("./principles-Nr9ahyFn.js"),[],import.meta.url)).default}catch(e){throw console.error("Failed to load principles.json:",e),new Error("Coaching methodology not configured")}if(!R||!R.principles)throw new Error("Coaching methodology not configured");return this.methodology=R,this.methodology}async buildSystemPrompt(){if(this.systemPrompt)return this.systemPrompt;const e=await this.loadMethodology();if(!te)try{te=(await Be(()=>import("./system-prompt-Dr6qRAWU.js"),[],import.meta.url)).default}catch(s){throw console.error("Failed to load system-prompt.md:",s),new Error("Coaching methodology not configured")}const t=e.principles.map((s,i)=>`${i+1}. **${s.name}** (weight: ${s.weight}): ${s.description}`).join(`
`);return this.systemPrompt=te.replace("{{PRINCIPLES}}",t),this.systemPrompt}async evaluate(e,t=[],s={}){const{attachmentContext:i="",attachmentsTruncated:o=!1}=s,r=await this.buildSystemPrompt(),a=performance.now();let d=e.length;i&&(d+=i.length),await ze(this.provider.getProviderName(),this.provider.getModelName(),d);let c="";try{let l=e;i&&(l=`[ATTACHED CONTEXT${o?" (truncated)":""}]
${i}
[END ATTACHED CONTEXT]

${e}`),t.length>0&&(l=`${l}

[SKIPPED_PRINCIPLES: ${t.join(", ")}]`);for await(const f of this.provider.streamCompletion(l,{maxTokens:1024,temperature:.3,systemPrompt:r}))f.content&&(c+=f.content);const u=Math.round(performance.now()-a),m=this.parseResponse(c),h=Nt(m,this.methodology);if(!h.valid)throw new Error(`Invalid response: ${h.errors.join(", ")}`);return await $e(this.provider.getProviderName(),this.provider.getModelName(),c.length,null,u),m}catch(l){const u=Math.round(performance.now()-a);throw await se(this.provider.getProviderName(),this.provider.getModelName(),l.message||"Unknown error",u),l}}async evaluateWithRetry(e,t=[],s={}){try{return await this.evaluate(e,t,s)}catch(i){if(i instanceof b)throw i;console.warn("Coach: First attempt failed, retrying...",i.message);const o=`${e}

IMPORTANT: Please respond with valid JSON only, matching the exact schema specified.`;try{return await this.evaluate(o,t,s)}catch(r){throw console.error("Coach: Retry also failed",r.message),new Error("Coach couldn't evaluate. Try again.")}}}parseResponse(e){let t=e.trim();const s=t.match(/```(?:json)?\s*([\s\S]*?)```/);s&&(t=s[1].trim());const i=t.match(/\{[\s\S]*\}/);i&&(t=i[0]);try{return JSON.parse(t)}catch(o){throw new Error(`Failed to parse JSON response: ${o.message}`)}}getProviderName(){return this.provider.getProviderName()}getModelName(){return this.provider.getModelName()}}const It=[{combo:"ctrl+enter",action:"test",enabled:!0},{combo:"ctrl+shift+enter",action:"coach",enabled:!0},{combo:"ctrl+z",action:"undo",enabled:!0},{combo:"ctrl+y",action:"redo",enabled:!0}];class Rt{constructor(e=It){this.shortcuts=new Map,e.forEach(t=>{t.enabled&&this.shortcuts.set(t.combo.toLowerCase(),t.action)}),this.enabled=!0,this.actionDispatcher=null,this.isActiveCheck=null,this.boundHandler=null}init(e,t){this.actionDispatcher=e,this.isActiveCheck=t,this.boundHandler=this.handleKeyDown.bind(this),document.addEventListener("keydown",this.boundHandler)}handleKeyDown(e){if(!this.enabled||!this.isActiveCheck||!this.isActiveCheck())return;const t=this.buildCombo(e),s=this.shortcuts.get(t);s&&(e.preventDefault(),e.stopPropagation(),this.actionDispatcher&&this.actionDispatcher(s))}buildCombo(e){const t=[];(e.ctrlKey||e.metaKey)&&t.push("ctrl"),e.shiftKey&&t.push("shift"),e.altKey&&t.push("alt");let s=e.key.toLowerCase();return s===" "&&(s="space"),s==="escape"&&(s="esc"),t.push(s),t.join("+")}setEnabled(e){this.enabled=e}addShortcut(e,t){this.shortcuts.set(e.toLowerCase(),t)}removeShortcut(e){this.shortcuts.delete(e.toLowerCase())}getShortcuts(){return Array.from(this.shortcuts.entries()).map(([e,t])=>({combo:e,action:t}))}destroy(){this.boundHandler&&(document.removeEventListener("keydown",this.boundHandler),this.boundHandler=null),this.actionDispatcher=null,this.isActiveCheck=null}}const Ie="promptHistory",Re="prompt_history";class Dt{constructor(e=50){this.maxSize=e,this.entries=[],this.position=-1,this.debounceTimer=null,this.loaded=!1}async load(){try{const e=await ue(Ie,Re);e&&(this.entries=e.entries||[],this.position=e.position??-1,this.maxSize=e.maxSize||this.maxSize),this.loaded=!0}catch(e){console.warn("Failed to load prompt history:",e),this.loaded=!0}}push(e){var t;this.position>=0&&((t=this.entries[this.position])==null?void 0:t.text)===e||(this.entries=this.entries.slice(0,this.position+1),this.entries.push({text:e,timestamp:Date.now()}),this.entries.length>this.maxSize&&this.entries.shift(),this.position=this.entries.length-1,this.persist())}pushDebounced(e,t=500){this.debounceTimer&&clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.push(e),this.debounceTimer=null},t)}cancelDebounce(){this.debounceTimer&&(clearTimeout(this.debounceTimer),this.debounceTimer=null)}undo(){return this.canUndo()?(this.position--,this.persist(),this.entries[this.position].text):null}redo(){return this.canRedo()?(this.position++,this.persist(),this.entries[this.position].text):null}canUndo(){return this.position>0}canRedo(){return this.position<this.entries.length-1}getCurrent(){return this.position<0||this.position>=this.entries.length?null:this.entries[this.position].text}get length(){return this.entries.length}async persist(){try{await O(Ie,{id:Re,entries:this.entries,position:this.position,maxSize:this.maxSize})}catch(e){console.warn("Failed to persist prompt history:",e)}}async clear(){this.entries=[],this.position=-1,this.cancelDebounce(),await this.persist()}}const he={"text/plain":".txt","text/markdown":".md","application/json":".json",".txt":"text/plain",".md":"text/markdown",".json":"application/json"},Ht=[".txt",".md",".json"],Ge=102400,Ot=5e4,D={UNSUPPORTED_TYPE:"UNSUPPORTED_TYPE",SIZE_EXCEEDED:"SIZE_EXCEEDED",EMPTY_FILE:"EMPTY_FILE",READ_ERROR:"READ_ERROR"};function ve(n){if(!n)return"";const e=n.lastIndexOf(".");return e===-1?"":n.slice(e).toLowerCase()}function _t(n){if(n.type&&he[n.type])return!0;const e=ve(n.name);return Ht.includes(e)}function zt(n){if(n.type&&he[n.type])return n.type;const e=ve(n.name);return he[e]||e}function $t(n,e=Ge){if(!_t(n))return{valid:!1,error:`Unsupported file type: ${ve(n.name)||n.type||"unknown"}. Supported: .txt, .md, .json`,errorCode:D.UNSUPPORTED_TYPE};if(n.size>e){const t=Math.round(e/1024);return{valid:!1,error:`File too large: ${Math.round(n.size/1024)}KB (limit: ${t}KB)`,errorCode:D.SIZE_EXCEEDED}}return n.size===0?{valid:!1,error:"File is empty",errorCode:D.EMPTY_FILE}:{valid:!0}}function Ft(n){return new Promise((e,t)=>{const s=new FileReader;s.onload=()=>e(s.result),s.onerror=()=>t(new Error(`Failed to read file: ${n.name}`)),s.readAsText(n)})}function Kt(n){return n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/(1024*1024)).toFixed(1)} MB`}class q extends Error{constructor(e,t,s){super(e),this.name="AttachmentError",this.code=t,this.filename=s}}async function jt(n,e=Ge){const t=$t(n,e);if(!t.valid)throw new q(t.error,t.errorCode,n.name);let s;try{s=await Ft(n)}catch{throw new q(`Failed to read file: ${n.name}`,D.READ_ERROR,n.name)}if(!s||s.trim()==="")throw new q("File is empty",D.EMPTY_FILE,n.name);const i={id:crypto.randomUUID(),filename:n.name,content:s,size:n.size,type:zt(n),addedAt:new Date().toISOString()};return await k(),await O("attachments",i),i}async function Ye(){return await k(),(await me("attachments")).sort((e,t)=>new Date(t.addedAt).getTime()-new Date(e.addedAt).getTime())}async function qt(n){return await k(),await ue("attachments",n)?(await it("attachments",n),!0):!1}async function Vt(){await k();const e=(await me("attachments")).length;return await ot("attachments"),e}async function De(n=Ot){const e=await Ye();if(e.length===0)return{context:"",truncated:!1,count:0};const t=[];let s=0,i=!1;for(const o of e){const r=`--- Attached File: ${o.filename} ---`,a=`--- End of ${o.filename} ---`,d=r.length+a.length+4;if(s+d+o.content.length>n){const c=n-s-d-50;if(c>100){const l=o.content.slice(0,c);t.push(`${r}
${l}
[... content truncated ...]
${a}`),i=!0}break}t.push(`${r}
${o.content}
${a}`),s+=d+o.content.length}return{context:t.join(`

`),truncated:i,count:e.length}}class Ut{constructor(){this.element=null,this.textarea=null,this.preview=null,this.isPreviewMode=!1,this.promptText="",this.initialized=!1,this.isTestRunning=!1,this.isCoachRunning=!1,this.onSwitchToResults=null,this.resultsTab=null,this.feedbackPanel=null,this.onShowFeedback=null,this.keyboardHandler=null,this.promptHistory=new Dt(50)}render(){if(this.element)return this.element;this.element=document.createElement("div"),this.element.className="prompt-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","prompt-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--pc-space-4);
    `;const e=this.createToolbar();this.element.appendChild(e);const t=document.createElement("div");return t.style.cssText="flex: 1; position: relative; min-height: 0;",this.textarea=document.createElement("textarea"),this.textarea.className="input textarea",this.textarea.placeholder="Your prompt here...",this.textarea.style.cssText=`
      width: 100%;
      height: 100%;
      resize: none;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.5;
    `,this.textarea.addEventListener("input",s=>{this.promptText=s.target.value,Z(this.promptText),this.promptHistory.pushDebounced(this.promptText,1e3)}),t.appendChild(this.textarea),this.preview=document.createElement("div"),this.preview.className="prompt-preview",this.preview.style.cssText=`
      position: absolute;
      inset: 0;
      padding: var(--pc-space-4);
      background-color: var(--pc-surface);
      border: 1px solid var(--pc-outline);
      border-radius: var(--pc-radius-sm);
      overflow-y: auto;
      display: none;
    `,t.appendChild(this.preview),this.element.appendChild(t),this.loadPrompt(),this.element}createToolbar(){const e=document.createElement("div");e.className="prompt-toolbar",e.style.cssText=`
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
    `,this.previewBtn.addEventListener("click",()=>this.setMode(!0)),this.toggleContainer.appendChild(this.editBtn),this.toggleContainer.appendChild(this.previewBtn),e.appendChild(this.toggleContainer);const t=document.createElement("div");t.style.flex="1",e.appendChild(t);const s=document.createElement("button");return s.className="btn btn-text-compact",s.title="Copy prompt",s.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/>
      </svg>
      <span>Copy</span>
    `,s.addEventListener("click",()=>this.copyPrompt()),e.appendChild(s),this.testBtn=document.createElement("button"),this.testBtn.className="btn btn-text-compact",this.testBtn.title="Test prompt (Ctrl+Enter)",this.testBtn.innerHTML=`
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
    `,this.coachBtn.addEventListener("click",()=>this.runCoach()),e.appendChild(this.coachBtn),e}setMode(e){this.isPreviewMode!==e&&(this.isPreviewMode=e,this.isPreviewMode?(this.textarea.style.display="none",this.preview.style.display="block",this.preview.innerHTML=pe(this.promptText)||'<p style="color: var(--pc-on-surface-variant);">Nothing to preview</p>',this.applyMarkdownStyles(this.preview),this.editBtn.style.background="transparent",this.editBtn.style.color="var(--pc-on-surface)",this.previewBtn.style.background="var(--pc-primary)",this.previewBtn.style.color="var(--pc-on-primary)"):(this.textarea.style.display="block",this.preview.style.display="none",this.textarea.focus(),this.editBtn.style.background="var(--pc-primary)",this.editBtn.style.color="var(--pc-on-primary)",this.previewBtn.style.background="transparent",this.previewBtn.style.color="var(--pc-on-surface)"))}async copyPrompt(){if(!this.promptText.trim()){g("Nothing to copy");return}try{await navigator.clipboard.writeText(this.promptText),g("Copied to clipboard")}catch{g("Failed to copy")}}async loadPrompt(){try{const e=await P();this.promptText=e.promptText||"",this.textarea&&(this.textarea.value=this.promptText),await this.promptHistory.load(),this.promptText&&this.promptHistory.push(this.promptText),this.initKeyboardHandler()}catch(e){console.error("Failed to load prompt:",e)}}initKeyboardHandler(){this.keyboardHandler||(this.keyboardHandler=new Rt,this.keyboardHandler.init(e=>this.handleKeyboardAction(e),()=>this.isKeyboardActive()))}isKeyboardActive(){return this.element&&this.element.offsetParent!==null&&!this.isPreviewMode}handleKeyboardAction(e){switch(e){case"test":this.runTest();break;case"coach":this.runCoach();break;case"undo":this.handleUndo();break;case"redo":this.handleRedo();break;default:console.warn("Unknown keyboard action:",e)}}handleUndo(){const e=this.promptHistory.undo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),Z(e),g("Undo"))}handleRedo(){const e=this.promptHistory.redo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),Z(e),g("Redo"))}async runTest(){var m,h,f;if(this.isTestRunning){g("Test already in progress");return}const e=this.promptText.trim();if(!e){g("Please enter a prompt first");return}if(!ie()){g("Please configure an API key in Settings");return}const t=A(),s=t.testProvider||"openai",i=t.apiKeys[s],o=t.testModel||null;if(!i){g(`No API key configured for ${s}`);return}let r;try{r=Ue(s,i,o)}catch(p){g(p.message||"Failed to create provider");return}let a=e,d=null;try{const{context:p,truncated:y,count:w}=await De();p&&(a=`${p}

---

${e}`,d={count:w,truncated:y},y&&g("Attachments truncated due to size limit","warning"))}catch(p){console.warn("Failed to get attachment context:",p)}this.isTestRunning=!0,this.testBtn.disabled=!0,this.setButtonLoading(this.testBtn,!0);const c=pt({promptSnapshot:e,provider:r.getProviderName(),model:r.getModelName(),status:"streaming",attachmentCount:(d==null?void 0:d.count)||0});this.onSwitchToResults&&this.onSwitchToResults();const l=(m=this.resultsTab)==null?void 0:m.addResult(c);await ct(c);const u=performance.now();await ze(r.getProviderName(),r.getModelName(),a.length);try{for await(const p of r.streamCompletion(a))if(p.content&&(l==null||l.appendChunk(p.content)),p.done&&p.usage){const y=Math.round(performance.now()-u);l==null||l.complete(p.usage,y),await Ee(c.id,{responseText:(l==null?void 0:l.getResult().responseText)||"",tokens:p.usage,durationMs:y,status:"complete"}),await $e(r.getProviderName(),r.getModelName(),((h=l==null?void 0:l.getResult().responseText)==null?void 0:h.length)||0,p.usage,y),(f=this.resultsTab)==null||f.updateSessionStats()}}catch(p){const y=Math.round(performance.now()-u),w=p instanceof b?p.userMessage:p.message||"Unknown error";l==null||l.setError(w,y),await Ee(c.id,{responseText:(l==null?void 0:l.getResult().responseText)||"",error:w,durationMs:y,status:"error"}),await se(r.getProviderName(),r.getModelName(),w,y),g(w)}finally{this.isTestRunning=!1,this.testBtn.disabled=!1,this.setButtonLoading(this.testBtn,!1)}}setOnSwitchToResults(e){this.onSwitchToResults=e}setResultsTab(e){this.resultsTab=e}setOnShowFeedback(e){this.onShowFeedback=e}async runCoach(){if(this.isCoachRunning){g("Coach evaluation in progress");return}const e=this.promptText.trim();if(!e){g("Please enter a prompt first");return}if(!ie()){g("Please configure an API key in Settings");return}const t=A(),s=t.coachProvider||"openai",i=t.apiKeys[s],o=t.coachModel||null;if(!i){g(`No API key configured for ${s}`);return}let r="",a=!1;try{const{context:c,truncated:l}=await De();r=c,a=l,l&&g("Attachments truncated due to size limit","warning")}catch(c){console.warn("Failed to get attachment context:",c)}this.isCoachRunning=!0,this.coachBtn.disabled=!0,this.setButtonLoading(this.coachBtn,!0);const d=performance.now();try{const c=new Bt(s,i,o),l=de.get(),u=await c.evaluateWithRetry(e,l,{attachmentContext:r,attachmentsTruncated:a}),m=Math.round(performance.now()-d),h=ht({promptSnapshot:e,scores:u.scores,overall:u.overall,description:u.description,feedback:u.feedback,provider:c.getProviderName(),model:c.getModelName(),durationMs:m,targetPrinciple:u.targetPrinciple,complete:u.complete});await ut(h),this.onShowFeedback&&this.onShowFeedback(h),console.log("Coach: Evaluation complete",h)}catch(c){const l=c.message||"Coach evaluation failed";g(l),console.error("Coach: Error",c),await se(t.coachProvider||"openai",t.coachModel||"unknown",l,Math.round(performance.now()-d))}finally{this.isCoachRunning=!1,this.coachBtn.disabled=!1,this.setButtonLoading(this.coachBtn,!1)}}setButtonLoading(e,t){if(!document.getElementById("btn-spinner-styles")){const o=document.createElement("style");o.id="btn-spinner-styles",o.textContent=`
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
      `,document.head.appendChild(o)}const s=e.querySelector(".btn-text-icon-wrapper");if(!s)return;const i=s.querySelector(".btn-spinner-ring");if(i&&i.remove(),t){const o=document.createElement("div");o.className="btn-spinner-ring",s.appendChild(o);const r=s.querySelector(".btn-text-icon");r&&(r.style.opacity="0.5")}else{const o=s.querySelector(".btn-text-icon");o&&(o.style.opacity="1")}}applyMarkdownStyles(e){e.querySelectorAll("p").forEach(r=>{r.style.cssText="margin: 0 0 0.75em 0;"}),e.querySelectorAll("ul, ol").forEach(r=>{r.style.cssText=`
        margin: 0.5em 0;
        padding-left: 1.25em;
        list-style-position: outside;
      `}),e.querySelectorAll("li").forEach(r=>{r.style.cssText="margin: 0.2em 0;"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(r=>{r.style.marginTop="1em",r.style.marginBottom="0.4em"})}}class He{constructor(e){this.entry=e,this.element=null,this.isExpanded=!1}render(){this.element=document.createElement("div"),this.element.className="feedback-balloon",this.element.style.cssText=`
      padding: var(--pc-space-3);
      padding-bottom: var(--pc-space-4);
      position: relative;
    `;const e=document.createElement("div");e.style.cssText=`
      position: absolute;
      bottom: 0;
      left: 25%;
      width: 50%;
      height: 1px;
      background: var(--pc-outline-variant);
      opacity: 0.5;
    `,this.element.appendChild(e);const t=document.createElement("div");t.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--pc-space-2);
    `;const s=document.createElement("div");s.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      flex: 1;
      min-width: 0;
    `;const i=document.createElement("div"),o=this.entry.overall,r=o>=80?"var(--pc-primary)":o>=60?"#F59E0B":"#EF4444";i.style.cssText=`
      min-width: 32px;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 50%;
      background: ${r};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.8rem;
    `,i.textContent=o,s.appendChild(i);const a=document.createElement("span");a.style.cssText=`
      font-weight: 500;
      color: var(--pc-on-surface);
      flex: 1;
      margin-right: var(--pc-space-3);
    `,a.textContent=this.entry.description,s.appendChild(a),t.appendChild(s);const d=document.createElement("span");d.style.cssText=`
      font-size: 0.75rem;
      color: var(--pc-on-surface-variant);
      flex-shrink: 0;
    `,d.textContent=this.formatTimestamp(this.entry.timestamp),t.appendChild(d),this.element.appendChild(t);const c=document.createElement("div");if(c.style.cssText=`
      color: var(--pc-on-surface);
      line-height: 1.5;
      font-size: 0.9rem;
      ${this.isExpanded?"":"display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"}
    `,c.textContent=this.entry.feedback,this.element.appendChild(c),this.entry.feedback.length>200){const l=document.createElement("button");l.style.cssText=`
        background: none;
        border: none;
        color: var(--pc-primary);
        font-size: 0.8rem;
        cursor: pointer;
        padding: var(--pc-space-1) 0;
        margin-top: var(--pc-space-1);
      `,l.textContent=this.isExpanded?"Show less":"Show more",l.addEventListener("click",()=>{this.isExpanded=!this.isExpanded,c.style.cssText=`
          color: var(--pc-on-surface);
          line-height: 1.5;
          font-size: 0.9rem;
          ${this.isExpanded?"":"display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"}
        `,l.textContent=this.isExpanded?"Show less":"Show more"}),this.element.appendChild(l)}if(this.entry.scores&&this.entry.scores.length>0){const l=document.createElement("details");l.style.cssText="margin-top: var(--pc-space-2);";const u=document.createElement("summary");u.style.cssText=`
        cursor: pointer;
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        display: flex;
        align-items: center;
        gap: var(--pc-space-1);
        list-style: none;
      `,u.innerHTML=`
        <span class="toggle-icon" style="display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </span>
        Principle scores
      `,l.appendChild(u),l.addEventListener("toggle",()=>{const h=u.querySelector(".toggle-icon");h&&(h.innerHTML=l.open?'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>')});const m=document.createElement("div");m.style.cssText=`
        display: flex;
        flex-wrap: wrap;
        gap: var(--pc-space-1);
        margin-top: var(--pc-space-1);
      `,this.entry.scores.forEach(h=>{const f=document.createElement("span");f.style.cssText=`
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: var(--pc-surface);
          border-radius: var(--pc-radius-full);
          font-size: 0.75rem;
        `,f.innerHTML=`<span style="text-transform: capitalize;">${h.principle}</span>: <strong>${h.score}</strong>`,m.appendChild(f)}),l.appendChild(m),this.element.appendChild(l)}if(this.entry.promptSnapshot){const l=document.createElement("details");l.style.cssText="margin-top: var(--pc-space-2);";const u=document.createElement("summary");u.style.cssText=`
        cursor: pointer;
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        display: flex;
        align-items: center;
        gap: var(--pc-space-1);
        list-style: none;
      `,u.innerHTML=`
        <span class="toggle-icon" style="display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </span>
        Original prompt
      `,l.appendChild(u),l.addEventListener("toggle",()=>{const h=u.querySelector(".toggle-icon");h&&(h.innerHTML=l.open?'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>')});const m=document.createElement("div");m.style.cssText=`
        margin-top: var(--pc-space-1);
        padding: var(--pc-space-2);
        background: var(--pc-surface);
        border-radius: var(--pc-radius-sm);
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        white-space: pre-wrap;
        max-height: 100px;
        overflow-y: auto;
      `,m.textContent=this.entry.promptSnapshot,l.appendChild(m),this.element.appendChild(l)}return this.element}formatTimestamp(e){const t=new Date(e),i=new Date-t,o=Math.floor(i/6e4),r=Math.floor(i/36e5);return o<1?"Just now":o<60?`${o}m ago`:r<24?`${r}h ago`:t.toLocaleDateString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}}class Gt extends HTMLElement{constructor(){super(),this._expanded=!1,this._promptText=""}static get observedAttributes(){return["expanded"]}connectedCallback(){this.render()}attributeChangedCallback(e,t,s){e==="expanded"&&(this._expanded=s==="true",this.render())}set promptText(e){this._promptText=e,this.render()}get promptText(){return this._promptText}get expanded(){return this._expanded}set expanded(e){this._expanded=e,this.render()}toggle(){this._expanded=!this._expanded,this.render()}render(){const s=this._expanded?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';this.innerHTML=`
      <div class="prompt-change-balloon ${this._expanded?"expanded":"collapsed"}" style="
        padding: var(--pc-space-3);
        padding-bottom: var(--pc-space-4);
        position: relative;
        transition: all 200ms ease;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 25%;
          width: 50%;
          height: 1px;
          background: var(--pc-outline-variant);
          opacity: 0.5;
        "></div>
        <div class="balloon-header" style="
          display: flex;
          align-items: center;
          gap: var(--pc-space-2);
          cursor: pointer;
          user-select: none;
        ">
          <div style="
            min-width: 32px;
            width: 32px;
            height: 32px;
            flex-shrink: 0;
            border-radius: 50%;
            background: var(--pc-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
          <span style="flex: 1; font-weight: 500; color: var(--pc-on-surface);">Prompt changed</span>
          <span class="chevron" style="
            color: var(--pc-on-surface-variant);
            display: flex;
            align-items: center;
            transition: transform 200ms ease;
          ">${s}</span>
        </div>
        ${this._expanded?`
          <div class="balloon-content" style="
            margin-top: var(--pc-space-2);
            margin-left: 44px;
            padding: var(--pc-space-2);
            background: var(--pc-surface-container);
            border-radius: var(--pc-radius-sm);
            font-size: 0.875rem;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 200px;
            overflow-y: auto;
            color: var(--pc-on-surface);
          ">${this.escapeHtml(this._promptText)}</div>
        `:""}
      </div>
    `;const i=this.querySelector(".balloon-header");i&&i.addEventListener("click",()=>this.toggle())}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}}customElements.define("prompt-change-balloon",Gt);class Yt{constructor(){this.element=null,this.listContainer=null,this.emptyState=null,this.balloons=new Map}render(){return this.element?(this.loadFeedback(),this.element):(this.element=document.createElement("div"),this.element.className="feedback-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","feedback-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--pc-space-4);
      overflow-y: auto;
    `,this.listContainer=document.createElement("div"),this.listContainer.className="feedback-list",this.element.appendChild(this.listContainer),this.emptyState=document.createElement("div"),this.emptyState.className="empty-state",this.emptyState.style.cssText="flex: 1;",this.emptyState.innerHTML=`
      <div class="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>
      <div class="empty-state-title">No feedback yet</div>
      <div class="empty-state-description">
        Click Coach to get started.
      </div>
    `,this.element.appendChild(this.emptyState),this.loadFeedback(),this.element)}async loadFeedback(){const e=await mt();if(this.listContainer.innerHTML="",this.balloons.clear(),e.length===0)this.emptyState.style.display="flex",this.listContainer.style.display="none";else{this.emptyState.style.display="none",this.listContainer.style.display="block";const t=[...e].reverse();let s=null;t.forEach(i=>{if(s!==null&&s!==i.promptSnapshot){const r=this.createPromptChangeBalloon(i.promptSnapshot);this.listContainer.appendChild(r)}const o=new He(i);this.balloons.set(i.id,o),this.listContainer.appendChild(o.render()),s=i.promptSnapshot})}}createPromptChangeBalloon(e){const t=document.createElement("prompt-change-balloon");return t.promptText=e,t}addEntry(e){if(this.balloons.has(e.id))return;this.emptyState.style.display="none",this.listContainer.style.display="block";const t=new He(e);this.balloons.set(e.id,t),this.listContainer.insertBefore(t.render(),this.listContainer.firstChild)}}class Xt{constructor(){this.element=null,this.dropZone=null,this.fileInput=null,this.attachmentsList=null,this.emptyState=null,this.clearAllBtn=null,this.attachments=[],this.isDragging=!1}render(){if(this.element)return this.loadAttachments(),this.element;this.element=document.createElement("div"),this.element.className="attachments-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","attachments-panel"),this.element.style.cssText=`
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
    `,e.appendChild(t),this.clearAllBtn=document.createElement("button"),this.clearAllBtn.className="btn btn-text",this.clearAllBtn.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
      </svg>
      Clear All
    `,this.clearAllBtn.style.display="none",this.clearAllBtn.addEventListener("click",()=>this.handleClearAll()),e.appendChild(this.clearAllBtn),e}createDropZone(){const e=document.createElement("div");return e.className="drop-zone",e.style.cssText=`
      border: 2px dashed var(--pc-outline);
      border-radius: var(--pc-radius-md);
      padding: var(--pc-space-6);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--pc-surface);
    `,e.innerHTML=`
      <div class="drop-zone-content">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-2);">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
        </svg>
        <div style="color: var(--pc-on-surface); font-weight: 500; margin-bottom: var(--pc-space-1);">
          Drop files here
        </div>
        <div style="color: var(--pc-on-surface-variant); font-size: 0.875rem;">
          or tap to browse (.txt, .md, .json)
        </div>
      </div>
    `,e.addEventListener("click",()=>this.fileInput.click()),e.addEventListener("dragenter",t=>this.handleDragEnter(t)),e.addEventListener("dragover",t=>this.handleDragOver(t)),e.addEventListener("dragleave",t=>this.handleDragLeave(t)),e.addEventListener("drop",t=>this.handleDrop(t)),e}createEmptyState(){const e=document.createElement("div");return e.className="empty-state",e.style.cssText=`
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--pc-on-surface-variant);
      padding: var(--pc-space-8);
    `,e.innerHTML=`
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5; margin-bottom: var(--pc-space-4);">
        <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
      </svg>
      <div style="font-weight: 500; margin-bottom: var(--pc-space-1);">No attachments yet</div>
      <div style="font-size: 0.875rem;">Files you attach will appear here</div>
    `,e}handleDragEnter(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!0,this.dropZone.style.borderColor="var(--pc-primary)",this.dropZone.style.backgroundColor="var(--pc-primary-container)"}handleDragOver(e){e.preventDefault(),e.stopPropagation()}handleDragLeave(e){e.preventDefault(),e.stopPropagation(),this.dropZone.contains(e.relatedTarget)||(this.isDragging=!1,this.dropZone.style.borderColor="var(--pc-outline)",this.dropZone.style.backgroundColor="var(--pc-surface)")}async handleDrop(e){e.preventDefault(),e.stopPropagation(),this.isDragging=!1,this.dropZone.style.borderColor="var(--pc-outline)",this.dropZone.style.backgroundColor="var(--pc-surface)";const t=Array.from(e.dataTransfer.files);await this.processFiles(t)}async handleFileSelect(e){const t=Array.from(e.target.files);await this.processFiles(t),e.target.value=""}async processFiles(e){let t=0;for(const s of e)try{await jt(s),t++}catch(i){i instanceof q?g(i.message,"error"):(g(`Failed to add ${s.name}`,"error"),console.error("Attachment error:",i))}t>0&&(g(`Added ${t} file${t>1?"s":""}`,"success"),await this.loadAttachments())}async loadAttachments(){try{this.attachments=await Ye(),this.renderAttachmentsList()}catch(e){console.error("Failed to load attachments:",e),g("Failed to load attachments","error")}}renderAttachmentsList(){this.attachmentsList.querySelectorAll(".attachment-item").forEach(s=>s.remove());const t=this.attachments.length>0;this.emptyState.style.display=t?"none":"flex",this.clearAllBtn.style.display=t?"flex":"none";for(const s of this.attachments){const i=this.createAttachmentItem(s);this.attachmentsList.insertBefore(i,this.emptyState)}}createAttachmentItem(e){const t=document.createElement("div");t.className="attachment-item",t.dataset.id=e.id,t.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3);
      background-color: var(--pc-surface-container);
      border-radius: var(--pc-radius-sm);
      border: 1px solid var(--pc-outline-variant);
    `;const s=document.createElement("div");s.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: var(--pc-primary);">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    `,t.appendChild(s);const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 0;",i.innerHTML=`
      <div style="font-weight: 500; color: var(--pc-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${this.escapeHtml(e.filename)}
      </div>
      <div style="font-size: 0.75rem; color: var(--pc-on-surface-variant);">
        ${Kt(e.size)}
      </div>
    `,t.appendChild(i);const o=document.createElement("button");return o.className="btn btn-icon",o.title="Remove attachment",o.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `,o.addEventListener("click",()=>this.handleDelete(e.id)),t.appendChild(o),t}async handleDelete(e){try{await qt(e),await this.loadAttachments(),g("Attachment removed","success")}catch(t){console.error("Failed to delete attachment:",t),g("Failed to remove attachment","error")}}async handleClearAll(){if(!(this.attachments.length===0||!confirm(`Remove all ${this.attachments.length} attachment${this.attachments.length>1?"s":""}?`)))try{const t=await Vt();await this.loadAttachments(),g(`Removed ${t} attachment${t>1?"s":""}`,"success")}catch(t){console.error("Failed to clear attachments:",t),g("Failed to clear attachments","error")}}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}}class Oe{constructor(e,t={}){this.result=e,this.expanded=t.expanded!==!1,this.onToggle=t.onToggle||null,this.element=null,this.contentEl=null,this.responseEl=null,this.statsEl=null,this.pendingText="",this.rafId=null}render(){this.element=document.createElement("div"),this.element.className="result-balloon",this.element.dataset.resultId=this.result.id,this.element.style.cssText=`
      background: var(--pc-surface);
      border: 1px solid var(--pc-outline-variant);
      border-radius: var(--pc-radius-md);
      margin-bottom: var(--pc-space-3);
      overflow: hidden;
    `;const e=this.createHeader();return this.element.appendChild(e),this.contentEl=document.createElement("div"),this.contentEl.className="result-balloon-content",this.contentEl.style.cssText=`
      padding: var(--pc-space-4);
      display: ${this.expanded?"block":"none"};
    `,this.responseEl=document.createElement("div"),this.responseEl.className="result-response",this.responseEl.style.cssText=`
      line-height: 1.6;
    `,this.updateResponse(),this.contentEl.appendChild(this.responseEl),this.statsEl=this.createStats(),this.contentEl.appendChild(this.statsEl),this.element.appendChild(this.contentEl),this.element}createHeader(){const e=document.createElement("div");e.className="result-balloon-header",e.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-2);
      padding: var(--pc-space-3) var(--pc-space-4);
      background: var(--pc-surface-variant);
      cursor: pointer;
    `;const t=document.createElement("span");t.className="chevron",t.innerHTML=this.expanded?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',t.style.cssText="display: flex; align-items: center; color: var(--pc-on-surface-variant);",e.appendChild(t);const s=document.createElement("span");s.className="result-time",s.style.cssText="font-size: 0.875rem; color: var(--pc-on-surface-variant);",s.textContent=this.formatTime(this.result.timestamp),e.appendChild(s);const i=document.createElement("span");i.className="result-status",this.updateStatusBadge(i),e.appendChild(i);const o=document.createElement("div");o.style.flex="1",e.appendChild(o);const r=document.createElement("button");return r.className="btn-icon",r.setAttribute("aria-label","Copy response"),r.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/>
      </svg>
    `,r.style.cssText=`
      padding: var(--pc-space-1);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--pc-on-surface-variant);
      border-radius: var(--pc-radius-sm);
    `,r.addEventListener("click",a=>{a.stopPropagation(),this.copyResponse()}),e.appendChild(r),e.addEventListener("click",()=>this.toggle()),e}createStats(){const e=document.createElement("div");return e.className="result-stats",e.style.cssText=`
      margin-top: var(--pc-space-3);
      padding-top: var(--pc-space-3);
      border-top: 1px solid var(--pc-outline-variant);
      font-size: 0.75rem;
      color: var(--pc-on-surface-variant);
      display: flex;
      flex-wrap: wrap;
      gap: var(--pc-space-3);
    `,this.updateStats(e),e}updateStats(e=this.statsEl){if(!e)return;const{provider:t,model:s,tokens:i,durationMs:o}=this.result;e.innerHTML="",t&&e.appendChild(this.createStatItem("Provider",t)),s&&e.appendChild(this.createStatItem("Model",s)),i!=null&&i.total&&e.appendChild(this.createStatItem("Tokens",`${i.total} (${i.prompt}→${i.completion})`)),o&&e.appendChild(this.createStatItem("Duration",`${(o/1e3).toFixed(1)}s`))}createStatItem(e,t){const s=document.createElement("span");return s.innerHTML=`<strong>${e}:</strong> ${t}`,s}updateStatusBadge(e){const{status:t,error:s}=this.result;e.style.cssText=`
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: var(--pc-radius-full);
    `,t==="streaming"?(e.innerHTML="● Streaming",e.style.backgroundColor="var(--pc-primary-container)",e.style.color="var(--pc-on-primary-container)"):t==="error"||s?(e.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 2px;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> Error',e.style.backgroundColor="var(--pc-error-container)",e.style.color="var(--pc-on-error-container)"):(e.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 2px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Complete',e.style.backgroundColor="var(--pc-surface-variant)",e.style.color="var(--pc-on-surface-variant)")}updateResponse(){if(!this.responseEl)return;const{responseText:e,status:t,error:s}=this.result;s?this.responseEl.innerHTML=`<p style="color: var(--pc-error);">${s}</p>`:t==="streaming"&&!e?this.responseEl.innerHTML=this.createSpinner():e?(this.responseEl.innerHTML=pe(e)||'<p style="color: var(--pc-on-surface-variant);">Empty response</p>',this.applyMarkdownStyles()):this.responseEl.innerHTML='<p style="color: var(--pc-on-surface-variant);">Empty response</p>'}applyMarkdownStyles(){this.responseEl.querySelectorAll("p").forEach(o=>{o.style.cssText="margin: 0 0 0.75em 0;"}),this.responseEl.querySelectorAll("ul, ol").forEach(o=>{o.style.cssText=`
        margin: 0.5em 0;
        padding-left: 1.25em;
        list-style-position: outside;
      `}),this.responseEl.querySelectorAll("li").forEach(o=>{o.style.cssText="margin: 0.2em 0;"}),this.responseEl.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(o=>{o.style.marginTop="1em",o.style.marginBottom="0.4em"})}createSpinner(){return`
      <div style="display: flex; align-items: center; gap: var(--pc-space-2); color: var(--pc-on-surface-variant);">
        <span class="spinner" style="
          width: 16px;
          height: 16px;
          border: 2px solid var(--pc-outline-variant);
          border-top-color: var(--pc-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></span>
        <span>Waiting for response...</span>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `}appendChunk(e){this.pendingText+=e,this.rafId||(this.rafId=requestAnimationFrame(()=>{this.result.responseText=this.pendingText,this.responseEl&&(this.responseEl.innerHTML=pe(this.pendingText)||this.pendingText,this.applyMarkdownStyles()),this.rafId=null}))}complete(e,t){var i;this.result.status="complete",this.result.tokens=e||this.result.tokens,this.result.durationMs=t||this.result.durationMs,this.result.responseText=this.pendingText||this.result.responseText,this.updateResponse(),this.updateStats();const s=(i=this.element)==null?void 0:i.querySelector(".result-status");s&&this.updateStatusBadge(s)}setError(e,t){var i;this.result.status="error",this.result.error=e,this.result.durationMs=t||this.result.durationMs,this.pendingText&&(this.result.responseText=this.pendingText),this.updateResponse();const s=(i=this.element)==null?void 0:i.querySelector(".result-status");s&&this.updateStatusBadge(s)}toggle(){var t;this.expanded=!this.expanded,this.contentEl&&(this.contentEl.style.display=this.expanded?"block":"none");const e=(t=this.element)==null?void 0:t.querySelector(".chevron");e&&(e.innerHTML=this.expanded?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>'),this.onToggle&&this.onToggle(this.result.id,this.expanded)}expand(){this.expanded||this.toggle()}collapse(){this.expanded&&this.toggle()}async copyResponse(){const e=this.result.responseText;if(!e){g("Nothing to copy");return}try{await navigator.clipboard.writeText(e),g("Copied to clipboard")}catch{g("Failed to copy")}}formatTime(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}getResult(){return this.result}}class Jt{constructor(){this.element=null,this.headerEl=null,this.contentEl=null,this.emptyStateEl=null,this.balloons=new Map}render(){return this.element?this.element:(this.element=document.createElement("div"),this.element.className="results-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","results-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
    `,this.headerEl=this.createHeader(),this.element.appendChild(this.headerEl),this.contentEl=document.createElement("div"),this.contentEl.className="results-content",this.contentEl.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: var(--pc-space-4);
    `,this.element.appendChild(this.contentEl),this.emptyStateEl=document.createElement("div"),this.emptyStateEl.className="empty-state",this.emptyStateEl.style.cssText="flex: 1;",this.emptyStateEl.innerHTML=`
      <div class="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
        </svg>
      </div>
      <div class="empty-state-title">No results yet</div>
      <div class="empty-state-description">
        Write a prompt and click Test.
      </div>
    `,this.contentEl.appendChild(this.emptyStateEl),this.loadResults(),this.element)}createHeader(){const e=document.createElement("div");e.className="results-header",e.style.cssText=`
      display: flex;
      align-items: center;
      gap: var(--pc-space-3);
      padding: var(--pc-space-3) var(--pc-space-4);
      border-bottom: 1px solid var(--pc-outline-variant);
      flex-shrink: 0;
    `,this.statsEl=document.createElement("div"),this.statsEl.className="session-stats",this.statsEl.style.cssText=`
      font-size: 0.875rem;
      color: var(--pc-on-surface-variant);
    `,this.statsEl.textContent="Total: 0 tokens",e.appendChild(this.statsEl);const t=document.createElement("div");t.style.flex="1",e.appendChild(t);const s=document.createElement("button");s.className="btn btn-text-compact",s.title="Clear all results",s.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
      </svg>
      <span>Clear</span>
    `,s.addEventListener("click",()=>this.handleClear()),e.appendChild(s);const i=document.createElement("button");return i.className="btn btn-text-compact",i.title="Download results",i.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>Save</span>
    `,i.addEventListener("click",()=>this.handleDownload()),e.appendChild(i),e}async loadResults(){const e=await we();if(e.length===0){this.showEmptyState();return}this.hideEmptyState(),this.balloons.clear(),this.contentEl.innerHTML="",this.contentEl.appendChild(this.emptyStateEl),this.emptyStateEl.style.display="none",[...e].reverse().forEach((s,i)=>{const o=new Oe(s,{expanded:i===0,onToggle:(r,a)=>this.handleBalloonToggle(r,a)});this.balloons.set(s.id,o),this.contentEl.insertBefore(o.render(),this.emptyStateEl)}),this.updateSessionStats()}addResult(e){if(this.balloons.has(e.id))return this.balloons.get(e.id);this.hideEmptyState(),this.balloons.forEach(s=>s.collapse());const t=new Oe(e,{expanded:!0,onToggle:(s,i)=>this.handleBalloonToggle(s,i)});return this.balloons.set(e.id,t),this.contentEl.insertBefore(t.render(),this.contentEl.firstChild),this.updateSessionStats(),t}getBalloon(e){return this.balloons.get(e)}handleBalloonToggle(e,t){}async handleClear(){this.balloons.size===0||!confirm("Clear all results? This cannot be undone.")||(await dt(),this.balloons.clear(),this.contentEl.innerHTML="",this.contentEl.appendChild(this.emptyStateEl),this.showEmptyState(),this.updateSessionStats(),g("Results cleared"))}async handleDownload(){const e=await we();if(e.length===0){g("No results to download");return}const t=this.generateMarkdown(e),s=new Blob([t],{type:"text/markdown"}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=`prompt-coach-results-${new Date().toISOString().split("T")[0]}.md`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),g("Results downloaded")}generateMarkdown(e){let t=`# Prompt Coach - Test Results

`;return t+=`Generated: ${new Date().toLocaleString()}

`,e.forEach((s,i)=>{var o;t+=`## Result ${i+1}

`,t+=`**Time:** ${new Date(s.timestamp).toLocaleString()}
`,t+=`**Provider:** ${s.provider} | **Model:** ${s.model}
`,(o=s.tokens)!=null&&o.total&&(t+=`**Tokens:** ${s.tokens.total} (prompt: ${s.tokens.prompt}, completion: ${s.tokens.completion})
`),t+=`
### Prompt

`,t+="```\n"+s.promptSnapshot+"\n```\n\n",t+=`### Response

`,t+=s.responseText+`

`,t+=`---

`}),t}async updateSessionStats(){const t=(await P()).totalTokens||0,s=this.balloons.size;this.statsEl&&(this.statsEl.textContent=`${s} result${s!==1?"s":""} • ${t.toLocaleString()} tokens`)}showEmptyState(){this.emptyStateEl&&(this.emptyStateEl.style.display="flex")}hideEmptyState(){this.emptyStateEl&&(this.emptyStateEl.style.display="none")}}class Wt{constructor(){this.element=null,this.contentArea=null,this.currentTab=Y().currentTab||"prompt",this.tabs={},this.menuPanel=null,this.feedbackPanel=null,this.ribbon=null}render(){this.element=document.createElement("div"),this.element.className="app-shell",this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
    `,this.ribbon=new yt({onMenuClick:()=>this.toggleMenu(),onScoreClick:()=>this.switchTab("feedback")}),this.element.appendChild(this.ribbon.render()),this.contentArea=document.createElement("main"),this.contentArea.className="app-content",this.contentArea.style.cssText=`
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    `,this.element.appendChild(this.contentArea),this.tabBar=new xt({currentTab:this.currentTab,onTabChange:t=>this.switchTab(t)}),this.element.appendChild(this.tabBar.render()),this.menuPanel=new Mt({onClose:()=>this.closeMenu()}),this.element.appendChild(this.menuPanel.render()),this.feedbackPanel=new Pt({onClose:()=>{},onPin:t=>this.handleFeedbackPinChange(t),onSkipContinue:()=>this.handleSkipContinue()});const e=this.feedbackPanel.render();return this.element.appendChild(this.feedbackPanel.getBackdrop()),this.element.appendChild(e),this.initTabs(),this.showTab(this.currentTab),this.element}initTabs(){this.tabs={prompt:new Ut,feedback:new Yt,attachments:new Xt,results:new Jt},this.tabs.prompt.setResultsTab(this.tabs.results),this.tabs.prompt.setOnSwitchToResults(()=>this.switchTab("results")),this.tabs.prompt.setOnShowFeedback(e=>this.showFeedback(e))}switchTab(e){this.currentTab=e,V("currentTab",e),this.showTab(e),this.tabBar&&this.tabBar.setActiveTab(e)}showTab(e){this.contentArea.innerHTML="";const t=this.tabs[e];t&&this.contentArea.appendChild(t.render())}toggleMenu(){this.menuPanel&&this.menuPanel.toggle()}closeMenu(){this.menuPanel&&this.menuPanel.hide()}showFeedback(e){this.feedbackPanel&&this.feedbackPanel.show(e),this.ribbon&&e.overall!==void 0&&this.ribbon.updateScore(e.overall,e.description)}handleFeedbackPinChange(e){if(e){const t=this.feedbackPanel.element;t&&this.contentArea&&this.element.insertBefore(t,this.contentArea)}else{const t=this.feedbackPanel.element;t&&this.element.appendChild(t)}}handleSkipContinue(){this.tabs.prompt&&this.tabs.prompt.runCoach()}}class Zt{constructor(e={}){this.onDismiss=e.onDismiss||null,this.element=null}render(){this.element=document.createElement("div"),this.element.className="first-run-overlay",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","first-run-title");const e=document.createElement("h1");e.id="first-run-title",e.className="first-run-title",e.textContent="Welcome to Prompt Coach";const t=document.createElement("p");t.className="first-run-description",t.textContent="Improve your prompting skills with AI-powered coaching. Get feedback on your prompts and learn best practices.";const s=document.createElement("button");return s.className="first-run-btn",s.textContent="Get Started",s.addEventListener("click",()=>this.dismiss()),this.element.appendChild(e),this.element.appendChild(t),this.element.appendChild(s),this.element}show(){this.element||this.render(),document.body.appendChild(this.element);const e=this.element.querySelector("button");e&&e.focus()}dismiss(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.onDismiss&&this.onDismiss()}}class Qt extends Ve{constructor(){super({title:"Configure API Key"}),this.inputs={}}createContent(){const e=document.createElement("div"),t=document.createElement("p");t.className="text-body",t.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-4);",t.textContent="API keys are stored locally on your device. You can add more providers later in Settings.",e.appendChild(t);const s=document.createElement("div");s.style.cssText="margin-bottom: var(--pc-space-4);";const i=document.createElement("label");i.className="text-label",i.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",i.textContent="Provider";const o=document.createElement("select");o.className="input",o.innerHTML=`
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
      <option value="google">Google</option>
      <option value="x">X (Grok)</option>
    `,this.providerSelect=o,s.appendChild(i),s.appendChild(o),e.appendChild(s);const r=document.createElement("div");r.style.cssText="margin-bottom: var(--pc-space-4);";const a=document.createElement("label");a.className="text-label",a.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",a.textContent="API Key";const d=document.createElement("input");return d.type="password",d.className="input",d.placeholder="Enter your API key",d.autocomplete="off",this.keyInput=d,r.appendChild(a),r.appendChild(d),e.appendChild(r),e}show(){this.render(),this.setContent(this.createContent()),this.addAction("Skip",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show(),setTimeout(()=>{this.keyInput.focus()},100)}save(){const e=this.providerSelect.value,t=this.keyInput.value.trim();if(!t){g("Please enter an API key");return}qe("apiKeys",{[e]:t}),g("API key saved"),this.close()}}function es(){const n=document.getElementById("loader");if(!n)return;n.style.pointerEvents="none";const e=2e3,t=2e3,s=performance.now(),i=m=>m===1?1:1-Math.pow(2,-10*m),o=Math.random()*Math.PI*2,r=Math.random()*Math.PI*2,a=.25+Math.random()*.125,d=.1875+Math.random()*.125,c=60,l=48;function u(m){const h=m-s,f=Math.min(h/e,1),p=Math.min(h/t,1),y=h/2e3*Math.PI*2,w=50+Math.sin(y*a+o)*c*(1-p),v=50+Math.cos(y*d+r)*l*(1-p),x=1-p,T=20*(1-i(f));n.style.backdropFilter=`blur(${T}px)`,n.style.webkitBackdropFilter=`blur(${T}px)`,n.style.background=`radial-gradient(
      circle at ${w}% ${v}%,
      transparent 0%,
      rgba(28, 27, 31, ${x*.1}) 15%,
      rgba(28, 27, 31, ${x*.4}) 40%,
      rgba(28, 27, 31, ${x*.7}) 70%,
      rgba(28, 27, 31, ${x}) 100%
    )`,p<1?requestAnimationFrame(u):n.remove()}requestAnimationFrame(u)}async function _e(){try{gt(),await k(),await P();const n=Y(),e=document.getElementById("app"),t=new Wt;e.appendChild(t.render()),es(),n.firstRunCompleted||new Zt({onDismiss:()=>{V("firstRunCompleted",!0),ie()||new Qt().show()}}).show(),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}catch(n){console.error("Failed to initialize app:",n),document.getElementById("app").innerHTML=`
      <div class="empty-state" style="height: 100vh;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Something went wrong</div>
        <div class="empty-state-description">Please refresh the page to try again.</div>
      </div>
    `}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_e):_e();
