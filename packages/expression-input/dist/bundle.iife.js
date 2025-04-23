!function(t){
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const i=1===t.length?t[0]:e.reduce(((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1]),t[0]);return new r(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */,{is:h,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:p,getOwnPropertySymbols:d,getPrototypeOf:u}=Object,f=globalThis,v=f.trustedTypes,g=v?v.emptyScript:"",b=f.reactiveElementPolyfillSupport,m=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!h(t,e),w={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=w){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??w}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...p(t),...d(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const i of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=s,this[s]=o.fromAttribute(e,t.type)??this._$Ej?.get(s)??null,this._$Em=null}}requestUpdate(t,e,i){if(void 0!==t){const s=this.constructor,o=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??y)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[m("elementProperties")]=new Map,$[m("finalized")]=new Map,b?.({ReactiveElement:$}),(f.reactiveElementVersions??=[]).push("2.1.0");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const k=globalThis,S=k.trustedTypes,_=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+C,j=`<${E}>`,T=document,O=()=>T.createComment(""),R=t=>null===t||"object"!=typeof t&&"function"!=typeof t,z=Array.isArray,M="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,U=/-->/g,P=/>/g,I=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,B=/"/g,F=/^(?:script|style|textarea|title)$/i,L=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),Z=new WeakMap,H=T.createTreeWalker(T,129);function V(t,e){if(!z(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==_?_.createHTML(e):e}let q=class t{constructor({strings:e,_$litType$:i},s){let o;this.parts=[];let r=0,n=0;const a=e.length-1,h=this.parts,[l,c]=((t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=N;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(n.lastIndex=c,h=n.exec(i),null!==h);)c=n.lastIndex,n===N?"!--"===h[1]?n=U:void 0!==h[1]?n=P:void 0!==h[2]?(F.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=I):void 0!==h[3]&&(n=I):n===I?">"===h[0]?(n=o??N,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?I:'"'===h[3]?B:D):n===B||n===D?n=I:n===U||n===P?n=N:(n=I,o=void 0);const p=n===I&&t[e+1].startsWith("/>")?" ":"";r+=n===N?i+j:l>=0?(s.push(a),i.slice(0,l)+A+i.slice(l)+C+p):i+C+(-2===l?e:p)}return[V(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]})(e,i);if(this.el=t.createElement(l,s),H.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=H.nextNode())&&h.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(A)){const e=c[n++],i=o.getAttribute(t).split(C),s=/([.?@])?(.*)/.exec(e);h.push({type:1,index:r,name:s[2],strings:i,ctor:"."===s[1]?X:"?"===s[1]?Y:"@"===s[1]?tt:Q}),o.removeAttribute(t)}else t.startsWith(C)&&(h.push({type:6,index:r}),o.removeAttribute(t));if(F.test(o.tagName)){const t=o.textContent.split(C),e=t.length-1;if(e>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],O()),H.nextNode(),h.push({type:2,index:++r});o.append(t[e],O())}}}else if(8===o.nodeType)if(o.data===E)h.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(C,t+1));)h.push({type:7,index:r}),t+=C.length-1}r++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}};function J(t,e,i=t,s){if(e===L)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=R(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=J(t,o._$AS(t,e.values),o,s)),e}let K=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??T).importNode(e,!0);H.currentNode=s;let o=H.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new G(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new et(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=H.nextNode(),r++)}return H.currentNode=T,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},G=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),R(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==L&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>z(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&R(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=q.createElement(V(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new K(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Z.get(t.strings);return void 0===e&&Z.set(t.strings,e=new q(t)),e}k(e){z(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,o=0;for(const r of e)o===i.length?i.push(s=new t(this.O(O()),this.O(O()),this,this.options)):s=i[o],s._$AI(r),o++;o<i.length&&(this._$AR(s&&s._$AB.nextSibling,o),i.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}},Q=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=J(this,t,e,0),r=!R(t)||t!==this._$AH&&t!==L,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=J(this,s[i+n],e,n),a===L&&(a=this._$AH[n]),r||=!R(a)||a!==this._$AH[n],a===W?t=W:t!==W&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},X=class extends Q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}},Y=class extends Q{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}},tt=class extends Q{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=J(this,t,e,0)??W)===L)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},et=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}};const it=k.litHtmlPolyfillSupport;it?.(q,G),(k.litHtmlVersions??=[]).push("3.3.0");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const st=globalThis,ot=st.trustedTypes,rt=ot?ot.createPolicy("lit-html",{createHTML:t=>t}):void 0,nt="$lit$",at=`lit$${Math.random().toFixed(9).slice(2)}$`,ht="?"+at,lt=`<${ht}>`,ct=document,pt=()=>ct.createComment(""),dt=t=>null===t||"object"!=typeof t&&"function"!=typeof t,ut=Array.isArray,ft="[ \t\n\f\r]",vt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gt=/-->/g,bt=/>/g,mt=RegExp(`>|${ft}(?:([^\\s"'>=/]+)(${ft}*=${ft}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),xt=/'/g,yt=/"/g,wt=/^(?:script|style|textarea|title)$/i,$t=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),kt=Symbol.for("lit-noChange"),St=Symbol.for("lit-nothing"),_t=new WeakMap,At=ct.createTreeWalker(ct,129);function Ct(t,e){if(!ut(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==rt?rt.createHTML(e):e}const Et=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=vt;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(n.lastIndex=c,h=n.exec(i),null!==h);)c=n.lastIndex,n===vt?"!--"===h[1]?n=gt:void 0!==h[1]?n=bt:void 0!==h[2]?(wt.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=mt):void 0!==h[3]&&(n=mt):n===mt?">"===h[0]?(n=o??vt,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?mt:'"'===h[3]?yt:xt):n===yt||n===xt?n=mt:n===gt||n===bt?n=vt:(n=mt,o=void 0);const p=n===mt&&t[e+1].startsWith("/>")?" ":"";r+=n===vt?i+lt:l>=0?(s.push(a),i.slice(0,l)+nt+i.slice(l)+at+p):i+at+(-2===l?e:p)}return[Ct(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class jt{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[h,l]=Et(t,e);if(this.el=jt.createElement(h,i),At.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=At.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(nt)){const e=l[r++],i=s.getAttribute(t).split(at),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?Mt:"?"===n[1]?Nt:"@"===n[1]?Ut:zt}),s.removeAttribute(t)}else t.startsWith(at)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(wt.test(s.tagName)){const t=s.textContent.split(at),e=t.length-1;if(e>0){s.textContent=ot?ot.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],pt()),At.nextNode(),a.push({type:2,index:++o});s.append(t[e],pt())}}}else if(8===s.nodeType)if(s.data===ht)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(at,t+1));)a.push({type:7,index:o}),t+=at.length-1}o++}}static createElement(t,e){const i=ct.createElement("template");return i.innerHTML=t,i}}function Tt(t,e,i=t,s){if(e===kt)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=dt(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=Tt(t,o._$AS(t,e.values),o,s)),e}class Ot{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??ct).importNode(e,!0);At.currentNode=s;let o=At.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new Rt(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new Pt(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=At.nextNode(),r++)}return At.currentNode=ct,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Rt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=St,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Tt(this,t,e),dt(t)?t===St||null==t||""===t?(this._$AH!==St&&this._$AR(),this._$AH=St):t!==this._$AH&&t!==kt&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>ut(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==St&&dt(this._$AH)?this._$AA.nextSibling.data=t:this.T(ct.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=jt.createElement(Ct(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Ot(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=_t.get(t.strings);return void 0===e&&_t.set(t.strings,e=new jt(t)),e}k(t){ut(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new Rt(this.O(pt()),this.O(pt()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class zt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=St,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=St}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=Tt(this,t,e,0),r=!dt(t)||t!==this._$AH&&t!==kt,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=Tt(this,s[i+n],e,n),a===kt&&(a=this._$AH[n]),r||=!dt(a)||a!==this._$AH[n],a===St?t=St:t!==St&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===St?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Mt extends zt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===St?void 0:t}}class Nt extends zt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==St)}}class Ut extends zt{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=Tt(this,t,e,0)??St)===kt)return;const i=this._$AH,s=t===St&&i!==St||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==St&&(i===St||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Pt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Tt(this,t)}}const It=st.litHtmlPolyfillSupport;It?.(jt,Rt),(st.litHtmlVersions??=[]).push("3.3.0");const Dt=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let Bt=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new Rt(e.insertBefore(pt(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return kt}};Bt._$litElement$=!0,Bt.finalized=!0,Dt.litElementHydrateSupport?.({LitElement:Bt});const Ft=Dt.litElementPolyfillSupport;Ft?.({LitElement:Bt}),(Dt.litElementVersions??=[]).push("4.2.0");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Lt=1;class Wt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
/**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const Zt=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends Wt{constructor(t){if(super(t),t.type!==Lt||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter((e=>t[e])).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return L}}),Ht=t=>(e,i)=>{void 0!==i?i.addInitializer((()=>{customElements.define(t,e)})):customElements.define(t,e)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */,Vt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},qt=(t=Vt,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t)}}throw Error("Unsupported decorator location: "+s)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function Jt(t){return(e,i)=>"object"==typeof i?qt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}const Kt=n`
  .header,
  ::part(header) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .fixed .hide-when-fixed,
  .show-when-fixed {
    visibility: hidden;
    position: absolute;
    top: -9999px;
    left: -9999px;
    display: none;
  }
  .fixed .show-when-fixed {
    visibility: visible;
    position: static;
    display: block;
  }
  label {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--input-chain-label-font-size, 1rem);
  }
  .dirty {
    color: var(--expression-input-dirty-color, red);
    cursor: pointer;
  }
  .fixed,
  ::part(fixed) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    overflow-x: auto;
    width: 100%;
  }
  .dirty-icon,
  ::part(dirty-icon) {
    display: inline-block;
    width: 1rem;
  }
  .property-container,
  ::part(property-container) {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    overflow-x: auto;
    padding: 10px;
    scrollbar-width: thin;
    scrollbar-color: var(--expression-input-active-color, #333)
      var(--expression-input-active-background-color, #eee);
  }
  .fixed-selector,
  ::part(fixed-selector) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--expression-input-dirty-border-color, #ccc);
    background-color: var(--expression-input-dirty-background-color, #ccc);
    border-radius: var(--expression-input-dirty-border-radius, 3px);
    padding: 3px;
  }
  ul[slot='tags'] {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* an arrow between elements */
  .steps-container__separator {
    display: inline;
  }
  .steps-container__separator::after {
    content: '▶';
    color: var(--expression-input-separator-color, #333);
    font-size: var(--expression-input-separator-font-size, 1.5em);
    margin: var(--expression-input-separator-margin, 0);
    padding: var(--expression-input-separator-padding, 0);
  }
  /* selector between fixed value (text input) and steps */
  .fixed-selector span {
    padding: 4px 4px 2px 4px;
    font-size: small;
  }
  .fixed-selector span:not(.active):hover {
    color: var(--expression-input-dirty-color, #0091ff);
  }
  .fixed-selector span:not(.active) {
    cursor: pointer;
  }
  .fixed-selector span:last-child {
    margin-left: 5px;
  }
  .fixed-selector span.active {
    border-radius: var(--expression-input-active-border-radius, 3px);
    background-color: var(--expression-input-active-background-color, #eee);
    color: var(--expression-input-active-color, #333);
    cursor: default;
  }
  ul.values-ul {
    list-style: none;
    padding: var(--expression-input-values-ul-padding, 0);
    margin: var(--expression-input-values-ul-margin, 0);
    color: var(--expression-input-values-ul-color, #000);
    background-color: var(
      --expression-input-values-ul-background-color,
      transparent
    );
  }
  li.values-li {
    padding: var(--expression-input-values-li-padding, 5px);
    margin: var(--expression-input-values-li-margin, 0);
    background-color: var(
      --expression-input-values-li-background-color,
      transparent
    );
    border-bottom: var(--expression-input-values-li-border, 1px solid #ccc);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
  }
  li.values-li:last-child {
    border-bottom: none;
  }
  li.values-li:hover {
    background-color: var(
      --expression-input-values-li-hover-background-color,
      #eee
    );
  }
  li.values-li.active {
    background-color: var(
      --expression-input-values-li-active-background-color,
      #ccc
    );
    font-weight: var(--expression-input-values-li-active-font-weight, bold);
  }
  li.values-li.values__title {
    /* Display this line as an array title */
    color: var(--expression-input-values-li-title-color, #333);
    background-color: var(--expression-input-values-li-background-color, #eee);
    text-transform: var(
      --expression-input-values-li-title-text-transform,
      uppercase
    );
    cursor: default;
  }
  li.values-li.values__title .values__name {
    margin: var(--expression-input-values-li-title-margin, auto);
  }
  li.values-li .values__icon {
    margin-right: var(--expression-input-values-li-icon-margin-right, 5px);
  }
  li.values-li .values__name {
    margin-right: var(--expression-input-values-li-name-margin-right, 25px);
  }
  li.values-li .values__type {
    color: var(--expression-input-values-li-type-color, #999);
    width: max-content;
  }
  .placeholder > * {
    color: var(--expression-input-placeholder-color, #999);
    font-style: var(--expression-input-placeholder-font-style, italic);
    margin: var(--expression-input-placeholder-margin, 10px 0);
  }
`;n`
  :host {
    display: inline-flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  :host header {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    border: solid 1px gray;
  }
  :host .value {
    display: flex;
    align-items: center;
  }
  :host .buttons {
    display: flex;
    align-items: center;
  }
  :host .button {
    border: none;
    background-color: transparent;
  }
  :host .svg-icon {
    border: var(--expression-input-item-button-border, none);
    cursor: pointer;
    margin: var(--expression-input-item-button-margin, 3px);
    padding: var(--expression-input-item-button-padding, 3px);
    border-radius: var(--expression-input-item-button-border-radius, 50%);
    width: var(--expression-input-item-button-width, 20px);
    height: var(--expression-input-item-button-height, 20px);
    background-color: var(
      --expression-input-item-button-background-color,
      transparent
    );
  }
  /* button svg path white and size 10px
  */
  :host .svg-icon svg path {
    fill: var(--expression-input-item-button-color, #333);
  }
  /*
  :host popin-form {
    position: absolute;
  }
  */
  slot[name='helpTitle'] {
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
  }
  slot[name='name'] {
    font-weight: bold;
    cursor: pointer;
  }
  ::slotted([slot='name']),
  ::slotted([slot='type']) {
    cursor: pointer;
    flex-shrink: 0;
  }
  ::slotted([slot='name']) {
    font-weight: var(--expression-input-item-name-font-weight, bold);
    font-size: var(--expression-input-item-name-font-size, 1rem);
    padding: var(--expression-input-item-name-padding, 5px);
  }
  ::slotted([slot='type']),
  ::slotted([slot='type']) {
    font-weight: var(--expression-input-item-type-font-weight, normal);
    font-size: var(--expression-input-item-type-font-size, 0.8rem);
    padding: var(--expression-input-item-type-padding, 5px);
  }
  .with-arrow::after {
    content: '▼';
    float: right;
    padding: var(--expression-input-item-arrow-padding, 5px);
  }
`;const Gt=n`
  :host {
    display: inline-block;
    position: fixed;
    max-width: 100vw;
    max-height: 80vh;
    box-sizing: border-box;
    z-index: 1000; /* Ensure it's on top of other content */
    border-radius: var(--popin-form-border-radius, 3px);
    overflow: hidden; /* To ensure border-radius applies to children elements */
    overflow-y: auto;
    outline: none;
    border: var(--popin-form-border, 1px solid #ccc);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: inline-flex;
    flex-direction: column;
    background-color: var(--popin-form-background, #fff);
    color: var(--popin-form-color, #000);
  }
  :host([hidden]) {
    display: none !important;
  }

  header {
    border-bottom: var(--popin-form-header-border-bottom, #f5f5f5);
    background-color: var(--popin-form-header-background, transparent);
    padding: var(--popin-form-header-padding, 0);
    color: var(--popin-form-header-color, #000);
  }

  footer {
    border-top: var(--popin-form-footer-border-top, 1px solid #f5f5f5);
    display: flex;
    justify-content: flex-end;
    background-color: var(--popin-form-footer-background, transparent);
    padding: var(--popin-form-footer-padding);
    color: var(--popin-form-footer-color, #000);
  }

  button {
    border: var(--popin-button-border, 1px solid #ccc);
    border-radius: var(--popin-button-border-radius, 3px);
    background-color: var(--popin-button-background, #f5f5f5);
    color: var(--popin-button-color, #000);
    padding: var(--popin-button-padding, 5px);
    margin: var(--popin-button-margin, 5px);
    cursor: pointer;
  }

  button:hover {
    background-color: var(--popin-button-hover-background, #eee);
    color: var(--popin-button-hover-color, #000);
    border: var(--popin-button-border, 1px solid #ccc);
    padding: var(--popin-button-hover-padding, 5px);
    margin: var(--popin-button-hover-margin, 5px);
  }

  button.secondary {
    background-color: var(--popin-button-background--secondary, transparent);
    color: var(--popin-button-color--secondary, #000);
    border: var(--popin-button-border--secondary, none);
    padding: var(--popin-button-padding--secondary, 5px);
    margin: var(--popin-button-margin--secondary, 5px);
  }

  button.secondary:hover {
    background-color: var(--popin-button-hover-background--secondary, #eee);
    color: var(--popin-button-hover-color--secondary, #000);
    border: var(--popin-button-hover-border--secondary, none);
    padding: var(--popin-button-hover-padding--secondary, 5px);
    margin: var(--popin-button-hover-margin--secondary, 5px);
  }

  main {
    background-color: var(--popin-form-body-background, transparent);
    padding: var(--popin-form-body-padding, 5px);
    color: var(--popin-form-body-color, #000);
    display: flex;
    flex-direction: column;
  }

  ::slotted([slot='header']) {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ::slotted([slot='body']) * {
    background: red !important;
  }
`;var Qt=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};t.InputChain=class extends Bt{get selectTagName(){return this._selectTagName}set selectTagName(t){this._selectTagName=t,this.SELECT_QUERY=`:scope > ${this._selectTagName}`,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`,this.requestUpdate()}get optionTagName(){return this._optionTagName}set optionTagName(t){this._optionTagName=t,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${t}, :scope > ${this._selectTagName} > optgroup > ${t}`,this.requestUpdate()}constructor(){super(),this.SELECT_QUERY=":scope > select, :scope > custom-select",this.OPTION_QUERY=":scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option",this.for="",this.name="",this.reactive=!1,this._selectTagName="select",this._optionTagName="option",this._form=null,this.onChange_=this.onChangeValue.bind(this),this.onFormdata=t=>{if(!this.name)throw new Error("Attribute name is required for input-chain");this.options.filter((t=>t.selected)).forEach((e=>{t.formData.append(this.name,e.value)}))},this.redrawing=!1}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata),t&&t.addEventListener("formdata",this.onFormdata)}get form(){return this._form}get options(){return Array.from(this.querySelectorAll(this.OPTION_QUERY))}render(){return $t` <slot></slot> `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("change",this.onChange_)}disconnectedCallback(){this.shadowRoot.removeEventListener("change",this.onChange_),this.form=null,super.disconnectedCallback()}onChangeValue(t){const e=t.target,i=Array.from(this.querySelectorAll(this.SELECT_QUERY));i.includes(e)&&(this.changeAt(i.indexOf(e)),t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),this.requestUpdate())}changeAt(t,e=!1){if(!this.redrawing){if(this.redrawing=!0,this.reactive){if(e){Array.from(this.querySelectorAll(":scope > select, :scope > custom-select"))[0].value=""}this.dispatchEvent(new CustomEvent("change",{detail:{idx:t}}))}else{const e=Array.from(this.querySelectorAll(":scope > select, :scope > custom-select")),i=t>=0?e[t]:e[0],s=(null==i?void 0:i.value)?e[t+1]:i||e[0],o=(null==i?void 0:i.value)?t+1:t;s&&(e.slice(o+1).forEach((t=>t.remove())),s.value=""),this.dispatchEvent(new Event("change"))}this.redrawing=!1}}},t.InputChain.styles=Kt,Qt([Jt({type:String,attribute:"for"})],t.InputChain.prototype,"for",void 0),Qt([Jt({type:String})],t.InputChain.prototype,"name",void 0),Qt([Jt({type:Boolean})],t.InputChain.prototype,"reactive",void 0),Qt([Jt({type:String,attribute:"select-tag-name"})],t.InputChain.prototype,"selectTagName",null),Qt([Jt({type:String,attribute:"option-tag-name"})],t.InputChain.prototype,"optionTagName",null),Qt([Jt({type:Array})],t.InputChain.prototype,"options",null),t.InputChain=Qt([Ht("input-chain")],t.InputChain);var Xt=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};t.ExpressionInput=class extends t.InputChain{constructor(){super(...arguments),this.allowFixed=!0,this._fixed=!1,this.placeholder="Enter a fixed value or switch to expression"}get dirty(){return this.value.length>0}get value(){var t;return this.fixed?[null===(t=this.getFixedInput())||void 0===t?void 0:t.value].filter((t=>!!t)):this.options.filter((t=>t.selected&&t.value)).map((t=>t.value))}get fixed(){return this._fixed}set fixed(t){this._fixed=t,this.dispatchEvent(new Event("fixedChange"))}connectedCallback(){super.connectedCallback()}render(){const t=this.dirty;return $t`
      <!-- header -->
      <header part="header" class="header">
        <label>
          <div
            class=${Zt({dirty:t,"property-name":!0})}
            part="property-name"
          >
            <slot name="label"></slot>
            ${t?$t`
                  <slot
                    name="dirty-icon"
                    part="dirty-icon"
                    class="dirty-icon"
                    @click=${this.reset}
                  >
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                      ></path>
                    </svg>
                  </slot>
                `:$t``}
          </div>
          ${this.allowFixed?$t`
                <div part="fixed-selector" class="fixed-selector">
                  <span
                    class=${Zt({active:this.fixed,"fixed-selector-fixed":!0})}
                    @click=${()=>this.fixed=!0}
                    part="fixed-selector-fixed"
                    >Fixed</span
                  >
                  <span
                    class=${Zt({active:!this.fixed,"fixed-selector-expression":!0})}
                    @click=${()=>this.fixed=!1}
                    part="fixed-selector-expression"
                    >Expression</span
                  >
                </div>
              `:$t``}
        </label>
      </header>
      <div
        part="property-container"
        class=${Zt({"property-container":!0,fixed:this.fixed})}
      >
        <slot class="hide-when-fixed"
          >${this.options.length?"":this.placeholder}</slot
        >
        <slot name="fixed" part="fixed" class="show-when-fixed"></slot>
      </div>
    `}reset(){if(this.fixed){const t=this.getFixedInput();if(!t)throw new Error("Input not found for fixed value");t.value=""}else this.changeAt(-1,!0);this.dispatchEvent(new Event("change")),this.requestUpdate()}getFixedInput(){return this.querySelector("input, textarea")}},Xt([Jt({type:Boolean,attribute:"allow-fixed"})],t.ExpressionInput.prototype,"allowFixed",void 0),Xt([Jt({type:Boolean,attribute:"fixed",reflect:!0})],t.ExpressionInput.prototype,"fixed",null),Xt([Jt()],t.ExpressionInput.prototype,"placeholder",void 0),t.ExpressionInput=Xt([Ht("expression-input")],t.ExpressionInput);var Yt=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let te=class extends Bt{constructor(){super(...arguments),this.hidden=!1,this.noAutoClose=!1,this.resized_=this.ensureElementInView.bind(this),this.blured_=this.blured.bind(this),this.keydown_=this.keydown.bind(this)}render(){return setTimeout((()=>this.ensureElementInView())),$t` <slot></slot> `}connectedCallback(){super.connectedCallback(),this.setAttribute("tabindex","0"),this.addEventListener("blur",this.blured_),this.addEventListener("keydown",this.keydown_),window.addEventListener("resize",this.resized_),window.addEventListener("blur",this.blured_)}disconnectedCallback(){window.removeEventListener("resize",this.resized_),window.removeEventListener("blur",this.blured_),this.removeEventListener("blur",this.blured_),this.removeEventListener("keydown",this.keydown_),super.disconnectedCallback()}getActiveElementRecursive(t=document.activeElement){return(null==t?void 0:t.shadowRoot)?this.getActiveElementRecursive(t.shadowRoot.activeElement):t}blured(){this.noAutoClose||setTimeout((()=>{let t=this.getActiveElementRecursive();for(;t&&t!==this;)t=t.parentNode||t.host;t!==this&&this.close()}))}close(){this.setAttribute("hidden",""),this.blur()}keydown(t){"Escape"===t.key&&this.close()}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i),"hidden"===t&&null===i&&(this.focus(),this.dispatchEvent(new CustomEvent("popin-opened"))),"hidden"===t&&null!==i&&this.dispatchEvent(new CustomEvent("popin-closed"))}ensureElementInView(){var t;const e=null===(t=this.parentElement)||void 0===t?void 0:t.getBoundingClientRect();this.style.left=`${null==e?void 0:e.left}px`,this.style.top=`${null==e?void 0:e.top}px`;const i=this.getBoundingClientRect(),s=window.innerWidth,o=window.innerHeight;i.left+i.width+0>s&&(this.style.left=s-i.width-0+"px"),i.left+0<0&&(this.style.left="0px"),i.top+i.height+0>o&&(this.style.top=o-i.height-0+"px"),i.top+0<0&&(this.style.top="0px")}};te.styles=Gt,Yt([Jt()],te.prototype,"hidden",void 0),Yt([Jt({type:Boolean,attribute:"no-auto-close"})],te.prototype,"noAutoClose",void 0),te=Yt([Ht("popin-overlay")],te);var ee=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};t.PopinForm=class extends te{constructor(){super(...arguments),this.for="",this.name="",this.formData=new FormData,this.onFormdata_=this.onFormdata.bind(this),this.slotChanged_=this.slotChanged.bind(this),this._form=null,this.inputs=[]}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata_),t&&t.addEventListener("formdata",this.onFormdata_)}get form(){return this._form}get value(){return this.updateFormData(),Object.fromEntries(this.formData.entries())}render(){return super.render(),$t`
      <form @submit=${this.submit} @change=${this.change}>
        <header>
          <slot class="header" name="header"></slot>
        </header>
        <main>
          <slot class="body" part="body"></slot>
        </main>
        <footer>
          <slot class="footer" name="footer">
            <button type="button" class="secondary" @click=${this.close}>
              Cancel
            </button>
            <button type="submit">Apply</button>
          </slot>
        </footer>
      </form>
    `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("slotchange",this.slotChanged_),this.slotChanged()}disconnectedCallback(){this.removeEventListener("slotchange",this.slotChanged_),this.form=null,super.disconnectedCallback()}slotChanged(){this.inputs=Array.from(this.querySelectorAll("input, select, textarea, [data-is-input]"))}onFormdata(t){t.preventDefault();const e=t.formData;for(const[t,i]of this.formData.entries())e.set(`${this.name}-${t}`,i)}updateFormData(){this.formData=new FormData;for(const t of this.inputs)this.formData.set(t.getAttribute("name"),t.value)}submit(t){t.preventDefault(),t.stopImmediatePropagation(),this.updateFormData(),this.close(),this.dispatchEvent(new Event("change"))}change(t){t.target.closest(this.tagName)===this&&(t.preventDefault(),t.stopImmediatePropagation())}},ee([Jt({type:String,attribute:"for"})],t.PopinForm.prototype,"for",void 0),ee([Jt({type:String})],t.PopinForm.prototype,"name",void 0),t.PopinForm=ee([Ht("popin-form")],t.PopinForm)}({});
//# sourceMappingURL=bundle.iife.js.map
