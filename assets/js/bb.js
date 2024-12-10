const memo = {
    host: 'https://memos.ee', // 默认值
    limit: '100',
    creatorId: '1',
    domId: '#posts',
};

// 如果传入了 memos 参数，则覆盖默认值
if (typeof memos !== "undefined") {
    for (let key in memos) {
        if (memos[key]) {
            memo[key] = memos[key];
        }
    }
}

var memohost = memo.host.replace(/\/$/, '')
var load = '<div class="nav-links"><span id="load-more" class="loadmore">加载更多</span></div>'

window.onload = function() {
    let offset = 0;
    const limit = 10;
    let avatarurl, memoname, userurl, description;

    // 获取用户信息
    fetchUserInfo()
        .then(fetchAndDisplayMemos)
        .catch(error => console.error('Error initializing:', error));

    function fetchUserInfo() {
        return fetch(`${memohost}/api/v1/users/${memo.creatorId}`)
            .then(response => response.json())
            .then(userData => {
                avatarurl = `${memohost}${userData.avatarUrl}`;
                memoname = userData.nickname;
                userurl = `${memohost}/u/${userData.username}`;
                description = userData.description;
            });
    }

    function fetchAndDisplayMemos() {
        fetchMemos().then(data => {
            const memosContainer = document.querySelector(memo.domId);
            const memosToShow = data.slice(offset, offset + limit);

            // 移除旧的“加载更多”按钮
            const oldLoadMoreButton = document.getElementById('load-more');
            if (oldLoadMoreButton) {
                oldLoadMoreButton.remove();
            }

            // 插入新的内容
            memosContainer.insertAdjacentHTML('beforeend', formatHTML(memosToShow));
            offset += limit;

            // 插入新的“加载更多”按钮
            memosContainer.insertAdjacentHTML('beforeend', load);

            // 如果没有更多的 memos，隐藏“加载更多”按钮
            if (offset >= data.length) {
                document.getElementById('load-more').style.display = 'none';
            }

            // 确保“加载更多”按钮存在后再添加事件监听器
            const loadMoreButton = document.getElementById('load-more');
            if (loadMoreButton) {
                loadMoreButton.removeEventListener('click', fetchAndDisplayMemos); // 移除旧的事件监听器
                loadMoreButton.addEventListener('click', fetchAndDisplayMemos); // 添加新的事件监听器
            }
        });
    }

    function fetchMemos() {
        return fetch(`${memohost}/api/v1/memos?pageSize=${memo.limit}&filter=visibilities%20==%20[%27PUBLIC%27]%20%26%26%20creator%20==%20%27users/${memo.creatorId}%27&view=MEMO_VIEW_FULL`)
            .then(response => response.json())
            .then(data => data.memos)
            .catch(error => {
                console.error('Error fetching memos:', error);
                return [];
            });
    }

    function formatHTML(memosData) {
        return memosData.map(memodata => {
            const { content, resources, uid, createTime } = memodata;
            const imageUrlMatch = content.match(/\((https?.+?\.(?:jpeg|jpg|gif|png))\)/i);
            const imageUrl = imageUrlMatch ? imageUrlMatch[1] : "";
            const resourceElement = resources.reduce((acc, resource) => {
                const resourceUrl = resource.externalLink || `${memohost}/file/${resource.name}/${resource.filename}`;
                const isImage = /\.(jpeg|jpg|gif|png|bmp|webp)/i.test(resourceUrl);
                return acc + (isImage ? `<a href="${resourceUrl}" target="_blank"><img src="${resourceUrl}" data-fancybox="img" class="thumbnail-image img"></a>` : `<a href="${resourceUrl}" target="_blank">点击下载</a>`);
            }, imageUrl ? `<img src="${imageUrl}" class="img">` : "");

            const htmlContent = marked.parse(content.replace(/#(.*?)\s/g, '').replace(/\!?\[(.*?)\]\((.*?)\)/g, ''));
            const processedContent = processLinks(htmlContent);

            return `
            <article class='post--item post--item__status'>
                <div class='content'>
                    <header>
                        <a href="${userurl}" target="_blank"><img src="${avatarurl}" no-view class="avatar" width="48" height="48" /></a>
                        <a class="humane--time" href="${getMemoUrl(uid)}" target="_blank">${new Date(createTime).toLocaleString()}</a>
                    </header>
                    <div class="description" itemprop="about">
                        ${processedContent}
                        <div class="resimg">${resourceElement}</div>
                    </div>
                </div>
            </article>`;
        }).join('');
    }

    window.ViewImage && ViewImage.init('.content img');
};

function getMemoUrl(uid) {
    return uid && memohost ? `${memohost}/m/${uid}` : '#';
}

function processLinks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('a').forEach(link => link.target = '_blank');
    return doc.body.innerHTML;
}
// 创建一个新的 <style> 元素
var style = document.createElement('style');

// 设置 <style> 元素的内容
style.type = 'text/css';
style.innerHTML = `
div pre code {
  /* 迫使文字断行 */
  white-space: pre-wrap; /* CSS3 */
  word-wrap: break-word; /* 老版本的浏览器 */
  overflow-wrap: break-word;  
  /* 指定如何断行 */
  word-break: break-all;  
  word-break: break-word;  
}
div p a {
  word-break: break-all;  
  word-break: break-word;  
}
.thumbnail-image {
    width:100%;
    height: 200px;  
    align-items: center; 
    justify-content: center;
    overflow: hidden;
    border-radius:4px;
    transition:transform .3s ease;
    cursor:zoom-in;
}
.resimg {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 10px; 
    row-gap: 10px; 
}
.thumbnail-image img {
    width:100%;
    min-height: 200px;
    object-fit:cover;
} 
img {
    object-fit: cover; /* 保持图片的纵横比，但会将图片裁剪以填充容器 */
    object-position: center; /* 保证中央部分 */
} 
/* 当屏幕宽度小于732px时 */
@media (max-width: 732px) {
    .resimg {
        grid-template-columns: repeat(2, 1fr); /* 修改为两列 */
    }
}
/* 当屏幕宽度小于400px时 */
@media (max-width: 400px) {
    .resimg {
        grid-template-columns: 1fr; /* 修改为一列 */
    }
}  
.nav-links .loadmore {
    border: 1px solid var(--farallon-border-color);
    cursor: pointer;
    position: relative;
    padding: 5px 30px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--farallon-text-gray)
}

.nav-links .loadmore:hover {
    border-color: var(--farallon-hover-color);
    color: var(--farallon-hover-color)
}  
.graph a {
    text-decoration: none !important;
}
`;

// 将 <style> 元素插入到 <head> 中
document.head.appendChild(style);


