// TAIO Time App — Per-Tab Error Boundary & Auto-Recovery (PRD v0.3.39 Part A2.1)
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logAppError, formatErrorsForClipboard } from '../core/errorLogger';
import { AlertTriangle, Copy, RotateCw, Check } from 'lucide-react';

interface Props {
  tabName: string;
  children: ReactNode;
  language?: 'vi' | 'en';
}

interface State {
  hasError: boolean;
  recovering: boolean;
  retryCount: number;
  lastError: Error | null;
  copied: boolean;
}

const RETRY_DELAYS = [500, 1500, 3000]; // 0.5s, 1.5s, 3s
const STABLE_RESET_MS = 60000; // 60s stable running resets retry count

export class TabErrorBoundary extends Component<Props, State> {
  private stableTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      recovering: false,
      retryCount: 0,
      lastError: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, lastError: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.stableTimer) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }

    // Flush any pending storage writes immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('beforeunload'));
    }

    logAppError({
      tab: this.props.tabName,
      message: error.message || 'React Render Crash',
      stack: error.stack || errorInfo.componentStack || '',
    });

    const { retryCount } = this.state;
    if (retryCount < 3) {
      const delay = RETRY_DELAYS[retryCount] || 1500;
      this.setState({ recovering: true });

      this.retryTimer = setTimeout(() => {
        this.setState(
          prevState => ({
            hasError: false,
            recovering: false,
            retryCount: prevState.retryCount + 1,
            lastError: null,
          }),
          () => {
            // If running stably for 60 seconds, reset retry counter
            this.stableTimer = setTimeout(() => {
              this.setState({ retryCount: 0 });
            }, STABLE_RESET_MS);
          }
        );
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.stableTimer) clearTimeout(this.stableTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  handleCopyDetails = async () => {
    try {
      const text = formatErrorsForClipboard();
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      alert('Không thể sao chép vào bộ nhớ tạm.');
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, recovering, retryCount, copied } = this.state;
    const { children, language = 'vi' } = this.props;

    const isEn = language === 'en';

    // 1. Recovering state: show soft non-blocking banner at top of tab
    if (recovering) {
      return (
        <div className="relative w-full">
          <div className="w-full bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-900 shadow-2xs mb-3 animate-pulse">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>{isEn ? `Recovering… (Attempt ${retryCount + 1}/3)` : `Đang khôi phục… (Lần thử ${retryCount + 1}/3)`}</span>
            </div>
          </div>
          {children}
        </div>
      );
    }

    // 2. Fatal error after 3 failed retries: show centered modal
    if (hasError && retryCount >= 3) {
      return (
        <div className="min-h-[380px] w-full flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isEn ? 'Screen could not load' : 'Không thể mở màn hình này'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isEn
                  ? 'Something went wrong and this screen could not open. Please report it with the error details.'
                  : 'Có lỗi khiến màn hình này không mở được. Hãy báo lại cho TAIO kèm chi tiết lỗi.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleCopyDetails}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? 'Copied!' : 'Đã sao chép!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isEn ? 'Copy error details' : 'Sao chép chi tiết lỗi'}</span>
                  </>
                )}
              </button>

              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E0401F] hover:bg-[#c93517] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCw className="w-4 h-4" />
                <span>{isEn ? 'Reload' : 'Tải lại'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
