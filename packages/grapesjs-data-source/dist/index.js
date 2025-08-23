/*! @silexlabs/grapesjs-data-source - 0.1.0 */
!function(e,t){'object'==typeof exports&&'object'==typeof module?module.exports=t():'function'==typeof define&&define.amd?define([],t):'object'==typeof exports?exports["@silexlabs/grapesjs-data-source"]=t():e["@silexlabs/grapesjs-data-source"]=t()}('undefined'!=typeof globalThis?globalThis:'undefined'!=typeof window?window:this,(()=>(()=>{var e={284:e=>{e.exports=function(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];var r=[],i='string'==typeof e?[e]:e.slice();i[i.length-1]=i[i.length-1].replace(/\r?\n([\t ]*)$/,'');for(var o=0;o<i.length;o++){var s;(s=i[o].match(/\n[\t ]+/g))&&r.push.apply(r,s)}if(r.length){var a=Math.min.apply(Math,r.map((function(e){return e.length-1}))),l=new RegExp("\n[\t ]{"+a+"}",'g');for(o=0;o<i.length;o++)i[o]=i[o].replace(l,'\n')}i[0]=i[0].replace(/^\r?\n/,'');var d=i[0];for(o=0;o<t.length;o++)d+=t[o]+i[o+1];return d}}},t={};function n(r){var i=t[r];if(void 0!==i)return i.exports;var o=t[r]={exports:{}};return e[r](o,o.exports,n),o.exports}n.n=e=>{var t=e&&e.__esModule?()=>e['default']:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),n.r=e=>{'undefined'!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:'Module'}),Object.defineProperty(e,'__esModule',{value:!0})};var r={};return(()=>{"use strict";n.r(r),n.d(r,{BinariOperator:()=>v,COMMAND_PREVIEW_ACTIVATE:()=>a,COMMAND_PREVIEW_DEACTIVATE:()=>l,COMMAND_PREVIEW_REFRESH:()=>d,COMMAND_REFRESH:()=>s,COMPONENT_NAME_PREFIX:()=>hi,COMPONENT_STATE_CHANGED:()=>o,DATA_SOURCE_CHANGED:()=>i,DATA_SOURCE_DATA_LOAD_CANCEL:()=>u,DATA_SOURCE_DATA_LOAD_END:()=>c,DATA_SOURCE_DATA_LOAD_START:()=>p,DATA_SOURCE_ERROR:()=>t,DATA_SOURCE_READY:()=>e,FIXED_TOKEN_ID:()=>fi,NOTIFICATION_GROUP:()=>ui,Properties:()=>y,UnariOperator:()=>g,addDataSource:()=>Br,buildPageQueries:()=>Hr,builtinTypeIds:()=>h,builtinTypes:()=>f,clearPreviewData:()=>Wr,createDataSource:()=>pi,default:()=>gi,fromStored:()=>ei,getAllDataSources:()=>Vr,getCompletion:()=>Xr,getDataSource:()=>zr,getExpressionResultType:()=>ti,getLiquidFilters:()=>ci,getOrCreatePersistantId:()=>ri,getPageExpressions:()=>Zr,getPageQuery:()=>qr,getPersistantId:()=>ni,getPreviewData:()=>Jr,getState:()=>ii,getStateIds:()=>oi,getStateVariableName:()=>li,getValue:()=>Yr,loadPreviewData:()=>Kr,refreshDataSources:()=>Gr,removeDataSource:()=>Qr,removeState:()=>ai,setState:()=>si,toExpression:()=>di,version:()=>vi});const e='data-source:ready',t='data-source:error',i='data-source:changed',o='component:state:changed',s='data-source:refresh',a='data-source:preview:activate',l='data-source:preview:deactivate',d='data-source:preview:refresh',p='data-source:data-load:start',c='data-source:data-load:end',u='data-source:data-load:cancel',h=['String','Int','Float','Boolean','ID','Unknown'],f=h.map((e=>({id:e,label:e,fields:[]})));var g,v,y;!function(e){e["TRUTHY"]="truthy",e["FALSY"]="falsy",e["EMPTY_ARR"]="empty array",e["NOT_EMPTY_ARR"]="not empty array"}(g||(g={})),function(e){e["EQUAL"]="==",e["NOT_EQUAL"]="!=",e["GREATER_THAN"]=">",e["LESS_THAN"]="<",e["GREATER_THAN_OR_EQUAL"]=">=",e["LESS_THAN_OR_EQUAL"]="<="}(v||(v={})),function(e){e["innerHTML"]="innerHTML",e["condition"]="condition",e["condition2"]="condition2",e["__data"]="__data"}(y||(y={}));const m='publicStates',b='privateStates',$='id-plugin-data-source',_='nameForDataSource';function x(e){var t;return null!==(t=e.get($))&&void 0!==t?t:null}function w(e){const t=e.get($);if(t)return t;const n=`${e.ccid}-${Math.round(1e4*Math.random())}`;return e.set($,n),n}function S(e,t){return t?x(t)===e?t:S(e,t.parent()):null}const A=[];function E(e,t){A.forEach((n=>n(e,t)))}function k(e,t=!0,n){var r;try{const i=(null!==(r=e.get(t?m:b))&&void 0!==r?r:[]).sort((e=>e.hidden?-1:0)).map((e=>e.id));if(n){const e=i.indexOf(n);return e<0?i:i.slice(0,e)}return i}catch(e){return console.error('Error while getting state ids',e),[]}}function T(e,t=!0){var n;return(null!==(n=e.get(t?m:b))&&void 0!==n?n:[]).map((e=>({label:e.label,hidden:e.hidden,expression:e.expression})))}function I(e,t,n=!0){var r,i;const o=null!==(i=(null!==(r=e.get(n?m:b))&&void 0!==r?r:[]).find((e=>e.id===t)))&&void 0!==i?i:null;return o?{label:o.label,hidden:o.hidden,expression:o.expression}:null}function O(e,t,n,r=!0,i=-1){var o,s;const a=r?m:b,l=null!==(o=e.get(a))&&void 0!==o?o:[],d=null!==(s=l.find((e=>e.id===t)))&&void 0!==s?s:null;if(d?e.set(a,l.map((e=>e.id!==t?e:Object.assign({id:t},n)))):e.set(a,[...l,Object.assign({id:t},n)]),i>=0){const n=[...e.get(a)],r=n.find((e=>e.id===t));r&&i<n.length&&(n.splice(n.indexOf(r),1),n.splice(i,0,r),e.set(a,n))}E({label:n.label,hidden:n.hidden,expression:n.expression},e)}function C(e,t,n=!0){var r;const i=n?m:b,o=(null!==(r=e.get(i))&&void 0!==r?r:[]).filter((e=>e.id!==t));e.set(i,o),E(null,e)}const j=globalThis,N=j.ShadowRoot&&(void 0===j.ShadyCSS||j.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,R=Symbol(),P=new WeakMap;class L{constructor(e,t,n){if(this._$cssResult$=!0,n!==R)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(N&&void 0===e){const n=void 0!==t&&1===t.length;n&&(e=P.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&P.set(t,e))}return e}toString(){return this.cssText}}const U=(e,...t)=>{const n=1===e.length?e[0]:t.reduce(((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[r+1]),e[0]);return new L(n,e,R)},D=N?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return(e=>new L("string"==typeof e?e:e+"",void 0,R))(t)})(e):e,{is:M,defineProperty:F,getOwnPropertyDescriptor:q,getOwnPropertyNames:H,getOwnPropertySymbols:V,getPrototypeOf:z}=Object,B=globalThis,Q=B.trustedTypes,G=Q?Q.emptyScript:"",K=B.reactiveElementPolyfillSupport,J=(e,t)=>e,W={toAttribute(e,t){switch(t){case Boolean:e=e?G:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=null!==e;break;case Number:n=null===e?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch(e){n=null}}return n}},Y=(e,t)=>!M(e,t),Z={attribute:!0,type:String,converter:W,reflect:!1,useDefault:!1,hasChanged:Y};Symbol.metadata??=Symbol("metadata"),B.litPropertyMetadata??=new WeakMap;class X extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Z){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const n=Symbol(),r=this.getPropertyDescriptor(e,n,t);void 0!==r&&F(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){const{get:r,set:i}=q(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){const o=r?.call(this);i?.call(this,t),this.requestUpdate(e,o,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Z}static _$Ei(){if(this.hasOwnProperty(J("elementProperties")))return;const e=z(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(J("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(J("properties"))){const e=this.properties,t=[...H(e),...V(e)];for(const n of t)this.createProperty(n,e[n])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const n=this._$Eu(e,t);void 0!==n&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const e of n)t.unshift(D(e))}else void 0!==e&&t.push(D(e));return t}static _$Eu(e,t){const n=t.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((e=>this.enableUpdating=e)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((e=>e(this)))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(N)e.adoptedStyleSheets=t.map((e=>e instanceof CSSStyleSheet?e:e.styleSheet));else for(const n of t){const t=document.createElement("style"),r=j.litNonce;void 0!==r&&t.setAttribute("nonce",r),t.textContent=n.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((e=>e.hostConnected?.()))}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach((e=>e.hostDisconnected?.()))}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){const n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(void 0!==r&&!0===n.reflect){const i=(void 0!==n.converter?.toAttribute?n.converter:W).toAttribute(t,n.type);this._$Em=e,null==i?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){const n=this.constructor,r=n._$Eh.get(e);if(void 0!==r&&this._$Em!==r){const e=n.getPropertyOptions(r),i="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:W;this._$Em=r,this[r]=i.fromAttribute(t,e.type)??this._$Ej?.get(r)??null,this._$Em=null}}requestUpdate(e,t,n){if(void 0!==e){const r=this.constructor,i=this[e];if(n??=r.getPropertyOptions(e),!((n.hasChanged??Y)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},o){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),!0!==i||void 0!==o)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,n]of e){const{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||void 0===r||this.C(t,void 0,n,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach((e=>e.hostUpdate?.())),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach((e=>e.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach((e=>this._$ET(e,this[e]))),this._$EM()}updated(e){}firstUpdated(e){}}X.elementStyles=[],X.shadowRootOptions={mode:"open"},X[J("elementProperties")]=new Map,X[J("finalized")]=new Map,K?.({ReactiveElement:X}),(B.reactiveElementVersions??=[]).push("2.1.0");const ee=globalThis,te=ee.trustedTypes,ne=te?te.createPolicy("lit-html",{createHTML:e=>e}):void 0,re="$lit$",ie=`lit$${Math.random().toFixed(9).slice(2)}$`,oe="?"+ie,se=`<${oe}>`,ae=document,le=()=>ae.createComment(""),de=e=>null===e||"object"!=typeof e&&"function"!=typeof e,pe=Array.isArray,ce=e=>pe(e)||"function"==typeof e?.[Symbol.iterator],ue="[ \t\n\f\r]",he=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fe=/-->/g,ge=/>/g,ve=RegExp(`>|${ue}(?:([^\\s"'>=/]+)(${ue}*=${ue}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),ye=/'/g,me=/"/g,be=/^(?:script|style|textarea|title)$/i,$e=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),_e=($e(1),$e(2),$e(3),Symbol.for("lit-noChange")),xe=Symbol.for("lit-nothing"),we=new WeakMap,Se=ae.createTreeWalker(ae,129);function Ae(e,t){if(!pe(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==ne?ne.createHTML(t):t}const Ee=(e,t)=>{const n=e.length-1,r=[];let i,o=2===t?"<svg>":3===t?"<math>":"",s=he;for(let t=0;t<n;t++){const n=e[t];let a,l,d=-1,p=0;for(;p<n.length&&(s.lastIndex=p,l=s.exec(n),null!==l);)p=s.lastIndex,s===he?"!--"===l[1]?s=fe:void 0!==l[1]?s=ge:void 0!==l[2]?(be.test(l[2])&&(i=RegExp("</"+l[2],"g")),s=ve):void 0!==l[3]&&(s=ve):s===ve?">"===l[0]?(s=i??he,d=-1):void 0===l[1]?d=-2:(d=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?ve:'"'===l[3]?me:ye):s===me||s===ye?s=ve:s===fe||s===ge?s=he:(s=ve,i=void 0);const c=s===ve&&e[t+1].startsWith("/>")?" ":"";o+=s===he?n+se:d>=0?(r.push(a),n.slice(0,d)+re+n.slice(d)+ie+c):n+ie+(-2===d?t:c)}return[Ae(e,o+(e[n]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]};class ke{constructor({strings:e,_$litType$:t},n){let r;this.parts=[];let i=0,o=0;const s=e.length-1,a=this.parts,[l,d]=Ee(e,t);if(this.el=ke.createElement(l,n),Se.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=Se.nextNode())&&a.length<s;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(re)){const t=d[o++],n=r.getAttribute(e).split(ie),s=/([.?@])?(.*)/.exec(t);a.push({type:1,index:i,name:s[2],strings:n,ctor:"."===s[1]?je:"?"===s[1]?Ne:"@"===s[1]?Re:Ce}),r.removeAttribute(e)}else e.startsWith(ie)&&(a.push({type:6,index:i}),r.removeAttribute(e));if(be.test(r.tagName)){const e=r.textContent.split(ie),t=e.length-1;if(t>0){r.textContent=te?te.emptyScript:"";for(let n=0;n<t;n++)r.append(e[n],le()),Se.nextNode(),a.push({type:2,index:++i});r.append(e[t],le())}}}else if(8===r.nodeType)if(r.data===oe)a.push({type:2,index:i});else{let e=-1;for(;-1!==(e=r.data.indexOf(ie,e+1));)a.push({type:7,index:i}),e+=ie.length-1}i++}}static createElement(e,t){const n=ae.createElement("template");return n.innerHTML=e,n}}function Te(e,t,n=e,r){if(t===_e)return t;let i=void 0!==r?n._$Co?.[r]:n._$Cl;const o=de(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),void 0===o?i=void 0:(i=new o(e),i._$AT(e,n,r)),void 0!==r?(n._$Co??=[])[r]=i:n._$Cl=i),void 0!==i&&(t=Te(e,i._$AS(e,t.values),i,r)),t}class Ie{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??ae).importNode(t,!0);Se.currentNode=r;let i=Se.nextNode(),o=0,s=0,a=n[0];for(;void 0!==a;){if(o===a.index){let t;2===a.type?t=new Oe(i,i.nextSibling,this,e):1===a.type?t=new a.ctor(i,a.name,a.strings,this,e):6===a.type&&(t=new Pe(i,this,e)),this._$AV.push(t),a=n[++s]}o!==a?.index&&(i=Se.nextNode(),o++)}return Se.currentNode=ae,r}p(e){let t=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class Oe{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=xe,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Te(this,e,t),de(e)?e===xe||null==e||""===e?(this._$AH!==xe&&this._$AR(),this._$AH=xe):e!==this._$AH&&e!==_e&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):ce(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==xe&&de(this._$AH)?this._$AA.nextSibling.data=e:this.T(ae.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:n}=e,r="number"==typeof n?this._$AC(e):(void 0===n.el&&(n.el=ke.createElement(Ae(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new Ie(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=we.get(e.strings);return void 0===t&&we.set(e.strings,t=new ke(e)),t}k(e){pe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,r=0;for(const i of e)r===t.length?t.push(n=new Oe(this.O(le()),this.O(le()),this,this.options)):n=t[r],n._$AI(i),r++;r<t.length&&(this._$AR(n&&n._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Ce{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=xe,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=xe}_$AI(e,t=this,n,r){const i=this.strings;let o=!1;if(void 0===i)e=Te(this,e,t,0),o=!de(e)||e!==this._$AH&&e!==_e,o&&(this._$AH=e);else{const r=e;let s,a;for(e=i[0],s=0;s<i.length-1;s++)a=Te(this,r[n+s],t,s),a===_e&&(a=this._$AH[s]),o||=!de(a)||a!==this._$AH[s],a===xe?e=xe:e!==xe&&(e+=(a??"")+i[s+1]),this._$AH[s]=a}o&&!r&&this.j(e)}j(e){e===xe?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class je extends Ce{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===xe?void 0:e}}class Ne extends Ce{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==xe)}}class Re extends Ce{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=Te(this,e,t,0)??xe)===_e)return;const n=this._$AH,r=e===xe&&n!==xe||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==xe&&(n===xe||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class Pe{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Te(this,e)}}const Le={M:re,P:ie,A:oe,C:1,L:Ee,R:Ie,D:ce,V:Te,I:Oe,H:Ce,N:Ne,U:Re,B:je,F:Pe},Ue=ee.litHtmlPolyfillSupport;Ue?.(ke,Oe),(ee.litHtmlVersions??=[]).push("3.3.0");const De=globalThis,Me=De.trustedTypes,Fe=Me?Me.createPolicy("lit-html",{createHTML:e=>e}):void 0,qe="$lit$",He=`lit$${Math.random().toFixed(9).slice(2)}$`,Ve="?"+He,ze=`<${Ve}>`,Be=document,Qe=()=>Be.createComment(""),Ge=e=>null===e||"object"!=typeof e&&"function"!=typeof e,Ke=Array.isArray,Je=e=>Ke(e)||"function"==typeof e?.[Symbol.iterator],We="[ \t\n\f\r]",Ye=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ze=/-->/g,Xe=/>/g,et=RegExp(`>|${We}(?:([^\\s"'>=/]+)(${We}*=${We}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),tt=/'/g,nt=/"/g,rt=/^(?:script|style|textarea|title)$/i,it=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),ot=it(1),st=(it(2),it(3),Symbol.for("lit-noChange")),at=Symbol.for("lit-nothing"),lt=new WeakMap,dt=Be.createTreeWalker(Be,129);function pt(e,t){if(!Ke(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==Fe?Fe.createHTML(t):t}const ct=(e,t)=>{const n=e.length-1,r=[];let i,o=2===t?"<svg>":3===t?"<math>":"",s=Ye;for(let t=0;t<n;t++){const n=e[t];let a,l,d=-1,p=0;for(;p<n.length&&(s.lastIndex=p,l=s.exec(n),null!==l);)p=s.lastIndex,s===Ye?"!--"===l[1]?s=Ze:void 0!==l[1]?s=Xe:void 0!==l[2]?(rt.test(l[2])&&(i=RegExp("</"+l[2],"g")),s=et):void 0!==l[3]&&(s=et):s===et?">"===l[0]?(s=i??Ye,d=-1):void 0===l[1]?d=-2:(d=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?et:'"'===l[3]?nt:tt):s===nt||s===tt?s=et:s===Ze||s===Xe?s=Ye:(s=et,i=void 0);const c=s===et&&e[t+1].startsWith("/>")?" ":"";o+=s===Ye?n+ze:d>=0?(r.push(a),n.slice(0,d)+qe+n.slice(d)+He+c):n+He+(-2===d?t:c)}return[pt(e,o+(e[n]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]};class ut{constructor({strings:e,_$litType$:t},n){let r;this.parts=[];let i=0,o=0;const s=e.length-1,a=this.parts,[l,d]=ct(e,t);if(this.el=ut.createElement(l,n),dt.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=dt.nextNode())&&a.length<s;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(qe)){const t=d[o++],n=r.getAttribute(e).split(He),s=/([.?@])?(.*)/.exec(t);a.push({type:1,index:i,name:s[2],strings:n,ctor:"."===s[1]?yt:"?"===s[1]?mt:"@"===s[1]?bt:vt}),r.removeAttribute(e)}else e.startsWith(He)&&(a.push({type:6,index:i}),r.removeAttribute(e));if(rt.test(r.tagName)){const e=r.textContent.split(He),t=e.length-1;if(t>0){r.textContent=Me?Me.emptyScript:"";for(let n=0;n<t;n++)r.append(e[n],Qe()),dt.nextNode(),a.push({type:2,index:++i});r.append(e[t],Qe())}}}else if(8===r.nodeType)if(r.data===Ve)a.push({type:2,index:i});else{let e=-1;for(;-1!==(e=r.data.indexOf(He,e+1));)a.push({type:7,index:i}),e+=He.length-1}i++}}static createElement(e,t){const n=Be.createElement("template");return n.innerHTML=e,n}}function ht(e,t,n=e,r){if(t===st)return t;let i=void 0!==r?n._$Co?.[r]:n._$Cl;const o=Ge(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),void 0===o?i=void 0:(i=new o(e),i._$AT(e,n,r)),void 0!==r?(n._$Co??=[])[r]=i:n._$Cl=i),void 0!==i&&(t=ht(e,i._$AS(e,t.values),i,r)),t}class ft{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??Be).importNode(t,!0);dt.currentNode=r;let i=dt.nextNode(),o=0,s=0,a=n[0];for(;void 0!==a;){if(o===a.index){let t;2===a.type?t=new gt(i,i.nextSibling,this,e):1===a.type?t=new a.ctor(i,a.name,a.strings,this,e):6===a.type&&(t=new $t(i,this,e)),this._$AV.push(t),a=n[++s]}o!==a?.index&&(i=dt.nextNode(),o++)}return dt.currentNode=Be,r}p(e){let t=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class gt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=at,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=ht(this,e,t),Ge(e)?e===at||null==e||""===e?(this._$AH!==at&&this._$AR(),this._$AH=at):e!==this._$AH&&e!==st&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):Je(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==at&&Ge(this._$AH)?this._$AA.nextSibling.data=e:this.T(Be.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:n}=e,r="number"==typeof n?this._$AC(e):(void 0===n.el&&(n.el=ut.createElement(pt(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new ft(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=lt.get(e.strings);return void 0===t&&lt.set(e.strings,t=new ut(e)),t}k(e){Ke(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,r=0;for(const i of e)r===t.length?t.push(n=new gt(this.O(Qe()),this.O(Qe()),this,this.options)):n=t[r],n._$AI(i),r++;r<t.length&&(this._$AR(n&&n._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class vt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=at,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=at}_$AI(e,t=this,n,r){const i=this.strings;let o=!1;if(void 0===i)e=ht(this,e,t,0),o=!Ge(e)||e!==this._$AH&&e!==st,o&&(this._$AH=e);else{const r=e;let s,a;for(e=i[0],s=0;s<i.length-1;s++)a=ht(this,r[n+s],t,s),a===st&&(a=this._$AH[s]),o||=!Ge(a)||a!==this._$AH[s],a===at?e=at:e!==at&&(e+=(a??"")+i[s+1]),this._$AH[s]=a}o&&!r&&this.j(e)}j(e){e===at?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class yt extends vt{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===at?void 0:e}}class mt extends vt{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==at)}}class bt extends vt{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=ht(this,e,t,0)??at)===st)return;const n=this._$AH,r=e===at&&n!==at||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==at&&(n===at||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class $t{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){ht(this,e)}}const _t=De.litHtmlPolyfillSupport;_t?.(ut,gt),(De.litHtmlVersions??=[]).push("3.3.0");const xt=(e,t,n)=>{const r=n?.renderBefore??t;let i=r._$litPart$;if(void 0===i){const e=n?.renderBefore??null;r._$litPart$=i=new gt(t.insertBefore(Qe(),e),e,void 0,n??{})}return i._$AI(e),i},wt=globalThis;class St extends X{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=xt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return st}}St._$litElement$=!0,St["finalized"]=!0,wt.litElementHydrateSupport?.({LitElement:St});const At=wt.litElementPolyfillSupport;At?.({LitElement:St});function Et(e,t,n){var r;switch(e.type){case'filter':{if(e.optionsForm)return e;const n=t.filters.find((t=>t.id===e.id));if(!n)throw console.error('Filter not found',e),new Error(`Filter ${e.id} not found`);return Object.assign(Object.assign({},n),e)}case'property':{if(e.optionsForm)return e;const i=Tt(e,t,n);if(!i)throw console.error('Field not found for token',e),new Error(`Field ${e.fieldId} not found`);return Object.assign(Object.assign({},null!==(r=Ot(i))&&void 0!==r?r:{}),e)}case'state':return e;default:throw console.error('Unknown token type (reading type)',e),new Error('Unknown token type')}}function kt(e,t,n,r){var i,o,s;switch(e.type){case'filter':try{const n=function(e,t){if('filter'!==e.type)throw new Error('Token is not a filter');const n=t.find((t=>t.id===e.id));if(!n)throw console.error('Filter not found',e),new Error(`Filter ${e.id} not found`);return Object.assign(Object.assign(Object.assign({},e),n),{options:e.options})}(e,r.filters);try{if(n.validate(t))return n.output(t,null!==(i=n.options)&&void 0!==i?i:{})}catch(n){return console.warn('Filter validate error:',n,{token:e,prev:t}),null}return null}catch(i){return console.error('Error while getting filter result type',{token:e,prev:t,component:n,dataTree:r}),null}case'property':try{return Tt(e,r,n.getId())}catch(t){return console.error('Error while getting property result type',{token:e,component:n,dataTree:r}),null}case'state':{const i=S(e.componentId,n);if(!i)return console.warn('Component not found for state',e),null;const a=null===(o=I(i,e.storedStateId,e.exposed))||void 0===o?void 0:o.expression;if(!a)return console.warn('State is not defined on component',{component:i,token:e}),null;try{const t=It(a,i,r);return t?Object.assign(Object.assign({},t),{kind:null!==(s=e.forceKind)&&void 0!==s?s:t.kind}):null}catch(o){return console.error('Error while getting expression result type in tokenToField',{expression:a,parent:i,dataTree:r,component:n,token:e,prev:t}),null}}default:throw console.error('Unknown token type (reading type)',e),new Error('Unknown token type')}}function Tt(e,t,n){const r=e.typeIds.map((r=>{var i;return t.getType(r,null!==(i=e.dataSourceId)&&void 0!==i?i:null,n)})).map((e=>null==e?void 0:e.label)),i=e.options?Object.entries(e.options).map((([e,t])=>({typeId:'JSON',name:e,defaultValue:t}))):void 0;return{id:e.fieldId,label:r.join(', '),typeIds:e.typeIds,kind:e.kind,dataSourceId:e.dataSourceId,arguments:i,previewIndex:e.previewIndex}}function It(e,t,n){return e.reduce(((e,r)=>kt(Et(r,n,t.getId()),e,t,n)),null)}function Ot(e){return e.arguments&&e.arguments.length>0?{optionsForm:(t=e.arguments.map((e=>({name:e.name,value:e.defaultValue}))),(e,n,r)=>ot`
              ${t.map((e=>{var t,n;const i=null!==(n=null!==(t=r[e.name])&&void 0!==t?t:e.value)&&void 0!==n?n:'';return ot`<label>${e.name}</label><input type="text" name=${e.name} .value=${i}>`}))}
          `),options:e.arguments.reduce(((e,t)=>(e[t.name]=t.defaultValue,e)),{})}:null;var t}function Ct(e,t){if(!e&&!t)return{error:!1,result:void 0};if(jt(e)&&jt(t))return{error:!1,result:void 0};if(!e||!t)return{error:!0,result:void 0};if(jt(e)||jt(t))return{error:!0,result:void 0};const n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return{error:!0,result:void 0};for(const r of n)if(e[r]!==t[r])return{error:!0,result:void 0};return{error:!1,result:e}}function jt(e){if(null==e)return!0;const t='string'==typeof e,n=t&&function(e){if('string'!=typeof e)return!1;if(0===e.length)return!1;try{JSON.parse(e)}catch(e){return!1}return!0}(e);if(t&&!n)return''===e;const r=n?JSON.parse(e):e;return Array.isArray(r)?0===r.length:'object'==typeof r&&0===Object.values(r).filter((e=>!!e)).length}(wt.litElementVersions??=[]).push("4.2.0");const Nt=`\n  query IntrospectionQuery {\n    __schema {\n      queryType {\n        name\n      }\n      types {\n        ...FullType\n      }\n    }\n  }\n  fragment FullType on __Type {\n    kind\n    name\n    description\n    fields(includeDeprecated: true) {\n      name\n      description\n      args {\n        ...InputValue\n      }\n      type {\n        ...TypeRef\n      }\n      isDeprecated\n      deprecationReason\n    }\n    inputFields {\n      ...InputValue\n    }\n    interfaces {\n      ...TypeRef\n    }\n    enumValues(includeDeprecated: true) {\n      name\n      description\n      isDeprecated\n      deprecationReason\n    }\n    possibleTypes {\n      ...TypeRef\n    }\n  }\n  fragment InputValue on __InputValue {\n    name\n    description\n    type {\n      ...TypeRef\n    }\n    defaultValue\n  }\n  fragment TypeRef on __Type {\n    kind\n    name\n    possibleTypes {\n      kind\n      name\n    }\n    ofType {\n      kind\n      name\n      possibleTypes {\n        kind\n        name\n      }\n      ofType {\n        kind\n        name\n        possibleTypes {\n          kind\n          name\n        }\n        ofType {\n          kind\n          name\n          possibleTypes {\n            kind\n            name\n          }\n          ofType {\n            kind\n            name\n            possibleTypes {\n              kind\n              name\n            }\n            ofType {\n              kind\n              name\n              possibleTypes {\n                kind\n                name\n              }\n              ofType {\n                kind\n                name\n                possibleTypes {\n                  kind\n                  name\n                }\n                ofType {\n                  kind\n                  name\n                  possibleTypes {\n                    kind\n                    name\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n`;var Rt=n(284),Pt=n.n(Rt),Lt=void 0&&(void 0).__awaiter||function(e,t,n,r){return new(n||(n=Promise))((function(i,o){function s(e){try{l(r.next(e))}catch(e){o(e)}}function a(e){try{l(r["throw"](e))}catch(e){o(e)}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,a)}l((r=r.apply(e,t||[])).next())}))};class Ut{constructor(e){this.type='graphql',this.method='POST',this.headers={},this.types=[],this.queryables=[],this.queryType='',this.ready=!1,this.eventListeners={},this.id=e.id.toString(),this.label=e.label,this.url=e.url,this.type=e.type,this.method=e.method||'POST',this.headers=e.headers||{},this.queryable=e.queryable,this.readonly=e.readonly,this.hidden=e.hidden}on(e,t){this.eventListeners[e]||(this.eventListeners[e]=[]),this.eventListeners[e].push(t)}off(e,t){this.eventListeners[e]&&(this.eventListeners[e]=t?this.eventListeners[e].filter((e=>e!==t)):[])}trigger(e,...t){this.eventListeners[e]&&this.eventListeners[e].forEach((e=>e(...t)))}triggerError(e){throw console.error('GraphQL error:',e),this.trigger(t,e,this),new Error(e)}loadData(){return Lt(this,void 0,void 0,(function*(){var e,t,n;try{const r=yield this.call(Nt);if(!(null===(t=null===(e=r.data)||void 0===e?void 0:e.__schema)||void 0===t?void 0:t.types))return this.triggerError(`Invalid response: ${JSON.stringify(r)}`);const i=r.data.__schema.types.map((e=>e.name)).concat(h),o=null===(n=r.data.__schema.queryType)||void 0===n?void 0:n.name;if(!o)return this.triggerError(`Invalid response, queryType not found: ${JSON.stringify(r)}`);const s=r.data.__schema.types.find((e=>e.name===o));if(!s)return this.triggerError(`Invalid response, query not found: ${JSON.stringify(r)}`);const a=r.data.__schema.types.filter((e=>!e.name.startsWith('__'))).filter((e=>!(null==s?void 0:s.fields.find((t=>t.name===e.name))))).map((e=>this.graphQLToType(i,e,'SCALAR',!1))).concat(f);if(!s)return this.triggerError('Query type not found in GraphQL schema');const l=s.fields.map((e=>({type:Object.assign(Object.assign({},r.data.__schema.types.find((t=>t.name===this.getOfTypeProp('name',e.type,e.name)))),{name:e.name}),kind:this.ofKindToKind(e.type)}))).map((({type:e,kind:t})=>this.graphQLToType(i,e,t,!0))),d=s.fields.map((e=>this.graphQLToField(e)));return[l.concat(a),d,o]}catch(e){return this.triggerError(`GraphQL introspection failed: ${e.message}`)}}))}graphQLToField(e){var t;const n=this.ofKindToKind(e.type);return{id:e.name,dataSourceId:this.id,label:e.name,typeIds:this.graphQLToTypes(e),kind:n?this.graphQLToKind(n):'unknown',arguments:null===(t=e.args)||void 0===t?void 0:t.map((e=>({name:e.name,typeId:this.getOfTypeProp('name',e.type,e.name),defaultValue:e.defaultValue})))}}getOfTypeProp(e,t,n){const r=this.getOfTypePropRecursive(e,t);if(r)return r;if(n)return n;throw new Error(`Type ${JSON.stringify(t)} has no property ${e} and no default was provided`)}getOfTypePropRecursive(e,t){if(!t)throw console.error('Invalid type',t),new Error('Invalid type');if(t.ofType){const n=this.getOfTypePropRecursive(e,t.ofType);if(n)return n}return t[e]}graphQLToTypes(e){const t=this.getOfTypeProp('possibleTypes',e.type,[]);return t.length>0?t.map((e=>e.name)):[this.getOfTypeProp('name',e.type,e.name)]}graphQLToKind(e){switch(e){case'LIST':return'list';case'OBJECT':return'object';case'SCALAR':return'scalar';default:throw new Error(`Unable to find a valid kind for ${e}`)}}validKind(e){return['LIST','OBJECT','SCALAR'].includes(e)}ofKindToKind(e){if(e.possibleTypes){const t=e.possibleTypes.reduce(((t,n)=>{if(!t)return n.kind;if(t!==n.kind)throw new Error(`Unable to find a valid kind for ${e.kind}. Union types with different kind is not supported`);return t}),null);return t||(console.error('Unable to find a valid kind (1)',e),null)}return this.validKind(e.kind)?e.kind:e.ofType?this.ofKindToKind(e.ofType):null}graphQLToType(e,t,n,r){var i,o,s;const a=this.queryable;return{id:t.name,dataSourceId:this.id,label:t.name,fields:null!==(s=null===(o=null===(i=t.fields)||void 0===i?void 0:i.filter((t=>e.includes(this.getOfTypeProp('name',t.type,t.name)))))||void 0===o?void 0:o.map((e=>this.graphQLToField(e))))&&void 0!==s?s:[],queryable:r&&(!a||a.includes(t.name))}}connect(){return Lt(this,void 0,void 0,(function*(){try{const[t,n,r]=yield this.loadData();if(0===t.length)return this.triggerError('No types found in GraphQL schema');if(0===n.length)return this.triggerError('No fields found in GraphQL schema');if(!r)return this.triggerError('No query type found in GraphQL schema');this.types=t,this.queryables=n,this.queryType=r,this.ready?this.trigger(i,this):(this.ready=!0,this.trigger(e,this))}catch(e){return this.triggerError(`GraphQL connection failed: ${e.message}`)}}))}isConnected(){return this.ready}getTypes(){if(!this.ready)throw console.error('DataSource is not ready. Attempted to get types before ready status was achieved.'),new Error('DataSource is not ready. Ensure it is connected and ready before querying.');if(0===this.types.length)throw console.error('No types available. It seems the data source may not be connected or the schema is incomplete.',this.ready),new Error('No types found. The data source may not be connected or there might be an issue with the schema.');return this.types}getQueryables(){return this.queryables}call(e){return Lt(this,void 0,void 0,(function*(){var t;const n=this.url;if(!n)return this.triggerError('Missing GraphQL URL');const r=this.headers;if(!r)return this.triggerError('Missing GraphQL headers');const i=Object.keys(r).find((e=>'content-type'===e.toLowerCase()));r[i||'Content-Type']=r[i||'Content-Type']||'application/json';const o=null!==(t=this.method)&&void 0!==t?t:'POST',s=yield fetch(n,Object.assign({method:o,headers:r},'POST'===o?{body:JSON.stringify({query:e})}:{}));return(null==s?void 0:s.ok)?s.json():(console.error('GraphQL call failed',null==s?void 0:s.status,null==s?void 0:s.statusText,e),this.triggerError(`GraphQL call failed with \`${null==s?void 0:s.statusText}\` and status ${null==s?void 0:s.status}`))}))}getQuery(e){return this.getQueryRecursive({token:{dataSourceId:this.id,fieldId:'query',kind:'object',typeIds:[this.queryType]},children:e})}getQueryRecursive(e,t='',n=''){const r=n?`...on ${n}`:`${e.token.fieldId}${function(e){const t=e?`(${Object.keys(e).map((t=>({key:t,value:e[t]}))).filter((({value:e})=>!jt(e))).map((({key:e,value:t})=>`${e}: ${t}`)).join(', ')})`:'';return'()'===t?'':t}(e.token.options)}`;switch(e.token.kind){case'scalar':return e.token.fieldId===Wt?'':t+r;case'object':case'list':{const n=this.getTypes().filter((t=>{var n;return null===(n=e.token.typeIds)||void 0===n?void 0:n.includes(t.id)}));if(0===n.length)throw new Error(`Type not found for ${e.token.fieldId} (${e.token.typeIds})`);if(n.length>1)throw new Error(`Multiple types found for ${e.token.fieldId}`);const i=n[0],o=e.children.map((e=>{const t=i.fields.find((t=>t.id===e.token.fieldId));return t?{fieldType:t,child:e}:null})).filter((e=>null!==e)),s=o.filter((({fieldType:e})=>e.typeIds.length>1)).map((({child:e})=>({query:this.getQueryRecursive(e,t+'  ',e.token.typeIds[0]),child:e}))).map((({query:e,child:n})=>Pt()`
            ${t}${n.token.fieldId} {
              ${e}
            }
          `)).join('\n'),a=o.filter((({fieldType:e})=>1===e.typeIds.length)).map((({child:e})=>this.getQueryRecursive(e,t+'  '))).join('\n');return Pt()`${t}${r} {
        ${t}  __typename
        ${a}
        ${s}
        ${t}}`}default:throw console.error('Unable to build GraphQL query',e),new Error(`Unable to build GraphQL query: unable to build tree ${JSON.stringify(e)}`)}}fetchValues(e){return Lt(this,void 0,void 0,(function*(){return(yield this.call(e)).data}))}}let Dt=null;function Mt(){if(!Dt)throw new Error('DataSourceRegistry not initialized. Call initializeDataSourceRegistry first.');return Dt}function Ft(){return[...Mt().dataSources]}function qt(e){const t=Mt();t.dataSources.push(e),t.editor.trigger(i)}function Ht(e){const t=Mt(),n=t.dataSources.indexOf(e);n>-1&&(t.dataSources.splice(n,1),t.editor.trigger(i))}function Vt(e){return Mt().dataSources.find((t=>t.id===e))}function zt(e){const t=Mt();t.dataSources=[...e],t.editor.trigger(i)}const Bt='Data source';function Qt(e){return _n()}function Gt(e){const t=e.parent(),n=null==t?void 0:t.getName(),r=null==t?void 0:t.get('tagName'),i=n?`${n} (${r})`:r,o=e.cid,s=e.get('tagName'),a=e.getClasses(),l=a.length?`.${a.join('.')}`:'';return`${i} > ${e.getName()} (${s}#${o}${l})`}function Kt(e,t){switch(t.type){case'property':{const e=function(e,t){const n=e.join(', ').toLowerCase();return'list'===t?` (${n}[])`:'object'===t?` (${n}{})`:` (${n})`}(t.typeIds,t.kind);return`${t.label} ${e}`}case'filter':return t.label;case'state':return function(e,t){var n;const r=S(t.componentId,e),i=null!==(n=null==r?void 0:r.get(_))&&void 0!==n?n:'';return`${i?i+' ':''}${t.label||t.storedStateId}`}(e,t);default:throw console.error('Unknown token type (reading type)',t),new Error('Unknown token type')}}function Jt(e,t,n,r){return n.reduce(((n,i)=>{var o,s,a,l;let d;switch(i.type){case'filter':d='Filters';break;case'property':if(i.dataSourceId)if(r.length>0)try{const e=It(r,t,Qt());d=null!==(s=null!==(o=null==e?void 0:e.label)&&void 0!==o?o:null==e?void 0:e.id)&&void 0!==s?s:'Unknown'}catch(e){console.error('Error while getting expression result type in groupByType',{expression:r,component:t,dataTree:Qt()}),d='Unknown'}else{const t=Vt(i.dataSourceId);if(!t)throw console.error('Data source not found',i.dataSourceId),e.runCommand('notifications:add',{type:'error',group:Bt,message:`Data source not found: ${i.dataSourceId}`}),new Error(`Data source not found: ${i.dataSourceId}`);d=t.label||(null===(l=(a=t).get)||void 0===l?void 0:l.call(a,'label'))||i.dataSourceId}else d='Fields';break;case'state':{const e=S(i.componentId,t),n='body'===(null==e?void 0:e.get('tagName'))?'Website':null==e?void 0:e.getName();d=n?`${n}'s states`:'States';break}default:throw console.error('Unknown token type (reading type)',i),new Error('Unknown token type')}return n[d]||(n[d]=[]),n[d].push(i),n}),{})}const Wt='fixed';function Yt(e){return{type:'property',propType:'field',fieldId:Wt,label:'Fixed value',kind:'scalar',typeIds:['String'],options:{value:e},optionsForm:()=>ot`
        <label>Value
          <input type="text" name="value" .value=${e}>
        </label>
    `}}function Zt(e){return JSON.stringify(Object.assign({},e))}function Xt(e){switch(e.type){case'property':return`property__${e.dataSourceId||''}__${e.fieldId}__${e.kind}__${e.typeIds.join(',')}`;case'filter':return`filter____${e.id}`;case'state':return`state__${e.componentId}__${e.storedStateId}`;default:throw console.error('Unknown token type (reading type)',e),new Error('Unknown token type')}}function en(e,t,n){return Et(JSON.parse(t),Qt(),n)}function tn(e){try{return'string'==typeof e&&(e=JSON.parse(e)),function(e){if('string'==typeof e)throw new Error('json must be parsed');return!!Array.isArray(e)&&e.every((e=>{var t;if('object'!=typeof e)return!1;if(!e.type)return!1;switch(e.type){case'property':if(!e.fieldId)return!1;if(e.fieldId===Wt&&!(null===(t=e.options)||void 0===t?void 0:t.value))return!1;break;case'state':if(!e.componentId)return!1;if(!e.storedStateId)return!1;break;case'filter':if(!e.id)return!1}return!0}))}(e)?e:null}catch(e){return null}}function nn(e,t,n){if(!e)return null;if(e.kind!==t)throw console.error(`Field is not a ${t}`,e),new Error(`Field ${e.label} is not a ${t}`);return Object.assign(Object.assign({},e),{kind:n})}function rn(e,t){if(void 0===e)throw new Error('el option must be set');if('string'==typeof e){const t=document.querySelector(e);if(!t)throw new Error(`Element ${e} not found`);return t}if('function'==typeof e){const t=e();if(!t)throw new Error('el option must be a returned by the provided function');return t}if(e instanceof HTMLElement)return e;throw new Error(`${t} must be a string or an HTMLElement or a function`)}function on(e=Math.random().toString(36).slice(2,8)){return{id:`ds-${e}`,label:'New data source',type:'graphql',url:'',method:'POST',headers:{},readonly:!1}}function sn(e={},t){const n=Object.assign(Object.assign({},on(t)),e);if('graphql'===n.type)return new Ut(n);throw new Error(`Unknown data source type: ${n.type}`)}const an=[{id:'string',label:'String',fields:[]},{id:'number',label:'Number',fields:[]},{id:'boolean',label:'Boolean',fields:[]},{id:'date',label:'Date',fields:[]},{id:'unknown',label:'Unknown',fields:[]}];class ln{get allTypes(){return this._allTypes}get queryables(){return this._queryables}constructor(t,n){this.editor=t,this.options=n,this.dataSources=[],this.previewData={},this.filters=[],this._allTypes=[],this._queryables=[],this.dataSources=n.dataSources,this.filters=n.filters,this.filters.forEach((e=>{if(!e.id)throw new Error('Filter id is required');if(!e.label)throw new Error('Filter name is required');if(!e.validate)throw new Error('Filter validate is required');if(!e.output)throw new Error('Filter outputType is required');if(!e.apply)throw new Error('Filter apply is required')})),t.on(`${i} ${e}`,(()=>{this._allTypes=this.getAllTypes(),this._queryables=this.getAllQueryables()}))}getTypes(e){const t=this.dataSources.find((t=>t.id===e));if(!t)throw new Error(`Data source not found ${e}`);if(!t.isConnected())throw new Error(`Data source ${e} is not ready (not connected)`);return t.getTypes()}getType(e,t,n){if(t){const r=this.dataSources.find((e=>!t||e.id===t));if(!r)throw new Error(`Data source not found ${t}`);const i=(null==r?void 0:r.getTypes()).find((t=>t.id===e));if(!i)throw this.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Type not found ${null!=t?t:''}.${e}`,componentId:n}),new Error(`Type not found ${null!=t?t:''}.${e}`);return i}{const t=an.find((t=>t.id===e.toLowerCase()));if(t)return t;const n=this.allTypes.find((t=>t.id===e));if(!n)throw new Error(`Unknown type ${e}`);return n}}getAllTypes(){return this.dataSources.filter((e=>e.isConnected())).flatMap((e=>e.getTypes()))}getAllQueryables(){return this.dataSources.filter((e=>e.isConnected())).flatMap((e=>e.getQueryables()))}getValue(e,t,n=!0,r=null){var i;if(0===e.length)return r;const[o,...s]=e;switch(o.type){case'state':{const e=o,i=this.resolveState(e,t);if(!i)throw new Error(`Unable to resolve state: ${JSON.stringify(e)}`);const a=i[i.length-1].previewIndex;return'items'===e.storedStateId&&void 0!==a&&(i[0].isItems=!0),this.getValue(i.concat(...s),t,n,r)}case'property':{if(o.fieldId===Wt)return this.getValue(s,t,n,null===(i=o.options)||void 0===i?void 0:i.value);let e;if(null==r){if(!o.dataSourceId)throw new Error(`Data source ID is missing for token: ${JSON.stringify(o)}`);e=this.previewData[o.dataSourceId]}else e=r;let a=e?e[o.fieldId]:null;return n&&(a=this.handlePreviewIndex(a,o)),s.length>0&&!n&&(a=this.handlePreviewIndex(a,o)),o.isItems&&void 0!==o.previewIndex&&s.length>0&&(a=[a]),this.getValue(s,t,n,a)}case'filter':{const e=Object.entries(o.options).reduce(((e,[r,i])=>(e[r]=this.getValue(tn(i)||[],t,n,null),e)),{}),i=this.filters.find((e=>e.id===o.id));if(!i)throw new Error(`Filter not found: ${o.id}`);let a;try{a=i.apply(r,e)}catch(o){return console.warn(`Filter "${i.id}" error:`,o,{filter:i.id,prevValues:r,options:e,valueType:typeof r,isArray:Array.isArray(r),isNull:null===r}),this.getValue(s,t,n,r)}return(n||s.length>0)&&(a=this.handlePreviewIndex(a,o)),this.getValue(s,t,n,a)}default:throw new Error(`Unsupported token type: ${o}`)}}handlePreviewIndex(e,t){return void 0===t.previewIndex?e:Array.isArray(e)?e[t.previewIndex]:e}getAllPagesExpressions(){return this.editor.Pages.getAll().map((e=>({page:e,expressions:this.getPageExpressions(e)})))}getPageExpressions(e){return this.getComponentExpressionsRecursive(e.getMainComponent())}getComponentExpressionsRecursive(e){const t=[];return t.push(...this.getComponentExpressions(e)),e.components().forEach((e=>{t.push(...this.getComponentExpressionsRecursive(e))})),t}getComponentExpressions(e){const t=T(e,!0),n=T(e,!1);return[].concat(t.map((({expression:t})=>({expression:t,component:e})))).concat(n.map((({expression:t})=>({expression:t,component:e}))))}getTrees({expression:e,component:t},n){if(0===e.length)return[];const r=e[0];switch(r.type){case'property':{if(r.dataSourceId!==n)return[];const i=this.getTrees({expression:e.slice(1),component:t},n);return 0===i.length?[{token:r,children:[]}]:i.flatMap((e=>this.isRelative(r,e.token,n)?{token:r,children:[e]}:[{token:r,children:[]},e]))}case'filter':{const i=Object.values(r.options).map((e=>tn(e))).filter((e=>!!e&&e.length>0)).flatMap((e=>this.getTrees({expression:e,component:t},n))),o=this.getTrees({expression:e.slice(1),component:t},n);return 0===o.length?i:o.flatMap((e=>[e,...i]))}case'state':{const e=this.resolveState(r,t);if(!e)throw this.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Unable to resolve state <pre>${JSON.stringify(r)}</pre>`,componentId:t.getId()}),new Error(`Unable to resolve state ${JSON.stringify(r)}. State defined on component ${Gt(t)}`);return this.getTrees({expression:e,component:t},n)}default:throw this.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Invalid expression <pre>${JSON.stringify(e)}</pre>`,componentId:t.getId()}),new Error(`Invalid expression ${JSON.stringify(e)}. Expression used on component ${Gt(t)}`)}}isRelative(e,t,n){const r=this.getTypes(n).filter((t=>e.typeIds.includes(t.id))).flatMap((e=>e.fields.map((e=>e.typeIds)).flat()));return r.length>0&&t.typeIds.some((e=>r.includes(e)))}toTrees(e,t){return 0===e.length?[]:e.flatMap((e=>this.getTrees(e,t))).reduce(((e,t)=>{const n=e.find((e=>e[0].token.fieldId===t.token.fieldId&&(!t.token.dataSourceId||e[0].token.dataSourceId===t.token.dataSourceId)));return n?n.push(t):e.push([t]),e}),[]).map((t=>{try{return t.reduce(((e,t)=>this.mergeTrees(e,t)))}catch(n){throw this.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Unable to merge trees <pre>${JSON.stringify(t)}</pre>`,componentId:e[0].component.getId()}),n}}))}mergeTrees(e,t){if(e.token.dataSourceId!==t.token.dataSourceId)throw console.error('Unable to merge trees',e,t),new Error(`Unable to build GraphQL query: unable to merge trees ${JSON.stringify(e)} and ${JSON.stringify(t)}`);const n=e.children.filter((e=>t.children.find((t=>e.token.fieldId===t.token.fieldId&&Ct(e.token.options,t.token.options).error)))).map((e=>{const n=t.children.find((t=>e.token.fieldId===t.token.fieldId));return`${e.token.fieldId} appears twice with different options: ${JSON.stringify(e.token.options)} vs ${JSON.stringify(null==n?void 0:n.token.options)}`}));if(n.length>0)throw console.error('Unable to merge trees',n),new Error(`Unable to build GraphQL query: unable to merge trees: \n* ${n.join('\n* ')}`);const r=e.children.filter((e=>!t.children.find((t=>e.token.fieldId===t.token.fieldId&&e.token.typeIds.join(',')===t.token.typeIds.join(',')&&!Ct(e.token.options,t.token.options).error)))).concat(t.children.filter((t=>!e.children.find((e=>e.token.fieldId===t.token.fieldId&&e.token.typeIds.join(',')===t.token.typeIds.join(',')&&!Ct(e.token.options,t.token.options).error))))),i=e.children.filter((e=>t.children.find((t=>e.token.fieldId===t.token.fieldId&&e.token.typeIds.join(',')===t.token.typeIds.join(',')&&!Ct(e.token.options,t.token.options).error))));return{token:e.token,children:r.concat(i.map((e=>{const n=t.children.find((t=>e.token.fieldId===t.token.fieldId));return this.mergeTrees(e,n)})))}}resolveState(e,t){var n;const r=S(e.componentId,t);if(!r)return console.error('Component not found for state',e,t.get('id-plugin-data-source'),null===(n=t.parent())||void 0===n?void 0:n.get('id-plugin-data-source'),x(t.parent())),null;const i=I(r,e.storedStateId,e.exposed);return(null==i?void 0:i.expression)?i.expression.flatMap((e=>{var n;return'state'===e.type?null!==(n=this.resolveState(Et(e,this,t.getId()),r))&&void 0!==n?n:[]:e})):(console.warn('State is not defined on component',r.getId(),e,i),null)}}function dn(e,t=!0){if(!e||t&&'scalar'!==e.kind)return!1;const n=e.typeIds.map((e=>e.toLowerCase()));return n.includes('number')||n.includes('int')}function pn(e,t=!0){return!(!e||t&&'scalar'!==e.kind)&&e.typeIds.map((e=>e.toLowerCase())).includes('string')}function cn(e){return[{type:'filter',id:'strip_html',label:'strip_html',validate:e=>pn(e),output:e=>e,apply:e=>e.replace(/<[^>]*>/g,''),options:{}},{type:'filter',id:'append',label:'append',validate:e=>pn(e),output:e=>e,apply:(e,t)=>`${e}${t.value}`,options:{value:''},optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          name="value"
          parent-name=${i}
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${r.value||'[]'}
        >
          <label slot="label">Suffix</label>
        </state-editor>
      `},{type:'filter',id:'prepend',label:'prepend',validate:e=>pn(e),output:e=>e,apply:(e,t)=>`${t.state}${e}`,options:{value:''},optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          name="value"
          parent-name=${i}
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${r.value||'[]'}
        >
          <label slot="label">Prefix</label>
        </state-editor>
      `},{type:'filter',id:'where',label:'where',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:(e,t)=>{const{key:n,value:r}=t;return e.filter((e=>e[n]===r))},options:{key:'',value:''},quotedOptions:['key'],optionsKeys:['key','value'],optionsForm:(t,n,r,i)=>{var o;return ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${r.key||[]}
          name="key"
          root-type=${null!==(o=null==n?void 0:n.typeIds[0])&&void 0!==o?o:''}
        >
          <label slot="label">Key to filter on</label>
        </state-editor>
        <p>==</p>
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.value||[]}
          name="value"
        >
          <label slot="label">Value to match</label>
        </state-editor>
    `}},{type:'filter',id:'find',label:'find',validate:e=>!!e&&'list'===e.kind,output:e=>nn(e,'list','object'),apply:(e,t)=>{const{key:n,value:r}=t;return e.find((e=>e[n]===r))},options:{key:'',value:''},quotedOptions:['key'],optionsKeys:['key','value'],optionsForm:(t,n,r,i)=>{var o;return ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${r.key||[]}
          name="key"
          root-type=${null!==(o=null==n?void 0:n.typeIds[0])&&void 0!==o?o:''}
        >
          <label slot="label">Key to filter on</label>
        </state-editor>
        <p>==</p>
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.value||[]}
          name="value"
        >
          <label slot="label">Value to match</label>
        </state-editor>
      `}},{type:'filter',id:'first',label:'first',validate:e=>!!e&&'list'===e.kind,output:e=>nn(e,'list','object'),apply:e=>e[0],options:{}},{type:'filter',id:'last',label:'last',validate:e=>!!e&&'list'===e.kind,output:e=>nn(e,'list','object'),apply:e=>e[e.length-1],options:{}},{type:'filter',id:'join',label:'join',validate:e=>pn(e,!1)&&'list'===(null==e?void 0:e.kind),output:e=>nn(e,'list','scalar'),apply:(e,t)=>{var n;return e.join(null!==(n=t.separator)&&void 0!==n?n:',')},options:{separator:','},quotedOptions:['separator'],optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.separator||[]}
          name="separator"
        >
          <label slot="label">Separator</label>
        </state-editor>
    `},{type:'filter',id:'split',label:'split',validate:e=>pn(e),output:e=>nn(e,'scalar','list'),apply:(e,t)=>{var n;return e.split(null!==(n=t.separator)&&void 0!==n?n:',')},options:{separator:','},quotedOptions:['separator'],optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.separator||[]}
          name="separator"
        >
          <label slot="label">Separator</label>
        </state-editor>
    `},{type:'filter',id:'map',label:'map',validate:e=>!!e&&('list'===e.kind||'object'===e.kind),output:(e,t)=>function(e,t,n,r){const i=Qt();if(!t||!n)return null;const o=t.typeIds.map((e=>{var n;return i.getType(e,null!==(n=t.dataSourceId)&&void 0!==n?n:null,r)})).map((e=>null==e?void 0:e.fields.find((e=>e.label===n))));switch(o.length){case 0:return null;case 1:return o[0];default:return{id:`${t.id}.${n}`,label:`${t.label}.${n}`,typeIds:o.reduce(((e,t)=>e.concat(t.typeIds.filter((t=>!e.includes(t))))),[]),kind:'object',dataSourceId:t.dataSourceId}}}(0,e,t['key'],null),apply:(e,t)=>e.map((e=>e[t.key])),options:{key:''},quotedOptions:['key'],optionsForm:(t,n,r)=>{var i;return ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${r.key||[]}
          name="key"
          root-type=${null!==(i=null==n?void 0:n.typeIds[0])&&void 0!==i?i:''}
        >
          <label slot="label">Key to map</label>
        </state-editor>
      `}},{type:'filter',id:'reverse',label:'reverse',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:e=>e.reverse(),options:{}},{type:'filter',id:'size',label:'size',validate:e=>!!e&&'list'===e.kind,output:()=>({id:'Int',label:'Int',typeIds:['Int'],kind:'scalar'}),apply:e=>e.length,options:{}},{type:'filter',id:'at',label:'at',validate:e=>!!e&&'list'===e.kind,output:e=>nn(e,'list','object'),apply:(e,t)=>e[t.index],options:{index:0},optionsForm:(e,t,n)=>ot`
        <label>Index
          <input type="number" name="index" placeholder="Index" .value=${n.index}/>
        </label>
    `},{type:'filter',id:'slice',label:'slice',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:(e,t)=>e.slice(t.start,t.end),options:{start:0,end:0},optionsKeys:['start','end'],optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.start||[]}
          name="start"
        >
          <label slot="label">Start index</label>
        </state-editor>
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          parent-name=${i}
          data-is-input
          class="ds-state-editor__options"
          value=${r.end||[]}
          name="end"
        >
          <label slot="label">End index</label>
        </state-editor>
      `},{type:'filter',id:'sort',label:'sort',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:(e,t)=>e.sort(((e,n)=>e[t.key]<n[t.key]?-1:e[t.key]>n[t.key]?1:0)),quotedOptions:['key'],options:{key:''},optionsForm:(t,n,r)=>{var i;return ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${r.key||[]}
          name="key"
          root-type=${null!==(i=null==n?void 0:n.typeIds[0])&&void 0!==i?i:''}
        >
          <label slot="label">Key to sort on</label>
        </state-editor>
      `}},{type:'filter',id:'plus',label:'plus',validate:e=>dn(e),output:e=>e,apply:(e,t)=>e+t.value,options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'minus',label:'minus',validate:e=>dn(e),output:e=>e,apply:(e,t)=>e-t.value,options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'times',label:'times',validate:e=>dn(e),output:e=>e,apply:(e,t)=>e*t.value,options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'divided_by',label:'divided_by',validate:e=>dn(e),output:e=>e,apply:(e,t)=>e/t.value,options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'modulo',label:'modulo',validate:e=>dn(e),output:e=>e,apply:(e,t)=>e%t.value,options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'abs',label:'abs',validate:e=>dn(e),output:e=>e,apply:e=>Math.abs(e),options:{}},{type:'filter',id:'ceil',label:'ceil',validate:e=>dn(e),output:e=>e,apply:e=>Math.ceil(e),options:{}},{type:'filter',id:'floor',label:'floor',validate:e=>dn(e),output:e=>e,apply:e=>Math.floor(e),options:{}},{type:'filter',id:'round',label:'round',validate:e=>dn(e),output:e=>e,apply:e=>Math.round(e),options:{}},{type:'filter',id:'at_least',label:'at_least',validate:e=>dn(e),output:e=>e,apply:(e,t)=>Math.max(e,t.value),options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'at_most',label:'at_most',validate:e=>dn(e),output:e=>e,apply:(e,t)=>Math.min(e,t.value),options:{value:0},optionsForm:(e,t,n)=>ot`
        <label>Value
          <input type="number" name="value" placeholder="Value" .value=${n.value}/>
        </label>
      `},{type:'filter',id:'compact',label:'compact',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:e=>e.filter((e=>!!e)),options:{}},{type:'filter',id:'default',label:'default',validate:e=>!!e&&'scalar'===e.kind,output:e=>e,apply:(e,t)=>e||t.value,options:{value:''},optionsForm:(t,n,r,i)=>ot`
        <state-editor
          .selected=${t}
          .editor=${e}
          name="value"
          parent-name=${i}
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${r.value||'[]'}
        >
          <label slot="label">Default value</label>
        </state-editor>
      `},{type:'filter',id:'escape',label:'escape',validate:e=>pn(e),output:e=>e,apply:e=>e.replace(/"/g,'\\"'),options:{}},{type:'filter',id:'escape_once',label:'escape_once',validate:e=>pn(e),output:e=>e,apply:e=>e.replace(/"/g,'\\"'),options:{}},{type:'filter',id:'newline_to_br',label:'newline_to_br',validate:e=>pn(e),output:e=>e,apply:e=>e.replace(/\n/g,'<br />'),options:{}},{type:'filter',id:'strip_newlines',label:'strip_newlines',validate:e=>pn(e),output:e=>e,apply:e=>e.replace(/\n/g,''),options:{}},{type:'filter',id:'truncate',label:'truncate',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.slice(0,t.length),options:{length:50},optionsForm:(e,t,n)=>ot`
        <label>Length
          <input type="number" name="length" placeholder="Length" .value=${n.length}/>
        </label>
      `},{type:'filter',id:'truncatewords',label:'truncatewords',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.split(' ').slice(0,t.length).join(' '),options:{length:15},optionsForm:(e,t,n)=>ot`
        <label>Length
          <input type="number" name="length" placeholder="Length" .value=${n.length}/>
        </label>
      `},{type:'filter',id:'date',label:'date',validate:e=>function(e,t=!0){return!(!e||t&&'scalar'!==e.kind)&&e.typeIds.map((e=>e.toLowerCase())).some((e=>['date','instant'].includes(e)))}(e),output:()=>({id:'String',label:'String',typeIds:['String'],kind:'scalar'}),apply:(e,t)=>new Date(e).toLocaleDateString(t.format),options:{format:'%a, %b %d, %y',timeZone:''},optionsKeys:['format','timeZone'],quotedOptions:['format','timeZone'],optionsForm:(e,t,n)=>ot`
        <label>Format
          <input type="text" name="format" placeholder="Format" .value=${n.format||'%a, %b %d, %y'}/>
        </label>
        <label>Time zone
          <input type="text" name="timeZone" placeholder="Time zone" .value=${n.timeZone||''}/>
        </label>
      `},{type:'filter',id:'replace',label:'replace',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.replace(t.search,t.replace),options:{search:'',replace:''},quotedOptions:['search','replace'],optionsKeys:['search','replace'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
        <label>Replace
          <input type="text" name="replace" placeholder="Replace" .value=${n.replace}/>
        </label>
      `},{type:'filter',id:'replace_first',label:'replace_first',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.replace(t.search,t.replace),options:{search:'',replace:''},quotedOptions:['search','replace'],optionsKeys:['search','replace'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
        <label>Replace
          <input type="text" name="replace" placeholder="Replace" .value=${n.replace}/>
        </label>
      `},{type:'filter',id:'replace_last',label:'replace_last',validate:e=>pn(e),output:e=>e,apply:(e,t)=>{const n=e.lastIndexOf(t.search);return-1===n?e:e.slice(0,n)+t.replace+e.slice(n+t.search.length)},options:{search:'',replace:''},quotedOptions:['search','replace'],optionsKeys:['search','replace'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
        <label>Replace
          <input type="text" name="replace" placeholder="Replace" .value=${n.replace}/>
        </label>
      `},{type:'filter',id:'remove',label:'remove',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.replace(t.search,''),options:{search:''},quotedOptions:['search'],optionsKeys:['search'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
      `},{type:'filter',id:'remove_first',label:'remove_first',validate:e=>pn(e),output:e=>e,apply:(e,t)=>e.replace(t.search,''),options:{search:''},quotedOptions:['search'],optionsKeys:['search'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
      `},{type:'filter',id:'remove_last',label:'remove_last',validate:e=>pn(e),output:e=>e,apply:(e,t)=>{const n=e.lastIndexOf(t.search);return-1===n?e:e.slice(0,n)+e.slice(n+t.search.length)},options:{search:''},quotedOptions:['search'],optionsKeys:['search'],optionsForm:(e,t,n)=>ot`
        <label>Search
          <input type="text" name="search" placeholder="Search" .value=${n.search}/>
        </label>
      `},{type:'filter',id:'downcase',label:'downcase',validate:e=>pn(e),output:e=>e,apply:e=>e?e.toLowerCase():'',options:{}},{type:'filter',id:'upcase',label:'upcase',validate:e=>pn(e),output:e=>e,apply:e=>e?e.toUpperCase():'',options:{}},{type:'filter',id:'capitalize',label:'capitalize',validate:e=>pn(e),output:e=>e,apply:e=>e.charAt(0).toUpperCase()+e.slice(1).toLowerCase(),options:{}},{type:'filter',id:'sample',label:'sample',validate:e=>!!e&&'list'===e.kind,output:e=>e,apply:(e,t)=>{const n=parseInt(t.count||'1');return console.log({count:n,options:t}),e.sort((()=>.5-Math.random())).slice(0,n)},options:{count:'1'},optionsForm:(e,t,n)=>ot`
        <label>Count
          <input type="number" name="count" placeholder="Count" .value=${n.count}/>
        </label>
      `}]}function un(e,t,n){const r=n.getPageExpressions(e);return Ft().map((e=>{if(!e.isConnected())return console.error('The data source is not yet connected, the value for this page can not be loaded'),{dataSourceId:e.id.toString(),query:''};const i=r.map((e=>({component:e.component,expression:e.expression.flatMap((r=>{switch(r.type){case'property':case'filter':return r;case'state':{const i=n.resolveState(r,e.component);if(!i)throw t.runCommand('notifications:add',{type:'error',group:Bt,message:`Unable to resolve state ${JSON.stringify(r)}. State defined on component ${Gt(e.component)}`,componentId:e.component.getId()}),new Error(`Unable to resolve state ${JSON.stringify(r)}. State defined on component ${Gt(e.component)}`);return i}}}))}))).filter((t=>{const n=t.expression;if(0===n.length)return!1;const r=n[0];return(null==r?void 0:r.dataSourceId)===e.id})),o=n.toTrees(i,e.id);if(0===o.length)return{dataSourceId:e.id.toString(),query:''};const s=e.getQuery(o);return{dataSourceId:e.id.toString(),query:s}})).filter((e=>!!e.query)).reduce(((e,{dataSourceId:t,query:n})=>(e[t]=n,e)),{})}var hn=void 0&&(void 0).__awaiter||function(e,t,n,r){return new(n||(n=Promise))((function(i,o){function s(e){try{l(r.next(e))}catch(e){o(e)}}function a(e){try{l(r["throw"](e))}catch(e){o(e)}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,a)}l((r=r.apply(e,t||[])).next())}))};let fn=null;function gn(){if(!fn)throw new Error('PreviewDataLoader not initialized. Call initializePreviewDataLoader first.');return fn}function vn(){return hn(this,arguments,void 0,(function*(e=!1){const t=gn();t.editor.trigger(p);const n=t.editor.Pages.getSelected();if(!n)return;const r=un(n,t.editor,t.dataTree),i=!function(e,t){const n=Object.keys(e).sort(),r=Object.keys(t).sort();return n.length===r.length&&!!n.every((e=>r.includes(e)))&&n.every((n=>e[n]===t[n]))}(t.lastQueries,r);if(!e&&!i)return void t.editor.trigger(c,t.dataTree.previewData);t.lastQueries=Object.assign({},r),t.currentUpdatePid++;const o=yield function(e){return hn(this,void 0,void 0,(function*(){const t=gn(),n=t.currentUpdatePid,r=un(e,t.editor,t.dataTree);t.dataTree.previewData={};try{const e=yield Promise.all(Object.entries(r).map((e=>hn(this,[e],void 0,(function*([e,r]){if(n!==t.currentUpdatePid)return;const i=Ft().find((t=>t.id===e));if(!i)return console.error(`Data source ${e} not found`),null;if(!i.isConnected())return console.warn(`Data source ${e} is not connected.`),null;try{const n=yield i.fetchValues(r);return t.dataTree.previewData[e]=n,{dataSourceId:e,value:n}}catch(n){return console.error(`Error fetching preview data for data source ${e}:`,n),t.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Error fetching preview data for data source ${e}: ${n}`}),null}})))));return n!==t.currentUpdatePid?'interrupted':e.filter((e=>null!==e)).reduce(((e,t)=>{const{dataSourceId:n,value:r}=t;return e[n]=r,e}),{})}catch(e){return console.error('Error while fetching preview data:',e),t.editor.runCommand('notifications:add',{type:'error',group:Bt,message:`Error while fetching preview data: ${e}`}),{}}}))}(n);'interrupted'!==o?t.editor.trigger(c,o):(console.warn(`Preview data update process for PID ${t.currentUpdatePid} was interrupted.`),t.editor.trigger(u,o))}))}void 0&&(void 0).__awaiter;let yn=null;function mn(n,r,s){const a=function(e,t){return'string'==typeof t.filters?[...cn(e)]:t.filters.flatMap((t=>{if('string'==typeof t){if('liquid'===t)return cn(e);throw new Error(`Unknown filters ${t}`)}return[Object.assign(Object.assign({},t),{type:'filter'})]})).map((e=>Object.assign(Object.assign({},e),{type:'filter'})))}(r,s);!function(e){Dt={dataSources:[],editor:e}}(r),zt(n);const l=new ln(r,{dataSources:Ft(),filters:a});!function(e,t){fn={editor:e,dataTree:t,currentUpdatePid:0,lastQueries:{}}}(r,l);const d={dataChangedBinded:e=>{r.trigger(i,null==e?void 0:e.detail)},dataSourceReadyBinded:t=>{r.trigger(e,t),vn(!0)},dataSourceErrorBinded:(e,n)=>{r.trigger(t,e,n)}};var p;yn={dataTree:l,editor:r,options:s,eventListeners:d},xn(),r.on(i,(()=>{xn()})),p=(e,t)=>{vn().then((()=>r.trigger(o,{state:e,component:t})))},A.push(p)}function bn(){if(!yn)throw new Error('DataSourceManager not initialized. Call initializeDataSourceManager first.');return yn}function $n(){vn(!0)}function _n(){return bn().dataTree}function xn(){const n=bn(),r=Ft();n.dataTree.dataSources=[...r],r.forEach((r=>{'function'==typeof r.off&&(r.off(e,n.eventListeners.dataSourceReadyBinded),r.off(i,n.eventListeners.dataChangedBinded),r.off(t,n.eventListeners.dataSourceErrorBinded))})),r.forEach((r=>{'function'==typeof r.on&&(r.on(e,n.eventListeners.dataSourceReadyBinded),r.on(i,n.eventListeners.dataChangedBinded),r.on(t,n.eventListeners.dataSourceErrorBinded))}))}let wn=!0;function Sn(e){e.refresh()}var An=void 0&&(void 0).__awaiter||function(e,t,n,r){return new(n||(n=Promise))((function(i,o){function s(e){try{l(r.next(e))}catch(e){o(e)}}function a(e){try{l(r["throw"](e))}catch(e){o(e)}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,a)}l((r=r.apply(e,t||[])).next())}))};const En=e=>{e.on('storage:start:store',(e=>{e.dataSources=Ft().filter((e=>void 0===e.readonly||!1===e.readonly)).map((e=>({id:e.id,label:e.label,url:e.url,type:e.type,method:e.method,headers:e.headers,readonly:e.readonly,hidden:e.hidden})))})),e.on('storage:end:load',(e=>An(void 0,void 0,void 0,(function*(){const t=(e.dataSources||[]).map((e=>new Ut(e)));yield Promise.all(t.map((e=>e.connect())));!function(e){zt(e),xn()}(Ft().filter((e=>!0===e.readonly))),yield Promise.all(t.map((e=>(qt(e),e.connect())))),$n()}))))},kn=`\n  :root {\n    --ds-primary: #d278c9;\n    --ds-secondary: #ddd;\n    --ds-tertiary: #3d3d3d;\n    --ds-highlight: #d278c9;\n    --ds-lowlight: #363636;\n    --ds-button-color: #fff;\n    --ds-button-bg: #606060;\n    --ds-button-border: var(--ds-button-bg);\n\n    --expression-input-dirty-background-color: var(--ds-lowlight);\n    --expression-input-dirty-border-color: var(--ds-lowlight);\n    --expression-input-dirty-color: var(--ds-highlight);\n    --expression-input-active-color: var(--ds-secondary);\n    --expression-input-active-background-color: var(--ds-button-bg);\n    --popin-dialog-background: var(--ds-secondary);\n    --popin-dialog-color: var(--ds-tertiary);\n    --popin-dialog-header-background: transparent;\n    --popin-dialog-body-background: transparent;\n    --popin-dialog-footer-background: transparent;\n    --expression-input-placeholder-margin: 0 10px;\n    --expression-input-item-button-margin: 0;\n    --expression-input-item-button-padding: 2px;\n    --expression-input-item-button-border-radius: 50%;\n    --expression-input-item-button-width: 20px;\n    --expression-input-item-button-height: 20px;\n    --expression-input-item-button-background-color: transparent;\n    --expression-input-item-button-color: var(--ds-button-color);\n    --expression-input-separator-color: var(--ds-button-color);\n    --expression-input-separator-font-size: 0.7em;\n    --expression-input-separator-margin: 0;\n    --expression-input-separator-padding: 0 3px 0 1px;\n    --expression-input-item-arrow-padding: 5px 5px 0 5px;\n    --expression-input-values-li-icon-margin-right: 0;\n    /*\n    --popin-dialog-header-color: #333;\n    --popin-dialog-body-color: #666;\n    --popin-dialog-footer-color: #333;\n    --popin-dialog-header-border-bottom: none;\n    --popin-dialog-footer-border-top: none;\n    --popin-dialog-header-padding: 0;\n    --popin-dialog-body-padding: 5px;\n    --popin-dialog-footer-padding: 0;\n    */\n  }\n  .ds-state-editor__options {\n    --ds-secondary: #363636;\n    --ds-tertiary: #ffffff;\n    --ds-lowlight: #ddd;\n    --ds-button-color: #606060;\n    --ds-button-bg: #fff;\n    --expression-input-dirty-background-color: var(--ds-lowlight);\n    --expression-input-dirty-border-color: var(--ds-lowlight);\n    --expression-input-dirty-color: var(--ds-highlight);\n    --expression-input-active-color: var(--ds-secondary);\n    --expression-input-active-background-color: var(--ds-button-bg);\n  }\n  .gjs-traits-label {\n    font-family: "Ubuntu", sans-serif;\n    font-size: 0.85rem;\n    padding: 9px 10px 9px 20px;\n    text-align: left;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n  }\n  expression-input {\n    padding: 10px;\n    display: block;\n  }\n  expression-input::part(separator__delete) {\n    border-right: 1px solid var(--ds-button-border);\n    height: 20px;\n  }\n  expression-input::part(add-button) {\n    background-color: rgba(255,255,255,.15);\n    border-radius: 2px;\n    padding: 3px;\n    margin: 0;\n    border: 1px solid rgba(0,0,0,.15);\n    width: 24px;\n    height: 24px;\n    box-sizing: border-box;\n    cursor: pointer;\n  }\n  expression-input::part(delete-button) {\n    margin: 0;\n    padding: 0;\n    display: flex;\n    justify-content: center;\n    color: var(--ds-button);\n  }\n  expression-input::part(header) {\n    border: none;\n  }\n  expression-input::part(type) {\n    padding-bottom: 0;\n    padding-top: 4px;\n    display: none;\n  }\n  expression-input::part(name) {\n    font-weight: normal;\n    padding-bottom: 0;\n    padding-top: 0;\n    padding-left: 5px;\n  }\n  expression-input::part(property-input) {\n    padding: 4px;\n    border: medium;\n    flex: 1 1 auto;\n    background-color: transparent;\n    color: var(--ds-secondary);\n  }\n  expression-input::part(property-container) {\n    background-color: var(--ds-lowlight);\n    border-radius: 2px;\n    box-sizing: border-box;\n    padding: 5px;\n    margin: 5px 0;\n  }\n  expression-input::part(scroll-container) {\n    overflow: auto;\n    box-sizing: border-box;\n\n    /* inner shadow to make it visible when content is overflowing */\n    box-shadow: inset 0 0 5px 0 rgba(0,0,0,.2);\n\n  }\n  expression-input::part(steps-container) {\n    display: flex;\n    align-items: center;\n    background-color: rgba(0,0,0,.2);\n    border-radius: 2px;\n    padding: 5px;\n    margin: 5px 0;\n    width: max-content;\n    min-width: 100%;\n    box-sizing: border-box;\n  }\n  expression-input::part(dirty-icon) {\n    cursor: pointer;\n    margin: 0 10px;\n    color: var(--ds-highlight);\n  }\n  expression-input::part(dirty-icon) {\n    color: var(--ds-highlight);\n    vertical-align: bottom;\n    display: inline-flex;\n    margin: 0;\n  }\n  expression-input::part(expression-input-item) {\n    border: 1px solid rgba(0,0,0,.15);\n    background-color: rgba(255,255,255,.15);\n    border-radius: 2px;\n    margin-right: 5px;\n  }\n  .ds-section {\n    &:last-child {\n      margin-bottom: 100px;\n    }\n    details {\n      margin: 2px;\n      padding: 10px;\n      padding-top: 0;\n      background-color: transparent;\n      border-radius: 2px;\n      color: var(--ds-secondary);\n      text-align: left;\n    }\n    details[open] {\n      background-color: var(--ds-tertiary);\n    }\n    details summary {\n      color: var(--ds-secondary);\n      cursor: pointer;\n      padding: 10px 0;\n    }\n    details a {\n      color: var(--ds-link-color);\n    }\n    details .ds-states__help-link {\n      display: block;\n    }\n    .gjs-traits-label {\n      background-color: var(--ds-tertiary);\n    }\n    main {\n      display: flex;\n      flex-direction: column;\n    }\n    .ds-slot-fixed {\n      width: 100%;\n    }\n    select {\n      width: 150px;\n      flex: 0;\n      margin: 5px;\n      padding: 5px;\n      background-color: var(--ds-tertiary);\n      border-radius: 2px;\n      color: var(--ds-secondary);\n      border: 1px solid rgba(0,0,0,.15);\n      cursor: pointer;\n      font-size: medium;\n    }\n    input.ds-expression-input__fixed {\n      color: var(--ds-secondary);\n      padding: 10px;\n      border: none;\n      background-color: transparent;\n      width: 100%;\n      box-sizing: border-box;\n    }\n    .ds-expression-input__add {\n      max-width: 40px;\n      text-align: center;\n      font-size: large;\n      padding-right: 9px;\n      -webkit-appearance: none;\n      -moz-appearance: none;\n      text-indent: 1px;\n      text-overflow: '';\n    }\n    .ds-expression-input__add option {\n      font-size: medium;\n    }\n    .ds-expression-input__options-button {\n      background-color: transparent;\n      border: none;\n      color: var(--ds-secondary);\n      cursor: pointer;\n      padding: 0;\n      margin: 10px;\n      margin-left: 0;\n    }\n    label.ds-label {\n      display: flex;\n      align-items: center;\n      padding: 10px;\n      color: var(--ds-secondary);\n    }\n    label.ds-label--disabled {\n      justify-content: space-between;\n    }\n    label.ds-label--disabled .ds-label__message {\n      opacity: .5;\n    }\n    select.ds-visibility__condition-operator {\n      margin: 10px;\n    }\n  }\n  /* States CSS Styles */\n  .ds-states {\n    display: flex;\n    flex-direction: column;\n  }\n    .ds-states__buttons {\n      display: flex;\n      flex-direction: row;\n      justify-content: flex-end;\n      margin: 0 5px;\n    }\n    .ds-states__button {\n      cursor: pointer;\n      border: 1px solid var(--ds-button-border);\n      border-radius: 2px;\n      padding: 5px;\n      background: var(--ds-button-bg);\n      color: var(--ds-button-color);\n      flex: 1;\n      margin: 5px;\n      max-width: 40px;\n    }\n    .ds-states__button--disabled {\n      opacity: 0.5;\n      cursor: default;\n    }\n    .ds-states__remove-button {\n      margin-left: 1em;\n    }\n    .ds-states__sep {\n      width: 100%;\n      border: none;\n      height: 1px;\n      background: var(--ds-button-bg);\n    }\n  /* real data */\n  .ds-real-data {\n    code {\n      overflow-x: hidden;\n      text-wrap: nowrap;\n      display: block;\n      padding: 0 10px;\n      text-overflow: ellipsis;\n      margin-top: -5px;\n      margin-bottom: 10px;\n      text-align: right;\n    }\n    .ds-real-data__preview-index {\n      display: flex;\n      input {\n        margin: 10px;\n      }\n      input[type="range"] {\n        flex-grow: 1;\n      }\n      input[type="number"] {\n        color: white;\n        background-color: var(--ds-lowlight);\n        border-radius: 2px;\n        box-sizing: border-box;\n        margin: 10px;\n        border: none;\n        padding: 5px;\n        padding-left: 10px;\n      }\n    }\n  }\n`,{I:Tn}=Le,In=()=>document.createComment(""),On=(e,t,n)=>{const r=e._$AA.parentNode,i=void 0===t?e._$AB:t._$AA;if(void 0===n){const t=r.insertBefore(In(),i),o=r.insertBefore(In(),i);n=new Tn(t,o,e,e.options)}else{const t=n._$AB.nextSibling,o=n._$AM,s=o!==e;if(s){let t;n._$AQ?.(e),n._$AM=e,void 0!==n._$AP&&(t=e._$AU)!==o._$AU&&n._$AP(t)}if(t!==i||s){let e=n._$AA;for(;e!==t;){const t=e.nextSibling;r.insertBefore(e,i),e=t}}}return n},Cn=(e,t,n=e)=>(e._$AI(t,n),e),jn={},Nn=e=>{e._$AP?.(!1,!0);let t=e._$AA;const n=e._$AB.nextSibling;for(;t!==n;){const e=t.nextSibling;t.remove(),t=e}},Rn=1,Pn=2,Ln=e=>(...t)=>({_$litDirective$:e,values:t});class Un{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}const Dn=(e,t)=>{const n=e._$AN;if(void 0===n)return!1;for(const e of n)e._$AO?.(t,!1),Dn(e,t);return!0},Mn=e=>{let t,n;do{if(void 0===(t=e._$AM))break;n=t._$AN,n.delete(e),e=t}while(0===n?.size)},Fn=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(void 0===n)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),Vn(t)}};function qn(e){void 0!==this._$AN?(Mn(this),this._$AM=e,Fn(this)):this._$AM=e}function Hn(e,t=!1,n=0){const r=this._$AH,i=this._$AN;if(void 0!==i&&0!==i.size)if(t)if(Array.isArray(r))for(let e=n;e<r.length;e++)Dn(r[e],!1),Mn(r[e]);else null!=r&&(Dn(r,!1),Mn(r));else Dn(this,e)}const Vn=e=>{e.type==Pn&&(e._$AP??=Hn,e._$AQ??=qn)};class zn extends Un{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,n){super._$AT(e,t,n),Fn(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(Dn(this,e),Mn(this))}setValue(e){if((e=>void 0===e.strings)(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}const Bn=()=>new Qn;class Qn{}const Gn=new WeakMap,Kn=Ln(class extends zn{render(e){return xe}update(e,[t]){const n=t!==this.G;return n&&void 0!==this.G&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),xe}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){const t=this.ht??globalThis;let n=Gn.get(t);void 0===n&&(n=new WeakMap,Gn.set(t,n)),void 0!==n.get(this.G)&&this.G.call(this.ht,void 0),n.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?Gn.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Jn=(e,t,n)=>{const r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},Wn=Ln(class extends Un{constructor(e){if(super(e),e.type!==Pn)throw Error("repeat() can only be used in text expressions")}dt(e,t,n){let r;void 0===n?n=t:void 0!==t&&(r=t);const i=[],o=[];let s=0;for(const t of e)i[s]=r?r(t,s):s,o[s]=n(t,s),s++;return{values:o,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,r]){const i=(e=>e._$AH)(e),{values:o,keys:s}=this.dt(t,n,r);if(!Array.isArray(i))return this.ut=s,o;const a=this.ut??=[],l=[];let d,p,c=0,u=i.length-1,h=0,f=o.length-1;for(;c<=u&&h<=f;)if(null===i[c])c++;else if(null===i[u])u--;else if(a[c]===s[h])l[h]=Cn(i[c],o[h]),c++,h++;else if(a[u]===s[f])l[f]=Cn(i[u],o[f]),u--,f--;else if(a[c]===s[f])l[f]=Cn(i[c],o[f]),On(e,l[f+1],i[c]),c++,f--;else if(a[u]===s[h])l[h]=Cn(i[u],o[h]),On(e,i[c],i[u]),u--,h++;else if(void 0===d&&(d=Jn(s,h,f),p=Jn(a,c,u)),d.has(a[c]))if(d.has(a[u])){const t=p.get(s[h]),n=void 0!==t?i[t]:null;if(null===n){const t=On(e,i[c]);Cn(t,o[h]),l[h]=t}else l[h]=Cn(n,o[h]),On(e,i[c],n),i[t]=null;h++}else Nn(i[u]),u--;else Nn(i[c]),c++;for(;h<=f;){const t=On(e,l[f+1]);Cn(t,o[h]),l[h++]=t}for(;c<=u;){const e=i[c++];null!==e&&Nn(e)}return this.ut=s,((e,t=jn)=>{e._$AH=t})(e,l),_e}}),Yn={attribute:!0,type:String,converter:W,reflect:!1,hasChanged:Y},Zn=(e=Yn,t,n)=>{const{kind:r,metadata:i}=n;let o=globalThis.litPropertyMetadata.get(i);if(void 0===o&&globalThis.litPropertyMetadata.set(i,o=new Map),"setter"===r&&((e=Object.create(e)).wrapped=!0),o.set(n.name,e),"accessor"===r){const{name:r}=n;return{set(n){const i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e)},init(t){return void 0!==t&&this.C(r,void 0,e,t),t}}}if("setter"===r){const{name:r}=n;return function(n){const i=this[r];t.call(this,n),this.requestUpdate(r,i,e)}}throw Error("Unsupported decorator location: "+r)};function Xn(e){return(t,n)=>"object"==typeof n?Zn(e,t,n):((e,t,n)=>{const r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}var er=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s},tr=void 0&&(void 0).__metadata||function(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)};const nr=U`
    :host {
      font-family: var(--gjs-main-font);
      font-size: var(--gjs-font-size);
    }
    .ds-field {
      padding: 10px;
    }
    .ds-field > span {
      display: block;
    }
    hr.ds-separator {
      border: none;
      border-top: 1px solid var(--ds-button-bg);
    }
    .ds-field input,
    .ds-field select {
      background-color: var(--gjs-main-dark-color);
      border: none;
      box-shadow: none;
      border-radius: 2px;
      box-sizing: border-box;
      padding: 0;
      position: relative;

      padding: 10px;
      color: inherit;
      width: 100%;
    }
    .ds-btn-prim {
      color:inherit;
      background-color:var(--gjs-main-light-color);
      border-radius:2px;
      padding:3px 6px;
      padding:var(--gjs-input-padding);
      cursor:pointer;
      border:none
    }
    .ds-btn-prim:active {
      background-color:var(--gjs-main-light-color)
    }
    .ds-btn-danger {
      color: var(--gjs-light-color);
      background-color: transparent;
    }
    .ds-btn-danger:hover {
      color: var(--ds-highlight);
    }
    [disabled],
    [readonly] {
      font-style: italic;
    }
`;function rr(e,t,n){xt(ot`
    <ds-settings
      ${Kn(t)}
      .dataSources=${[]}
      @change=${e=>{const t=e.detail;console.log('Data source changed:',t)}}
      @add=${e=>{const t=e.detail;qt(new Ut(t))}}
      @add-top=${e=>{const t=e.detail;qt(new Ut(t))}}
      @delete=${e=>{Ht(e.detail)}}
      ></ds-settings>
  `,n)}class ir extends St{constructor(){super(),this.dataSources=[]}connectedCallback(){super.connectedCallback()}render(){const e=Bn(),t=on(this.dataSources.length.toString());return ot`
    <section>
    <!--
      <button
        type="button"
        class="ds-btn-prim ds-btn-prim--icon"
        @click=${()=>{this.dispatchEvent(new CustomEvent('add-top',{detail:t}))}}>\u2795</button>
    -->
      <hr class="ds-separator">
      ${Wn(this.dataSources.filter((e=>!e.hidden)),(e=>e.id),(t=>ot`
        <ds-settings__data-source
          ${Kn(e)}
          .dataSource=${t}
          @change=${e=>{e.preventDefault(),e.stopImmediatePropagation(),this.dispatchEvent(new CustomEvent('change',{detail:t}))}}
          @delete=${()=>{this.dispatchEvent(new CustomEvent('delete',{detail:t}))}}
          ></ds-settings__data-source>
          <hr class="ds-separator">
      `))}
      <button
        type="button"
        class="ds-btn-prim ds-btn-prim--large"
        @click=${()=>{this.dispatchEvent(new CustomEvent('add',{detail:t}))}}>Add a Data Source</button>
    </section>
    `}}ir.styles=[nr,U`
      .ds-btn-prim--large {
        padding: 10px;
        margin: auto;
        display: block;
      }
      .ds-btn-prim--icon {
        background-color: var(--ds-primary);
        position: absolute;
        right: 20px;
      }
    `],er([Xn({type:Array}),tr("design:type",Array)],ir.prototype,"dataSources",void 0),customElements.get('ds-settings')||customElements.define('ds-settings',ir);class or extends St{constructor(){super(),this.errorMessage='',this.connected=!1,this.dataSource=null}connectedCallback(){super.connectedCallback()}connectDataSource(){if(!this.dataSource)throw new Error('No data source provided');this.dataSource.connect().then((()=>{this.dispatchEvent(new CustomEvent('change')),this.errorMessage='',this.connected=!0,this.requestUpdate()})).catch((e=>{console.error('Data source connection error',{err:e}),this.errorMessage=e.message,this.connected=!1,this.requestUpdate()}))}render(){if(!this.dataSource)throw new Error('No data source provided');const e=Bn();return ot`
    <form
      ?readonly=${!1!==this.dataSource.readonly}
      @submit=${e=>{e.preventDefault(),e.stopImmediatePropagation(),this.connectDataSource()}}
      >
      <h3 class="ds-property__title">
        ${this.dataSource.label||'Unnamed'}
        <small>${!1!==this.dataSource.readonly?' (Read-only)':''}</small>
      </h3>
      <div class="ds-property__wrapper ds-property__wrapper--horiz">
      <label class="ds-field">
        <span>Label</span>
        <input
          type="text"
          name="label"
          value=${this.dataSource.label}
          @input=${e=>{this.dataSource&&(this.dataSource.label=e.target.value),this.requestUpdate()}}
          ?readonly=${!1!==this.dataSource.readonly}
          />
      </label>
      <label class="ds-field ds-field--large">
        <span>URL</span>
        <input
          type="url"
          name="url"
          value=${this.dataSource.url}
          @change=${e=>{this.dataSource&&(this.dataSource.url=e.target.value)}}
          ?readonly=${!1!==this.dataSource.readonly}
          />
      </label>
      <label class="ds-field">
        <span>ID</span>
        <input
          type="text"
          name="id"
          value=${this.dataSource.id}
          readonly
          disabled
          />
      </label>
      <label class="ds-field">
        <span>Type</span>
        <select
          name="type"
          readonly
          disabled
          >
          <option value="graphql" selected>GraphQL</option>
        </select>
      </label>
      <label class="ds-field">
        <span>Method</span>
        <select
          name="method"
          @change=${e=>{this.dataSource&&(this.dataSource.method=e.target.value)}}
          ?readonly=${!1!==this.dataSource.readonly}
          ?disabled=${!1!==this.dataSource.readonly}
          >
          <option value="POST" ?selected=${'POST'===this.dataSource.method}>POST</option>
          <option value="GET" ?selected=${'GET'===this.dataSource.method}>GET</option>
        </select>
      </label>
      </div>
      <div class="ds-field">
        <details>
          <summary>HTTP Headers</summary>
          <ds-settings__headers
            ${Kn(e)}
            .headers=${this.dataSource.headers}
            @change=${()=>{var t,n;this.dataSource&&(this.dataSource.headers=(null===(t=e.value)||void 0===t?void 0:t.headers)||{}),null===(n=e.value)||void 0===n||n.requestUpdate()}}
            ?readonly=${!1!==this.dataSource.readonly}
            ></ds-settings__headers>
        </details>
        <div class="ds-field ds-button-bar">
          <div>
            <div>
              <p>Status: ${this.dataSource.isConnected()?'✓ Connected':'✗ Unknown'}</p>
              <p>${this.errorMessage}</p>
            </div>
          </div>
          <div class="ds-no-resize">
            <div>
              ${!1!==this.dataSource.readonly?'':ot`
                <button
                  type="button"
                  class="ds-btn-prim ds-btn-danger"
                  @click=${()=>{this.dispatchEvent(new CustomEvent('delete'))}}
                >Delete</button>
              `}
              <button
                type="submit"
                class="ds-btn-prim ds-btn-primary"
                >Test connection</button>
            </div>
          </div>
        </div>
      </div>
    </form>
    `}}or.styles=[U`
    form {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    form :focus {
      outline: 1px solid var(--ds-highlight);
    }
    .ds-field--large {
      flex: 1 1 auto;
    }
    .ds-property__wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex-wrap: wrap;
    }
    .ds-property__wrapper--horiz {
      flex-direction: row;
    }
    .ds-property__wrapper--vert {
      flex-direction: column;
    }
    .ds-button-bar {
      display: flex;
      justify-content: space-between;
    }
    .ds-no-resize {
      flex: 0 0 auto;
    }
    `,nr],er([Xn({type:Object}),tr("design:type",Object)],or.prototype,"dataSource",void 0),customElements.get('ds-settings__data-source')||customElements.define('ds-settings__data-source',or);class sr extends St{constructor(){super(),this.headers={},this.readonly=!1}connectedCallback(){super.connectedCallback()}render(){return ot`
      <div class="ds-field">
      <fieldset>
      ${this.readonly?'':ot`
        <button
          type="button"
          class="ds-btn-prim"
          @click=${()=>{let e='Authorization',t='Bearer XXXXXX',n=0;for(;void 0!==this.headers[e];)n++,e=`Header ${n}`,t='';this.headers=Object.assign(Object.assign({},this.headers),{[e]:t}),this.dispatchEvent(new CustomEvent('change'))}}
        >Add a header</button>
      `}
      <ul>
        ${Object.entries(this.headers).map((([e,t])=>ot`
          <li>
            <label class="ds-field">
              <span>Name</span>
              <input
                type="text"
                value=${e}
                name=${`header-key-${encodeURI(e)}`}
                @change=${n=>{const r=n.target;r.value&&(void 0!==this.headers[e]&&delete this.headers[e],this.headers[r.value]=t,this.dispatchEvent(new CustomEvent('change')))}}
                />
            </label>
            <label class="ds-field">
              <span>Value</span>
              <input
                type="text"
                value=${t}
                name=${`header-value-${encodeURI(t)}`}
                @change=${t=>{const n=t.target;this.headers[e]=n.value,this.dispatchEvent(new CustomEvent('change'))}}
                />
            </label>
            ${this.readonly?'':ot`
              <button
                type="button"
                class="ds-btn-prim"
                @click=${()=>{void 0!==this.headers[e]&&delete this.headers[e],this.dispatchEvent(new CustomEvent('change'))}}
                .disabled=${this.readonly}
              >Delete</button>
            `}
          </li>
        `))}
      </ul>
      </fieldset>
      </div>
    `}}sr.styles=[U`
    fieldset {
      display: block;
      border: none;
      padding: 0;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    ul > li {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    ul > li > label {
      flex: 1 1 auto;
    }
    ul > li > button {
      margin: 10px;
    }
    `,nr],er([Xn({type:Array}),tr("design:type",Object)],sr.prototype,"headers",void 0),er([Xn({type:Boolean}),tr("design:type",Boolean)],sr.prototype,"readonly",void 0),customElements.get('ds-settings__headers')||customElements.define('ds-settings__headers',sr);const ar=Ln(class extends Un{constructor(e){if(super(e),e.type!==Rn||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter((t=>e[t])).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter((e=>""!==e))));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const n=e.element.classList;for(const e of this.st)e in t||(n.remove(e),this.st.delete(e));for(const e in t){const r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return _e}}),lr=U`
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
`,dr=(U`
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
`,U`
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
`);var pr=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s};class cr extends St{get selectTagName(){return this._selectTagName}set selectTagName(e){this._selectTagName=e,this.SELECT_QUERY=`:scope > ${this._selectTagName}`,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${this._optionTagName}, :scope > ${this._selectTagName} > optgroup > ${this._optionTagName}`,this.requestUpdate()}get optionTagName(){return this._optionTagName}set optionTagName(e){this._optionTagName=e,this.OPTION_QUERY=`:scope > ${this._selectTagName} > ${e}, :scope > ${this._selectTagName} > optgroup > ${e}`,this.requestUpdate()}constructor(){super(),this.SELECT_QUERY=':scope > select, :scope > custom-select',this.OPTION_QUERY=':scope > select > option, :scope > select > optgroup > option, :scope > custom-select > custom-option',this.for='',this.name='',this.reactive=!1,this._selectTagName='select',this._optionTagName='option',this._form=null,this.onChange_=this.onChangeValue.bind(this),this.onFormdata=e=>{if(!this.name)throw new Error('Attribute name is required for input-chain');this.options.filter((e=>e.selected)).forEach((t=>{e.formData.append(this.name,t.value)}))},this.redrawing=!1}set form(e){this._form&&this._form.removeEventListener('formdata',this.onFormdata),e&&e.addEventListener('formdata',this.onFormdata)}get form(){return this._form}get options(){return Array.from(this.querySelectorAll(this.OPTION_QUERY))}render(){return ot` <slot></slot> `}connectedCallback(){if(super.connectedCallback(),this.for){const e=document.querySelector(`form#${this.for}`);e&&(this.form=e)}else this.form=this.closest('form');this.shadowRoot.addEventListener('change',this.onChange_)}disconnectedCallback(){this.shadowRoot.removeEventListener('change',this.onChange_),this.form=null,super.disconnectedCallback()}onChangeValue(e){const t=e.target,n=Array.from(this.querySelectorAll(this.SELECT_QUERY));n.includes(t)&&(this.changeAt(n.indexOf(t)),e.preventDefault(),e.stopImmediatePropagation(),e.stopPropagation(),this.requestUpdate())}changeAt(e,t=!1){if(!this.redrawing){if(this.redrawing=!0,this.reactive){if(t){Array.from(this.querySelectorAll(':scope > select, :scope > custom-select'))[0].value=''}this.dispatchEvent(new CustomEvent('change',{detail:{idx:e}}))}else{const t=Array.from(this.querySelectorAll(':scope > select, :scope > custom-select')),n=e>=0?t[e]:t[0],r=(null==n?void 0:n.value)?t[e+1]:n||t[0],i=(null==n?void 0:n.value)?e+1:e;r&&(t.slice(i+1).forEach((e=>e.remove())),r.value=''),this.dispatchEvent(new Event('change'))}this.redrawing=!1}}}cr.styles=lr,pr([Xn({type:String,attribute:'for'})],cr.prototype,"for",void 0),pr([Xn({type:String})],cr.prototype,"name",void 0),pr([Xn({type:Boolean})],cr.prototype,"reactive",void 0),pr([Xn({type:String,attribute:'select-tag-name'})],cr.prototype,"selectTagName",null),pr([Xn({type:String,attribute:'option-tag-name'})],cr.prototype,"optionTagName",null),pr([Xn({type:Array})],cr.prototype,"options",null),window.customElements.get('input-chain')||window.customElements.define('input-chain',cr);var ur=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s};class hr extends cr{constructor(){super(...arguments),this.allowFixed=!0,this._fixed=!1,this.placeholder='Enter a fixed value or switch to expression'}get dirty(){return this.value.length>0}get value(){var e;return this.fixed?[null===(e=this.getFixedInput())||void 0===e?void 0:e.value].filter((e=>!!e)):this.options.filter((e=>e.selected&&e.value)).map((e=>e.value))}get fixed(){return this._fixed}set fixed(e){this._fixed=e,this.dispatchEvent(new Event('fixedChange'))}connectedCallback(){super.connectedCallback()}render(){const e=this.dirty;return ot`
      <!-- header -->
      <header part="header" class="header">
        <label>
          <div
            class=${ar({dirty:e,'property-name':!0})}
            part="property-name"
          >
            <slot name="label"></slot>
            ${e?ot`
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
                `:ot``}
          </div>
          ${this.allowFixed?ot`
                <div part="fixed-selector" class="fixed-selector">
                  <span
                    class=${ar({active:this.fixed,'fixed-selector-fixed':!0})}
                    @click=${()=>this.fixed=!0}
                    part="fixed-selector-fixed"
                    >Fixed</span
                  >
                  <span
                    class=${ar({active:!this.fixed,'fixed-selector-expression':!0})}
                    @click=${()=>this.fixed=!1}
                    part="fixed-selector-expression"
                    >Expression</span
                  >
                </div>
              `:ot``}
        </label>
      </header>
      <div
        part="property-container"
        class=${ar({'property-container':!0,fixed:this.fixed})}
      >
        <slot class="hide-when-fixed"
          >${this.options.length?'':this.placeholder}</slot
        >
        <slot name="fixed" part="fixed" class="show-when-fixed"></slot>
      </div>
    `}reset(){if(this.fixed){const e=this.getFixedInput();if(!e)throw new Error('Input not found for fixed value');e.value=''}else this.changeAt(-1,!0);this.dispatchEvent(new Event('change')),this.requestUpdate()}getFixedInput(){return this.querySelector('input, textarea')}}ur([Xn({type:Boolean,attribute:'allow-fixed'})],hr.prototype,"allowFixed",void 0),ur([Xn({type:Boolean,attribute:'fixed',reflect:!0})],hr.prototype,"fixed",null),ur([Xn()],hr.prototype,"placeholder",void 0),window.customElements.get('expression-input')||window.customElements.define('expression-input',hr);var fr=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s};class gr extends St{constructor(){super(...arguments),this.hidden=!1,this.noAutoClose=!1,this.resized_=this.ensureElementInView.bind(this),this.blured_=this.blured.bind(this),this.keydown_=this.keydown.bind(this)}render(){return setTimeout((()=>this.ensureElementInView())),ot` <slot></slot> `}connectedCallback(){super.connectedCallback(),this.setAttribute('tabindex','0'),this.addEventListener('blur',this.blured_),this.addEventListener('keydown',this.keydown_),window.addEventListener('resize',this.resized_),window.addEventListener('blur',this.blured_)}disconnectedCallback(){window.removeEventListener('resize',this.resized_),window.removeEventListener('blur',this.blured_),this.removeEventListener('blur',this.blured_),this.removeEventListener('keydown',this.keydown_),super.disconnectedCallback()}getActiveElementRecursive(e=document.activeElement){return(null==e?void 0:e.shadowRoot)?this.getActiveElementRecursive(e.shadowRoot.activeElement):e}blured(){this.noAutoClose||setTimeout((()=>{let e=this.getActiveElementRecursive();for(;e&&e!==this;)e=e.parentNode||e.host;e!==this&&this.close()}))}close(){this.setAttribute('hidden',''),this.blur()}keydown(e){'Escape'===e.key&&this.close()}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),'hidden'===e&&null===n&&(this.focus(),this.dispatchEvent(new CustomEvent('popin-opened'))),'hidden'===e&&null!==n&&this.dispatchEvent(new CustomEvent('popin-closed'))}ensureElementInView(){var e;const t=null===(e=this.parentElement)||void 0===e?void 0:e.getBoundingClientRect();this.style.left=`${null==t?void 0:t.left}px`,this.style.top=`${null==t?void 0:t.top}px`;const n=0,r=0,i=this.getBoundingClientRect(),o=window.innerWidth,s=window.innerHeight;i.left+i.width+n>o&&(this.style.left=`${o-i.width-n}px`),i.left+n<0&&(this.style.left=`${-n}px`),i.top+i.height+r>s&&(this.style.top=`${s-i.height-r}px`),i.top+r<0&&(this.style.top=`${-r}px`)}}gr.styles=dr,fr([Xn()],gr.prototype,"hidden",void 0),fr([Xn({type:Boolean,attribute:'no-auto-close'})],gr.prototype,"noAutoClose",void 0),window.customElements.get('popin-overlay')||window.customElements.define('popin-overlay',gr);var vr=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s};class yr extends gr{constructor(){super(...arguments),this.for='',this.name='',this.formData=new FormData,this.onFormdata_=this.onFormdata.bind(this),this.slotChanged_=this.slotChanged.bind(this),this._form=null,this.inputs=[]}set form(e){this._form&&this._form.removeEventListener('formdata',this.onFormdata_),e&&e.addEventListener('formdata',this.onFormdata_)}get form(){return this._form}get value(){return this.updateFormData(),Object.fromEntries(this.formData.entries())}render(){return super.render(),ot`
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
    `}connectedCallback(){if(super.connectedCallback(),this.for){const e=document.querySelector(`form#${this.for}`);e&&(this.form=e)}else this.form=this.closest('form');this.shadowRoot.addEventListener('slotchange',this.slotChanged_),this.slotChanged()}disconnectedCallback(){this.removeEventListener('slotchange',this.slotChanged_),this.form=null,super.disconnectedCallback()}slotChanged(){this.inputs=Array.from(this.querySelectorAll('input, select, textarea, [data-is-input]'))}onFormdata(e){e.preventDefault();const t=e.formData;for(const[e,n]of this.formData.entries())t.set(`${this.name}-${e}`,n)}updateFormData(){this.formData=new FormData;for(const e of this.inputs)this.formData.set(e.getAttribute('name'),e.value)}submit(e){e.preventDefault(),e.stopImmediatePropagation(),this.updateFormData(),this.close(),this.dispatchEvent(new Event('change'))}change(e){e.target.closest(this.tagName)===this&&(e.preventDefault(),e.stopImmediatePropagation())}}vr([Xn({type:String,attribute:'for'})],yr.prototype,"for",void 0),vr([Xn({type:String})],yr.prototype,"name",void 0),window.customElements.get('popin-form')||window.customElements.define('popin-form',yr);const mr="important",br=" !"+mr,$r=Ln(class extends Un{constructor(e){if(super(e),e.type!==Rn||"style"!==e.name||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce(((t,n)=>{const r=e[n];return null==r?t:t+`${n=n.includes("-")?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${r};`}),"")}update(e,[t]){const{style:n}=e.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(t)),this.render(t);for(const e of this.ft)null==t[e]&&(this.ft.delete(e),e.includes("-")?n.removeProperty(e):n[e]=null);for(const e in t){const r=t[e];if(null!=r){this.ft.add(e);const t="string"==typeof r&&r.endsWith(br);e.includes("-")||t?n.setProperty(e,t?r.slice(0,-11):r,t?mr:""):n[e]=r}}return _e}});function _r(e){var t;if(!e)throw new Error('Field is required for token');if(!e.dataSourceId)throw new Error(`Field ${e.id} has no data source`);return Object.assign({type:'property',propType:'field',fieldId:e.id,label:e.label,typeIds:e.typeIds,dataSourceId:e.dataSourceId,kind:e.kind},null!==(t=Ot(e))&&void 0!==t?t:{})}function xr(e){const{component:t,expression:n,dataTree:r,rootType:i,currentStateId:o,hideLoopData:s}=e;if(!t)throw new Error('Component is required for completion');if(!n)throw new Error('Expression is required for completion');if(0===n.length){if(i){const e=r.getType(i,null,t.getId());return e?e.fields.map((e=>_r(e))):(console.warn('Root type not found',i),[])}return function(e,t,n,r=!1){if(!e)throw console.error('Component is required for context'),new Error('Component is required for context');const i=t.queryables.map((e=>{if(!e.dataSourceId)throw new Error(`Type ${e.id} has no data source`);return _r(e)})),o=[],s=[];let a=e;for(;a;){if(o.push(...k(a,!0,a===e?n:void 0).map((e=>{var t;return{type:'state',storedStateId:e,previewIndex:8888,label:(null===(t=I(a,e,!0))||void 0===t?void 0:t.label)||e,componentId:w(a),exposed:!0}}))),a!==e||!r){const e=I(a,'__data',!1);if(e)try{const n=It(e.expression,a,t);if(n){const t=e=>{var t;return`${null!==(t=a.getName())&&void 0!==t?t:'Unknown'}'s ${n.label} ${e}`};'list'===n.kind?s.push({type:'state',storedStateId:'__data',componentId:w(a),previewIndex:n.previewIndex,exposed:!1,forceKind:'object',label:`Loop data (${n.label})`},{type:'property',propType:'field',fieldId:'forloop.index0',label:t('forloop.index0'),kind:'scalar',typeIds:['number']},{type:'property',propType:'field',fieldId:'forloop.index',label:t('forloop.index'),kind:'scalar',typeIds:['number']}):console.warn('Loop data is not a list for component',a,'and state',e)}else console.warn('Loop data type not found for component',a,'and state',e)}catch(t){console.error('Error while getting loop data for component',a,'and state',e)}}a=a.parent()}const l=t.filters.filter((e=>{try{return e.validate(null)}catch(t){return console.warn('Filter validate error:',t,{filter:e}),!1}})),d=Yt('');return[...i,...o,...s,...l,d]}(t,r,o,s)}const a=It(n,t,r);return a?[].concat('object'===a.kind?a.typeIds.map((e=>{var n;return r.getType(e,null!==(n=a.dataSourceId)&&void 0!==n?n:null,t.getId())})).flatMap((e=>{var t;return null!==(t=null==e?void 0:e.fields)&&void 0!==t?t:[]})).flatMap((e=>e.typeIds.map((t=>Object.assign(Object.assign({},_r(e)),{typeIds:[t]}))))):[]).concat(r.filters.filter((e=>{try{return e.validate(a)}catch(t){return console.warn('Filter validate error:',t,{filter:e,field:a}),!1}}))):(console.warn('Result type not found for expression',n),[])}var wr=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s},Sr=void 0&&(void 0).__metadata||function(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)};const Ar='PREVIEW_INDEX_CHANGED';class Er extends St{constructor(){super(...arguments),this.disabled=!1,this.name='',this.hideLoopData=!1,this.showPreviewIndexUi=!1,this.parentName='',this.noFilters=!1,this.rootType='',this.defaultFixed=!1,this.dismissCurrentComponentStates=!1,this._selected=null,this.for='',this.previewIndex=0,this.onFormdata_=this.onFormdata.bind(this),this.renderBinded=()=>this.requestUpdate(),this._form=null,this._data=[],this._editor=null,this.redrawing=!1,this.expressionInputRef=Bn(),this.popinsRef=[]}get selected(){return this._selected}set selected(e){this._selected=e;const t=this._data.slice(-1)[0];t&&(this.previewIndex=t.previewIndex||0),this.requestUpdate()}get value(){return JSON.stringify(this.data)}set value(e){const t=tn(e);this.data=t||e}connectedCallback(){var e;if(super.connectedCallback(),this.for){const e=document.querySelector(`form#${this.for}`);e&&(this.form=e)}else this.form=this.closest('form');null===(e=this.editor)||void 0===e||e.on(`${i} ${Ar} ${c}`,this.renderBinded)}disconnectedCallback(){var e;this.form=null,super.disconnectedCallback(),null===(e=this.editor)||void 0===e||e.off(`${i} ${Ar} ${c}`,this.renderBinded)}onFormdata(e){e.preventDefault();e.formData.set(this.name,this.value)}set form(e){this._form&&this._form.removeEventListener('formdata',this.onFormdata_),e&&e.addEventListener('formdata',this.onFormdata_)}get form(){return this._form}get data(){const e=this.expressionInputRef.value;if(!this._selected||!this.editor)return console.error('selected and editor are required',this._selected,this.editor),[];if(!e||0===e.value.length)return[];if(e.fixed)return[Yt(e.value[0]||'')];return e.value.filter((e=>!!e)).map((e=>{try{return en(this.editor,e,this.selected.getId())}catch(t){return console.error(`Error while getting token from id ${e}`,t),{type:'property',propType:'field',fieldId:'unknown',label:'Unknown',kind:'scalar',typeIds:[],options:{}}}})).map(((e,t)=>{var n;const r=null===(n=this.popinsRef[t])||void 0===n?void 0:n.value;switch(e.type){case'property':case'filter':e.options=(null==r?void 0:r.value)||e.options}return e}))}set data(e){this._data='string'==typeof e?''===e?[]:[Yt(e)]:e,this.editor&&this.requestUpdate()}get editor(){return this._editor}set editor(e){this._editor=e,this.requestUpdate()}render(){var e,t,n;if(this.redrawing=!0,super.render(),!this.name)throw new Error('name is required on state-editor');if(!this.editor||!this.selected)return console.error('editor and selected are required',this.editor,this.selected),ot`<div class="ds-section
        ds-section--error">Error rendering state-editor component: editor and selected are required</div>`;const r=this.selected,i=Qt(this.editor),o=this._data.map((e=>Et(e,i,r.getId()))),s=xr({component:this.dismissCurrentComponentStates?r.parent():r,expression:o||[],dataTree:i,rootType:this.rootType,currentStateId:this.parentName||this.name,hideLoopData:this.hideLoopData}).filter((e=>'filter'!==e.type||!this.noFilters)),a=Jt(this.editor,r,s,o),l=1===(null==o?void 0:o.length)&&'property'===o[0].type&&o[0].fieldId===Wt||this.defaultFixed&&0===o.length||0===s.length&&0===o.length,d=l&&(null===(t=null===(e=o[0])||void 0===e?void 0:e.options)||void 0===t?void 0:t.value)||'';let p='';try{p=i.getValue(o||[],r,!this.showPreviewIndexUi)}catch(e){console.error('Current data could not be retrieved:',e)}null==p&&(p='');const c=Array.isArray(p)?p.length:0,u=null===(n=o[o.length-1])||void 0===n?void 0:n.previewIndex;this.previewIndex!==u&&(this.previewIndex=u||0);const h=Bn(),f=Bn(),g=ot`
      <expression-input
        @change=${e=>this.onChangeValue(e)}
        data-is-input
        ${Kn(this.expressionInputRef)}
        .fixed=${l}
        class="ds-section"
        name=${this.name}
        reactive
      >
        <style>
          ${kn}
        </style>
        <slot name="label" slot="label"></slot>
        <div slot="fixed" class="ds-slot-fixed">
          <input
            type="text"
            class="ds-expression-input__fixed"
            placeholder="Enter a text or switch to expression mode"
            .value=${d}
            />
        </div>
        ${o&&o.length>0?ot`
          ${o.map(((e,t)=>{this.popinsRef[t]=Bn();const n=this.getOptions(r,o,t),s=o.slice(0,t),a=xr({component:this.dismissCurrentComponentStates?r.parent():r,expression:s,dataTree:i,rootType:this.rootType,currentStateId:0===t?this.parentName||this.name:void 0,hideLoopData:this.hideLoopData}),l=this.noFilters?a.filter((e=>'filter'!==e.type)):a,d=Jt(this.editor,r,l,o.slice(0,t)),p=Xt(e);return ot`
              <select>
                <option value="">-</option>
                ${Object.entries(d).reverse().map((([e,t])=>ot`
                      <optgroup label="${e}">
                      ${t.map((e=>({displayName:Kt(r,e),partialToken:e}))).sort(((e,t)=>e.displayName.localeCompare(t.displayName))).map((({partialToken:e,displayName:t})=>{const n=Xt(e);return ot`
                            <option value=${Zt(e)} .selected=${n===p}>${t}</option>
                          `}))}
                      </optgroup>
                    `))}
              </select>
              <button
                class="ds-expression-input__options-button"
                style=${$r({display:''===n?'none':''})}
                @click=${()=>{var e;null===(e=this.popinsRef[t].value)||void 0===e||e.removeAttribute('hidden')}}
              >...</button>
              <popin-form
                ${Kn(this.popinsRef[t])}
                hidden
                name=${`${this.name}_options_${t}`}
                @change=${e=>this.onChangeOptions(e,r,this.popinsRef[t].value,t)}
              >
                ${n}
              </popin-form>
              `}))}
        `:''}
        ${Object.entries(a).length?ot`
          <select
            class="ds-expression-input__add"
            ${Kn((e=>e&&(e.value='')))}
            >
            <option value="" selected>+</option>
            ${Object.entries(a).reverse().map((([e,t])=>ot`
                    <optgroup label="${e}">
                    ${t.map((e=>({displayName:Kt(r,e),token:e}))).sort(((e,t)=>e.displayName.localeCompare(t.displayName))).map((({displayName:e,token:t})=>ot`<option value="${Zt(t)}">${e}</option>`))}
                    </optgroup>
                `))}
          </select>
      `:''}
      </expression-input>
      <div class="ds-real-data">
        <code class="ds-real-data__display">
          ${Array.isArray(p)?ot`${p.length} objects with ${Object.keys(p[0]||{}).filter((e=>'__typename'!==e)).join(', ')}`:p}
        </code>
        ${this.showPreviewIndexUi&&c>0&&void 0!==u?ot`
        <div class="ds-real-data__preview-index">
          <input
            ${Kn(h)}
            type="range"
            step="1"
            min="0"
            .max=${c-1}
            .value=${this.previewIndex}
            @input=${e=>{const t=e.target.value;this.onChangePreview(parseInt(t)),f.value&&(f.value.value=t)}}
          >
          <input
              ${Kn(f)}
              type="number"
            step="1"
            min="0"
            .max=${c-1}
            .value=${this.previewIndex}
            @input=${e=>{const t=e.target.value;this.onChangePreview(parseInt(t)),h.value&&(h.value.value=t)}}
            >
            `:''}
        </div>
        `;return this.redrawing=!1,g}onChangePreview(e){var t,n;const r=null===(t=this._selected)||void 0===t?void 0:t.attributes.privateStates.find((e=>'__data'===e.id));if((null==r?void 0:r.expression.length)>0){r.expression[r.expression.length-1].previewIndex=e}null===(n=this.editor)||void 0===n||n.trigger(Ar)}onChangeValue(e){var t;if(this.redrawing)return;const n=null===(t=e.detail)||void 0===t?void 0:t.idx;if(n>=0){const e=this.data.slice(0,n+1);e.length>n&&('property'!==e[n].type&&'filter'!==e[n].type||(e[n].options={})),this.data=e}e.preventDefault(),e.stopImmediatePropagation(),e.stopPropagation(),setTimeout((()=>this.dispatchEvent(new Event('change',{bubbles:!0}))))}onChangeOptions(e,t,n,r){if(this.redrawing)return;if(!this.editor)throw new Error('editor is required');const i=this.expressionInputRef.value,o=i.value.filter((e=>!!e)).map((e=>{try{return en(this.editor,e,t.getId())}catch(t){return console.error('Error while getting token from string',{id:e},t),{type:'property',propType:'field',fieldId:'unknown',label:'Unknown',kind:'scalar',typeIds:[],options:{}}}})),s=i.options.filter((e=>e.selected));o[r].options=n.value,s[r].value=Zt(o[r]),this.requestUpdate(),e.preventDefault(),e.stopImmediatePropagation(),e.stopPropagation(),this.dispatchEvent(new Event('change',{bubbles:!0}))}getOptions(e,t,n){if(!this.editor)throw new Error('editor is required');const r=Qt(this.editor),i=t[n],o=t.slice(0,n).map((n=>{try{return It(t.concat(n),e,r)}catch(t){return console.error(`Error while getting expression result type for token ${n} on component ${e.getName()}#${e.get('id')}.${e.getClasses().join('.')} (${e.cid})`,t),null}}));switch(i.type){case'property':case'filter':if(i.optionsForm){return i.optionsForm(e,o[o.length-1],i.options||{},this.parentName||this.name)||''}return'';default:return''}}}wr([Xn({type:Boolean}),Sr("design:type",Object)],Er.prototype,"disabled",void 0),wr([Xn({type:String}),Sr("design:type",Object)],Er.prototype,"name",void 0),wr([Xn({type:Boolean,attribute:'hide-loop-data'}),Sr("design:type",Object)],Er.prototype,"hideLoopData",void 0),wr([Xn({type:Boolean,attribute:'show-preview-index-ui'}),Sr("design:type",Object)],Er.prototype,"showPreviewIndexUi",void 0),wr([Xn({type:String,attribute:'parent-name'}),Sr("design:type",Object)],Er.prototype,"parentName",void 0),wr([Xn({type:Boolean,attribute:'no-filters'}),Sr("design:type",Object)],Er.prototype,"noFilters",void 0),wr([Xn({type:String,attribute:'root-type'}),Sr("design:type",Object)],Er.prototype,"rootType",void 0),wr([Xn({type:Boolean,attribute:'default-fixed'}),Sr("design:type",Object)],Er.prototype,"defaultFixed",void 0),wr([Xn({type:Boolean,attribute:'dismiss-current-component-states'}),Sr("design:type",Object)],Er.prototype,"dismissCurrentComponentStates",void 0),wr([Xn({type:Object}),Sr("design:type",Object),Sr("design:paramtypes",[Object])],Er.prototype,"selected",null),wr([Xn(),Sr("design:type",String),Sr("design:paramtypes",[String])],Er.prototype,"value",null),wr([Xn({type:String,attribute:'for'}),Sr("design:type",Object)],Er.prototype,"for",void 0),wr([Xn({type:Number}),Sr("design:type",Object)],Er.prototype,"previewIndex",void 0),wr([Xn({type:Object}),Sr("design:type",Object),Sr("design:paramtypes",[Object])],Er.prototype,"editor",null),window.customElements.get('state-editor')||window.customElements.define('state-editor',Er);var kr=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s},Tr=void 0&&(void 0).__metadata||function(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)};class Ir extends St{constructor(){super(...arguments),this.disabled=!1,this.defaultFixed=!1,this.inputs={innerHTML:void 0,condition:void 0,condition2:void 0,__data:void 0},this.editor=null,this.redrawing=!1}setEditor(e){this.editor?console.warn('property-editor setEditor already set'):(this.editor=e,this.editor.on('page',(()=>this.requestUpdate())),this.editor.on('component:selected',(()=>this.requestUpdate())),this.editor.on('component:update',(()=>this.requestUpdate())))}render(){var e;super.render(),this.redrawing=!0;const t=null===(e=this.editor)||void 0===e?void 0:e.getSelected(),n=ot`
      <style>
        ${kn}
      </style>
      <slot></slot>
    `,r=ot`
      ${n}
      <p class="ds-empty">Select an element to edit its properties</p>
    `;if(!this.editor||this.disabled)return this.resetInputs(),this.redrawing=!1,ot``;if(!t||'body'===t.get('tagName'))return this.resetInputs(),this.redrawing=!1,r;const i=ot`
      ${n}
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Properties</div>
        </div>
        <details class="ds-states__help">
          <summary>Help</summary>
          Elements properties are expressions that can replace the HTML attributes of the element or it's whole content (innerHTML).
          <a target="_blank" href="https://docs.silex.me/en/user/cms-concepts#properties">Learn more about element properties</a>
        </details>
        <main>
          ${[{label:'HTML content',name:y.innerHTML,publicState:!1}].map((({label:e,name:n,publicState:r})=>this.renderStateEditor(t,e,n,r)))}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">Visibility</div>
        </div>
        <main>
          ${this.renderStateEditor(t,'Condition',y.condition,!1)}
          <div>
          <span>... is</span>
          <select
            class="ds-visibility__condition-operator"
            @change=${e=>{const n=e.target.value;if(!n)throw new Error('Selection required for operator select element');t.set('conditionOperator',n),this.requestUpdate()}}
          >
          </div>
          ${Object.values(g).concat(Object.values(v)).map((e=>ot`
                <option value="${e}" .selected=${t.get('conditionOperator')===e} >${e}</option>
              `))}
          </select>
          ${this.renderStateEditor(t,'',y.condition2,!1,!1,t.has('conditionOperator')&&Object.values(v).includes(t.get('conditionOperator')))}
        </main>
      </section>
      <section class="ds-section">
        <div>
          <label class="gjs-traits-label ds-label">Loop</label>
        </div>
        <main>
          ${this.renderStateEditor(t,'Data',y.__data,!1,!0)}
        </main>
      </section>
    `;return this.redrawing=!1,i}resetInputs(){this.inputs={innerHTML:void 0,condition:void 0,condition2:void 0,__data:void 0}}renderStateEditor(e,t,n,r,i=!1,o=!0){return ot`
      <state-editor
        .style=${o?'':'display: none;'}
        .selected=${e}
        .editor=${this.editor}
        id="${n}"
        name=${n}
        default-fixed=${this.defaultFixed}
        ?hide-loop-data=${i}
        ?show-preview-index-ui=${n===y.__data}
        ${Kn((t=>{if(t){const e=t;this.inputs[n]||(this.inputs[n]={stateEditor:e,selected:void 0})}if(this.inputs[n]){const t=this.inputs[n].stateEditor;this.redrawing=!0;try{t.data=this.getTokens(Qt(this.editor),e,n,r)}catch(e){console.error('Error setting data',e),t.data=[Yt(`Error setting data: ${e}`)]}this.redrawing=!1,this.inputs[n].selected=e}}))}
        @change=${()=>this.onChange(e,n,r)}
        ?disabled=${this.disabled}
      >
        <label slot="label">${t}</label>
      </state-editor>
    `}onChange(e,t,n){const{stateEditor:r}=this.inputs[t];this.redrawing||(t===y.__data?O(e,t,{expression:r.data.slice(0,-1).concat(Object.assign(Object.assign({},r.data[r.data.length-1]),{previewIndex:0}))},n):O(e,t,{expression:r.data},n))}getTokens(e,t,n,r){const i=I(t,n,r);return i&&i.expression?i.expression.map((n=>Et(n,e,t.getId()))):[]}}kr([Xn({type:Boolean}),Tr("design:type",Object)],Ir.prototype,"disabled",void 0),kr([Xn({type:Boolean,attribute:'default-fixed'}),Tr("design:type",Object)],Ir.prototype,"defaultFixed",void 0),window.customElements.get('properties-editor')||window.customElements.define('properties-editor',Ir);var Or=void 0&&(void 0).__decorate||function(e,t,n,r){var i,o=arguments.length,s=o<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(o<3?i(s):o>3?i(t,n,s):i(t,n))||s);return o>3&&s&&Object.defineProperty(t,n,s),s},Cr=void 0&&(void 0).__metadata||function(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)};class jr extends St{constructor(){super(...arguments),this.disabled=!1,this.privateState=!1,this.title='Custom states',this.defaultFixed=!1,this.createPrompt='Name this state',this.renamePrompt='Rename this state',this.defaultName='New state',this.hideLoopData=!1,this.helpText='',this.helpLink='',this._reservedNames=[],this.editor=null,this.redrawing=!1}get reservedNames(){return this._reservedNames}set reservedNames(e){this._reservedNames='string'==typeof e?e.split(',').map((e=>e.trim())):e}setEditor(e){this.editor?console.warn('property-editor setEditor already set'):(this.editor=e,this.editor.on('page',(()=>this.requestUpdate())),this.editor.on('component:selected',(()=>this.requestUpdate())),this.editor.on('component:update',(()=>this.requestUpdate())))}getHead(e){return ot`
      <style>
        ${kn}
      </style>
      <slot></slot>
      <section class="ds-section">
        <div>
          <div class="gjs-traits-label">
            <span>${this.title}</span>
            ${e?ot`
            <button
              title="Add a new state"
              class="ds-states__add-button ds-states__button"
              @click=${()=>{const t=this.createCustomState(e);t&&this.setState(e,t.name,t.state)}}
              >+</button>
            `:''}
          </div>
        </div>
        ${this.helpText?ot`
        <details class="ds-states__help">
          <summary>Help</summary>
          <span>${this.helpText}</span>
          ${this.helpLink?ot`
          <a
            class="ds-states__help-link"
            href="${this.helpLink}"
            target="_blank"
            >\u{1F517} Read more...</a>
          `:''}
        </details>
        `:''}
      </section>
    `}render(){var e;super.render(),this.redrawing=!0;const t=null===(e=this.editor)||void 0===e?void 0:e.getSelected(),n=ot`
      ${this.getHead(null)}
      <p class="ds-empty">Select an element to edit its states</p>
    `;if(!this.editor||this.disabled)return this.redrawing=!1,ot``;if(!t)return this.redrawing=!1,n;const r=this.getStateIds(t).map((e=>({name:e,publicState:!this.privateState,state:this.getState(t,e)}))).filter((e=>e.state&&!e.state.hidden)),i=ot`
      ${this.getHead(t)}
      <div class="ds-states">
        <div class="ds-states__items">
          ${r.map(((e,n)=>ot`
            <div class="ds-states__item">
              ${this.getStateEditor(t,e.state.label||'',e.name)}
              <div class="ds-states__buttons">
                <button
                  title="Remove this state"
                  class="ds-states__remove-button ds-states__button"
                  @click=${()=>{this.removeState(t,e.name),this.requestUpdate()}}
                  >x</button>
                <button
                  title="Rename this state"
                  class="ds-states__rename-button ds-states__button"
                  @click=${()=>{const n=this.renameCustomState(e);n&&n!==e&&(this.removeState(t,e.name),this.setState(t,n.name,n.state),this.requestUpdate())}}
                  >\u270F</button>
                  <button
                    title="Move this state up"
                    class="ds-states__item-move-up ds-states__button${0===n?' ds-states__button--disabled':''}"
                    @click=${()=>{r.splice(n-1,0,r.splice(n,1)[0]),this.updateOrderCustomStates(t,r)}}
                    >\u2191</button>
                  <button
                    title="Move this state down"
                    class="ds-states__item-move-down ds-states__button${n===r.length-1?' ds-states__button--disabled':''}"
                    @click=${()=>{r.splice(n+1,0,r.splice(n,1)[0]),this.updateOrderCustomStates(t,r)}}
                  >\u2193</button>
              </div>
            </div>
            <hr class="ds-states__sep" />
          `))}
        </div>
      </div>
    `;return this.redrawing=!1,i}getStateIds(e){return k(e,!this.privateState).filter((e=>!this.reservedNames.includes(e)))}getState(e,t){return I(e,t,!this.privateState)}setState(e,t,n){O(e,t,n,!this.privateState)}removeState(e,t){C(e,t,!this.privateState)}getStateEditor(e,t,n){return ot`
      <state-editor
        .selected=${e}
        .editor=${this.editor}
        id="${n}"
        name=${n}
        ?hide-loop-data=${this.hideLoopData}
        default-fixed=${this.defaultFixed}
        ${Kn((t=>{if(t){t.data=this.getTokens(Qt(this.editor),e,n)}}))}
        @change=${()=>this.onChange(e,n,t)}
        .disabled=${this.disabled}
      >
        <label slot="label">${t||n}</label>
      </state-editor>
    `}onChange(e,t,n){if(this.redrawing)return;const r=this.shadowRoot.querySelector(`#${t}`);this.setState(e,t,{expression:r.data,label:n})}getTokens(e,t,n){const r=this.getState(t,n);return r&&r.expression?r.expression.map((i=>{try{return Et(i,e,t.getId())}catch(i){return console.error('Error while getting expression result type in getTokens',{expression:r.expression,component:t,dataTree:e,name:n}),{type:'property',propType:'field',fieldId:'unknown',label:'unknown',kind:'scalar',typeIds:[]}}})):[]}renameCustomState(e){var t,n,r;const i=null===(r=null===(n=null===(t=prompt(this.renamePrompt,e.state.label))||void 0===t?void 0:t.toLowerCase())||void 0===n?void 0:n.replace(/[^a-z0-9]/g,'-'))||void 0===r?void 0:r.replace(/^-+|-+$/g,'');return i&&i!==e.state.label?Object.assign(Object.assign({},e),{state:Object.assign(Object.assign({},e.state),{label:i})}):e}updateOrderCustomStates(e,t){this.getStateIds(e).forEach((n=>{t.map((e=>e.name)).includes(n)&&this.removeState(e,n)})),t.forEach((t=>{this.setState(e,t.name,t.state)}))}createCustomState(e){const t=(n=prompt(this.createPrompt,this.defaultName),null===(i=null===(r=null==n?void 0:n.toLowerCase())||void 0===r?void 0:r.replace(/[^a-z-1-9:]/g,'-'))||void 0===i?void 0:i.replace(/-+$/g,''));var n,r,i;if(!t)return null;if(this.reservedNames.includes(t))return alert(`The name ${t} is reserved, please choose another name`),null;const o=`${e.getId()}-${Math.random().toString(36).slice(2)}`,s={label:t,expression:[]};return this.setState(e,o,s),{name:o,state:s,publicState:!this.privateState}}}function Nr(e,t){return I(e,t,!1)}function Rr(e,t,n){const r=Nr(e,y.innerHTML);if(null===r)return null;try{'number'==typeof n&&Pr(e,n);const i=function(e,t,n){try{const r=e.map((e=>{var r;return Et(e,n,(null===(r=t.getId)||void 0===r?void 0:r.call(t))||null)}));return n.getValue(r,t,!0)}catch(e){return console.warn('Error evaluating condition:',e),null}}(r.expression,e,t);return null!=i?String(i):null}catch(e){return console.warn('Error rendering innerHTML:',e),null}}function Pr(e,t){(e.get('privateStates')||[]).forEach((e=>{e.expression&&e.expression.length>0&&e.expression.forEach((e=>{'state'===e.type&&'__data'===e.storedStateId?e.previewIndex=t:'property'!==e.type&&'filter'!==e.type||(e.previewIndex=t)}))}))}function Lr(e,t){const n=Nr(e,y.condition),r=Nr(e,y.condition2),i=e.get('conditionOperator');if(!n||!(null==n?void 0:n.expression)||0===(null==n?void 0:n.expression.length))return!0;const o=t.getValue(n.expression,e,!0);switch(i){case g.TRUTHY:return!!o;case g.FALSY:return!o;case g.EMPTY_ARR:return Array.isArray(o)&&0===o.length;case g.NOT_EMPTY_ARR:return Array.isArray(o)&&o.length>0}if(!r||!r.expression||0===r.expression.length)return!1;const s=t.getValue(r.expression,e,!0);switch(i){case v.EQUAL:return o==s;case v.NOT_EQUAL:return o!==s;case v.GREATER_THAN:return Number(o)>Number(s);case v.LESS_THAN:return Number(o)<Number(s);case v.GREATER_THAN_OR_EQUAL:return Number(o)>=Number(s);case v.LESS_THAN_OR_EQUAL:return Number(o)<=Number(s);default:throw new Error(`Unknown operator ${i}`)}}function Ur(e,t){(e.get('privateStates')||[]).forEach((n=>{var r;if(n.id&&n.id!==y.innerHTML&&n.id!==y.__data&&n.id!==y.condition&&n.id!==y.condition2&&n.expression)try{const i=t.getValue(n.expression,e,!0);null!=i&&(null===(r=e.view)||void 0===r||r.el.setAttribute(n.label||n.id,String(i)))}catch(e){console.warn(`Error evaluating attribute ${n.id}:`,e)}}))}function Dr(e,t,n){const r=Rr(e,t);null===r?(e.view.render(),e.components().forEach((e=>Mr(e,t,n+1)))):e.view.el.innerHTML=r}function Mr(e,t,n=0){const r=e.view;if(!r)return;const i=r.el,o=function(e,t){try{const n=Nr(e,y.__data);if(null===n)return null;const r=t.getValue(n.expression,e,!1);return Array.isArray(r)?r:null}catch(e){return console.warn('Error getting loop data:',e),null}}(e,t);if(o)if(0===o.length)i.remove();else{Pr(e,0),Lr(e,t)?(e.components().forEach((e=>Mr(e,t,n+1))),Ur(e,t)):i.remove();for(let r=1;r<o.length;r++){const o=i.cloneNode(!0);i.insertAdjacentElement('afterend',o),Pr(e,r),Lr(e,t)?(Dr(e,t,n),Ur(e,t)):i.remove()}}else Lr(e,t)?(Dr(e,t,n),Ur(e,t)):i.remove()}Or([Xn({type:Boolean}),Cr("design:type",Object)],jr.prototype,"disabled",void 0),Or([Xn({type:Boolean,attribute:'private-state'}),Cr("design:type",Object)],jr.prototype,"privateState",void 0),Or([Xn({type:String}),Cr("design:type",Object)],jr.prototype,"title",void 0),Or([Xn({type:Boolean,attribute:'default-fixed'}),Cr("design:type",Object)],jr.prototype,"defaultFixed",void 0),Or([Xn({type:String,attribute:'create-prompt'}),Cr("design:type",Object)],jr.prototype,"createPrompt",void 0),Or([Xn({type:String,attribute:'rename-prompt'}),Cr("design:type",Object)],jr.prototype,"renamePrompt",void 0),Or([Xn({type:String,attribute:'default-name'}),Cr("design:type",Object)],jr.prototype,"defaultName",void 0),Or([Xn({type:String,attribute:'reserved-names'}),Cr("design:type",Object),Cr("design:paramtypes",[Object])],jr.prototype,"reservedNames",null),Or([Xn({type:Boolean,attribute:'hide-loop-data'}),Cr("design:type",Object)],jr.prototype,"hideLoopData",void 0),Or([Xn({type:String,attribute:'help-text'}),Cr("design:type",Object)],jr.prototype,"helpText",void 0),Or([Xn({type:String,attribute:'help-link'}),Cr("design:type",Object)],jr.prototype,"helpLink",void 0),customElements.get('custom-states-editor')||customElements.define('custom-states-editor',jr);const Fr=(n,r)=>{if(r.view.el){const o=Object.assign({styles:kn,defaultFixed:!1,disableStates:!1,disableAttributes:!1,disableProperties:!1},r.view),s=document.createElement('section');s.classList.add('gjs-one-bg','ds-wrapper');const a=o.disableStates?'':`\n      <custom-states-editor\n        class="ds-states"\n        title="States"\n        default-fixed=${o.defaultFixed}\n        create-prompt="Create a new state"\n        rename-prompt="Rename the state"\n        default-name="New state"\n        reserved-names=${Object.keys(y).join(',')}\n        hide-loop-data\n        help-text="\n          Custom states are used to store data in the component.\n\n          They are useful to store data that is not displayed in the page, but that is used in the expressions everywhere inside the element.\n        "\n        help-link="https://docs.silex.me/en/user/cms-concepts#states"\n        >\n        <style>\n          ${o.styles}\n        </style>\n      </custom-states-editor>\n    `,l=o.disableAttributes?'':`\n      <custom-states-editor\n        class="ds-attributes"\n        private-state\n        title="Attributes"\n        default-fixed=${o.defaultFixed}\n        create-prompt="Name of the attribute"\n        rename-prompt="Rename the attribute"\n        default-name="New attribute"\n        reserved-names=${Object.keys(y).join(',')}\n        help-text="\n          HTML attributes of the element.\n\n          For example you can set the 'href' attribute of a link, or the 'src' attribute of an image.\n        "\n        help-link="https://docs.silex.me/en/user/cms-concepts#attributes"\n        >\n        <style>\n          ${o.styles}\n        </style>\n      </custom-states-editor>\n    `,d=o.disableProperties?'':`\n      <properties-editor\n        class="ds-properties"\n        default-fixed=${o.defaultFixed}\n      >\n        <style>\n          ${o.styles}\n        </style>\n      </properties-editor>\n    `;s.innerHTML=`\n      ${a}\n      ${l}\n      ${d}\n    `,((n,r={})=>{if(r.settingsEl){const o=rn(r.settingsEl,'options.settingsEl'),s=Bn();n.on(`${i} ${t} ${e} ${c}`,(()=>{s.value?(s.value.dataSources=[...Ft()],s.value.requestUpdate()):rr(0,s,o)})),rr(0,s,o)}})(n,o),n.onReady((()=>{const e=rn(o.el,'options.el');e.appendChild(s);const t=s.querySelector('properties-editor.ds-properties'),r=s.querySelector('custom-states-editor.ds-states'),a=s.querySelector('custom-states-editor.ds-attributes');if(null==t||t.setEditor(n),null==r||r.setEditor(n),null==a||a.setEditor(n),o.button){const n='function'==typeof o.button?o.button():o.button;if(!n)throw new Error(`Element ${o.button} not found`);n.on('change',(()=>{n.active?(e.appendChild(s),s.style.display='block',null==t||t.removeAttribute('disabled'),null==r||r.removeAttribute('disabled'),null==a||a.removeAttribute('disabled')):(s.style.display='none',null==t||t.setAttribute('disabled',''),null==r||r.setAttribute('disabled',''),null==a||a.setAttribute('disabled',''))})),s.style.display=n.active?'block':'none'}(e=>{const t=Qt();e.on(`${i} ${c} component style:change storage:after:load`,(()=>{console.log('Data changed, need to refresh the canvas'),Mr(e.getWrapper(),t)}))})(n)}))}else console.warn('Dynamic data UI not enabled, please set the el option to enable it')};function qr(e,t){return un(e,t,_n())}function Hr(e,t){return function(e,t,n){return e.reduce(((e,r)=>(e[r.getId()]=un(r,t,n),e)),{})}(e,t,_n())}function Vr(){return Ft()}function zr(e){return Vt(e)}function Br(e){return qt(e)}function Qr(e){return Ht(e)}function Gr(){return $n()}function Kr(e=!1){return vn(e)}function Jr(){return gn().dataTree.previewData}function Wr(){gn().dataTree.previewData={}}function Yr(e,t,n=!0){return _n().getValue(e,t,n)}function Zr(e){return _n().getPageExpressions(e)}function Xr(e){const t=_n();return xr(Object.assign(Object.assign({},e),{dataTree:t}))}function ei(e,t){return Et(e,_n(),t)}function ti(e,t){return It(e,t,_n())}function ni(e){return x(e)}function ri(e){return w(e)}function ii(e,t,n=!0){return I(e,t,n)}function oi(e,t=!0,n){return k(e,t,n)}function si(e,t,n,r=!0,i=-1){return O(e,t,n,r,i)}function ai(e,t,n=!0){return C(e,t,n)}function li(e,t){return function(e,t){return`state_${e}_${t}`}(e,t)}function di(e){return tn(e)}function pi(e={}){return sn(e)}function ci(e){return cn(e)}const ui=Bt,hi=_,fi=Wt,gi=(e,n={})=>{const r=Object.assign(Object.assign({dataSources:[],filters:[],previewActive:!0},n),{view:Object.assign({el:'.gjs-pn-panel.gjs-pn-views-container'},null==n?void 0:n.view)}),i=r.dataSources.map((e=>Object.assign(Object.assign({},e),{readonly:!0}))).map((e=>sn(e)));Promise.all(i.map((e=>e.connect()))).catch((e=>console.error('Error while connecting data sources',e))),mn(i,e,r),Fr(e,r),En(e),((e,t)=>{wn=t.previewActive,e.Commands.add(s,{run(){$n()}}),e.Commands.add(a,{run(){wn||(wn=!0,Sn(e),console.log('📊 Data source preview activated'))}}),e.Commands.add(l,{run(){wn&&(wn=!1,Sn(e),console.log('📊 Data source preview deactivated'))}}),e.Commands.add(d,{run(){wn?($n(),console.log('📊 Data source preview refreshed')):console.log('📊 Preview is deactivated - use preview:activate first')}})})(e,r),e.on(t,((t,n)=>e.runCommand('notifications:add',{type:'error',message:`Data source \`${n.id}\` error: ${t}`,group:Bt}))),e.on('load',(()=>{$n()})),e.on('storage:end:load',(()=>{setTimeout((()=>{$n()}),100)}))},vi='__VERSION__'})(),r})()));
//# sourceMappingURL=index.js.map