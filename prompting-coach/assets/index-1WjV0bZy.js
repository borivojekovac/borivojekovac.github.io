(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();const q="logs";let H=null;function Ne(n){H=n}function z(n){return{id:crypto.randomUUID(),timestamp:new Date().toISOString(),type:n.type||"request",provider:n.provider||"",model:n.model||"",promptLength:n.promptLength||0,responseLength:n.responseLength||null,tokens:n.tokens||null,error:n.error||null,durationMs:n.durationMs||0}}async function $(n){if(!H){console.warn("Logger: Database not initialized");return}if(!H.objectStoreNames.contains(q)){console.warn("Logger: Logs store not found - DB may need upgrade. Clear site data to fix.");return}return new Promise((e,t)=>{try{const s=H.transaction(q,"readwrite");s.objectStore(q).add(n),s.oncomplete=()=>e(),s.onerror=()=>t(s.error)}catch(s){console.error("Logger: Failed to save log",s),e()}})}async function xe(n,e,t){const s=z({type:"request",provider:n,model:e,promptLength:t});return await $(s),s}async function Ee(n,e,t,s,i){const o=z({type:"response",provider:n,model:e,responseLength:t,tokens:s,durationMs:i});await $(o)}async function W(n,e,t,s){const i=z({type:"error",provider:n,model:e,error:t,durationMs:s});await $(i)}async function Ae(n,e="",t=""){const s=z({type:"skip",provider:e,model:t,error:null,durationMs:0});s.principleId=n,await $(s)}const J="promptcoach",Be=4;let x=null;const ne=["sessions","logs","feedback","promptHistory"];async function k(){if(x){const n=ne.filter(e=>!x.objectStoreNames.contains(e));if(n.length===0)return x;console.warn("IndexedDB missing stores:",n,"- resetting database"),x.close(),x=null,await Ie()}return new Promise((n,e)=>{const t=indexedDB.open(J,Be);t.onerror=()=>e(t.error),t.onsuccess=()=>{x=t.result;const s=ne.filter(i=>!x.objectStoreNames.contains(i));if(s.length>0){console.warn("IndexedDB still missing stores after open:",s,"- deleting and retrying"),x.close(),x=null,indexedDB.deleteDatabase(J),setTimeout(()=>{k().then(n).catch(e)},100);return}Ne(x),n(x)},t.onupgradeneeded=s=>{const i=s.target.result;if(!i.objectStoreNames.contains("sessions")){const o=i.createObjectStore("sessions",{keyPath:"id"});o.createIndex("createdAt","createdAt",{unique:!1}),o.createIndex("updatedAt","updatedAt",{unique:!1})}if(!i.objectStoreNames.contains("logs")){const o=i.createObjectStore("logs",{keyPath:"id"});o.createIndex("timestamp","timestamp",{unique:!1}),o.createIndex("type","type",{unique:!1}),o.createIndex("provider","provider",{unique:!1})}if(!i.objectStoreNames.contains("feedback")){const o=i.createObjectStore("feedback",{keyPath:"id"});o.createIndex("sessionId","sessionId",{unique:!1}),o.createIndex("timestamp","timestamp",{unique:!1})}i.objectStoreNames.contains("promptHistory")||i.createObjectStore("promptHistory",{keyPath:"id"})}})}function Ie(){return new Promise(n=>{const e=indexedDB.deleteDatabase(J);e.onsuccess=()=>n(),e.onerror=()=>n(),e.onblocked=()=>{console.warn("IndexedDB delete blocked - close other tabs"),n()}})}async function we(n,e){const t=await k();return new Promise((s,i)=>{const a=t.transaction(n,"readonly").objectStore(n).get(e);a.onerror=()=>i(a.error),a.onsuccess=()=>s(a.result)})}async function _(n,e){const t=await k();return new Promise((s,i)=>{const a=t.transaction(n,"readwrite").objectStore(n).put(e);a.onerror=()=>i(a.error),a.onsuccess=()=>s()})}async function Re(n){const e=await k();return new Promise((t,s)=>{const r=e.transaction(n,"readonly").objectStore(n).getAll();r.onerror=()=>s(r.error),r.onsuccess=()=>t(r.result)})}const Ce="promptcoach_appstate",Te="promptcoach_settings",ke="promptcoach_current_session",ie={currentTab:"prompt",firstRunCompleted:!1,feedbackPanelPinned:!1,feedbackPanelRatio:.5},I={theme:"system",apiKeys:{openai:null,anthropic:null,google:null,x:null},coachProvider:"openai",coachModel:null,testProvider:"openai",testModel:null};function F(){try{const n=localStorage.getItem(Ce);if(n)return{...ie,...JSON.parse(n)}}catch(n){console.error("Failed to load AppState:",n)}return{...ie}}function Oe(n){try{["prompt","feedback","attachments","results"].includes(n.currentTab)||(n.currentTab="prompt"),(n.feedbackPanelRatio<.2||n.feedbackPanelRatio>.8)&&(n.feedbackPanelRatio=.5),localStorage.setItem(Ce,JSON.stringify(n))}catch(e){console.error("Failed to save AppState:",e)}}function D(n,e){const t=F();return t[n]=e,Oe(t),t}function M(){try{const n=localStorage.getItem(Te);if(n){const e=JSON.parse(n);return{...I,...e,apiKeys:{...I.apiKeys,...e.apiKeys}}}}catch(n){console.error("Failed to load Settings:",n)}return{...I,apiKeys:{...I.apiKeys}}}function Se(n){try{["system","light","dark"].includes(n.theme)||(n.theme="system");const t=["openai","anthropic","google","x"];t.includes(n.coachProvider)||(n.coachProvider="openai"),t.includes(n.testProvider)||(n.testProvider="openai"),localStorage.setItem(Te,JSON.stringify(n))}catch(e){console.error("Failed to save Settings:",e)}}function Pe(n,e){const t=M();return n==="apiKeys"?t.apiKeys={...t.apiKeys,...e}:t[n]=e,Se(t),t}function X(){const n=M();return Object.values(n.apiKeys).some(e=>e&&e.trim()!=="")}function te(){try{const n=localStorage.getItem(ke);if(n)return JSON.parse(n).sessionId}catch(n){console.error("Failed to load current session ID:",n)}return null}function He(n){try{localStorage.setItem(ke,JSON.stringify({sessionId:n}))}catch(e){console.error("Failed to save current session ID:",e)}}async function De(){const n={id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),promptText:"",promptHistory:[],results:[],totalTokens:0,lastScore:null,lastDescription:null,feedbackCount:0};return await _("sessions",n),He(n.id),n}async function w(){await k();const n=te();if(n){const e=await we("sessions",n);if(e)return e}return De()}async function A(n){const t={...await w(),...n,updatedAt:new Date().toISOString()};return await _("sessions",t),t}let V=null;function j(n){V&&clearTimeout(V),V=setTimeout(async()=>{await A({promptText:n})},500)}async function ze(n){var t;const e=await w();return e.results||(e.results=[]),e.results.push(n),(t=n.tokens)!=null&&t.total&&(e.totalTokens=(e.totalTokens||0)+n.tokens.total),A({results:e.results,totalTokens:e.totalTokens})}async function oe(){return(await w()).results||[]}async function $e(){return A({results:[],totalTokens:0})}async function re(n,e){const t=await w();if(!t.results)return t;const s=t.results.findIndex(i=>i.id===n);return s!==-1?(t.results[s]={...t.results[s],...e},e.tokens&&(t.totalTokens=t.results.reduce((i,o)=>{var r;return i+(((r=o.tokens)==null?void 0:r.total)||0)},0)),A({results:t.results,totalTokens:t.totalTokens})):t}function _e(n={}){return{id:crypto.randomUUID(),timestamp:new Date().toISOString(),promptSnapshot:n.promptSnapshot||"",provider:n.provider||"",model:n.model||"",responseText:n.responseText||"",tokens:n.tokens||{prompt:0,completion:0,total:0},durationMs:n.durationMs||0,error:n.error||null,status:n.status||"streaming"}}function Fe(n={}){return{id:crypto.randomUUID(),sessionId:te(),timestamp:new Date().toISOString(),promptSnapshot:n.promptSnapshot||"",scores:n.scores||[],overall:n.overall||0,description:n.description||"",feedback:n.feedback||"",provider:n.provider||"",model:n.model||"",durationMs:n.durationMs||0,targetPrinciple:n.targetPrinciple||null,complete:n.complete||!1}}async function Ke(n){await k();try{await _("feedback",n)}catch(t){console.warn("Failed to save feedback to IndexedDB - DB may need upgrade. Clear site data to fix.",t)}const e=await w();return await A({lastScore:n.overall,lastDescription:n.description,feedbackCount:(e.feedbackCount||0)+1}),n}async function qe(){await k();const n=te();if(!n)return[];try{return(await Re("feedback")).filter(t=>t.sessionId===n).sort((t,s)=>new Date(s.timestamp)-new Date(t.timestamp))}catch(e){return console.warn("Failed to get feedback from IndexedDB - DB may need upgrade.",e),[]}}const ae="data-theme";function Q(n){const e=document.documentElement;n==="system"?e.removeAttribute(ae):e.setAttribute(ae,n);const t=document.querySelector('meta[name="theme-color"]');if(t){const s=n==="dark"||n==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches;t.setAttribute("content",s?"#1C1B1F":"#6750A4")}}function Ve(n){Pe("theme",n),Q(n)}function je(){const n=M();Q(n.theme),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{M().theme==="system"&&Q("system")})}class Ue{constructor(){this.element=null,this.ringEl=null,this.scoreEl=null,this.score=null,this.description=null,this.onClick=null}render(){this.element=document.createElement("div"),this.element.className="score-badge",this.element.style.cssText=`
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
    `,this.scoreEl.textContent="—",e.appendChild(this.scoreEl),this.element.appendChild(e),this.element}setScore(e,t){this.score=e,this.description=t,this.scoreEl.textContent=Math.round(e);const i=100.53*(1-e/100);this.ringEl.setAttribute("stroke-dashoffset",i.toString()),e>=80?this.ringEl.setAttribute("stroke","var(--pc-primary)"):e>=60?this.ringEl.setAttribute("stroke","#F59E0B"):this.ringEl.setAttribute("stroke","#EF4444"),this.element.title=t||`Score: ${Math.round(e)}`}clear(){this.score=null,this.description=null,this.scoreEl.textContent="—",this.ringEl.setAttribute("stroke-dashoffset","100.53"),this.ringEl.setAttribute("stroke","var(--pc-primary)"),this.element.title="Not evaluated"}setOnClick(e){this.onClick=e}getScore(){return this.score}}class Ge{constructor(e={}){this.onMenuClick=e.onMenuClick||null,this.onScoreClick=e.onScoreClick||null,this.element=null,this.scoreBadge=null}render(){this.element=document.createElement("header"),this.element.className="ribbon",this.element.style.cssText=`
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
    `,t.textContent="Prompt Coach",this.element.appendChild(t),this.scoreBadge=new Ue,this.scoreBadge.setOnClick(()=>{this.onScoreClick&&this.onScoreClick()});const s=document.createElement("div");return s.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      margin-right: var(--pc-space-2);
      background-color: var(--pc-surface);
      border-radius: 50%;
      overflow: visible;
    `,s.appendChild(this.scoreBadge.render()),this.element.appendChild(s),this.loadPersistedScore(),this.element}async loadPersistedScore(){try{const e=await w();e.lastScore!==null&&e.lastScore!==void 0&&this.scoreBadge.setScore(e.lastScore,e.lastDescription||"")}catch(e){console.warn("Ribbon: Failed to load persisted score",e)}}updateScore(e,t){e===null?this.scoreBadge.clear():this.scoreBadge.setScore(e,t)}getScoreBadge(){return this.scoreBadge}}const Ye=[{id:"prompt",label:"Prompt",icon:"edit"},{id:"feedback",label:"Feedback",icon:"chat"},{id:"attachments",label:"Attachments",icon:"clip"},{id:"results",label:"Results",icon:"chart"}];class We{constructor(e={}){this.currentTab=e.currentTab||"prompt",this.onTabChange=e.onTabChange||null,this.element=null,this.tabButtons={}}getIcon(e){return`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${{edit:'<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',chat:'<path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 14H6l-2 2V4h16v12z"/>',clip:'<path d="M16.5 6v11.5a4 4 0 01-8 0V5a2.5 2.5 0 015 0v10.5a1 1 0 01-2 0V6H10v9.5a2.5 2.5 0 005 0V5a4 4 0 00-8 0v12.5a5.5 5.5 0 0011 0V6h-1.5z"/>',chart:'<path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>'}[e]||""}</svg>`}render(){return this.element=document.createElement("nav"),this.element.className="tab-bar",this.element.setAttribute("role","tablist"),this.element.style.cssText=`
      display: flex;
      height: 64px;
      background-color: var(--pc-surface);
      border-top: 1px solid var(--pc-outline-variant);
      flex-shrink: 0;
    `,Ye.forEach(e=>{const t=this.createTabButton(e);this.tabButtons[e.id]=t,this.element.appendChild(t)}),this.updateActiveTab(),this.element}createTabButton(e){const t=document.createElement("button");t.className="tab-button",t.setAttribute("role","tab"),t.setAttribute("aria-selected",e.id===this.currentTab),t.setAttribute("aria-controls",`${e.id}-panel`),t.style.cssText=`
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
    `;const s=document.createElement("span");s.className="tab-icon",s.innerHTML=this.getIcon(e.icon);const i=document.createElement("span");return i.className="tab-label",i.style.cssText="font-size: 0.75rem; font-weight: 500;",i.textContent=e.label,t.appendChild(s),t.appendChild(i),t.addEventListener("click",()=>this.selectTab(e.id)),t}selectTab(e){this.currentTab!==e&&(this.currentTab=e,this.updateActiveTab(),this.onTabChange&&this.onTabChange(e))}updateActiveTab(){Object.entries(this.tabButtons).forEach(([e,t])=>{const s=e===this.currentTab;t.setAttribute("aria-selected",s),t.style.color=s?"var(--pc-primary)":"var(--pc-on-surface-variant)"})}setActiveTab(e){this.currentTab=e,this.updateActiveTab()}}let P=null;const Je=3e3;function Xe(){return P||(P=document.createElement("div"),P.className="toast-container",P.setAttribute("role","status"),P.setAttribute("aria-live","polite"),document.body.appendChild(P)),P}function g(n,e=Je){const t=Xe(),s=document.createElement("div");s.className="toast",s.textContent=n,t.appendChild(s);const i=setTimeout(()=>{le(s)},e);return s.addEventListener("click",()=>{clearTimeout(i),le(s)}),s}function le(n){n.classList.add("toast-exit"),n.addEventListener("animationend",()=>{n.parentNode&&n.parentNode.removeChild(n)})}function ce(){g("Coming soon")}class Me{constructor(e={}){this.title=e.title||"",this.onClose=e.onClose||null,this.element=null,this.overlay=null,this.handleKeyDown=this.handleKeyDown.bind(this)}render(){this.overlay=document.createElement("div"),this.overlay.className="overlay",this.overlay.addEventListener("click",s=>{s.target===this.overlay&&this.close()}),this.element=document.createElement("div"),this.element.className="dialog",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","dialog-title");const e=document.createElement("div");e.className="dialog-header";const t=document.createElement("h2");return t.id="dialog-title",t.className="dialog-title",t.textContent=this.title,e.appendChild(t),this.content=document.createElement("div"),this.content.className="dialog-content",this.actions=document.createElement("div"),this.actions.className="dialog-actions",this.element.appendChild(e),this.element.appendChild(this.content),this.element.appendChild(this.actions),this.overlay.appendChild(this.element),this.overlay}setContent(e){typeof e=="string"?this.content.innerHTML=e:(this.content.innerHTML="",this.content.appendChild(e))}addAction(e,t,s="text"){const i=document.createElement("button");return i.className=`btn btn-${s}`,i.textContent=e,i.addEventListener("click",t),this.actions.appendChild(i),i}handleKeyDown(e){e.key==="Escape"&&this.close()}show(){this.overlay||this.render(),document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeyDown);const e=this.element.querySelector("button, input, textarea, select");e&&e.focus()}close(){document.removeEventListener("keydown",this.handleKeyDown),this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay),this.onClose&&this.onClose()}}class se{constructor(e,t){if(new.target===se)throw new Error("LLMProvider is abstract and cannot be instantiated directly");if(!e)throw new Error("API key is required");if(!t)throw new Error("Model is required");this.apiKey=e,this.model=t}getProviderName(){throw new Error("Must implement getProviderName()")}getModelName(){return this.model}async*streamCompletion(e,t={}){throw new Error("Must implement streamCompletion()")}}const v={INVALID_API_KEY:"invalid_api_key",RATE_LIMITED:"rate_limited",NETWORK_ERROR:"network_error",SERVER_ERROR:"server_error",TIMEOUT:"timeout",STREAM_INTERRUPTED:"stream_interrupted",INVALID_RESPONSE:"invalid_response",UNKNOWN:"unknown",COACH_VALIDATION_FAILED:"coach_validation_failed",COACH_METHODOLOGY_MISSING:"coach_methodology_missing",COACH_EVALUATION_FAILED:"coach_evaluation_failed"},de={[v.INVALID_API_KEY]:"Invalid API key. Check Settings.",[v.RATE_LIMITED]:"Rate limit exceeded. Try again later.",[v.NETWORK_ERROR]:"Network error. Check connection.",[v.SERVER_ERROR]:"Server error. Try again later.",[v.TIMEOUT]:"Request timed out. Try again.",[v.STREAM_INTERRUPTED]:"Response interrupted.",[v.INVALID_RESPONSE]:"Invalid response from provider.",[v.UNKNOWN]:"An unexpected error occurred.",[v.COACH_VALIDATION_FAILED]:"Coach couldn't evaluate. Try again.",[v.COACH_METHODOLOGY_MISSING]:"Coaching methodology not configured.",[v.COACH_EVALUATION_FAILED]:"Coach couldn't evaluate. Try again."};class y extends Error{constructor(e,t=v.UNKNOWN,s=!1,i={}){super(e),this.name="LLMError",this.code=t,this.retryable=s,this.details=i,this.userMessage=de[t]||de[v.UNKNOWN]}static fromHttpStatus(e,t="",s=null){switch(e){case 401:return new y(`Authentication failed: ${t}`,v.INVALID_API_KEY,!1,{status:e,body:s});case 429:return new y(`Rate limit exceeded: ${t}`,v.RATE_LIMITED,!0,{status:e,body:s});case 500:case 502:case 503:case 504:return new y(`Server error: ${e} ${t}`,v.SERVER_ERROR,!0,{status:e,body:s});default:return new y(`HTTP error: ${e} ${t}`,v.UNKNOWN,!1,{status:e,body:s})}}static fromNetworkError(e){return e.name==="AbortError"?new y("Request was aborted",v.TIMEOUT,!0,{originalError:e.message}):new y(`Network error: ${e.message}`,v.NETWORK_ERROR,!0,{originalError:e.message})}static streamInterrupted(e="Unknown"){return new y(`Stream interrupted: ${e}`,v.STREAM_INTERRUPTED,!1,{reason:e})}}const pe="https://api.openai.com/v1/chat/completions";class Qe extends se{constructor(e,t="gpt-3.5-turbo"){super(e,t)}getProviderName(){return"OpenAI"}async*streamCompletion(e,t={}){var h,f;const{maxTokens:s=2048,temperature:i=.7,systemPrompt:o=null}=t,r=[];o&&r.push({role:"system",content:o}),r.push({role:"user",content:e});const a={model:this.model,messages:r,max_tokens:s,temperature:i,stream:!0,stream_options:{include_usage:!0}};console.log("OpenAI: Sending request to",pe,"with model:",this.model);let l;try{l=await fetch(pe,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(a)})}catch(m){throw console.error("OpenAI: Network error",m),y.fromNetworkError(m)}if(console.log("OpenAI: Response status",l.status),!l.ok){let m=null;try{m=await l.json(),console.error("OpenAI: Error response",m)}catch{}throw y.fromHttpStatus(l.status,l.statusText,m)}const c=l.body.getReader(),d=new TextDecoder;let p="",u=null;try{for(;;){const{done:m,value:C}=await c.read();if(m){yield{content:"",done:!0,usage:u};break}p+=d.decode(C,{stream:!0});const B=p.split(`
`);p=B.pop()||"";for(const K of B){const E=K.trim();if(!(!E||E==="data: [DONE]")&&E.startsWith("data: "))try{const T=JSON.parse(E.slice(6)),S=(f=(h=T.choices)==null?void 0:h[0])==null?void 0:f.delta;S!=null&&S.content&&(yield{content:S.content,done:!1,usage:null}),T.usage&&(u={prompt:T.usage.prompt_tokens,completion:T.usage.completion_tokens,total:T.usage.total_tokens})}catch(T){console.warn("OpenAI: Failed to parse chunk",T)}}}}catch(m){throw m instanceof y?m:y.streamInterrupted(m.message)}finally{c.releaseLock()}}}const b={OPENAI:"openai",ANTHROPIC:"anthropic",GOOGLE:"google",X:"x"},Ze={[b.OPENAI]:"gpt-4o-mini",[b.ANTHROPIC]:"claude-3-5-sonnet-20241022",[b.GOOGLE]:"gemini-1.5-flash",[b.X]:"grok-2"},he={[b.OPENAI]:["gpt-4.1","gpt-4.1-mini","gpt-4.1-nano","o1","o1-mini","o1-preview","gpt-4o","gpt-4o-mini","chatgpt-4o-latest","gpt-4-turbo","gpt-4-turbo-preview","gpt-4","gpt-3.5-turbo"],[b.ANTHROPIC]:["claude-3-7-sonnet-20250219","claude-3-5-sonnet-20241022","claude-3-5-haiku-20241022","claude-3-opus-20240229","claude-3-sonnet-20240229","claude-3-haiku-20240307"],[b.GOOGLE]:["gemini-2.0-flash","gemini-1.5-pro","gemini-1.5-flash","gemini-pro"],[b.X]:["grok-2","grok-1"]};function Le(n,e,t=null){const s=n==null?void 0:n.toLowerCase(),i=t||Ze[s];switch(s){case b.OPENAI:return new Qe(e,i);case b.ANTHROPIC:case b.GOOGLE:case b.X:throw new y(`Provider '${n}' is not yet implemented`,v.UNKNOWN,!1);default:throw new y(`Unknown provider type: ${n}`,v.UNKNOWN,!1)}}function R(n){return(n==null?void 0:n.toLowerCase())===b.OPENAI}const U=[{id:"openai",name:"OpenAI"},{id:"anthropic",name:"Anthropic"},{id:"google",name:"Google"},{id:"x",name:"X (Grok)"}];class et extends Me{constructor(){super({title:"Settings"}),this.settings=M(),this.apiKeyInputs={}}createContent(){const e=document.createElement("div");return e.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-6);",e.appendChild(this.createThemeSection()),e.appendChild(this.createCoachLLMSection()),e.appendChild(this.createTestLLMSection()),e.appendChild(this.createApiKeysSection()),e}createThemeSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Theme",e.appendChild(t);const s=document.createElement("div");return s.style.cssText="display: flex; gap: var(--pc-space-3);",["system","light","dark"].forEach(i=>{const o=document.createElement("label");o.style.cssText=`
        display: flex;
        align-items: center;
        gap: var(--pc-space-2);
        cursor: pointer;
        padding: var(--pc-space-2);
      `;const r=document.createElement("input");r.type="radio",r.name="theme",r.value=i,r.checked=this.settings.theme===i,r.addEventListener("change",()=>{this.settings.theme=i,Ve(i)});const a=document.createElement("span");a.className="text-body",a.textContent=i.charAt(0).toUpperCase()+i.slice(1),o.appendChild(r),o.appendChild(a),s.appendChild(o)}),e.appendChild(s),e}createCoachLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Coach LLM",e.appendChild(t);const s=document.createElement("p");s.className="text-body",s.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-2); font-size: 0.85rem;",s.textContent="Model used for prompt evaluation and feedback.",e.appendChild(s);const i=document.createElement("div");i.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const o=document.createElement("div");o.style.cssText="flex: 1; min-width: 140px;";const r=document.createElement("label");r.className="text-label",r.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",r.textContent="Provider",o.appendChild(r),this.coachProviderSelect=document.createElement("select"),this.coachProviderSelect.className="input",this.coachProviderSelect.style.cssText="width: 100%;",U.forEach(c=>{const d=document.createElement("option");d.value=c.id,d.textContent=c.name,d.disabled=!R(c.id),R(c.id)||(d.textContent+=" (coming soon)"),this.coachProviderSelect.appendChild(d)}),this.coachProviderSelect.value=this.settings.coachProvider||"openai",this.coachProviderSelect.addEventListener("change",()=>{this.settings.coachProvider=this.coachProviderSelect.value,this.updateCoachModelOptions()}),o.appendChild(this.coachProviderSelect),i.appendChild(o);const a=document.createElement("div");a.style.cssText="flex: 2; min-width: 200px;";const l=document.createElement("label");return l.className="text-label",l.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",l.textContent="Model",a.appendChild(l),this.coachModelSelect=document.createElement("select"),this.coachModelSelect.className="input",this.coachModelSelect.style.cssText="width: 100%;",this.coachModelSelect.addEventListener("change",()=>{this.settings.coachModel=this.coachModelSelect.value}),a.appendChild(this.coachModelSelect),i.appendChild(a),e.appendChild(i),this.updateCoachModelOptions(),e}updateCoachModelOptions(){const e=this.coachProviderSelect.value,t=he[e]||[];this.coachModelSelect.innerHTML="",t.forEach(s=>{const i=document.createElement("option");i.value=s,i.textContent=s,this.coachModelSelect.appendChild(i)}),this.settings.coachModel&&t.includes(this.settings.coachModel)?this.coachModelSelect.value=this.settings.coachModel:t.length>0&&(this.coachModelSelect.value=t[0],this.settings.coachModel=t[0])}createTestLLMSection(){const e=document.createElement("div"),t=document.createElement("h3");t.className="text-title",t.style.cssText="margin-bottom: var(--pc-space-3);",t.textContent="Test LLM",e.appendChild(t);const s=document.createElement("div");s.style.cssText="display: flex; gap: var(--pc-space-3); flex-wrap: wrap;";const i=document.createElement("div");i.style.cssText="flex: 1; min-width: 140px;";const o=document.createElement("label");o.className="text-label",o.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",o.textContent="Provider",i.appendChild(o),this.testProviderSelect=document.createElement("select"),this.testProviderSelect.className="input",this.testProviderSelect.style.cssText="width: 100%;",U.forEach(l=>{const c=document.createElement("option");c.value=l.id,c.textContent=l.name,c.disabled=!R(l.id),R(l.id)||(c.textContent+=" (coming soon)"),this.testProviderSelect.appendChild(c)}),this.testProviderSelect.value=this.settings.testProvider||"openai",this.testProviderSelect.addEventListener("change",()=>{this.settings.testProvider=this.testProviderSelect.value,this.updateModelOptions()}),i.appendChild(this.testProviderSelect),s.appendChild(i);const r=document.createElement("div");r.style.cssText="flex: 2; min-width: 200px;";const a=document.createElement("label");return a.className="text-label",a.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",a.textContent="Model",r.appendChild(a),this.testModelSelect=document.createElement("select"),this.testModelSelect.className="input",this.testModelSelect.style.cssText="width: 100%;",this.testModelSelect.addEventListener("change",()=>{this.settings.testModel=this.testModelSelect.value}),r.appendChild(this.testModelSelect),s.appendChild(r),e.appendChild(s),this.updateModelOptions(),e}updateModelOptions(){const e=this.testProviderSelect.value,t=he[e]||[];this.testModelSelect.innerHTML="",t.forEach(s=>{const i=document.createElement("option");i.value=s,i.textContent=s,this.testModelSelect.appendChild(i)}),this.settings.testModel&&t.includes(this.settings.testModel)?this.testModelSelect.value=this.settings.testModel:t.length>0&&(this.testModelSelect.value=t[0],this.settings.testModel=t[0])}createApiKeysSection(){const e=document.createElement("div"),t=document.createElement("div");t.style.cssText="margin-bottom: var(--pc-space-3);";const s=document.createElement("h3");s.className="text-title",s.textContent="API Keys",t.appendChild(s);const i=document.createElement("p");i.className="text-body",i.style.cssText="color: var(--pc-on-surface-variant); margin-top: var(--pc-space-1);",i.textContent="⚠️ Keys are stored locally on your device.",t.appendChild(i),e.appendChild(t);const o=document.createElement("div");return o.style.cssText="display: flex; flex-direction: column; gap: var(--pc-space-3);",U.forEach(r=>{const a=document.createElement("div"),l=document.createElement("label");l.className="text-label",l.style.cssText="display: block; margin-bottom: var(--pc-space-1); color: var(--pc-on-surface-variant);",l.textContent=r.name,a.appendChild(l);const c=document.createElement("input");c.type="password",c.className="input",c.placeholder=`Enter ${r.name} API key`,c.value=this.settings.apiKeys[r.id]||"",c.autocomplete="off",c.addEventListener("input",d=>{this.settings.apiKeys[r.id]=d.target.value.trim()||null}),this.apiKeyInputs[r.id]=c,a.appendChild(c),o.appendChild(a)}),e.appendChild(o),e}show(){this.render(),this.setContent(this.createContent()),this.addAction("Cancel",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show()}save(){Se(this.settings),g("Settings saved"),this.close()}}class tt{constructor(e={}){this.onClose=e.onClose||null,this.element=null,this.backdrop=null,this.isOpen=!1}render(){const e=document.createElement("div");e.className="menu-container",e.style.cssText="position: fixed; inset: 0; z-index: var(--pc-z-overlay); pointer-events: none;",this.backdrop=document.createElement("div"),this.backdrop.className="menu-backdrop",this.backdrop.style.cssText=`
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
    `;const s=document.createElement("h2");s.className="text-title-lg",s.textContent="Prompt Coach",t.appendChild(s),this.element.appendChild(t);const i=document.createElement("ul");return i.style.cssText="list-style: none; padding: var(--pc-space-2) 0; flex: 1;",[{label:"New Session",icon:"add",action:()=>ce()},{label:"History",icon:"history",action:()=>ce()},{label:"Settings",icon:"settings",action:()=>this.openSettings()}].forEach(r=>{const a=document.createElement("li"),l=document.createElement("button");l.className="menu-item",l.style.cssText=`
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
      `,l.innerHTML=`${this.getIcon(r.icon)}<span>${r.label}</span>`,l.addEventListener("click",()=>{r.action(),this.hide()}),l.addEventListener("mouseenter",()=>{l.style.backgroundColor="var(--pc-surface-variant)"}),l.addEventListener("mouseleave",()=>{l.style.backgroundColor="transparent"}),a.appendChild(l),i.appendChild(a)}),this.element.appendChild(i),e.appendChild(this.element),e}getIcon(e){return`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">${{add:'<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',history:'<path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7 6.97 6.97 0 01-4.95-2.05l-1.41 1.41A8.97 8.97 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',settings:'<path d="M19.14 12.94a7.4 7.4 0 000-1.88l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.04 7.04 0 00-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54a7.04 7.04 0 00-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58a7.4 7.4 0 000 1.88l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.23 0 .43-.17.48-.41l.36-2.54a7.04 7.04 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>'}[e]||""}</svg>`}openSettings(){new et().show()}show(){this.isOpen=!0,this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.element.style.transform="translateX(0)"}hide(){this.isOpen&&(this.isOpen=!1,this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",this.element.style.transform="translateX(-100%)")}toggle(){this.isOpen?this.hide():this.show()}}const G="promptcoach_skipped_principles",Z={get(){try{return JSON.parse(sessionStorage.getItem(G)||"[]")}catch{return[]}},add(n){const e=this.get();return e.includes(n)||(e.push(n),sessionStorage.setItem(G,JSON.stringify(e))),e},has(n){return this.get().includes(n)},clear(){sessionStorage.removeItem(G)},count(){return this.get().length}};class st{constructor(e={}){this.element=null,this.backdrop=null,this.contentEl=null,this.feedbackEntry=null,this.isVisible=!1,this.isPinned=!1,this.isLoading=!1,this.ratio=.3,this.onClose=e.onClose||null,this.onPin=e.onPin||null,this.onSkipContinue=e.onSkipContinue||null,this.onNewSession=e.onNewSession||null,this.skipBtn=null,this.gotItBtn=null}render(){this.backdrop=document.createElement("div"),this.backdrop.className="feedback-backdrop",this.backdrop.style.cssText=`
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
    `,e.appendChild(t);let s=!1,i=0,o=0;const r=c=>{s=!0,i=c.clientY,o=this.ratio,document.body.style.cursor="ns-resize",document.body.style.userSelect="none",c.preventDefault()},a=c=>{if(!s)return;const p=(c.clientY-i)/window.innerHeight;this.setRatio(o+p)},l=()=>{s&&(s=!1,document.body.style.cursor="",document.body.style.userSelect="")};return e.addEventListener("mousedown",r),document.addEventListener("mousemove",a),document.addEventListener("mouseup",l),e.addEventListener("touchstart",c=>{s=!0,i=c.touches[0].clientY,o=this.ratio,c.preventDefault()}),document.addEventListener("touchmove",c=>{if(!s)return;const p=(c.touches[0].clientY-i)/window.innerHeight;this.setRatio(o+p)}),document.addEventListener("touchend",()=>{s=!1}),e}createHeader(){const e=document.createElement("div");e.className="feedback-header",e.style.cssText=`
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
    `,this.gotItBtn.addEventListener("click",()=>this.handleGotItClick()),e.appendChild(this.gotItBtn),e}handleGotItClick(){var t;((t=this.feedbackEntry)==null?void 0:t.complete)===!0&&(Z.clear(),this.onNewSession&&this.onNewSession(),this.element.dispatchEvent(new CustomEvent("new-session",{bubbles:!0}))),this.hide(!0)}handleSkipContinue(){if(this.isLoading||!this.feedbackEntry)return;const e=this.feedbackEntry.targetPrinciple;if(!e){console.warn("No targetPrinciple to skip");return}this.skipPromptSnapshot=this.feedbackEntry.promptSnapshot,Z.add(e),Ae(e),this.setLoading(!0),this.onSkipContinue&&this.onSkipContinue(e),this.element.dispatchEvent(new CustomEvent("skip-continue",{bubbles:!0,detail:{principleId:e}}))}hasPromptChangedDuringSkip(e){return this.isLoading&&this.skipPromptSnapshot&&this.skipPromptSnapshot!==e}cancelSkipIfPromptChanged(e){return this.hasPromptChangedDuringSkip(e)?(this.setLoading(!1),this.skipPromptSnapshot=null,!0):!1}setLoading(e){this.isLoading=e,this.skipBtn&&(this.skipBtn.disabled=e,this.skipBtn.textContent=e?"Loading...":"Skip & Continue",this.skipBtn.style.opacity=e?"0.6":"1"),this.gotItBtn&&(this.gotItBtn.disabled=e,this.gotItBtn.style.opacity=e?"0.6":"1")}show(e){this.feedbackEntry=e,this.setLoading(!1),this.renderContent(e),this.updateFooterForComplete(e.complete),this.backdrop.style.opacity="1",this.backdrop.style.pointerEvents="auto",this.element.style.transform="translateY(0)",this.isVisible=!0}updateFooterForComplete(e){this.skipBtn&&(this.skipBtn.style.display=e?"none":"block"),this.gotItBtn&&(this.gotItBtn.textContent=e?"Start New Session":"Got It")}hide(e=!1){this.isVisible&&(this.backdrop.style.opacity="0",this.backdrop.style.pointerEvents="none",(!this.isPinned||e)&&(this.element.style.transform="translateY(-100%)",this.isPinned&&e&&(this.isPinned=!1,this.updatePinState())),this.isVisible=!1,this.onClose&&this.onClose())}renderContent(e){this.contentEl.innerHTML="";const t=e.complete===!0,s=document.createElement("div");s.className="feedback-summary",s.style.cssText=`
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
    `,o.textContent=e.overall,i.appendChild(o),s.appendChild(i);const r=document.createElement("div");r.style.cssText="flex: 1;";const a=document.createElement("div");a.className="text-label",a.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: 2px;",a.textContent=t?"🎉 Coaching Complete!":"Overall Assessment",r.appendChild(a);const l=document.createElement("div");if(l.className="text-body",l.textContent=e.description,r.appendChild(l),s.appendChild(r),this.contentEl.appendChild(s),e.targetPrinciple&&!t){const d=document.createElement("div");d.className="target-principle-badge",d.style.cssText=`
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
      `,d.innerHTML=`
        <span style="font-size: 0.875rem;">🎯</span>
        <span>Focusing on: ${e.targetPrinciple}</span>
      `,this.contentEl.appendChild(d)}const c=document.createElement("div");if(c.className="feedback-text",c.style.cssText=`
      line-height: 1.6;
      color: var(--pc-on-surface);
    `,c.textContent=e.feedback,this.contentEl.appendChild(c),e.scores&&e.scores.length>0){const d=document.createElement("details");d.style.cssText="margin-top: var(--pc-space-4);";const p=document.createElement("summary");p.style.cssText=`
        cursor: pointer;
        color: var(--pc-primary);
        font-weight: 500;
        padding: var(--pc-space-2) 0;
      `,p.textContent="View all principle scores",d.appendChild(p);const u=document.createElement("div");u.style.cssText=`
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
        `;const m=document.createElement("span");m.style.cssText="font-weight: 500; text-transform: capitalize;",m.textContent=h.principle,f.appendChild(m);const C=document.createElement("span");C.style.cssText=`
          font-weight: 600;
          color: ${h.score>=70?"var(--pc-primary)":"var(--pc-on-surface-variant)"};
        `,C.textContent=h.score,f.appendChild(C),u.appendChild(f)}),d.appendChild(u),this.contentEl.appendChild(d)}}togglePin(){this.setPinned(!this.isPinned)}setPinned(e){this.isPinned=e,this.pinBtn.style.color=e?"var(--pc-primary)":"var(--pc-on-surface-variant)",e?(this.element.style.position="relative",this.element.style.transform="none",this.element.style.maxHeight=`${this.ratio*100}vh`,this.element.style.borderBottom="3px solid var(--pc-primary)",this.backdrop.style.display="none",this.divider&&(this.divider.style.display="block")):(this.element.style.position="fixed",this.element.style.transform=this.isVisible?"translateY(0)":"translateY(-100%)",this.element.style.maxHeight="60vh",this.element.style.borderBottom="1px solid var(--pc-outline-variant)",this.backdrop.style.display="block",this.divider&&(this.divider.style.display="none")),D("feedbackPanelPinned",e),this.onPin&&this.onPin(e)}setRatio(e){this.ratio=Math.max(.15,Math.min(.7,e)),this.isPinned&&(this.element.style.maxHeight=`${this.ratio*100}vh`),D("feedbackPanelRatio",this.ratio)}loadPersistedState(){const e=F();this.isPinned=e.feedbackPanelPinned||!1,this.ratio=e.feedbackPanelRatio||.3,this.isPinned&&(this.pinBtn.style.color="var(--pc-primary)")}getBackdrop(){return this.backdrop}}function L(n){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return n.replace(/[&<>"']/g,t=>e[t])}function ee(n){if(!n||typeof n!="string")return"";const e=n.split(`
`),t=[];let s=[],i=!1,o="",r=!1,a=[];for(let c=0;c<e.length;c++){const d=e[c];if(d.startsWith("```")){i?(t.push({type:"code",lang:o,content:s.join(`
`)}),s=[],i=!1,o=""):(s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),i=!0,o=d.slice(3).trim());continue}if(i){s.push(d);continue}const p=d.match(/^(#{1,6})\s+(.+)$/);if(p){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"header",level:p[1].length,content:p[2]});continue}const u=d.match(/^[\*\-]\s+(.+)$/);if(u){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r=!0,a.push(u[1]);continue}const h=d.match(/^\d+\.\s+(.+)$/);if(h){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r=!0,a.push(h[1]);continue}if(d.match(/^---+$/)){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"hr"});continue}const f=d.match(/^>\s+(.+)$/);if(f){s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]),r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),t.push({type:"blockquote",content:f[1]});continue}if(d.trim()===""){r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),s.length>0&&(t.push({type:"paragraph",content:s.join(`
`)}),s=[]);continue}r&&a.length>0&&(t.push({type:"list",items:a}),a=[],r=!1),s.push(d)}return r&&a.length>0&&t.push({type:"list",items:a}),s.length>0&&t.push({type:"paragraph",content:s.join(`
`)}),t.map(c=>{switch(c.type){case"header":return`<h${c.level}>${O(L(c.content))}</h${c.level}>`;case"paragraph":const d=O(L(c.content));return d?`<p>${d}</p>`:"";case"list":return`<ul>${c.items.map(p=>`<li>${O(L(p))}</li>`).join("")}</ul>`;case"code":return`<pre><code class="language-${c.lang}">${L(c.content)}</code></pre>`;case"blockquote":return`<blockquote>${O(L(c.content))}</blockquote>`;case"hr":return"<hr>";default:return""}}).filter(Boolean).join("")}function O(n){let e=n;return e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/___(.+?)___/g,"<strong><em>$1</em></strong>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/_(.+?)_/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>'),e}const nt="modulepreload",it=function(n){return"/"+n},ue={},me=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),a=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));i=Promise.allSettled(t.map(l=>{if(l=it(l),l in ue)return;ue[l]=!0;const c=l.endsWith(".css"),d=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${d}`))return;const p=document.createElement("link");if(p.rel=c?"stylesheet":nt,c||(p.as="script"),p.crossOrigin="",p.href=l,a&&p.setAttribute("nonce",a),document.head.appendChild(p),c)return new Promise((u,h)=>{p.addEventListener("load",u),p.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${l}`)))})}))}function o(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return i.then(r=>{for(const a of r||[])a.status==="rejected"&&o(a.reason);return e().catch(o)})};function ot(n,e=null){const t=[];if(!n||typeof n!="object")return{valid:!1,errors:["Response must be a JSON object"]};if(n.scores?Array.isArray(n.scores)?n.scores.length===0&&t.push("scores array must not be empty"):t.push("scores must be an array"):t.push("Missing required field: scores"),(n.overall===void 0||n.overall===null)&&t.push("Missing required field: overall"),n.description||t.push("Missing required field: description"),n.feedback||t.push("Missing required field: feedback"),t.length>0)return{valid:!1,errors:t};if(typeof n.overall!="number"&&t.push("overall must be a number"),typeof n.description!="string"&&t.push("description must be a string"),typeof n.feedback!="string"&&t.push("feedback must be a string"),n.scores.forEach((s,i)=>{(!s.principle||typeof s.principle!="string")&&t.push(`scores[${i}].principle must be a non-empty string`),(s.score===void 0||typeof s.score!="number")&&t.push(`scores[${i}].score must be a number`),(!s.reason||typeof s.reason!="string")&&t.push(`scores[${i}].reason must be a non-empty string`)}),typeof n.overall=="number"&&(n.overall<0||n.overall>100)&&t.push("overall must be between 0 and 100"),n.scores.forEach((s,i)=>{typeof s.score=="number"&&(s.score<0||s.score>100)&&t.push(`scores[${i}].score must be between 0 and 100`)}),typeof n.description=="string"&&n.description.length>100&&t.push("description must be 100 characters or less"),typeof n.description=="string"&&n.description.trim()===""&&t.push("description must not be empty"),typeof n.feedback=="string"&&n.feedback.trim()===""&&t.push("feedback must not be empty"),n.complete===void 0&&(n.complete=!1),!n.complete&&!n.targetPrinciple&&console.warn("targetPrinciple missing when not complete - using first low-scoring principle"),n.targetPrinciple!==void 0&&typeof n.targetPrinciple!="string"&&t.push("targetPrinciple must be a string"),n.complete!==void 0&&typeof n.complete!="boolean"&&t.push("complete must be a boolean"),e&&e.principles){const s=e.principles.map(i=>i.id);n.scores.forEach((i,o)=>{i.principle&&!s.includes(i.principle)&&console.warn(`scores[${o}].principle "${i.principle}" not in methodology`)}),n.targetPrinciple&&!s.includes(n.targetPrinciple)&&console.warn(`targetPrinciple "${n.targetPrinciple}" not in methodology`)}return{valid:t.length===0,errors:t}}let N=null,Y=null;class rt{constructor(e,t,s){this.provider=Le(e,t,s),this.methodology=null,this.systemPrompt=null}async loadMethodology(){if(this.methodology)return this.methodology;if(!N)try{N=(await me(()=>import("./principles-Nr9ahyFn.js"),[])).default}catch(e){throw console.error("Failed to load principles.json:",e),new Error("Coaching methodology not configured")}if(!N||!N.principles)throw new Error("Coaching methodology not configured");return this.methodology=N,this.methodology}async buildSystemPrompt(){if(this.systemPrompt)return this.systemPrompt;const e=await this.loadMethodology();if(!Y)try{Y=(await me(()=>import("./system-prompt-Dr6qRAWU.js"),[])).default}catch(s){throw console.error("Failed to load system-prompt.md:",s),new Error("Coaching methodology not configured")}const t=e.principles.map((s,i)=>`${i+1}. **${s.name}** (weight: ${s.weight}): ${s.description}`).join(`
`);return this.systemPrompt=Y.replace("{{PRINCIPLES}}",t),this.systemPrompt}async evaluate(e,t=[]){const s=await this.buildSystemPrompt(),i=performance.now();await xe(this.provider.getProviderName(),this.provider.getModelName(),e.length);let o="";try{let r=e;t.length>0&&(r=`${e}

[SKIPPED_PRINCIPLES: ${t.join(", ")}]`);for await(const d of this.provider.streamCompletion(r,{maxTokens:1024,temperature:.3,systemPrompt:s}))d.content&&(o+=d.content);const a=Math.round(performance.now()-i),l=this.parseResponse(o),c=ot(l,this.methodology);if(!c.valid)throw new Error(`Invalid response: ${c.errors.join(", ")}`);return await Ee(this.provider.getProviderName(),this.provider.getModelName(),o.length,null,a),l}catch(r){const a=Math.round(performance.now()-i);throw await W(this.provider.getProviderName(),this.provider.getModelName(),r.message||"Unknown error",a),r}}async evaluateWithRetry(e,t=[]){try{return await this.evaluate(e,t)}catch(s){if(s instanceof y)throw s;console.warn("Coach: First attempt failed, retrying...",s.message);const i=`${e}

IMPORTANT: Please respond with valid JSON only, matching the exact schema specified.`;try{return await this.evaluate(i,t)}catch(o){throw console.error("Coach: Retry also failed",o.message),new Error("Coach couldn't evaluate. Try again.")}}}parseResponse(e){let t=e.trim();const s=t.match(/```(?:json)?\s*([\s\S]*?)```/);s&&(t=s[1].trim());const i=t.match(/\{[\s\S]*\}/);i&&(t=i[0]);try{return JSON.parse(t)}catch(o){throw new Error(`Failed to parse JSON response: ${o.message}`)}}getProviderName(){return this.provider.getProviderName()}getModelName(){return this.provider.getModelName()}}const at=[{combo:"ctrl+enter",action:"test",enabled:!0},{combo:"ctrl+shift+enter",action:"coach",enabled:!0},{combo:"ctrl+z",action:"undo",enabled:!0},{combo:"ctrl+y",action:"redo",enabled:!0}];class lt{constructor(e=at){this.shortcuts=new Map,e.forEach(t=>{t.enabled&&this.shortcuts.set(t.combo.toLowerCase(),t.action)}),this.enabled=!0,this.actionDispatcher=null,this.isActiveCheck=null,this.boundHandler=null}init(e,t){this.actionDispatcher=e,this.isActiveCheck=t,this.boundHandler=this.handleKeyDown.bind(this),document.addEventListener("keydown",this.boundHandler)}handleKeyDown(e){if(!this.enabled||!this.isActiveCheck||!this.isActiveCheck())return;const t=this.buildCombo(e),s=this.shortcuts.get(t);s&&(e.preventDefault(),e.stopPropagation(),this.actionDispatcher&&this.actionDispatcher(s))}buildCombo(e){const t=[];(e.ctrlKey||e.metaKey)&&t.push("ctrl"),e.shiftKey&&t.push("shift"),e.altKey&&t.push("alt");let s=e.key.toLowerCase();return s===" "&&(s="space"),s==="escape"&&(s="esc"),t.push(s),t.join("+")}setEnabled(e){this.enabled=e}addShortcut(e,t){this.shortcuts.set(e.toLowerCase(),t)}removeShortcut(e){this.shortcuts.delete(e.toLowerCase())}getShortcuts(){return Array.from(this.shortcuts.entries()).map(([e,t])=>({combo:e,action:t}))}destroy(){this.boundHandler&&(document.removeEventListener("keydown",this.boundHandler),this.boundHandler=null),this.actionDispatcher=null,this.isActiveCheck=null}}const ge="promptHistory",fe="prompt_history";class ct{constructor(e=50){this.maxSize=e,this.entries=[],this.position=-1,this.debounceTimer=null,this.loaded=!1}async load(){try{const e=await we(ge,fe);e&&(this.entries=e.entries||[],this.position=e.position??-1,this.maxSize=e.maxSize||this.maxSize),this.loaded=!0}catch(e){console.warn("Failed to load prompt history:",e),this.loaded=!0}}push(e){var t;this.position>=0&&((t=this.entries[this.position])==null?void 0:t.text)===e||(this.entries=this.entries.slice(0,this.position+1),this.entries.push({text:e,timestamp:Date.now()}),this.entries.length>this.maxSize&&this.entries.shift(),this.position=this.entries.length-1,this.persist())}pushDebounced(e,t=500){this.debounceTimer&&clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.push(e),this.debounceTimer=null},t)}cancelDebounce(){this.debounceTimer&&(clearTimeout(this.debounceTimer),this.debounceTimer=null)}undo(){return this.canUndo()?(this.position--,this.persist(),this.entries[this.position].text):null}redo(){return this.canRedo()?(this.position++,this.persist(),this.entries[this.position].text):null}canUndo(){return this.position>0}canRedo(){return this.position<this.entries.length-1}getCurrent(){return this.position<0||this.position>=this.entries.length?null:this.entries[this.position].text}get length(){return this.entries.length}async persist(){try{await _(ge,{id:fe,entries:this.entries,position:this.position,maxSize:this.maxSize})}catch(e){console.warn("Failed to persist prompt history:",e)}}async clear(){this.entries=[],this.position=-1,this.cancelDebounce(),await this.persist()}}class dt{constructor(){this.element=null,this.textarea=null,this.preview=null,this.isPreviewMode=!1,this.promptText="",this.initialized=!1,this.isTestRunning=!1,this.isCoachRunning=!1,this.onSwitchToResults=null,this.resultsTab=null,this.feedbackPanel=null,this.onShowFeedback=null,this.keyboardHandler=null,this.promptHistory=new ct(50)}render(){if(this.element)return this.element;this.element=document.createElement("div"),this.element.className="prompt-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","prompt-panel"),this.element.style.cssText=`
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
    `,this.textarea.addEventListener("input",s=>{this.promptText=s.target.value,j(this.promptText),this.promptHistory.pushDebounced(this.promptText,1e3)}),t.appendChild(this.textarea),this.preview=document.createElement("div"),this.preview.className="prompt-preview",this.preview.style.cssText=`
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
    `,this.editBtn=document.createElement("button"),this.editBtn.textContent="Edit",this.editBtn.style.cssText=`
      padding: var(--pc-space-2) var(--pc-space-3);
      border: none;
      background: var(--pc-primary);
      color: var(--pc-on-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 36px;
    `,this.editBtn.addEventListener("click",()=>this.setMode(!1)),this.previewBtn=document.createElement("button"),this.previewBtn.textContent="Preview",this.previewBtn.style.cssText=`
      padding: var(--pc-space-2) var(--pc-space-3);
      border: none;
      background: transparent;
      color: var(--pc-on-surface);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 36px;
    `,this.previewBtn.addEventListener("click",()=>this.setMode(!0)),this.toggleContainer.appendChild(this.editBtn),this.toggleContainer.appendChild(this.previewBtn),e.appendChild(this.toggleContainer);const t=document.createElement("div");t.style.flex="1",e.appendChild(t);const s=document.createElement("button");return s.className="btn btn-text",s.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z"/>
      </svg>
      Copy
    `,s.addEventListener("click",()=>this.copyPrompt()),e.appendChild(s),this.testBtn=document.createElement("button"),this.testBtn.className="btn btn-text",this.testBtn.title="Test prompt (Ctrl+Enter)",this.testBtn.innerHTML=`
      <span class="btn-text-icon-wrapper" style="position: relative; display: inline-flex;">
        <svg class="btn-text-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.23 20.23L8 22l10-10L8 2 6.23 3.77 14.46 12z"/>
        </svg>
      </span>
      Test
    `,this.testBtn.addEventListener("click",()=>this.runTest()),e.appendChild(this.testBtn),this.coachBtn=document.createElement("button"),this.coachBtn.className="btn btn-text",this.coachBtn.title="Get coaching feedback (Ctrl+Shift+Enter)",this.coachBtn.innerHTML=`
      <span class="btn-text-icon-wrapper" style="position: relative; display: inline-flex;">
        <svg class="btn-text-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>
        </svg>
      </span>
      Help
    `,this.coachBtn.addEventListener("click",()=>this.runCoach()),e.appendChild(this.coachBtn),e}setMode(e){this.isPreviewMode!==e&&(this.isPreviewMode=e,this.isPreviewMode?(this.textarea.style.display="none",this.preview.style.display="block",this.preview.innerHTML=ee(this.promptText)||'<p style="color: var(--pc-on-surface-variant);">Nothing to preview</p>',this.applyMarkdownStyles(this.preview),this.editBtn.style.background="transparent",this.editBtn.style.color="var(--pc-on-surface)",this.previewBtn.style.background="var(--pc-primary)",this.previewBtn.style.color="var(--pc-on-primary)"):(this.textarea.style.display="block",this.preview.style.display="none",this.textarea.focus(),this.editBtn.style.background="var(--pc-primary)",this.editBtn.style.color="var(--pc-on-primary)",this.previewBtn.style.background="transparent",this.previewBtn.style.color="var(--pc-on-surface)"))}async copyPrompt(){if(!this.promptText.trim()){g("Nothing to copy");return}try{await navigator.clipboard.writeText(this.promptText),g("Copied to clipboard")}catch{g("Failed to copy")}}async loadPrompt(){try{const e=await w();this.promptText=e.promptText||"",this.textarea&&(this.textarea.value=this.promptText),await this.promptHistory.load(),this.promptText&&this.promptHistory.push(this.promptText),this.initKeyboardHandler()}catch(e){console.error("Failed to load prompt:",e)}}initKeyboardHandler(){this.keyboardHandler||(this.keyboardHandler=new lt,this.keyboardHandler.init(e=>this.handleKeyboardAction(e),()=>this.isKeyboardActive()))}isKeyboardActive(){return this.element&&this.element.offsetParent!==null&&!this.isPreviewMode}handleKeyboardAction(e){switch(e){case"test":this.runTest();break;case"coach":this.runCoach();break;case"undo":this.handleUndo();break;case"redo":this.handleRedo();break;default:console.warn("Unknown keyboard action:",e)}}handleUndo(){const e=this.promptHistory.undo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),j(e),g("Undo"))}handleRedo(){const e=this.promptHistory.redo();e!==null&&(this.promptText=e,this.textarea&&(this.textarea.value=e),j(e),g("Redo"))}async runTest(){var d,p,u;if(this.isTestRunning){g("Test already in progress");return}const e=this.promptText.trim();if(!e){g("Please enter a prompt first");return}if(!X()){g("Please configure an API key in Settings");return}const t=M(),s=t.testProvider||"openai",i=t.apiKeys[s],o=t.testModel||null;if(!i){g(`No API key configured for ${s}`);return}let r;try{r=Le(s,i,o)}catch(h){g(h.message||"Failed to create provider");return}this.isTestRunning=!0,this.testBtn.disabled=!0,this.setButtonLoading(this.testBtn,!0);const a=_e({promptSnapshot:e,provider:r.getProviderName(),model:r.getModelName(),status:"streaming"});this.onSwitchToResults&&this.onSwitchToResults();const l=(d=this.resultsTab)==null?void 0:d.addResult(a);await ze(a);const c=performance.now();await xe(r.getProviderName(),r.getModelName(),e.length);try{for await(const h of r.streamCompletion(e))if(h.content&&(l==null||l.appendChunk(h.content)),h.done&&h.usage){const f=Math.round(performance.now()-c);l==null||l.complete(h.usage,f),await re(a.id,{responseText:(l==null?void 0:l.getResult().responseText)||"",tokens:h.usage,durationMs:f,status:"complete"}),await Ee(r.getProviderName(),r.getModelName(),((p=l==null?void 0:l.getResult().responseText)==null?void 0:p.length)||0,h.usage,f),(u=this.resultsTab)==null||u.updateSessionStats()}}catch(h){const f=Math.round(performance.now()-c),m=h instanceof y?h.userMessage:h.message||"Unknown error";l==null||l.setError(m,f),await re(a.id,{responseText:(l==null?void 0:l.getResult().responseText)||"",error:m,durationMs:f,status:"error"}),await W(r.getProviderName(),r.getModelName(),m,f),g(m)}finally{this.isTestRunning=!1,this.testBtn.disabled=!1,this.setButtonLoading(this.testBtn,!1)}}setOnSwitchToResults(e){this.onSwitchToResults=e}setResultsTab(e){this.resultsTab=e}setOnShowFeedback(e){this.onShowFeedback=e}async runCoach(){if(this.isCoachRunning){g("Coach evaluation in progress");return}const e=this.promptText.trim();if(!e){g("Please enter a prompt first");return}if(!X()){g("Please configure an API key in Settings");return}const t=M(),s=t.coachProvider||"openai",i=t.apiKeys[s],o=t.coachModel||null;if(!i){g(`No API key configured for ${s}`);return}this.isCoachRunning=!0,this.coachBtn.disabled=!0,this.setButtonLoading(this.coachBtn,!0);const r=performance.now();try{const a=new rt(s,i,o),l=Z.get(),c=await a.evaluateWithRetry(e,l),d=Math.round(performance.now()-r),p=Fe({promptSnapshot:e,scores:c.scores,overall:c.overall,description:c.description,feedback:c.feedback,provider:a.getProviderName(),model:a.getModelName(),durationMs:d,targetPrinciple:c.targetPrinciple,complete:c.complete});await Ke(p),this.onShowFeedback&&this.onShowFeedback(p),console.log("Coach: Evaluation complete",p)}catch(a){const l=a.message||"Coach evaluation failed";g(l),console.error("Coach: Error",a),await W(t.coachProvider||"openai",t.coachModel||"unknown",l,Math.round(performance.now()-r))}finally{this.isCoachRunning=!1,this.coachBtn.disabled=!1,this.setButtonLoading(this.coachBtn,!1)}}setButtonLoading(e,t){if(!document.getElementById("btn-spinner-styles")){const o=document.createElement("style");o.id="btn-spinner-styles",o.textContent=`
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
      `}),e.querySelectorAll("li").forEach(r=>{r.style.cssText="margin: 0.2em 0;"}),e.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(r=>{r.style.marginTop="1em",r.style.marginBottom="0.4em"})}}class ve{constructor(e){this.entry=e,this.element=null,this.isExpanded=!1}render(){this.element=document.createElement("div"),this.element.className="feedback-balloon",this.element.style.cssText=`
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
    `,a.textContent=this.entry.description,s.appendChild(a),t.appendChild(s);const l=document.createElement("span");l.style.cssText=`
      font-size: 0.75rem;
      color: var(--pc-on-surface-variant);
      flex-shrink: 0;
    `,l.textContent=this.formatTimestamp(this.entry.timestamp),t.appendChild(l),this.element.appendChild(t);const c=document.createElement("div");if(c.style.cssText=`
      color: var(--pc-on-surface);
      line-height: 1.5;
      font-size: 0.9rem;
      ${this.isExpanded?"":"display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"}
    `,c.textContent=this.entry.feedback,this.element.appendChild(c),this.entry.feedback.length>200){const d=document.createElement("button");d.style.cssText=`
        background: none;
        border: none;
        color: var(--pc-primary);
        font-size: 0.8rem;
        cursor: pointer;
        padding: var(--pc-space-1) 0;
        margin-top: var(--pc-space-1);
      `,d.textContent=this.isExpanded?"Show less":"Show more",d.addEventListener("click",()=>{this.isExpanded=!this.isExpanded,c.style.cssText=`
          color: var(--pc-on-surface);
          line-height: 1.5;
          font-size: 0.9rem;
          ${this.isExpanded?"":"display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"}
        `,d.textContent=this.isExpanded?"Show less":"Show more"}),this.element.appendChild(d)}if(this.entry.scores&&this.entry.scores.length>0){const d=document.createElement("details");d.style.cssText="margin-top: var(--pc-space-2);";const p=document.createElement("summary");p.style.cssText=`
        cursor: pointer;
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        display: flex;
        align-items: center;
        gap: var(--pc-space-1);
        list-style: none;
      `,p.innerHTML=`
        <span class="toggle-icon" style="display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </span>
        Principle scores
      `,d.appendChild(p),d.addEventListener("toggle",()=>{const h=p.querySelector(".toggle-icon");h&&(h.innerHTML=d.open?'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>')});const u=document.createElement("div");u.style.cssText=`
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
        `,f.innerHTML=`<span style="text-transform: capitalize;">${h.principle}</span>: <strong>${h.score}</strong>`,u.appendChild(f)}),d.appendChild(u),this.element.appendChild(d)}if(this.entry.promptSnapshot){const d=document.createElement("details");d.style.cssText="margin-top: var(--pc-space-2);";const p=document.createElement("summary");p.style.cssText=`
        cursor: pointer;
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        display: flex;
        align-items: center;
        gap: var(--pc-space-1);
        list-style: none;
      `,p.innerHTML=`
        <span class="toggle-icon" style="display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </span>
        Original prompt
      `,d.appendChild(p),d.addEventListener("toggle",()=>{const h=p.querySelector(".toggle-icon");h&&(h.innerHTML=d.open?'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>')});const u=document.createElement("div");u.style.cssText=`
        margin-top: var(--pc-space-1);
        padding: var(--pc-space-2);
        background: var(--pc-surface);
        border-radius: var(--pc-radius-sm);
        font-size: 0.8rem;
        color: var(--pc-on-surface-variant);
        white-space: pre-wrap;
        max-height: 100px;
        overflow-y: auto;
      `,u.textContent=this.entry.promptSnapshot,d.appendChild(u),this.element.appendChild(d)}return this.element}formatTimestamp(e){const t=new Date(e),i=new Date-t,o=Math.floor(i/6e4),r=Math.floor(i/36e5);return o<1?"Just now":o<60?`${o}m ago`:r<24?`${r}h ago`:t.toLocaleDateString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}}class pt extends HTMLElement{constructor(){super(),this._expanded=!1,this._promptText=""}static get observedAttributes(){return["expanded"]}connectedCallback(){this.render()}attributeChangedCallback(e,t,s){e==="expanded"&&(this._expanded=s==="true",this.render())}set promptText(e){this._promptText=e,this.render()}get promptText(){return this._promptText}get expanded(){return this._expanded}set expanded(e){this._expanded=e,this.render()}toggle(){this._expanded=!this._expanded,this.render()}render(){const s=this._expanded?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';this.innerHTML=`
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
    `;const i=this.querySelector(".balloon-header");i&&i.addEventListener("click",()=>this.toggle())}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}}customElements.define("prompt-change-balloon",pt);class ht{constructor(){this.element=null,this.listContainer=null,this.emptyState=null,this.balloons=new Map}render(){return this.element?(this.loadFeedback(),this.element):(this.element=document.createElement("div"),this.element.className="feedback-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","feedback-panel"),this.element.style.cssText=`
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
    `,this.element.appendChild(this.emptyState),this.loadFeedback(),this.element)}async loadFeedback(){const e=await qe();if(this.listContainer.innerHTML="",this.balloons.clear(),e.length===0)this.emptyState.style.display="flex",this.listContainer.style.display="none";else{this.emptyState.style.display="none",this.listContainer.style.display="block";const t=[...e].reverse();let s=null;t.forEach(i=>{if(s!==null&&s!==i.promptSnapshot){const r=this.createPromptChangeBalloon(i.promptSnapshot);this.listContainer.appendChild(r)}const o=new ve(i);this.balloons.set(i.id,o),this.listContainer.appendChild(o.render()),s=i.promptSnapshot})}}createPromptChangeBalloon(e){const t=document.createElement("prompt-change-balloon");return t.promptText=e,t}addEntry(e){if(this.balloons.has(e.id))return;this.emptyState.style.display="none",this.listContainer.style.display="block";const t=new ve(e);this.balloons.set(e.id,t),this.listContainer.insertBefore(t.render(),this.listContainer.firstChild)}}class ut{constructor(){this.element=null}render(){if(this.element)return this.element;this.element=document.createElement("div"),this.element.className="attachments-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","attachments-panel"),this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--pc-space-4);
    `;const e=document.createElement("div");return e.className="empty-state",e.style.cssText="flex: 1;",e.innerHTML=`
      <div class="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </div>
      <div class="empty-state-title">No attachments</div>
      <div class="empty-state-description">
        Drag files here or tap to add.
      </div>
    `,this.element.appendChild(e),this.element}}class ye{constructor(e,t={}){this.result=e,this.expanded=t.expanded!==!1,this.onToggle=t.onToggle||null,this.element=null,this.contentEl=null,this.responseEl=null,this.statsEl=null,this.pendingText="",this.rafId=null}render(){this.element=document.createElement("div"),this.element.className="result-balloon",this.element.dataset.resultId=this.result.id,this.element.style.cssText=`
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
    `,t==="streaming"?(e.innerHTML="● Streaming",e.style.backgroundColor="var(--pc-primary-container)",e.style.color="var(--pc-on-primary-container)"):t==="error"||s?(e.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 2px;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> Error',e.style.backgroundColor="var(--pc-error-container)",e.style.color="var(--pc-on-error-container)"):(e.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 2px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Complete',e.style.backgroundColor="var(--pc-surface-variant)",e.style.color="var(--pc-on-surface-variant)")}updateResponse(){if(!this.responseEl)return;const{responseText:e,status:t,error:s}=this.result;s?this.responseEl.innerHTML=`<p style="color: var(--pc-error);">${s}</p>`:t==="streaming"&&!e?this.responseEl.innerHTML=this.createSpinner():e?(this.responseEl.innerHTML=ee(e)||'<p style="color: var(--pc-on-surface-variant);">Empty response</p>',this.applyMarkdownStyles()):this.responseEl.innerHTML='<p style="color: var(--pc-on-surface-variant);">Empty response</p>'}applyMarkdownStyles(){this.responseEl.querySelectorAll("p").forEach(o=>{o.style.cssText="margin: 0 0 0.75em 0;"}),this.responseEl.querySelectorAll("ul, ol").forEach(o=>{o.style.cssText=`
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
    `}appendChunk(e){this.pendingText+=e,this.rafId||(this.rafId=requestAnimationFrame(()=>{this.result.responseText=this.pendingText,this.responseEl&&(this.responseEl.innerHTML=ee(this.pendingText)||this.pendingText,this.applyMarkdownStyles()),this.rafId=null}))}complete(e,t){var i;this.result.status="complete",this.result.tokens=e||this.result.tokens,this.result.durationMs=t||this.result.durationMs,this.result.responseText=this.pendingText||this.result.responseText,this.updateResponse(),this.updateStats();const s=(i=this.element)==null?void 0:i.querySelector(".result-status");s&&this.updateStatusBadge(s)}setError(e,t){var i;this.result.status="error",this.result.error=e,this.result.durationMs=t||this.result.durationMs,this.pendingText&&(this.result.responseText=this.pendingText),this.updateResponse();const s=(i=this.element)==null?void 0:i.querySelector(".result-status");s&&this.updateStatusBadge(s)}toggle(){var t;this.expanded=!this.expanded,this.contentEl&&(this.contentEl.style.display=this.expanded?"block":"none");const e=(t=this.element)==null?void 0:t.querySelector(".chevron");e&&(e.innerHTML=this.expanded?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>'),this.onToggle&&this.onToggle(this.result.id,this.expanded)}expand(){this.expanded||this.toggle()}collapse(){this.expanded&&this.toggle()}async copyResponse(){const e=this.result.responseText;if(!e){g("Nothing to copy");return}try{await navigator.clipboard.writeText(e),g("Copied to clipboard")}catch{g("Failed to copy")}}formatTime(e){return new Date(e).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}getResult(){return this.result}}class mt{constructor(){this.element=null,this.headerEl=null,this.contentEl=null,this.emptyStateEl=null,this.balloons=new Map}render(){return this.element?this.element:(this.element=document.createElement("div"),this.element.className="results-tab",this.element.setAttribute("role","tabpanel"),this.element.setAttribute("id","results-panel"),this.element.style.cssText=`
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
    `,this.statsEl.textContent="Total: 0 tokens",e.appendChild(this.statsEl);const t=document.createElement("div");t.style.flex="1",e.appendChild(t);const s=document.createElement("button");s.className="btn btn-text",s.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5zM10 9h1v8h-1zm3 0h1v8h-1z"/>
      </svg>
      Clear All
    `,s.addEventListener("click",()=>this.handleClear()),e.appendChild(s);const i=document.createElement("button");return i.className="btn btn-text",i.innerHTML=`
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4l-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z"/>
      </svg>
      Download
    `,i.addEventListener("click",()=>this.handleDownload()),e.appendChild(i),e}async loadResults(){const e=await oe();if(e.length===0){this.showEmptyState();return}this.hideEmptyState(),this.balloons.clear(),this.contentEl.innerHTML="",this.contentEl.appendChild(this.emptyStateEl),this.emptyStateEl.style.display="none",[...e].reverse().forEach((s,i)=>{const o=new ye(s,{expanded:i===0,onToggle:(r,a)=>this.handleBalloonToggle(r,a)});this.balloons.set(s.id,o),this.contentEl.insertBefore(o.render(),this.emptyStateEl)}),this.updateSessionStats()}addResult(e){if(this.balloons.has(e.id))return this.balloons.get(e.id);this.hideEmptyState(),this.balloons.forEach(s=>s.collapse());const t=new ye(e,{expanded:!0,onToggle:(s,i)=>this.handleBalloonToggle(s,i)});return this.balloons.set(e.id,t),this.contentEl.insertBefore(t.render(),this.contentEl.firstChild),this.updateSessionStats(),t}getBalloon(e){return this.balloons.get(e)}handleBalloonToggle(e,t){}async handleClear(){this.balloons.size===0||!confirm("Clear all results? This cannot be undone.")||(await $e(),this.balloons.clear(),this.contentEl.innerHTML="",this.contentEl.appendChild(this.emptyStateEl),this.showEmptyState(),this.updateSessionStats(),g("Results cleared"))}async handleDownload(){const e=await oe();if(e.length===0){g("No results to download");return}const t=this.generateMarkdown(e),s=new Blob([t],{type:"text/markdown"}),i=URL.createObjectURL(s),o=document.createElement("a");o.href=i,o.download=`prompt-coach-results-${new Date().toISOString().split("T")[0]}.md`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),g("Results downloaded")}generateMarkdown(e){let t=`# Prompt Coach - Test Results

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

`}),t}async updateSessionStats(){const t=(await w()).totalTokens||0,s=this.balloons.size;this.statsEl&&(this.statsEl.textContent=`${s} result${s!==1?"s":""} • ${t.toLocaleString()} tokens`)}showEmptyState(){this.emptyStateEl&&(this.emptyStateEl.style.display="flex")}hideEmptyState(){this.emptyStateEl&&(this.emptyStateEl.style.display="none")}}class gt{constructor(){this.element=null,this.contentArea=null,this.currentTab=F().currentTab||"prompt",this.tabs={},this.menuPanel=null,this.feedbackPanel=null,this.ribbon=null}render(){this.element=document.createElement("div"),this.element.className="app-shell",this.element.style.cssText=`
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
    `,this.ribbon=new Ge({onMenuClick:()=>this.toggleMenu(),onScoreClick:()=>this.switchTab("feedback")}),this.element.appendChild(this.ribbon.render()),this.contentArea=document.createElement("main"),this.contentArea.className="app-content",this.contentArea.style.cssText=`
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    `,this.element.appendChild(this.contentArea),this.tabBar=new We({currentTab:this.currentTab,onTabChange:t=>this.switchTab(t)}),this.element.appendChild(this.tabBar.render()),this.menuPanel=new tt({onClose:()=>this.closeMenu()}),this.element.appendChild(this.menuPanel.render()),this.feedbackPanel=new st({onClose:()=>{},onPin:t=>this.handleFeedbackPinChange(t),onSkipContinue:()=>this.handleSkipContinue()});const e=this.feedbackPanel.render();return this.element.appendChild(this.feedbackPanel.getBackdrop()),this.element.appendChild(e),this.initTabs(),this.showTab(this.currentTab),this.element}initTabs(){this.tabs={prompt:new dt,feedback:new ht,attachments:new ut,results:new mt},this.tabs.prompt.setResultsTab(this.tabs.results),this.tabs.prompt.setOnSwitchToResults(()=>this.switchTab("results")),this.tabs.prompt.setOnShowFeedback(e=>this.showFeedback(e))}switchTab(e){this.currentTab=e,D("currentTab",e),this.showTab(e),this.tabBar&&this.tabBar.setActiveTab(e)}showTab(e){this.contentArea.innerHTML="";const t=this.tabs[e];t&&this.contentArea.appendChild(t.render())}toggleMenu(){this.menuPanel&&this.menuPanel.toggle()}closeMenu(){this.menuPanel&&this.menuPanel.hide()}showFeedback(e){this.feedbackPanel&&this.feedbackPanel.show(e),this.ribbon&&e.overall!==void 0&&this.ribbon.updateScore(e.overall,e.description)}handleFeedbackPinChange(e){if(e){const t=this.feedbackPanel.element;t&&this.contentArea&&this.element.insertBefore(t,this.contentArea)}else{const t=this.feedbackPanel.element;t&&this.element.appendChild(t)}}handleSkipContinue(){this.tabs.prompt&&this.tabs.prompt.runCoach()}}class ft{constructor(e={}){this.onDismiss=e.onDismiss||null,this.element=null}render(){this.element=document.createElement("div"),this.element.className="first-run-overlay",this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.setAttribute("aria-labelledby","first-run-title");const e=document.createElement("h1");e.id="first-run-title",e.className="first-run-title",e.textContent="Welcome to Prompt Coach";const t=document.createElement("p");t.className="first-run-description",t.textContent="Improve your prompting skills with AI-powered coaching. Get feedback on your prompts and learn best practices.";const s=document.createElement("button");return s.className="first-run-btn",s.textContent="Get Started",s.addEventListener("click",()=>this.dismiss()),this.element.appendChild(e),this.element.appendChild(t),this.element.appendChild(s),this.element}show(){this.element||this.render(),document.body.appendChild(this.element);const e=this.element.querySelector("button");e&&e.focus()}dismiss(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element),this.onDismiss&&this.onDismiss()}}class vt extends Me{constructor(){super({title:"Configure API Key"}),this.inputs={}}createContent(){const e=document.createElement("div"),t=document.createElement("p");t.className="text-body",t.style.cssText="color: var(--pc-on-surface-variant); margin-bottom: var(--pc-space-4);",t.textContent="API keys are stored locally on your device. You can add more providers later in Settings.",e.appendChild(t);const s=document.createElement("div");s.style.cssText="margin-bottom: var(--pc-space-4);";const i=document.createElement("label");i.className="text-label",i.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",i.textContent="Provider";const o=document.createElement("select");o.className="input",o.innerHTML=`
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
      <option value="google">Google</option>
      <option value="x">X (Grok)</option>
    `,this.providerSelect=o,s.appendChild(i),s.appendChild(o),e.appendChild(s);const r=document.createElement("div");r.style.cssText="margin-bottom: var(--pc-space-4);";const a=document.createElement("label");a.className="text-label",a.style.cssText="display: block; margin-bottom: var(--pc-space-2); color: var(--pc-on-surface-variant);",a.textContent="API Key";const l=document.createElement("input");return l.type="password",l.className="input",l.placeholder="Enter your API key",l.autocomplete="off",this.keyInput=l,r.appendChild(a),r.appendChild(l),e.appendChild(r),e}show(){this.render(),this.setContent(this.createContent()),this.addAction("Skip",()=>this.close(),"text"),this.addAction("Save",()=>this.save(),"filled"),super.show(),setTimeout(()=>{this.keyInput.focus()},100)}save(){const e=this.providerSelect.value,t=this.keyInput.value.trim();if(!t){g("Please enter an API key");return}Pe("apiKeys",{[e]:t}),g("API key saved"),this.close()}}function yt(){const n=document.getElementById("loader");if(!n)return;n.style.pointerEvents="none";const e=2e3,t=2e3,s=performance.now(),i=u=>u===1?1:1-Math.pow(2,-10*u),o=Math.random()*Math.PI*2,r=Math.random()*Math.PI*2,a=.25+Math.random()*.125,l=.1875+Math.random()*.125,c=60,d=48;function p(u){const h=u-s,f=Math.min(h/e,1),m=Math.min(h/t,1),C=h/2e3*Math.PI*2,B=50+Math.sin(C*a+o)*c*(1-m),K=50+Math.cos(C*l+r)*d*(1-m),E=1-m,S=20*(1-i(f));n.style.backdropFilter=`blur(${S}px)`,n.style.webkitBackdropFilter=`blur(${S}px)`,n.style.background=`radial-gradient(
      circle at ${B}% ${K}%,
      transparent 0%,
      rgba(28, 27, 31, ${E*.1}) 15%,
      rgba(28, 27, 31, ${E*.4}) 40%,
      rgba(28, 27, 31, ${E*.7}) 70%,
      rgba(28, 27, 31, ${E}) 100%
    )`,m<1?requestAnimationFrame(p):n.remove()}requestAnimationFrame(p)}async function be(){try{je(),await k(),await w();const n=F(),e=document.getElementById("app"),t=new gt;e.appendChild(t.render()),yt(),n.firstRunCompleted||new ft({onDismiss:()=>{D("firstRunCompleted",!0),X()||new vt().show()}}).show(),"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}catch(n){console.error("Failed to initialize app:",n),document.getElementById("app").innerHTML=`
      <div class="empty-state" style="height: 100vh;">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Something went wrong</div>
        <div class="empty-state-description">Please refresh the page to try again.</div>
      </div>
    `}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",be):be();
