// 統合設定画面のメインロジック
import { FileParser } from './fileParser.js';
import { StorageManager } from './storage.js';
import { CONFIG } from './config.js';

class IntegrationsManager {
  constructor() {
    this.githubPRFile = null;
    this.githubIssueFile = null;
    this.csvFile = null;
    this.csvData = [];
    this.githubPRData = [];
    this.githubIssueData = [];
    this.githubCommitData = []; // APIから取得したコミットデータ
    this.columnMapping = StorageManager.getColumnMapping();
    this.allRoadmapData = [];
    this.githubRepoUrl = '';
    this.githubToken = '';
    this.showAllItems = false; // すべての件数を表示するかどうか
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedData();
    this.updatePreview();
    // 初期状態でAPI接続タブを表示
    this.switchTab('api');
  }

  setupEventListeners() {
    // タブ切り替え
    const tabApi = document.getElementById('tab-api');
    const tabFile = document.getElementById('tab-file');

    if (tabApi) {
      tabApi.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('api');
      });
    }

    if (tabFile) {
      tabFile.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('file');
      });
    }

    // GitHubファイルアップロード
    const prDropZone = document.getElementById('pr-drop-zone');
    const prFileInput = document.getElementById('pr-file-input');
    const issueDropZone = document.getElementById('issue-drop-zone');
    const issueFileInput = document.getElementById('issue-file-input');

    this.setupFileDropZone(prDropZone, prFileInput, (file) => {
      this.handleGitHubPRFile(file);
    });

    this.setupFileDropZone(issueDropZone, issueFileInput, (file) => {
      this.handleGitHubIssueFile(file);
    });

    // CSVファイルアップロード
    const csvDropZone = document.getElementById('csv-upload-area');
    const csvFileInput = document.getElementById('csv-file-input');
    const uploadCsvBtn = document.getElementById('upload-csv-btn');

    uploadCsvBtn?.addEventListener('click', () => {
      csvFileInput?.click();
    });

    this.setupFileDropZone(csvDropZone, csvFileInput, (file) => {
      this.handleCSVFile(file);
    });

    // カラムマッピング変更
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('column-mapping-select')) {
        const target = e.target.dataset.target;
        this.columnMapping[target] = e.target.value;
        StorageManager.saveColumnMapping(this.columnMapping);
        this.updatePreview();
      }
    });

    // ボタンイベント
    document.getElementById('save-btn')?.addEventListener('click', () => {
      this.saveAll();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      if (confirm('すべての設定をリセットしますか？')) {
        this.reset();
      }
    });

    document.getElementById('finalizeBtn')?.addEventListener('click', () => {
      window.location.href = 'roadmap.html';
    });

    // GitHub API接続テストボタン
    document.getElementById('test-connection-btn')?.addEventListener('click', () => {
      this.testGitHubConnection();
    });
  }

  switchTab(tab) {
    const tabApi = document.getElementById('tab-api');
    const tabFile = document.getElementById('tab-file');
    const apiSection = document.getElementById('api-connection-section');
    const fileSection = document.getElementById('file-upload-section');

    if (!tabApi || !tabFile) {
      console.error('タブ要素が見つかりません');
      return;
    }

    if (!apiSection || !fileSection) {
      console.error('セクション要素が見つかりません');
      return;
    }

    if (tab === 'api') {
      // API接続タブをアクティブに
      tabApi.className = 'tab-button tab-button-active';
      tabFile.className = 'tab-button tab-button-inactive';
      
      // セクションの表示/非表示
      apiSection.classList.remove('hidden');
      fileSection.classList.add('hidden');
    } else if (tab === 'file') {
      // ファイル読み込みタブをアクティブに
      tabFile.className = 'tab-button tab-button-active';
      tabApi.className = 'tab-button tab-button-inactive';
      
      // セクションの表示/非表示
      fileSection.classList.remove('hidden');
      apiSection.classList.add('hidden');
    }
  }

  setupFileDropZone(dropZone, fileInput, callback) {
    // クリックでファイル選択
    dropZone?.addEventListener('click', () => {
      fileInput?.click();
    });

    // ファイル選択
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        callback(file);
      }
    });

    // ドラッグ&ドロップ
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        callback(file);
      }
    });
  }

  async handleGitHubPRFile(file) {
    if (!file.name.endsWith('.json')) {
      alert('JSONファイルを選択してください');
      return;
    }

    try {
      const data = await FileParser.parseJSON(file);
      this.githubPRData = FileParser.parseGitHubPR(data);
      this.githubPRFile = file;
      
      document.getElementById('pr-file-name').textContent = file.name;
      document.getElementById('github-files-info').classList.remove('hidden');
      this.updateGitHubStatus();
      this.updatePreview();
    } catch (error) {
      console.error('Error parsing GitHub PR file:', error);
      alert('ファイルの解析に失敗しました: ' + error.message);
    }
  }

  async handleGitHubIssueFile(file) {
    if (!file.name.endsWith('.json')) {
      alert('JSONファイルを選択してください');
      return;
    }

    try {
      const data = await FileParser.parseJSON(file);
      this.githubIssueData = FileParser.parseGitHubIssue(data);
      this.githubIssueFile = file;
      
      document.getElementById('issue-file-name').textContent = file.name;
      document.getElementById('github-files-info').classList.remove('hidden');
      this.updateGitHubStatus();
      this.updatePreview();
    } catch (error) {
      console.error('Error parsing GitHub Issue file:', error);
      alert('ファイルの解析に失敗しました: ' + error.message);
    }
  }

  async handleCSVFile(file) {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      alert('CSVまたはExcelファイルを選択してください');
      return;
    }

    try {
      this.csvData = await FileParser.parseFile(file);
      this.csvFile = file;
      
      // ファイル情報表示
      document.getElementById('csv-file-name').textContent = file.name;
      document.getElementById('csv-file-size').textContent = this.formatFileSize(file.size);
      document.getElementById('csv-file-info').classList.remove('hidden');
      document.getElementById('csv-empty-state').classList.add('hidden');
      
      // カラムマッピングUI生成
      await this.generateColumnMappingUI();
      this.updatePreview();
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      alert('ファイルの解析に失敗しました: ' + error.message);
    }
  }

  async generateColumnMappingUI() {
    if (this.csvData.length === 0) return;

    const csvColumns = Object.keys(this.csvData[0]);
    const mappingContainer = document.getElementById('column-mapping');
    if (!mappingContainer) return;
    
    mappingContainer.innerHTML = '';

    const mappingTargets = [
      { key: 'title', label: 'タイトル' },
      { key: 'status', label: 'ステータス' },
      { key: 'assignee', label: '担当者' },
      { key: 'date', label: 'リリース予定日' }
    ];

    mappingTargets.forEach(target => {
      const mappingItem = document.createElement('div');
      mappingItem.className = 'column-mapping-item';
      
      mappingItem.innerHTML = `
        <span class="text-xs text-slate-500">対象: <strong class="text-slate-900">${target.label}</strong></span>
        <select class="column-mapping-select bg-transparent border-none text-[11px] font-bold text-primary p-0 focus:ring-0 text-slate-900" data-target="${target.key}">
          <option value="">選択してください</option>
          ${csvColumns.map(column => `
            <option value="${column}" ${this.columnMapping[target.key] === column ? 'selected' : ''}>${column}</option>
          `).join('')}
        </select>
      `;
      
      mappingContainer.appendChild(mappingItem);
    });
  }

  updatePreview() {
    const tbody = document.getElementById('preview-table-body');
    if (!tbody) return;

    // データを統合（コミットデータも含める）
    this.allRoadmapData = [
      ...this.githubPRData,
      ...this.githubIssueData,
      ...this.githubCommitData,
      ...(this.csvData.length > 0 ? FileParser.mapCSVData(this.csvData, this.columnMapping) : [])
    ];

    if (this.allRoadmapData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            データをアップロードしてください
          </td>
        </tr>
      `;
      return;
    }

    // プレビューテーブル生成（最大10件、またはすべて表示）
    const MAX_PREVIEW_ITEMS = 10;
    const previewItems = this.showAllItems 
      ? this.allRoadmapData 
      : this.allRoadmapData.slice(0, MAX_PREVIEW_ITEMS);
    
    tbody.innerHTML = previewItems.map(roadmapItem => {
      const sourceIcon = roadmapItem.source === 'github' ? 'terminal' : 'table_chart';
      const sourceLabel = roadmapItem.source === 'github' ? roadmapItem.sourceId : 'CSV';
      const statusBadgeClass = this.getStatusClass(roadmapItem.status);
      
      return `
        <tr>
          <td>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] ${roadmapItem.source === 'github' ? 'text-slate-400' : 'text-accent'}">${sourceIcon}</span>
              <span class="text-xs ${roadmapItem.source === 'github' ? 'font-mono' : ''}">${sourceLabel}</span>
            </div>
          </td>
          <td class="font-medium">${this.escapeHtml(roadmapItem.title)}</td>
          <td>
            <span class="px-2 py-0.5 rounded text-[10px] ${statusBadgeClass}">${roadmapItem.status}</span>
          </td>
          <td class="text-slate-500">${this.escapeHtml(roadmapItem.assignee)}</td>
          <td class="text-slate-500">${this.formatDate(roadmapItem.date)}</td>
        </tr>
      `;
    }).join('');

    // すべての件数を表示するボタン（10件以上の場合のみ表示、かつまだすべて表示していない場合）
    if (this.allRoadmapData.length > MAX_PREVIEW_ITEMS && !this.showAllItems) {
      const totalCount = this.allRoadmapData.length;
      tbody.innerHTML += `
        <tr>
          <td colspan="5" class="data-table-empty">
            <button id="show-all-items-btn" class="text-xs font-bold text-slate-500 hover:text-primary uppercase tracking-widest">
              すべての ${totalCount} 件を表示
            </button>
          </td>
        </tr>
      `;
      
      // ボタンにイベントリスナーを追加
      const showAllBtn = document.getElementById('show-all-items-btn');
      if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
          this.showAllItems = true;
          this.updatePreview();
        });
      }
    }
  }

  getStatusClass(status) {
    const statusUpper = status?.toUpperCase() || '';
    if (statusUpper.includes('MERGED') || statusUpper.includes('COMPLETED')) {
      return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
    }
    if (statusUpper.includes('PROGRESS')) {
      return 'bg-primary/10 text-primary border border-primary/20';
    }
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateGitHubStatus() {
    const statusEl = document.getElementById('githubStatus');
    if (this.githubPRFile || this.githubIssueFile || this.githubCommitData.length > 0) {
      statusEl.textContent = '接続済み';
      statusEl.className = 'status-badge status-badge-connected';
    } else {
      statusEl.textContent = '未接続';
      statusEl.className = 'status-badge status-badge-disconnected';
    }
  }

  /**
   * リポジトリURLからowner/repoを抽出
   */
  parseRepositoryUrl(url) {
    if (!url) {
      throw new Error('リポジトリURLが入力されていません');
    }

    // https://github.com/owner/repo 形式を想定
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (!match) {
      throw new Error('無効なリポジトリURL形式です。例: https://github.com/owner/repo');
    }

    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  /**
   * GitHub APIへの接続テストとコミット情報の取得
   */
  async testGitHubConnection() {
    const repoUrlInput = document.getElementById('github-repo-url');
    const tokenInput = document.getElementById('github-token');
    const testBtn = document.getElementById('test-connection-btn');

    if (!repoUrlInput || !tokenInput || !testBtn) {
      console.error('必要な要素が見つかりません');
      return;
    }

    const repoUrl = repoUrlInput.value.trim();
    const token = tokenInput.value.trim();

    if (!repoUrl) {
      alert('リポジトリURLを入力してください');
      return;
    }

    // ボタンを無効化してローディング状態に
    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.textContent = '接続中...';

    try {
      // リポジトリ情報を抽出
      const { owner, repo } = this.parseRepositoryUrl(repoUrl);
      this.githubRepoUrl = repoUrl;
      this.githubToken = token;

      // GitHub APIでリポジトリ情報を取得して接続テスト
      const repoInfo = await this.fetchGitHubRepository(owner, repo, token);
      
      if (!repoInfo) {
        throw new Error('リポジトリ情報の取得に失敗しました');
      }

      // コミット情報を取得
      const commits = await this.fetchGitHubCommits(owner, repo, token);
      
      if (commits && commits.length > 0) {
        // コミットデータをロードマップ形式に変換
        this.githubCommitData = FileParser.parseGitHubCommits(commits);
        
        // プレビューを更新
        this.updatePreview();
        this.updateGitHubStatus();
        
        alert(`接続成功！\nリポジトリ: ${repoInfo.full_name}\nコミット数: ${commits.length}件`);
      } else {
        alert('接続成功しましたが、コミットが見つかりませんでした');
      }
    } catch (error) {
      console.error('GitHub接続エラー:', error);
      alert(`接続に失敗しました: ${error.message}`);
    } finally {
      // ボタンを元に戻す
      testBtn.disabled = false;
      testBtn.textContent = originalText;
    }
  }

  /**
   * GitHub APIからリポジトリ情報を取得（接続テスト用）
   */
  async fetchGitHubRepository(owner, repo, token) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('リポジトリが見つかりません');
      } else if (response.status === 401) {
        throw new Error('認証に失敗しました。トークンを確認してください');
      } else if (response.status === 403) {
        throw new Error('アクセスが拒否されました。トークンの権限を確認してください');
      }
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * GitHub APIからコミット情報を取得
   */
  async fetchGitHubCommits(owner, repo, token, perPage = 100) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('リポジトリが見つかりません');
      } else if (response.status === 401) {
        throw new Error('認証に失敗しました。トークンを確認してください');
      } else if (response.status === 403) {
        throw new Error('アクセスが拒否されました。トークンの権限を確認してください');
      }
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  saveAll() {
    // データを保存
    const roadmapData = {
      items: this.allRoadmapData,
      lastUpdated: new Date().toISOString()
    };
    
    StorageManager.set(CONFIG.STORAGE_KEYS.ROADMAP_DATA, roadmapData);
    StorageManager.saveColumnMapping(this.columnMapping);
    
    if (this.githubPRFile || this.githubIssueFile) {
      StorageManager.saveGitHubFiles(this.githubPRFile, this.githubIssueFile);
    }

    // API接続情報を保存（トークンは保存しない）
    if (this.githubRepoUrl) {
      StorageManager.set(CONFIG.STORAGE_KEYS.GITHUB_FILES, {
        ...StorageManager.get(CONFIG.STORAGE_KEYS.GITHUB_FILES, {}),
        apiConnection: {
          repoUrl: this.githubRepoUrl,
          lastSync: new Date().toISOString(),
          commitCount: this.githubCommitData.length
        }
      });
    }

    alert('設定を保存しました！');
  }

  loadSavedData() {
    // 保存されたデータを読み込み
    const savedData = StorageManager.get(CONFIG.STORAGE_KEYS.ROADMAP_DATA);
    if (savedData?.items) {
      this.allRoadmapData = savedData.items;
      this.updatePreview();
    }
  }

  reset() {
    if (confirm('すべてのデータを削除しますか？')) {
      localStorage.clear();
      location.reload();
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new IntegrationsManager();
});
