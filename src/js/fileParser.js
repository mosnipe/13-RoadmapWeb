// ファイル解析ユーティリティ
// PapaParseとXLSXはグローバルに読み込まれることを想定

export class FileParser {
  /**
   * CSVファイルを解析
   */
  static async parseCSV(file) {
    if (typeof Papa === 'undefined') {
      throw new Error('PapaParseライブラリが読み込まれていません');
    }
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Excelファイルを解析
   */
  static async parseExcel(file) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJSライブラリが読み込まれていません');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 最初のシートを取得
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // JSON形式に変換
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * JSONファイルを解析
   */
  static async parseJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * ファイル形式を判定して解析
   */
  static async parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'json') {
      return await this.parseJSON(file);
    } else if (extension === 'csv') {
      return await this.parseCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      return await this.parseExcel(file);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * CSV/Excelファイルのカラム一覧を取得
   */
  static async getColumns(file) {
    const data = await this.parseFile(file);
    if (data.length === 0) {
      return [];
    }
    return Object.keys(data[0]);
  }

  /**
   * GitHub JSONファイルを解析して内部形式に変換
   */
  static parseGitHubPR(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    return data.map(item => {
      // GitHub CLI形式またはGitHub API形式の両方に対応
      const isCLIFormat = 'createdAt' in item;
      const isAPIFormat = 'created_at' in item;
      
      return {
        id: `gh-pr-${item.number}`,
        source: 'github',
        sourceId: `GH-${item.number}`,
        title: item.title || '',
        status: this.mapGitHubState(item.state, item.merged || item.mergedAt),
        assignee: item.author?.login || item.user?.login || '',
        date: isCLIFormat ? item.mergedAt || item.createdAt : 
              isAPIFormat ? (item.merged_at || item.created_at) : 
              new Date().toISOString(),
        category: 'Pull Request',
        description: item.body || '',
        url: item.url || item.html_url || ''
      };
    });
  }

  /**
   * GitHub Issue JSONファイルを解析
   */
  static parseGitHubIssue(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    return data.map(item => {
      const isCLIFormat = 'createdAt' in item;
      const isAPIFormat = 'created_at' in item;
      
      const assignees = item.assignees || [];
      const assignee = assignees.length > 0 
        ? assignees[0].login 
        : (item.assignee?.login || '');
      
      return {
        id: `gh-issue-${item.number}`,
        source: 'github',
        sourceId: `GH-${item.number}`,
        title: item.title || '',
        status: this.mapGitHubState(item.state, false),
        assignee: assignee,
        date: isCLIFormat ? (item.closedAt || item.createdAt) :
              isAPIFormat ? (item.closed_at || item.created_at) :
              new Date().toISOString(),
        category: 'Issue',
        description: item.body || '',
        url: item.url || item.html_url || ''
      };
    });
  }

  /**
   * GitHubのstateを内部ステータスにマッピング
   */
  static mapGitHubState(state, merged) {
    if (merged || state === 'MERGED') {
      return 'Merged';
    }
    const stateUpper = state?.toUpperCase();
    if (stateUpper === 'OPEN') {
      return 'Open';
    }
    if (stateUpper === 'CLOSED') {
      return 'Closed';
    }
    return 'Open';
  }

  /**
   * CSV/Excelデータを内部形式に変換
   */
  static mapCSVData(data, columnMapping) {
    return data.map((row, index) => {
      const title = row[columnMapping.title] || '';
      const status = row[columnMapping.status] || 'Backlog';
      const assignee = row[columnMapping.assignee] || '';
      const dateStr = row[columnMapping.date] || '';
      
      // 日付のパース
      let date = new Date().toISOString();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString();
        }
      }
      
      return {
        id: `csv-${index}`,
        source: 'csv',
        sourceId: `CSV-${index + 1}`,
        title: title,
        status: this.normalizeStatus(status),
        assignee: assignee,
        date: date,
        category: 'Roadmap',
        description: ''
      };
    });
  }

  /**
   * ステータスを正規化
   */
  static normalizeStatus(status) {
    const statusUpper = status?.toString().toUpperCase() || '';
    if (statusUpper.includes('PROGRESS') || statusUpper.includes('進行中')) {
      return 'In Progress';
    }
    if (statusUpper.includes('BACKLOG') || statusUpper.includes('バックログ')) {
      return 'Backlog';
    }
    if (statusUpper.includes('COMPLETED') || statusUpper.includes('完了')) {
      return 'Completed';
    }
    if (statusUpper.includes('MERGED') || statusUpper.includes('マージ')) {
      return 'Merged';
    }
    return status;
  }
}
