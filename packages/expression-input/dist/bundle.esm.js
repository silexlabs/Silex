/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,e=Symbol(),s=new WeakMap;let o=class{constructor(t,i,s){if(this._$cssResult$=!0,s!==e)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=i}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...i)=>{const s=1===t.length?t[0]:i.reduce(((i,e,s)=>i+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(e)+t[s+1]),t[0]);return new o(s,t,e)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let i="";for(const e of t.cssRules)i+=e.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,e))(i)})(t):t
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */,{is:a,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:p,getPrototypeOf:d}=Object,u=globalThis,f=u.trustedTypes,v=f?f.emptyScript:"",g=u.reactiveElementPolyfillSupport,b=(t,i)=>t,m={toAttribute(t,i){switch(i){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,i){let e=t;switch(i){case Boolean:e=null!==t;break;case Number:e=null===t?null:Number(t);break;case Object:case Array:try{e=JSON.parse(t)}catch(t){e=null}}return e}},x=(t,i)=>!a(t,i),y={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,i=y){if(i.state&&(i.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((i=Object.create(i)).wrapped=!0),this.elementProperties.set(t,i),!i.noAccessor){const e=Symbol(),s=this.getPropertyDescriptor(t,e,i);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,i,e){const{get:s,set:o}=l(this.prototype,t)??{get(){return this[i]},set(t){this[i]=t}};return{get:s,set(i){const r=s?.call(this);o?.call(this,i),this.requestUpdate(t,r,e)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=d(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,i=[...c(t),...p(t)];for(const e of i)this.createProperty(e,t[e])}const t=this[Symbol.metadata];if(null!==t){const i=litPropertyMetadata.get(t);if(void 0!==i)for(const[t,e]of i)this.elementProperties.set(t,e)}this._$Eh=new Map;for(const[t,i]of this.elementProperties){const e=this._$Eu(t,i);void 0!==e&&this._$Eh.set(e,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const i=[];if(Array.isArray(t)){const e=new Set(t.flat(1/0).reverse());for(const t of e)i.unshift(n(t))}else void 0!==t&&i.push(n(t));return i}static _$Eu(t,i){const e=i.attribute;return!1===e?void 0:"string"==typeof e?e:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,i=this.constructor.elementProperties;for(const e of i.keys())this.hasOwnProperty(e)&&(t.set(e,this[e]),delete this[e]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,s)=>{if(i)e.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const i of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,e.appendChild(s)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,i,e){this._$AK(t,e)}_$ET(t,i){const e=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,e);if(void 0!==s&&!0===e.reflect){const o=(void 0!==e.converter?.toAttribute?e.converter:m).toAttribute(i,e.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,i){const e=this.constructor,s=e._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=e.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:m;this._$Em=s,this[s]=o.fromAttribute(i,t.type)??this._$Ej?.get(s)??null,this._$Em=null}}requestUpdate(t,i,e){if(void 0!==t){const s=this.constructor,o=this[t];if(e??=s.getPropertyOptions(t),!((e.hasChanged??x)(o,i)||e.useDefault&&e.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,e))))return;this.C(t,i,e)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,i,{useDefault:e,reflect:s,wrapped:o},r){e&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??i??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||e||(i=void 0),this._$AL.set(t,i)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,i]of this._$Ep)this[t]=i;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[i,e]of t){const{wrapped:t}=e,s=this[i];!0!==t||this._$AL.has(i)||void 0===s||this.C(i,void 0,e,s)}}let t=!1;const i=this._$AL;try{t=this.shouldUpdate(i),t?(this.willUpdate(i),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(i)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(i)}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[b("elementProperties")]=new Map,w[b("finalized")]=new Map,g?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $=globalThis,k=$.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,_="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+A,E=`<${C}>`,j=document,T=()=>j.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,R=Array.isArray,z="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,P=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,B=/^(?:script|style|textarea|title)$/i,F=Symbol.for("lit-noChange"),L=Symbol.for("lit-nothing"),W=new WeakMap,Z=j.createTreeWalker(j,129);function H(t,i){if(!R(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(i):i}let V=class t{constructor({strings:i,_$litType$:e},s){let o;this.parts=[];let r=0,n=0;const a=i.length-1,h=this.parts,[l,c]=((t,i)=>{const e=t.length-1,s=[];let o,r=2===i?"<svg>":3===i?"<math>":"",n=M;for(let i=0;i<e;i++){const e=t[i];let a,h,l=-1,c=0;for(;c<e.length&&(n.lastIndex=c,h=n.exec(e),null!==h);)c=n.lastIndex,n===M?"!--"===h[1]?n=N:void 0!==h[1]?n=U:void 0!==h[2]?(B.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=P):void 0!==h[3]&&(n=P):n===P?">"===h[0]?(n=o??M,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?P:'"'===h[3]?D:I):n===D||n===I?n=P:n===N||n===U?n=M:(n=P,o=void 0);const p=n===P&&t[i+1].startsWith("/>")?" ":"";r+=n===M?e+E:l>=0?(s.push(a),e.slice(0,l)+_+e.slice(l)+A+p):e+A+(-2===l?i:p)}return[H(t,r+(t[e]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),s]})(i,e);if(this.el=t.createElement(l,s),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Z.nextNode())&&h.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(_)){const i=c[n++],e=o.getAttribute(t).split(A),s=/([.?@])?(.*)/.exec(i);h.push({type:1,index:r,name:s[2],strings:e,ctor:"."===s[1]?Q:"?"===s[1]?X:"@"===s[1]?Y:G}),o.removeAttribute(t)}else t.startsWith(A)&&(h.push({type:6,index:r}),o.removeAttribute(t));if(B.test(o.tagName)){const t=o.textContent.split(A),i=t.length-1;if(i>0){o.textContent=k?k.emptyScript:"";for(let e=0;e<i;e++)o.append(t[e],T()),Z.nextNode(),h.push({type:2,index:++r});o.append(t[i],T())}}}else if(8===o.nodeType)if(o.data===C)h.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(A,t+1));)h.push({type:7,index:r}),t+=A.length-1}r++}}static createElement(t,i){const e=j.createElement("template");return e.innerHTML=t,e}};function q(t,i,e=t,s){if(i===F)return i;let o=void 0!==s?e._$Co?.[s]:e._$Cl;const r=O(i)?void 0:i._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,e,s)),void 0!==s?(e._$Co??=[])[s]=o:e._$Cl=o),void 0!==o&&(i=q(t,o._$AS(t,i.values),o,s)),i}let J=class{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:e}=this._$AD,s=(t?.creationScope??j).importNode(i,!0);Z.currentNode=s;let o=Z.nextNode(),r=0,n=0,a=e[0];for(;void 0!==a;){if(r===a.index){let i;2===a.type?i=new K(o,o.nextSibling,this,t):1===a.type?i=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(i=new tt(o,this,t)),this._$AV.push(i),a=e[++n]}r!==a?.index&&(o=Z.nextNode(),r++)}return Z.currentNode=j,s}p(t){let i=0;for(const e of this._$AV)void 0!==e&&(void 0!==e.strings?(e._$AI(t,e,i),i+=e.strings.length-2):e._$AI(t[i])),i++}},K=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,e,s){this.type=2,this._$AH=L,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=e,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=q(this,t,i),O(t)?t===L||null==t||""===t?(this._$AH!==L&&this._$AR(),this._$AH=L):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>R(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==L&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(j.createTextNode(t)),this._$AH=t}$(t){const{values:i,_$litType$:e}=t,s="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=V.createElement(H(e.h,e.h[0]),this.options)),e);if(this._$AH?._$AD===s)this._$AH.p(i);else{const t=new J(s,this),e=t.u(this.options);t.p(i),this.T(e),this._$AH=t}}_$AC(t){let i=W.get(t.strings);return void 0===i&&W.set(t.strings,i=new V(t)),i}k(i){R(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,o=0;for(const r of i)o===e.length?e.push(s=new t(this.O(T()),this.O(T()),this,this.options)):s=e[o],s._$AI(r),o++;o<e.length&&(this._$AR(s&&s._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}},G=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,e,s,o){this.type=1,this._$AH=L,this._$AN=void 0,this.element=t,this.name=i,this._$AM=s,this.options=o,e.length>2||""!==e[0]||""!==e[1]?(this._$AH=Array(e.length-1).fill(new String),this.strings=e):this._$AH=L}_$AI(t,i=this,e,s){const o=this.strings;let r=!1;if(void 0===o)t=q(this,t,i,0),r=!O(t)||t!==this._$AH&&t!==F,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=q(this,s[e+n],i,n),a===F&&(a=this._$AH[n]),r||=!O(a)||a!==this._$AH[n],a===L?t=L:t!==L&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===L?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Q=class extends G{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===L?void 0:t}},X=class extends G{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==L)}},Y=class extends G{constructor(t,i,e,s,o){super(t,i,e,s,o),this.type=5}_$AI(t,i=this){if((t=q(this,t,i,0)??L)===F)return;const e=this._$AH,s=t===L&&e!==L||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,o=t!==L&&(e===L||s);s&&this.element.removeEventListener(this.name,this,e),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},tt=class{constructor(t,i,e){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=e}get _$AU(){return this._$AM._$AU}_$AI(t){q(this,t)}};const it=$.litHtmlPolyfillSupport;it?.(V,K),($.litHtmlVersions??=[]).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const et=globalThis,st=et.trustedTypes,ot=st?st.createPolicy("lit-html",{createHTML:t=>t}):void 0,rt="$lit$",nt=`lit$${Math.random().toFixed(9).slice(2)}$`,at="?"+nt,ht=`<${at}>`,lt=document,ct=()=>lt.createComment(""),pt=t=>null===t||"object"!=typeof t&&"function"!=typeof t,dt=Array.isArray,ut="[ \t\n\f\r]",ft=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,vt=/-->/g,gt=/>/g,bt=RegExp(`>|${ut}(?:([^\\s"'>=/]+)(${ut}*=${ut}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),mt=/'/g,xt=/"/g,yt=/^(?:script|style|textarea|title)$/i,wt=(t=>(i,...e)=>({_$litType$:t,strings:i,values:e}))(1),$t=Symbol.for("lit-noChange"),kt=Symbol.for("lit-nothing"),St=new WeakMap,_t=lt.createTreeWalker(lt,129);function At(t,i){if(!dt(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==ot?ot.createHTML(i):i}const Ct=(t,i)=>{const e=t.length-1,s=[];let o,r=2===i?"<svg>":3===i?"<math>":"",n=ft;for(let i=0;i<e;i++){const e=t[i];let a,h,l=-1,c=0;for(;c<e.length&&(n.lastIndex=c,h=n.exec(e),null!==h);)c=n.lastIndex,n===ft?"!--"===h[1]?n=vt:void 0!==h[1]?n=gt:void 0!==h[2]?(yt.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=bt):void 0!==h[3]&&(n=bt):n===bt?">"===h[0]?(n=o??ft,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?bt:'"'===h[3]?xt:mt):n===xt||n===mt?n=bt:n===vt||n===gt?n=ft:(n=bt,o=void 0);const p=n===bt&&t[i+1].startsWith("/>")?" ":"";r+=n===ft?e+ht:l>=0?(s.push(a),e.slice(0,l)+rt+e.slice(l)+nt+p):e+nt+(-2===l?i:p)}return[At(t,r+(t[e]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),s]};class Et{constructor({strings:t,_$litType$:i},e){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[h,l]=Ct(t,i);if(this.el=Et.createElement(h,e),_t.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=_t.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(rt)){const i=l[r++],e=s.getAttribute(t).split(nt),n=/([.?@])?(.*)/.exec(i);a.push({type:1,index:o,name:n[2],strings:e,ctor:"."===n[1]?zt:"?"===n[1]?Mt:"@"===n[1]?Nt:Rt}),s.removeAttribute(t)}else t.startsWith(nt)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(yt.test(s.tagName)){const t=s.textContent.split(nt),i=t.length-1;if(i>0){s.textContent=st?st.emptyScript:"";for(let e=0;e<i;e++)s.append(t[e],ct()),_t.nextNode(),a.push({type:2,index:++o});s.append(t[i],ct())}}}else if(8===s.nodeType)if(s.data===at)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(nt,t+1));)a.push({type:7,index:o}),t+=nt.length-1}o++}}static createElement(t,i){const e=lt.createElement("template");return e.innerHTML=t,e}}function jt(t,i,e=t,s){if(i===$t)return i;let o=void 0!==s?e._$Co?.[s]:e._$Cl;const r=pt(i)?void 0:i._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,e,s)),void 0!==s?(e._$Co??=[])[s]=o:e._$Cl=o),void 0!==o&&(i=jt(t,o._$AS(t,i.values),o,s)),i}class Tt{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:e}=this._$AD,s=(t?.creationScope??lt).importNode(i,!0);_t.currentNode=s;let o=_t.nextNode(),r=0,n=0,a=e[0];for(;void 0!==a;){if(r===a.index){let i;2===a.type?i=new Ot(o,o.nextSibling,this,t):1===a.type?i=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(i=new Ut(o,this,t)),this._$AV.push(i),a=e[++n]}r!==a?.index&&(o=_t.nextNode(),r++)}return _t.currentNode=lt,s}p(t){let i=0;for(const e of this._$AV)void 0!==e&&(void 0!==e.strings?(e._$AI(t,e,i),i+=e.strings.length-2):e._$AI(t[i])),i++}}class Ot{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,e,s){this.type=2,this._$AH=kt,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=e,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=jt(this,t,i),pt(t)?t===kt||null==t||""===t?(this._$AH!==kt&&this._$AR(),this._$AH=kt):t!==this._$AH&&t!==$t&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>dt(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==kt&&pt(this._$AH)?this._$AA.nextSibling.data=t:this.T(lt.createTextNode(t)),this._$AH=t}$(t){const{values:i,_$litType$:e}=t,s="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=Et.createElement(At(e.h,e.h[0]),this.options)),e);if(this._$AH?._$AD===s)this._$AH.p(i);else{const t=new Tt(s,this),e=t.u(this.options);t.p(i),this.T(e),this._$AH=t}}_$AC(t){let i=St.get(t.strings);return void 0===i&&St.set(t.strings,i=new Et(t)),i}k(t){dt(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let e,s=0;for(const o of t)s===i.length?i.push(e=new Ot(this.O(ct()),this.O(ct()),this,this.options)):e=i[s],e._$AI(o),s++;s<i.length&&(this._$AR(e&&e._$AB.nextSibling,s),i.length=s)}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Rt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,e,s,o){this.type=1,this._$AH=kt,this._$AN=void 0,this.element=t,this.name=i,this._$AM=s,this.options=o,e.length>2||""!==e[0]||""!==e[1]?(this._$AH=Array(e.length-1).fill(new String),this.strings=e):this._$AH=kt}_$AI(t,i=this,e,s){const o=this.strings;let r=!1;if(void 0===o)t=jt(this,t,i,0),r=!pt(t)||t!==this._$AH&&t!==$t,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=jt(this,s[e+n],i,n),a===$t&&(a=this._$AH[n]),r||=!pt(a)||a!==this._$AH[n],a===kt?t=kt:t!==kt&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===kt?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class zt extends Rt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===kt?void 0:t}}class Mt extends Rt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==kt)}}class Nt extends Rt{constructor(t,i,e,s,o){super(t,i,e,s,o),this.type=5}_$AI(t,i=this){if((t=jt(this,t,i,0)??kt)===$t)return;const e=this._$AH,s=t===kt&&e!==kt||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,o=t!==kt&&(e===kt||s);s&&this.element.removeEventListener(this.name,this,e),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Ut{constructor(t,i,e){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=e}get _$AU(){return this._$AM._$AU}_$AI(t){jt(this,t)}}const Pt=et.litHtmlPolyfillSupport;Pt?.(Et,Ot),(et.litHtmlVersions??=[]).push("3.3.0");const It=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Dt=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,i,e)=>{const s=e?.renderBefore??i;let o=s._$litPart$;if(void 0===o){const t=e?.renderBefore??null;s._$litPart$=o=new Ot(i.insertBefore(ct(),t),t,void 0,e??{})}return o._$AI(t),o})(i,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return $t}};Dt._$litElement$=!0,Dt.finalized=!0,It.litElementHydrateSupport?.({LitElement:Dt});const Bt=It.litElementPolyfillSupport;Bt?.({LitElement:Dt}),(It.litElementVersions??=[]).push("4.2.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ft=1;class Lt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,i,e){this._$Ct=t,this._$AM=i,this._$Ci=e}_$AS(t,i){return this.update(t,i)}update(t,i){return this.render(...i)}}
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Wt=(t=>(...i)=>({_$litDirective$:t,values:i}))(class extends Lt{constructor(t){if(super(t),t.type!==Ft||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter((i=>t[i])).join(" ")+" "}update(t,[i]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in i)i[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(i)}const e=t.element.classList;for(const t of this.st)t in i||(e.remove(t),this.st.delete(t));for(const t in i){const s=!!i[t];s===this.st.has(t)||this.nt?.has(t)||(s?(e.add(t),this.st.add(t)):(e.remove(t),this.st.delete(t)))}return F}}),Zt={attribute:!0,type:String,converter:m,reflect:!1,hasChanged:x},Ht=(t=Zt,i,e)=>{const{kind:s,metadata:o}=e;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(e.name,t),"accessor"===s){const{name:s}=e;return{set(e){const o=i.get.call(this);i.set.call(this,e),this.requestUpdate(s,o,t)},init(i){return void 0!==i&&this.C(s,void 0,t,i),i}}}if("setter"===s){const{name:s}=e;return function(e){const o=this[s];i.call(this,e),this.requestUpdate(s,o,t)}}throw Error("Unsupported decorator location: "+s)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Vt(t){return(i,e)=>"object"==typeof e?Ht(t,i,e):((t,i,e)=>{const s=i.hasOwnProperty(e);return i.constructor.createProperty(e,t),s?Object.getOwnPropertyDescriptor(i,e):void 0})(t,i,e)}const qt=r`
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
`;r`
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
`;const Jt=r`
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
`;var Kt=function(t,i,e,s){var o,r=arguments.length,n=r<3?i:null===s?s=Object.getOwnPropertyDescriptor(i,e):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};class Gt extends Dt{get selectTagName(){return this._selectTagName}set selectTagName(t){this._selectTagName=t,this.SELECT_QUERY=`:scope > ${this._selectTagName}`,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`,this.requestUpdate()}get optionTagName(){return this._optionTagName}set optionTagName(t){this._optionTagName=t,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${t}, :scope > ${this._selectTagName} > optgroup > ${t}`,this.requestUpdate()}constructor(){super(),this.SELECT_QUERY=":scope > select, :scope > custom-select",this.OPTION_QUERY=":scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option",this.for="",this.name="",this.reactive=!1,this._selectTagName="select",this._optionTagName="option",this._form=null,this.onChange_=this.onChangeValue.bind(this),this.onFormdata=t=>{if(!this.name)throw new Error("Attribute name is required for input-chain");this.options.filter((t=>t.selected)).forEach((i=>{t.formData.append(this.name,i.value)}))},this.redrawing=!1}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata),t&&t.addEventListener("formdata",this.onFormdata)}get form(){return this._form}get options(){return Array.from(this.querySelectorAll(this.OPTION_QUERY))}render(){return wt` <slot></slot> `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("change",this.onChange_)}disconnectedCallback(){this.shadowRoot.removeEventListener("change",this.onChange_),this.form=null,super.disconnectedCallback()}onChangeValue(t){const i=t.target,e=Array.from(this.querySelectorAll(this.SELECT_QUERY));e.includes(i)&&(this.changeAt(e.indexOf(i)),t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),this.requestUpdate())}changeAt(t,i=!1){if(!this.redrawing){if(this.redrawing=!0,this.reactive){if(i){Array.from(this.querySelectorAll(":scope > select, :scope > custom-select"))[0].value=""}this.dispatchEvent(new CustomEvent("change",{detail:{idx:t}}))}else{const i=Array.from(this.querySelectorAll(":scope > select, :scope > custom-select")),e=t>=0?i[t]:i[0],s=(null==e?void 0:e.value)?i[t+1]:e||i[0],o=(null==e?void 0:e.value)?t+1:t;s&&(i.slice(o+1).forEach((t=>t.remove())),s.value=""),this.dispatchEvent(new Event("change"))}this.redrawing=!1}}}Gt.styles=qt,Kt([Vt({type:String,attribute:"for"})],Gt.prototype,"for",void 0),Kt([Vt({type:String})],Gt.prototype,"name",void 0),Kt([Vt({type:Boolean})],Gt.prototype,"reactive",void 0),Kt([Vt({type:String,attribute:"select-tag-name"})],Gt.prototype,"selectTagName",null),Kt([Vt({type:String,attribute:"option-tag-name"})],Gt.prototype,"optionTagName",null),Kt([Vt({type:Array})],Gt.prototype,"options",null),window.customElements.get("input-chain")||window.customElements.define("input-chain",Gt);var Qt=function(t,i,e,s){var o,r=arguments.length,n=r<3?i:null===s?s=Object.getOwnPropertyDescriptor(i,e):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};class Xt extends Gt{constructor(){super(...arguments),this.allowFixed=!0,this._fixed=!1,this.placeholder="Enter a fixed value or switch to expression"}get dirty(){return this.value.length>0}get value(){var t;return this.fixed?[null===(t=this.getFixedInput())||void 0===t?void 0:t.value].filter((t=>!!t)):this.options.filter((t=>t.selected&&t.value)).map((t=>t.value))}get fixed(){return this._fixed}set fixed(t){this._fixed=t,this.dispatchEvent(new Event("fixedChange"))}connectedCallback(){super.connectedCallback()}render(){const t=this.dirty;return wt`
      <!-- header -->
      <header part="header" class="header">
        <label>
          <div
            class=${Wt({dirty:t,"property-name":!0})}
            part="property-name"
          >
            <slot name="label"></slot>
            ${t?wt`
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
                `:wt``}
          </div>
          ${this.allowFixed?wt`
                <div part="fixed-selector" class="fixed-selector">
                  <span
                    class=${Wt({active:this.fixed,"fixed-selector-fixed":!0})}
                    @click=${()=>this.fixed=!0}
                    part="fixed-selector-fixed"
                    >Fixed</span
                  >
                  <span
                    class=${Wt({active:!this.fixed,"fixed-selector-expression":!0})}
                    @click=${()=>this.fixed=!1}
                    part="fixed-selector-expression"
                    >Expression</span
                  >
                </div>
              `:wt``}
        </label>
      </header>
      <div
        part="property-container"
        class=${Wt({"property-container":!0,fixed:this.fixed})}
      >
        <slot class="hide-when-fixed"
          >${this.options.length?"":this.placeholder}</slot
        >
        <slot name="fixed" part="fixed" class="show-when-fixed"></slot>
      </div>
    `}reset(){if(this.fixed){const t=this.getFixedInput();if(!t)throw new Error("Input not found for fixed value");t.value=""}else this.changeAt(-1,!0);this.dispatchEvent(new Event("change")),this.requestUpdate()}getFixedInput(){return this.querySelector("input, textarea")}}Qt([Vt({type:Boolean,attribute:"allow-fixed"})],Xt.prototype,"allowFixed",void 0),Qt([Vt({type:Boolean,attribute:"fixed",reflect:!0})],Xt.prototype,"fixed",null),Qt([Vt()],Xt.prototype,"placeholder",void 0),window.customElements.get("expression-input")||window.customElements.define("expression-input",Xt);var Yt=function(t,i,e,s){var o,r=arguments.length,n=r<3?i:null===s?s=Object.getOwnPropertyDescriptor(i,e):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};class ti extends Dt{constructor(){super(...arguments),this.hidden=!1,this.noAutoClose=!1,this.resized_=this.ensureElementInView.bind(this),this.blured_=this.blured.bind(this),this.keydown_=this.keydown.bind(this)}render(){return setTimeout((()=>this.ensureElementInView())),wt` <slot></slot> `}connectedCallback(){super.connectedCallback(),this.setAttribute("tabindex","0"),this.addEventListener("blur",this.blured_),this.addEventListener("keydown",this.keydown_),window.addEventListener("resize",this.resized_),window.addEventListener("blur",this.blured_)}disconnectedCallback(){window.removeEventListener("resize",this.resized_),window.removeEventListener("blur",this.blured_),this.removeEventListener("blur",this.blured_),this.removeEventListener("keydown",this.keydown_),super.disconnectedCallback()}getActiveElementRecursive(t=document.activeElement){return(null==t?void 0:t.shadowRoot)?this.getActiveElementRecursive(t.shadowRoot.activeElement):t}blured(){this.noAutoClose||setTimeout((()=>{let t=this.getActiveElementRecursive();for(;t&&t!==this;)t=t.parentNode||t.host;t!==this&&this.close()}))}close(){this.setAttribute("hidden",""),this.blur()}keydown(t){"Escape"===t.key&&this.close()}attributeChangedCallback(t,i,e){super.attributeChangedCallback(t,i,e),"hidden"===t&&null===e&&(this.focus(),this.dispatchEvent(new CustomEvent("popin-opened"))),"hidden"===t&&null!==e&&this.dispatchEvent(new CustomEvent("popin-closed"))}ensureElementInView(){var t;const i=null===(t=this.parentElement)||void 0===t?void 0:t.getBoundingClientRect();this.style.left=`${null==i?void 0:i.left}px`,this.style.top=`${null==i?void 0:i.top}px`;const e=this.getBoundingClientRect(),s=window.innerWidth,o=window.innerHeight;e.left+e.width+0>s&&(this.style.left=s-e.width-0+"px"),e.left+0<0&&(this.style.left="0px"),e.top+e.height+0>o&&(this.style.top=o-e.height-0+"px"),e.top+0<0&&(this.style.top="0px")}}ti.styles=Jt,Yt([Vt()],ti.prototype,"hidden",void 0),Yt([Vt({type:Boolean,attribute:"no-auto-close"})],ti.prototype,"noAutoClose",void 0),window.customElements.get("popin-overlay")||window.customElements.define("popin-overlay",ti);var ii=function(t,i,e,s){var o,r=arguments.length,n=r<3?i:null===s?s=Object.getOwnPropertyDescriptor(i,e):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,i,e,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(i,e,n):o(i,e))||n);return r>3&&n&&Object.defineProperty(i,e,n),n};class ei extends ti{constructor(){super(...arguments),this.for="",this.name="",this.formData=new FormData,this.onFormdata_=this.onFormdata.bind(this),this.slotChanged_=this.slotChanged.bind(this),this._form=null,this.inputs=[]}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata_),t&&t.addEventListener("formdata",this.onFormdata_)}get form(){return this._form}get value(){return this.updateFormData(),Object.fromEntries(this.formData.entries())}render(){return super.render(),wt`
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
    `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("slotchange",this.slotChanged_),this.slotChanged()}disconnectedCallback(){this.removeEventListener("slotchange",this.slotChanged_),this.form=null,super.disconnectedCallback()}slotChanged(){this.inputs=Array.from(this.querySelectorAll("input, select, textarea, [data-is-input]"))}onFormdata(t){t.preventDefault();const i=t.formData;for(const[t,e]of this.formData.entries())i.set(`${this.name}-${t}`,e)}updateFormData(){this.formData=new FormData;for(const t of this.inputs)this.formData.set(t.getAttribute("name"),t.value)}submit(t){t.preventDefault(),t.stopImmediatePropagation(),this.updateFormData(),this.close(),this.dispatchEvent(new Event("change"))}change(t){t.target.closest(this.tagName)===this&&(t.preventDefault(),t.stopImmediatePropagation())}}ii([Vt({type:String,attribute:"for"})],ei.prototype,"for",void 0),ii([Vt({type:String})],ei.prototype,"name",void 0),window.customElements.get("popin-form")||window.customElements.define("popin-form",ei);export{Xt as ExpressionInput,Gt as InputChain,ei as PopinForm};
//# sourceMappingURL=bundle.esm.js.map
