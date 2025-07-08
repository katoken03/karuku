import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { InstallationResult, InstallationProgress } from '../types/index';

const execAsync = promisify(exec);

export class DependencyInstaller {
  private progressCallback?: (progress: InstallationProgress) => void;

  constructor(progressCallback?: (progress: InstallationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async installPngquant(): Promise<InstallationResult> {
    try {
      console.log('Starting pngquant installation...');
      
      // 1. 環境チェック
      this.reportProgress('checking', 'Checking system environment...');
      const hasHomebrew = await this.checkHomebrew();
      if (!hasHomebrew) {
        console.log('Homebrew not found');
        return {
          success: false,
          message: 'Homebrew is not installed',
          details: 'Please install Homebrew first by visiting https://brew.sh'
        };
      }
      console.log('Homebrew found');

      // 2. 既にインストールされているかチェック
      this.reportProgress('checking', 'Checking if pngquant is already installed...');
      const alreadyInstalled = await this.checkPngquantInstalled();
      if (alreadyInstalled) {
        console.log('pngquant already installed');
        return {
          success: true,
          message: 'pngquant is already installed!'
        };
      }
      console.log('pngquant not found, proceeding with installation');

      // 3. Homebrewの更新（オプション）
      this.reportProgress('updating', 'Updating Homebrew...');
      await this.updateHomebrew();
      console.log('Homebrew update completed');

      // 4. pngquantのインストール
      this.reportProgress('installing', 'Installing pngquant...');
      console.log('Executing pngquant installation...');
      await this.executeInstallation();
      console.log('Installation command completed');

      // 5. インストール確認
      this.reportProgress('verifying', 'Verifying installation...');
      console.log('Starting installation verification...');
      const isInstalled = await this.verifyInstallation();
      if (!isInstalled) {
        console.error('Installation verification failed');
        // 検証失敗の場合、再度チェックしてみる
        console.log('Retrying verification after additional delay...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const secondCheck = await this.checkPngquantInstalled();
        if (!secondCheck) {
          throw new Error('Installation verification failed - pngquant not found after installation');
        } else {
          console.log('Second verification check passed');
        }
      }
      console.log('Installation verified successfully');

      this.reportProgress('completed', 'Installation completed successfully!');
      return {
        success: true,
        message: 'pngquant has been successfully installed!'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Installation failed:', errorMessage);
      this.reportProgress('error', `Installation failed: ${errorMessage}`);
      return {
        success: false,
        message: 'Installation failed',
        details: errorMessage
      };
    }
  }

  private async checkHomebrew(): Promise<boolean> {
    try {
      // 複数のHomebrewのインストール場所をチェック
      const brewPaths = [
        '/opt/homebrew/bin/brew', // Apple Silicon Mac
        '/usr/local/bin/brew',    // Intel Mac
        'brew'                    // PATHにある場合
      ];
      
      for (const brewPath of brewPaths) {
        try {
          const { stdout } = await execAsync(`"${brewPath}" --version`);
          console.log(`Homebrew found at: ${brewPath}`);
          console.log(`Version: ${stdout.trim()}`);
          return true;
        } catch (error) {
          console.log(`Homebrew not found at: ${brewPath}`);
          continue;
        }
      }
      
      console.log('Homebrew not found in any standard location');
      return false;
    } catch (error) {
      console.log('Error checking Homebrew:', error);
      return false;
    }
  }

  private async checkPngquantInstalled(): Promise<boolean> {
    try {
      // 複数のpngquantのインストール場所をチェック
      const pngquantPaths = [
        '/opt/homebrew/bin/pngquant', // Apple Silicon Mac
        '/usr/local/bin/pngquant',    // Intel Mac
        'pngquant'                    // PATHにある場合
      ];
      
      for (const pngquantPath of pngquantPaths) {
        try {
          const { stdout } = await execAsync(`"${pngquantPath}" --version`);
          console.log(`pngquant found at: ${pngquantPath}`);
          console.log(`Version: ${stdout.trim()}`);
          return true;
        } catch (error) {
          console.log(`pngquant not found at: ${pngquantPath}`);
          continue;
        }
      }
      
      console.log('pngquant not found in any standard location');
      return false;
    } catch (error) {
      console.log('Error checking pngquant:', error);
      return false;
    }
  }

  private async updateHomebrew(): Promise<void> {
    try {
      // Homebrewの更新は時間がかかる場合があるので、短時間でスキップ
      await execAsync('brew update', { timeout: 30000 });
    } catch (error) {
      console.warn('Homebrew update failed, continuing with installation...', error);
      // 更新に失敗してもインストールを続行
    }
  }

  private async executeInstallation(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Spawning brew install pngquant process...');
      
      // macOSのセキュリティ問題を回避するために、シェルを経由して実行
      const homebrewPath = '/opt/homebrew/bin:/usr/local/bin';
      const systemPath = process.env.PATH || '';
      const fullPath = `${homebrewPath}:${systemPath}`;
      
      // シェルスクリプトとして実行
      const installCommand = 'export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && brew install pngquant';
      
      const installProcess = spawn('bash', ['-c', installCommand], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PATH: fullPath,
          HOMEBREW_NO_AUTO_UPDATE: '1', // Homebrewの自動更新を無効化
          HOMEBREW_NO_INSTALL_CLEANUP: '1' // インストール後のクリーンアップを無効化
        },
        cwd: os.homedir() // ホームディレクトリで実行
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      installProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`brew stdout: ${output.trim()}`);
        this.reportProgress('installing', 'Installing pngquant...');
      });

      installProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.warn(`brew stderr: ${output.trim()}`);
      });

      installProcess.on('close', (code) => {
        if (isResolved) return;
        isResolved = true;
        
        console.log(`brew install process closed with code: ${code}`);
        console.log(`stdout: ${stdout.trim()}`);
        if (stderr) console.log(`stderr: ${stderr.trim()}`);
        
        // brew installは、既にインストール済みの場合でも成功コードで終了する
        // また、アップグレードの場合も成功とみなす
        const isAlreadyInstalled = stdout.includes('already installed') || 
                                  stdout.includes('is already installed') ||
                                  stderr.includes('already installed') ||
                                  stderr.includes('is already installed');
        
        if (code === 0 || isAlreadyInstalled) {
          console.log('Installation command completed successfully');
          if (isAlreadyInstalled) {
            console.log('pngquant was already installed');
          }
          resolve();
        } else {
          const errorMessage = `Installation failed with exit code ${code}`;
          const details = stderr || stdout || 'No additional details available';
          console.error(errorMessage, '\nDetails:', details);
          reject(new Error(`${errorMessage}\n${details}`));
        }
      });

      installProcess.on('error', (error) => {
        if (isResolved) return;
        isResolved = true;
        
        console.error('Installation process error:', error);
        reject(new Error(`Failed to spawn brew process: ${error.message}`));
      });

      // タイムアウト設定（5分）
      const timeout = setTimeout(() => {
        if (isResolved) return;
        isResolved = true;
        
        console.error('Installation timed out, killing process');
        installProcess.kill('SIGTERM');
        reject(new Error('Installation timed out after 5 minutes'));
      }, 300000);
      
      // プロセス終了時にタイムアウトをクリア
      installProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  private async verifyInstallation(): Promise<boolean> {
    try {
      console.log('Verifying pngquant installation...');
      
      // インストール後少し待ってからチェック（ファイルシステムの更新を待つ）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 複数のpngquantのインストール場所をチェック
      const pngquantPaths = [
        '/opt/homebrew/bin/pngquant', // Apple Silicon Mac
        '/usr/local/bin/pngquant',    // Intel Mac
        'pngquant'                    // PATHにある場合
      ];
      
      for (const pngquantPath of pngquantPaths) {
        try {
          const { stdout } = await execAsync(`"${pngquantPath}" --version`, {
            env: {
              ...process.env,
              PATH: '/opt/homebrew/bin:/usr/local/bin:' + (process.env.PATH || '')
            }
          });
          console.log(`Verification successful: pngquant found at ${pngquantPath}`);
          console.log(`Version: ${stdout.trim()}`);
          return true;
        } catch (error) {
          console.log(`Verification check: pngquant not found at ${pngquantPath}`);
          continue;
        }
      }
      
      // 最後の手段として、シェルコマンドでwhichを実行
      try {
        const { stdout } = await execAsync('export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" && which pngquant', {
          shell: '/bin/bash'
        });
        console.log(`Verification successful: pngquant found via which at ${stdout.trim()}`);
        return true;
      } catch (error) {
        console.log('Verification check: pngquant not found via which command');
      }
      
      console.error('Verification failed: pngquant not found in any location');
      return false;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  private reportProgress(stage: InstallationProgress['stage'], message: string, progress?: number): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, message, progress });
    }
  }

  // Homebrewの自動インストール（参考用、実際の実装では使用しない）
  async installHomebrew(): Promise<InstallationResult> {
    // Homebrewのインストールは管理者権限が必要で複雑なため、
    // 実際の実装では手動インストールを案内する
    return {
      success: false,
      message: 'Homebrew automatic installation is not supported',
      details: 'Please install Homebrew manually by visiting https://brew.sh'
    };
  }

  // 手動インストール手順を取得
  getManualInstallationSteps(): string[] {
    return [
      '1. Install Homebrew if not already installed:',
      '   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
      '',
      '2. Install pngquant using Homebrew:',
      '   brew install pngquant',
      '',
      '3. Verify installation:',
      '   pngquant --version',
      '',
      '4. Restart this application'
    ];
  }
}
