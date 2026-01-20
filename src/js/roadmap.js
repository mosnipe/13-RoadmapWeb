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
    
    // カテゴリでグループ化
    const byCategory = this.groupByCategory(items);
    
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

    // カテゴリごとに表示
    Object.keys(byCategory).forEach(category => {
      const categoryItems = byCategory[category];
      html += this.renderCategory(category, categoryItems);
    });

    html += '</div></div>';
    return html;
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
    let className = 'px-2 py-0.5 rounded text-xs ml-2';
    
    if (statusUpper.includes('MERGED') || statusUpper.includes('COMPLETED')) {
      className += ' bg-blue-500/10 text-blue-400 border border-blue-500/20';
    } else if (statusUpper.includes('PROGRESS')) {
      className += ' bg-primary/10 text-primary border border-primary/20';
    } else {
      className += ' bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
    
    return `<span class="${className}">${this.escapeHtml(status)}</span>`;
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
      
      const content = document.getElementById('roadmap-content');
      const title = document.getElementById('roadmap-title').textContent;
      
      // まず画像としてキャプチャ
      const canvas = await html2canvas(content, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        scale: 2,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // タイトルを追加
      doc.setFontSize(20);
      doc.text(title, 20, 20);
      position = 30;
      
      // 画像を追加
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 複数ページ対応
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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
