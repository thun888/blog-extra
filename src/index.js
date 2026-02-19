import tippy from 'tippy.js';
import { createNoise2D } from 'simplex-noise';
import NProgress from 'nprogress';

import 'flying-pages';
import 'nprogress/nprogress.css';
import 'tippy.js/dist/tippy.css';
// 默认已经有透明度动画了，不需要额外引入
// import 'tippy.js/animations/scale.css';
import 'tippy.js/themes/light-border.css';
import 'hexo-math/dist/style.css';
import '@thun888/live-photo/dist/main.css';
// 导入style下的所有css
import './style/main.css';
import './style/artalk.css';
import './style/copy-code.css';
import './style/print-hide.css';
/* 运行时间 */
// var now=new Date();function createtime(){var grt=new Date("07/8/2021 23:30:00");now.setTime(now.getTime()+250);days=(now-grt)/1000/60/60/24;dnum=Math.floor(days);hours=(now-grt)/1000/60/60-(24*dnum);hnum=Math.floor(hours);if(String(hnum).length==1){hnum="0"+hnum}minutes=(now-grt)/1000/60-(24*60*dnum)-(60*hnum);mnum=Math.floor(minutes);if(String(mnum).length==1){mnum="0"+mnum}seconds=(now-grt)/1000-(24*60*60*dnum)-(60*60*hnum)-(60*mnum);snum=Math.round(seconds);if(String(snum).length==1){snum="0"+snum}document.getElementById("timeDate").innerHTML="已运行&nbsp"+dnum+"&nbsp天";document.getElementById("times").innerHTML=hnum+"&nbsp小时&nbsp"+mnum+"&nbsp分&nbsp"+snum+"&nbsp秒"}setInterval("createtime()",250);
//复制提醒
document.addEventListener('copy',function(){hud.toast("复制成功，转载请注明出处", 2500);});

// 插入link-icon
function insertLinkIcons() {
  const links = document.querySelectorAll('article.md-text.content p a, footer.page-footer.footnote a:not(div.sitemap a)');
  const skipSelectors = [
    '.tag-plugin.users-wrap',
    '.tag-plugin.sites-wrap',
    '.tag-plugin.ghcard',
    '.tag-plugin.link.dis-select',
    '.tag-plugin.colorful.note',
    '.social-wrap.dis-select'
  ].join(',');

  links.forEach(link => {
    if (link.closest(skipSelectors)) return;

    const href = link.getAttribute('href');
    if (!href || (!href.startsWith('http') && !href.startsWith('/'))) return;

    link.insertAdjacentHTML('beforeend', `<span style="white-space: nowrap;padding: 0px 5px 0 2px;" id="link-icon"><svg width=".7em"height=".7em"viewBox="0 0 21 21"xmlns="http://www.w3.org/2000/svg"><path d="m13 3l3.293 3.293l-7 7l1.414 1.414l7-7L21 11V3z"fill="currentColor"/><path d="M19 19H5V5h7l-2-2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5l-2-2v7z"fill="currentColor"></svg></span>`);
  });
}


// 插入字数统计
function updatePostStats() {
  if (document.getElementById("all-posts-count")) {
    document.getElementById("all-posts-count").innerHTML = allpostscount;
  }
  if (document.getElementById("all-post-words")) {
    document.getElementById("all-post-words").innerHTML = allpostswords;
  }
  // 过期提醒
  let update_time = document.getElementById("updated-time")?.getAttribute("datetime");
  if (update_time) {
    let upgrade_time_days = Math.floor((new Date() - new Date(update_time)) / 1000 / 60 / 60 / 24);
    if (upgrade_time_days > 180 && document.getElementById('expiration-reminder')) {
      document.getElementById('expiration-reminder').innerHTML = `<div class="tag-plugin colorful note" color="orange"><div class="title"><strong>提醒</strong></div><div class="body"><p>本文最后更新于 ${upgrade_time_days} 天前，其中某些信息可能已经过时，请谨慎使用！<br>如果发现内容有误，请在评论区告知。</p></div></div>`;
    }
  }
}


function initImageOptimization() {
    // 从页面中提取第一个AVIF图片链接
    // function getFirstPictureUrl(type) {
    //   const images = document.querySelectorAll('img');
    //   for (let img of images) {
    //     if (img.getAttribute("data-src") && img.getAttribute("data-src").includes('fmt=',type)) {
    //       return img.getAttribute("data-src");
    //     }
    //   }
    //   return null;
    // }
  
    // 检测浏览器是否支持AVIF格式
    function supportCheck(type, url) {
      return new Promise(resolve => {
        // 先从localStorage中获取结果
        const result = localStorage.getItem("support_" + type);
        if (result !== null) {
          // 如果结果存在，就直接返回
          console.log(type, "support status loaded from localStorage:", result === "true");
          resolve(result === "true");
        } else {
          // 如果结果不存在，就进行检测
          const image = new Image();
          image.src = url;
          image.onload = () => {
            console.log(type, "supported");
            // 将结果保存到localStorage
            localStorage.setItem("support_" + type, "true");
            resolve(true);
          };
          image.onerror = () => {
            console.log(type, "not supported");
            // 将结果保存到localStorage
            localStorage.setItem("support_" + type, "false");
            // 显示提示消息
            hud.toast(`当前浏览器不支持使用${type}，已降级为使用其他格式`, 2500);
            resolve(false);
          };
        }
      });
    }
    
  
    // 替换图片URL中的avif为webp
    function replacepicture(from, to) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        let attr = img.src.startsWith('data') ? 'data-src' : 'src';
        if (img.getAttribute(attr) && img.getAttribute(attr).includes('fmt=' + from)) {
          if (to == "") {
            console.log("Replacing ", from, " with origin ext for image:", img.getAttribute(attr));
            img.setAttribute(attr, img.getAttribute(attr).replace('fmt=' + from, ''));
          } else {
            console.log("Replacing ", from, " with ", to, " for image:", img.getAttribute(attr));
            img.setAttribute(attr, img.getAttribute(attr).replace('fmt=' + from, 'fmt=' + to));
          }
        }
      });
    }
    

  const firstAvifUrl = "/img/check/status.avif"; // 获取第一个AVIF图片链接
  // 使用第一个AVIF图片链接进行检测
  supportCheck("AVIF", firstAvifUrl).then(supported => {
    if (!supported) {
      replacepicture("avif", "webp");
      const firstWebpUrl = "/img/check/status.webp"; // 获取第一个WEBP图片链接
      supportCheck("WEBP", firstWebpUrl).then(supported => {
        if (!supported) {
          // hud.toast("当前浏览器不支持使用webp，已降级为使用原始图片", 2500);
          // replacepicture("webp","");
          replacepicture("webp", "png");
        } else {
          console.log("Webp images will be used.");
        }
      });
    } else {
      console.log("AVIF images will be used.");
    }
  });

  selectFastNode();
}


  // 看看哪个节点快
  function selectFastNode(force) {
    console.log('[ONEP,selectFastNode] Running...');
    const selectdisabled = localStorage.getItem('onep.cdn.select.disabled');
    if (selectdisabled) {
      console.log('[ONEP,selectFastNode] Skipping due to select disabled.');
      return;
    }
    const storedData = localStorage.getItem('onep.cdn.nodelist');
    if (storedData) {
      const data = JSON.parse(storedData);
      const now = new Date();
      if (data.link === null && now.getTime() - data.time < 5 * 60 * 1000 && !force) {
        console.log('[ONEP,selectFastNode] Skipping due to recent failure to fetch nodes.');
        return;
      } else if (now.getTime() - data.time < 5 * 60 * 1000 && !force) {
        replaceImageSource(data.link);
        return;
      }
    }
  
    const formData = new FormData();
    formData.append('token', 'hzchu.top');
  
    fetch('https://onep.hzchu.top/_api/nodeslist', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.nodes && Object.keys(data.nodes).length > 0) {
        const nodes = Object.values(data.nodes);
        let fastestNode = null;
        let fastestTime = Infinity;

        const promises = nodes.map(node => {
          const startTime = performance.now();
          // 添加随机查询参数以避免缓存
          const url = `${node}/mount/watermask.png?cache_buster=${Math.random()}`;
          return fetch(url)
            .then(() => {
              const endTime = performance.now();
              const duration = endTime - startTime;
              if (duration < fastestTime) {
                fastestTime = duration;
                fastestNode = node;
              }
            })
            .catch(error => {
              console.error('[ONEP,selectFastNode] Error pinging node:', node, error);
            });
        });

        Promise.all(promises).then(() => {
          if (fastestNode) {
            replaceImageSource(fastestNode);
            localStorage.setItem('onep.cdn.nodelist', JSON.stringify({
              link: fastestNode,
              time: new Date().getTime()
            }));
            console.log('[ONEP,selectFastNode] Selected fastest node:', fastestNode);
          } else {
            console.log('[ONEP,selectFastNode] No nodes responded successfully.');
          }
        });
      } else {
        console.log('[ONEP,selectFastNode] Failed to fetch nodes, will skip checks for the next 5 minutes.');
        localStorage.setItem('onep.cdn.nodelist', JSON.stringify({
          link: null,
          time: new Date().getTime()
        }));
      }
    })
    .catch(error => {
      console.error('[ONEP,selectFastNode] Error:', error);
      localStorage.setItem('onep.cdn.nodelist', JSON.stringify({
        link: null,
        time: new Date().getTime()
      }));
    });
    console.log('[ONEP,selectFastNode] Testing nodes...');
    return true;
  }
  
  function replaceImageSource(newLink) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.getAttribute('src') && img.getAttribute('src').startsWith('https://onep.hzchu.top')) {
        console.log("[ONEP,selectFastNode] Replacing ", img.getAttribute('src'), " with ", newLink);
        img.setAttribute('src', img.getAttribute('src').replace('https://onep.hzchu.top', newLink));
        if (img.getAttribute('data-src')) {
          img.setAttribute('data-src', img.getAttribute('data-src').replace('https://onep.hzchu.top', newLink));
        }
      }
    });
  }

// 删除模式
let deleteMode = false;

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    if (deleteMode) {
      hud.toast("已开启删除模式", 2500);
      document.addEventListener('click', deleteElement, true);
    } else {
      hud.toast("已关闭删除模式", 2500);
      document.removeEventListener('click', deleteElement, true);
    }
}


function deleteElement(event) {
  if (deleteMode && event.target !== document.body && !event.target.closest('.delmode-btn') && !event.target.closest('.float-panel')) {
    event.preventDefault(); // 阻止默认行为
    event.target.remove();
  }
}


// 给超长代码块增加滚动条 @Summer
function addCodeBlockScrollbar() {
  // 选择所有的.md-text元素
  var codeBlocks = document.querySelectorAll('.md-text');
  // 遍历每个.md-text元素
  codeBlocks.forEach(function(block) {
    // 检查是否包含.highlight类的子元素，且父元素高度超过500px
    var highlightBlocks = block.querySelectorAll('.highlight');
    highlightBlocks.forEach(function(highlightBlock) {
      if (highlightBlock.clientHeight > 500) {
        highlightBlock.style.maxHeight = '500px';
        highlightBlock.style.overflow = 'auto';
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", addCodeBlockScrollbar);
document.addEventListener("pjax:complete", addCodeBlockScrollbar);

// 背景生成

function generatePoints(w, h, n, maxd, mind, circle_radius, maxAttempts = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 先随机一个中心，让圆都能在边界内
    let cx = randRange(circle_radius, w - circle_radius);
    let cy = randRange(circle_radius, h - circle_radius);
    let clusterR = maxd / 2;

    // 极坐标生成 n 个点
    let pts = [];
    for (let i = 0; i < n; i++) {
      let theta = Math.random() * 2 * Math.PI;
      let r = clusterR * Math.sqrt(Math.random());
      let x = cx + r * Math.cos(theta);
      let y = cy + r * Math.sin(theta);
      pts.push({x, y});
    }

    // 检查两两距离约束
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pts[i].x - pts[j].x;
        let dy = pts[i].y - pts[j].y;
        let d = Math.hypot(dx, dy);
        if (d < mind || d > maxd) {
          ok = false;
          break;
        }
      }
    }

    if (ok) {
      // 再附加检查：每个点离边界 ≥ circle_radius
      let inBounds = pts.every(p => p.x >= circle_radius && p.x <= w - circle_radius && p.y >= circle_radius && p.y <= h - circle_radius);
      if (inBounds) return pts;
    }
  }
  return null;
}

// 获取 [min, max] 随机浮点
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// 主画图函数
function drawClouds(status) {
  const W = document.querySelector('.sidebg').getBoundingClientRect().width
  const H = document.querySelector('.sidebg').getBoundingClientRect().height
  const pointCount = 5
  const minDist = 10
  const maxDist = 40
  const circle_radius = 25

  const cloudCanvas = document.getElementById("cloud-canvas");
  cloudCanvas.width = W; 
  cloudCanvas.height = H;
  const ctx = cloudCanvas.getContext("2d");

  // localStorage 的 key
  const keyW    = 'clouds-canvas-width';
  const keyH    = 'clouds-canvas-height';
  const keyData = 'clouds-canvas-data';
  const keyCacheTime = 'clouds-canvas-cache-time';
  // 尝试读取缓存
  const cachedW    = localStorage.getItem(keyW);
  const cachedH    = localStorage.getItem(keyH);
  const cachedImg = localStorage.getItem(keyData);
  const cachedCacheTime = localStorage.getItem(keyCacheTime);
  const currentTime = new Date().getTime();

  if (cachedImg && +cachedW === W && +cachedH === H && (currentTime - cachedCacheTime < 10 * 60 * 1000) && !status) {
    // 如果缓存存在且尺寸一致，就直接绘制缓存图
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);
      // console.log('[DrawClouds] 背景从缓存中加载');
    };
    img.src = cachedImg;
    return;
  }

  console.log('[DrawClouds] 开始重新绘制背景');
  fetch("https://generate-cloud-image.hzchu.top/v1/image?format=json")
  .then(res => res.json())
  .then(data => {
    const cloudCount = data.cloud_count
    const color = data.color
    // 透明背景
    ctx.clearRect(0, 0, W, H);
  
    for (let ci = 0; ci < cloudCount; ci++) {
      const pts = generatePoints(W, H, pointCount, maxDist, minDist, circle_radius);
      if (!pts) {
        console.log(`[DrawClouds] 第 ${ci+1} 朵云生成失败！`);
        return;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let p of pts) {
        ctx.moveTo(p.x + circle_radius, p.y);
        ctx.arc(p.x, p.y, circle_radius, 0, 2 * Math.PI);
      }
      ctx.fill();
    }
    try {
      const dataURL = cloudCanvas.toDataURL('image/png');
      localStorage.setItem(keyW, W);
      localStorage.setItem(keyH, H);
      localStorage.setItem(keyData, dataURL);
      localStorage.setItem(keyCacheTime, currentTime);
      console.log('[DrawClouds] 背景已缓存');
    } catch (err) {
      console.warn('[DrawClouds] 缓存到 localStorage 失败:', err);
    }
    })
    .catch(error => {
      console.error('[DrawClouds] 获取云朵数据失败:', error);
    });
}


function drawBackground(status, theme = "light") {
  const canvas = document.getElementById('background-canvas');
  // 背景不要右键菜单啊
  // 使用css实现
  // canvas.addEventListener('contextmenu', (e) => {
  // e.preventDefault();
  // });
  const ctx = canvas.getContext('2d');

  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width  = W;
  canvas.height = H;

  const keyW    = 'background-canvas-width';
  const keyH    = 'background-canvas-height';
  const keyData = 'background-canvas-data';
  const keyCacheTime = 'background-canvas-cache-time';
  const keyTheme = 'background-theme';
  // 尝试读取缓存
  const cachedW    = localStorage.getItem(keyW);
  const cachedH    = localStorage.getItem(keyH);
  const cachedImg = localStorage.getItem(keyData);
  const cachedCacheTime = localStorage.getItem(keyCacheTime);
  const cachedTheme = localStorage.getItem(keyTheme);
  const currentTime = new Date().getTime();

  if (cachedImg && +cachedW === W && +cachedH === H && (currentTime - cachedCacheTime < 10 * 60 * 1000) && !status && cachedTheme === theme) {
    // 如果缓存存在且尺寸一致，就直接绘制缓存图
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);
      // console.log('[Background] 背景从缓存中加载');
    };
    img.src = cachedImg;
    return;
  }

  console.log('[background] 开始重新绘制背景');
  const noise2D = new createNoise2D();

  // 设置参数
  const cols  = W;
  const rows  = H;
  // const cellSize = Math.floor(window.devicePixelRatio);
  const cellSize = 1;
  const contourLevels = 10;

  // 生成高度图
  const heightMap = [];
  for (let y = 0; y <= rows; y++) {
    heightMap[y] = [];
    for (let x = 0; x <= cols; x++) {
      const nx = x / cols;
      const ny = y / rows;
      heightMap[y][x] = noise2D(nx * 3, ny * 3);
    }
  }

  // 绘制多层等高线
  for (let i = 0; i < contourLevels; i++) {
    const level = -1 + (2 * i) / contourLevels;
    drawContour(ctx, cellSize, cols, rows, heightMap, level, theme);
  }

  try {
    const dataURL = canvas.toDataURL('image/png');
    localStorage.setItem(keyW, W);
    localStorage.setItem(keyH, H);
    localStorage.setItem(keyData, dataURL);
    localStorage.setItem(keyCacheTime, currentTime);
    localStorage.setItem(keyTheme, theme);
    console.log('[Background] 背景已缓存');
  } catch (err) {
    console.warn('[Background] 缓存到 localStorage 失败:', err);
  }
}

// 窗口尺寸变化时重绘
// window.addEventListener('resize', () => {
//   localStorage.removeItem('background-canvas-data');
//   localStorage.removeItem('background-canvas-width');
//   localStorage.removeItem('background-canvas-height');
//   drawBackground();
// });

// 平滑曲线插值（用于点集）
function drawSmoothLine(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i][0] + points[i + 1][0]) / 2;
    const yc = (points[i][1] + points[i + 1][1]) / 2;
    ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
  }
  // 结尾
  const n = points.length;
  ctx.quadraticCurveTo(points[n - 2][0], points[n - 2][1], points[n - 1][0], points[n - 1][1]);
  ctx.stroke();
}

// 等高线轮廓生成（采样+插值）
function drawContour(ctx, cellSize, cols, rows, heightMap, level, theme) {
  // theme 为亮暗色主题，不低于线条颜色
  if (theme =='light') {
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  } else if (theme =='dark') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  }
  ctx.lineWidth = 1;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tl = heightMap[y][x];
      const tr = heightMap[y][x + 1];
      const br = heightMap[y + 1][x + 1];
      const bl = heightMap[y + 1][x];

      const sx = x * cellSize;
      const sy = y * cellSize;

      const interpolate = (v1, v2, p1, p2) => {
        const t = (level - v1) / (v2 - v1);
        return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
      };

      const points = [];

      if ((tl - level) * (tr - level) < 0)
        points.push(interpolate(tl, tr, [sx, sy], [sx + cellSize, sy]));
      if ((tr - level) * (br - level) < 0)
        points.push(interpolate(tr, br, [sx + cellSize, sy], [sx + cellSize, sy + cellSize]));
      if ((br - level) * (bl - level) < 0)
        points.push(interpolate(br, bl, [sx + cellSize, sy + cellSize], [sx, sy + cellSize]));
      if ((bl - level) * (tl - level) < 0)
        points.push(interpolate(bl, tl, [sx, sy + cellSize], [sx, sy]));

      if (points.length >= 2) {
        drawSmoothLine(ctx, points);
      }
    }
  }
}


drawClouds(false)
targetPageRerender()


const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function targetPageRerender() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  let theme = 'light'
  if (currentTheme) {
    theme = currentTheme
  }else{
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  drawBackground(false, theme)
}

colorSchemeQuery.addEventListener('change', () => targetPageRerender());

// 实现console.image函数 d.hzchu.top/k2Kty6
console.image = function (url, scale) {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.onload = () => {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    if (ctx) {
      c.width = img.width
      c.height = img.height
      // ctx.fillStyle = "red";
      // ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0)
      const dataUri = c.toDataURL('image/png')

      console.log(`%c sup?` ,
        `
          font-size: 1px;
          padding: ${Math.floor((img.height * scale) / 2)}px ${Math.floor((img.width * scale) / 2)}px;
          background-image: url(${dataUri});
          background-repeat: no-repeat;
          background-size: ${img.width * scale}px ${img.height * scale}px;
          color: transparent;
        `
      )
    }
  }
  img.src = url
}

// 彩蛋
console.warn("To verify that you are a human, please type whereegg() in the console.");

function whereegg() {
  console.image("https://onep.hzchu.top/mount/pic/myself/2025/10/findegg-68de998c3203f.png", 0.2);
  // TODO: 添加延迟，让用户有时间看到第一张图
  console.image("https://onep.hzchu.top/mount/pic/myself/2025/10/eggshape-68dfbd07deb1b.png", 0.2);

  return "Where are my EGGS?";
}


function egg() {
  if (getPageHistory().length < 25){
    let randomValue = Math.floor(Math.random() * 9);
    msg_list = [
      "它从滴露的杜鹃花丛寻起，决意要探遍庭院里每一个被晨光或阴影抚摸的角落。",
      "纤细的爪印，像一枚枚生长的誓言，印在苔痕斑驳的石阶、干草堆积的墙根与潮湿的泥土路上。",
      "蔷薇的尖刺勾落了绒毛，它不在乎，只顾着用喙探入每一道缝隙，仿佛要把整个世界翻过来瞧个仔细。",
      "那执着的搜寻，从菜园的第一垄新绿，蔓延至谷仓幽暗的深处，不曾放过任何一片可疑的寂静。",
      "它飞上风铃草摇曳的篱笆，又钻入鼹鼠挖松的土丘，坚信那颗遗失的宝贝就藏在某个被疏忽的角落里。",
      "阳光筛落林间，它为了一簇可疑的暗影，几乎翻遍了所有橡树根部的落叶与枯枝。",
      "溪水潺潺，它跳过光滑的鹅卵石，检查着每一处河湾，连芦苇丛中都要侧头凝望许久。",
      "从日出时金银花缠绕的东廊，到日暮里紫藤垂挂的西窗，它的寻找织成了一张细密的网，覆盖了整座花园。",
      "每一个空荡的巢，每一片卷曲的树皮，甚至蜗牛留下的银白轨迹，它都要上前，用最温柔的方式叩问。",
      "当黄昏为万物镀上金边，它终于停下——因为它已找遍了全世界，而全世界，最终将它引回那棵初心萌动的白杨树梢。"
    ]
    return msg_list[randomValue]
  }

  let randomValue = Math.ceil(Math.random() * 14);
  let randomImageUrl = `https://emoticons.hzchu.top/emoticons/ye-lu-ye-shi-fu/${randomValue}.webp`;
  console.image(randomImageUrl, 0.2);
  return "Who am I?";
}

function eggs() {
  return "One by one please";
}


// 历史记录
// key
const HISTORY_KEY = "page_history";
// 记录当前页面
function savePageHistory() {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

  const now = new Date();
  const record = {
    url: window.location.href,
    title: document.title,
    time: now.toISOString(), 
    timeText: now.toLocaleString()
  };

  history.push(record);

  // 只保留最近 30 条
  if (history.length > 30) {
    history = history.slice(history.length - 30);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
// 获取历史记录
function getPageHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  return history.slice().reverse();
}
// 页面加载时记录一次
window.addEventListener("load", savePageHistory);
// 用户离开页面时记录
// window.addEventListener("beforeunload", savePageHistory);
// 清空历史记录
function clearPageHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// 激活tippy
function activateTippy() {
  tippy('.annotated',{arrow: true,theme:"light-border"});
}

// 性能遥测，不用
// window.addEventListener("DOMContentLoaded", () => {
//   const nav = performance.getEntriesByType("navigation")[0];
//   const paint = performance.getEntriesByType("paint");

//   const FP = paint.find(e => e.name === "first-paint")?.startTime;
//   const FCP = paint.find(e => e.name === "first-contentful-paint")?.startTime;

//   const result = {
//     dns: nav.domainLookupEnd - nav.domainLookupStart,
//     tcp: nav.connectEnd - nav.connectStart,
//     ttfb: nav.responseStart - nav.startTime,
//     response: nav.responseEnd - nav.responseStart,

//     dom_parse: nav.domInteractive - nav.responseEnd,

//     fp: FP,
//     fcp: FCP,

//     // 首屏到可交互
//     domInteractive: nav.domInteractive,
//     domContentLoaded: nav.domContentLoadedEventEnd,
//     load: nav.loadEventEnd
//   };

//   fetch('http://save_performance_data.hzchu.top/api/v1/save_performance_data', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(result),
//   })
//   .then(response => response.json())
//   .then(data => console.log('Data saved:', data))
//   .catch(error => console.error('Error saving data:', error));
// });


// 节日配置（月-日，前后包含）
const festivals = {
  christmas: {
    start: "12-22",
    end: "12-28",
    title: "圣诞节"
  },
  new_year: {
    start: "12-29",
    end: "02-23",
    title: "新年"
  }
};

function getTodayMMDD() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function isInRange(today, start, end) {
  if (start <= end) {
    return today >= start && today <= end;
  }
  return today >= start || today <= end;
}

function replaceAvatarByFestival() {
  const today = getTodayMMDD();
  for (const festivalName in festivals) {
    const { start, end, title } = festivals[festivalName];
    if (isInRange(today, start, end)) {
      const avatarImgs = document.querySelectorAll('img.avatar');
      if (avatarImgs.length === 0) return;
      avatarImgs.forEach(img => {
        img.src = `/img/special-avatars/avatar-${festivalName}.webp`;
        img.alt = festivalName;
      });
      console.log(`[过个节] 偷偷祝你${title}快乐！`);
      break;
    }
  }
}

replaceAvatarByFestival();

// 转换Artalk评论id，防止干扰锚点
if (window.location.search.includes('atk_comment')) {
  document.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const u = new URL(location)
      const id = u.searchParams.get('atk_comment')
      setTimeout(() => {
        location.replace(u.pathname + `#atk-comment-${id}`)
      }, 2000);
      hud.toast("正在重新加载页面以避免Artalk评论锚点干扰...", 5000);
    });
  });
}
// 适配Artalk懒加载时id定位
function scrollToComment() {
  if (window.location.hash.includes("atk-comment") || window.location.search.includes("atk_comment")) {
    util.scrollComment();
  }
}
// 单行复制
function initSingleLineCopy() {
  document.querySelectorAll('figure.highlight td.code pre span.line')
    .forEach(line => {
      let timer = null

      line.addEventListener('mouseenter', () => {
        timer = setTimeout(() => {
          line.classList.add('copyable')
        }, 800)
      })

      line.addEventListener('mouseleave', () => {
        clearTimeout(timer)
        line.classList.remove('copyable')
        line.classList.remove('copied')
      })

      line.addEventListener('click', () => {
        if (!line.classList.contains('copyable')) return

        navigator.clipboard.writeText(line.innerText).then(() => {
          line.classList.add('copied')
        })
      })
    })
}

// 函数挂载区域
window.NProgress = NProgress;
window.toggleDeleteMode = toggleDeleteMode;
window.targetPageRerender = targetPageRerender;
window.whereegg = whereegg;
window.egg = egg;
window.eggs = eggs;
window.drawBackground = drawBackground;
window.drawClouds = drawClouds;

// 变量配置区域
NProgress.configure({
    showSpinner: false,
    minimum: 0.1,
    trickleSpeed: 200
});

// window.CAP_CUSTOM_WASM_URL =  "https://capjs.hzchu.top/assets/cap_wasm.js";


// 设置DOMContentLoaded区域
document.addEventListener('DOMContentLoaded', activateTippy);
document.addEventListener('DOMContentLoaded', initSingleLineCopy);
document.addEventListener('DOMContentLoaded', initImageOptimization);
document.addEventListener('DOMContentLoaded', updatePostStats);
document.addEventListener('DOMContentLoaded', insertLinkIcons);
document.addEventListener('DOMContentLoaded', scrollToComment); //只需要初次加载时
// 设置pjax:complete区域
document.addEventListener('pjax:complete', activateTippy);
document.addEventListener('pjax:complete', initSingleLineCopy);
document.addEventListener('pjax:complete', initImageOptimization);
document.addEventListener('pjax:complete', updatePostStats);
document.addEventListener('pjax:complete', insertLinkIcons);
