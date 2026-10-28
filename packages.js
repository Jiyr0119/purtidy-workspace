/* Dependency-free ZIP32 writer, stored originals, UTF-8 filenames. */
(() => {
  const table = Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc = bytes => {let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const encoder=new TextEncoder();
  function header(size,values){const b=new Uint8Array(size),v=new DataView(b.buffer);for(const [offset,value,width] of values)width===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return b;}
  async function pack(files,onProgress){const parts=[],central=[];let offset=0,cs=0;
    for(let i=0;i<files.length;i++){
      const file=files[i];onProgress(i+1,files.length);
      const response=await fetch(file.url);if(!response.ok)throw Error('下载失败');
      const data=new Uint8Array(await response.arrayBuffer()),name=encoder.encode(file.name),sum=crc(data);
      const local=header(30,[[0,0x04034b50,4],[4,20,2],[6,0x800,2],[14,sum,4],[18,data.length,4],[22,data.length,4],[26,name.length,2]]);
      const ch=header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[8,0x800,2],[16,sum,4],[20,data.length,4],[24,data.length,4],[28,name.length,2],[42,offset,4]]);
      parts.push(local,name,data);central.push(ch,name);offset+=30+name.length+data.length;cs+=46+name.length;
    }
    const end=header(22,[[0,0x06054b50,4],[8,files.length,2],[10,files.length,2],[12,cs,4],[16,offset,4]]);
    return new Blob([...parts,...central,end],{type:'application/zip'});
  }
  document.querySelectorAll('[data-package]').forEach(a=>a.addEventListener('click',async e=>{
    e.preventDefault();if(a.dataset.busy)return;a.dataset.busy='1';const label=a.textContent;
    try{
      const scope=a.closest('article')||document;
      const urls=[...new Set([...scope.querySelectorAll('img[src]')].map(img=>new URL(img.getAttribute('src'),location.href)).filter(url=>/\/(gallery|details)\//.test(url.pathname)).map(url=>url.href))];
      const files=urls.map(url=>({url,name:decodeURIComponent(new URL(url).pathname.split('/assets/')[1])}));
      scope.querySelectorAll('article').forEach(article=>{const texts=[...article.querySelectorAll('textarea')].map(t=>t.value).join('\n\n');if(texts)files.push({url:URL.createObjectURL(new Blob([texts],{type:'text/plain'})),name:article.id+'/listing.txt'});});
      if(scope.matches?.('article')){const texts=[...scope.querySelectorAll('textarea')].map(t=>t.value).join('\n\n');if(texts)files.push({url:URL.createObjectURL(new Blob([texts])),name:scope.id+'/listing.txt'});}
      if(!files.length)throw Error('没有可打包的图片');
      const blob=await pack(files,(i,n)=>a.textContent=`正在打包 ${i}/${n}…`);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=a.dataset.package.split('/').pop();link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);files.filter(f=>f.url.startsWith('blob:')).forEach(f=>URL.revokeObjectURL(f.url));
      a.textContent='下载已准备好';
    }catch(err){a.textContent='打包失败，点击重试';console.error(err);}finally{delete a.dataset.busy;setTimeout(()=>a.textContent=label,4000);}
  }));
})();
