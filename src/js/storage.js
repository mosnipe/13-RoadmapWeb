// ローカルストレージ管理ユーティリティ
import { CONFIG } from './config.js';

export class StorageManager {
  /**
   * データを保存
   */
  static set(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  }

  /**
   * データを取得
   */
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * データを削除
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  /**
   * ファイルをBase64で保存
   */
  static async saveFile(key, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result, // Base64
          lastModified: file.lastModified
        };
        if (this.set(key, fileData)) {
          resolve(fileData);
        } else {
          reject(new Error('Failed to save file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * GitHubファイル設定を保存
   */
  static saveGitHubFiles(prFile, issueFile) {
    const data = {
      prs: prFile ? {
        name: prFile.name,
        lastLoaded: new Date().toISOString()
      } : null,
      issues: issueFile ? {
        name: issueFile.name,
        lastLoaded: new Date().toISOString()
      } : null
    };
    return this.set(CONFIG.STORAGE_KEYS.GITHUB_FILES, data);
  }

  /**
   * カラムマッピングを保存
   */
  static saveColumnMapping(mapping) {
    return this.set(CONFIG.STORAGE_KEYS.COLUMN_MAPPING, mapping);
  }

  /**
   * カラムマッピングを取得
   */
  static getColumnMapping() {
    return this.get(CONFIG.STORAGE_KEYS.COLUMN_MAPPING, CONFIG.DEFAULT_COLUMN_MAPPING);
  }
}
