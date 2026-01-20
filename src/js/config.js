// アプリケーション設定
export const CONFIG = {
  // ストレージキー
  STORAGE_KEYS: {
    GITHUB_FILES: 'github_export_files',
    CSV_FILE: 'csv_roadmap_file',
    COLUMN_MAPPING: 'column_mapping',
    SETTINGS: 'app_settings',
    ROADMAP_DATA: 'roadmap_data'
  },
  
  // ファイルサイズ制限（MB）
  MAX_FILE_SIZE: 10,
  
  // 対応ファイル形式
  SUPPORTED_FORMATS: {
    GITHUB: ['.json'],
    CSV: ['.csv', '.xlsx', '.xls'],
    EXCEL: ['.xlsx', '.xls']
  },
  
  // デフォルトのカラムマッピング
  DEFAULT_COLUMN_MAPPING: {
    title: 'Title',
    status: 'Status',
    assignee: 'Assignee',
    date: 'Date'
  }
};
