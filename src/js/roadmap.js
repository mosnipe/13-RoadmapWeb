// ロードマップ表示画面のメインロジック
import { StorageManager } from './storage.js';
import { CONFIG } from './config.js';

class RoadmapViewer {
  constructor() {
    this.roadmapData = [];
    this.init();
  }

  init() {
    this.loadData();
    this.setupEventListeners();
  }

  loadData() {
    const savedData = StorageManager.get(CONFIG.STORAGE_KEYS.ROADMAP_DATA);
    if (savedData?.items) {
      this.roadmapData = savedData.items;
      this.render();
    } else {
      this.showEmptyState();
    }
  }

  setupEventListeners() {
    document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
      this.exportPDF();
    });

    document.getElementById('export-png-btn')?.addEventListener('click', () => {
      this.exportPNG();
    });
  }

  render() {
    if (this.roadmapData.length === 0) {
      this.showEmptyState();
      return;
    }

    // データを年月でグループ化
    const groupedByYearMonth = this.groupByYearMonth(this.roadmapData);
    const contentEl = document.getElementById('roadmap-content');
    
    let html = '';
    let isFirstYear = true;

    Object.keys(groupedByYearMonth).sort().forEach(yearMonth => {
      const [year, month] = yearMonth.split('-');
      const items = groupedByYearMonth[yearMonth];
      
      // 年が変わったら年ラベルを表示
      const prevYearMonth = Object.keys(groupedByYearMonth).sort().find(ym => ym < yearMonth);
      const prevYear = prevYearMonth ? prevYearMonth.split('-')[0] : null;
      
      if (prevYear !== year) {
        if (!isFirstYear) {
          html += '</div>'; // 前の年のグループを閉じる
        }
        html += `<div class="mb-10"><span class="text-sm font-bold text-slate-900 dark:text-white">${year}年</span></div>`;
        html += '<div class="relative space-y-16"><div class="timeline-line"></div>';
        isFirstYear = false;
      }

      // 月のマーカーとコンテンツ
      html += this.renderMonthSection(year, month, items);
    });

    if (!isFirstYear) {
      html += '</div></div>'; // 最後の年のグループを閉じる
    }

    contentEl.innerHTML = html;
  }

  groupByYearMonth(data) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  renderMonthSection(year, month, items) {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthName = monthNames[month - 1];
    
    // 過去/未来の判定
    const now = new Date();
    const itemDate = new Date(year, month - 1);
    const isPast = itemDate < now;
    
    // 日付でグループ化
    const byDate = this.groupByDate(items);
    
    let html = `
      <div class="relative pl-16">
        <div class="absolute left-0 top-0 w-[48px] h-[48px] rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center z-10 border-4 border-white dark:border-background-dark">
          <span class="text-primary dark:text-blue-300 font-bold text-sm">${month}</span>
        </div>
        <div class="pt-2">
    `;

    if (isPast) {
      html += `<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">${year}年${monthName}のリリース</h2>`;
    } else {
      html += `<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">${year}年${monthName}のリリース予定</h2>`;
    }

    // 日付ごとに表示
    const sortedDates = Object.keys(byDate).sort();
    sortedDates.forEach((dateKey, index) => {
      const dateItems = byDate[dateKey];
      const date = new Date(dateKey);
      const day = date.getDate();
      
      // 日付ラベルを表示
      html += `<div class="mb-6 ${index > 0 ? 'mt-8' : ''}">`;
      html += `<h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">${day}日</h3>`;
      
      // カテゴリでグループ化
      const byCategory = this.groupByCategory(dateItems);
      
      // カテゴリごとに表示
      Object.keys(byCategory).forEach(category => {
        const categoryItems = byCategory[category];
        html += this.renderCategory(category, categoryItems);
      });
      
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  groupByDate(items) {
    const grouped = {};
    
    items.forEach(item => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  groupByCategory(items) {
    const grouped = {};
    items.forEach(item => {
      const category = item.category || 'その他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }

  renderCategory(category, items) {
    let html = `
      <div class="mb-8">
        <h4 class="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">${this.escapeHtml(category)}</h4>
        <div class="dotted-line mb-4"></div>
        <ul class="list-disc ml-5 space-y-3 text-slate-600 dark:text-slate-400">
    `;

    items.forEach(item => {
      const statusBadge = this.getStatusBadge(item.status);
      html += `
        <li>
          <span class="font-medium">${this.escapeHtml(item.title)}</span>
          ${statusBadge}
          ${item.assignee ? `<span class="text-xs text-slate-500 ml-2">(${this.escapeHtml(item.assignee)})</span>` : ''}
        </li>
      `;
    });

    html += '</ul></div>';
    return html;
  }

  getStatusBadge(status) {
    const statusUpper = status?.toUpperCase() || '';
    let badgeClass = 'roadmap-status-badge';
    
    if (statusUpper.includes('MERGED') || statusUpper.includes('COMPLETED')) {
      badgeClass += ' roadmap-status-badge-merged';
    } else if (statusUpper.includes('PROGRESS')) {
      badgeClass += ' roadmap-status-badge-progress';
    } else {
      badgeClass += ' roadmap-status-badge-backlog';
    }
    
    return `<span class="${badgeClass}">${this.escapeHtml(status)}</span>`;
  }

  showEmptyState() {
    const contentEl = document.getElementById('roadmap-content');
    contentEl.innerHTML = `
      <div class="text-center py-12 text-slate-500 dark:text-slate-400">
        <span class="material-icons-outlined text-5xl mb-4 block">timeline</span>
        <p class="mb-4">データがありません</p>
        <a href="integrations.html" class="text-primary hover:underline">設定画面でデータをアップロードしてください</a>
      </div>
    `;
  }

  async exportPDF() {
    try {
      // グローバルに読み込まれたライブラリを使用
      if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        alert('エクスポートライブラリの読み込みに失敗しました。ページを再読み込みしてください。');
        return;
      }
      
      const { jsPDF } = window.jspdf;
      
      // タイトルとコンテンツを含む親要素を取得
      const titleEl = document.getElementById('roadmap-title');
      const content = document.getElementById('roadmap-content');
      
      // エクスポート用の一時的なコンテナを作成
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '794px'; // A4幅（210mm）をピクセルに変換（96 DPI基準）
      exportContainer.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
      exportContainer.style.padding = '40px';
      exportContainer.style.fontFamily = 'Inter, "Noto Sans JP", sans-serif';
      exportContainer.style.color = document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b';
      
      // タイトルを追加
      const titleClone = titleEl.cloneNode(true);
      titleClone.style.fontSize = '28px';
      titleClone.style.fontWeight = 'bold';
      titleClone.style.marginBottom = '24px';
      titleClone.style.color = document.documentElement.classList.contains('dark') ? '#ffffff' : '#1e293b';
      exportContainer.appendChild(titleClone);
      
      // コンテンツを追加（スタイルを継承）
      const contentClone = content.cloneNode(true);
      exportContainer.appendChild(contentClone);
      
      document.body.appendChild(exportContainer);
      
      // 画像としてキャプチャ
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: exportContainer.offsetWidth,
        height: exportContainer.offsetHeight
      });
      
      // 一時コンテナを削除
      document.body.removeChild(exportContainer);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // A4サイズの設定（mm単位）
      const a4Width = 210; // A4 width in mm
      const a4Height = 297; // A4 height in mm
      const margin = 10; // マージン（mm）
      const contentWidth = a4Width - (margin * 2);
      const contentHeight = a4Height - (margin * 2);
      
      // 画像のアスペクト比を維持しながらA4サイズに収める
      const imgAspectRatio = canvas.width / canvas.height;
      const contentAspectRatio = contentWidth / contentHeight;
      
      let imgWidth, imgHeight;
      if (imgAspectRatio > contentAspectRatio) {
        // 画像が横長の場合、幅に合わせる
        imgWidth = contentWidth;
        imgHeight = contentWidth / imgAspectRatio;
      } else {
        // 画像が縦長の場合、高さに合わせる
        imgHeight = contentHeight;
        imgWidth = contentHeight * imgAspectRatio;
      }
      
      const doc = new jsPDF('p', 'mm', 'a4');
      let yPosition = margin;
      let remainingHeight = imgHeight;
      
      // 最初のページに画像を追加
      const firstPageHeight = Math.min(imgHeight, contentHeight);
      doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, firstPageHeight, undefined, 'FAST');
      remainingHeight -= firstPageHeight;
      
      // 複数ページ対応
      while (remainingHeight > 0) {
        doc.addPage();
        yPosition = margin;
        const pageHeight = Math.min(remainingHeight, contentHeight);
        
        // 画像の一部を次のページに表示するため、ソース位置を計算
        const sourceY = (imgHeight - remainingHeight) / imgHeight;
        const sourceHeight = pageHeight / imgHeight;
        
        // 画像の一部を切り出すための一時キャンバス
        const tempCanvas = document.createElement('canvas');
        const sourceYInPixels = Math.floor(sourceY * canvas.height);
        const sourceHeightInPixels = Math.ceil(sourceHeight * canvas.height);
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeightInPixels;
        const ctx = tempCanvas.getContext('2d');
        
        // ソース画像から必要な部分をコピー
        ctx.drawImage(
          canvas,
          0, sourceYInPixels,
          canvas.width, sourceHeightInPixels,
          0, 0,
          tempCanvas.width, tempCanvas.height
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
        const pageImgWidth = imgWidth;
        const pageImgHeightScaled = (tempCanvas.height / tempCanvas.width) * pageImgWidth;
        
        doc.addImage(pageImgData, 'PNG', margin, yPosition, pageImgWidth, pageImgHeightScaled, undefined, 'FAST');
        
        remainingHeight -= pageHeight;
      }
      
      doc.save('roadmap.pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDFのエクスポートに失敗しました: ' + error.message);
    }
  }

  async exportPNG() {
    try {
      // グローバルに読み込まれたライブラリを使用
      if (typeof html2canvas === 'undefined') {
        alert('エクスポートライブラリの読み込みに失敗しました。ページを再読み込みしてください。');
        return;
      }
      
      const content = document.getElementById('roadmap-content');
      
      // ローディング表示
      const originalContent = content.innerHTML;
      content.innerHTML = '<div class="text-center py-12"><p>画像を生成中...</p></div>';
      
      const canvas = await html2canvas(content.parentElement, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // 元のコンテンツを復元
      content.innerHTML = originalContent;
      
      const link = document.createElement('a');
      link.download = 'roadmap.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('PNG export error:', error);
      alert('PNGのエクスポートに失敗しました: ' + error.message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new RoadmapViewer();
});
