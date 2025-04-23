/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const s=1===t.length?t[0]:e.reduce(((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1]),t[0]);return new o(s,t,i)},n=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,i))(e)})(t):t
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */,{is:a,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:p,getPrototypeOf:d}=Object,u=globalThis,f=u.trustedTypes,v=f?f.emptyScript:"",g=u.reactiveElementPolyfillSupport,b=(t,e)=>t,m={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},x=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:o}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=d(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,e=[...c(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:m).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:m;this._$Em=s,this[s]=o.fromAttribute(e,t.type)??this._$Ej?.get(s)??null,this._$Em=null}}requestUpdate(t,e,i){if(void 0!==t){const s=this.constructor,o=this[t];if(i??=s.getPropertyOptions(t),!((i.hasChanged??x)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[b("elementProperties")]=new Map,w[b("finalized")]=new Map,g?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $=globalThis,k=$.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,_="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+A,E=`<${C}>`,j=document,T=()=>j.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,R=Array.isArray,z="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,P=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,B=/^(?:script|style|textarea|title)$/i,F=Symbol.for("lit-noChange"),L=Symbol.for("lit-nothing"),W=new WeakMap,Z=j.createTreeWalker(j,129);function H(t,e){if(!R(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}let V=class t{constructor({strings:e,_$litType$:i},s){let o;this.parts=[];let r=0,n=0;const a=e.length-1,h=this.parts,[l,c]=((t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=M;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(n.lastIndex=c,h=n.exec(i),null!==h);)c=n.lastIndex,n===M?"!--"===h[1]?n=N:void 0!==h[1]?n=U:void 0!==h[2]?(B.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=P):void 0!==h[3]&&(n=P):n===P?">"===h[0]?(n=o??M,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?P:'"'===h[3]?D:I):n===D||n===I?n=P:n===N||n===U?n=M:(n=P,o=void 0);const p=n===P&&t[e+1].startsWith("/>")?" ":"";r+=n===M?i+E:l>=0?(s.push(a),i.slice(0,l)+_+i.slice(l)+A+p):i+A+(-2===l?e:p)}return[H(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]})(e,i);if(this.el=t.createElement(l,s),Z.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Z.nextNode())&&h.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(_)){const e=c[n++],i=o.getAttribute(t).split(A),s=/([.?@])?(.*)/.exec(e);h.push({type:1,index:r,name:s[2],strings:i,ctor:"."===s[1]?Q:"?"===s[1]?X:"@"===s[1]?Y:G}),o.removeAttribute(t)}else t.startsWith(A)&&(h.push({type:6,index:r}),o.removeAttribute(t));if(B.test(o.tagName)){const t=o.textContent.split(A),e=t.length-1;if(e>0){o.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],T()),Z.nextNode(),h.push({type:2,index:++r});o.append(t[e],T())}}}else if(8===o.nodeType)if(o.data===C)h.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(A,t+1));)h.push({type:7,index:r}),t+=A.length-1}r++}}static createElement(t,e){const i=j.createElement("template");return i.innerHTML=t,i}};function q(t,e,i=t,s){if(e===F)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=O(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=q(t,o._$AS(t,e.values),o,s)),e}let J=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??j).importNode(e,!0);Z.currentNode=s;let o=Z.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new K(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new tt(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=Z.nextNode(),r++)}return Z.currentNode=j,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},K=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=L,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=q(this,t,e),O(t)?t===L||null==t||""===t?(this._$AH!==L&&this._$AR(),this._$AH=L):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>R(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==L&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(j.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=V.createElement(H(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new J(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=W.get(t.strings);return void 0===e&&W.set(t.strings,e=new V(t)),e}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,o=0;for(const r of e)o===i.length?i.push(s=new t(this.O(T()),this.O(T()),this,this.options)):s=i[o],s._$AI(r),o++;o<i.length&&(this._$AR(s&&s._$AB.nextSibling,o),i.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}},G=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=L,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=L}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=q(this,t,e,0),r=!O(t)||t!==this._$AH&&t!==F,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=q(this,s[i+n],e,n),a===F&&(a=this._$AH[n]),r||=!O(a)||a!==this._$AH[n],a===L?t=L:t!==L&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===L?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Q=class extends G{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===L?void 0:t}},X=class extends G{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==L)}},Y=class extends G{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=q(this,t,e,0)??L)===F)return;const i=this._$AH,s=t===L&&i!==L||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==L&&(i===L||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},tt=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){q(this,t)}};const et=$.litHtmlPolyfillSupport;et?.(V,K),($.litHtmlVersions??=[]).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const it=globalThis,st=it.trustedTypes,ot=st?st.createPolicy("lit-html",{createHTML:t=>t}):void 0,rt="$lit$",nt=`lit$${Math.random().toFixed(9).slice(2)}$`,at="?"+nt,ht=`<${at}>`,lt=document,ct=()=>lt.createComment(""),pt=t=>null===t||"object"!=typeof t&&"function"!=typeof t,dt=Array.isArray,ut="[ \t\n\f\r]",ft=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,vt=/-->/g,gt=/>/g,bt=RegExp(`>|${ut}(?:([^\\s"'>=/]+)(${ut}*=${ut}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),mt=/'/g,xt=/"/g,yt=/^(?:script|style|textarea|title)$/i,wt=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),$t=Symbol.for("lit-noChange"),kt=Symbol.for("lit-nothing"),St=new WeakMap,_t=lt.createTreeWalker(lt,129);function At(t,e){if(!dt(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==ot?ot.createHTML(e):e}const Ct=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=ft;for(let e=0;e<i;e++){const i=t[e];let a,h,l=-1,c=0;for(;c<i.length&&(n.lastIndex=c,h=n.exec(i),null!==h);)c=n.lastIndex,n===ft?"!--"===h[1]?n=vt:void 0!==h[1]?n=gt:void 0!==h[2]?(yt.test(h[2])&&(o=RegExp("</"+h[2],"g")),n=bt):void 0!==h[3]&&(n=bt):n===bt?">"===h[0]?(n=o??ft,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?bt:'"'===h[3]?xt:mt):n===xt||n===mt?n=bt:n===vt||n===gt?n=ft:(n=bt,o=void 0);const p=n===bt&&t[e+1].startsWith("/>")?" ":"";r+=n===ft?i+ht:l>=0?(s.push(a),i.slice(0,l)+rt+i.slice(l)+nt+p):i+nt+(-2===l?e:p)}return[At(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Et{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[h,l]=Ct(t,e);if(this.el=Et.createElement(h,i),_t.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=_t.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(rt)){const e=l[r++],i=s.getAttribute(t).split(nt),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?zt:"?"===n[1]?Mt:"@"===n[1]?Nt:Rt}),s.removeAttribute(t)}else t.startsWith(nt)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(yt.test(s.tagName)){const t=s.textContent.split(nt),e=t.length-1;if(e>0){s.textContent=st?st.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],ct()),_t.nextNode(),a.push({type:2,index:++o});s.append(t[e],ct())}}}else if(8===s.nodeType)if(s.data===at)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(nt,t+1));)a.push({type:7,index:o}),t+=nt.length-1}o++}}static createElement(t,e){const i=lt.createElement("template");return i.innerHTML=t,i}}function jt(t,e,i=t,s){if(e===$t)return e;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=pt(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(e=jt(t,o._$AS(t,e.values),o,s)),e}class Tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??lt).importNode(e,!0);_t.currentNode=s;let o=_t.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new Ot(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new Ut(o,this,t)),this._$AV.push(e),a=i[++n]}r!==a?.index&&(o=_t.nextNode(),r++)}return _t.currentNode=lt,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Ot{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=kt,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=jt(this,t,e),pt(t)?t===kt||null==t||""===t?(this._$AH!==kt&&this._$AR(),this._$AH=kt):t!==this._$AH&&t!==$t&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>dt(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==kt&&pt(this._$AH)?this._$AA.nextSibling.data=t:this.T(lt.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Et.createElement(At(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=St.get(t.strings);return void 0===e&&St.set(t.strings,e=new Et(t)),e}k(t){dt(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new Ot(this.O(ct()),this.O(ct()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Rt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,o){this.type=1,this._$AH=kt,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=kt}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=jt(this,t,e,0),r=!pt(t)||t!==this._$AH&&t!==$t,r&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=jt(this,s[i+n],e,n),a===$t&&(a=this._$AH[n]),r||=!pt(a)||a!==this._$AH[n],a===kt?t=kt:t!==kt&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(t)}j(t){t===kt?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class zt extends Rt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===kt?void 0:t}}class Mt extends Rt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==kt)}}class Nt extends Rt{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){if((t=jt(this,t,e,0)??kt)===$t)return;const i=this._$AH,s=t===kt&&i!==kt||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==kt&&(i===kt||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Ut{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){jt(this,t)}}const Pt=it.litHtmlPolyfillSupport;Pt?.(Et,Ot),(it.litHtmlVersions??=[]).push("3.3.0");const It=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Dt=class extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=i?.renderBefore??null;s._$litPart$=o=new Ot(e.insertBefore(ct(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return $t}};Dt._$litElement$=!0,Dt.finalized=!0,It.litElementHydrateSupport?.({LitElement:Dt});const Bt=It.litElementPolyfillSupport;Bt?.({LitElement:Dt}),(It.litElementVersions??=[]).push("4.2.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ft=1;class Lt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Wt=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends Lt{constructor(t){if(super(t),t.type!==Ft||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter((e=>t[e])).join(" ")+" "}update(t,[e]){if(void 0===this.st){this.st=new Set,void 0!==t.strings&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in e)e[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(e)}const i=t.element.classList;for(const t of this.st)t in e||(i.remove(t),this.st.delete(t));for(const t in e){const s=!!e[t];s===this.st.has(t)||this.nt?.has(t)||(s?(i.add(t),this.st.add(t)):(i.remove(t),this.st.delete(t)))}return F}}),Zt=t=>(e,i)=>{void 0!==i?i.addInitializer((()=>{customElements.define(t,e)})):customElements.define(t,e)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */,Ht={attribute:!0,type:String,converter:m,reflect:!1,hasChanged:x},Vt=(t=Ht,e,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,o,t)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];e.call(this,i),this.requestUpdate(s,o,t)}}throw Error("Unsupported decorator location: "+s)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function qt(t){return(e,i)=>"object"==typeof i?Vt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}const Jt=r`
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
`;const Kt=r`
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
`;var Gt=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Qt=class extends Dt{get selectTagName(){return this._selectTagName}set selectTagName(t){this._selectTagName=t,this.SELECT_QUERY=`:scope > ${this._selectTagName}`,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`,this.requestUpdate()}get optionTagName(){return this._optionTagName}set optionTagName(t){this._optionTagName=t,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${t}, :scope > ${this._selectTagName} > optgroup > ${t}`,this.requestUpdate()}constructor(){super(),this.SELECT_QUERY=":scope > select, :scope > custom-select",this.OPTION_QUERY=":scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option",this.for="",this.name="",this.reactive=!1,this._selectTagName="select",this._optionTagName="option",this._form=null,this.onChange_=this.onChangeValue.bind(this),this.onFormdata=t=>{if(!this.name)throw new Error("Attribute name is required for input-chain");this.options.filter((t=>t.selected)).forEach((e=>{t.formData.append(this.name,e.value)}))},this.redrawing=!1}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata),t&&t.addEventListener("formdata",this.onFormdata)}get form(){return this._form}get options(){return Array.from(this.querySelectorAll(this.OPTION_QUERY))}render(){return wt` <slot></slot> `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("change",this.onChange_)}disconnectedCallback(){this.shadowRoot.removeEventListener("change",this.onChange_),this.form=null,super.disconnectedCallback()}onChangeValue(t){const e=t.target,i=Array.from(this.querySelectorAll(this.SELECT_QUERY));i.includes(e)&&(this.changeAt(i.indexOf(e)),t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),this.requestUpdate())}changeAt(t,e=!1){if(!this.redrawing){if(this.redrawing=!0,this.reactive){if(e){Array.from(this.querySelectorAll(":scope > select, :scope > custom-select"))[0].value=""}this.dispatchEvent(new CustomEvent("change",{detail:{idx:t}}))}else{const e=Array.from(this.querySelectorAll(":scope > select, :scope > custom-select")),i=t>=0?e[t]:e[0],s=(null==i?void 0:i.value)?e[t+1]:i||e[0],o=(null==i?void 0:i.value)?t+1:t;s&&(e.slice(o+1).forEach((t=>t.remove())),s.value=""),this.dispatchEvent(new Event("change"))}this.redrawing=!1}}};Qt.styles=Jt,Gt([qt({type:String,attribute:"for"})],Qt.prototype,"for",void 0),Gt([qt({type:String})],Qt.prototype,"name",void 0),Gt([qt({type:Boolean})],Qt.prototype,"reactive",void 0),Gt([qt({type:String,attribute:"select-tag-name"})],Qt.prototype,"selectTagName",null),Gt([qt({type:String,attribute:"option-tag-name"})],Qt.prototype,"optionTagName",null),Gt([qt({type:Array})],Qt.prototype,"options",null),Qt=Gt([Zt("input-chain")],Qt);var Xt=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let Yt=class extends Qt{constructor(){super(...arguments),this.allowFixed=!0,this._fixed=!1,this.placeholder="Enter a fixed value or switch to expression"}get dirty(){return this.value.length>0}get value(){var t;return this.fixed?[null===(t=this.getFixedInput())||void 0===t?void 0:t.value].filter((t=>!!t)):this.options.filter((t=>t.selected&&t.value)).map((t=>t.value))}get fixed(){return this._fixed}set fixed(t){this._fixed=t,this.dispatchEvent(new Event("fixedChange"))}connectedCallback(){super.connectedCallback()}render(){const t=this.dirty;return wt`
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
    `}reset(){if(this.fixed){const t=this.getFixedInput();if(!t)throw new Error("Input not found for fixed value");t.value=""}else this.changeAt(-1,!0);this.dispatchEvent(new Event("change")),this.requestUpdate()}getFixedInput(){return this.querySelector("input, textarea")}};Xt([qt({type:Boolean,attribute:"allow-fixed"})],Yt.prototype,"allowFixed",void 0),Xt([qt({type:Boolean,attribute:"fixed",reflect:!0})],Yt.prototype,"fixed",null),Xt([qt()],Yt.prototype,"placeholder",void 0),Yt=Xt([Zt("expression-input")],Yt);var te=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let ee=class extends Dt{constructor(){super(...arguments),this.hidden=!1,this.noAutoClose=!1,this.resized_=this.ensureElementInView.bind(this),this.blured_=this.blured.bind(this),this.keydown_=this.keydown.bind(this)}render(){return setTimeout((()=>this.ensureElementInView())),wt` <slot></slot> `}connectedCallback(){super.connectedCallback(),this.setAttribute("tabindex","0"),this.addEventListener("blur",this.blured_),this.addEventListener("keydown",this.keydown_),window.addEventListener("resize",this.resized_),window.addEventListener("blur",this.blured_)}disconnectedCallback(){window.removeEventListener("resize",this.resized_),window.removeEventListener("blur",this.blured_),this.removeEventListener("blur",this.blured_),this.removeEventListener("keydown",this.keydown_),super.disconnectedCallback()}getActiveElementRecursive(t=document.activeElement){return(null==t?void 0:t.shadowRoot)?this.getActiveElementRecursive(t.shadowRoot.activeElement):t}blured(){this.noAutoClose||setTimeout((()=>{let t=this.getActiveElementRecursive();for(;t&&t!==this;)t=t.parentNode||t.host;t!==this&&this.close()}))}close(){this.setAttribute("hidden",""),this.blur()}keydown(t){"Escape"===t.key&&this.close()}attributeChangedCallback(t,e,i){super.attributeChangedCallback(t,e,i),"hidden"===t&&null===i&&(this.focus(),this.dispatchEvent(new CustomEvent("popin-opened"))),"hidden"===t&&null!==i&&this.dispatchEvent(new CustomEvent("popin-closed"))}ensureElementInView(){var t;const e=null===(t=this.parentElement)||void 0===t?void 0:t.getBoundingClientRect();this.style.left=`${null==e?void 0:e.left}px`,this.style.top=`${null==e?void 0:e.top}px`;const i=this.getBoundingClientRect(),s=window.innerWidth,o=window.innerHeight;i.left+i.width+0>s&&(this.style.left=s-i.width-0+"px"),i.left+0<0&&(this.style.left="0px"),i.top+i.height+0>o&&(this.style.top=o-i.height-0+"px"),i.top+0<0&&(this.style.top="0px")}};ee.styles=Kt,te([qt()],ee.prototype,"hidden",void 0),te([qt({type:Boolean,attribute:"no-auto-close"})],ee.prototype,"noAutoClose",void 0),ee=te([Zt("popin-overlay")],ee);var ie=function(t,e,i,s){var o,r=arguments.length,n=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,i,n):o(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n};let se=class extends ee{constructor(){super(...arguments),this.for="",this.name="",this.formData=new FormData,this.onFormdata_=this.onFormdata.bind(this),this.slotChanged_=this.slotChanged.bind(this),this._form=null,this.inputs=[]}set form(t){this._form&&this._form.removeEventListener("formdata",this.onFormdata_),t&&t.addEventListener("formdata",this.onFormdata_)}get form(){return this._form}get value(){return this.updateFormData(),Object.fromEntries(this.formData.entries())}render(){return super.render(),wt`
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
    `}connectedCallback(){if(super.connectedCallback(),this.for){const t=document.querySelector(`form#${this.for}`);t&&(this.form=t)}else this.form=this.closest("form");this.shadowRoot.addEventListener("slotchange",this.slotChanged_),this.slotChanged()}disconnectedCallback(){this.removeEventListener("slotchange",this.slotChanged_),this.form=null,super.disconnectedCallback()}slotChanged(){this.inputs=Array.from(this.querySelectorAll("input, select, textarea, [data-is-input]"))}onFormdata(t){t.preventDefault();const e=t.formData;for(const[t,i]of this.formData.entries())e.set(`${this.name}-${t}`,i)}updateFormData(){this.formData=new FormData;for(const t of this.inputs)this.formData.set(t.getAttribute("name"),t.value)}submit(t){t.preventDefault(),t.stopImmediatePropagation(),this.updateFormData(),this.close(),this.dispatchEvent(new Event("change"))}change(t){t.target.closest(this.tagName)===this&&(t.preventDefault(),t.stopImmediatePropagation())}};ie([qt({type:String,attribute:"for"})],se.prototype,"for",void 0),ie([qt({type:String})],se.prototype,"name",void 0),se=ie([Zt("popin-form")],se);export{Yt as ExpressionInput,Qt as InputChain,se as PopinForm};
//# sourceMappingURL=bundle.esm.js.map
